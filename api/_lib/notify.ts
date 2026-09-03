import { z } from 'zod';

/* ------------------------------------------------------------------ */
/* Schemas: everything the browser is allowed to send to /api/notify   */
/* ------------------------------------------------------------------ */

const text = (max: number) => z.string().trim().max(max);
const requiredText = (max: number) => z.string().trim().min(1).max(max);
const phone = requiredText(30);
const money = z.number().min(0).max(1_000_000_000_000);

const bespokeDetailsSchema = z
  .object({ wood: text(80), fabric: text(80) })
  .nullable()
  .optional();

const orderItemSchema = z.object({
  name: requiredText(160),
  quantity: z.number().int().min(1).max(99),
  price: money,
  bespokeDetails: bespokeDetailsSchema,
});

const orderPayloadSchema = z.object({
  orderNumber: requiredText(40),
  client: requiredText(100),
  phone,
  address: text(500),
  wishes: text(1000),
  items: z.array(orderItemSchema).min(1).max(50),
  addons: z.object({ premiumBox: z.boolean(), artisanCert: z.boolean() }),
  total: money,
  paymentMethod: z.enum(['click_payme', 'consultation']),
  paymentStatus: z.enum(['paid', 'pending']),
});

const contactPayloadSchema = z.object({
  name: requiredText(100),
  phone,
  message: requiredText(2000),
});

const appointmentPayloadSchema = z.object({
  name: requiredText(100),
  phone,
  date: requiredText(20),
  time: requiredText(10),
});

const bespokePayloadSchema = z.object({
  orderId: requiredText(40),
  productName: requiredText(160),
  length: z.number().int().min(10).max(2000),
  width: z.number().int().min(10).max(2000),
  wood: requiredText(40),
  fabric: requiredText(40),
  delivery: z.enum(['luxe', 'standard']),
  name: requiredText(100),
  phone,
  estimatedPrice: money,
});

const newsletterPayloadSchema = z.object({
  email: z.email().max(200),
});

/** Honeypot field: real users never fill it; bots that do get a silent "ok". */
const honeypot = z.string().max(200).optional();

export const notifySchema = z.discriminatedUnion('kind', [
  z.object({ kind: z.literal('order'), website: honeypot, payload: orderPayloadSchema }),
  z.object({ kind: z.literal('contact'), website: honeypot, payload: contactPayloadSchema }),
  z.object({ kind: z.literal('appointment'), website: honeypot, payload: appointmentPayloadSchema }),
  z.object({ kind: z.literal('bespoke'), website: honeypot, payload: bespokePayloadSchema }),
  z.object({ kind: z.literal('newsletter'), website: honeypot, payload: newsletterPayloadSchema }),
]);

export type NotifyInput = z.infer<typeof notifySchema>;
export type NotifyKind = NotifyInput['kind'];
export type NotifyPayload<K extends NotifyKind> = Extract<NotifyInput, { kind: K }>['payload'];

/* ------------------------------------------------------------------ */
/* Helpers                                                             */
/* ------------------------------------------------------------------ */

const MAX_BODY_BYTES = 16_000;
const TELEGRAM_TEXT_LIMIT = 4096;

const HTML_ESCAPES: Record<string, string> = {
  '&': '&amp;',
  '<': '&lt;',
  '>': '&gt;',
  '"': '&quot;',
};

