# Architecture Decision Records

## ADR-001 — PDF generation via server-side Puppeteer

**Context.** ATS parsers need a real text layer. The common `html2canvas` + `jsPDF` recipe rasterises
the page, producing a PDF with zero extractable text — an automatic 0 on any ATS.

**Options considered.**

| Approach | Text layer | Cost |
|---|---|---|
| html2canvas + jsPDF | none (image) | rejected |
| @react-pdf/renderer | yes | needs a second component tree per template — double maintenance |
| Puppeteer `page.pdf()` | yes | needs a server / serverless chromium |
| `window.print()` | yes | print dialog UX, browser header/footer leaks in |

**Decision.** Puppeteer server-side, rendering the same React template used for the on-screen preview
via a headless `/print` route. `window.print()` stays as a zero-dependency fallback.

**Consequence.** Needs `@sparticuz/chromium` on Vercel; `lib/pdf/launch.ts` branches on env.

---

## ADR-002 — Dual export: Design PDF + ATS PDF

**Context.** Users want colourful, visually distinctive CVs. Multi-column layouts, sidebars, skill
bars, and photos all reduce parse quality. Forcing a choice between "looks good" and "gets parsed"
makes the product worse at both.

**Decision.** Every resume can export twice from the same data: the selected template (Design PDF)
and an auto-generated `ats-plain` render (ATS PDF).

**Consequence.** `ats-plain` must support every section any other template supports. The template
registry carries `supportedSections` so the UI can warn about data that a chosen design drops.

---

## ADR-003 — Inline SVG icons, never icon fonts

**Context.** The reference PDF (Enhancv-produced) emits Private Use Area codepoints for its contact
icons and `�` for its bullets. Extracted text reads `� Spearheaded Bohubrihi...` and the contact
line is prefixed with undefined glyphs.

**Decision.** All template glyphs are inline `<svg aria-hidden="true">`. Bullets are a literal U+2022
in a `<span aria-hidden>`, not `list-style` or `::marker`.

**Consequence.** `tests/regression/ats-pdf.spec.ts` asserts the absence of U+FFFD and U+E000–U+F8FF
in every template's extracted text. This is a release gate.

---

## ADR-004 — DOM order is the reading order

**Context.** Chrome's PDF export writes text runs in DOM order, not visual order. A two-column layout
built with source-order-shuffled markup extracts as interleaved nonsense.

**Decision.** Templates lay out visually with CSS Grid / positioning while keeping markup in one
logical top-to-bottom flow: identity → contact → summary → experience → skills → education → rest.

**Consequence.** Some visual arrangements (e.g. a right rail that visually starts at the top but
belongs logically at the end) are achieved with grid placement, never by reordering markup.

---

## ADR-005 — localStorage first, no auth

**Context.** Accounts add sign-up friction and a backend before the core product exists.

**Decision.** Zustand `persist` to localStorage under a versioned key, plus JSON export/import for
backup and device transfer. The data model is designed so a future sync layer is additive.

**Consequence.** `features/persistence` owns a versioned migration chain so stored resumes survive
schema changes.

---

## ADR-006 — Zod schema is the single source of truth

**Decision.** Validation, form defaults, and TypeScript types all derive from one Zod schema per
section. `src/types` only re-exports `z.infer` results.

**Consequence.** No hand-written interface may duplicate a schema. Adding a field is a one-line
schema change that propagates to types, defaults, and validation.

---

## ADR-007 — Custom sections are slots in the order list

**Context.** Users need sections the registry does not cover. The obvious shape — a `customSections`
array rendered after everything else — pins them to the bottom of the page, which is the one place a
"Portfolio Highlights" section is useless.

**Decision.** `meta.sectionOrder` holds `SectionSlot` values: a `SectionKey`, or `custom:<id>`.
Ordering, toggling, headings, visibility and editor tabs all run through the same code path for both
kinds. A custom section's heading and enabled flag live on the section itself, because there is no
`SECTION_META` row to fall back to and `meta.sections` is keyed by the fixed `SectionKey` union.

**Consequence.** `normalizeResume` owns referential integrity: a slot whose section is gone is
dropped, and a section that lost its slot is appended. A custom section offers two layouts only —
paragraph and bullet list — because those are the two shapes that extract cleanly, and anything
richer would need its own render path in all six templates.

---

## ADR-008 — A document library on IndexedDB, mirrored to a folder

**Context.** One resume in `localStorage` cannot answer "keep several CVs" or "get my data back
after clearing the cache". `localStorage` is also capped near 5 MB, and a photo plus a signature is
most of a megabyte per document as data URLs, so a handful of CVs would start throwing on write.

**Decision.** Three layers, each doing one job:

| Layer | Role | Survives clearing site data |
|---|---|---|
| IndexedDB | Working store — every document, instant, offline | No |
| Workspace folder | A real directory the library mirrors itself into, via the File System Access API | Yes |
| Backup file | Every document in one JSON export | Yes |

The directory handle is itself persisted in IndexedDB, which is what makes the grant survive a
reload — the folder is chosen once, not every session. Pointing the workspace at a folder that
Drive or OneDrive already syncs buys off-machine backup and a second device with no server.

**Consequence.** `useResumeStore` lost its `persist` middleware and now holds exactly one document
with no knowledge of storage; `features/library` loads a resume in and writes changes back out.
Boot is guarded by a shared promise because it migrates, then reads, then writes — two overlapping
runs each saw an empty library and each created a document. The workspace is Chromium-only;
elsewhere the backup file is the whole answer, and the panel says so rather than hiding the gap.

---

## ADR-009 — Import: two providers, one pipeline, nothing written unreviewed

**Context.** Typing a CV in by hand is the biggest cost of starting one, and the obvious fix — upload
the old PDF — runs straight into this project's founding observation: most designed CV PDFs are hard
to read back.

**Decision.** Extraction and structuring are separate stages. Extraction (pdf.js, mammoth,
tesseract) is free, offline and solved. Structuring has two implementations behind one interface:

- **Offline** — headings, date ranges, bullet glyphs, `label: list`. No network, no key, no cost.
  Default, and the fallback whenever the other is unavailable.
- **Smart** — any OpenAI-compatible `/chat/completions` endpoint the user configures, proxied
  through `/api/import` because browsers cannot call most providers directly and a local Ollama is
  not reachable cross-origin.

No provider is hard-coded. Free tiers appear and tighten on their own schedule; betting the feature
on one is a maintenance problem waiting for someone else's pricing page to change.

Neither provider writes to the resume. Both land in a review screen with per-group accept/reject and
a replace/append choice, because a plausible wrong value costs the user more than a missing one.

**Consequence.** Reading order is the source's own — see the note in `extract/lines.ts` for why
sorting by position and detecting columns was tried, measured against all six templates, and
removed. The offline parser therefore recovers a plain CV completely and a grid-based design only
partly: `classic-dc` emits `SKILLS` and `EDUCATION` adjacently in its PDF with both bodies after
them, and that pairing is not in the file to recover. The release gate encodes exactly this — full
recovery asserted for the plain template, identity and contact for every template, and "degrades
without inventing anything" for all of them.

---

## ADR-010 — Emphasis inside body text, as `**bold**` markers

**Context.** The reference document bolds the metric in every bullet — "achieving a **40%
improvement**" — and that is most of what makes a dense one-page CV scannable. Our bullets were
plain strings with no way to express it.

**Decision.** Emphasis is written inline in the string as `**bold**` and rendered by `RichText`.
Not structured rich text: a flat string keeps the schema simple, keeps the JSON export readable and
hand-editable, and keeps every rule that reasons about *content* — word counts, keyword matching,
weak-phrase checks — working on the same field, via `stripEmphasis`.

**Consequence.** There is a real cost and it is worth stating: Chrome emits a separate PDF text run
for each bold span, so a parser that concatenates runs without inserting whitespace reads
"using**Next.js**and" as "usingNext.jsand". The reference document has exactly this defect.
Splitting only on whole words keeps the damage to a missing space rather than a mangled term, and
the release gate asserts the bullet text still extracts intact.

---

## ADR-011 — A recognised heading is not a renamed one

**Context.** The ATS engine warned about any section heading that differed from the registry
default, so "Professional Experience" — a heading every parser matches on — was scored as a risk.
The import parser meanwhile kept its own list of the same alternative names.

**Decision.** One vocabulary in `constants/sections.ts`: `SECTION_HEADING_ALIASES` plus
`isRecognisedHeading`. The import parser uses it to recognise a heading in someone else's CV; the
ATS engine uses it to decide whether a rename is safe. What counts as readable when reading a CV is
what counts as safe when writing one, and two lists would have drifted.

**Consequence.** The warning now fires only for names no parser is known to match — "My Journey",
not "Professional Experience". The release gate asserts the heading the document actually prints is
a recognised one, rather than asserting the default string.


---

## ADR-012 — Entry icons: guessed by default, chosen when it matters

**Context.** The rebuilt classic design has an icon gutter beside skill groups and achievements.
Inferring the glyph from the group name is right nearly always and asks nothing of the user — but
"Soft Skills", "Military Service" and "Key Achievements" carry no signal a matcher can read, and a
trophy beside "Programming Languages" reads as a bug.

**Decision.** `icon` is stored on the entry with `auto` as the default. `auto` resolves through a
keyword table; anything else is the user's explicit choice, made in a picker whose Automatic swatch
previews what the guess currently resolves to. `guessIcon` returns a *key*, not a component, so
callers resolve through a constant map — handing back a component reads to React's lint rules as one
created during render.

**Consequence.** Templates without an icon gutter ignore the field entirely, so choosing one never
costs anything elsewhere. Glyphs stay inline SVG and contribute nothing to the extracted text
(ADR-003). An unknown stored value degrades to `auto` rather than failing the parse.


---

## ADR-013 — The offline parser reads columns, not a flat list of lines

**Context.** Importing the reference document put the location in the job title, the title in the
employer, and found no bullets at all. Three separate causes, all structural:

1. A designed CV sets dates and place in a narrow left column and the role, employer and bullets in
   a wider one. Read as one ordered list, every field lands a slot out.
2. Bullet glyphs are often emitted as their own runs — the reference collects all of them at the end
   of the page — so the text beside them carries no marker and is indistinguishable from a heading.
3. A bullet that wraps arrives as several runs at the same indent, so one four-point list counts as
   eight.

**Decision.** A section is measured before it is read: the widest corridor between line starts, when
one side is narrow and the other holds most of the text, is a meta column. Each line is then sorted
into meta, head or bullet by position rather than by order. Where a meta column exists, a new date
in it *is* the entry boundary and vertical gaps are ignored entirely — reading order crosses between
columns, so the gap between consecutive lines is routinely negative mid-entry. Marker runs are
gathered document-wide before sectioning, because their position in the run order says nothing about
which section they serve, and used to tell a bullet's first line from its continuation.

**Consequence.** Field assignment on a two-column CV is now exact, verified against the original
document. The measurements need care: the column boundary is the middle of the corridor, not the
text column's own start, or a line a fraction under it counts on the wrong side; and an indent past
about eight times the body size is a second column, not a bullet.

---

## ADR-014 — No regex literals for word matching in this parser

