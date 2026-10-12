import { CLOUD_SYNC } from '@/constants';

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
}

export const checkCloudDocument = ({
  bytes,
  alreadySynced,
  syncedCount,
}: CloudCheckInput): CloudRefusal | null => {
  if (bytes > CLOUD_SYNC.maxBytes) return 'too_large';
  if (!alreadySynced && syncedCount >= CLOUD_SYNC.maxDocuments) return 'limit_reached';

  return null;
};

export const CLOUD_REFUSAL_MESSAGE: Record<CloudRefusal, string> = {
  too_large: `This CV is over ${CLOUD_SYNC.maxBytes / 1024} KB, usually because of a large photo. It stays on this device only. Use a smaller photo to sync it.`,
  limit_reached: `You already sync ${CLOUD_SYNC.maxDocuments} CVs. Stop syncing one to choose this one.`,
};
