import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import Button from '@mui/material/Button';
import EmailIcon from '@mui/icons-material/Email';
import PhoneIcon from '@mui/icons-material/Phone';
import ChatIcon from '@mui/icons-material/Chat';
import { advTokens, cardSx } from './theme';
import { useToast } from '../../contexts/ToastProvider';
import { SUPPORT_CONTACT } from '../../data/advertiserMockData';

export default function SupportCard() {
  const { showToast } = useToast();

  return (
    <Box sx={{ ...cardSx, padding: '20px' }}>
      <Typography sx={{ fontSize: 11.5, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.04em', color: advTokens.textMuted }}>
        We're here to help
      </Typography>
      <Typography sx={{ fontWeight: 800, fontSize: 16, color: advTokens.text, mb: '16px' }}>Support</Typography>

      <Box sx={{ display: 'flex', alignItems: 'center', gap: '12px', mb: '16px' }}>
        <Box
          sx={{
            width: 42,
            height: 42,
            borderRadius: '50%',
            backgroundColor: advTokens.orangeSoft,
            color: advTokens.orange,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontWeight: 800,
            fontSize: 14,
          }}
        >
          {SUPPORT_CONTACT.name.split(' ').map((p) => p[0]).join('')}
        </Box>
        <Box>
          <Typography sx={{ fontWeight: 700, fontSize: 13.5, color: advTokens.text }}>{SUPPORT_CONTACT.name}</Typography>
          <Typography sx={{ fontSize: 11.5, color: advTokens.textMuted }}>{SUPPORT_CONTACT.role}</Typography>
        </Box>
      </Box>

      <Box sx={{ display: 'grid', gap: '8px', mb: '16px' }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: 13, color: advTokens.text }}>
          <EmailIcon sx={{ fontSize: 16, color: advTokens.textMuted }} />
          {SUPPORT_CONTACT.email}
        </Box>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: 13, color: advTokens.text }}>
          <PhoneIcon sx={{ fontSize: 16, color: advTokens.textMuted }} />
          {SUPPORT_CONTACT.phone}
        </Box>
      </Box>

      <Button
        fullWidth
        startIcon={<ChatIcon />}
        onClick={() => showToast('Live chat isn\'t built in this preview yet')}
        sx={{ backgroundColor: advTokens.orange, color: '#fff', fontWeight: 700, textTransform: 'none', '&:hover': { backgroundColor: advTokens.orangeHover } }}
      >
        Start a conversation
      </Button>
    </Box>
  );
}
