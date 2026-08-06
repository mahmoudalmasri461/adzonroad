import type { ReactNode } from 'react';
import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import Button from '@mui/material/Button';
import InboxIcon from '@mui/icons-material/Inbox';

type EmptyStateProps = {
  title: string;
  description?: string;
  actionLabel?: string;
  onAction?: () => void;
  icon?: ReactNode;
};

export default function EmptyState({ title, description, actionLabel, onAction, icon }: EmptyStateProps) {
  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', textAlign: 'center', py: '48px', px: '24px', color: 'text.secondary' }}>
      <Box sx={{ width: 48, height: 48, borderRadius: '50%', backgroundColor: '#F1F2F6', display: 'flex', alignItems: 'center', justifyContent: 'center', mb: '14px', color: 'text.secondary' }}>
        {icon ?? <InboxIcon />}
      </Box>
      <Typography sx={{ fontWeight: 700, fontSize: 15 }}>{title}</Typography>
      {description && (
        <Typography sx={{ fontSize: 13, mt: '4px', maxWidth: 340 }}>{description}</Typography>
      )}
      {actionLabel && onAction && (
        <Button variant="contained" color="primary" onClick={onAction} sx={{ mt: '16px' }}>
          {actionLabel}
        </Button>
      )}
    </Box>
  );
}
