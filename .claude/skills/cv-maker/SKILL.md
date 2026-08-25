---
name: cv-maker
description: Conventions and architecture rules for the cv-maker project. Load before writing or editing any file under cv-maker/src — covers folder boundaries, UI/logic separation, naming, the template contract, the ATS rule contract, and the ATS-safe rendering rules that every template must follow.
---

# cv-maker conventions

## 1. Layer boundaries (enforced by ESLint `import/no-restricted-paths`)

```
constants/  types/            <- leaf, import nothing from src
lib/                          <- pure functions, NO react import ever
hooks/                        <- generic react hooks, no domain knowledge
components/ui, components/layout  <- dumb presentational, no store, no domain types
features/*                    <- domain. May import from all of the above.
app/                          <- thin composition only
```

Rules:
- A file in `components/` MUST NOT import from `features/` and MUST NOT call `useResumeStore`.
  Data arrives via props.
- A file in `lib/` MUST NOT `import React`. If it needs react, it belongs in `hooks/`.
- Cross-feature imports go through the feature's `index.ts` barrel only.
  `features/ats/*` importing `features/resume/hooks/useResumeStore` directly is an error;
  import from `@/features/resume` instead.

## 2. UI vs logic

Every editor section is two files:

- `XxxForm.tsx` — presentational. Receives values + handlers as props. No `useState` for domain data.
- `useXxxSection.ts` — all state, store wiring, derived values, handlers.

If a component exceeds ~150 lines, split it. If a component has more than 2 `useEffect`, the logic
belongs in a hook.

## 3. Naming

| Thing | Convention | Example |
|---|---|---|
| Component file | PascalCase | `ExperienceForm.tsx` |
| Hook file | camelCase, `use` prefix | `useAtsScore.ts` |
| Util / lib file | camelCase | `formatDateRange.ts` |
| Constant file | camelCase plural | `sections.ts` |
| Type | PascalCase, derived from Zod | `type Resume = z.infer<typeof resumeSchema>` |

One primary export per file. Named exports only — no `export default` except Next.js
`page.tsx` / `layout.tsx` / `route.ts`, where the framework requires it.

## 4. No magic strings

Section keys, template ids, storage keys, limits, labels, regexes → `src/constants/`.
Inline string literals used as identifiers are a review failure.

## 5. Types come from schema

`src/types/*` re-exports `z.infer` results. Never hand-write an interface that duplicates a Zod
schema — the schema is the single source of truth for validation, defaults, and types.

## 6. Template contract

Every template lives in `src/features/templates/<id>/` and exports:

```ts
export const meta: TemplateMeta   // id, name, category, atsBaseline, supports, supportedSections, defaultTheme
export const Template: TemplateComponent  // (props: { resume: Resume; theme: ResolvedTheme }) => JSX
```

and is registered in `src/features/templates/registry.ts`.

Templates MUST NOT:
- hard-code colors — read from `theme` / CSS variables set by `useTemplateTheme`
- access the store — they receive `resume` as a prop
- import from `features/resume/hooks`

## 7. ATS-safe rendering rules (every template)

1. **DOM order = reading order.** Two-column layouts use CSS Grid/absolute positioning, but the
   markup stays in a single logical top-to-bottom flow. Chrome extracts text in DOM order.
2. **No icon fonts.** Contact icons are inline `<svg aria-hidden="true">`. Icon fonts emit
   PUA/`�` garbage into the PDF text layer — this is the exact bug in the reference Enhancv PDF.
3. **Bullets** render as an explicit `<span aria-hidden>•</span>` + text, not `list-style` /
   `::marker` (pseudo-element content is unreliable in extracted text).
4. **Standard headings** — use the canonical strings in `constants/sections.ts`
   (`WORK EXPERIENCE`, `EDUCATION`, `SKILLS`, ...). Custom heading names are user-opt-in and warned about.
9. Anything that walks the document by section takes a `SectionSlot`, never a `SectionKey`. A slot is
   a built-in key or `custom:<id>`; branch with `isCustomSlot`, never by string comparison. See ADR-007.
10. `useResumeStore` holds one document and never touches storage. Loading and saving belong to
    `features/library`; a component that wants "the other CV" goes through the library, not the
    resume store. See ADR-008.
