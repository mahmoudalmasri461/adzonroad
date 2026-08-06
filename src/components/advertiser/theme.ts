import { tokens } from '../../theme';

/**
 * Advertiser portal now shares the homepage/global palette instead of its own
 * orange/charcoal one. Key names (orange/charcoal/mapBg/...) are kept as-is so
 * every consuming component under components/advertiser/** doesn't need to
 * change — only the resolved colors do.
 */
export const advTokens = {
  orange: tokens.blue,
  orangeHover: '#1F3FA0',
  orangeSoft: 'rgba(41,82,204,0.12)',
  charcoal: tokens.navy,
  charcoal600: tokens.navy600,
  mapBg: '#EEF1F7',
  black: tokens.navy700,
  white: '#FFFFFF',
  bg: tokens.bg,
  border: tokens.border,
  text: tokens.text,
  textMuted: tokens.textMuted,
  green: tokens.green,
  amber: tokens.warn,
  red: tokens.red,
  blue: tokens.blue,
  shadowSm: tokens.shadowSm,
  shadowMd: tokens.shadowMd,
  radius: 14,
};

export const cardSx = {
  borderRadius: `${advTokens.radius}px`,
  border: `1px solid ${advTokens.border}`,
  boxShadow: advTokens.shadowSm,
  backgroundColor: advTokens.white,
};
