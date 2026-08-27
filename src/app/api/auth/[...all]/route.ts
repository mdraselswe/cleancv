import { toNextJsHandler } from 'better-auth/next-js';

import { auth } from '@/server/auth/auth';
import { isAuthConfigured } from '@/server/env';

/**
 * Every auth endpoint, behind one catch-all.
 *
 * Better Auth owns the routing under this path — sign-in, sign-up, the OAuth
 * callback, verification, reset. Nothing in this repo adds a route here; a new
 * capability is a Better Auth option or a plugin, not a hand-written handler
 * that would have to re-implement its cookie and CSRF handling.
 */

export const runtime = 'nodejs';
/* Sessions are per-request. Nothing on this path may be cached. */
export const dynamic = 'force-dynamic';

/**
 * What an install with no database answers.
 *
 * "Who is signed in?" has an honest answer here — nobody — and returning it as
 * `null` rather than as a 500 keeps a fresh clone's console clean while the
 * session hook does exactly what it would do for a signed-out visitor.
 * Anything that would *change* something says plainly that there is nowhere to
 * write it.
 */
const unconfigured = (request: Request): Response =>
  new URL(request.url).pathname.endsWith('/get-session')
    ? Response.json(null)
    : Response.json({ error: 'Accounts are not configured on this deployment.' }, { status: 503 });

/*
 * The handler is built per request rather than at module scope so a build with
 * no `DATABASE_URL` still compiles, and a misconfigured deployment answers with
 * a message naming the variable instead of failing to boot.
 */
export const GET = (request: Request) =>
  isAuthConfigured() ? toNextJsHandler(auth()).GET(request) : unconfigured(request);

export const POST = (request: Request) =>
  isAuthConfigured() ? toNextJsHandler(auth()).POST(request) : unconfigured(request);
