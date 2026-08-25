'use client';

import { useCallback, useState } from 'react';

/**
 * Tracks which items in a list are expanded. Backs the repeatable-entry cards,
 * where exactly one entry is usually open while the rest stay collapsed.
 */
export const useExpandedSet = (initial: readonly string[] = []) => {
  const [expanded, setExpanded] = useState<Set<string>>(() => new Set(initial));

  const isExpanded = useCallback((id: string) => expanded.has(id), [expanded]);

  const setItemExpanded = useCallback((id: string, open: boolean) => {
    setExpanded((current) => {
      const next = new Set(current);
      if (open) next.add(id);
      else next.delete(id);

      return next;
    });
  }, []);

  const collapseAll = useCallback(() => setExpanded(new Set()), []);

  const expandOnly = useCallback((id: string) => setExpanded(new Set([id])), []);

  return { isExpanded, setItemExpanded, collapseAll, expandOnly };
};