**Context.** Two patterns in the import parser silently matched nothing. Both had been written
through a shell heredoc, and both had a `` word boundary that arrived in the file as an actual
U+0008 backspace character. The regex looked correct in every editor, reported the flags it was
given, and never matched. It cost far more to find than it should have because the failure is
invisible: no error, just an empty field.

**Decision.** Word matching in `features/import/parse` uses lower-cased string comparison against a
word list — `startsWithIssued`, `looksLikeResult` — not a regex. Where a pattern is genuinely
needed, it is built with `new RegExp` from a plain string with no escapes.

**Consequence.** These checks cannot be broken by an escaping accident, and they read more plainly
than the patterns they replaced. Source files carrying patterns are written with the editing tools
rather than through a shell, and a control-character scan over `src` and `tests` is the check when
one has been.


---

## ADR-015 — Compact Professional, and what a second measured rebuild changed

**Context.** A second reference document to reproduce exactly: name left with the contact block
right-aligned opposite it, title-case headings each followed by a rule to the margin, role and
employer on one line with the dates in the right margin, and links printed as "Repository" rather
than as an address.

**Decision.** Three shared pieces gained an opt-in rather than being reshaped for one design:

- `inlineOrganization` on `EntryShell` sets the employer on the title's line. It is a prop, not CSS,
  because the separator between them has to be a real text node — inlined with a generated `::after`
  the line extracts as "Software QA EngineerShikho".
- `inlineItems` on the skills block does the same for "Frontend: React, Next", for the same reason.
- `compactLinks` prints a link's label alone. That one is a real trade and the template says so in
  its own description: the address then lives only in the href, which no parser reads, so the design
  carries a lower `atsBaseline` and the engine warns about it.

The right margin is a grid column, not an absolutely positioned block. Both keep markup in reading
order, but only the grid lets the row grow when the dates are taller than the entry beside them —
positioned, a three-line location on a one-line education entry overflowed its section and printed
across the following page's heading. `grid-row: 1 / -1` is not enough either: `-1` names the end of
the *explicit* grid, so the dates inflated the title's row instead of standing beside the whole
entry. It spans a fixed large row count instead.

**Consequence.** Seven templates, two of them measured rebuilds rather than approximations. The
release gate runs every check against this design too — text layer, no PUA codepoints, recognised
headings, reading order, round-trip import — and it also rendered a credential's `url`, which the
schema had carried and no template had ever printed.


---

## ADR-016 — Entry order is markup, never CSS

**Context.** Formal Centered leads each entry with the employer and each margin with the place —
the opposite of the shared order. Both could have been done with `order` on a flex container, in a
single line of template CSS.

**Decision.** They are props on `EntryShell` — `organizationFirst`, `placeBeforeDates` — that change
the markup.

ADR-004 forbids reordering markup to achieve a *visual* arrangement, and this is the other side of
that rule rather than an exception to it. A left rail is the same reading order shown differently,
so it belongs in CSS. Leading with the employer is a different reading order, so it belongs in the
DOM: reordering it visually would leave the extracted text saying "Senior Software Engineer, Shikho"
where the page says "Shikho, Senior Software Engineer", and the parser would read the wrong field as
the job title.

**Consequence.** Two more opt-in props, both defaulting off, and eight templates rendering from one
`EntryShell`. The test for whether something belongs in CSS or in markup is now explicit: ask
whether a person reading the page aloud would say the words in a different order. If yes, it is
markup.


---

## ADR-017 — Side Panel: two columns of whole sections

**Context.** A reference document laid out as two real columns — summary, experience and skills on
the left; education, achievements and projects on the right — rather than as a rail of fragments
beside a narrative.

**Decision.** Both columns are grid tracks, and the markup runs left column in full, then right.
That ordering needs no justification beyond being what a person does: they read the wide column
down, then the panel down. Unlike `modern-sidebar`, where the rail had to be placed first in the
DOM to keep the extracted order sane, here the visual order and the reading order already agree.

Which sections go where is decided by naming the narrative set — summary, experience, skills,
volunteering — and sending everything else to the panel. Listed that way round deliberately: the
narrative set is short and stable, the supporting set grows every time a section is added, and the
panel is the safer default for something new.

**Consequence.** `atsBaseline` is 84 — above the rail design, below the single-column ones. Two
genuine columns can be interleaved by a parser using positional heuristics, but each column holds
whole sections rather than fragments, so the worst case is sections out of order rather than a job
title fused to a skill. A shared `metaIcons` option was added for the small calendar and pin glyphs
beside each entry's dates and place; they are inline SVG, so the extracted line is unchanged.


---

## ADR-018 — The preview shows pages, not a page guide

**Context.** The preview was one tall sheet with a dashed line drawn across it where a break was
expected. A guide line asks the reader to imagine the break, and hides the two things they most need
to see: what actually lands on page two, and how much white space is left behind on page one.

**Decision.** One A4 sheet per page, with a gap and a page number between them. Each sheet renders
the whole document and shows its own slice, clipped and shifted to that page's offset. The document
is therefore rendered once per page; at the two or three pages a resume runs to that is cheaper than
the alternatives and keeps every sheet identical to the one the PDF prints.

Where the pages *begin* is measured rather than divided out. `contentHeight / pageHeight` assumes
content can be cut anywhere, and the templates tell Chrome the opposite: `break-inside: avoid` on an
entry moves it wholly to the next page. `usePreviewMetrics` walks the same elements and applies the
same rule, and each sheet's window ends where the next page starts rather than after a full page's
height — the difference between those two is exactly the white space at the foot of the page.

**Consequence.** Preview and PDF now agree on page count for all nine templates, checked by
switching each in the browser and rendering the same resume through puppeteer.

Two defects surfaced on the way, both older than this change:

- `getBoundingClientRect` reports the painted box, so the preview's zoom transform scaled every
  measurement. The page count — and with it the ATS length rule — depended on where the reader had
  left the zoom slider. Dividing by `rect.width / offsetWidth` recovers the layout units.
- Three templates declared no `marginMm`, so switching to one silently kept the margin the previous
  design had chosen. Every template now states its own.

---

## ADR-019 — A control that cannot act says so

**Context.** Three reports arrived together, and they turned out to be one shape of defect: a
control whose effect is invisible reads as broken.

- The declaration always printed a date. A blank date field meant "print today's", so there was no
  way to say "no date at all" — and a dated declaration makes a CV look written for one particular
  day, which is wrong on a document sent to twenty employers over three months.
- The icon picker on achievements and skill groups did nothing on six of the nine templates. Only
  two passed `showIcons` to `SectionBody`; the others simply never rendered the glyph, and the
  picker gave no sign that the choice would be dropped.
- Text size appeared not to reach the exported PDF. Traced end to end — slider, store, request
  body, `normalizeResume`, `--rz-scale`, the print route — it always had: at the old bounds the
  extracted glyph height went from 6.46pt to 8.74pt, exactly the 1.15 / 0.85 the range allowed. The
  range was the problem. A step moved body text by a tenth of a point, which on paper is
  indistinguishable from nothing happening.

**Decision.**

- `declaration.showDate` is stored, defaults to `true` so documents saved before it are unchanged,
  and hides the date field when off. The typed date survives being switched off, so turning the
  stamp back on does not lose it.
- `TemplateSupports.icons` is declared by every template and drives `showIcons`. ATS Plain and the
  three built to match a reference document (compact-pro, formal-centered, elegant-serif) declare
  `false`; the editor reads the flag and tells the user, by name, that the current design will keep
  their choice but not draw it.

  Academic / Govt CV was `false` at first, on the reasoning that public-sector and academic forms
  carry no decorative marks. That is a matter of taste rather than a constraint — the glyphs are
  inline SVG with `aria-hidden`, so they add nothing to the text layer and cost nothing in parse
  terms (ADR-003) — and the user, who is the one applying for those posts, asked for them. It is now
  `true`.

  Wiring the flag needed doing in all nine templates, not the four that happened to draw icons
  already: `SingleColumnLayout` and two of the others never passed `showIcons` at all, so flipping
  their flag did nothing. A capability that only some of its subjects read is the same silent
  control this ADR is about.
- `FONT_SCALE` widens to 0.8–1.4 with a 0.05 step. Every stop is now a visible one.

**Consequence.** `tests/regression/themeExport.spec.ts` renders the sample at both ends of the
slider and asserts the PDF's median glyph height differs by more than a point and a half, in both
design and ATS mode — the export path is now checked, not assumed. `tests/unit/templates.spec.ts`
asserts every template declares both `marginMm` and `icons`, the two parts of `meta` a template can
omit and still compile.

A default `.rz-cat-icon` rule now lives in `resume.css`, so opting a design into icons costs the
flag alone. Modern Sidebar overrides its colour inside the rail: the rail is painted in the accent,
and an accent-coloured glyph on it is invisible.

---

## ADR-020 — The preview's pagination is checked against the PDF, not assumed

**Context.** ADR-018 gave the preview real pages, measured by walking the elements Chrome is told
to keep whole. It was verified by page *count*, and page count is the one thing that stayed right
while the break *position* drifted: the preview would end page one after a section the PDF split in
half, and the reader saw two different documents.

Measuring it properly — reading the preview's own page offsets in one browser and the PDF's text
layer in another, for every template — found three causes, in descending size.

**1. A heading was bound to its whole section.** The heading atom ran from the heading's top to the
bottom of its next sibling, and a section's body is one element. So `break-after: avoid` was modelled
as "this heading and everything under it move together", and any section that did not fit whole was
pushed wholesale onto the next page. Chrome binds a heading only to the *start* of what follows.
`firstFragmentBottom` now measures that: the first `break-inside: avoid` child if the block leads
with one, otherwise the first line box, read off a `Range`'s client rects.

**2. A4 was rounded.** `PAGE_SIZE_PX` was `794 x 1123`; A4 at 96 CSS pixels to the inch is
`793.70 x 1122.52`. The preview painted its sheet and margins from the rounded number while Chrome
laid the PDF out from the exact one, so the two content columns were a quarter of a pixel apart —
invisible until one line of one paragraph wrapped differently and everything below it moved down by
a line. `PX_PER_MM` is now `96 / 25.4` and the page size derives from it.

**3. What is left is Chrome.** With both fixed, eight of the nine designs put the same content at
the top of page two as the PDF does. Formal Centered does not, and cannot: the sample's first entry
note measures 527.3px in the screen layout against a 526.7px grid track, and the same line fits in
the print layout — a tenth of a percent apart. It wraps in the preview and not in the PDF, and every
break below it moves by a line. No pagination model reconciles two different flows.

**Decision.** `tests/regression/previewPagination.spec.ts` drives the real app in puppeteer, reads
the preview's page offsets, renders the open document to PDF and asserts both the page count and the
content at the top of page two, for every template. Formal Centered is named in a `FLOW_DIFFERS`
list with the measurement above, and still has its page count checked.

**Consequence.** The gate was confirmed to bite: restoring the old heading atom fails it on ATS
Plain with the exact symptom reported — `leadershipteammentoring…` where the preview promised
`technicalskills`.

The suite now costs a browser launch and about a minute. That is the price of checking the claim the
preview makes; the alternative was finding out from a downloaded file.

---

## ADR-021 — The export follows the preview's page breaks

