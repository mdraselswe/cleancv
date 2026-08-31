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

import { APP_NAME, AUTH_ROUTES, REDIRECT_PARAM, ROUTES } from '@/constants';
import { getSessionUser } from '@/server/auth/session';
import { db } from '@/server/db';
import { anonymousVisitor, cvDocument, session, user as userTable } from '@/server/db/schema';
import { serverEnv } from '@/server/env';

export const metadata: Metadata = {
  title: `Usage dashboard — ${APP_NAME}`,
  robots: { index: false, follow: false },
};

export const dynamic = 'force-dynamic';

const DAY_MS = 24 * 60 * 60 * 1000;

const formatDate = (value: Date | number): string =>
  new Intl.DateTimeFormat('en-GB', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  }).format(value);

const formatDateTime = (value: number): string =>
  new Intl.DateTimeFormat('en-GB', {
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
  const [users, sessions, documents, guests] = await Promise.all([
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
            <ArrowLeft size={15} /> Back to {APP_NAME}
          </Link>
          <a
            href="https://vercel.com/mdraselswes-projects/cleancv/analytics"
            target="_blank"
            rel="noreferrer"
            className="border-border-base bg-surface text-fg hover:border-primary/40 rounded-control text-ui inline-flex items-center gap-1.5 border px-3 py-2 font-medium shadow-sm transition"
          >
            Anonymous traffic <ExternalLink size={13} />
          </a>
        </div>

        <header className="border-primary/15 bg-gradient-to-br from-primary-soft via-surface to-accent-soft rounded-panel border p-5 shadow-app sm:p-7">
          <p className="text-primary text-ui-xs font-bold tracking-[0.14em] uppercase">Private</p>
          <h1 className="text-fg mt-1 text-2xl font-bold tracking-tight sm:text-3xl">
            CleanCV usage
          </h1>
          <p className="text-fg-muted text-ui-md mt-1">
            Registered accounts and cloud activity. Guest visitors remain anonymous.
          </p>
        </header>

        <section className="grid grid-cols-2 gap-3 lg:grid-cols-4">
          <Stat icon={<UserRoundX size={17} />} label="Anonymous users" value={guests.length} />
          <Stat icon={<Activity size={17} />} label="Guests today" value={guestActiveToday} />
          <Stat icon={<CalendarDays size={17} />} label="Guests 30 days" value={guestActiveMonth} />
          <Stat icon={<Activity size={17} />} label="Guest visits" value={anonymousVisits} />
        </section>

        <section className="grid grid-cols-2 gap-3 lg:grid-cols-5">
          <Stat icon={<Users size={17} />} label="Registered" value={rows.length} />
          <Stat icon={<CheckCircle2 size={17} />} label="Verified" value={verified} />
          <Stat icon={<Activity size={17} />} label="Active today" value={activeToday} />
          <Stat icon={<CalendarDays size={17} />} label="Active 30 days" value={activeMonth} />
          <Stat icon={<Cloud size={17} />} label="Synced CVs" value={syncedCvs} />
        </section>

        <section className="border-border-base bg-surface/90 rounded-panel overflow-hidden border shadow-app">
          <div className="border-border-base flex items-center justify-between border-b px-4 py-3.5 sm:px-5">
            <div>
              <h2 className="text-fg text-ui-lg font-semibold">Anonymous visitors</h2>
              <p className="text-fg-subtle text-ui-xs">Random browser IDs only — no personal data</p>
            </div>
            <span className="bg-accent-soft text-accent rounded-full px-2.5 py-1 text-xs font-bold">
              {guests.length}
            </span>
          </div>
          {guests.length === 0 ? (
            <p className="text-fg-muted p-8 text-center text-sm">No anonymous visits recorded yet.</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full min-w-[620px] border-collapse text-left">
                <thead className="bg-surface-2 text-fg-subtle text-ui-xs">
                  <tr>
                    <th className="px-5 py-2.5 font-semibold">Anonymous browser</th>
                    <th className="px-4 py-2.5 font-semibold">First seen</th>
                    <th className="px-4 py-2.5 font-semibold">Last seen</th>
                    <th className="px-5 py-2.5 text-right font-semibold">Visits</th>
                  </tr>
                </thead>
                <tbody className="divide-border-base divide-y">
                  {guests.map((guest) => (
                    <tr key={guest.idHash} className="hover:bg-accent-soft/30 transition">
                      <td className="text-fg px-5 py-3 font-mono text-sm">
                        Guest {guest.idHash.slice(0, 8)}
                      </td>
                      <td className="text-fg-muted px-4 py-3 text-sm">
                        {formatDate(guest.firstSeenAt)}
                      </td>
                      <td className="text-fg-muted px-4 py-3 text-sm">
                        {formatDateTime(guest.lastSeenAt.getTime())}
                      </td>
                      <td className="text-fg px-5 py-3 text-right text-sm font-semibold">
                        {guest.visitCount}
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
              <h2 className="text-fg text-ui-lg font-semibold">Registered users</h2>
              <p className="text-fg-subtle text-ui-xs">Most recently active first</p>
            </div>
            <span className="bg-primary-soft text-primary rounded-full px-2.5 py-1 text-xs font-bold">
              {rows.length}
            </span>
          </div>

          {rows.length === 0 ? (
            <p className="text-fg-muted p-8 text-center text-sm">No accounts yet.</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full min-w-[760px] border-collapse text-left">
                <thead className="bg-surface-2 text-fg-subtle text-ui-xs">
                  <tr>
                    <th className="px-5 py-2.5 font-semibold">User</th>
                    <th className="px-4 py-2.5 font-semibold">Status</th>
                    <th className="px-4 py-2.5 font-semibold">Joined</th>
                    <th className="px-4 py-2.5 font-semibold">Last active</th>
                    <th className="px-5 py-2.5 text-right font-semibold">CVs</th>
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
                          {user.emailVerified ? 'Verified' : 'Pending'}
                        </span>
                      </td>
                      <td className="text-fg-muted px-4 py-3 text-sm">
                        {formatDate(user.createdAt)}
                      </td>
                      <td className="text-fg-muted px-4 py-3 text-sm">
                        {formatDateTime(user.lastActiveAt)}
                      </td>
                      <td className="text-fg px-5 py-3 text-right text-sm font-semibold">
                        {user.cvCount}
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
    <p className="text-fg mt-2 text-2xl font-bold tracking-tight">{value}</p>
  </div>
);
