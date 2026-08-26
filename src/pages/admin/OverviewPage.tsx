import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import { Link as RouterLink } from 'react-router-dom';
import PageHeader from '../../components/PageHeader';
import ReviewQueues from '../../components/admin/ReviewQueues';
import OperationsPanels from '../../components/admin/OperationsPanels';
import { tokens } from '../../theme';

/**
 * The console's front page: what is waiting on a decision, and what the platform is doing.
 *
 * The two header buttons used to raise a toast apologising for themselves. They are links now,
 * because the sections they name exist.
 */
export default function OverviewPage() {
  return (
    <>
      <PageHeader
        title="Operations overview"
        subtitle="Platform-wide health across advertisers, drivers and screens."
        actions={
          <>
            <Button
              component={RouterLink}
              to="/admin/reports"
              variant="outlined"
              color="inherit"
              sx={{ borderColor: tokens.border, color: tokens.text }}
            >
              Reports
            </Button>
            <Button component={RouterLink} to="/admin/live" variant="contained" color="primary">
              Live Operations
            </Button>
          </>
        }
      />

      {/* REVIEW QUEUES — the only place any of this can be approved */}
      <Box sx={{ mb: '20px' }}>
        <ReviewQueues />
      </Box>

      {/* KPIs, alerts and screen inventory — all counted from the platform */}
      <OperationsPanels />
    </>
  );
}
