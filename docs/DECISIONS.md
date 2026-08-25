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
