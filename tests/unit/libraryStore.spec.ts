import { beforeEach, describe, expect, it, vi } from 'vitest';

import { STORAGE_KEYS } from '@/constants';

/**
 * The library store against an in-memory IndexedDB.
 *
 * Mocking `@/lib/idb` rather than pulling in a fake-indexeddb dependency keeps
 * the boundary honest: these tests are about the library's sequencing — booting
 * once, keeping documents apart, not overwriting newer work — not about whether
 * IndexedDB itself works.
 */

const store = new Map<string, unknown>();

vi.mock('@/lib/idb', () => ({
  idbGet: async (key: string) => store.get(key),
  idbSet: async (key: string, value: unknown) => {
    // The real store round-trips through structured clone, which is what
    // catches a value being mutated in place after it was "saved".
    store.set(key, JSON.parse(JSON.stringify(value)));
  },
  idbDelete: async (key: string) => {
    store.delete(key);
  },
  idbKeys: async () => [...store.keys()],
  idbAvailable: async () => true,
}));

const localStorageStub = () => {
  const values = new Map<string, string>();

  return {
    getItem: (key: string) => values.get(key) ?? null,
    setItem: (key: string, value: string) => values.set(key, value),
    removeItem: (key: string) => values.delete(key),
  };
};

/**
 * A library that has never booted.
 *
 * The boot guard is module state by design — one page load, one boot — so a
 * test that needs a fresh one has to reload the module rather than reach into
 * it through an export that exists only for tests.
 */
const freshLibrary = async () => {
  store.clear();
  vi.stubGlobal('localStorage', localStorageStub());
  vi.resetModules();

  const [{ useLibraryStore }, { useResumeStore }] = await Promise.all([
    import('@/features/library'),
    import('@/features/resume'),
  ]);

  return { useLibraryStore, useResumeStore };
};

describe('library boot', () => {
  it('creates exactly one document on a first visit', async () => {
    const { useLibraryStore } = await freshLibrary();
    await useLibraryStore.getState().actions.boot();

    expect(useLibraryStore.getState().status).toBe('ready');
    expect(useLibraryStore.getState().documents).toHaveLength(1);
  });

  it('creates one document when boot is called twice at once', async () => {
    // A double-invoked effect used to produce two "My CV" entries three
    // milliseconds apart, because each run read an empty library.
    const { useLibraryStore } = await freshLibrary();
    const { actions } = useLibraryStore.getState();

    await Promise.all([actions.boot(), actions.boot()]);

    expect(useLibraryStore.getState().documents).toHaveLength(1);
  });

  it('moves a pre-library resume in as the first document', async () => {
    const { useLibraryStore, useResumeStore } = await freshLibrary();
    localStorage.setItem(
      STORAGE_KEYS.legacyResume,
      JSON.stringify({ state: { resume: { basics: { fullName: 'Muhammad Rasel' } } } }),
    );

    await useLibraryStore.getState().actions.boot();

    const documents = useLibraryStore.getState().documents;
    expect(documents).toHaveLength(1);
    expect(documents[0].personName).toBe('Muhammad Rasel');
    // The old key is cleared, so a later boot cannot migrate it a second time.
    expect(localStorage.getItem(STORAGE_KEYS.legacyResume)).toBeNull();
    expect(useResumeStore.getState().resume.basics.fullName).toBe('Muhammad Rasel');
  });

  it('reopens the document that was active last time', async () => {
    const first = await freshLibrary();
    await first.useLibraryStore.getState().actions.boot();
    await first.useLibraryStore.getState().actions.createNew('Second CV');
    const expected = first.useLibraryStore.getState().activeId;

    // Same storage, new page load.
    vi.resetModules();
    const { useLibraryStore } = await import('@/features/library');
    await useLibraryStore.getState().actions.boot();

    expect(useLibraryStore.getState().activeId).toBe(expected);
    expect(useLibraryStore.getState().documents).toHaveLength(2);
  });

  it('recovers a document that is in storage but missing from the index', async () => {
    const { useLibraryStore } = await freshLibrary();
    await useLibraryStore.getState().actions.boot();
    await useLibraryStore.getState().actions.createNew('Orphan');

    // A crash between the two writes leaves the document stranded.
    const index = store.get('library:index') as { documents: unknown[] };
    store.set('library:index', { ...index, documents: [index.documents[0]] });

    vi.resetModules();
    const reloaded = (await import('@/features/library')).useLibraryStore;
    await reloaded.getState().actions.boot();

    expect(reloaded.getState().documents).toHaveLength(2);
  });
});

