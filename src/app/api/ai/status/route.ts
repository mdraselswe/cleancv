import { getSessionUser } from '@/server/auth/session';
import { isAiAllowed } from '@/server/env';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

/**
 * Whether this reader may use AI polish.
 *
 * Only a hint for drawing a button: the polish route checks the same thing
 * itself, so a client that ignores this answer gets a 403 and nothing else.
 * Nobody is told why it is off — a signed-out reader and an account outside
 * the list see the same `false`.
 */
export async function GET(request: Request) {
  const user = await getSessionUser(request.headers);

  return Response.json({ enabled: Boolean(user && isAiAllowed(user.email)) });
}
