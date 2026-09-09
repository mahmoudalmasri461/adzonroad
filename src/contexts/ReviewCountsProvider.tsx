import { createContext, useContext, type ReactNode } from 'react';
import { useReviewCounts } from '../hooks/useReviewCounts';

/**
 * One source of "how much is waiting", shared by everything that shows it.
 *
 * The sidebar badges, the overview summary and the review queue itself all answer the same
 * question, and each used to ask it separately. That meant three identical requests on every load
 * and, worse, three answers that could disagree: approving a fleet updated the queue it was
 * approved in while the badge beside it went on saying one was waiting until the page was
 * reloaded.
 *
 * `reload` is what a decision calls afterwards, so the count that changes is the same count
 * everybody is reading.
 */

type Value = ReturnType<typeof useReviewCounts>;

const ReviewCountsContext = createContext<Value | null>(null);

export function ReviewCountsProvider({ children }: { children: ReactNode }) {
  const value = useReviewCounts();
  return <ReviewCountsContext.Provider value={value}>{children}</ReviewCountsContext.Provider>;
}

/**
 * Falls back to its own fetch outside the provider rather than throwing, so a component can be
 * rendered on its own — in a test, or on a page that is not inside the admin shell — without
 * needing the context wired up first.
 */
export function useSharedReviewCounts(): Value {
  const fromContext = useContext(ReviewCountsContext);
  // Disabled when the provider already has the answer, so this costs nothing in the normal case.
  const ownFallback = useReviewCounts(fromContext === null);
  return fromContext ?? ownFallback;
}
