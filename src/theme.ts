import { createTheme, alpha } from '@mui/material/styles';

declare module '@mui/material/styles' {
  interface Palette {
    navy: Palette['primary'];
    blue: Palette['primary'];
  }
  interface PaletteOptions {
    navy?: PaletteOptions['primary'];
    blue?: PaletteOptions['primary'];
  }
  interface TypeBackground {
    default: string;
    paper: string;
  }
}

declare module '@mui/material/Button' {
  interface ButtonPropsColorOverrides {
    navy: true;
    blue: true;
  }
}

declare module '@mui/material/Chip' {
  interface ChipPropsColorOverrides {
    navy: true;
    blue: true;
  }
}

export const tokens = {
  navy: '#0F1B3D',
  navy600: '#1D2E63',
  navy700: '#16234C',
  blue: '#2952CC',
  blue600: '#3D63DD',
  amber: '#F5A623',
  amber600: '#E0941A',
  green: '#16A34A',
  warn: '#D97706',
  red: '#DC2626',
  bg: '#F6F7FB',
  surface: '#FFFFFF',
  text: '#101828',
  textMuted: '#5D6B82',
  border: '#E4E7EC',
  shadowSm: '0 1px 2px rgba(16,24,40,0.06), 0 0 0 1px rgba(16,24,40,0.04)',
  shadowMd: '0 8px 24px rgba(16,24,40,0.08), 0 0 0 1px rgba(16,24,40,0.04)',
  shadowLg: '0 24px 56px rgba(16,24,40,0.14)',
};

const theme = createTheme({
  palette: {
    mode: 'light',
    primary: { main: tokens.amber, dark: tokens.amber600, contrastText: tokens.navy },
    navy: { main: tokens.navy, light: tokens.navy600, dark: tokens.navy700, contrastText: '#fff' },
    blue: { main: tokens.blue, light: tokens.blue600, dark: tokens.blue, contrastText: '#fff' },
    success: { main: tokens.green },
    warning: { main: tokens.warn },
    error: { main: tokens.red },
    background: { default: tokens.bg, paper: tokens.surface },
    text: { primary: tokens.text, secondary: tokens.textMuted },
    divider: tokens.border,
  },
  shape: { borderRadius: 14 },
  typography: {
    fontFamily: "'Inter', system-ui, sans-serif",
    h1: { fontWeight: 800, letterSpacing: '-0.02em' },
    h2: { fontWeight: 700, letterSpacing: '-0.01em' },
    h3: { fontWeight: 700, letterSpacing: '-0.01em' },
    h4: { fontWeight: 700, letterSpacing: '-0.01em' },
    h5: { fontWeight: 700 },
    h6: { fontWeight: 700 },
    button: { textTransform: 'none', fontWeight: 600 },
  },
  shadows: Array(25).fill(tokens.shadowSm) as unknown as ReturnType<typeof createTheme>['shadows'],
  components: {
    MuiCssBaseline: {
      styleOverrides: {
        body: { backgroundColor: tokens.bg },
        '@keyframes dotPulse': {
          '0%': { boxShadow: `0 0 0 0 ${alpha(tokens.green, 0.4)}` },
          '70%': { boxShadow: `0 0 0 8px ${alpha(tokens.green, 0)}` },
          '100%': { boxShadow: `0 0 0 0 ${alpha(tokens.green, 0)}` },
        },
      },
    },
    MuiButton: {
      defaultProps: { disableElevation: true },
      styleOverrides: {
        root: { borderRadius: 10, padding: '10px 20px', fontSize: 14.5 },
        outlined: { borderWidth: 1.5, '&:hover': { borderWidth: 1.5 } },
      },
      variants: [
        {
          props: { variant: 'contained', color: 'primary' },
          style: {
            backgroundColor: tokens.amber,
            color: tokens.navy,
            '&:hover': { backgroundColor: tokens.amber600 },
          },
        },
      ],
    },
    MuiCard: {
      styleOverrides: {
        root: {
          border: `1px solid ${tokens.border}`,
          borderRadius: 14,
          boxShadow: tokens.shadowSm,
        },
      },
    },
    MuiChip: {
      styleOverrides: {
        root: { fontWeight: 600, borderRadius: 999 },
      },
    },
    MuiPaper: {
      styleOverrides: {
        root: { backgroundImage: 'none' },
      },
    },
    MuiDialog: {
      styleOverrides: {
        // MUI's default 32px margin plus its 24px gutters leaves a 375px screen about 270px of
        // usable dialog. Reclaim the margin below `sm` — but not on dialogs that have gone
        // full-screen, which own the whole viewport by design.
        paper: {
          '@media (max-width:599.95px)': {
            '&:not(.MuiDialog-paperFullScreen)': {
              margin: 16,
              width: 'calc(100% - 32px)',
              maxWidth: 'calc(100% - 32px)',
              maxHeight: 'calc(100% - 32px)',
            },
          },
        },
      },
    },
    MuiDialogTitle: {
      styleOverrides: {
        root: { '@media (max-width:599.95px)': { padding: '18px 18px 12px' } },
      },
    },
    MuiDialogContent: {
      styleOverrides: {
        root: { '@media (max-width:599.95px)': { padding: '0 18px 8px' } },
      },
    },
    MuiDialogActions: {
      styleOverrides: {
        root: { '@media (max-width:599.95px)': { padding: '12px 18px 16px' } },
      },
    },
  },
});

export default theme;
