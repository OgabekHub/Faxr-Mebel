import { useCallback, useEffect, useState } from 'react';
import { loadModelViewer } from '../lib/loadModelViewer';

export type ModelViewerStatus = 'idle' | 'loading' | 'ready' | 'error';

/**
 * Loads the model-viewer script when `enabled` becomes true and exposes the
 * load status plus a `retry` callback for the error state.
 */
export function useModelViewer(enabled: boolean) {
  const [status, setStatus] = useState<ModelViewerStatus>('idle');
  const [attempt, setAttempt] = useState(0);

  useEffect(() => {
    if (!enabled) return;
    let cancelled = false;
    setStatus('loading');
    loadModelViewer().then(
      () => {
        if (!cancelled) setStatus('ready');
      },
      (error: unknown) => {
        console.error(error);
        if (!cancelled) setStatus('error');
      },
    );
    return () => {
      cancelled = true;
    };
  }, [enabled, attempt]);

  const retry = useCallback(() => setAttempt((n) => n + 1), []);

  return { status, retry };
}
