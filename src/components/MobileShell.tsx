import type { ReactNode } from 'react';
import Box from '@mui/material/Box';
import Logo from './Logo';
import { tokens } from '../theme';

type MobileShellProps = {
  avatarInitials: string;
  children: ReactNode;
};

export default function MobileShell({ avatarInitials, children }: MobileShellProps) {
  return (
    <Box
      sx={{
        maxWidth: 430,
        margin: '0 auto',
        minHeight: '100vh',
        backgroundColor: 'background.default',
        display: 'flex',
        flexDirection: 'column',
      }}
    >
      <Box
        sx={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: '16px 18px',
          backgroundColor: tokens.navy,
          position: 'sticky',
          top: 0,
          zIndex: 5,
        }}
      >
        <Logo size="sm" onDark />
        <Box
          sx={{
            width: 32,
            height: 32,
            borderRadius: '50%',
            backgroundColor: tokens.amber,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: 12,
            fontWeight: 700,
            color: tokens.navy,
          }}
        >
          {avatarInitials}
        </Box>
      </Box>

      <Box sx={{ padding: '20px 18px 100px', display: 'flex', flexDirection: 'column', gap: '16px' }}>{children}</Box>
    </Box>
  );
}
