/**
 * CVs the reader stopped syncing, waiting for the server to be told.
 *
 * A module-level set rather than state: nothing renders from it, and both the
 * library (which records the choice) and the sync loop (which sends it) need
 * the same one without importing each other.
 */
const pending = new Set<string>();

export const queueUnsync = (id: string): void => {
  pending.add(id);
};

export const takeUnsync = (): string[] => [...pending];

export const clearUnsync = (ids: readonly string[]): void => {
  for (const id of ids) pending.delete(id);
};
