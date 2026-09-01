import useMediaQuery from '@mui/material/useMediaQuery';
import { useTheme } from '@mui/material/styles';

/**
 * True on phone-sized viewports (below the `sm` breakpoint).
 *
 * Layout should be done in `sx` breakpoints wherever it can be — CSS needs no render to react to a
 * resize. This is for the cases that are a *prop*, not a style: a `<Dialog fullScreen>`, a
 * `<Tabs variant="scrollable">`, a column list that differs rather than merely reflows.
 */
export function useIsMobile(): boolean {
  const theme = useTheme();
  return useMediaQuery(theme.breakpoints.down('sm'));
}

export default useIsMobile;
