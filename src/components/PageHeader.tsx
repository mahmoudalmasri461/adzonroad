import type { ReactNode } from 'react';
import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';

type PageHeaderProps = {
  title: string;
  subtitle?: string;
  actions?: ReactNode;
};

export default function PageHeader({ title, subtitle, actions }: PageHeaderProps) {
  return (
    <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: '28px', flexWrap: 'wrap', gap: '16px' }}>
      <Box>
        <Typography sx={{ fontWeight: 700, fontSize: 26, letterSpacing: '-0.01em' }}>{title}</Typography>
        {subtitle && (
          <Typography sx={{ mt: '4px', fontSize: 13.5, color: 'text.secondary' }}>{subtitle}</Typography>
        )}
      </Box>
      {actions && <Box sx={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>{actions}</Box>}
    </Box>
  );
}