**Context.** ADR-020 removed the two modelling errors in the preview's pagination and left a residue
that measurement could not close. Chased to the bottom, it is this: `page.pdf()` lays the document
out again into the page box, and in that pass Chrome measures a run of text about **two parts in a
thousand narrower** than the screen layout does.

The sample's first entry note is 527.6px wide in a 526.7px grid track. On screen it wraps; in the
PDF it fits, and Chrome draws it overflowing its own track by a pixel. One line of difference, and
every page break below it moves by a line.

Three things were ruled out along the way, each by measurement:

- *Page height.* Chrome's usable height, binary-searched with a spacer and a marker, is within 2px
  of the app's formula at every margin — and larger, not smaller.
- *Fonts.* Both routes come from the same root layout and the same `next/font` instances.
- *Layout width.* The print page was laying out at puppeteer's default 800px viewport rather than
  the paper's content width. Correcting it made the print DOM's flow identical to the preview's —
  2100px, the note wrapping in both — and the PDF came back **byte for byte the same**, which is
  what proved the difference lives in the `page.pdf()` pass and nowhere earlier.

**Decision.** Stop trying to predict Chrome and tell it instead. `usePreviewMetrics` already knows
which element starts each page; it reports their indices over `BREAK_ANCHOR_SELECTOR`, the editor
sends them with the export, and the print route sets `break-before: page` on exactly those elements.
The preview and the print route render the same components in the same order, so the nth match is
the same element in both.

The indices are sanitised at the route — they end up in a selector loop on a page rendered from a
client payload — and a malformed list costs nothing but Chrome's own pagination.

Two cases deliberately do not force anything:

- **The ATS export**, which renders through a different template, so breaks measured against the
  design on screen do not describe it.
- **Two-column designs.** In a single column a page break is a point in the document, and naming the
  element that starts each page describes it exactly. In two columns it is not a point — the columns
  cross the boundary independently — so `break-before` on one element would describe something the
  preview never showed. Those designs are left to Chrome, which paginates them the way the preview
  already measures; that was true for all three of them before this change and is checked by the
  same gate.

A forced break can only move content down, never past the bottom of a page: where it agrees with
Chrome it is a no-op, and where it comes earlier it leaves a little more white space at the foot of
the page — which is what the reader was shown.

**Consequence.** `tests/regression/previewPagination.spec.ts` no longer computes breaks of its own.
It hooks `fetch`, clicks the editor's Download button and renders the captured payload, so the gate
exercises the production path. Confirmed to bite from both ends: dropping the forced break fails
Formal Centered with `leadershipteammentoring…` where the preview promised `toolsstorybookdocz…`,
and restoring the old heading atom fails ATS Plain the same way.

Where the preview is not mounted — the phone layout's Edit tab — nothing is sent and Chrome
paginates as before.

---

## ADR-022 — Entry markers, and an off switch per section

**Context.** Three things, reported together and connected.

*The glyph sat too high.* `.rz-cat-icon` was an `inline-flex` with no text in it, and an inline-flex
box with no in-flow line box takes its **bottom margin edge** as its baseline — so the box's foot
landed on the text baseline and the glyph rode above the line. Inside a flex row (Academic CV sets
its skill groups that way) it was worse: the default `align-items: stretch` grew the box over both
lines of a wrapped group and centred the glyph between them.

*Several entries under one heading read as one block.* Four roles, three degrees, two referees — the
eye had nothing to catch on, and nothing said where one ended and the next began.

*Icons were all or nothing.* A marker earns its place beside four roles and looks fussy beside a
single line of interests, and that judgement belongs to whoever is writing the CV.

**Decision.**

- The glyph box is exactly one line tall (`height: 1lh`, with an `em` fallback) with the glyph
  centred in it and `vertical-align: top` / `align-self: flex-start`. It then sits on the same
  optical centre as the first line of text beside it, in both inline and flex contexts. Measured
  across all 57 glyphs of the sample: every one is centred on its first line to the pixel.

- `SECTION_ENTRY_ICON` gives each repeatable section one marker — a briefcase for work, a cap for
  education, a certificate for credentials — drawn in a gutter with the rest of the entry indented
  to match. One glyph per section, not one per entry: the marker's job is to separate siblings, and
  siblings that each looked different would separate nothing. The gutter rather than an inline mark
  is what makes it scannable; an inline glyph leaves the second line flush with the first.

- `TemplateSupports.entryMarkers` decides whether a design wants them, separately from `icons`.
  Classic Double Column already runs a dated timeline rail down the left and Side Panel a hairline
  between roles; a marker on top of those is noise. Markers are on for Academic / Govt CV, Modern
  Sidebar and Vibrant, off for the six that answer the question their own way — and forced off
  wherever `icons` is off, which a unit test asserts.

- `meta.sections[key].showIcons` turns a section's glyphs off. It defaults on and is only ever
  subtractive: a design that draws none is unaffected. `SectionBody` resolves both switches in one
  place so no block decides for itself, and the Sections panel offers the switch only where the
  current design would actually draw something.

**Consequence.** Adding the field to the schema was not enough: `repairSectionSettings` rebuilds each
setting key by key, and a field left out of it is silently reset on the next load — which is
indistinguishable from the setting not working. A unit test now saves and reloads a document with a
section's icons off.

Six glyphs were added for the markers (briefcase, graduation, certificate, flask, mic, handshake),
and they are offered in the icon picker too, since the reasons to want a handshake beside a skill
group are the user's own.

The ATS gate is unchanged by all of it: these are inline SVGs with `aria-hidden`, so nothing reaches
the text layer. See ADR-003.

---

## ADR-023 — The PDF carries the CV that made it

**Context.** A CV exported by this app and imported back into it did not come back. The release gate
had said so all along, in its own words: *"a grid-based design emits its text runs in build order,
not reading order… no offline heuristic recovers the pairing from that, because the pairing is not
in the file."* Full recovery was asserted for the plain template only. Every design template was a
one-way door.

And the parser is not the limit. `ParsedResume` is a partial — nine field groups — and a resume is
far more than that: the section order, the theme, custom sections, per-section settings, the
declaration, the signature. None of those are *on the page* as anything a parser could name. No
amount of better parsing reaches them.

**Decision.** Write the document into the file it produced. `/api/pdf` attaches the resume to the
rendered PDF as an embedded file — gzipped JSON in a small envelope carrying `app` and
`schemaVersion` — and the import pipeline reads it before it reads anything else.

Where it goes, and why not the alternatives:

- **An embedded file.** A first-class PDF object that viewers list and that travels with the
  document through email and copies. It changes nothing about what is drawn or what the text layer
  says, so an ATS reads exactly what it read before.
- *Not metadata.* The first thing a "compress this PDF" tool strips.
- *Not hidden text.* It would land in the extracted text layer, which is the one thing this project
  exists to keep clean. See ADR-003.
- *Not a QR code.* About 3KB of capacity, and an image for a parser to trip over.

A restore is not an import. `applyImport` merges a partial over a document, which is right for a
parse; applying a whole document that way would quietly drop everything a `ParsedResume` cannot
represent. The payload therefore takes its own path — `stage: 'restore'`, one confirmation, then
`replaceResume` — while the parser and its review screen stay exactly as they were for every other
file.

**Consequence.** The fallback is the point. A stripped, edited or foreign PDF decodes to null and
the heuristic runs as before; the attachment is a fast path, never a replacement. Failing to attach
does not fail the export either — the PDF is already correct by then, and losing the payload costs
the round trip, not the document.

`tests/regression/pdfRoundTrip.spec.ts` renders the sample through all nine templates, reads the
attachment back and asserts deep equality, plus one case built from the parts a parse cannot reach:
a custom section, a reordered document, an accent colour, a section with its icons off, an undated
declaration.

Two things had to be learned from the libraries rather than assumed. pdf-lib writes the name tree
correctly but only shows it on `save()`. And pdf.js 5 split the attachment listing from the bytes:
`getAttachments()` now returns a **Map** of names and descriptions, and content comes from
`getAttachmentContent(name)` — the older `entry.content` shape is still read, because the browser
and the release gate load different builds.

Verified end to end, which is the claim that matters: a CV exported from one profile, then opened in
a **fresh incognito profile** whose editor starts empty, comes back with every field identical.

---

## ADR-024 — The photo's shape is one number

**Context.** Showing and hiding the photo already worked; its shape did not exist as a setting.
Every design hard-coded `border-radius: 999px` — except Academic / Govt CV, which had none at all,
because the square passport photo is the convention those forms expect. So the shape was a property
of the design, and a user who wanted a square photo on a circular design had no way to ask.

**Decision.** `theme.photoRadius`, a percentage of the photo's own square box: 0 is a square, 50 is
a circle, and everything between is the rounded rectangle someone actually wanted.

One number rather than a shape enum plus an override. Named shapes and a free radius are the same
setting seen twice, and storing both invites the state where they disagree — a document saying
`shape: 'circle', radius: 12`, and every reader of the pair having to decide which wins. The three
buttons in the Design panel write values onto this one scale, and the slider moves along it; the
button that matches the current value lights up, which is the whole of the relationship between
them.

It reaches the templates the way every other theme value does — `--rz-photo-radius` from
`resolveTemplateStyle`, read by each design's photo rule.

**Consequence.** Each design that draws a photo states its own `defaultTheme.photoRadius`, so
switching to Academic / Govt CV squares the photo the way its convention wants and switching away
rounds it again. That is the same hazard as ADR-018's missing margin — a value omitted here would
silently inherit the previous design's shape — so a unit test asserts every template with
`supports.photo` declares one.

The controls appear only when the design draws a photo *and* the photo is switched on. A radius
slider above a hidden photo is a control over nothing, which is what ADR-019 is about.

---

## ADR-025 — Framing the photo, not cropping it

**Context.** A square or circular frame cut from a portrait photo takes the middle of it, which is
where the chin usually is. Heads went over the top edge and there was no way to say otherwise:
`object-fit: cover` defaults to `object-position: 50% 50%` and every design hard-coded nothing else.

**Decision.** `basics.photoFrame` — `x`, `y` and `zoom`. The frame centres on the point the reader
picked and magnifies about that same point, so what they chose stays put as they zoom.

Not a crop. Rewriting the image through a canvas would mean either keeping the original alongside
it — the photo is a data URL in IndexedDB and in the PDF's payload, so that is real weight — or
losing the ability to re-frame without another upload. Framing is three numbers, adds nothing to any
file, and a bad frame is one drag away from being right.

It lives beside the photo rather than in the theme, and that split is deliberate: the *shape* of the
frame belongs to the design (ADR-024 put `photoRadius` in `theme`), while *which part of the image
shows through it* belongs to the image. So it survives switching designs, and resets when a
different photo is uploaded — the old framing described someone else's head.

**Consequence.** Zoom needs something to clip against: a scaled image overflows its own box and only
an ancestor with `overflow: hidden` cuts it back. Rather than add a wrapper to seven call sites, the
photo now renders through one shared `PhotoFrame` component. Each design's own class moved onto the
wrapper, where it goes on deciding the size, the shape and the spacing; `object-fit` moved onto the
image inside it. No design knows about framing.

