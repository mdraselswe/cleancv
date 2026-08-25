'use client';

import { useEffect, useState } from 'react';

/**
 * Trails `value` by `delay`. Used to keep expensive derived work — ATS scoring,
 * preview re-layout — off the keystroke path.
 */
export const useDebouncedValue = <T>(value: T, delay: number): T => {
  const [debounced, setDebounced] = useState(value);

  useEffect(() => {
    const timer = setTimeout(() => setDebounced(value), delay);

    return () => clearTimeout(timer);
  }, [value, delay]);

  return debounced;
};
