import type { ReactNode } from 'react';
import Box from '@mui/material/Box';

type FilterBarProps = {
  children: ReactNode;
};

/**
 * Lays out search/filter controls in a consistent, wrapping row.
 *
 * Below `sm` the row becomes a stack and every control fills it. The controls carry their own
 * pixel widths (a 190px status select, a 200px search box), and side by side on a phone those
 * wrap into a ragged two-per-line grid with an orphan on the end. The max-width media query is
 * deliberate rather than an `{ xs, sm }` value: the latter would emit a rule at `sm` too and
 * clobber each control's own width.
 */
export default function FilterBar({ children }: FilterBarProps) {
  return (
    <Box
      sx={{
        display: 'flex',
        gap: '10px',
        flexWrap: 'wrap',
        alignItems: 'center',
        '@media (max-width:599.95px)': {
          width: '100%',
          flexDirection: 'column',
          alignItems: 'stretch',
          '& > *': { width: '100%' },
        },
      }}
    >
      {children}
    </Box>
  );
}
