# CleanCV

An ATS-friendly CV and resume builder. One data model, nine templates, a live parse score, and two
PDF exports from the same document — and every exported PDF carries the CV inside it, so opening one
on another machine restores the document exactly.

## Why it exists

Most "designed" resume PDFs fail automated parsing in ways their author never sees. The reference
document this project was built from — produced by a well-known online builder — emits Private Use
Area codepoints for its contact icons and a replacement character before every bullet, so an ATS
reads `� Spearheaded Bohubrihi…` and a contact line prefixed with undefined glyphs.

Everything here is arranged so that cannot happen:

- The PDF is rendered by headless Chrome from the same React template you see on screen, so it
  carries a **real text layer** — not a canvas image ([ADR-001](docs/DECISIONS.md)).
- Icons are **inline SVG**, bullets are a literal `U+2022` ([ADR-003](docs/DECISIONS.md)).
- Two-column designs place content with CSS while the **markup stays in one reading order**
  ([ADR-004](docs/DECISIONS.md)).
- `letter-spacing` is capped at `0.06em`, above which Chrome emits one text run per glyph and
  `SKILLS` extracts as `S K I L L S`.
- A **release gate** renders every template to a PDF, extracts the text layer, and asserts all of the
  above — then imports the result back and checks the content survives the round trip. A template
  that fails does not ship.

Two designs are measured rebuilds of real documents rather than approximations of them — every type
size, column offset and margin comes from the original PDF's own text layer:

- **Classic Double Column** — 28% left rail, timeline down the gutter, 11 mm margins.
- **Compact Professional** — name left and contact right, a rule after every heading, dates in the
  right margin, 15 mm margins. Its project and credential links print as "Repository" rather than as
  the address, matching the layout it rebuilds; that address then lives only in the href, which is
  why it scores a little below the plain design.
- **Formal Centered** — centred serif headings over a full-width rule, contact on one line, and each
  role led by its employer. Rebuilt from a screenshot, so its type sizes are ratios rather than
  measured points.
- **Side Panel** — a genuine two-column page: narrative on the left at 56%, education, achievements
  and projects in a 38% panel on the right. The markup runs left column then right, which is also
  the order a person reads it.

## Dual export

Colourful design and parse reliability genuinely conflict. Rather than forcing a choice, every
resume exports twice from the same data:

| Export | What it is |
|---|---|
| **Download** | The template you chose, in full |
| **ATS PDF** | The same content rendered through the plain single-column template — the one to upload to a job portal |

## Getting started

```bash
npm install
npm run chrome     # one-off: downloads the Chrome build the PDF renderer drives
npm run dev        # http://localhost:3000
```

## Deploying

The PDF is rendered by a real browser, which is the one thing about this app a host has to
accommodate.

- **Locally and on any persistent Node host**, `puppeteer` (a dev dependency) supplies the browser.
- **On Vercel and other serverless hosts**, there is no browser in the bundle and no room to
  download one, so `@sparticuz/chromium` supplies a Lambda-sized build. `renderPdf` picks between
  them from the environment; nothing needs configuring.

Serverless also means the PDF route and the print page are *different instances*. Nothing is passed
between them: the route renders the resume to markup itself and injects it into an empty print shell
that carries the stylesheets and fonts ([ADR-029](docs/DECISIONS.md)).

`vercel.json` gives `/api/pdf` 1024 MB and 60 s. Chromium will not start below 1024 MB, and that
figure is also the Hobby plan's ceiling; on a paid plan it is worth raising, which mostly shortens
the render of a long CV.

## Commands

| Command | What it does |
|---|---|
| `npm run dev` | Editor at `localhost:3000` |
| `npm run build` / `npm start` | Production build and server |
| `npm run lint` | ESLint, including the layer-boundary rules |
| `npm run typecheck` | `tsc --noEmit` |
| `npm run test` | Unit tests (schema, ATS rules, pure helpers) |
| `npm run test:pdf` | **The ATS regression gate.** Renders every template, inspects the PDF text layer, and imports the result back |
| `npm run format` | Prettier |

`npm run test:pdf` starts its own dev server on port 3123. Set `CV_TEST_BASE_URL=http://localhost:3000`
to reuse a server you already have running — much faster while iterating.

## Architecture

