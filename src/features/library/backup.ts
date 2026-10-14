import { LIBRARY_SCHEMA_VERSION } from '@/constants';

import { backupFileSchema, type BackupFile, type CvDocument } from './schema';

/**
 * A whole-library backup: every CV in one file.
 *
 * This is the fallback for browsers without a workspace folder, and the thing
 * to hand someone who is moving to a new machine. It is deliberately the same
 * document shape the folder writes, so a backup and a workspace file are
 * readable by the same parser.
 */

export const buildBackup = (documents: CvDocument[]): BackupFile => ({
  kind: 'cv-maker.backup',
  version: LIBRARY_SCHEMA_VERSION,
  exportedAt: Date.now(),
  documents,
});

export const serializeBackup = (documents: CvDocument[]): string =>
  JSON.stringify(buildBackup(documents), null, 2);

export const backupFilename = (): string => {
  const stamp = new Date().toISOString().slice(0, 10);

  return `cv-maker-backup-${stamp}.json`;
};

export interface BackupReadResult {
  ok: boolean;
  documents: CvDocument[];
  error?: string;
}

/**
 * Reads a backup file, and also accepts a single exported resume.
 *
 * Someone restoring after losing their data will reach for whatever file they
 * have; refusing the older single-resume export because the wrapper is missing
 * would be pedantic at the worst possible moment.
 */
export const parseBackup = (contents: string): BackupReadResult => {
  let raw: unknown;

  try {
    raw = JSON.parse(contents);
  } catch {
    return { ok: false, documents: [], error: 'ফাইলটি সঠিক JSON নয়।' };
  }

  const backup = backupFileSchema.safeParse(raw);
  if (backup.success && backup.data.documents.length > 0) {
    return { ok: true, documents: backup.data.documents };
  }

  return {
    ok: false,
    documents: [],
    error:
      'ফাইলটিতে কোনো ডকুমেন্ট পাওয়া যায়নি। এই অ্যাপ থেকে এক্সপোর্ট করা ব্যাকআপ ব্যবহার করুন, অথবা টুলবার থেকে একটি CV ইমপোর্ট করুন।',
  };
};
