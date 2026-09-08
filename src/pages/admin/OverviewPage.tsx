import Box from '@mui/material/Box';
import ActionRequired from '../../components/admin/ActionRequired';
import OperationsPanels from '../../components/admin/OperationsPanels';

/**
 * The console's front page, in the order an operator asks the questions.
 *
 * What needs a decision, then what the network is doing, then the detail. The title and its two
 * actions live in the shell's context bar now rather than being re-declared per page, which is
 * what kept every admin page's header slightly different from every other one.
 */
export default function OverviewPage() {
  return (
    <>
      <Box sx={{ mb: '20px' }}>
        <ActionRequired />
      </Box>

      <OperationsPanels />
    </>
  );
}
