import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import Button from '@mui/material/Button';
import InboxIcon from '@mui/icons-material/Inbox';
import { advTokens } from './theme';

type EmptyStateProps = {
  title: string;
  description?: string;
  actionLabel?: string;
  onAction?: () => void;
  icon?: React.ReactNode;
};

export default function EmptyState({ title, description, actionLabel, onAction, icon }: EmptyStateProps) {
  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', textAlign: 'center', py: '48px', px: '24px', color: advTokens.textMuted }}>
      <Box sx={{ width: 48, height: 48, borderRadius: '50%', backgroundColor: '#F0F1F3', display: 'flex', alignItems: 'center', justifyContent: 'center', mb: '14px', color: advTokens.textMuted }}>
        {icon ?? <InboxIcon />}
      </Box>
      <Typography sx={{ fontWeight: 700, fontSize: 15, color: advTokens.text }}>{title}</Typography>
      {description && (
        <Typography sx={{ fontSize: 13, mt: '4px', maxWidth: 340 }}>{description}</Typography>
      )}
      {actionLabel && onAction && (
        <Button
          onClick={onAction}
          sx={{ mt: '16px', backgroundColor: advTokens.orange, color: '#fff', textTransform: 'none', fontWeight: 700, '&:hover': { backgroundColor: advTokens.orangeHover } }}
        >
          {actionLabel}
        </Button>
      )}
    </Box>
  );
}
