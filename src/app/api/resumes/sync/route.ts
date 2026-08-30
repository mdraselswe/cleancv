import { eq, lte } from 'drizzle-orm';
import { z } from 'zod';

import { MAX_DOCUMENTS } from '@/constants';
import {
  cvDocumentSchema,
  deletedDocumentSchema,
  type CvDocument,
  type DeletedDocument,
} from '@/features/library/schema';
import { getSessionUser } from '@/server/auth/session';
import { db } from '@/server/db';
import { cvDocument } from '@/server/db/schema';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

const syncRequestSchema = z.object({
  documents: z.array(cvDocumentSchema).max(MAX_DOCUMENTS),
  deleted: z.array(deletedDocumentSchema).max(MAX_DOCUMENTS * 2),
  /** Initial/manual sync pulls the canonical library; autosaves only push deltas. */
  pull: z.boolean().default(true),
});

const unauthorized = () =>
  Response.json({ error: 'Sign in to sync CVs across your devices.' }, { status: 401 });

/** Merge a browser's local library into its owner's canonical cloud library. */
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

  for (const document of input.documents) {
    const { meta, resume } = document;

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

  for (const row of rows) {
    if (row.deletedAt) {
      deleted.push({ id: row.id, deletedAt: row.deletedAt });
      continue;
    }

    const parsed = cvDocumentSchema.safeParse({
      meta: {
        id: row.id,
        name: row.name,
        personName: row.personName,
        createdAt: row.createdAt,
        updatedAt: row.updatedAt,
      },
      resume: row.resume,
    });

    if (parsed.success) documents.push(parsed.data);
  }

  return Response.json({ documents, deleted, syncedAt: Date.now() });
}
