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

/**
 * The breakpoint where the score panel gets a column of its own.
 *
 * Below it the panel is still reachable — as a drawer on a tablet, as a tab on
 * a phone — so this is about where it can sit open beside the work, not about
 * whether it exists.
 */
export const useIsDesktop = (): boolean => useMediaQuery('(min-width: 1024px)');

/**
 * The breakpoint where the form and the page can be seen at once.
 *
 * A tablet used to fall all the way back to the phone's one-pane-at-a-time
 * layout even though it had room for both, which put the preview a tab away
 * from the field being typed into — the one thing the preview exists to
 * answer. 768px is where a 380px form column and a legible page fit together.
 */
export const useIsSplit = (): boolean => useMediaQuery('(min-width: 768px)');

/**
 * True where the primary input is a finger.
 *
 * Not a width: a 1280px tablet has the same thumb as a 390px phone, and a
 * desktop window dragged narrow still has a mouse.
 */
export const useIsTouch = (): boolean => useMediaQuery('(pointer: coarse)');
