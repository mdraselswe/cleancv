import { and, eq, inArray, isNull, lte } from 'drizzle-orm';
import { z } from 'zod';

import { CLOUD_SYNC, CLOUD_SYNC_UNLIMITED, MAX_DOCUMENTS } from '@/constants';
import {
  cvDocumentSchema,
  deletedDocumentSchema,
  type CvDocument,
  type DeletedDocument,
} from '@/features/library/schema';
import { checkCloudDocument, documentBytes, type CloudRefusal } from '@/lib/cloudSync';
import { getSessionUser } from '@/server/auth/session';
import { db } from '@/server/db';
import { isCloudUnlimited } from '@/server/env';
import { cvDocument } from '@/server/db/schema';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

/**
 * Marks a tombstone as "stopped syncing" rather than "deleted".
 *
 * Kept in `personName`, which is unused on a tombstone, so no migration is
 * needed. The distinction matters to the reader's other devices: a deleted CV
 * is removed from them, a CV that merely stopped syncing stays where it is and
 * simply goes back to being theirs alone.
 */
const UNSYNCED_MARK = 'unsynced';

const syncRequestSchema = z.object({
  documents: z.array(cvDocumentSchema).max(MAX_DOCUMENTS),
  deleted: z.array(deletedDocumentSchema).max(MAX_DOCUMENTS * 2),
  /** CVs the reader chose to stop keeping on the server. */
  unsync: z
    .array(z.string().min(1))
    .max(MAX_DOCUMENTS)
    .default([]),
  /** Initial/manual sync pulls the canonical library; autosaves only push deltas. */
  pull: z.boolean().default(true),
});

const unauthorized = () =>
  Response.json({ error: 'Sign in to sync CVs across your devices.' }, { status: 401 });

/**
 * Merge the CVs a browser chose to sync into the account's cloud copies.
 *
 * Opt-in and capped: only CVs the reader switched on arrive here, and the
 * account keeps at most `CLOUD_SYNC.maxDocuments` of them, each at most
 * `CLOUD_SYNC.maxBytes`. The cap is enforced here and not only in the browser,
 * because a limit that lives in the client is a suggestion.
 */
export async function POST(request: Request) {
  const user = await getSessionUser(request.headers, { fresh: true });
  if (!user) return unauthorized();

  let input: z.infer<typeof syncRequestSchema>;

  try {
    input = syncRequestSchema.parse(await request.json());
  } catch {
    return Response.json({ error: 'The CV sync payload is invalid.' }, { status: 400 });
  }

  const database = db();
  const now = Date.now();

  // A few named accounts are exempt; everyone else gets the standard allowance.
  const allowance = isCloudUnlimited(user.email) ? CLOUD_SYNC_UNLIMITED : CLOUD_SYNC;
  const limits = { documents: allowance.maxDocuments, bytes: allowance.maxBytes };

  // Which CVs hold a place right now. A tombstone holds none.
  const live = new Set(
    (
      await database
        .select({ id: cvDocument.id })
        .from(cvDocument)
        .where(and(eq(cvDocument.userId, user.id), isNull(cvDocument.deletedAt)))
    ).map((row) => row.id),
  );

  // Stopping first, so the place it frees can be taken by a CV in this request.
  if (input.unsync.length > 0) {
    await database
      .update(cvDocument)
      .set({ resume: null, name: '', personName: UNSYNCED_MARK, updatedAt: now, deletedAt: now })
      .where(and(eq(cvDocument.userId, user.id), inArray(cvDocument.id, input.unsync)));

    for (const id of input.unsync) live.delete(id);
  }

  const rejected: Array<{ id: string; reason: CloudRefusal }> = [];

  for (const document of input.documents) {
    const { meta, resume } = document;
    const refusal = checkCloudDocument({
      bytes: documentBytes(resume),
      alreadySynced: live.has(meta.id),
      syncedCount: live.size,
      limits,
    });

    if (refusal) {
      rejected.push({ id: meta.id, reason: refusal });
      continue;
    }

    await database
      .insert(cvDocument)
      .values({
        id: meta.id,
        userId: user.id,
        name: meta.name,
        personName: meta.personName,
        resume,
        createdAt: meta.createdAt,
        updatedAt: meta.updatedAt,
        deletedAt: null,
      })
      .onConflictDoUpdate({
        target: [cvDocument.userId, cvDocument.id],
        set: {
          name: meta.name,
          personName: meta.personName,
          resume,
          createdAt: meta.createdAt,
          updatedAt: meta.updatedAt,
          deletedAt: null,
        },
        setWhere: lte(cvDocument.updatedAt, meta.updatedAt),
      });

    live.add(meta.id);
  }

  for (const deletion of input.deleted) {
    await database
      .insert(cvDocument)
      .values({
        id: deletion.id,
        userId: user.id,
        name: '',
        personName: '',
        resume: null,
        createdAt: deletion.deletedAt,
        updatedAt: deletion.deletedAt,
        deletedAt: deletion.deletedAt,
      })
      .onConflictDoUpdate({
        target: [cvDocument.userId, cvDocument.id],
        set: {
          resume: null,
          personName: '',
          updatedAt: deletion.deletedAt,
          deletedAt: deletion.deletedAt,
        },
        setWhere: lte(cvDocument.updatedAt, deletion.deletedAt),
      });
  }

  const rows = input.pull
    ? await database.select().from(cvDocument).where(eq(cvDocument.userId, user.id))
    : [];

  const documents: CvDocument[] = [];
  const deleted: DeletedDocument[] = [];
  const unsynced: string[] = [];

  for (const row of rows) {
    if (row.deletedAt) {
      if (row.personName === UNSYNCED_MARK) unsynced.push(row.id);
      else deleted.push({ id: row.id, deletedAt: row.deletedAt });
      continue;
    }

    const parsed = cvDocumentSchema.safeParse({
      meta: {
        id: row.id,
        name: row.name,
        personName: row.personName,
        createdAt: row.createdAt,
        updatedAt: row.updatedAt,
        cloud: true,
      },
      resume: row.resume,
    });

    if (parsed.success) documents.push(parsed.data);
  }

  return Response.json({
    documents,
    deleted,
    unsynced,
    rejected,
    syncedAt: now,
    limits,
  });
}