describe('library documents', () => {
  let library: Awaited<ReturnType<typeof freshLibrary>>;

  beforeEach(async () => {
    library = await freshLibrary();
    await library.useLibraryStore.getState().actions.boot();
  });

  const setName = async (fullName: string) => {
    library.useResumeStore.getState().actions.edit((draft) => {
      draft.basics.fullName = fullName;
    });
    await library.useLibraryStore
      .getState()
      .actions.save(library.useResumeStore.getState().resume);
  };

  it('opens a new CV without disturbing the previous one', async () => {
    const { useLibraryStore, useResumeStore } = library;
    await setName('First Person');

    const firstId = useLibraryStore.getState().activeId;
    await useLibraryStore.getState().actions.createNew('Second CV');

    expect(useResumeStore.getState().resume.basics.fullName).toBe('');

    await useLibraryStore.getState().actions.open(firstId);
    expect(useResumeStore.getState().resume.basics.fullName).toBe('First Person');
  });

  it('duplicates a CV without linking the copy to the original', async () => {
    const { useLibraryStore, useResumeStore } = library;
    await setName('Original');

    const originalId = useLibraryStore.getState().activeId;
    await useLibraryStore.getState().actions.duplicate(originalId);

    const documents = useLibraryStore.getState().documents;
    expect(documents).toHaveLength(2);

    const copyId = documents.find((entry) => entry.id !== originalId)!.id;
    await useLibraryStore.getState().actions.open(copyId);
    await setName('Changed in the copy');

    await useLibraryStore.getState().actions.open(originalId);
    expect(useResumeStore.getState().resume.basics.fullName).toBe('Original');
  });

  it('always leaves one document behind when the last is deleted', async () => {
    const { useLibraryStore } = library;
    await useLibraryStore.getState().actions.remove(useLibraryStore.getState().activeId);

    expect(useLibraryStore.getState().documents).toHaveLength(1);
    expect(useLibraryStore.getState().activeId).toBeTruthy();
  });

  it('restores a backup without overwriting newer local work', async () => {
    const { useLibraryStore, useResumeStore } = library;
    await setName('Newer local edit');

    const id = useLibraryStore.getState().activeId;
    const stale = {
      meta: { ...useLibraryStore.getState().documents[0], updatedAt: 1 },
      resume: {
        ...useResumeStore.getState().resume,
        basics: {
          ...useResumeStore.getState().resume.basics,
          fullName: 'Older backup',
        },
      },
    };

    expect(await useLibraryStore.getState().actions.importDocuments([stale])).toBe(0);

    await useLibraryStore.getState().actions.open(id);
    expect(useResumeStore.getState().resume.basics.fullName).toBe('Newer local edit');
  });

  it('accepts a backup document that is newer than the local copy', async () => {
    const { useLibraryStore, useResumeStore } = library;
    const incoming = {
      meta: {
        id: 'cv_from_backup',
        name: 'From a folder',
        personName: 'Someone Else',
        createdAt: 1,
        updatedAt: Date.now() + 1000,
      },
      resume: useResumeStore.getState().resume,
    };

    expect(await useLibraryStore.getState().actions.importDocuments([incoming])).toBe(1);
    expect(useLibraryStore.getState().documents).toHaveLength(2);
  });
});
