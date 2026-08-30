# Opt-in cloud sync — plan

## Why

The account currently gates the PDF download and holds nothing. That is a toll booth: it costs the
reader something and gives them nothing back. The gate does protect `/api/pdf`, which launches a real
browser and is the most expensive thing here — but that is a benefit to the operator, not to the
person being asked to sign up.

Giving the account something to hold fixes it, and the something worth holding is the document
itself: a CV in IndexedDB is one cleared browsing history away from gone, and the terms already spend
their longest section warning about exactly that.

## The constraint that shapes this

"Your CV never leaves your browser" is a claim in `/privacy`, set in bold, and it is also the
product's best line. Turning on sync for everybody would trade it away.

So sync is **opt-in and off by default**. Both claims then stay true, stated conditionally, and the
account becomes worth having for whoever wants it. This is the decision the rest of the plan follows
from; it is not an implementation detail.

## What it costs

Neon's free tier is 0.5 GB. Since ADR-050 a document carrying a photograph is around 90 KB and one
without is 20–40 KB, so the ceiling is roughly 5,000 documents with photos or 15,000 without — for a
personal project, not a limit anyone reaches. No new service: the database, the ORM and the session
are already wired for accounts.

The compute-hour allowance is the real thing to watch, not storage. Every request wakes a suspended
Neon branch, so the sync engine batches and debounces rather than writing per keystroke; see S3.

---

## S1 — The table

One table, in `src/server/db/schema.ts` alongside `authSchema` but exported separately — Better
Auth's field names are its vocabulary (rule 73) and ours are not.

```
document
  id          text primary key      -- the client's own id, so a row and an IndexedDB
                                    -- entry are the same document and not two
  userId      text not null         -- -> user.id, on delete cascade
  name        text not null
  personName  text not null
  data        jsonb not null        -- the whole `CvDocument.resume`
  revision    integer not null      -- server-side counter, bumped on every accepted write
  updatedAt   bigint not null       -- the client's own edit time, in ms
  deletedAt   bigint                -- tombstone; null while the document lives
  index (userId, updatedAt)
```

`revision` and `updatedAt` are both needed and are not the same thing. `updatedAt` is the document's
edit time: it orders last-write-wins and it is what the reader is shown. `revision` is the server's
monotonic counter and is what detects a conflict, because two devices with skewed clocks can write
the same `updatedAt` and neither is wrong about its own clock.

A `data` payload over 1 MB is refused with 413 rather than truncated. `imageSchema` already caps a
single picture; this caps the document.

Deletes are tombstones, never `DELETE`. A row removed outright is invisible to the next `since` pull,
so a CV deleted on a phone would be resurrected by the laptop that still has it.

## S2 — The API

Two routes under `src/app/api/documents/`. Both read the session with `{ fresh: true }` — these gate
work, not decoration (rule 79) — and both are rate-limited.

- `GET /api/documents?since=<ms>` → `{ documents, serverTime }`. Rows changed since that mark,
  tombstones included. Indexed on `(userId, updatedAt)`, so an idle poll is cheap.
- `POST /api/documents` → batch upsert. Each entry carries `baseRevision`, the revision the client
  last saw. The server answers per document with `accepted` and the new revision, or `conflict` and
  its own copy.

A delete is a `POST` with `deletedAt` set, so there is one write path. Two write paths would let a
delete race an edit differently from the way an edit races an edit, and that difference is where the
bug would live.

## S3 — The sync engine

A new `features/sync/`. `useLibrarySync` already debounces the local write against the resume store;
the sync hangs off the far side of that and never off a React effect on the resume value.

- **Outbox in IndexedDB**, not in memory: the set of document ids with local changes the server has
  not acknowledged. A queue that a reload empties is a queue that silently drops the last edit before
  a crash.
- **Push** — after the local write lands, mark the id and schedule a flush on a longer debounce than
  the autosave (~3s), so writing a paragraph is one request rather than forty.
- **Pull** — on sign-in, on `visibilitychange` to visible, and after each successful push. Not on a
  timer: a poll every thirty seconds against a suspended Neon branch is how the compute allowance
  goes.
- **Merge** — last-write-wins on `updatedAt`, except that nothing is ever silently overwritten. When
  the server's revision moved under us, **both copies are kept**: the remote is written locally as a
  new document named `<name> (from another device)` and the reader decides. A CV is somebody's work,
  and an automatic resolution that discards a version is the one failure that cannot be undone.
- **Adoption** — on first sign-in with sync on, every local document with no server row is pushed. On
  sign-out the local copies stay; they are the reader's.
- **Offline** — a failed flush leaves the outbox intact and the status reads `offline`. No retry
  storm: the next pull trigger carries it.

## S4 — The switch

Default off. A card in the library panel: *Back up my CVs to my account*, the current status, and
when it last synced — a sync is a write happening somewhere the reader is not looking, so it says so
(rule 67).

Turning it on the first time says in one sentence what will leave the device, and links to
`/privacy`. Turning it off asks whether to delete the server copies too, and does what it is told.

Signed out, the card explains what an account would do and links to sign-in — which is also the first
honest answer this app has to "why should I make an account?".

## S5 — The documents

Shipped in the same change as the code, not after it. `/privacy` currently states in bold that the CV
never reaches the server; that becomes conditional, with its own section on what backup sends, what
the row holds, and how to delete it. The terms' backup section gains a line saying the copy exists
and is not a substitute for the reader's own. ADR-051 records the decision, and rule 80 applies as it
did to the first pass: every claim names something checkable.

## S6 — Later, not now

- **Version history** — a `document_revision` table holding the last N snapshots per document. Cheap
  once the jsonb column exists, and it is the second real reason to have an account.
- **Photos out of the JSON** — a separate blob store keyed by hash. Worth it only if documents with
  photographs turn out to dominate the storage; since ADR-050 they are 90 KB, so they do not yet.

## Non-goals

Real-time collaboration. Sharing a document with another account. A public link. Rendering the
library list on the server. Each of those is a different product decision and none is needed to make
the account worth having.

## Risks

| Risk | Handling |
|---|---|
| The privacy claim changes | S5 ships with S1–S4, never behind them |
| Neon compute hours | Batch, debounce, pull on triggers not on a timer |
| A conflict loses work | Keep both copies; never resolve by discarding |
| A crash loses the last edit | The outbox is in IndexedDB, not in memory |
| A resurrected deleted CV | Tombstones, and `since` pulls carry them |
