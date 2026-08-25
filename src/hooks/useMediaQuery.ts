'use client';

import { useCallback, useSyncExternalStore } from 'react';

/**
 * Matches a media query.
 *
 * The match is external state the server cannot know, so it is read through
 * useSyncExternalStore: the server snapshot is `false`, and the client
 * subscribes to change events without a render-then-correct pass.
 */
export const useMediaQuery = (query: string): boolean => {
  const subscribe = useCallback(
    (listener: () => void) => {
      const list = window.matchMedia(query);
      list.addEventListener('change', listener);

      return () => list.removeEventListener('change', listener);
    },
    [query],
  );

  const getSnapshot = useCallback(() => window.matchMedia(query).matches, [query]);

  return useSyncExternalStore(subscribe, getSnapshot, () => false);
};

/** The breakpoint where the three-pane editor collapses to tabs. */
export const useIsDesktop = (): boolean => useMediaQuery('(min-width: 1024px)');
