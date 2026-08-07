import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import AdvertiserLayout from '../../components/advertiser/AdvertiserLayout';
import SupportCard from '../../components/advertiser/SupportCard';
import { advTokens, cardSx } from '../../components/advertiser/theme';

const FAQ = [
  {
    q: 'How is my campaign delivery verified?',
    a: 'Every ad play is matched with the screen\'s GPS position and timestamp. Only plays confirmed on an online screen count toward your verified totals.',
  },
  {
    q: 'What happens if a screen goes offline mid-campaign?',
    a: 'The screen keeps playing your downloaded creative and records plays locally. Once it reconnects, those plays sync back and are reconciled into your totals — you never pay for unverified delivery.',
  },
  {
    q: 'How do I pay my invoices?',
    a: 'Invoices are settled offline by bank transfer. Your account manager sends the details with each invoice — there is no online card payment.',
  },
  {
    q: 'Can I change regions mid-campaign?',
    a: 'Yes — contact your account manager and the fleet assignment is updated from the next display day.',
  },
];

export default function SupportPage() {
  return (
    <AdvertiserLayout title="Support">
      <Box sx={{ mb: '24px' }}>
        <Typography sx={{ fontWeight: 800, fontSize: 24, color: advTokens.text, letterSpacing: '-0.01em' }}>Support</Typography>
        <Typography sx={{ mt: '4px', fontSize: 13.5, color: advTokens.textMuted }}>
          Your account manager and answers to common questions.
        </Typography>
      </Box>

      <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', lg: '380px 1fr' }, gap: '16px', alignItems: 'start' }}>
        <SupportCard />
        <Box sx={{ ...cardSx, padding: '20px' }}>
          <Typography sx={{ fontSize: 11.5, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.04em', color: advTokens.textMuted }}>
            FAQ
          </Typography>
          <Typography sx={{ fontWeight: 800, fontSize: 16, color: advTokens.text, mb: '14px' }}>Common questions</Typography>
          <Box sx={{ display: 'grid', gap: '16px' }}>
            {FAQ.map((item) => (
              <Box key={item.q}>
                <Typography sx={{ fontWeight: 700, fontSize: 13.5, color: advTokens.text, mb: '4px' }}>{item.q}</Typography>
                <Typography sx={{ fontSize: 13, color: advTokens.textMuted }}>{item.a}</Typography>
              </Box>
            ))}
          </Box>
        </Box>
      </Box>
    </AdvertiserLayout>
  );
}