```
src/
├── components/     dumb, reusable UI — no store access, no domain types
│   ├── ui/         Button, Field, Input, TagInput, ScoreRing, SortableList, …
│   └── layout/     AppShell, Pane, SplitPane
├── features/
│   ├── resume/     Zod schema, Zustand store, normalisation, sample data
│   ├── templates/  registry, shared blocks, nine designs
│   ├── ats/        rules by category, scoring engine, score panel
│   ├── editor/     the composition layer: forms, tabs, toolbar
│   ├── preview/    A4 sheets, measured pagination, fit-to-width zoom
│   ├── export/     PDF and JSON download / import
│   ├── import/     PDF / DOCX / OCR extraction, two parsers, review screen
│   └── library/    documents, IndexedDB, workspace folder, backups
├── hooks/          domain-free React hooks
├── lib/            pure functions — no React import, ever
├── constants/      no magic strings anywhere else
└── styles/         resume canvas CSS shared by preview and print
```

Layer boundaries are enforced by ESLint, not convention: `components/` cannot import `features/`,
and `lib/` cannot import React. The full set of conventions lives in
[`.claude/skills/cv-maker/SKILL.md`](.claude/skills/cv-maker/SKILL.md); the reasoning behind the
significant choices is in [`docs/DECISIONS.md`](docs/DECISIONS.md).

## Adding a template

1. Create `src/features/templates/<id>/` with `index.tsx` exporting `meta` and `Template`, plus its
   own stylesheet.
2. Add the id to `TEMPLATE_IDS` in `src/constants/templates.ts` and a line to `registry.ts`.
3. Run `npm run test:pdf`. The gate picks the new template up automatically.

Templates never hard-code a colour, never read the store, and never reorder markup for layout.

## Sections

Always available: profile and contact, summary or objective, work experience, education, skills.

Optional, each toggleable and re-orderable: projects · certifications · key achievements · awards ·
publications · training · languages · volunteering · extracurricular · memberships · conferences ·
patents · interests · personal details · references · declaration · signature.

Body text takes `**bold**` for the phrase a recruiter should catch first
([ADR-010](docs/DECISIONS.md)). Skill groups and achievements carry an icon, guessed from what you
typed and overridable from a picker ([ADR-012](docs/DECISIONS.md)) — drawn only by designs with an
icon gutter.

Order is yours: drag sections, or start from an arrangement — Experienced, Fresher/Student,
Academic CV, or Formal/Government — and adjust from there.

Plus up to six **custom sections** of your own — a heading and either a paragraph or a bullet list —
placed anywhere in the order, not pinned to the end ([ADR-007](docs/DECISIONS.md)).

## Importing an existing CV

Upload a PDF, a DOCX or a screenshot instead of retyping. Extraction runs on your machine — pdf.js
for PDFs, mammoth for DOCX, tesseract for images — and then one of two parsers structures it:

| | Offline (default) | Smart import |
|---|---|---|
| Cost | Free | Whatever your endpoint charges |
| Privacy | Nothing leaves the browser | The document is sent to your endpoint |
| Setup | None | An endpoint and model under *Set up smart import* |
| Plain one-column CV | Recovers it completely | Recovers it completely |
| Designed / two-column CV | Recovers the person and contact details; the rest partly | Much better |
| Screenshot | OCR, so-so | Sends the image itself |

Smart import speaks the OpenAI `/chat/completions` shape, so it works with Gemini, Groq, OpenRouter,
a local Ollama, or Anthropic — no provider is hard-coded ([ADR-009](docs/DECISIONS.md)). A model
running on your own machine sends nothing anywhere; a free hosted tier is not automatically a private
one, which is worth knowing before importing someone else's CV.

Nothing is written until you review it: every group can be turned off, and lists can replace or
extend what the CV already holds.

## Storage

There are no accounts and nothing is uploaded — the PDF route receives the resume, renders it, and
keeps nothing ([ADR-005](docs/DECISIONS.md)). Documents live in three places, each doing one job
([ADR-008](docs/DECISIONS.md)):

| Layer | Role | Survives clearing site data |
|---|---|---|
| **IndexedDB** | Every saved CV. Instant, offline, no size ceiling worth worrying about | No |
| **Workspace folder** | A real folder the library mirrors itself into as you type | Yes |
| **Backup file** | Every document in one JSON export | Yes |

The workspace folder needs the File System Access API, so Chromium browsers only; elsewhere the
backup file is the whole answer. Point the workspace at a folder Drive or OneDrive already syncs and
the same choice buys off-machine backup and a second device, with no server involved.

## Deployment

Runs anywhere Node does. On Vercel, swap the puppeteer launch in `src/lib/pdf/renderPdf.ts` for
`@sparticuz/chromium`; the rest is unchanged. Note that the print handoff assumes the API route and
the print page share a process (see `src/lib/pdf/payloadStore.ts`) — a multi-instance deployment
needs a shared store there.
