'use client';

import { LogIn, LogOut } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useCallback } from 'react';

import { Button, Menu } from '@/components/ui';
import { AUTH_ROUTES, REDIRECT_PARAM, ROUTES } from '@/constants';

import { useAuthSession, useSignOut } from '../hooks/useAuthSession';

/**
 * Who is signed in, in the toolbar.
 *
 * Three states and all three are drawn, because the first paint has not heard
 * from the server yet: a placeholder while the session is being read, a
 * "Sign in" button when there is none, and the account menu when there is.
 * Skipping the placeholder shows "Sign in" to somebody who is already signed
 * in for a frame, which reads as having been logged out.
 *
 * The trigger is initials rather than a photo when there is no photo — a
 * generic silhouette is the same for everyone and says nothing about which
 * account this is.
 */
const initials = (name: string, email: string): string => {
  const source = name.trim() || email.trim();
  const parts = source.split(/\s+/).filter(Boolean);

  if (parts.length === 0) return '?';
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();

  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
};

export const UserMenu = () => {
  const { user, pending } = useAuthSession();
  const { signOut } = useSignOut();
  const router = useRouter();

  const goToSignIn = useCallback(() => {
    router.push(`${AUTH_ROUTES.signIn}?${REDIRECT_PARAM}=${encodeURIComponent(ROUTES.editor)}`);
  }, [router]);

  if (pending) {
    return (
      <div
        className="bg-surface-2 h-8 w-8 flex-none animate-pulse rounded-full"
        aria-hidden="true"
      />
    );
  }

  if (!user) {
    return (
      <Button size="sm" variant="ghost" leading={<LogIn size={15} />} onClick={goToSignIn}>
        <span className="hidden sm:inline">Sign in</span>
      </Button>
    );
  }

  return (
    <Menu
      label="Account"
      align="end"
      header={
        <div className="flex min-w-0 flex-col">
          <span className="text-fg text-ui truncate font-medium">{user.name || 'Signed in'}</span>
          <span className="text-fg-subtle text-ui-2xs truncate">{user.email}</span>
        </div>
      }
      entries={[
        {
          id: 'sign-out',
          label: 'Sign out',
          icon: <LogOut size={15} />,
          onSelect: () => void signOut(),
        },
      ]}
      trigger={(props) => (
        <button
          {...props}
          type="button"
          aria-label={`Account — ${user.email}`}
          className="tap-target bg-surface-2 text-fg-muted hover:text-fg text-ui-2xs flex h-8 w-8 flex-none items-center justify-center rounded-full font-semibold transition"
        >
          {user.image ? (
            // eslint-disable-next-line @next/next/no-img-element -- a Google avatar on an unknown host; next/image would need every provider's domain allow-listed.
            <img
              src={user.image}
              alt=""
              className="h-full w-full rounded-full object-cover"
              referrerPolicy="no-referrer"
            />
          ) : (
            initials(user.name, user.email)
          )}
        </button>
      )}
    />
  );
};
