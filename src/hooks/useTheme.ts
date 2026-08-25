'use client';

import { useCallback, useSyncExternalStore } from 'react';

export type ThemePreference = 'system' | 'light' | 'dark';

export const THEME_STORAGE_KEY = 'cv-maker:theme';

/**
 * Chrome theme, held in a tiny external store rather than component state.
 *
 * The preference is read from localStorage, which React cannot see during SSR;
 * useSyncExternalStore gives the server a stable 'system' snapshot and lets the
 * client subscribe without a setState-in-effect cascade. A blocking script in
 * the root layout applies the attribute before first paint so there is no flash.
 *
 * Deliberately separate from the resume's own theme: the document stays white
 * in dark mode, because that is what prints.
 */

const isPreference = (value: unknown): value is ThemePreference =>
  value === 'light' || value === 'dark' || value === 'system';

const listeners = new Set<() => void>();

const read = (): ThemePreference => {
  try {
    const stored = window.localStorage.getItem(THEME_STORAGE_KEY);

    return isPreference(stored) ? stored : 'system';
  } catch {
    return 'system';
  }
};

const subscribe = (listener: () => void) => {
  listeners.add(listener);
  window.addEventListener('storage', listener);

  return () => {
    listeners.delete(listener);
    window.removeEventListener('storage', listener);
  };
};

const write = (preference: ThemePreference) => {
  const root = document.documentElement;

  if (preference === 'system') root.removeAttribute('data-theme');
  else root.setAttribute('data-theme', preference);

  try {
    window.localStorage.setItem(THEME_STORAGE_KEY, preference);
  } catch {
    // A blocked storage API should not stop the theme from applying.
  }

  listeners.forEach((listener) => listener());
};

const NEXT_PREFERENCE: Record<ThemePreference, ThemePreference> = {
  light: 'dark',
  dark: 'system',
  system: 'light',
};

export const useTheme = () => {
  const preference = useSyncExternalStore(subscribe, read, () => 'system' as ThemePreference);

  const setTheme = useCallback((next: ThemePreference) => write(next), []);
  const cycle = useCallback(() => write(NEXT_PREFERENCE[read()]), []);

  return { preference, setTheme, cycle };
};

/**
 * Inlined in the root layout to set the attribute before the first paint.
 * Kept as a string because it must run ahead of hydration.
 */
export const THEME_BOOTSTRAP_SCRIPT = `(function(){try{var t=localStorage.getItem('${THEME_STORAGE_KEY}');if(t==='light'||t==='dark'){document.documentElement.setAttribute('data-theme',t)}}catch(e){}})();`;
