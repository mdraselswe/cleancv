# CV Maker — Implementation Plan

ATS-friendly CV/Resume builder. Ek data model theke multiple template, live ATS score, ar dual PDF export.

## Core idea: ek data, dui output

Colorful design ar ATS parseability inherently conflict kore. Solution — same data theke dui rokom PDF:

| Export | Kaj |
|---|---|
| **Design PDF** | Selected template-er exact look (color, sidebar, photo) |
| **ATS PDF** | Auto-generated single-column plain version — job portal-e ei ta upload |

## Stack

Next.js 16 (App Router) · React 19 · TypeScript · Tailwind v4 · Zustand (persist) · Zod ·
react-hook-form · @dnd-kit · Puppeteer · Vitest

## Milestones

- [x] **M1 — Scaffold + conventions**: Next.js, Tailwind tokens, ESLint boundary rules, folder skeleton, constants
- [x] **M2 — Schema + store**: full Zod schema (all sections), Zustand + persist + versioned migration, sample data
- [x] **M3 — UI kit**: `components/ui/*` primitives, AppShell, SplitPane, MobileTabs
- [x] **M4 — Template engine**: registry, shared parts, `useTemplateTheme`, `classic-dc` + `ats-plain`
- [x] **M5 — PDF pipeline**: `/print` route, `/api/pdf`, dual export, pdftotext regression test (GATE)
- [x] **M6 — Editor forms**: section by section, repeatable list, drag reorder, photo/signature upload
- [x] **M7 — ATS engine**: rules, weighted score, panel UI, click-to-field, JD matcher
- [x] **M8 — Remaining templates**: modern-sidebar, academic-cv, elegant-serif, vibrant + theme controls + gallery
- [x] **M9 — Polish**: dark mode, undo/redo, shortcuts, empty states, responsive pass, a11y

## Sections (data model coverage)

**Always-on**
- Personal Information — name, headline, photo, DOB, gender, nationality, marital status, religion,
  blood group, father/mother name, NID/passport (all optional + individually toggleable)
- Contact — phone (+alt), email, present/permanent address, LinkedIn, GitHub, portfolio, custom links[]
- Summary / Objective — mode toggle (Professional Summary vs Career Objective)
- Work Experience — role, company, note, location, employment type, dates, bullets[], tech tags[]
- Education — degree, major, institute, board, location, dates, result + scale, thesis, coursework
- Skills — category groups + items, optional per-item proficiency

**Optional (toggle + reorder)**
Projects · Certifications · Key Achievements · Awards & Honors · Publications · Training & Workshops ·
Languages · Volunteering · Extracurricular · Memberships · Conferences & Talks · Patents ·
Interests · References (+ "available upon request") · Declaration · Signature · Custom sections

## Templates

| # | id | Category | ATS baseline |
|---|---|---|---|
| 1 | `classic-dc` | ats | 95 |
| 2 | `ats-plain` | ats | 100 |
| 3 | `modern-sidebar` | balanced | 80 |
| 4 | `academic-cv` | balanced | 90 |
| 5 | `elegant-serif` | balanced | 92 |
| 6 | `vibrant` | creative | 60 |

## ATS scoring

| Category | Weight |
|---|---|
| Parseability | 30 |
| Completeness | 20 |
| Content impact | 25 |
| Formatting | 15 |
| Keyword match | 10 |

Prottek rule: `pass | warn | error` + fix suggestion + click-to-field navigation.

## Phase 2 (later)

DOCX export · cover letter builder · AI bullet rewrite · accounts + cloud sync · shareable public
link · template gallery thumbnails · score history · "fix all safe issues" bulk action

Done since: section order presets, custom sections, document library (IndexedDB + workspace folder
+ whole-library backup), CV import from PDF / DOCX / screenshot with an offline parser and an
optional bring-your-own-endpoint one, entry icons with a picker, and three more templates
(Compact Professional, Formal Centered, Side Panel).
