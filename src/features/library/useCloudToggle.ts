'use client';

import { usePathname, useRouter } from 'next/navigation';
import { useCallback } from 'react';
import { toast } from 'sonner';

import { AUTH_ROUTES, CLOUD_SYNC, REDIRECT_PARAM } from '@/constants';
import { useAuthSession } from '@/features/auth';
import { CLOUD_REFUSAL_MESSAGE } from '@/lib/cloudSync';

import { useLibraryStore } from './useLibrary';

/**
 * Choosing which CVs live on the server.
 *
 * An account keeps at most `CLOUD_SYNC.maxDocuments`, and none of them
 * without the reader asking. This is the one place that choice is made, so
 * the home screen, the editor and the library drawer cannot disagree about
 * how many places are left or what to say when there are none.
 */
export const useCloudToggle = () => {
  const router = useRouter();
  const pathname = usePathname();
  const { signedIn } = useAuthSession();
  const setCloud = useLibraryStore((state) => state.actions.setCloud);
  const used = useLibraryStore((state) => state.documents.filter((entry) => entry.cloud).length);

  const toggle = useCallback(
    async (id: string, enabled: boolean) => {
      // Syncing needs an account; saying so is a door, not an error.
      if (enabled && !signedIn) {
        router.push(`${AUTH_ROUTES.signIn}?${REDIRECT_PARAM}=${encodeURIComponent(pathname || '/')}`);

        return;
      }

      const result = await setCloud(id, enabled);

      if (!result.ok) {
        toast.error(
          result.reason === 'missing'
            ? 'That CV could not be found.'
            : CLOUD_REFUSAL_MESSAGE[result.reason],
        );

        return;
      }

      toast.success(
        enabled
          ? 'This CV now syncs to your account.'
          : 'Stopped syncing. It stays on this device.',
      );
    },
    [pathname, router, setCloud, signedIn],
  );

  return { used, max: CLOUD_SYNC.maxDocuments, signedIn, toggle };
};
