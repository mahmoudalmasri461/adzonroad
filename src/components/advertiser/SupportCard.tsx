import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import Button from '@mui/material/Button';
import EmailIcon from '@mui/icons-material/Email';
import PhoneIcon from '@mui/icons-material/Phone';
import { advTokens, cardSx } from './theme';
import { ADVERTISER_SUPPORT_CONTACT as CONTACT } from '../../data/supportContact';

/**
 * How to reach support.
 *
 * The named account manager is gone: "Nadine Chami" was shown to every advertiser on the
 * platform, and a fabricated person answering a real support need is the worst kind of fixture.
 *
 * The button opens the reader's own mail client rather than a chat panel. There is no advertiser
 * support ticket in the platform — the one that exists is scoped to fleets and their vehicles —
 * so a "Start a conversation" button would have nowhere to put what was said.
 */
export default function SupportCard() {
  return (
    <Box sx={{ ...cardSx, padding: '20px' }}>
      <Typography sx={{ fontSize: 11.5, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.04em', color: advTokens.textMuted }}>
        We're here to help
      </Typography>
      <Typography sx={{ fontWeight: 800, fontSize: 16, color: advTokens.text, mb: '16px' }}>Support</Typography>

      <Box sx={{ mb: '16px' }}>
        <Typography sx={{ fontWeight: 700, fontSize: 13.5, color: advTokens.text }}>{CONTACT.name}</Typography>
        <Typography sx={{ fontSize: 11.5, color: advTokens.textMuted }}>{CONTACT.role}</Typography>
      </Box>

      <Box sx={{ display: 'grid', gap: '10px', mb: '16px' }}>
        <ContactLine icon={<EmailIcon sx={{ fontSize: 16, color: advTokens.textMuted }} />} href={`mailto:${CONTACT.email}`} label={CONTACT.email} />
        <ContactLine icon={<PhoneIcon sx={{ fontSize: 16, color: advTokens.textMuted }} />} href={`tel:${CONTACT.phone.replace(/\s/g, '')}`} label={CONTACT.phone} />
      </Box>

      <Button
        fullWidth
        startIcon={<EmailIcon />}
        href={`mailto:${CONTACT.email}`}
        sx={{ backgroundColor: advTokens.orange, color: '#fff', fontWeight: 700, textTransform: 'none', '&:hover': { backgroundColor: advTokens.orangeHover } }}
      >
        Email support
      </Button>

      <Typography sx={{ mt: '12px', fontSize: 11.5, color: advTokens.textMuted }}>
        Invoices are settled by bank transfer; support sends the details with each one.
      </Typography>
    </Box>
  );
}

function ContactLine({ icon, href, label }: { icon: React.ReactNode; href: string; label: string }) {
  return (
    <Box sx={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: 13 }}>
      {icon}
      <Box component="a" href={href} sx={{ color: advTokens.text, textDecoration: 'none', '&:hover': { textDecoration: 'underline' } }}>
        {label}
      </Box>
    </Box>
  );
}
