import 'server-only';

import { and, inArray, isNull, sql } from 'drizzle-orm';

import { CLOUD_SYNC } from '@/constants';

import { db } from '../db';
import { cvDocument, session, user as userTable } from '../db/schema';

const DAY_MS = 24 * 60 * 60 * 1000;

export interface CloudAccount {
  id: string;
  name: string;
  email: string;
  /** The latest of: a sign-in, an account change, a CV saved to the server. */
  lastActiveAt: number;
  cvCount: number;
  bytes: number;
}

/** The instant before which an account counts as inactive. */
export const inactiveCutoff = (now: number): number =>
  now - CLOUD_SYNC.inactiveMonths * 30 * DAY_MS;

/**
 * Every account that keeps CVs on the server, with how long since it was last
 * seen and how much room it takes. Accounts holding nothing are not listed:
 * there is nothing on them to remove.
 */
export const listCloudAccounts = async (): Promise<CloudAccount[]> => {
  const database = db();

  const [holders, users, sessions, activity] = await Promise.all([
    database
      .select({
        userId: cvDocument.userId,
        count: sql<number>`count(*)::int`,
        bytes: sql<number>`coalesce(sum(octet_length(${cvDocument.resume}::text)), 0)::int`,
      })
      .from(cvDocument)
      .where(isNull(cvDocument.deletedAt))
      .groupBy(cvDocument.userId),
    database
      .select({
        id: userTable.id,
        name: userTable.name,
        email: userTable.email,
        updatedAt: userTable.updatedAt,
      })
      .from(userTable),
    database
      .select({
        userId: session.userId,
        latest: sql<Date>`max(${session.updatedAt})`,
      })
      .from(session)
      .groupBy(session.userId),
    database
      .select({
        userId: cvDocument.userId,
        latest: sql<number>`max(${cvDocument.updatedAt})::float8`,
      })
      .from(cvDocument)
      .groupBy(cvDocument.userId),
  ]);

  const sessionAt = new Map(sessions.map((row) => [row.userId, new Date(row.latest).getTime()]));
  const cvAt = new Map(activity.map((row) => [row.userId, Number(row.latest)]));
  const held = new Map(holders.map((row) => [row.userId, row]));

  return users
    .filter((account) => held.has(account.id))
    .map((account) => ({
      id: account.id,
      name: account.name,
      email: account.email,
      lastActiveAt: Math.max(
        account.updatedAt.getTime(),
        sessionAt.get(account.id) ?? 0,
        cvAt.get(account.id) ?? 0,
      ),
      cvCount: held.get(account.id)?.count ?? 0,
      bytes: held.get(account.id)?.bytes ?? 0,
    }))
    .sort((a, b) => a.lastActiveAt - b.lastActiveAt);
};

/**
 * Removes the server copies of these accounts' CVs — the CVs and their
 * deletion markers. The accounts themselves, and every CV in every reader's
 * own browser, are untouched.
 */
export const deleteCloudCopies = async (userIds: readonly string[]): Promise<number> => {
  if (userIds.length === 0) return 0;

  const removed = await db()
    .delete(cvDocument)
    .where(and(inArray(cvDocument.userId, [...userIds])))
    .returning({ id: cvDocument.id });

  return removed.length;
};
