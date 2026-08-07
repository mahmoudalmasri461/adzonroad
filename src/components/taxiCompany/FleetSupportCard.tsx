import Box from '@mui/material/Box';
import Card from '@mui/material/Card';
import Typography from '@mui/material/Typography';
import Button from '@mui/material/Button';
import PhoneRoundedIcon from '@mui/icons-material/PhoneRounded';
import BuildRoundedIcon from '@mui/icons-material/BuildRounded';
import ReportProblemRoundedIcon from '@mui/icons-material/ReportProblemRounded';
import { useFleet } from './FleetContext';
import { SUPPORT_CONTACT } from '../../data/taxiCompanyMockData';
import { tokens } from '../../theme';

export default function FleetSupportCard() {
  const { openDamageReport, openMaintenanceRequest } = useFleet();

  return (
    <Card sx={{ p: '20px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '14px' }}>
      <Box>
        <Typography sx={{ fontSize: 11.5, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.04em', color: 'text.secondary' }}>
          Need help?
        </Typography>
        <Typography sx={{ fontWeight: 700, fontSize: 16 }}>{SUPPORT_CONTACT.name}</Typography>
        <Typography sx={{ fontSize: 12.5, color: 'text.secondary' }}>
          {SUPPORT_CONTACT.role} · {SUPPORT_CONTACT.email}
        </Typography>
      </Box>
      <Box sx={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
        <Button
          variant="outlined"
          color="inherit"
          sx={{ borderColor: tokens.border, color: tokens.text }}
          startIcon={<ReportProblemRoundedIcon />}
          onClick={() => openDamageReport(undefined)}
        >
          Report damage
        </Button>
        <Button
          variant="outlined"
          color="inherit"
          sx={{ borderColor: tokens.border, color: tokens.text }}
          startIcon={<BuildRoundedIcon />}
          onClick={() => openMaintenanceRequest(undefined)}
        >
          Request maintenance
        </Button>
        <Button
          variant="contained"
          color="primary"
          startIcon={<PhoneRoundedIcon />}
          component="a"
          href={`tel:${SUPPORT_CONTACT.phone.replace(/\s/g, '')}`}
        >
          Call for support
        </Button>
      </Box>
    </Card>
  );
}
