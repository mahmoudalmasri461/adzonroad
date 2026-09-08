import type { ReactNode } from 'react';
import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';

type PageHeaderProps = {
  /**
   * Optional. Inside the admin console the page title lives in the shell's context bar, so those
   * pages pass actions only — rendering the title twice was the first thing the new shell broke.
   */
  title?: string;
  subtitle?: string;
  actions?: ReactNode;
};

export default function PageHeader({ title, subtitle, actions }: PageHeaderProps) {
  // Nothing to say and nothing to do: render nothing rather than an empty row with a 28px margin.
  if (!title && !subtitle && !actions) return null;

  return (
    <Box
      sx={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: title || subtitle ? 'space-between' : 'flex-end',
        mb: title || subtitle ? '28px' : '18px',
        flexWrap: 'wrap',
        gap: '16px',
      }}
    >
      {(title || subtitle) && (
        <Box>
          {title && (
            <Typography sx={{ fontWeight: 700, fontSize: 26, letterSpacing: '-0.01em' }}>{title}</Typography>
          )}
          {subtitle && (
            <Typography sx={{ mt: '4px', fontSize: 13.5, color: 'text.secondary' }}>{subtitle}</Typography>
          )}
        </Box>
      )}
      {actions && <Box sx={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>{actions}</Box>}
    </Box>
  );
}
