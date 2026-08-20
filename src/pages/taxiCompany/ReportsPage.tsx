import { useEffect, useState } from 'react';
import Box from '@mui/material/Box';
import Card from '@mui/material/Card';
import Typography from '@mui/material/Typography';
import Button from '@mui/material/Button';
import Alert from '@mui/material/Alert';
import DescriptionIcon from '@mui/icons-material/Description';
import DownloadIcon from '@mui/icons-material/Download';
import PageHeader from '../../components/PageHeader';
import { useToast } from '../../contexts/ToastProvider';
import { useFleet } from '../../components/taxiCompany/FleetContext';
import {
  getFleetEarnings,
  getFleetScreens,
  type FleetDriverEarnings,
  type FleetScreen,
} from '../../services/fleet';
import {
  downloadCsv,
  driverEarningsCsv,
  driverEarningsFilename,
  screenUptimeCsv,
  screenUptimeFilename,
  vehicleActivityCsv,
  vehicleActivityFilename,
} from '../../services/fleetReports';
import { tokens } from '../../theme';

export default function ReportsPage() {
  const { showToast } = useToast();
  const { vehicles } = useFleet();

  const [driverEarnings, setDriverEarnings] = useState<FleetDriverEarnings[]>([]);
  const [screens, setScreens] = useState<FleetScreen[]>([]);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const controller = new AbortController();

    Promise.all([getFleetEarnings(undefined, controller.signal), getFleetScreens(controller.signal)])
      .then(([earnings, screenResult]) => {
        setDriverEarnings(earnings.byDriver);
        setScreens(screenResult);
      })
      .catch((e: unknown) => {
        if (controller.signal.aborted) return;
        setError(e instanceof Error ? e.message : 'Could not load report data.');
      });

    return () => controller.abort();
  }, []);

  const reports = [
    {
      id: 'vehicles',
      name: 'Vehicle activity',
      description: 'Every vehicle with its status, driver, driving hours, verified screen hours and distance today.',
      rows: vehicles.length,
      unit: vehicles.length === 1 ? 'vehicle' : 'vehicles',
      run: () => downloadCsv(vehicleActivityFilename(), vehicleActivityCsv(vehicles)),
    },
    {
      id: 'earnings',
      name: 'Driver earnings, this month',
      description: 'Shifts, active hours and the amount each driver generated over the current month.',
      rows: driverEarnings.length,
      unit: driverEarnings.length === 1 ? 'driver' : 'drivers',
      run: () => downloadCsv(driverEarningsFilename(), driverEarningsCsv(driverEarnings)),
    },
    {
      id: 'screens',
      name: 'Screen uptime',
      description: 'Each installed screen with its status, network, last check-in, battery and firmware.',
      rows: screens.length,
      unit: screens.length === 1 ? 'screen' : 'screens',
      run: () => downloadCsv(screenUptimeFilename(), screenUptimeCsv(screens)),
    },
  ];

  return (
    <>
      <PageHeader
        title="Reports"
        subtitle="Export your fleet's activity, earnings and screen uptime as spreadsheets."
      />

      {error && <Alert severity="error" sx={{ mb: '20px' }}>{error}</Alert>}

      <Card sx={{ p: '20px' }}>
        <Typography sx={{ fontSize: 11.5, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.04em', color: 'text.secondary' }}>
          Downloadable
        </Typography>
        <Typography sx={{ fontWeight: 700, fontSize: 16, mb: '4px' }}>Available reports</Typography>
        <Typography sx={{ fontSize: 12.5, color: 'text.secondary', mb: '14px' }}>
          Generated from your live data at the moment you download, so a report always matches what
          the portal is showing.
        </Typography>

        <Box sx={{ display: 'grid', gap: '4px' }}>
          {reports.map((report) => (
            <Box
              key={report.id}
              sx={{
                display: 'flex',
                alignItems: 'center',
                gap: '12px',
                padding: '12px 4px',
                borderBottom: `1px solid ${tokens.border}`,
                '&:last-of-type': { borderBottom: 'none' },
              }}
            >
              <DescriptionIcon sx={{ fontSize: 20, color: tokens.textMuted }} />
              <Box sx={{ flex: 1 }}>
                <Typography sx={{ fontSize: 13, fontWeight: 600 }}>{report.name}</Typography>
                <Typography sx={{ fontSize: 11.5, color: 'text.secondary' }}>{report.description}</Typography>
                <Typography sx={{ fontSize: 11, color: 'text.secondary', mt: '2px' }}>
                  {report.rows === 0 ? 'Nothing to export yet' : `${report.rows} ${report.unit}`}
                </Typography>
              </Box>
              <Button
                size="small"
                startIcon={<DownloadIcon />}
                // Disabled rather than producing a file with only a header row, which reads as a
                // broken download rather than an empty fleet.
                disabled={report.rows === 0}
                onClick={() => {
                  report.run();
                  showToast(`${report.name} downloaded`);
                }}
                sx={{ fontSize: 12, fontWeight: 700 }}
              >
                Download
              </Button>
            </Box>
          ))}
        </Box>
      </Card>
    </>
  );
}
