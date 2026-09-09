import type { ReactNode } from 'react';
import Box from '@mui/material/Box';
import { useTranslation } from 'react-i18next';
import SearchBox from '../SearchBox';
import { tokens } from '../../theme';

/**
 * The row every admin list uses to narrow itself: a set of filter chips and a search box.
 *
 * Extracted after the third page grew its own copy. The chips are a radiogroup rather than tabs
 * because exactly one applies at a time and the count sits inside the control — a filter that
 * cannot tell you how much is behind it makes you press it to find out.
 *
 * A count of `undefined` renders nothing at all, so a filter whose total is not known yet does
 * not claim zero.
 */

export type FilterOption<T extends string> = {
  value: T;
  label: string;
  count?: number;
};

export default function AdminFilterBar<T extends string>({
  options,
  value,
  onChange,
  ariaLabel,
  search,
  trailing,
}: {
  options: readonly FilterOption<T>[];
  value: T;
  onChange: (next: T) => void;
  ariaLabel: string;
  search?: { value: string; onChange: (next: string) => void; placeholder: string; width?: number };
  /** Anything the page wants on the far side — counts, a feed indicator, an action. */
  trailing?: ReactNode;
}) {
  const { t } = useTranslation();

  return (
    <Box
      sx={{
        backgroundColor: '#fff',
        border: '1px solid #E7E4DE',
        borderRadius: '10px',
        p: '10px 12px',
        mb: '16px',
        display: 'flex',
        alignItems: 'center',
        gap: '12px',
        flexWrap: 'wrap',
      }}
    >
      <Box role="radiogroup" aria-label={ariaLabel} sx={{ display: 'flex', gap: '4px', flexWrap: 'wrap' }}>
        {options.map((option) => (
          <Box
            key={option.value}
            component="button"
            type="button"
            role="radio"
            aria-checked={value === option.value}
            data-active={value === option.value ? 'true' : undefined}
            onClick={() => onChange(option.value)}
            sx={{
              fontFamily: 'inherit',
              cursor: 'pointer',
              border: '1px solid #E4E1DA',
              borderRadius: '8px',
              background: 'none',
              padding: '6px 12px',
              fontSize: 12.5,
              fontWeight: 600,
              color: tokens.textMuted,
              display: 'inline-flex',
              alignItems: 'center',
              gap: '7px',
              '&:hover': { borderColor: '#CFCBC2' },
              '&:focus-visible': { outline: `2px solid ${tokens.amber}`, outlineOffset: '2px' },
              '&[data-active="true"]': {
                borderColor: tokens.amber,
                backgroundColor: 'rgba(245,166,35,0.12)',
                color: tokens.navy,
              },
            }}
          >
            {option.label}
            {option.count !== undefined && (
              // Counts are digits in both languages; keep them from being re-ordered.
              <Box component="span" sx={{ direction: 'ltr', fontSize: 11.5, opacity: 0.7 }}>
                {option.count}
              </Box>
            )}
          </Box>
        ))}
      </Box>

      {search && (
        <SearchBox
          value={search.value}
          onChange={search.onChange}
          placeholder={search.placeholder}
          width={search.width ?? 300}
        />
      )}

      {(value !== options[0]?.value || (search && search.value.trim() !== '')) && (
        <Box
          component="button"
          type="button"
          onClick={() => {
            onChange(options[0].value);
            search?.onChange('');
          }}
          sx={{
            fontFamily: 'inherit',
            cursor: 'pointer',
            border: 0,
            background: 'none',
            padding: '6px 4px',
            fontSize: 12.5,
            fontWeight: 600,
            color: tokens.textMuted,
            '&:hover': { color: tokens.navy },
            '&:focus-visible': { outline: `2px solid ${tokens.amber}`, outlineOffset: '2px', borderRadius: '4px' },
          }}
        >
          {t('admin.filters.clear')}
        </Box>
      )}

      {trailing && (
        <>
          <Box sx={{ flex: 1 }} />
          <Box sx={{ display: 'flex', alignItems: 'center', gap: '18px', flexWrap: 'wrap' }}>{trailing}</Box>
        </>
      )}
    </Box>
  );
}
