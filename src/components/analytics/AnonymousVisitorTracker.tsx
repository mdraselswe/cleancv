'use client';

import { usePathname } from 'next/navigation';
import { useEffect } from 'react';

const STORAGE_KEY = 'cleancv-anonymous-visitor';
const SESSION_KEY = 'cleancv-visit-recorded';

export const AnonymousVisitorTracker = () => {
  const pathname = usePathname();

  useEffect(() => {
    if (pathname !== '/' || sessionStorage.getItem(SESSION_KEY)) return;

    let visitorId = localStorage.getItem(STORAGE_KEY);
    if (!visitorId) {
      visitorId = crypto.randomUUID();
      localStorage.setItem(STORAGE_KEY, visitorId);
    }

    sessionStorage.setItem(SESSION_KEY, '1');
    void fetch('/api/analytics/visit', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ visitorId }),
      keepalive: true,
    }).catch(() => sessionStorage.removeItem(SESSION_KEY));
  }, [pathname]);

  return null;
};
