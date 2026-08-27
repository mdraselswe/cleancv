'use client';

import { createAuthClient } from 'better-auth/react';

/**
 * The browser's half of Better Auth.
 *
 * No `baseURL`: the client defaults to this page's own origin, which is the
 * only origin the server trusts anyway. Configuring it would add a value that
 * has to be right in three environments and is silently wrong in the fourth.
 *
 * Everything reaches Better Auth through this one instance — a second
 * `createAuthClient` call would keep its own session store, and the two would
 * disagree about who is signed in.
 */
export const authClient = createAuthClient();
