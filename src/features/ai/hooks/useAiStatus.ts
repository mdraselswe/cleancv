'use client';

import { useEffect, useState } from 'react';

import { useAuthSession } from '@/features/auth';

/**
 * Whether the signed-in reader may use AI polish.
 *
 * One request per signed-in user, shared by every editor on the page: ten
 * bullets on screen are ten buttons asking the same question, and the answer
 * is the same ten times. `false` until the server says otherwise, so the
 * button never flashes for the many who will never see it.
 *
 * Only a hint for drawing a control. The polish route checks the allow-list
 * itself.
 */

let cachedFor = '';
let cached = false;
let inflight: Promise<boolean> | null = null;

const ask = async (userId: string): Promise<boolean> => {
  if (cachedFor === userId) return cached;

  inflight ??= fetch('/api/ai/status', { cache: 'no-store' })
    .then((response) => (response.ok ? response.json() : { enabled: false }))
    .then((body: { enabled?: boolean }) => Boolean(body.enabled))
    .catch(() => false);

  const enabled = await inflight;

  inflight = null;
  cachedFor = userId;
  cached = enabled;

  return enabled;
};

export const useAiStatus = (): boolean => {
  const { user, signedIn } = useAuthSession();
  const userId = signedIn ? (user?.id ?? '') : '';
  // The answer is kept with the user it was for, so signing out reads as off
  // without an effect having to say so.
  const [answer, setAnswer] = useState<{ userId: string; enabled: boolean }>({
    userId: cachedFor,
    enabled: cached,
  });

  useEffect(() => {
    if (!userId) return;

    let cancelled = false;

    void ask(userId).then((enabled) => {
      if (!cancelled) setAnswer({ userId, enabled });
    });

    return () => {
      cancelled = true;
    };
  }, [userId]);

  return Boolean(userId) && answer.userId === userId && answer.enabled;
};
