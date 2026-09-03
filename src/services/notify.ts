import type { NotifyInput } from '../../api/_lib/notify';

export type { NotifyInput, NotifyKind, NotifyPayload } from '../../api/_lib/notify';

export interface NotifyResponse {
  ok: boolean;
  error?: string;
}

/**
 * Sends a site event (order, contact message, appointment, bespoke inquiry,
 * newsletter signup) to the Telegram ops chat through the server-side
 * /api/notify function. The bot token never reaches the browser.
 *
 * Never throws: callers decide how to surface `ok: false`.
 */
export async function postNotify(input: NotifyInput): Promise<NotifyResponse> {
  try {
    const response = await fetch('/api/notify', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify(input),
    });
    const data = (await response.json().catch(() => null)) as NotifyResponse | null;
    if (!response.ok || !data) {
      return { ok: false, error: data?.error ?? `http_${response.status}` };
    }
    return data;
  } catch {
    return { ok: false, error: 'network' };
  }
}
