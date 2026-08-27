import 'server-only';

import { neon } from '@neondatabase/serverless';
import { drizzle } from 'drizzle-orm/neon-http';

import { serverEnv } from '../env';
import { authSchema } from './schema';

/**
 * The database handle.
 *
 * Neon over HTTP rather than a pooled TCP connection: every request on a
 * serverless deployment is its own process, and a connection pool that cannot
 * outlive one request is a pool of one that pays for a handshake anyway. HTTP
 * has no transactions, which is why the Better Auth adapter is left on its
 * default of running operations sequentially.
 *
 * Built on first use, not at import: a build that has no `DATABASE_URL` still
 * has an editor to compile.
 */

export type Database = ReturnType<typeof createDatabase>;

const createDatabase = () => {
  const url = serverEnv().DATABASE_URL;

  if (!url) {
    throw new Error('DATABASE_URL is not set. Accounts need a database (see .env.example).');
  }

  return drizzle(neon(url), { schema: authSchema });
};

let cached: Database | null = null;

export const db = (): Database => (cached ??= createDatabase());