Verified with a deliberately awkward photo — a tall portrait with its subject in the top quarter,
the exact case that was failing. Dragging down moved the focal point from 50% to 18.75%, the zoom
applied as `scale(1.8)`, both persisted to the document, and the exported PDF differs from the
unframed render, which is what says the values reach the print pass and not only the preview.

---

## ADR-026 — A grid on the section stacks the spacing a block collapses

**Context.** The gap under the Certifications heading was visibly larger than under every other
heading — but only in Classic Double Column, and only there because that design is the one that runs
credentials two-up, which it did by making the whole `<section>` a grid and letting the heading span
both columns.

Measured against its own Work Experience heading in the same document: 5.0px there, 18.8px under
Certifications. The three parts are exactly the difference between the two layouts. A block container
**collapses** the heading's `margin-bottom` (5px) against the first entry's `margin-top` (4.8px) into
one 5px gap. A grid container collapses nothing and adds its own `row-gap` (9px) between the rows, so
all three stack: 5 + 9 + 4.8.

**Decision.** The grid moves off the section and onto the entries. `CertificationsBlock` wraps them
in `rz-entry-list` — unstyled by default, so nothing changes anywhere else — and Classic Double
Column lays that out two-up instead. The section goes back to being a block, its margins collapse
like every other section's, and the heading no longer needs `grid-column: 1 / -1`.

Not `rz-grid-2`, the class the achievements and referees blocks use for the same shape: four other
designs already style it, and reusing it would have quietly turned certifications two-up in Formal
Centered and moved them into the icon gutter in Side Panel. A neutral class changes exactly one
design.

**Consequence.** Certifications now shows 5.0px in Classic Double Column, the same as its Work
Experience, and the two-up layout is intact — the first two credentials still sit on one line at 48%
width each with the heading spanning the full width. Every other template measured identical before
and after.

The general shape of the defect is worth remembering: a spacing that looks wrong under one heading
usually means that section's container is not the same kind of box as the others.

---

## ADR-027 — Compact Professional, re-measured against its reference

**Context.** The design was built from `CV_Rakesh_SQA_AUST_CSE_3YOE.pdf` and asked to match it
exactly. Reading both text layers side by side — same script, same metrics — showed the type was
right and the spacing was not.

Right already: name 26.9pt, section headings 14.3pt, body 10pt, left margin 41.5pt, entry indent
48pt, bullet marker 61.5pt. Wrong: the line height, four separate gaps, and one structural
assumption.

**Decision.** Each number now comes from the reference rather than from an eye.

| | reference | was | now |
|---|---|---|---|
| body line height | 11.95pt | 11.2 | 12.0 |
| heading → first line | 14.8–15.5pt | 17.2 | 15.0 |
| section → section | 24.2–25.6pt | 23.3 | 25.5 |
| entry → entry | 19.3pt | 18.7 | 19.5 |
| bullet marker, from entry text | 13.3pt | 8.5 | 13.3 |
| wrapped bullet, from marker | 8.0pt | 10.1 | 8.0 |
| bullet glyph | 9.96pt (body size) | 9.0 | 10.0 |

Two of these were not tuning but mistakes:

- **The first entry carried a half-gap the design does not have.** `resume.css` gives
  `.rz-entry:first-of-type` a margin so an entry does not sit hard against a heading; this design's
  reference does exactly that, and the extra 3.2pt showed as a heading gap two points wider under
  every entry section than under the summary.

- **The date column was reserved down the whole entry.** `.rz-entry__meta` spanned twenty rows, so
  every line of every bullet wrapped 120pt early against a margin nothing was using — the reference
  runs its bullets the full width and puts the dates on the head line alone. The meta now occupies
  row one and everything below it spans both columns.

Achievements also stopped being two-up. The `rz-grid-2` rule was written for referees, which the
reference does set two-up and smaller, but the same class carries achievements, which it sets full
width like any other entry. The rule is scoped to referees now.

**Consequence.** Also found, and deliberately not changed:

- **The reference is US Letter (612 × 792 pt); the app renders A4.** Page size is not a per-document
  setting here — `PAGE_SIZE_MM` is fixed at 210 × 297 and the preview, the margins and the
  pagination all derive from it. Matching it is a feature, not a spacing fix, and it is the one
  difference between the two documents that this ADR does not close.
- The left margin is 0.5pt out (42.0 against 41.5) because `marginMm` is an integer 15 where the
  reference is 14.64mm. The margin slider steps in whole millimetres, so a fractional default is one
  the reader could never return to.

A section gap sampled from one place is not a measurement: the first pass matched the single
Summary → Experience gap of 20.8pt and made every other section 4pt too tight. The reference has
that gap once and 24.2–25.6pt five times over.

---

## ADR-028 — "Fix it" has to land where the fix is

**Context.** The score panel tells the reader what is wrong and offers a "Fix it" link to the place
to change it. Driving every link in a browser, against a document rigged to fail a spread of rules,
found four defects and one piece of noise.

| rule | what it did |
|---|---|
| Template parse reliability | no link at all — and it is the heaviest parseability rule |
| Length | no link, while its own hint said "tighten spacing under Design" |
| Section count | no link, while its own hint said to turn sections off |
| Core sections | link went **nowhere**: it targets a *disabled* section, which has no tab |
| Section headings | went to the section's form, which has no heading field |
| Measurable outcomes, Action verbs | offered "Fix it" while **passing** |

The four were one cause. `targets` was typed `SectionKey[]`, so a rule could only ever point at a
section — and these fixes are not in a section's form. Choosing a design that parses, tightening the
type, renaming a heading back, switching a section on: those live in the Design and Sections panels.
Rules whose fix lived there either said nothing or pointed at the nearest section, which is worse
than saying nothing.

**Decision.** A fix target is a section *or* a panel: `AtsFixTarget = SectionSlot | 'panel:design' |
'panel:sections'`, prefixed the way a custom slot is so the two can never be confused. The editor
routes a panel target to the panel and a slot to the form, and the five rules above now point at the
panel that holds their fix.

The passing-rule links were the other half of something the rules already did right: those returns
drop their `fixHint` when the status is `pass` but return `targets` regardless. `RuleRow` now
withholds the link on a pass, which fixes it for every rule at once rather than editing each return.

**Consequence.** Three unit tests hold the line, run across five documents and four contexts so no
failing branch goes unvisited: every non-passing rule carries a target, every target names a place
the editor can actually open, and the panel-fixable rules name their panel.

Re-driven in the browser afterwards: eight failing rules, eight links, each landing on Design,
Sections, Profile or Work Experience as its fix requires — and no link on any of the twenty rules
that pass.

---

## ADR-029 — Nothing is handed between the PDF route and the print page

**Context.** Deploying to Vercel exposed a constraint `payloadStore.ts` had documented from the day
it was written: *"this assumes the route handler and the print page run in one process, which holds
for `next dev`, `next start`, and a single serverless instance. A multi-instance deployment needs a
shared store here."*

On Vercel each route is its own instance. `/api/pdf` stored the resume in memory under a token and
sent the browser to `/print?token=…`; that request leaves the machine and comes back to a *different*
instance, which finds the map empty and returns a 404. The export could not have worked there.

A shared store would fix it and cost a service, a credential and a round trip. It is also solving
the wrong problem: the print page never needed the resume in order to *be* the print page. What it
provides is a document with the app's stylesheets and font faces already resolved.

**Decision.** The print page is an empty shell that takes no parameters. The PDF route renders the
resume to markup itself — same components, `renderToStaticMarkup` — and injects it into that shell's
body once the browser has loaded it. There is nothing to hand over, so there is nothing to share.

The forced page breaks (ADR-021) moved into the same injection, which also removed the inline
`<script>` the print page used to carry.

`react-dom/server` is imported dynamically inside the handler: the App Router refuses a static
import, on the assumption that anything reaching for it is a component that should have been a
server component. A route handler producing a string for a browser to swallow is the case that rule
is not about.

**Consequence.** `payloadStore.ts` is gone, along with `PRINT_PARAMS`. The route is simpler than it
was and no longer has a single-process assumption to violate.

`puppeteer` moved to a dev dependency and `puppeteer-core` took its place, with
`@sparticuz/chromium` supplying the browser where the environment says serverless. Both drive the
same API, so only the binary and its flags differ.

Verified by the full gate — 123 regression tests, every template rendered, extracted, imported back
and compared — against the new path.

---

## ADR-030 — CleanCV on screen, `cv-maker` on the wire

**Context.** The project was renamed. The old name appears in places that are not names on screen:
the IndexedDB database, three localStorage keys, the backup file's `kind` discriminator, and the
`app` field of the payload embedded in every PDF already exported (ADR-023).

**Decision.** Only what a reader sees changes. `APP_NAME`, the package name, the README and the
import dialog say CleanCV; every stored and wire identifier keeps the string it was written with.

Renaming the database would orphan the CVs someone has saved. Renaming the payload's `app` field
would stop their own downloaded PDFs importing — the reader checks that field before it parses
anything. A format identifier's job is to stay the same; that is the whole of its job.

**Consequence.** A comment sits above those constants saying so, because a later reader will
otherwise take the mismatch for something left half-done.

---

## ADR-031 — A design may name a face; only the picker names a font

**Context.** Formal Centered was measured against a reference page set in PT Sans over Volkhov.
Neither face was loaded. The obvious fix — pin both in the stylesheet — would have made the font
picker inert for that one design, which is the failure ADR-019 already names: a control that a
subject silently ignores is worse than no control.

**Decision.** The two faces enter by different doors.

PT Sans became a picker value (`humanist`), sitting beside Inter, Source Serif and Space Grotesk,
and Formal Centered's `defaultTheme` starts on it. The reader still gets a font control that works,
and the design still opens on the pairing it was measured for.

Volkhov is not offered. It is a display serif — a name and six headings a page — and a body set in
it would be unreadable at 9pt. It loads as `--font-display-serif` and a design reaches for it by
name, the way Formal Centered already reached for the serif it was using.

The same change let the headings drop `text-transform: uppercase`. That property reaches the PDF's
text layer, so it is a content decision as much as a visual one; both spellings pass, because the
heading vocabulary is matched case-insensitively (ADR-011), which is what makes this the design's
call rather than the parser's.

**Consequence.** `FONT_FAMILIES` gained a key, and the Zod enum, the label map and the picker took
it without being touched — they all read the one array. Every other design is unchanged; the new
face is simply available to them.

A design that wants a face nobody should be able to pick for their body text now has a pattern to
follow, and one that just wants a different body font has a picker value instead of a stylesheet
override.

---

## ADR-032 — A point in a list carries a mark, and the mark is text

**Context.** Key Achievements renders as two-up cards: a bold title, a paragraph under it. Designs
that draw glyphs put a trophy in front of each title, and the four points read as four points. On
the designs that draw none — Formal Centered, ATS Plain — nothing marked where one ended and the
next began, so four achievements read as one passage with bold phrases scattered through it.

**Decision.** The block marks every achievement. The design's glyph where it draws glyphs; a literal
U+2022 in an `aria-hidden` span, followed by a real space, where it does not.

A `::before` would have been shorter and is wrong for the same reason it is always wrong here:
generated content does not reach the extracted text layer, so the mark would exist on the page and
not in the file. The space after the bullet is a text node for the same reason a separator is
(ADR-015) — without it the extracted line reads "•Strategic Project Leadership".

