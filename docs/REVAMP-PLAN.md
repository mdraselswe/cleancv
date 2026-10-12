# UI/UX revamp — branch `revamp/ui-v2`

Goal: a simpler product structure and a colourful, animated, illustrated interface — with **zero
change to what the product does**. Resume schema, store, templates, ATS engine, import, export,
library storage, cloud sync, auth and every API route are untouched. Only the presentation layer and
the route/navigation structure move.

## What was wrong (baseline)

| Problem | Where |
|---|---|
| Landing straight in a three-pane editor; nowhere to see / create / switch CVs | `/` is the editor |
| ~14 actions crammed in one toolbar + overflow menu (import, restore, backup, theme, shortcuts, ATS PDF…) | `Toolbar.tsx` |
| 12+ section names in one scrolling tab strip, no sense of progress | `EditorPane.tsx` |
| Design, Sections and content forms share the same strip | `useActiveSection.ts` |
| Score is a side column/drawer/tab depending on width | `useEditorLayout.ts` |
| Little illustration, little motion, one gradient for everything | `globals.css` |

## Target structure

```
/            Home   — hero + "My CVs" cards with live thumbnails, create/import/restore, templates teaser
/editor      Editor — slim top bar · section rail (progress) · form · live preview · score/design drawers
/sign-in …   Auth   — restyled shell with illustration
/privacy …   Legal  — restyled shell
```

`ROUTES.editor` becomes `/editor`, `ROUTES.home` is `/`. Sign-in redirects land in the editor.

## Phases (each ends with typecheck + lint + unit tests green and one commit)

1. **Foundation** — richer tokens (hue families per section), motion kit (float, shimmer, stagger,
   pop, draw-check, gradient drift), SVG illustration set, `SectionIcon`, restyled Button / Card /
   Badge / Modal / Tabs. No behaviour change.
2. **Structure** — `/` Home dashboard, `/editor` route, `AppHeader`, CV cards (rename / duplicate /
   delete / open), create flows (blank, sample, import, backup restore), analytics + tests follow
   the route.
3. **Editor shell** — slim top bar (back, inline name, save, undo/redo, score chip, one Download
   split-menu, account), left section rail with per-section completeness + overall progress,
   mobile bottom nav, preview toolbar.
4. **Forms** — section header with illustration, next/previous stepper, animated section change,
   friendlier empty states, entry cards.
5. **Design + Score** — template gallery with category chips and live thumbnails, colour swatches,
   animated score ring, grouped issues, celebration state.
6. **Auth / legal / admin** — shared illustrated shell.
7. **QA** — `typecheck`, `lint`, `test`, `test:pdf`, responsive (390 / 768 / 1280), dark mode,
   reduced motion, keyboard.

## Rules the revamp keeps

- ADR layer boundaries (`components/` never imports `features/`).
- Everything resume-canvas related (`resume.css`, templates) is not touched — PDFs stay identical.
- Stored identifiers unchanged (ADR-030).
- Motion is decoration only and honours `prefers-reduced-motion`.
- Every control that existed stays reachable at every width (rule 63).

## Rollback

Everything lives on `revamp/ui-v2`; `main` is untouched. Phases are separate commits.
