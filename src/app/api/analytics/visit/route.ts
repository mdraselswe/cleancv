import { createHash } from 'node:crypto';

import { sql } from 'drizzle-orm';
import { NextResponse } from 'next/server';
import { z } from 'zod';

import { getSessionUser } from '@/server/auth/session';
import { db } from '@/server/db';
import { anonymousVisitor } from '@/server/db/schema';

const requestSchema = z.object({ visitorId: z.uuid() });

export async function POST(request: Request) {
  const body: unknown = await request.json().catch(() => null);
  const parsed = requestSchema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: 'Invalid visitor ID.' }, { status: 400 });

  if (await getSessionUser()) return NextResponse.json({ recorded: false });

  const idHash = createHash('sha256').update(parsed.data.visitorId).digest('hex');
  const now = new Date();

  await db()
    .insert(anonymousVisitor)
    .values({ idHash, firstSeenAt: now, lastSeenAt: now, visitCount: 1 })
    .onConflictDoUpdate({
      target: anonymousVisitor.idHash,
      set: { lastSeenAt: now, visitCount: sql`${anonymousVisitor.visitCount} + 1` },
    });

  return NextResponse.json({ recorded: true });
}
