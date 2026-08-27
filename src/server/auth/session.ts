import 'server-only';

import { headers } from 'next/headers';

import { isAuthConfigured } from '../env';
import { auth } from './auth';

/**
 * Who is signed in, on the server.
 *
 * One place, so no route re-derives it and no route forgets that auth can be
 * switched off. `null` means nobody — including on an install with no database,
 * which is a development machine and not a hole: the only thing that reads this
 * is the PDF gate, and that gate refuses to open itself in production without a
 * configured auth server.
 */

export interface SessionUser {
  id: string;
  name: string;
  email: string;
  emailVerified: boolean;
  image: string | null;
}

export interface SessionOptions {
  /**
   * Ask the database rather than the session cookie.
   *
   * A session is cached in a signed cookie for a few minutes so that answering
   * "who is signed in?" on every page load does not cost a round trip. That
   * cache is a copy, and a copy outlives what it copied: a session revoked by a
   * password reset still reads as valid from the cookie until it expires. For
   * the avatar in the toolbar that gap does not matter. For the check that
   * decides whether to render somebody's CV it does — "reset your password"
   * has to mean the other browser is out *now*, which is what this repo's own
   * terms page promises. See ADR-048.
   */
  fresh?: boolean;
}

export const getSessionUser = async (
  requestHeaders?: Headers,
  { fresh = false }: SessionOptions = {},
): Promise<SessionUser | null> => {
  if (!isAuthConfigured()) return null;

  const session = await auth().api.getSession({
    headers: requestHeaders ?? (await headers()),
    query: fresh ? { disableCookieCache: true } : undefined,
  });

  if (!session?.user) return null;

  const { id, name, email, emailVerified, image } = session.user;

  return { id, name, email, emailVerified, image: image ?? null };
};
