import { useCallback, useEffect, useState } from 'react';
import {
  fetchAdvertiserQueue,
  fetchCampaignQueue,
  fetchDriverQueue,
  fetchFleetQueue,
  type ReviewKind,
} from '../services/admin';

/**
 * How many items are waiting on a decision, per queue.
 *
 * Shared by the sidebar badges and the overview's action list so the two cannot disagree — a
 * badge saying 3 above a panel saying "nothing waiting" is the kind of thing that stops anyone
 * trusting either.
 *
 * `error` is a state of its own and never collapses into zeros. A failed request that renders as
 * "0 waiting" tells an administrator the queues are clear when nobody actually knows, which is
 * the most expensive lie this console can tell.
 */

export type ReviewCounts = Record<ReviewKind, number>;

type State =
  | { status: 'loading' }
  | { status: 'error' }
  | { status: 'loaded'; counts: ReviewCounts; total: number };

/**
 * `enabled` exists so a consumer inside ReviewCountsProvider can hold the same hook shape
 * without firing a second set of requests for a number somebody else already has.
 */
export function useReviewCounts(enabled = true): State & { reload: () => void } {
  const [state, setState] = useState<State>({ status: 'loading' });
  const [nonce, setNonce] = useState(0);

  const reload = useCallback(() => setNonce((n) => n + 1), []);

  useEffect(() => {
    if (!enabled) return;

    const controller = new AbortController();
    setState({ status: 'loading' });

    // Not Promise.all: one failing queue should not blank the other three. But a failure is still
    // recorded rather than counted as zero.
    Promise.allSettled([
      fetchDriverQueue(controller.signal),
      fetchAdvertiserQueue(controller.signal),
      fetchFleetQueue(controller.signal),
      fetchCampaignQueue(controller.signal),
    ]).then((results) => {
      if (controller.signal.aborted) return;

      if (results.some((r) => r.status === 'rejected')) {
        setState({ status: 'error' });
        return;
      }

      const [driver, advertiser, fleet, campaign] = results.map((r) =>
        r.status === 'fulfilled' ? r.value : null,
      );

      const counts: ReviewCounts = {
        // The driver endpoint answers with `{ items }`; the other three answer with an array.
        driver: Array.isArray(driver) ? driver.length : (driver?.items?.length ?? 0),
        advertiser: Array.isArray(advertiser) ? advertiser.length : 0,
        fleet: Array.isArray(fleet) ? fleet.length : 0,
        campaign: Array.isArray(campaign) ? campaign.length : 0,
      };

      setState({
        status: 'loaded',
        counts,
        total: counts.driver + counts.advertiser + counts.fleet + counts.campaign,
      });
    });

    return () => controller.abort();
  }, [nonce, enabled]);

  return { ...state, reload };
}
