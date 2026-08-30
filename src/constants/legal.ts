/** The two published documents: who to write to, and when they last changed. */

/**
 * Where a reader asks a question or makes a request about their data.
 *
 * One constant, because both documents print it and Google's consent screen
 * quotes it — three copies of an address is two that go stale.
 */
export const LEGAL_CONTACT_EMAIL = 'rrasel141@gmail.com';

/** The person or entity behind the service, as named in both documents. */
export const LEGAL_ENTITY = 'Muhammad Rasel';

/**
 * When these last changed, in ISO form.
 *
 * Update it in the same commit that changes the wording — a policy whose date
 * never moves tells a reader it has never been reviewed, which is either untrue
 * or worth knowing.
 */
export const LEGAL_UPDATED = '2026-08-31';

export const LEGAL_ROUTES = {
  privacy: '/privacy',
  terms: '/terms',
} as const;

/**
 * How long an account's rows survive after it is deleted.
 *
 * Stated in the policy, so it is a promise rather than a habit.
 */
export const ACCOUNT_DELETION_DAYS = 30;
