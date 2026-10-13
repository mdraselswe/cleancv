import { describe, expect, it } from 'vitest';

import { CLOUD_SYNC } from '@/constants';
import { checkCloudDocument, documentBytes } from '@/lib/cloudSync';

describe('checkCloudDocument', () => {
  const small = 10 * 1024;

  it('allows a small CV into a free place', () => {
    expect(checkCloudDocument({ bytes: small, alreadySynced: false, syncedCount: 0 })).toBeNull();
  });

  it('refuses a fourth CV', () => {
    expect(
      checkCloudDocument({
        bytes: small,
        alreadySynced: false,
        syncedCount: CLOUD_SYNC.maxDocuments,
      }),
    ).toBe('limit_reached');
  });

  it('lets a CV that already has its place keep it', () => {
    expect(
      checkCloudDocument({
        bytes: small,
        alreadySynced: true,
        syncedCount: CLOUD_SYNC.maxDocuments,
      }),
    ).toBeNull();
  });

  it('refuses a CV over the size ceiling, synced or not', () => {
    const big = CLOUD_SYNC.maxBytes + 1;

    expect(checkCloudDocument({ bytes: big, alreadySynced: false, syncedCount: 0 })).toBe(
      'too_large',
    );
    expect(checkCloudDocument({ bytes: big, alreadySynced: true, syncedCount: 1 })).toBe(
      'too_large',
    );
  });
});

describe('documentBytes', () => {
  it('counts UTF-8 bytes, not characters', () => {
    expect(documentBytes('é')).toBe(JSON.stringify('é').length + 1);
  });
});

describe('checkCloudDocument with an account allowance', () => {
  const unlimited = { documents: 50, bytes: 2 * 1024 * 1024 };

  it('lets a named account keep more than the standard three', () => {
    expect(checkCloudDocument({ bytes: 1000, alreadySynced: false, syncedCount: 3 })).toBe(
      'limit_reached',
    );
    expect(
      checkCloudDocument({ bytes: 1000, alreadySynced: false, syncedCount: 3, limits: unlimited }),
    ).toBeNull();
  });

  it('lets it keep a larger CV, but not an unbounded one', () => {
    expect(
      checkCloudDocument({ bytes: 500 * 1024, alreadySynced: true, syncedCount: 1, limits: unlimited }),
    ).toBeNull();
    expect(
      checkCloudDocument({ bytes: 3 * 1024 * 1024, alreadySynced: true, syncedCount: 1, limits: unlimited }),
    ).toBe('too_large');
  });
});
