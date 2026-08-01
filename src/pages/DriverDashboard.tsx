import { useState } from 'react';
import Box from '@mui/material/Box';
import Card from '@mui/material/Card';
import Typography from '@mui/material/Typography';
import Button from '@mui/material/Button';
import Dialog from '@mui/material/Dialog';
import DialogTitle from '@mui/material/DialogTitle';
import DialogContent from '@mui/material/DialogContent';
import DialogActions from '@mui/material/DialogActions';
import TextField from '@mui/material/TextField';
import MobileShell from '../components/MobileShell';
import BottomTabBar from '../components/BottomTabBar';
import { useToast } from '../components/ToastProvider';
import { tokens } from '../theme';

type ActionDialogProps = {
  open: boolean;
  onClose: () => void;
  title: string;
  placeholder: string;
  onSubmitted: () => void;
};

function ActionDialog({ open, onClose, title, placeholder, onSubmitted }: ActionDialogProps) {
  const [note, setNote] = useState('');

  const handleClose = () => {
    setNote('');
    onClose();
  };

  const handleSubmit = () => {
    onSubmitted();
    handleClose();
  };

  return (
    <Dialog open={open} onClose={handleClose} maxWidth="xs" fullWidth>
      <DialogTitle sx={{ fontWeight: 700 }}>{title}</DialogTitle>
      <DialogContent>
        <TextField
          fullWidth
          multiline
          minRows={3}
          placeholder={placeholder}
          value={note}
          onChange={(e) => setNote(e.target.value)}
          sx={{ mt: 1 }}
        />
      </DialogContent>
      <DialogActions sx={{ px: 3, pb: 2 }}>
        <Button onClick={handleClose} color="inherit">
          Cancel
        </Button>
        <Button variant="contained" color="primary" onClick={handleSubmit}>
          Submit
        </Button>
      </DialogActions>
    </Dialog>
  );
}

const STATUS_CHIPS = [
  { label: 'Online', pulse: true },
  { label: 'GPS active' },
  { label: 'Screen active' },
];

const QUICK_STATS = [
  { value: '6.2 hrs', label: 'Active driving' },
  { value: '5.4 hrs', label: 'Verified ad hours' },
  { value: '96%', label: 'Screen uptime', color: tokens.green },
  { value: '142 km', label: 'Distance today' },
];

const VEHICLE_INFO = [
  ['Plate', 'B 84 219'],
  ['Screen serial', 'AZR-2291'],
  ['Battery / power', 'Good'],
  ['Last maintenance', 'Jun 12, 2026'],
];

