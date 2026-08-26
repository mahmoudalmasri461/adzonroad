import type { ReactNode } from 'react';
import Box from '@mui/material/Box';
import Card from '@mui/material/Card';
import Typography from '@mui/material/Typography';
import Alert from '@mui/material/Alert';
import Button from '@mui/material/Button';
import { DataGrid, type GridColDef, type GridValidRowModel } from '@mui/x-data-grid';
import SearchBox from '../SearchBox';
import EmptyState from '../EmptyState';

/**
 * A titled table with its own loading, error and empty states.
 *
 * Every list in the console is the same object: a heading, an optional search, some actions, and
 * rows that might not be there. Written once so a section that has nothing to show says so in the
 * same words as the section next to it — and so no page can quietly render an empty grid that
 * looks like a successful answer.
 */
type DataCardProps<T extends GridValidRowModel> = {
  title: string;
  /** Appended to the title when there is something to count. */
  count?: number;
  actions?: ReactNode;
  search?: { value: string; onChange: (value: string) => void; placeholder: string };
  loading: boolean;
  error: string | null;
  onRetry?: () => void;
  rows: T[];
  columns: GridColDef<T>[];
  getRowId: (row: T) => string;
  /** Shown when the load succeeded and there is genuinely nothing. */
  emptyTitle: string;
  emptyDescription?: string;
  /** Shown when rows exist but the search excluded all of them. */
  noMatchTitle?: string;
  height?: number;
  pageSize?: number;
  /** Rendered above the table — a note about what the section can and cannot do. */
  note?: ReactNode;
};

export default function DataCard<T extends GridValidRowModel>({
  title,
  count,
  actions,
  search,
  loading,
  error,
  onRetry,
  rows,
  columns,
  getRowId,
  emptyTitle,
  emptyDescription,
  noMatchTitle = 'Nothing matches your search',
  height = 520,
  pageSize = 25,
  note,
}: DataCardProps<T>) {
  const searching = (search?.value ?? '').trim().length > 0;

  return (
    <Card sx={{ p: 0 }}>
      <Box
        sx={{
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          padding: '18px 22px', flexWrap: 'wrap', gap: '10px',
        }}
      >
        <Typography sx={{ fontWeight: 700, fontSize: 16 }}>
          {title}
          {count !== undefined && count > 0 && ` (${count})`}
        </Typography>

        <Box sx={{ display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap' }}>
          {search && (
            <SearchBox
              value={search.value}
              onChange={search.onChange}
              placeholder={search.placeholder}
              width={260}
            />
          )}
          {actions}
        </Box>
      </Box>

      {note && (
        <Box sx={{ px: '22px', pb: '14px' }}>
          <Typography sx={{ fontSize: 12.5, color: 'text.secondary' }}>{note}</Typography>
        </Box>
      )}

      {error ? (
        <Box sx={{ px: '22px', pb: '20px' }}>
          <Alert
            severity="error"
            sx={{ fontSize: 13 }}
            action={onRetry ? <Button size="small" color="inherit" onClick={onRetry}>Retry</Button> : undefined}
          >
            {error}
          </Alert>
        </Box>
      ) : loading ? (
        <EmptyState title={`Loading ${title.toLowerCase()}…`} />
      ) : rows.length === 0 ? (
        searching ? (
          <EmptyState title={noMatchTitle} description="Try a different term." />
        ) : (
          <EmptyState title={emptyTitle} description={emptyDescription} />
        )
      ) : (
        <Box sx={{ height, px: '10px', pb: '10px' }}>
          <DataGrid
            rows={rows}
            columns={columns}
            getRowId={getRowId}
            disableRowSelectionOnClick
            pageSizeOptions={[10, 25, 50, 100]}
            initialState={{ pagination: { paginationModel: { pageSize } } }}
            sx={{ border: 'none' }}
          />
        </Box>
      )}
    </Card>
  );
}