**Consequence.** `supports.icons` now decides which mark an achievement gets rather than whether it
gets one. No design has to opt in, and none of the five that draw glyphs changed.

---

## ADR-033 — A meta the block calls inline is not a margin

**Context.** `EntryShell` puts the dates and the place in one paragraph so the extracted text keeps
them on a line together, and designs lift that paragraph into a right margin. The references block
reuses the same class for something different — a referee's email, phone and how they know you,
under their name in a two-up cell — and marks it `rz-entry__meta--inline`. Nothing read the
modifier. Formal Centered's margin column is right-aligned and `white-space: nowrap`, so the
referee's contact line squared itself off against the right edge of its cell with the width of the
card empty beside it.

**Decision.** Formal Centered styles the modifier back into the flow: block, full width, left
aligned, wrapping. Keyed on the modifier the block sets, not on `[data-section='references']` — the
block is the thing that knows this meta is not a margin, and a design that grows another inline meta
gets the right behaviour without a second selector.

**Consequence.** Two designs already patched this by section name (`classic-dc`, `compact-pro`);
they keep working and can move to the modifier whenever they are next touched. Any design that
lifts `.rz-entry__meta` into a margin now has one class to exempt.

---

## ADR-034 — The entry marker's gutter never worked

**Context.** `.rz-entry--marked` indents an entry by 1.7em and pulls its glyph back into the gutter,
so several entries under one heading read as a list (ADR-022). The pull-back was written as
`.rz-entry--marked > * > .rz-cat-icon`, plus a second selector naming `.rz-entry__org`.

`EntryShell` puts the glyph in one of two places. Leading with the organisation it is
`article > p.rz-entry__org > span` — two levels, which the child selector reaches. Leading with the
title, which is what every design that draws markers actually does, it is
`article > div.rz-entry__head > h3.rz-entry__title > span` — three levels, which it does not.

So on all three designs that draw entry markers, every entry was indented by the gutter with its
glyph sitting inside the text column: entries started further right than their own heading, and the
gutter reserved 1.7em that nothing used.

**Decision.** Name both places the component puts it, explicitly, including the nested one.

**Consequence.** Academic CV, Modern Sidebar and Vibrant now hang their markers where the design
always said they were. The gutter and the pull-back are still expressed in different `em` bases —
the entry's and the title's — which leaves about a pixel of drift; that is smaller than the hairline
it would take to notice and not worth a second custom property.

---

## ADR-035 — The last preview page is a whole page

**Context.** Each preview sheet is a window onto the flow, and its height was
`min(pageHeight, nextPageOffset - offset)`. On the last page there is no next offset, so it fell
back to the content height and the window stopped at the last line.

Chrome's final page box is a whole page regardless of how much content lands on it, so anything a
design paints below its last line — a rail's bottom padding, a block's background — is on the
exported page and was missing from the preview.

**Decision.** The last page's window is a full page. Every other page keeps the shorter of the two,
because that difference is the white space left by an entry moved down to stay whole, which is the
thing separate sheets exist to show.

**Consequence.** Modern Sidebar's rail now ends in the preview exactly where it ends in the PDF.

It does not end at the foot of the paper, and nothing in the flow can carry it there: an absolutely
positioned extension made Chrome paginate a page further than the preview, and `position: fixed`
repeats per page in print but resolves against the preview's zoom transform on screen. ADR-036 takes
the colour out of the flow entirely and settles it.

---

## ADR-036 — A band down the page belongs to the page, not the document

**Context.** Modern Sidebar's rail was a coloured flex item inside the flow, and the flow is inset by
the page margins on all four sides. So the rail floated: white above it, white to its left, white
below it, and on the last page it stopped with the final line of the panel.

Two facts bound the problem. Nothing paints into a PDF page's margin area — not a body background,
not the root element's, not an absolutely positioned box, which Chrome instead paginates into an
extra page. And vertical padding on a continuous flow applies only to its first and last fragment,
so page two's first line has nothing but the page's top margin keeping it off the paper.

**Decision.** A design declares `pageBleed: { width }`, and two things follow.

The page's **left** margin is dropped, so the flow starts at the paper's edge and the band can reach
it. The design insets its own content instead — horizontal padding applies to every fragment, so
that works on every page. The top and bottom margins stay, because those are the ones that cannot
move inside the flow.

The band is painted by the **page** rather than by an element. The preview puts it on each sheet.
The export needs two, because no one thing covers a whole printed page: the root element's
background, which Chrome propagates to the page canvas and which covers the page box; and Chrome's
print **header**, which is the one thing that renders into a margin area, and renders on every page.
The header carries two `position: fixed` strips — fixed inside a header is measured against the whole
sheet rather than the header's own slot, which is what puts them on the paper's top and bottom edges
instead of inside the header's default padding. Both strips come from the header; the footer template
is a blank span, because a blank one is what stops Chrome printing page numbers.

All three read one `resolvePageBleed`, and the band itself is built by `pageBleedBackground` in
`lib/`, the layer both the preview and the PDF renderer can reach — a design that came out with two
different bands would be a preview that lies. `--rz-bleed` carries the same width into the
stylesheet, so the design's rail column is exactly as wide as the band it sits on.

Because the page paints it, it covers the last page too, where the flow stops with the content.

**Consequence.** The rail runs to all four edges of every printed page — measured on the rasterised
export, 0 to 296.5mm of a 297mm sheet and 0 to 68.7mm of a 69mm band, the shortfalls being the
rasteriser's rounding — and the narrative keeps its margins.

`.resume-root` paints no background under a design with a band — the shared white would cover it
everywhere except the one strip it cannot reach.

The strips overlap the page box by half a millimetre. The colour is the same either side of the
join, so the overlap is invisible, while butting them exactly leaves a hairline of paper wherever the
two edges land on different pixels.

---

## ADR-037 — A design marks an entry once

**Context.** Vibrant declared `entryMarkers: true` while also running a timeline rail — a border down
the left of every entry with a dot at each role. Once ADR-034 made the marker's gutter work, the
glyph landed on the rail and its dot, and the two drew over each other.

ADR-022 had already written the rule this violated: a marker is for designs that have not otherwise
said where one entry ends, and "the classic design runs a dated timeline rail down the left […] and
a marker on top of those is noise, not help". Vibrant was the case the sentence describes.

**Decision.** `entryMarkers: false`. `icons` stays on — the glyphs beside skill groups and
achievements are a different thing, and the design is the one that leans on them most.

The rail became continuous in the same pass. The space between one role and the next was the entry's
top *margin*, so the border stopped at each entry's last line and began again at the next; it is now
the entry's top *padding*, which the border runs through. `--vbr-lead` holds that space and the
timeline dot reads the same value, so the dot stays on the title's line wherever an entry begins.

**Consequence.** One mark per entry, and a timeline that is a line rather than a row of dashes.

The trailing value moved off the far margin at the same time: `justify-content: space-between` on a
full-width single column put "CGPA: 3.20" against the right edge with the width of the page between
it and the degree it qualifies.

---

## ADR-038 — Verdant, and what a second column costs the parser

**Context.** A tenth design: a portrait and the supporting sections in a left panel, the narrative on
the right, every heading behind a rounded badge in a soft green, and the headline in a pill of the
same. Two real columns, like Side Panel and Modern Sidebar.

It failed two of the release gate's assertions on its first render, and both were about the *text
layer* rather than the page.

**Decision.**

*The identity is first in the DOM and second in the grid.* Grid places it into the right column's
first row; the panel spans both rows on the left. Markup order is identity, panel, main, so the
extracted text opens with the name — a panel-first order would have buried it under the
certifications (ADR-004).

*Achievements moved to the narrative column.* In the panel they were painted first, so the extracted
text named Grameen a page before the Shikho bullets that come before it, and "keeps each role next to
its own bullets" failed. Achievements are narrative — they name the employers they happened at — and
belong beside them. Modern Sidebar's rail already holds only sections that name nothing.

*The heading badge reads `SECTION_HEADING_ICON`, a new and complete map.* `SECTION_ENTRY_ICON` marks
entries and is deliberately partial — a section with no entries needs no glyph — but a heading always
has one to draw, and every section falling through to the same star was not a design. A custom
section still resolves to nothing and lets `CategoryIcon` guess from the reader's own words.

*Two parser fixes, both general.* `parseHeader` reads the lines below the first heading for any
contact detail the header window did not yield: a design that stands its contact list in a side panel
under its own heading puts every one of them below the *other* column's first heading, and the window
then holds a name and nothing else. And an education entry with neither a degree nor an institute is
dropped — a wrapped place in a right margin leaves a line on a row of its own that reads as the start
of another entry, and an empty row is worse than a lost detail.

**Consequence.** Ten designs. The gate went from 123 checks to 136 and passes; the two parser changes
help any two-column CV, whoever made it.

The design is `atsBaseline: 78` — Side Panel's cost for two columns, plus the portrait's.

---

## ADR-039 — One cut across two columns is not what Chrome does

**Context.** The preview paginates by finding the first *atom* — an entry, a bullet, a heading with
its first fragment — that would straddle the foot of the page, and moving the page's start up to it
(ADR-020). For one column that is exactly Chrome's behaviour restated: pushing the atom down and
moving the cut up are the same thing.

For two columns they are not. Chrome fills each column to the foot of the page and pushes only what
straddles into that column's next fragment. The preview moves one cut for the whole flow, so a panel
entry that will not fit drags the *narrative* column up with it — on Verdant's first render, 15% of
page one went blank in both columns because one skills group in the panel overran.

Side Panel and Modern Sidebar never showed it: their panels end well short of the page, so only the
narrative column ever drives the break. Verdant's panel is dense enough to compete, and the release
gate's "the PDF's page two opens with whatever the preview put at the top of page two" then failed.

**Decision.** The gate asserts that check for single-column designs only, and asserts the page
*count* for every design as before.

This is the promise the code already makes. The export is sent the preview's breaks and sets them
for a single column, so those two cannot disagree; for two columns it sends none, precisely because
one cut across two columns is not a thing Chrome can be asked for (ADR-021). Asserting it anyway was
asserting a property that held for two designs by the luck of their content.

Moving sections between the columns until it passed was the other option, and it is not one: it
tunes a design's shape to a fixture.

**Consequence.** Verdant keeps the split its reference uses. The two columns can differ by an entry
on which side of a break it falls; the page count cannot.

The real fix is to paginate each column separately in the preview — a per-column offset per sheet,
which the current single-transform sheet cannot express. That is a piece of work in its own right and
would remove the last difference between the preview and the export for every two-column design.

---

## ADR-040 — Verdant, measured off the reference rather than guessed

**Context.** The first pass at Verdant was built from a small screenshot and read as the right idea
in the wrong colours and proportions. Sampling a larger one settled every open question at once.

**Decision.** The values are the reference's, taken from its pixels:

| | |
|---|---|
| pill and leaf | the accent at 63% toward white |
| badge and outline | the accent at 38% |
| dot | the accent itself |
| heading text and badge glyph | a deep green, the accent at 26% over near-black |
| everything else | one neutral `#3e3e3e`, headings excepted |

