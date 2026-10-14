import { desc } from 'drizzle-orm';
import {
  Activity,
  ArrowLeft,
  CalendarDays,
  CheckCircle2,
  Cloud,
  ExternalLink,
  UserRoundX,
  Users,
} from 'lucide-react';
import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound, redirect } from 'next/navigation';

import { APP_NAME, AUTH_ROUTES, CLOUD_SYNC, REDIRECT_PARAM, ROUTES } from '@/constants';
import { inactiveCutoff, listCloudAccounts } from '@/server/admin/cloudCopies';
import { getSessionUser } from '@/server/auth/session';
import { db } from '@/server/db';
import { anonymousVisitor, cvDocument, session, user as userTable } from '@/server/db/schema';
import { serverEnv } from '@/server/env';
import { bn } from '@/lib/bn';

import { deleteAccountCloudCopies, deleteInactiveCloudCopies } from './actions';
import { ConfirmSubmit } from './ConfirmSubmit';

export const metadata: Metadata = {
  title: `ব্যবহারের ড্যাশবোর্ড — ${APP_NAME}`,
  robots: { index: false, follow: false },
};

export const dynamic = 'force-dynamic';

const DAY_MS = 24 * 60 * 60 * 1000;

const formatDate = (value: Date | number): string =>
  new Intl.DateTimeFormat('bn-BD', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  }).format(value);

const formatDateTime = (value: number): string =>
  new Intl.DateTimeFormat('bn-BD', {
    day: '2-digit',
    month: 'short',
    hour: '2-digit',
    minute: '2-digit',
  }).format(value);

