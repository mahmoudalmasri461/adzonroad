import { useMemo, useState } from 'react';

/** Free-text search over a fixed set of string fields on each item. */
export function useSearchFilter<T>(items: T[], searchFields: (keyof T)[]) {
  const [search, setSearch] = useState('');

  const filtered = useMemo(() => {
    if (!search.trim()) return items;
    const needle = search.toLowerCase();
    return items.filter((item) => searchFields.some((field) => String(item[field] ?? '').toLowerCase().includes(needle)));
  }, [items, searchFields, search]);

  return { search, setSearch, filtered };
}
