import {
  bigint,
  boolean,
  index,
  integer,
  pgTable,
  text,
  timestamp,
  uniqueIndex,
} from 'drizzle-orm/pg-core';

/**
 * The auth tables, exactly as Better Auth expects to find them.
 *
 * Field *keys* are Better Auth's vocabulary and cannot be renamed — the adapter
 * looks a model's fields up by name and throws on one it cannot find. The
 * column names underneath are snake_case, which is what a Postgres reader
 * expects to see when they open the table by hand.
 *
 * A stored identifier never follows a rename, and these are stored identifiers
 * in the strongest sense: someone's session cookie points at a row here. See
 * ADR-030 and ADR-048.
 */

export const user = pgTable('user', {
  id: text('id').primaryKey(),
  name: text('name').notNull(),
  email: text('email').notNull().unique(),
  emailVerified: boolean('email_verified').notNull().default(false),
  image: text('image'),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
});

export const session = pgTable(
  'session',
  {
    id: text('id').primaryKey(),
    expiresAt: timestamp('expires_at', { withTimezone: true }).notNull(),
    token: text('token').notNull().unique(),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
    ipAddress: text('ip_address'),
    userAgent: text('user_agent'),
    userId: text('user_id')
      .notNull()
      .references(() => user.id, { onDelete: 'cascade' }),
  },
  (table) => [index('session_user_id_idx').on(table.userId)],
);

export const account = pgTable(
  'account',
  {
    id: text('id').primaryKey(),
    /**
     * Which issuer the account id belongs to. Google's `sub` is unique within
     * Google and nowhere else, so the pair is what identifies an identity.
     */
    issuer: text('issuer').notNull(),
    accountId: text('account_id').notNull(),
    providerId: text('provider_id').notNull(),
    userId: text('user_id')
      .notNull()
      .references(() => user.id, { onDelete: 'cascade' }),
    accessToken: text('access_token'),
    refreshToken: text('refresh_token'),
    idToken: text('id_token'),
    accessTokenExpiresAt: timestamp('access_token_expires_at', { withTimezone: true }),
    refreshTokenExpiresAt: timestamp('refresh_token_expires_at', { withTimezone: true }),
    scope: text('scope'),
    /**
     * The password hash, for the credentials provider only. Better Auth hashes
     * with scrypt; nothing in this repo ever reads or writes this column.
     */
    password: text('password'),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [
    uniqueIndex('account_issuer_account_id_idx').on(table.issuer, table.accountId),
    index('account_user_id_idx').on(table.userId),
  ],
);

/**
 * Short-lived tokens: email verification, password reset.
 *
 * One row per outstanding link, deleted when it is used. A row here is a
 * capability someone was emailed, which is why nothing selects from it by user.
 */
export const verification = pgTable(
  'verification',
  {
    id: text('id').primaryKey(),
    identifier: text('identifier').notNull(),
    value: text('value').notNull(),
    expiresAt: timestamp('expires_at', { withTimezone: true }).notNull(),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [index('verification_identifier_idx').on(table.identifier)],
);

/**
 * Rate limit counters, keyed by IP and path.
 *
 * In the database rather than in memory because every serverless invocation
 * gets its own memory: an in-memory counter on Vercel resets whenever the
 * platform feels like it, which is a rate limit that does not limit anything.
 */
export const rateLimit = pgTable('rate_limit', {
  id: text('id').primaryKey(),
  key: text('key').notNull().unique(),
  count: integer('count').notNull(),
  /** Epoch milliseconds. Past 2038 in seconds, so bigint rather than integer. */
  lastRequest: bigint('last_request', { mode: 'number' }).notNull(),
});

export const authSchema = { user, session, account, verification, rateLimit };
