import Chip from '@mui/material/Chip';
import { tokens } from '../theme';

export type StatusTagVariant = 'live' | 'outline' | 'neutral' | 'error' | 'warn';

const VARIANT_STYLES: Record<StatusTagVariant, { bg: string; color: string; border?: string }> = {
  live: { bg: '#EAF7EF', color: '#0F7A3D' },
  outline: { bg: '#FFFFFF', color: tokens.textMuted, border: tokens.border },
  neutral: { bg: '#F1F2F6', color: tokens.textMuted },
  error: { bg: '#FDECEC', color: '#B42318' },
  warn: { bg: '#FEF3E2', color: '#8A5A12' },
};

type StatusTagProps = {
  label: string;
  variant?: StatusTagVariant;
};

export default function StatusTag({ label, variant = 'neutral' }: StatusTagProps) {
  const style = VARIANT_STYLES[variant];
  return (
    <Chip
      label={label}
      size="small"
      sx={{
        backgroundColor: style.bg,
        color: style.color,
        border: style.border ? `1px solid ${style.border}` : 'none',
        fontSize: 12,
        fontWeight: 600,
        height: 26,
      }}
    />
  );
}
