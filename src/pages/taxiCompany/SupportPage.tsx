import Box from '@mui/material/Box';
import Card from '@mui/material/Card';
import Typography from '@mui/material/Typography';
import PageHeader from '../../components/PageHeader';
import FleetSupportCard from '../../components/taxiCompany/FleetSupportCard';
import { SUPPORT_CONTACT } from '../../data/supportContact';

const FAQ = [
  {
    q: 'Who installs and maintains the screens?',
    a: 'AdzOnRoad installs every screen at no cost to your company and covers maintenance and insurance. Use "Request maintenance" on any vehicle and our team schedules a visit.',
  },
  {
    q: 'How is my fleet paid?',
    a: 'Payouts are calculated per vehicle from verified driving hours and screen time, then paid monthly by bank transfer. See the Earnings page for the current period and payout history.',
  },
  {
    q: 'What happens if a screen goes offline?',
    a: 'The screen keeps recording plays locally and syncs when it reconnects, so verified hours are not lost. If it stays offline, it appears under Screens with an Offline status and our team is alerted automatically.',
  },
  {
    q: 'Can I add a car without a driver?',
    a: 'Yes — add the vehicle first and assign a driver later. Cars with no driver appear as "No driver assigned" on the Cars page.',
  },
  {
    q: 'What documents do drivers need?',
    a: 'A national ID image and a valid driver license image. Drivers missing either stay in "Pending Documents" until both are uploaded.',
  },
];

export default function SupportPage() {
  return (
    <>
      <PageHeader title="Support" subtitle={`Reach the fleet support team directly on ${SUPPORT_CONTACT.phone}.`} />

      <Box sx={{ mb: '20px' }}>
        <FleetSupportCard />
      </Box>

      <Card sx={{ p: '20px' }}>
        <Typography sx={{ fontSize: 11.5, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.04em', color: 'text.secondary' }}>
          FAQ
        </Typography>
        <Typography sx={{ fontWeight: 700, fontSize: 16, mb: '14px' }}>Common questions</Typography>
        <Box sx={{ display: 'grid', gap: '16px' }}>
          {FAQ.map((item) => (
            <Box key={item.q}>
              <Typography sx={{ fontWeight: 700, fontSize: 13.5, mb: '4px' }}>{item.q}</Typography>
              <Typography sx={{ fontSize: 13, color: 'text.secondary' }}>{item.a}</Typography>
            </Box>
          ))}
        </Box>
      </Card>
    </>
  );
}