export default function DriverDashboard() {
  const { showToast } = useToast();
  const [damageOpen, setDamageOpen] = useState(false);
  const [maintenanceOpen, setMaintenanceOpen] = useState(false);

  return (
    <MobileShell avatarInitials="JS">
      {/* GREETING + STATUS */}
      <Box>
        <Typography sx={{ fontSize: 13.5, color: 'text.secondary' }}>Good afternoon, Joseph</Typography>
        <Typography sx={{ fontWeight: 700, fontSize: 22, mt: '6px', letterSpacing: '-0.01em' }}>Baabda · Route 4</Typography>
      </Box>

      <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
        {STATUS_CHIPS.map((chip) => (
          <Box
            key={chip.label}
            sx={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '6px',
              fontSize: 12,
              fontWeight: 500,
              padding: '6px 10px',
              borderRadius: 999,
              border: `1px solid ${tokens.border}`,
              backgroundColor: '#fff',
            }}
          >
            <Box
              sx={{
                width: 7,
                height: 7,
                borderRadius: '50%',
                backgroundColor: tokens.green,
                animation: chip.pulse ? 'dotPulse 1.8s infinite' : 'none',
              }}
            />
            {chip.label}
          </Box>
        ))}
      </Box>

      {/* EARNINGS */}
      <Card sx={{ background: `linear-gradient(135deg, ${tokens.navy}, ${tokens.navy600})`, color: '#fff', border: 'none' }}>
        <Typography sx={{ fontSize: 11.5, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.04em', color: 'rgba(255,255,255,0.6)' }}>
          Today's earnings
        </Typography>
        <Typography sx={{ mt: '6px', mb: '2px', fontWeight: 800, fontSize: 38 }}>$24.60</Typography>
        <Typography sx={{ fontSize: 12.5, color: 'rgba(255,255,255,0.65)' }}>6.2 active hrs · 5.4 verified ad hrs</Typography>
        <Box sx={{ display: 'flex', gap: '18px', mt: '16px', pt: '16px', borderTop: '1px solid rgba(255,255,255,0.15)' }}>
          <Box>
            <Typography sx={{ fontSize: 11, textTransform: 'uppercase', letterSpacing: '0.04em', color: 'rgba(255,255,255,0.5)' }}>This month</Typography>
            <Typography sx={{ mt: '4px', fontSize: 18, fontWeight: 700 }}>$518</Typography>
          </Box>
          <Box>
            <Typography sx={{ fontSize: 11, textTransform: 'uppercase', letterSpacing: '0.04em', color: 'rgba(255,255,255,0.5)' }}>Next payout</Typography>
            <Typography sx={{ mt: '4px', fontSize: 18, fontWeight: 700 }}>Aug 1</Typography>
          </Box>
        </Box>
      </Card>

      {/* CURRENT CAMPAIGN */}
      <Card>
        <Typography sx={{ fontSize: 11.5, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.04em', color: 'text.secondary' }}>
          Currently displaying
        </Typography>
        <Typography sx={{ fontWeight: 700, fontSize: 15, mt: '6px' }}>Zaatar &amp; Co. Launch</Typography>
        <Typography sx={{ mt: '6px', fontSize: 13, color: 'text.secondary' }}>Displayed for 2h 14m today · screen active</Typography>
      </Card>

      {/* QUICK STATS */}
      <Box sx={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
        {QUICK_STATS.map((stat) => (
          <Card key={stat.label} sx={{ padding: '14px 16px' }}>
            <Typography sx={{ fontSize: 18, fontWeight: 700, color: stat.color ?? 'text.primary' }}>{stat.value}</Typography>
            <Typography sx={{ mt: '4px', fontSize: 11, color: 'text.secondary' }}>{stat.label}</Typography>
          </Card>
        ))}
      </Box>

      {/* DATA SYNC STATUS */}
      <Card>
        <Typography sx={{ fontSize: 11.5, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.04em', color: 'text.secondary' }}>
          Recording status
        </Typography>
        <Typography sx={{ mt: '6px', mb: '12px', fontSize: 13, color: 'text.secondary' }}>
          Your hours keep recording even without a connection — nothing is lost.
        </Typography>
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: 13 }}>
            <Box sx={{ width: 8, height: 8, borderRadius: '50%', backgroundColor: tokens.blue, flexShrink: 0 }} />
            Synced to platform
            <Box component="span" sx={{ ml: 'auto', color: 'text.secondary' }}>
              2 min ago
            </Box>
          </Box>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: 13 }}>
            <Box sx={{ width: 8, height: 8, borderRadius: '50%', backgroundColor: tokens.warn, flexShrink: 0 }} />
            4 min pending sync
            <Box component="span" sx={{ ml: 'auto', color: 'text.secondary' }}>
              queued
            </Box>
          </Box>
        </Box>
      </Card>

      {/* VEHICLE & SCREEN */}
      <Card>
        <Typography sx={{ fontSize: 11.5, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.04em', color: 'text.secondary' }}>
          Vehicle &amp; screen
        </Typography>
        <Box sx={{ display: 'grid', gap: '8px', fontSize: 14, mt: '10px' }}>
          {VEHICLE_INFO.map(([label, value]) => (
            <Box key={label} sx={{ display: 'flex', justifyContent: 'space-between' }}>
              <span style={{ color: tokens.textMuted }}>{label}</span>
              <span style={{ fontWeight: 600, color: value === 'Good' ? tokens.green : undefined }}>{value}</span>
            </Box>
          ))}
        </Box>
        <Box sx={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px', mt: '16px' }}>
          <Button
            variant="outlined"
            color="inherit"
            sx={{ borderColor: tokens.border, color: tokens.text, minHeight: 60, fontSize: 13.5, lineHeight: 1.3, whiteSpace: 'normal' }}
            onClick={() => setDamageOpen(true)}
          >
            Report damage
          </Button>
          <Button
            variant="outlined"
            color="inherit"
            sx={{ borderColor: tokens.border, color: tokens.text, minHeight: 60, fontSize: 13.5, lineHeight: 1.3, whiteSpace: 'normal' }}
            onClick={() => setMaintenanceOpen(true)}
          >
            Request maintenance
          </Button>
        </Box>
        <Button
          fullWidth
          variant="text"
          color="inherit"
          sx={{ mt: '8px', color: tokens.textMuted, border: `1px solid ${tokens.border}` }}
          onClick={() => showToast("Support chat isn't wired up in this preview yet")}
        >
          Contact support
        </Button>
      </Card>

      <BottomTabBar active="Home" />

      <ActionDialog
        open={damageOpen}
        onClose={() => setDamageOpen(false)}
        title="Report vehicle damage"
        placeholder="Describe the damage (e.g. cracked screen, dent, scratch)…"
        onSubmitted={() => showToast('Damage report submitted')}
      />
      <ActionDialog
        open={maintenanceOpen}
        onClose={() => setMaintenanceOpen(false)}
        title="Request maintenance"
        placeholder="What needs attention?"
        onSubmitted={() => showToast('Maintenance request submitted')}
      />
    </MobileShell>
  );
}