The heading badge's glyph was pinned to the top of its square, which is what the reader saw as "not
centred": `.rz-cat-icon` sets `align-self: flex-start` so a glyph beside a line of text sits on that
line, and the badge is a centring flex container that the property overrode. Named explicitly here.

The mark around the portrait is four SVG paths, traced off the reference rather than approximated:
**two open arcs that do not meet** — a long one over the top, a shorter one under the foot, with a
gap on the left between them — a crescent filling the space between the photo and the upper arc on
the right, and a disc where the lower arc passes the left.

Traced, because three attempts at guessing it were all wrong in the same way: a bordered circle
leaves a mitred step wherever a side stops, a stroked circle is clean but is still a circle, and a
single blob outline is a closed loop where the reference has two strokes.

Reading the grid told me the *shape*; hand-writing Bézier control points from it did not give me the
*curve*. Anchors picked off a coarse grid are noisy, and a curve forced through noise kinks. The
paths in the file are generated: the reference's outline colour is sampled along a ray at every few
degrees, the midpoint of each hit is the centreline, the radii are smoothed, and the result is
converted to cubics through a Catmull-Rom fit — which is C1 continuous, so there is nowhere for a
kink to be. Same for the leaf, whose two edges come out of the same scan; the disc is a centroid and
a radius.

That also settled the frame's size, which was guesswork before: the reference's photo is centred at
57,52 of the mark's box with a radius of 38, and it has to be exactly that, because the leaf's inner
edge *is* the photo's edge. A smaller frame leaves a band of paper between them and the leaf reads as
floating.

**Consequence.** One thing is deliberately not reproduced. The reference's badge glyphs are solid,
and filling these paths gives exactly that for the ones whose outline *is* the form — a person, an
envelope, a certificate — while destroying the ones whose meaning is in their interior lines: a
filled globe is a disc, and so is a filled target. A heading glyph is chosen by section rather than
by hand, so all of them have to survive it. They are drawn in the same deep green at a heavier
stroke instead.

The preview still cuts a panel entry across a line at the foot of a page where the export pushes it
whole (ADR-039). Retracting the break past every straddler removes the cut and costs a page the
export does not have — the page count is the thing that has to agree, so the cut stays.

---

## ADR-042 — The page map: reordering by the shape rather than by the name

**Context.** Section order was a list of names with drag handles. It says what the order *is* and
nothing about what it does: which page a section lands on, which column it sits in on a two-column
design, how much of the page it eats, whether it runs over a break. Everything a reader actually
wants to move a section about is invisible in a list.

**Decision.** A second view of the same order — pages drawn as sheets, sections drawn as boxes where
they actually fall, at the size they actually take, dragged to reorder. Both exist: the list is the
one that works without a pointer and holds the toggles and headings, the map is the one that shows
the consequence.

The geometry is **measured off a real rendering**, never estimated from the section list. A hidden
copy of the template at true page width is mounted with the dialog, `usePreviewMetrics` paginates it
with the same model the preview uses, and each `[data-section]` is read for its rectangle. Off screen
rather than the preview pane, because the map has to be right whether or not the preview is on
screen, and at the preview's zoom every measurement would need dividing back out (rule 20).

Mounted with the dialog, not kept alive behind it: it renders a second copy of the whole document,
which is not work to do on every keystroke.

A section crossing a page break draws a box on each page, and only the first carries the handle — the
same section cannot be two different things to drop onto. The rest are dashed and marked "(cont.)".

The band above a column's first section is drawn as a locked "Header". Per column, because a
two-column design stands its name over the narrative and starts its panel at the very top: one band
measured from the topmost section anywhere would have been nothing at all.

**Consequence.** Reordering can be done against the picture rather than against a list of names. The
map re-measures after every drop, so the consequence of a move is on screen before the next one.

The hook returns its ref alongside plain values, and the component destructures it immediately:
React's lint rules read *any* property of an object holding a ref as reading the ref itself.

---

## ADR-043 — Which column a section is in is the document's, not the design's

**Context.** The page map (ADR-042) let a section be dragged anywhere, and dropping one from the
panel onto the narrative column did nothing but reorder it. It could not do anything else: which
column a section takes was a constant inside each two-column template — `MAIN_SECTIONS` in Verdant
and Side Panel, `RAIL_SECTIONS` in Modern Sidebar — so the answer was the design's and the reader had
no way to disagree with it.

**Decision.** `meta.columns` — a per-section override on the document, resolved against the design's
own split by one `resolveSectionColumn`, which both the template that lays the columns out and the
map that draws them read. A template declares its default as `mainSections`; anything unlisted,
including a custom section, takes the panel.

**Sparse on purpose**, unlike `meta.sections`, which is rebuilt key by key so a new setting arrives
with its default (ADR-022). Here an absent entry means "let the design decide", and filling it in for
every section would freeze one design's arrangement onto every design the reader switches to
afterwards. Only a section actually moved is stored.

One store action, `placeSection(slot, index, column)`, does the position and the column in a single
commit: one drag is one thing to undo.

**Consequence.** A section can be dragged out of the panel and into the narrative, and it stays
there. The Sections panel gained a Main/Panel control for the same move without a pointer — the map
is the fast path, never the only one.

Two things about the drag itself came out of the same pass. A `DragOverlay` carries the box under
the pointer, leaving the original as a dashed hole and ringing the box under it, because without one
nothing moved during a drag at all. And the dialog is centred by flex rather than by
`-translate-x-1/2`: `position: fixed` resolves against a transformed ancestor, so the overlay — which
dnd-kit positions in viewport coordinates — was landing half a screen from the pointer.

---

## ADR-044 — Drawn, not traced

**Context.** Verdant's portrait mark went through four shapes. A bordered circle, which leaves a
mitred step wherever a side stops. A stroked circle, clean but still a circle. A hand-written blob,
which kinked. And finally a faithful trace of the reference — its outline colour sampled along a ray
every few degrees, the midpoints smoothed and fitted (ADR-040).

The trace was accurate and still looked wrong. The reference was drawn by hand: its arcs wander, and
a curve fitted to them carries the wander with it. Faithfulness to a hand-drawn source and evenness
are different goals, and the reader wanted the second one.

**Decision.** The mark is constructed, not copied. A ring of radius 44 about the frame's own centre,
drawn as two arcs of a `<circle>` with `pathLength="100"` — which makes the dash pattern read as
percentages, so an arc is a span in degrees over 3.6 and the two are mathematically even. A shorter,
lighter arc of radius 38.5 in the deeper green, concentric and clear of the frame on both sides. A
disc on the lower arc.

The deeper green started as a crescent filling the space between frame and ring, which is what the
reference has. Built to touch the frame's edge at its widest it read as a blade laid across the
picture rather than as part of the mark — the reference gets away with it because its frame is a
cut-out with no edge to cross. Concentric and clear of both neighbours, the same colour layers
instead.

The reference still set everything it should: the three greens, the idea of two arcs with gaps rather
than a closed ring, the crescent, the disc. What it could not give was the geometry, and that is the
part a formula does better than a trace.

**Consequence.** The frame is concentric with the ring at 70% of the mark's box, so the gap around it
is even. Changing the design is now editing four numbers — two spans, a radius, a thickness — rather
than a thousand characters of path data. ADR-040's rule stands for *measuring* a reference; this is
where measuring stops and drawing starts.

---

## ADR-045 — Three designs renamed; no id moved

**Context.** Ten designs, and three of the names were working against the list they sit in.

*Classic Double Column* named the thing the design is proud of not being. Its left rail holds dates
and locations and its whole claim — a 95 baseline — is that it reads as one column; the name promised
the two-column layout the genuinely two-column designs have.

*Side Panel* and *Modern Sidebar* are near-synonyms for different designs: a plain panel on the right
against a coloured rail on the left. A reader scanning a dropdown cannot tell which is which.

*Verdant* names a colour on a design whose accent the reader can change, and it rhymes with *Vibrant*
two rows away.

**Decision.**

| id | was | is |
|---|---|---|
| `classic-dc` | Classic Double Column | Classic Timeline |
| `side-panel` | Side Panel | Right Panel |
| `verdant` | Verdant | Portrait Panel |

The other seven stand. ATS Plain, Formal Centered, Elegant Serif, Academic / Govt CV, Compact
Professional and Modern Sidebar each say what they are; Vibrant is evocative but its category does
the explaining.

**No id changed.** `meta.templateId` is stored in every saved document and inside every PDF this app
has already exported, and the schema falls back to the default for an id it does not recognise — so
renaming one would silently move somebody's CV to a different design, quietly, on load. Ids are wire
identifiers and do not follow a rename (ADR-030). The folder names stay with them; each file's
heading comment now carries both, as `Right Panel (\`side-panel\`)`.

---

## ADR-046 — A column-scoped rule is a rule about a structure

**Context.** Right Panel put the glyph beside an achievement into a gutter, with

```css
.spl .spl-side .rz-cat-icon { position: absolute; left: 0; top: 0.1em; display: inline-flex }
```

and the gutter itself — `position: relative` and a `padding-left` — on `.spl-side .rz-grid-2
.rz-entry`, which is what achievements render as. The selector said *the panel*; the layout it
depended on was *the two-up entry*. While the panel's contents were fixed the two were the same
thing.

ADR-043 made them different. A section can now be dragged across, and dragging skills into the panel
put a `.rz-cat-icon` there that is not in a two-up entry. Two consequences, both from that one rule:

- It has the same specificity as `.spl .rz-skills .rz-cat-icon { display: none }` and comes later, so
  its `display: inline-flex` won and un-hid a glyph the design had deliberately hidden.
- `position: absolute` with no positioned ancestor resolves against the initial containing block, so
  the glyph landed at the top-left of the *page* — printed over the person's name.

**Decision.** Scope the rule to the structure it needs: `.spl .spl-side .rz-grid-2 .rz-entry
.rz-cat-icon`. It can now only apply where the gutter it assumes actually exists.

**Consequence.** Skills in the panel keeps the hidden glyph the design intended, and there is nothing
left in the panel that can escape.

The other two designs with an absolutely positioned decoration were checked: Portrait Panel's mark
and Vibrant's timeline dot both sit inside an element that is `position: relative` in the same rule
set, so neither can escape.

Reproducing it took a scripted move rather than a screenshot — the sample resume leaves skills in the
narrative column, so the layout that shows the bug is one the fixture never renders. Worth
remembering: a fixture that never exercises a combination is not evidence the combination works.

## ADR-047 — The app chrome gets a scale, and a phone gets the whole app

**Status.** Accepted.

**Context.** The document had been measured, argued over and rebuilt ten times. The application
around it had not been looked at once. Measuring it — headless Chrome at 390, 768, 1024 and 1440,
reading computed geometry rather than screenshots — found that it had grown the way an app grows when
every change is local:

- The toolbar wrapped onto a second row below `sm`. It stood **82px** tall on a 390×844 phone against
  52px on a desktop, and the row it gained was almost empty: the app name, the document name and the
  template picker were each hidden at a different breakpoint, leaving a logo and four unlabelled
  glyphs. A tenth of the shortest screen, spent on the least.
- **44 controls** were under 40px on that phone. Every icon button was 32×32; Apple asks for 44 and
  Android for 48. The document-name button was 22×26.
