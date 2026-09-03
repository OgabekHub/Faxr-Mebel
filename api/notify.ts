import type { VercelRequest, VercelResponse } from '@vercel/node';
import { handleNotify } from './_lib/notify';

// POST /api/notify — forwards validated site events to the Telegram ops chat.
// The bot token lives only in the server environment (TELEGRAM_BOT_TOKEN).
export default async function handler(req: VercelRequest, res: VercelResponse): Promise<void> {
  if (req.method !== 'POST') {
    res.setHeader('allow', 'POST');
    res.status(405).json({ ok: false, error: 'method_not_allowed' });
    return;
  }

  const result = await handleNotify(req.body, {
    origin: typeof req.headers.origin === 'string' ? req.headers.origin : undefined,
    env: {
      TELEGRAM_BOT_TOKEN: process.env.TELEGRAM_BOT_TOKEN,
      TELEGRAM_CHAT_ID: process.env.TELEGRAM_CHAT_ID,
      ALLOWED_ORIGINS: process.env.ALLOWED_ORIGINS,
    },
  });

  res.status(result.status).json(result.body);
}