export default async function AdminPage() {
  const ownerEmail = serverEnv().ADMIN_EMAIL?.toLowerCase();
  if (!ownerEmail) notFound();

  const currentUser = await getSessionUser();
  if (!currentUser) {
    redirect(
      `${AUTH_ROUTES.signIn}?${REDIRECT_PARAM}=${encodeURIComponent('/admin')}`,
    );
  }
  if (currentUser.email.toLowerCase() !== ownerEmail) notFound();

  const database = db();
  const [cloudAccounts, users, sessions, documents, guests] = await Promise.all([
    listCloudAccounts(),
    database
      .select({
        id: userTable.id,
        name: userTable.name,
        email: userTable.email,
        emailVerified: userTable.emailVerified,
        createdAt: userTable.createdAt,
        updatedAt: userTable.updatedAt,
      })
      .from(userTable)
      .orderBy(desc(userTable.createdAt)),
    database.select({ userId: session.userId, updatedAt: session.updatedAt }).from(session),
    database
      .select({
        userId: cvDocument.userId,
        updatedAt: cvDocument.updatedAt,
        deletedAt: cvDocument.deletedAt,
      })
      .from(cvDocument),
    database.select().from(anonymousVisitor).orderBy(desc(anonymousVisitor.lastSeenAt)),
  ]);

  const sessionActivity = new Map<string, number>();
  for (const row of sessions) {
    sessionActivity.set(
      row.userId,
      Math.max(sessionActivity.get(row.userId) ?? 0, row.updatedAt.getTime()),
    );
  }

  const cvActivity = new Map<string, number>();
  const cvCounts = new Map<string, number>();
  for (const row of documents) {
    cvActivity.set(row.userId, Math.max(cvActivity.get(row.userId) ?? 0, row.updatedAt));
    if (!row.deletedAt) cvCounts.set(row.userId, (cvCounts.get(row.userId) ?? 0) + 1);
  }

  const rows = users
    .map((user) => ({
      ...user,
      cvCount: cvCounts.get(user.id) ?? 0,
      lastActiveAt: Math.max(
        user.updatedAt.getTime(),
        sessionActivity.get(user.id) ?? 0,
        cvActivity.get(user.id) ?? 0,
      ),
    }))
    .sort((a, b) => b.lastActiveAt - a.lastActiveAt);

  // This is a dynamic server page; activity windows intentionally use request time.
  // eslint-disable-next-line react-hooks/purity
  const now = Date.now();
  const inactiveRows = cloudAccounts.filter((row) => row.lastActiveAt < inactiveCutoff(now));
  const verified = rows.filter((user) => user.emailVerified).length;
  const activeToday = rows.filter((user) => now - user.lastActiveAt <= DAY_MS).length;
  const activeMonth = rows.filter((user) => now - user.lastActiveAt <= 30 * DAY_MS).length;
  const syncedCvs = rows.reduce((total, user) => total + user.cvCount, 0);
  const guestActiveToday = guests.filter(
    (guest) => now - guest.lastSeenAt.getTime() <= DAY_MS,
  ).length;
  const guestActiveMonth = guests.filter(
    (guest) => now - guest.lastSeenAt.getTime() <= 30 * DAY_MS,
  ).length;
  const anonymousVisits = guests.reduce((total, guest) => total + guest.visitCount, 0);

  return (
    <main className="bg-bg min-h-dvh px-4 py-6 sm:px-6 sm:py-10">
      <div className="mx-auto flex w-full max-w-6xl flex-col gap-6">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <Link
            href={ROUTES.editor}
            className="text-fg-muted hover:text-fg text-ui-md inline-flex items-center gap-1.5 font-medium transition"
          >
            <ArrowLeft size={15} /> {APP_NAME}-এ ফিরে যান
          </Link>
          <a
            href="https://vercel.com/mdraselswes-projects/cleancv/analytics"
            target="_blank"
            rel="noreferrer"
            className="border-border-base bg-surface text-fg hover:border-primary/40 rounded-control text-ui inline-flex items-center gap-1.5 border px-3 py-2 font-medium shadow-sm transition"
          >
            নামহীন ট্রাফিক <ExternalLink size={13} />
          </a>
        </div>

        <header className="border-primary/15 bg-gradient-to-br from-primary-soft via-surface to-accent-soft rounded-panel border p-5 shadow-app sm:p-7">
          <p className="text-primary text-ui-xs font-bold">ব্যক্তিগত</p>
          <h1 className="text-fg mt-1 text-2xl font-bold tracking-tight sm:text-3xl">
            CleanCV-র ব্যবহার
          </h1>
          <p className="text-fg-muted text-ui-md mt-1">
            নিবন্ধিত অ্যাকাউন্ট ও ক্লাউডের কার্যকলাপ। অতিথি ভিজিটররা নামহীন থাকে।
          </p>
        </header>

        <section className="grid grid-cols-2 gap-3 lg:grid-cols-4">
          <Stat icon={<UserRoundX size={17} />} label="নামহীন ব্যবহারকারী" value={guests.length} />
          <Stat icon={<Activity size={17} />} label="আজকের অতিথি" value={guestActiveToday} />
          <Stat icon={<CalendarDays size={17} />} label="৩০ দিনের অতিথি" value={guestActiveMonth} />
          <Stat icon={<Activity size={17} />} label="অতিথির ভিজিট" value={anonymousVisits} />
        </section>

        <section className="grid grid-cols-2 gap-3 lg:grid-cols-5">
          <Stat icon={<Users size={17} />} label="নিবন্ধিত" value={rows.length} />
          <Stat icon={<CheckCircle2 size={17} />} label="যাচাইকৃত" value={verified} />
          <Stat icon={<Activity size={17} />} label="আজ সক্রিয়" value={activeToday} />
          <Stat icon={<CalendarDays size={17} />} label="৩০ দিনে সক্রিয়" value={activeMonth} />
          <Stat icon={<Cloud size={17} />} label="সিঙ্ক করা CV" value={syncedCvs} />
        </section>

        <section className="border-border-base bg-surface/90 rounded-panel overflow-hidden border shadow-app">
          <div className="border-border-base flex flex-wrap items-center justify-between gap-3 border-b px-4 py-3.5 sm:px-5">
            <div>
              <h2 className="text-fg text-ui-lg font-semibold">ক্লাউড কপি</h2>
              <p className="text-fg-subtle text-ui-xs">
                প্রতি অ্যাকাউন্টে {bn(CLOUD_SYNC.maxDocuments)}টি পর্যন্ত CV, প্রতিটি {bn(CLOUD_SYNC.maxBytes / 1024)} KB।
                কপি সরালে অ্যাকাউন্ট বা কারও নিজের ডিভাইসে কোনো প্রভাব পড়ে না।
              </p>
            </div>
            <div className="flex items-center gap-3">
              <span className="text-fg-muted text-ui-xs tabular-nums">
                {bn(cloudAccounts.length)}টি অ্যাকাউন্ট ·{' '}
                {bn((cloudAccounts.reduce((total, row) => total + row.bytes, 0) / 1024).toFixed(0))} KB
              </span>
              <form action={deleteInactiveCloudCopies}>
                <ConfirmSubmit
                  disabled={inactiveRows.length === 0}
                  message={`${bn(CLOUD_SYNC.inactiveMonths)}+ মাস নিষ্ক্রিয় ${bn(inactiveRows.length)}টি অ্যাকাউন্টের ক্লাউড CV মুছে ফেলবেন? এটি ফেরানো যাবে না। তাদের নিজের ডিভাইসে কপি থেকে যাবে।`}
                  className="bg-danger text-ui rounded-control px-3 py-1.5 font-semibold text-white transition hover:brightness-110 disabled:opacity-40"
                >
                  নিষ্ক্রিয় মুছুন ({bn(CLOUD_SYNC.inactiveMonths)}+ মাস): {bn(inactiveRows.length)}
                </ConfirmSubmit>
              </form>
            </div>
          </div>
          {cloudAccounts.length === 0 ? (
            <p className="text-fg-muted p-8 text-center text-sm">সার্ভারে কোনো CV রাখা নেই।</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full min-w-[640px] text-left text-sm">
                <thead className="bg-surface-2 text-fg-muted text-xs">
                  <tr>
                    <th className="px-4 py-2.5 font-semibold">অ্যাকাউন্ট</th>
                    <th className="px-4 py-2.5 font-semibold">শেষ সক্রিয়</th>
                    <th className="px-4 py-2.5 font-semibold">CV</th>
                    <th className="px-4 py-2.5 font-semibold">আকার</th>
                    <th className="px-4 py-2.5 text-right font-semibold">অ্যাকশন</th>
                  </tr>
                </thead>
                <tbody className="divide-border-base divide-y">
                  {cloudAccounts.map((account) => {
                    const stale = account.lastActiveAt < inactiveCutoff(now);

                    return (
                      <tr key={account.id}>
                        <td className="px-4 py-3">
                          <p className="text-fg font-medium">{account.name || 'নামহীন'}</p>
                          <p className="text-fg-subtle text-xs">{account.email}</p>
                        </td>
                        <td className="px-4 py-3">
                          <span className={stale ? 'text-danger font-semibold' : 'text-fg-muted'}>
                            {formatDate(account.lastActiveAt)}
                          </span>
                          {stale ? (
                            <span className="text-danger ml-2 text-xs">
                              {bn(CLOUD_SYNC.inactiveMonths)}+ মাস নিষ্ক্রিয়
                            </span>
                          ) : null}
                        </td>
                        <td className="text-fg px-4 py-3 tabular-nums">{bn(account.cvCount)}</td>
                        <td className="text-fg-muted px-4 py-3 tabular-nums">
                          {bn((account.bytes / 1024).toFixed(0))} KB
                        </td>
                        <td className="px-4 py-3 text-right">
                          <form action={deleteAccountCloudCopies}>
                            <input type="hidden" name="userId" value={account.id} />
                            <ConfirmSubmit
                              message={`${account.email}-এর ${bn(account.cvCount)}টি ক্লাউড CV মুছে ফেলবেন? এটি ফেরানো যাবে না। তাদের নিজের ডিভাইসে কপি থেকে যাবে।`}
                              className="border-danger/40 text-danger hover:bg-danger/10 rounded-control text-ui-xs border px-2.5 py-1 font-semibold transition"
                            >
                              ক্লাউড CV মুছুন
                            </ConfirmSubmit>
                          </form>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </section>

        <section className="border-border-base bg-surface/90 rounded-panel overflow-hidden border shadow-app">
          <div className="border-border-base flex items-center justify-between border-b px-4 py-3.5 sm:px-5">
            <div>
              <h2 className="text-fg text-ui-lg font-semibold">নামহীন ভিজিটর</h2>
              <p className="text-fg-subtle text-ui-xs">শুধু এলোমেলো ব্রাউজার আইডি — কোনো ব্যক্তিগত তথ্য নেই</p>
            </div>
            <span className="bg-accent-soft text-accent rounded-full px-2.5 py-1 text-xs font-bold">
              {bn(guests.length)}
            </span>
          </div>
          {guests.length === 0 ? (
            <p className="text-fg-muted p-8 text-center text-sm">এখনো কোনো নামহীন ভিজিট রেকর্ড হয়নি।</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full min-w-[620px] border-collapse text-left">
                <thead className="bg-surface-2 text-fg-subtle text-ui-xs">
                  <tr>
                    <th className="px-5 py-2.5 font-semibold">নামহীন ব্রাউজার</th>
                    <th className="px-4 py-2.5 font-semibold">প্রথম দেখা</th>
                    <th className="px-4 py-2.5 font-semibold">শেষ দেখা</th>
                    <th className="px-5 py-2.5 text-right font-semibold">ভিজিট</th>
                  </tr>
                </thead>
                <tbody className="divide-border-base divide-y">
                  {guests.map((guest) => (
                    <tr key={guest.idHash} className="hover:bg-accent-soft/30 transition">
                      <td className="text-fg px-5 py-3 font-mono text-sm">
                        অতিথি {guest.idHash.slice(0, 8)}
                      </td>
                      <td className="text-fg-muted px-4 py-3 text-sm">
                        {formatDate(guest.firstSeenAt)}
                      </td>
                      <td className="text-fg-muted px-4 py-3 text-sm">
                        {formatDateTime(guest.lastSeenAt.getTime())}
                      </td>
                      <td className="text-fg px-5 py-3 text-right text-sm font-semibold">
                        {bn(guest.visitCount)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </section>

        <section className="border-border-base bg-surface/90 rounded-panel overflow-hidden border shadow-app">
          <div className="border-border-base flex items-center justify-between border-b px-4 py-3.5 sm:px-5">
            <div>
              <h2 className="text-fg text-ui-lg font-semibold">নিবন্ধিত ব্যবহারকারী</h2>
              <p className="text-fg-subtle text-ui-xs">সবচেয়ে সম্প্রতি সক্রিয়রা আগে</p>
            </div>
            <span className="bg-primary-soft text-primary rounded-full px-2.5 py-1 text-xs font-bold">
              {bn(rows.length)}
            </span>
          </div>

          {rows.length === 0 ? (
            <p className="text-fg-muted p-8 text-center text-sm">এখনো কোনো অ্যাকাউন্ট নেই।</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full min-w-[760px] border-collapse text-left">
                <thead className="bg-surface-2 text-fg-subtle text-ui-xs">
                  <tr>
                    <th className="px-5 py-2.5 font-semibold">ব্যবহারকারী</th>
                    <th className="px-4 py-2.5 font-semibold">অবস্থা</th>
                    <th className="px-4 py-2.5 font-semibold">যোগ দিয়েছেন</th>
                    <th className="px-4 py-2.5 font-semibold">শেষ সক্রিয়</th>
                    <th className="px-5 py-2.5 text-right font-semibold">CV</th>
                  </tr>
                </thead>
                <tbody className="divide-border-base divide-y">
                  {rows.map((user) => (
                    <tr key={user.id} className="hover:bg-primary-soft/40 transition">
                      <td className="px-5 py-3">
                        <p className="text-fg text-ui-md font-semibold">{user.name}</p>
                        <p className="text-fg-subtle text-ui-xs">{user.email}</p>
                      </td>
                      <td className="px-4 py-3">
                        <span
                          className={
                            user.emailVerified
                              ? 'bg-success/10 text-success rounded-full px-2 py-1 text-xs font-medium'
                              : 'bg-warning/10 text-warning rounded-full px-2 py-1 text-xs font-medium'
                          }
                        >
                          {user.emailVerified ? 'যাচাইকৃত' : 'অপেক্ষমাণ'}
                        </span>
                      </td>
                      <td className="text-fg-muted px-4 py-3 text-sm">
                        {formatDate(user.createdAt)}
                      </td>
                      <td className="text-fg-muted px-4 py-3 text-sm">
                        {formatDateTime(user.lastActiveAt)}
                      </td>
                      <td className="text-fg px-5 py-3 text-right text-sm font-semibold">
                        {bn(user.cvCount)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </section>
      </div>
    </main>
  );
}

const Stat = ({ icon, label, value }: { icon: React.ReactNode; label: string; value: number }) => (
  <div className="border-border-base bg-surface/90 rounded-card border p-4 shadow-sm">
    <div className="text-primary flex items-center gap-2">
      {icon}
      <span className="text-fg-muted text-ui-xs font-semibold">{label}</span>
    </div>
    <p className="text-fg mt-2 text-2xl font-bold">{bn(value)}</p>
  </div>
);
