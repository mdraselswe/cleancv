import { CLOUD_SYNC } from '@/constants';

/** What an account may keep on the server: how many CVs, and how large each. */
export interface CloudLimits {
  documents: number;
  bytes: number;
}

export const DEFAULT_CLOUD_LIMITS: CloudLimits = {
  documents: CLOUD_SYNC.maxDocuments,
  bytes: CLOUD_SYNC.maxBytes,
};

/**
 * The rules for what an account may keep on the server, as pure functions.
 *
 * Shared by the route that enforces them and the editor that explains them, so
 * "this CV is too large" means the same number in both places. The browser
 * checks first to be kind; the server checks again because the browser is not
 * a place to keep a limit.
 */

export type CloudRefusal = 'too_large' | 'limit_reached';

/** The size a CV occupies on the server: its JSON, in bytes. */
export const documentBytes = (resume: unknown): number =>
  new TextEncoder().encode(JSON.stringify(resume ?? null)).length;

export interface CloudCheckInput {
  bytes: number;
  /** This CV already has a copy on the server, so keeping it takes no new place. */
  alreadySynced: boolean;
  /** How many CVs the account keeps on the server right now. */
  syncedCount: number;
  /** This account's allowance; the standard one when absent. */
  limits?: CloudLimits;
}

export const checkCloudDocument = ({
  bytes,
  alreadySynced,
  syncedCount,
  limits = DEFAULT_CLOUD_LIMITS,
}: CloudCheckInput): CloudRefusal | null => {
  if (bytes > limits.bytes) return 'too_large';
  if (!alreadySynced && syncedCount >= limits.documents) return 'limit_reached';

  return null;
};

export const CLOUD_REFUSAL_MESSAGE: Record<CloudRefusal, string> = {
  too_large: `This CV is over ${CLOUD_SYNC.maxBytes / 1024} KB, usually because of a large photo. It stays on this device only. Use a smaller photo to sync it.`,
  limit_reached: `You already sync ${CLOUD_SYNC.maxDocuments} CVs. Stop syncing one to choose this one.`,
};
