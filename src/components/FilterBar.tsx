import type { ReactNode } from 'react';
import Box from '@mui/material/Box';

type FilterBarProps = {
  children: ReactNode;
};

/** Lays out search/filter controls in a consistent, wrapping row. */
export default function FilterBar({ children }: FilterBarProps) {
  return <Box sx={{ display: 'flex', gap: '10px', flexWrap: 'wrap', alignItems: 'center' }}>{children}</Box>;
}
