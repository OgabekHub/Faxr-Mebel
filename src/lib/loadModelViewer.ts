/**
 * Loads the <model-viewer> web component on demand.
 *
 * One shared promise serves every caller (ARModal, ARView), the script is only
 * injected when something actually needs it, and a failed or timed-out load
 * rejects so the UI can show an error and offer a retry instead of spinning
 * forever.
 */
const SCRIPT_URL = 'https://ajax.googleapis.com/ajax/libs/model-viewer/3.5.0/model-viewer.min.js';
const TIMEOUT_MS = 15_000;

let pending: Promise<void> | null = null;

export function loadModelViewer(): Promise<void> {
  if (typeof customElements !== 'undefined' && customElements.get('model-viewer')) {
    return Promise.resolve();
  }
  if (pending) return pending;

  pending = new Promise<void>((resolve, reject) => {
    document.querySelector('script[data-model-viewer]')?.remove();

    const script = document.createElement('script');
    script.type = 'module';
    script.src = SCRIPT_URL;
    script.dataset.modelViewer = 'true';

    let timer: ReturnType<typeof setTimeout> | undefined;
    const finish = (error?: Error) => {
      clearTimeout(timer);
      script.onload = null;
      script.onerror = null;
      if (error) {
        script.remove();
        pending = null; // allow a retry
        reject(error);
      } else {
        resolve();
      }
    };

    timer = setTimeout(() => finish(new Error('model-viewer script timed out')), TIMEOUT_MS);
    script.onload = () => finish();
    script.onerror = () => finish(new Error('model-viewer script failed to load'));
    document.head.appendChild(script);
  });

  return pending;
}