11. Import never writes to the resume. A parser returns a `ParsedResume`; only `applyImport`, driven
    by what the user accepted in the review screen, produces a `Resume`. See ADR-009.
12. Body text may carry `**bold**`. Render it through `RichText`; read it through `stripEmphasis`.
    Anything scoring or matching on *words* must strip first. See ADR-010.
13. A heading is safe if `isRecognisedHeading` says so, never by comparing against the default
    string. That vocabulary lives in `@/constants` and is shared with import. See ADR-011.
14. Icon helpers return a *key*, resolved through `ICON_COMPONENTS`. Never return a component from a
    function — React's lint rules read that as a component created during render. See ADR-012.
15. The import parser sorts lines by *position* — meta, head, bullet — never by order alone. A
    two-column CV shifts every field otherwise. See ADR-013.
16. Never write a regex through a shell heredoc: `` arrives as a backspace character and the
    pattern silently matches nothing. Prefer a lower-cased word list. See ADR-014.
17. A separator between two inline pieces of content is a real text node, never `::before` /
    `::after`. Generated content does not reach the PDF text layer, so the two fuse. See ADR-015.
18. To lift content into a margin, use a grid column, not `position: absolute` — a positioned block
    taller than its entry overflows the section and prints over the next page. See ADR-015.
19. Before reaching for CSS `order`, ask whether someone reading the page aloud would say the words
    in a different order. If yes it is a content decision and belongs in markup, behind a prop on
    `EntryShell`. If no, CSS is right. See ADR-016.
20. Measure layout with `offsetWidth`/`offsetHeight`, or divide a `getBoundingClientRect` by the
    element's own scale. The preview is inside a zoom transform, and rects come back scaled.
21. Every template's `defaultTheme` states a `marginMm`. Omitting it inherits the previous
    template's margin, which is invisible until someone switches designs. See ADR-018.
22. A template declares `supports.icons`, and *every* template passes it to `SectionBody` as
    `showIcons` — including through `SingleColumnLayout` — rather than hard-coding the prop or
    omitting it. A flag only some subjects read is as silent as no flag. The editor reads the same
    one to tell the user when a picked icon will not be drawn. See ADR-019.
23. A theme control has to be legible in the *export*, not just the preview. Before narrowing a
    range or a step, check what it does to a rendered PDF: at ±15% the text-size slider moved body
    text by a tenth of a point per step, which is indistinguishable from being ignored. See ADR-019.
24. Page geometry is `96 / 25.4` pixels per millimetre, never a rounded A4 in pixels. The preview
    paints its sheet from that number and Chrome lays the PDF out from its own; a quarter-pixel
    difference in column width re-wraps a line and moves every break below it. See ADR-020.
25. `break-after: avoid` binds a heading to the *first fragment* of what follows, not to all of it.
    Anything modelling Chrome's fragmentation measures the first unbreakable child, or the first
    line box via a `Range` — never the whole next sibling. See ADR-020.
26. The PDF's page breaks come from the preview, not from Chrome: the editor sends the index of the
    element starting each page and the print route sets `break-before: page` on it. Chrome's print
    pass measures text ~0.2% narrower than the screen layout, so the two flows can differ by a line
    and no model closes that. Not sent for the ATS export or for two-column designs. See ADR-021.
27. Selectors that the preview, the print route and `resume.css` must agree on live in
    `constants/app.ts`, never in a client hook — a server component importing from a `'use client'`
    module gets a client reference, not the string. See ADR-021.
28. A glyph beside text is a box one line tall with the glyph centred in it — `height: 1lh`,
    `vertical-align: top`, `align-self: flex-start`. An inline-flex with no text takes its bottom
    edge as its baseline and rides high; in a flex row it stretches over two lines. See ADR-022.
29. `repairSectionSettings` and the other key-by-key repairs in `normalize.ts` list every field of
    what they rebuild. A field left out is reset on the next load, which reads as the setting being
    broken. Add the field there in the same change that adds it to the schema. See ADR-022.
30. An exported PDF carries the resume as an embedded file, and import reads it before parsing.
    Never put it in metadata (stripped by compressors) or in hidden text (it would reach the ATS
    text layer). A missing or foreign payload falls back to the heuristic. See ADR-023.