/** Escapes user-provided text so it cannot inject Telegram HTML markup. */
export const escapeHtml = (value: string): string =>
  value.replace(/[&<>"]/g, (char) => HTML_ESCAPES[char] ?? char);

const formatPrice = (price: number): string =>
  new Intl.NumberFormat('uz-UZ', {
    style: 'currency',
    currency: 'UZS',
    minimumFractionDigits: 0,
  }).format(price);

const nowInTashkent = (): string =>
  new Date().toLocaleString('uz-UZ', { timeZone: 'Asia/Tashkent' });

const e = escapeHtml;

/* ------------------------------------------------------------------ */
/* Message templates (internal ops chat, Uzbek)                        */
/* ------------------------------------------------------------------ */

export function buildMessage(input: NotifyInput): string {
  const date = nowInTashkent();

  switch (input.kind) {
    case 'order': {
      const p = input.payload;
      const items = p.items
        .map((item) => {
          const line = `- <b>${e(item.name)}</b> (x${item.quantity}): ${formatPrice(item.price * item.quantity)}`;
          const custom = item.bespokeDetails
            ? `\n   ↳ 🪵 <i>Yog'och: ${e(item.bespokeDetails.wood)}</i> | 🧵 <i>Mato: ${e(item.bespokeDetails.fabric)}</i>`
            : '';
          return line + custom;
        })
        .join('\n');
      const addons =
        [
          p.addons.premiumBox ? "🎁 Hashamatli Yog'och Qadoqlash (+500,000 UZS)" : '',
          p.addons.artisanCert ? '📜 Ustaxonaning Asillik Sertifikati (+150,000 UZS)' : '',
        ]
          .filter(Boolean)
          .join('\n') || "Yo'q";
      const payment =
        p.paymentMethod === 'click_payme'
          ? p.paymentStatus === 'paid'
            ? "💳 Click / Payme (Online - TO'LANDI)"
            : '💳 Click / Payme (Online - kutilmoqda)'
          : "📞 Konsultatsiyadan so'ng (Kutilmoqda)";

      return [
        '🌟 <b>YANGI PRESTIGE BUYURTMA</b> 🌟',
        '',
        `🆔 <b>Buyurtma ID:</b> <code>${e(p.orderNumber)}</code>`,
        `👤 <b>Mijoz:</b> ${e(p.client)}`,
        `📱 <b>Telefon:</b> ${e(p.phone)}`,
        `📍 <b>Manzil:</b> ${e(p.address)}`,
        `✍️ <b>Qo'shimcha istaklar:</b> ${e(p.wishes) || "Yo'q"}`,
        `💳 <b>To'lov turi:</b> ${payment}`,
        '',
        '🛒 <b>Buyurtma tarkibi:</b>',
        items,
        '',
        "➕ <b>Qo'shimcha xizmatlar:</b>",
        addons,
        '',
        `💰 <b>Umumiy summa:</b> <b>${formatPrice(p.total)}</b>`,
        `📅 <b>Sana:</b> ${date}`,
      ].join('\n');
    }

    case 'contact': {
      const p = input.payload;
      return [
        '📩 <b>YANGI MUROJAAT / NEW MESSAGE</b> 📩',
        '',
        `👤 <b>Ism / Name:</b> ${e(p.name)}`,
        `📱 <b>Telefon / Phone:</b> ${e(p.phone)}`,
        `💬 <b>Xabar / Message:</b> ${e(p.message)}`,
        `📅 <b>Sana / Date:</b> ${date}`,
      ].join('\n');
    }

    case 'appointment': {
      const p = input.payload;
      return [
        '🗓️ <b>YANGI SHOWROOM TASHRIFI / NEW APPOINTMENT</b> 🗓️',
        '',
        `👤 <b>Mijoz / Client:</b> ${e(p.name)}`,
        `📱 <b>Telefon / Phone:</b> ${e(p.phone)}`,
        `📅 <b>Tashrif kuni / Day:</b> ${e(p.date)}`,
        `⏰ <b>Tashrif vaqti / Time:</b> ${e(p.time)}`,
        `📅 <b>Sana / Date:</b> ${date}`,
      ].join('\n');
    }

    case 'bespoke': {
      const p = input.payload;
      return [
        '👑 <b>YANGI VIP CONCIERGE BUYURTMA</b> 👑',
        '',
        `🆔 <b>Buyurtma ID:</b> <code>${e(p.orderId)}</code>`,
        `🎨 <b>Mahsulot:</b> ${e(p.productName)}`,
        `📐 <b>O'lchamlari:</b> ${p.length}cm x ${p.width}cm`,
        `🪵 <b>Yog'och turi:</b> ${e(p.wood.toUpperCase())}`,
        `🧵 <b>Mato turi:</b> ${e(p.fabric.toUpperCase())}`,
        `🚚 <b>Yetkazish darajasi:</b> ${p.delivery === 'luxe' ? '🌟 LUXE CONCIERGE' : 'STANDARD'}`,
        '',
        `👤 <b>Mijoz:</b> ${e(p.name)}`,
        `📱 <b>Telefon:</b> ${e(p.phone)}`,
        '',
        `💰 <b>Taxminiy VIP narx:</b> <b>${formatPrice(p.estimatedPrice)}</b>`,
        `📅 <b>Sana:</b> ${date}`,
      ].join('\n');
    }

    case 'newsletter': {
      const p = input.payload;
      return [
        '📰 <b>YANGI OBUNA / NEWSLETTER</b>',
        '',
        `📧 <b>Email:</b> ${e(p.email)}`,
        `📅 <b>Sana:</b> ${date}`,
      ].join('\n');
    }
  }
}

/** Telegram rejects texts over 4096 chars; fall back to plain text rather than cut a tag in half. */
function prepareText(text: string): { text: string; parse_mode?: 'HTML' } {
  if (text.length <= TELEGRAM_TEXT_LIMIT) return { text, parse_mode: 'HTML' };
  const plain = text.replace(/<[^>]+>/g, '');
  return { text: plain.slice(0, TELEGRAM_TEXT_LIMIT - 1) + '…' };
}

/* ------------------------------------------------------------------ */
/* Handler (shared by the Vercel function and the Vite dev middleware) */
/* ------------------------------------------------------------------ */

export interface NotifyEnv {
  TELEGRAM_BOT_TOKEN?: string;
  TELEGRAM_CHAT_ID?: string;
  ALLOWED_ORIGINS?: string;
}

export interface NotifyContext {
  origin?: string;
  env: NotifyEnv;
  /** Injectable for tests. */
  fetchImpl?: typeof fetch;
}

export interface NotifyResult {
  status: number;
  body: { ok: boolean; error?: string };
}

const fail = (status: number, error: string): NotifyResult => ({ status, body: { ok: false, error } });

/**
 * Origin allowlist. When no list is configured, or the client sent no Origin
 * header (non-browser client), the request passes: this is a deterrent against
 * casual abuse from other sites, not an authentication mechanism.
 */
export function isOriginAllowed(origin: string | undefined, allowedList: string | undefined): boolean {
  const allowed = (allowedList ?? '')
    .split(',')
    .map((item) => item.trim())
    .filter(Boolean);
  if (allowed.length === 0 || !origin) return true;
  return allowed.includes(origin);
}

export async function handleNotify(rawBody: unknown, ctx: NotifyContext): Promise<NotifyResult> {
  if (!isOriginAllowed(ctx.origin, ctx.env.ALLOWED_ORIGINS)) return fail(403, 'origin_not_allowed');

  let body: unknown = rawBody;
  if (typeof rawBody === 'string') {
    if (rawBody.length > MAX_BODY_BYTES) return fail(413, 'payload_too_large');
    try {
      body = JSON.parse(rawBody);
    } catch {
      return fail(400, 'invalid_json');
    }
  } else if (JSON.stringify(rawBody ?? null).length > MAX_BODY_BYTES) {
    return fail(413, 'payload_too_large');
  }

  const parsed = notifySchema.safeParse(body);
  if (!parsed.success) return fail(400, 'invalid_payload');

  // Honeypot tripped: answer like a success so the bot learns nothing.
  if (parsed.data.website) return { status: 200, body: { ok: true } };

  const { TELEGRAM_BOT_TOKEN: token, TELEGRAM_CHAT_ID: chatId } = ctx.env;
  if (!token || !chatId) return fail(503, 'not_configured');

  const message = prepareText(buildMessage(parsed.data));
  const doFetch = ctx.fetchImpl ?? fetch;

  try {
    const response = await doFetch(`https://api.telegram.org/bot${token}/sendMessage`, {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({
        chat_id: chatId,
        ...message,
        disable_web_page_preview: true,
      }),
    });
    if (!response.ok) return fail(502, 'telegram_error');
    return { status: 200, body: { ok: true } };
  } catch {
    return fail(502, 'telegram_unreachable');
  }
}
