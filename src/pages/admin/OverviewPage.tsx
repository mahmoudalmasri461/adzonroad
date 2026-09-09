import Box from '@mui/material/Box';
import ActionRequired from '../../components/admin/ActionRequired';
import ReviewQueues from '../../components/admin/ReviewQueues';
import OperationsPanels from '../../components/admin/OperationsPanels';
import { useSharedReviewCounts } from '../../contexts/ReviewCountsProvider';

/**
 * The console's front page, in the order an operator asks the questions.
 *
 * What needs a decision, then what the network is doing, then the detail. The title and its two
 * actions live in the shell's context bar rather than being re-declared per page, which is what
 * kept every admin page's header slightly different from every other one.
 *
 * `ActionRequired` summarises; `ReviewQueues` is where the decision is actually made, and it is
 * rendered whenever anything is waiting. An earlier version of this page showed only the summary,
 * which left approve and reject with no surface anywhere in the product — the counts said three
 * fleets were waiting and there was no way to act on any of them. The summary is a headline over
 * the queue, never a replacement for it.
 */
export default function OverviewPage() {
  const review = useSharedReviewCounts();
  const waiting = review.status === 'loaded' ? review.total : 0;

  return (
    <>
      <Box sx={{ mb: '20px' }}>
        <ActionRequired />
      </Box>

      {/* Only when there is something to decide: its own empty state is the tall card the
          summary above replaced. */}
      {waiting > 0 && (
        <Box sx={{ mb: '20px' }}>
          <ReviewQueues />
        </Box>
      )}

      <OperationsPanels />
    </>
  );
}
