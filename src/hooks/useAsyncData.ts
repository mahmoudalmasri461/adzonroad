import { useCallback, useEffect, useState } from 'react';
import { ApiError } from '../services/apiClient';

/**
 * One fetch, its error, and a way to ask again.
 *
 * Thirteen console sections each doing their own effect, abort controller, error mapping and
 * reload counter is thirteen chances to get the abort wrong and set state on an unmounted page.
 * The shape is deliberately narrow: no cache, no dedupe, no shared store. A section that needs
 * two calls composes them in one loader rather than mounting two of these, so the figures on a
 * page describe the same moment.
 */
export interface AsyncData<T> {
  data: T | null;
  loading: boolean;
  error: string | null;
  /** Refetches. Safe to hand straight to a button. */
  reload: () => void;
}

export function useAsyncData<T>(
  load: (signal: AbortSignal) => Promise<T>,
  deps: readonly unknown[] = [],
  fallbackMessage = 'This section could not be loaded.',
): AsyncData<T> {
  const [data, setData] = useState<T | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [attempt, setAttempt] = useState(0);

  const reload = useCallback(() => setAttempt((n) => n + 1), []);

  useEffect(() => {
    const controller = new AbortController();
    setLoading(true);

    load(controller.signal)
      .then((result) => {
        if (controller.signal.aborted) return;
        setData(result);
        setError(null);
      })
      .catch((e: unknown) => {
        if (controller.signal.aborted) return;

        // The API answers 403 when the signed-in administrator holds the baseline but not this
        // section's permission. Saying so beats "request failed", because it is not a fault to
        // fix — it is a permission somebody has to grant.
        setError(
          e instanceof ApiError && e.status === 403
            ? 'Your account does not hold the permission this section needs.'
            : e instanceof Error ? e.message : fallbackMessage,
        );
      })
      .finally(() => {
        if (!controller.signal.aborted) setLoading(false);
      });

    return () => controller.abort();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [attempt, ...deps]);

  return { data, loading, error, reload };
}
