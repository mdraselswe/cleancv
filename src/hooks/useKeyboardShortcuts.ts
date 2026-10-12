'use client';

import { useEffect, useRef } from 'react';

export interface ShortcutHandler {
  /** Lower-case `event.key`, e.g. 'z', 's', 'k'. */
  key: string;
  meta?: boolean;
  shift?: boolean;
  alt?: boolean;
  handler: () => void;
  /** Fire even while a text field has focus. Off by default. */
  allowInInput?: boolean;
}

const isEditableTarget = (target: EventTarget | null): boolean => {
  if (!(target instanceof HTMLElement)) return false;

  return (
    target.isContentEditable ||
    ['INPUT', 'TEXTAREA', 'SELECT'].includes(target.tagName)
  );
};

/**
 * Global shortcuts. `meta` matches Ctrl on Windows/Linux and Cmd on macOS, so
 * callers declare intent once.
 */
export const useKeyboardShortcuts = (shortcuts: readonly ShortcutHandler[]): void => {
  // Held in a ref so the listener is attached once and still sees fresh handlers.
  const ref = useRef(shortcuts);

  useEffect(() => {
    ref.current = shortcuts;
  }, [shortcuts]);

  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      // Browser autofill and some input methods dispatch a keydown with no
      // `key` at all; there is nothing to match against and nothing to do.
      if (typeof event.key !== 'string') return;

      const key = event.key.toLowerCase();
      const meta = event.metaKey || event.ctrlKey;

      for (const shortcut of ref.current) {
        if (shortcut.key !== key) continue;
        if (Boolean(shortcut.meta) !== meta) continue;
        if (Boolean(shortcut.shift) !== event.shiftKey) continue;
        if (shortcut.alt !== undefined && shortcut.alt !== event.altKey) continue;
        if (!shortcut.allowInInput && isEditableTarget(event.target)) continue;

        event.preventDefault();
        shortcut.handler();

        return;
      }
    };

    window.addEventListener('keydown', onKeyDown);

    return () => window.removeEventListener('keydown', onKeyDown);
  }, []);
};