- The template picker was **hidden below `md` entirely**, so a phone could not change the design.
  Undo and redo were hidden below `sm`. The document name was hidden below `md` — no way to tell
  which CV was open.
- A tablet fell to the phone's one-pane-at-a-time layout the moment the window dropped below 1024px,
  which put the preview a tab away from the field being typed into. In the same layout the form had
  no width cap, so at 768px a single-line "Full name" field ran to **736px**.
- Eight hard-coded pixel type sizes — 11, 11.5, 12, 12.5, 13, 13.5, 14, 15 — reached for a case at a
  time. That is not a scale, it is a history.
- The template picker was ten paragraphs of prose, in an app whose entire subject is what a page
  looks like.
- `sonner` had been a dependency for months and was imported nowhere. No action anywhere reported
  its outcome, and nothing said the autosave had run.

**Decision.**

*A scale, not a history.* Five named steps — `text-ui-2xs` through `text-ui-lg` — and three radii by
role: `rounded-control`, `rounded-card`, `rounded-panel`. Named `ui` rather than reusing Tailwind's
`sm`/`base` because the resume canvas has its own scale in points and must never inherit one of these
by accident. Naming a size is what makes it a decision; tuning one now moves the app rather than one
component.

*Thumb-sized where there is a thumb.* A `.tap-target` class grows a control's hit area to 44px
through an `::after` under `@media (pointer: coarse)` — outwards, into the gap already around it, so
nothing in the layout moves. Keyed on the pointer and not on a width: a 1280px tablet has the same
thumb as a 390px phone, and a desktop window dragged narrow still has a mouse.

*One toolbar row at every width.* What stays visible is what the reader needs without thinking —
which CV is open, whether it is saved, how to get the PDF out. Everything else collapses into one
overflow `Menu` rather than disappearing at a breakpoint: a narrow window loses the shortcut, never
the action. The same menu replaced the four unlabelled glyphs on every entry row.

*Three layouts, not two.* `compact` under 768 keeps the tab bar; `split` from 768 shows form and page
together with the score as a drawer; `full` from 1024 gives the score its own column. The split is a
fraction of the container rather than a fixed 520px, because the same divider has to work in a 1080px
gap and a 768px one.

*A picker that shows the page.* `TemplatePreview` renders the real template at real page size, scaled
down, under that design's own `defaultTheme` — what choosing it would actually do. Not a hand-drawn
impression: an impression is a second thing to keep in step with the design and is wrong the first
time either changes. `content-visibility: auto` keeps ten off-screen resumes from being laid out.

*Say what happened.* `sonner` for export, backup and restore outcomes; a `SaveState` on the library
store with a `pending` step said *before* the debounce, because the gap between the keystroke and the
write is exactly the window worth telling the reader about.

**Consequence.** On a 390px phone: toolbar 53px, and **zero** app controls under 44px. Nothing
overflows horizontally at any width measured. A tablet gets both panes and every control the desktop
has. Unit 164/164, regression 136/136, lint, `tsc` and `next build` all pass.

**What the measuring caught that reading would not.** `col-span-2` on a grid that collapses to one
column does not span — it *creates* an implicit second column. Every full-width field in the editor
was silently building a second track and squeezing the field beside it, which is why "Phone" came out
90px wide on a tablet while "Alternate phone" took 240. `col-span-full` spans whatever is there. And
the score panel's toggle was `lg:inline-flex` while the tab bar stopped at `md`, so between 768 and
1023 the score had no way in at all — no tab below, no column beside, and a button that had not
appeared yet.

**Follow-up: the strip that could not be scrolled.** The measurement never ran. `useScrollEdges`
held a `useRef` and did its work in an effect keyed on `[measure]`, and on a first visit the pane is
showing its empty state — no strip, `ref.current` null, early return — and nothing in that dependency
list changes when the strip finally mounts. So `data-overflow-end` stayed `false` for the life of the
session: no fade, both arrows held at `opacity: 0`, and the scrollbar deliberately hidden by
`scroll-none`. Three affordances, all switched off by one silent early return, leaving a strip a
mouse could not move at all.

The fix is a callback ref: the element announces itself when it arrives, and the effect is keyed on
the node. Worth stating as a rule — **an effect that reads `ref.current` and returns early when it is
null must be keyed on the node, not on a callback**, or it only ever runs on the mount where the
element already happened to exist.

Two more things came out of chasing it. The selected tab is now scrolled into view whenever it
changes, because a section reached from anywhere but the strip — a "Fix it" link, the toolbar's
"Change the design" — was being highlighted somewhere off to the right where nobody could see it.
And `navigateToFix` was calling `closeScore()`, which on a desktop closed the score's own column: the
drawer needs dismissing because it covers the form being navigated to, a column beside it covers
nothing. `dismissScoreOverlay` closes only the drawer.

## ADR-048 — One gate, on the server, and it is the download

**Status.** Accepted.

**Context.** The app had no accounts at all. Everything ran in the browser, the document lived in
IndexedDB, and the only server the app owned was the one that rendered the PDF. Adding sign-in
raises three questions at once, and answering them separately is what turns a login into a rewrite:
what needs an account, where the check lives, and what happens to the document.

**Decision.**

*What needs an account: the PDF, and nothing else.* Writing, reordering, ten designs, the theme
controls, the ATS score, import, the JSON backup and the whole document library stay open to anyone
who opens the page. A CV builder that asks who you are before it will let you type is a CV builder
nobody finishes a first draft in. The download is the moment the work is worth something, and it is
also the only thing that costs the server anything — headless Chrome for up to sixty seconds, on a
Hobby plan's memory. So the gate is where the cost is.

*Where the check lives: `/api/pdf`, not the button.* A hidden button is a suggestion. The route that
renders the PDF is the only place that request is served, so it is the only place the check belongs;
the `Download` control is left exactly as it was, and pressing it signed out produces a `401` whose
body carries `code: "sign_in_required"`. The export hook keeps that apart from every other failure,
because every other failure is a sentence to read and this one is a door to walk through — it opens
`SignInRequiredDialog` instead of an error toast.

Three answers, not two: "nobody is signed in" is `401`, "the session could not be checked" is `503`,
and a deployment with no auth configured at all is `503` in production and open in development.
Reporting a database outage as `sign_in_required` would send somebody who *is* signed in to a
sign-in page that works, to come back and be refused again.

*What happens to the document: nothing.* Signing in does not upload the CV, and the schema gains no
`documents` table in this change. The library is still IndexedDB, still per-browser. Cloud sync is a
real feature with real questions — merge on first sign-in, conflict resolution, offline queueing —
and none of them get answered well as a side effect of adding a login.

**Stack.** Better Auth 1.7 over Neon Postgres through Drizzle, with Resend for the two emails.
Better Auth rather than Auth.js because Auth.js v5 has been `5.0.0-beta.32` for three years and the
credentials path there is hand-written password handling. Neon over HTTP rather than a pooled TCP
connection: every request on a serverless deployment is its own process, so a pool that cannot
outlive one request is a pool of one that still pays for the handshake. HTTP has no transactions,
which is why the Drizzle adapter is left on its default of running operations in sequence.

**A new layer: `src/server/`.** The database handle, the auth server and the mailer. It holds a
connection and a secret, so it is guarded twice — an ESLint boundary that names the layer in the
error, and `server-only`, which turns an import from a client component into a build failure. Both,
because the lint rule is the readable message and the package is the guarantee.

Everything under it is built on first use rather than at import. `next build` compiles these modules
and a build should not need a production secret to find out whether the editor type-checks.

**Consequences.**

- Sign-up does not sign anyone in. `requireEmailVerification` holds the session back until the
  address is confirmed, because otherwise anyone can hold an account under somebody else's email —
  and the reset link, the one route back into an account, goes to an inbox they do not own.
- Rate limits live in the database, not in memory. Each serverless invocation has its own memory, so
  an in-process counter starts at zero often enough to be no limit at all.
- `?next=` goes through `safeRedirect` before anything navigates to it. Only an app-relative path
  survives — `//evil.example` is protocol-relative and `/\evil.example` is what a browser normalises
  into it, and both are checked.
- Google is offered only where credentials exist. A provider configured with an empty string is
  worse than an absent one: the button renders and the reader finds out at Google's error page.
- An install with no `DATABASE_URL` still runs. The sign-in pages say accounts are not set up,
  `/api/auth/get-session` answers `null` rather than throwing, and the download gate opens — in
  development. In production the same condition is a `503`, because there the leniency would be a
  hole rather than a kindness.

**What the measuring caught.** `.tap-target` sets `position: relative` under `@media (pointer:
coarse)`, and it is defined outside any cascade layer — so on an element that is also `absolute`, it
wins. The password field's show/hide toggle left the corner of the input and came to rest underneath
it, on a phone and nowhere else. The rule that follows is that **`tap-target` cannot go on an
absolutely positioned element**; give that element a 44px box directly instead.

The auth fields are `h-11` rather than the editor's `h-9`. The editor's fields sit in a dense form
somebody works through with a mouse beside a live preview; these four are typed once, on a phone, by
somebody who has been sent there by a button they pressed. After both fixes: zero controls under
44px on all five auth pages at 390, and no horizontal overflow at 390, 768 or 1440.

**Two more things the testing caught, once there was a real database to test against.**

`.optional()` in Zod means *absent*, not empty. A `.env.local` copied from `.env.example` and filled
in one line at a time holds `DATABASE_URL=""`, which is a string that fails `z.url()` — so the app
answered 500 on every page in exactly the state a fresh checkout spends its first ten minutes in.
Blank values are now stripped before parsing: an empty variable means "not set", because that is what
whoever left it empty meant.

