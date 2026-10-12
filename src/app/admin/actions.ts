'use server';

import { revalidatePath } from 'next/cache';
import { notFound } from 'next/navigation';

import { getSessionUser } from '@/server/auth/session';
import {
  deleteCloudCopies,
  inactiveCutoff,
  listCloudAccounts,
} from '@/server/admin/cloudCopies';
import { serverEnv } from '@/server/env';

/**
 * Admin-only, and checked here rather than trusted from the page that renders
 * the button: a server action is a public endpoint, and a form on a page only
 * the owner can open is not a lock on it.
 */
const requireOwner = async (): Promise<void> => {
  const owner = serverEnv().ADMIN_EMAIL?.toLowerCase();
  const current = await getSessionUser(undefined, { fresh: true });

  if (!owner || !current || current.email.toLowerCase() !== owner) notFound();
};

/** One account's server copies. */
export async function deleteAccountCloudCopies(formData: FormData): Promise<void> {
  await requireOwner();

  const userId = String(formData.get('userId') ?? '');
  if (userId) await deleteCloudCopies([userId]);

  revalidatePath('/admin');
}

/**
 * Every account inactive past the cutoff. The list is recomputed here, on the
 * server, at the moment of the click — never taken from the form, so an
 * account that signed in a minute ago is not swept up by a stale page.
 */
export async function deleteInactiveCloudCopies(): Promise<void> {
  await requireOwner();

  const cutoff = inactiveCutoff(Date.now());
  const stale = (await listCloudAccounts()).filter((account) => account.lastActiveAt < cutoff);

  await deleteCloudCopies(stale.map((account) => account.id));
  revalidatePath('/admin');
}
