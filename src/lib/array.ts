/** Immutable list helpers used by every repeatable editor section. */

export const insertAt = <T>(list: readonly T[], index: number, item: T): T[] => {
  const next = [...list];
  next.splice(Math.max(0, Math.min(index, list.length)), 0, item);

  return next;
};

export const removeAt = <T>(list: readonly T[], index: number): T[] =>
  list.filter((_, current) => current !== index);

export const replaceAt = <T>(list: readonly T[], index: number, item: T): T[] =>
  list.map((current, position) => (position === index ? item : current));

export const updateAt = <T>(list: readonly T[], index: number, patch: Partial<T>): T[] =>
  list.map((current, position) => (position === index ? { ...current, ...patch } : current));

/** Moves an item, clamping both ends so a drag past the edge is a no-op. */
export const moveItem = <T>(list: readonly T[], from: number, to: number): T[] => {
  if (from === to || from < 0 || from >= list.length) return [...list];

  const next = [...list];
  const [item] = next.splice(from, 1);
  next.splice(Math.max(0, Math.min(to, next.length)), 0, item);

  return next;
};

export const removeById = <T extends { id: string }>(list: readonly T[], id: string): T[] =>
  list.filter((item) => item.id !== id);

export const updateById = <T extends { id: string }>(
  list: readonly T[],
  id: string,
  patch: Partial<T>,
): T[] => list.map((item) => (item.id === id ? { ...item, ...patch } : item));

export const indexById = <T extends { id: string }>(list: readonly T[], id: string): number =>
  list.findIndex((item) => item.id === id);

/** Stable de-duplication, case-insensitive, preserving the first spelling seen. */
export const uniqueStrings = (values: readonly string[]): string[] => {
  const seen = new Set<string>();

  return values.filter((value) => {
    const key = value.trim().toLowerCase();
    if (!key || seen.has(key)) return false;
    seen.add(key);

    return true;
  });
};