And the session cookie cache is a *copy*, so it outlives what it copies. `revokeSessionsOnPasswordReset`
does revoke the row, but a session read served from the signed cookie still says "signed in" until
that cookie's five minutes are up — which made this repo's own terms page ("resetting your password
signs every other browser out") true of the database and not of the door. The gate now asks the
database directly, via `getSessionUser(headers, { fresh: true })`; everything else — the avatar, the
toolbar — keeps the cheap cached read, because being five minutes stale about whose initials to draw
costs nobody anything. **The check that gates work reads through the cache; the ones that decorate a
menu read from it.**

**And the gate closed on the release gate.** With a real `DATABASE_URL` in `.env.local`, the PDF
regression suite — which posts 136 documents to `/api/pdf` — started answering `401` to all of them.
The suite is measuring a text layer, not an authorisation rule, so it now runs against a server
started deliberately without the auth environment: unconfigured auth in development opens the
download, which is exactly the mode this suite wants.

That moved server startup into a vitest `globalSetup`, which fixed something older on the way. Each
of the four spec files had been starting its own `next dev`, and Next refuses a second one for the
same project — so three of the four had always died on "Another next dev server is already running",
and the gate was only ever green when somebody remembered to point `CV_TEST_BASE_URL` at a server
they had started by hand. One server for the run, started and stopped by the config, and a preflight
that says in one sentence when it is pointed at a server whose gate is shut.

## ADR-049 — Two published documents, written from the code

**Status.** Accepted.

**Context.** Google will not let an OAuth app leave testing without a Branding page, and that page
wants a privacy policy and terms of service at real URLs. The app had neither, and the honest reason
to write them is not the consent screen: a tool that now holds email addresses and password hashes
owes its readers a page saying so.

**Decision.** `/privacy` and `/terms`, as static pages, indexed — unlike the sign-in pages, which
carry `noindex`. Somebody deciding whether to hand over an email address should be able to find the
answer by searching for it.

Every claim in them is checkable against a file. The CV is in IndexedDB because `features/library`
puts it there. The export transits the server because `/api/pdf` renders it in headless Chrome — and
the policy says so plainly rather than hiding behind "we may process your data", because a reader
who later watches the network tab should find nothing they were not told. The session row holds an IP
address because Better Auth's schema has that column. The smart-import proxy forwards CV text to an
endpoint the reader configured, and that gets its own paragraph. There is no cookie banner because
there are no tracking cookies, and the policy says that too.

The one thing the terms spend real words on is backups, because it is the one thing that will
actually cost somebody: the document is in a browser, browsers lose data, and nothing on the server
can bring it back.

**Consequence.** Links live in the `AuthShell` footer — on every auth page, not only sign-up — and
under the sign-up button as a sentence rather than a checkbox. A tick-box everybody ticks without
reading records a consent nobody gave; a sentence at the moment of the act is the honest version, and
the links are real. `LEGAL_CONTACT_EMAIL`, `LEGAL_ENTITY` and `LEGAL_UPDATED` are constants, because
both documents print them and Google's consent screen quotes the address — three copies is two that
go stale.

## ADR-050 — Uploads are resized on the way in, not refused

**Status.** Accepted.

**Context.** A photo and a signature live inside the resume JSON as data URLs, which is what makes a
document portable through export, import and backup with no asset hosting. The price is that every
byte is paid for three times: in IndexedDB, in the JSON backup, and again inside the exported PDF,
where the payload is embedded so the file can be imported back.

Uploads were taken at whatever size the camera wrote and merely refused above 500 KB, which got both
halves wrong. A phone portrait is eight or nine megabytes, so the reader was told to go and shrink it
themselves — using software we did not name, for a reason we did not explain. And a picture that
squeaked under the cap was still two orders of magnitude larger than the thirty-millimetre frame it
renders into: 500 KB of detail, to print at 354 pixels.

**Decision.** `lib/image.ts` resizes on upload. The longest side goes to `IMAGE_BUDGET.maxEdge`,
which is 512 — 30mm at 300 DPI is 354 pixels, so that is headroom, and anything above it is detail no
output can show. Encoding walks down a fixed ladder and stops at the first rung under
`storedBytes`, so the ordinary picture is encoded exactly once. Nothing is ever enlarged: a signature
scanned at 200px is already the whole picture, and blowing it up spends four times the bytes on the
same information rendered blurrier.

WebP, not JPEG. A scanned signature is a PNG with a transparent background and JPEG would paint that
black. A browser that cannot encode WebP does not fail — `toDataURL` quietly answers with a PNG — so
the format is read back off the result rather than assumed, and PNG is the right fallback because it
keeps the alpha that was the whole reason for avoiding JPEG.

`createImageBitmap` is given `imageOrientation: 'from-image'`. Without it a portrait taken in
landscape grip arrives on its side, because the rotation a phone writes is EXIF metadata the canvas
ignores, and there is no control in the editor that could put it back.

**Consequence.** Measured in a real browser rather than argued: an 8.8 MB 4032×3024 source of pure
noise — which compresses worse than any photograph of a face — comes out at 87 KB in 205ms, a 102×
reduction; a 1200×400 signature comes out at 4.6 KB with its corner pixel still fully transparent;
and a 200×60 signature comes out at 200×60. Two hundred milliseconds is long enough to be seen, so
the button says `Resizing…` and what it produced is reported underneath — otherwise the reader
uploads a file they know the size of and is told nothing about what became of it.

`LIMITS.imageBytes` stays at 500 KB and is now only a ceiling on what a *saved document* may carry.
It is deliberately not the same number as `IMAGE_BUDGET.storedBytes`: `imageSchema` drops an
over-long data URL to `''`, so lowering that ceiling would quietly delete the photograph out of every
document saved before the day it changed.

## ADR-051 — Home is `/`, the editor is `/editor`

**Context.** `/` was the editor. A reader with several CVs landed in whichever was open last, the
toolbar carried fourteen actions to compensate, and the section strip scrolled sideways through twelve
names with no sense of how much was left.

**Decision.** `/` is a home screen — the reader's CVs drawn as their own first pages, the three ways
to start one, and the designs. `/editor` is the editor. `ROUTES.home` and `ROUTES.editor` name them;
sign-in redirects land in the editor. Inside the editor the section list is a vertical rail
(`SectionRail`, a strip on a phone) that shows what has been written, and the score is a drawer at
every width with two panes, with its number always in the top bar.

**Consequence.** Nothing in the document model, the library, the templates or the PDF pipeline moved.
`useHome` is the only new place that talks to the library, through the same actions the library panel
uses. The visitor tracker counts a session once on either route, and the regression suite's
pagination spec opens `/editor`. Bookmarks to `/` still work; they now show the CV list first.

## ADR-052 — Downloads need an account again; the merger learns the app's scale

**Context.** Cloud sync (16b1832) opened `/api/pdf` to everyone and put a rate limit in its place.
The product decision since is that a PDF costs a render and is worth a free account; editing, the
designs, import, the score and backups stay open.

**Decision.** `/api/pdf` checks the session first, with `{ fresh: true }`, and answers
`401 { code: 'sign_in_required' }`. The export hook keeps that apart from every other failure and the
editor opens `SignInRequiredDialog`. The rate limit stays behind it. A deployment without auth is
open in development and a 503 in production, as in ADR-048. Every sentence that said downloads were
open without an account — the banner, the features page, both legal documents, the library drawer —
was changed in the same commit.

**Also.** `cn()` now tells `tailwind-merge` the app's own `text-ui-*`, `rounded-*` and `shadow-*`
names. Unknown to it, `text-ui-lg` read as a colour and erased `text-primary-fg`, so every primary
button rendered dark text on blue. `tests/unit/cn.spec.ts` pins it.

## ADR-053 — Google is the way in; email-and-password is off until mail can reach anyone

**Context.** Resend's sandbox sender only delivers to the account owner. Every other address got a
sign-up that answered 200, said "check your inbox", and sent nothing — so nobody but the owner could
confirm an account, and since downloads need one (ADR-052), nobody could download.

**Decision.** Email-and-password accounts are an opt-in (`EMAIL_AUTH_ENABLED=true`, plus a Resend key
and sender), checked by `isEmailAuthEnabled()`. Off, Better Auth's `emailAndPassword.enabled` is false
so the endpoints refuse, the forms show Google only, forgot/reset password redirect to sign-in, and
the privacy policy and terms drop the sentences about passwords and the email processor. Google
needs no mail and hands over an address it has verified, so nothing is left to confirm.

**Consequence.** Turn it back on by verifying a domain in Resend, setting `EMAIL_FROM` on it and
`EMAIL_AUTH_ENABLED=true`. Existing password accounts are untouched in the database; they cannot sign
in with a password while it is off, and linking by verified Google address reaches the same account.

## ADR-054 — Rich text is edited where it is shown, and stays a flat string

**Context.** Bold had been in the grammar since ADR-010, but the only way to produce it was to type
`**` by hand around the words, in a plain textarea. Nobody did.

**Decision.** `lib/emphasis.ts` owns the grammar — `**bold**`, `_italic_`, both nested — and the
editor, the templates and the score all read through it. `RichTextEditor` is a contenteditable with
Bold / Italic / Clear, `Ctrl+B` / `Ctrl+I`, and plain-text paste. The stored value is the same flat
marker string as before: no schema change, JSON export still readable. The DOM is the source of truth
while focused and the string follows it, so the caret never jumps; the DOM is rebuilt only for an
external change and once on blur. Enter adds the next bullet and Backspace in an empty one removes it.

**Consequence.** Intra-word underscores never open emphasis, so identifiers and URLs are safe; an
unpaired marker is text. Entry notes now render through `RichText` (they printed markers literally
before). Underline and links are deliberately absent: neither survives the ATS-safe export well.

**Amendment — underline and links.** The grammar gained `~~underline~~` and `[label](https://…)`.
Underline is `~~` rather than `__` because `__x__` cannot be told apart from italic nested in bold
(`**_x_**`), and not `++` because a CV says "C++, Java, C++". A link exists only for `http(s)` and
`mailto:`, so a stored string can never render `javascript:`. In the designed PDF a link prints its
label; the ATS design un-hides the address after it (`.atp .rz-link__url`), because a plain-text
parser reads only what is drawn. The editor never binds Ctrl+K — the library owns it.

## ADR-055 — Server copies are opt-in, capped at three, and expire when idle

**Context.** Signing in used to upload every CV, automatically. For a free service that is an
open-ended storage bill: nothing bounded how many CVs one account held or how large they were, and
photographs are embedded in each.

**Decision.** A CV is on the server only when its reader switches it on (`DocumentMeta.cloud`, off by
default). An account keeps at most `CLOUD_SYNC.maxDocuments` (3), each at most `CLOUD_SYNC.maxBytes`
(200 KB, photograph included). The limit is enforced in `/api/resumes/sync`, checked first in the
browser with the same `checkCloudDocument` so the message says one number. Stopping sync writes a
tombstone marked `unsynced` in an otherwise unused column, so the reader's other devices keep the CV
and clear their flag instead of deleting it — no schema migration. A different account signing in on
the same browser clears the flags (`STORAGE_KEYS.cloudOwner`), so it never uploads the previous
person's CVs. The admin page lists accounts holding server copies with their last activity and size,
and can delete the copies of one account or of every account idle `CLOUD_SYNC.inactiveMonths` (6)
months — the list is recomputed on the server at the click. Only the copies go; the account and every
CV in a reader's own browser stay.

**Consequence.** The cap, the size and the idle period are quoted on the home page, the features
page, the privacy policy, the terms and the sync controls from the same constants. No warning email
precedes an idle deletion while mail is limited to Google sign-in; the policy says so.

## ADR-056 — AI polish: a rewriting tool for named accounts, not a promise

**Context.** A free product cannot carry a model bill, and its free quota is shared by everyone who
uses it. But an owner and a few invited people can use a model for free, and a rewrite of a bullet is
useful to them.

**Decision.** `/api/ai/polish` calls Gemini from the server with a key that never reaches the
browser, and only for emails in `AI_ALLOWED_EMAILS` — checked in the route with a fresh session, with
`/api/ai/status` as a hint for drawing the button. Both the key and a non-empty list must exist for
the feature to exist at all (`isAiConfigured`), so a deployment without them shows nothing, and the
privacy policy names Gemini only when it is configured. The model is told to add no fact, number or
skill, the answer is refused if it contains a number the text did not (`introducesNewNumbers`), and a
rewrite is a proposal beside the original that applies only on a click. One account gets 40 a hour
from the shared `rate_limit` table; a 429 from Google is reported as the quota being used up.

**Consequence.** No schema change and no cost to the operator. The cost is that an allowed
account's bullet or summary — and the pasted job description, if any — goes to Google; that is said
in the policy, and the list is short enough to say it to each person. Tailoring for everyone else is
a separate, rule-based feature.
