import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import DashboardShell from '../layouts/DashboardShell';
import PageHeader from '../components/PageHeader';
import { useToast } from '../contexts/ToastProvider';
import ReviewQueues from '../components/admin/ReviewQueues';
import OperationsPanels from '../components/admin/OperationsPanels';
import { NAV_ITEMS } from '../data/adminMockData';
import { tokens } from '../theme';

export default function AdminDashboard() {
  const { showToast } = useToast();

  return (
    <DashboardShell navItems={NAV_ITEMS} avatarInitials="OP" userName="Omar P." userSubtitle="Operations Lead">
      <PageHeader
        title="Operations overview"
        subtitle="Platform-wide health across advertisers, drivers and screens."
        actions={
          <>
            <Button
              variant="outlined"
              color="inherit"
              sx={{ borderColor: tokens.border, color: tokens.text }}
              onClick={() => showToast('Export report isn\'t built in this preview yet')}
            >
              Export report
            </Button>
            <Button variant="contained" color="primary" onClick={() => showToast('Live Operations isn\'t built in this preview yet')}>
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
    </DashboardShell>
  );
}
