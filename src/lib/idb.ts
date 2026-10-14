/**
 * A very small IndexedDB key-value store.
 *
 * localStorage is capped around 5 MB, and a photo plus a signature can be most
 * of a megabyte per document as data URLs — a handful of CVs would fill it and
 * start throwing on write. IndexedDB has no practical cap and stores structured
 * values directly, which also means it can hold a directory handle for the
 * workspace folder.
 *
 * Hand-rolled rather than a dependency: this is the whole API surface the app
 * needs, and it keeps `lib/` free of anything that could pull in React.
 */

const DB_NAME = 'cv-maker';
const DB_VERSION = 1;
const STORE = 'kv';

/**
 * How long to wait for a connection before giving up.
 *
 * `indexedDB.open` can hang indefinitely rather than fail — another tab holding
 * an older version open, or a pending `deleteDatabase`, simply queues the
 * request. Without a deadline the app waits on it forever and the user sees a
 * loading message that never resolves, which is worse than being told storage
 * is unavailable.
 */
const OPEN_TIMEOUT_MS = 5000;

let connection: Promise<IDBDatabase> | null = null;

const open = (): Promise<IDBDatabase> => {
  if (connection) return connection;

  connection = new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, DB_VERSION);
    const deadline = setTimeout(
      () => reject(new Error('IndexedDB সাড়া দেয়নি — অন্য কোনো ট্যাবে এটি খোলা থাকতে পারে')),
      OPEN_TIMEOUT_MS,
    );

    const settle = <T>(finish: (value: T) => void) => (value: T) => {
      clearTimeout(deadline);
      finish(value);
    };

    request.onupgradeneeded = () => {
      if (!request.result.objectStoreNames.contains(STORE)) {
        request.result.createObjectStore(STORE);
      }
    };

    request.onsuccess = () => {
      const db = request.result;

      /*
       * Yield the connection when another context needs to upgrade or delete
       * the database. This one is cached for the life of the page, so without
       * releasing it here a second tab's upgrade — or a user clearing their
       * data — would block forever with no error to show for it.
       */
      db.onversionchange = () => {
        db.close();
        connection = null;
      };

      settle(resolve)(db);
    };
    request.onerror = () =>
      settle(reject)(request.error ?? new Error('IndexedDB পাওয়া যাচ্ছে না'));
    // Another tab is holding an older version open.
    request.onblocked = () => settle(reject)(new Error('অন্য একটি ট্যাব ডেটাবেস আপগ্রেড করছে'));
  });

  // A failed connection must not be cached, or every later call fails with it.
  connection.catch(() => {
    connection = null;
  });

  return connection;
};

const run = async <T>(
  mode: IDBTransactionMode,
  action: (store: IDBObjectStore) => IDBRequest,
): Promise<T> => {
  const db = await open();

  return new Promise<T>((resolve, reject) => {
    const transaction = db.transaction(STORE, mode);
    const request = action(transaction.objectStore(STORE));

    request.onsuccess = () => resolve(request.result as T);
    request.onerror = () => reject(request.error ?? new Error('IndexedDB-র অনুরোধ ব্যর্থ হয়েছে'));
  });
};

export const idbGet = <T>(key: string): Promise<T | undefined> =>
  run<T | undefined>('readonly', (store) => store.get(key));

export const idbSet = (key: string, value: unknown): Promise<void> =>
  run<void>('readwrite', (store) => store.put(value, key));

export const idbDelete = (key: string): Promise<void> =>
  run<void>('readwrite', (store) => store.delete(key));

export const idbKeys = (): Promise<string[]> =>
  run<string[]>('readonly', (store) => store.getAllKeys() as IDBRequest<string[]>);

/**
 * Whether IndexedDB can actually be used.
 *
 * Private windows and hardened privacy settings expose the API and then fail on
 * open, so callers need a real answer before choosing a storage path.
 */
export const idbAvailable = async (): Promise<boolean> => {
  if (typeof indexedDB === 'undefined') return false;

  try {
    await open();

    return true;
  } catch {
    return false;
  }
};
