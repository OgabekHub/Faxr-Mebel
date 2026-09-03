/// <reference types="vite/client" />

interface ImportMetaEnv {
  /** Public site URL used for AR QR-code links. Falls back to the production URL when unset. */
  readonly VITE_APP_URL?: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
