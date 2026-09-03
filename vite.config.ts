import tailwindcss from '@tailwindcss/vite';
import react from '@vitejs/plugin-react';
import { defineConfig, loadEnv } from 'vite';
import { notifyDevPlugin } from './vite-plugins/notifyDev';

export default defineConfig(({ mode }) => {
  // The empty prefix loads every variable (not only VITE_*) so the dev-only
  // /api/notify middleware can read the server-side Telegram credentials.
  // Vite still exposes only VITE_* keys to the browser bundle.
  const env = loadEnv(mode, process.cwd(), '');
  return {
    plugins: [react(), tailwindcss(), notifyDevPlugin(env)],
  };
});
