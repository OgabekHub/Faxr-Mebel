import type { IncomingMessage, ServerResponse } from 'node:http';
import type { Plugin } from 'vite';
import { handleNotify } from '../api/_lib/notify';

const MAX_BODY_BYTES = 16_000;

function readBody(req: IncomingMessage, limit: number): Promise<string> {
  return new Promise((resolve, reject) => {
    const chunks: Buffer[] = [];
    let size = 0;
    let tooLarge = false;
    req.on('data', (chunk: Buffer) => {
      if (tooLarge) return; // keep draining so a proper 413 can still be written
      size += chunk.length;
      if (size > limit) {
        tooLarge = true;
        chunks.length = 0;
        return;
      }
      chunks.push(chunk);
    });
    req.on('end', () => {
      if (tooLarge) reject(new Error('payload_too_large'));
      else resolve(Buffer.concat(chunks).toString('utf8'));
    });
    req.on('error', reject);
  });
}

/**
 * Serves /api/notify inside `vite` dev so the checkout, contact and bespoke
 * forms work locally exactly like the Vercel function in production.
 */
export function notifyDevPlugin(env: Record<string, string>): Plugin {
  return {
    name: 'faxr-notify-dev',
    configureServer(server) {
      server.middlewares.use('/api/notify', async (req: IncomingMessage, res: ServerResponse) => {
        const send = (status: number, body: unknown) => {
          res.statusCode = status;
          res.setHeader('content-type', 'application/json');
          res.end(JSON.stringify(body));
        };

        if (req.method !== 'POST') {
          res.setHeader('allow', 'POST');
          send(405, { ok: false, error: 'method_not_allowed' });
          return;
        }

        let raw: string;
        try {
          raw = await readBody(req, MAX_BODY_BYTES);
        } catch (error) {
          const tooLarge = error instanceof Error && error.message === 'payload_too_large';
          send(tooLarge ? 413 : 400, { ok: false, error: tooLarge ? 'payload_too_large' : 'bad_request' });
          return;
        }

        const result = await handleNotify(raw, {
          origin: typeof req.headers.origin === 'string' ? req.headers.origin : undefined,
          env: {
            TELEGRAM_BOT_TOKEN: env.TELEGRAM_BOT_TOKEN,
            TELEGRAM_CHAT_ID: env.TELEGRAM_CHAT_ID,
            ALLOWED_ORIGINS: env.ALLOWED_ORIGINS,
          },
        });
        send(result.status, result.body);
      });
    },
  };
}