31. A restored payload is a whole document and goes through `replaceResume`, never through
    `applyImport` — a merge is shaped for a `ParsedResume` partial and would drop the section
    order, the theme, custom sections and every per-section setting. See ADR-023.
32. The photo renders through the shared `PhotoFrame`, never a bare `<img>`: zoom needs an ancestor
    with `overflow: hidden` to clip against. The design's class goes on the wrapper. Framing lives
    in `basics` (it belongs to the image), the frame's shape in `theme` (it belongs to the design).
    See ADR-025.
33. Two controls over one property are one setting. A named shape plus a free value can disagree;
    store the value and let the names be positions on its scale. See ADR-024.
34. When a design is measured against a reference document, measure *every* instance of a spacing,
    not one: the first pass at Compact Professional matched a section gap that occurs once and made
    the five that occur elsewhere four points too tight. See ADR-027.
35. A right-margin column holds the head's row only. Spanning it down the entry reserves width from
    every line below, and the body wraps early against a margin nothing is using. See ADR-027.
36. An ATS rule that fails carries a `targets` entry, and it names where the fix *is* — a section
    slot, or `panel:design` / `panel:sections` when the fix is a design or a section toggle. A
    passing rule shows no link. See ADR-028.
37. A template that lays entries out as a group styles the group, never the `<section>`. Grid and
    flex containers do not collapse margins, so a grid on the section stacks the heading's margin,
    the container's gap and the entry's margin where a block collapses them to one. See ADR-026.
38. Routes do not share memory. Anything one route needs from another travels in the request or is
    rendered where it is used — a serverless deployment runs each route as its own instance. See
    ADR-029.
39. Stored and wire identifiers (`cv-maker` in the IndexedDB name, the localStorage keys, the backup
    `kind`, the PDF payload's `app`) never follow a rename. Changing one orphans saved data or stops
    already-exported files importing. See ADR-030.
40. A first-run prompt is gated on the reader's *answer*, never on the data alone. "Start blank"
    was gated on the document being empty, so choosing it re-rendered the prompt over the form and
    the only way past was to load the sample. State like that lives in `useEditorLayout`, keyed by
    document id — the pane unmounts on every phone tab switch, and an answered question should stay
    answered.
5. **No tables, no text-in-image, no header/footer band.** Page padding comes from CSS, PDF margin is 0.
6. **Dates** always `MM/YYYY` via `lib/date.ts`. Never free text.
7. Fonts embedded via `next/font`, subsetting off for the print route.
8. **`letter-spacing` never exceeds `0.06em`.** Above roughly that, Chrome emits one text run per
   glyph and `SKILLS` extracts as `S K I L L S`, which no parser matches. The regression gate
   catches this; do not widen tracking to "fix" a heading's look.

## 8. ATS rule contract

Rules are grouped one file per ATS category in `src/features/ats/rules/`, each exporting a
`rules: AtsRule[]` array. A rule is:

```ts
export const rule: AtsRule = {
  id, category, weight, label,
  evaluate: (resume, ctx) => ({ status: 'pass' | 'warn' | 'error', message, fixHint?, targets? })
}
```

`evaluate` is a pure function — no React, no store, no DOM. `targets` are section keys the panel
uses for click-to-section navigation.

Weights are relative *within* a category; the category's share of the total comes from
`ATS_CATEGORY_WEIGHT`. Adding a rule therefore dilutes its neighbours rather than inflating the score.

## 9. Testing

- `tests/unit/` — vitest, pure functions and ATS rules.
- `tests/regression/ats-pdf.spec.ts` — **release gate.** Renders each template to PDF via puppeteer,
  extracts text, asserts: no `�`, no PUA codepoints (U+E000–U+F8FF), canonical headings present,
  phone/email intact, experience entries appear in reverse-chronological reading order.
  A template that fails this test does not ship.

## 10. Commands

```
npm run dev          # editor at :3000
npm run build
npm run lint
npm run test         # vitest unit
npm run test:pdf     # PDF regression gate (needs chrome from `npx puppeteer browsers install chrome`)
```
