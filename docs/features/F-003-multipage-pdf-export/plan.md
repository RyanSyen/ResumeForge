# F-003 — Implementation Plan

*Status: approved · Approved by: Ryan · Date: 2026-07-03*

## Approach
Print-CSS-only is sufficient — **no PDF library**. The acceptance criteria are about
layout correctness at page boundaries and a preview indicator, not about capabilities
native browser print/"Save as PDF" lacks. Two separate mechanisms, both CSS/measurement,
no new runtime dependency:

- **Print pagination**: add `break-inside: avoid` (+ legacy `page-break-inside: avoid`)
  on section wrappers and item cards, and `break-after: avoid` on section headings, once
  in the shared body components (`ExperienceBody`, `EducationBody`, `ProjectsBody`,
  `SkillsBody`, `CertificationsBody`, `LanguagesBody` in `templates.tsx`) — not per
  template, since all three templates already dispatch through the shared
  `sectionBody()` factory. A section taller than one page can't itself avoid a break, so
  item-level rules are the primary mechanism; section/heading-level is best-effort.
- **Preview page indicator (screen only)**: CSS page boxes don't exist on screen, so
  this needs measurement. Read the unscaled content height of `#resume-page` via
  `ResizeObserver`, normalize by dividing by the live `zoom` factor (zoom scales
  `getBoundingClientRect()`/`scrollHeight` on descendants, so raw readings are
  zoom-corrupted), and compare against `PAGE_HEIGHT_PX` (297mm at 96dpi = 1122.5196px,
  kept as a precise float to avoid rounding drift across many pages) to compute page
  count and break-line offsets. The zoom-divide step is a pure function, unit-testable
  without a real layout engine.

Escalation trigger: if manual print verification (Steps 9–10) shows native pagination
cannot respect page boundaries even with correct break rules — e.g. the existing
`position: absolute` print hack turns out to be unfixable, or a Firefox zoom/print
interaction bleeds through despite forcing `zoom: 1` at print time — stop and escalate
to a human decision on a PDF library. Do not substitute one silently.

Rejected alternative: `react-pdf`/`html2pdf` for programmatic PDF generation — out of
scope per spec pending human escalation; adds a real dependency + bundle weight; not
needed since native print already paginates correctly once break rules exist.

Rejected alternative: N literal stacked "page" `<div>`s with CSS-region/column content
splitting — far more complex than the spec's "visual indicator" scope requires, and CSS
regions have poor evergreen-browser support for this use case.

## Files to change
| File | Change |
|------|--------|
| `src/lib/pagination.ts` | new — pure functions `computePageCount`, `computePageBreakOffsets`, `normalizeHeight(observedHeightPx, zoom)`, constant `PAGE_HEIGHT_PX`; zero DOM/React dependency |
| `src/lib/pagination.test.ts` | new — unit tests for the pure pagination math |
| `src/components/preview/usePageCount.ts` | new — hook wrapping `ResizeObserver` measurement of `#resume-page`, normalizing by `zoom`, calling into `pagination.ts` |
| `src/components/preview/Preview.tsx` | wire up `usePageCount`; render `print:hidden` break-line overlay(s) and "Page N of M" indicator inside `#preview-zoom` |
| `src/components/preview/templates.tsx` | add shared break-control classes to section wrappers (3 template call sites) and item-level divs inside the 6 shared body components, and `break-after: avoid` to section headings |
| `src/index.css` | add global `break-inside`/`break-after` avoid rules; adjust/simplify `@media print` `#resume-page` positioning per Step 1's findings |
| `docs/features/F-003-multipage-pdf-export/review.md` | new — manual print-verification matrix (Chrome/Edge × 1/2/3 pages × 3 templates) |

## Steps
Ordered, each independently verifiable. Check off during build.
1. [x] Manual, before writing code: in a real browser, confirm whether removing `position: absolute !important` from `#resume-page` in `@media print` still produces correct single-page output, and whether that rule is what's preventing multi-page flow today. Determines if Step 6 is a simplification or leaves the rule in place.
2. [x] Create `src/lib/pagination.ts`: `PAGE_HEIGHT_PX` (297mm → px at 96dpi, precise float, documented derivation), `normalizeHeight(observedHeightPx, zoom)`, `computePageCount(contentHeightPx)`, `computePageBreakOffsets(contentHeightPx)`. No DOM/React/zoom coupling — plain numbers in, plain numbers out.
3. [x] Write `src/lib/pagination.test.ts` against Step 2 (see Test plan) before wiring up the DOM side.
4. [x] Update `src/index.css`: add global `break-inside: avoid` / `page-break-inside: avoid` utility class(es) and `break-after: avoid` / `page-break-after: avoid` for headings.
5. [x] Update `src/components/preview/templates.tsx`: apply the break-control class to each section wrapper in all three templates and to each item-level div inside the six shared body components; apply heading break-after class to section headings.
6. [x] Update `src/index.css` `@media print` block per Step 1's finding: keep `visibility` hiding of non-resume UI, keep `@page { size: A4; margin: 0 }`, keep `zoom: 1 !important` reset on `#preview-zoom`; adjust `#resume-page` positioning only if Step 1 showed it's necessary/harmful.
7. [x] Add `src/components/preview/usePageCount.ts`: `ResizeObserver` on `#resume-page`, re-measure on resume-data/template/window-resize changes (not on zoom changes), normalize via `normalizeHeight`, call `computePageCount`/`computePageBreakOffsets`.
8. [x] Update `src/components/preview/Preview.tsx`: wire the hook; render break-line overlays and "Page N of M" indicator inside `#preview-zoom` (so they scale visually with existing zoom), all carrying `print:hidden`.
9. [ ] Manual: verify break lines align with real content breaks at multiple zoom levels (40%–150%) and resume lengths (1/2/3 pages) across all three templates, using the browser preview. **Deferred to /pipeline-review** — see Deviations.
10. [ ] Manual: print-preview (Ctrl+P / print-to-PDF) pass in Chrome and Edge for 1/2/3-page resumes across all three templates — confirm no orphaned headings, no split item cards. If pagination cannot be made correct via CSS alone, stop and escalate per the Approach section rather than substituting a PDF library. **Deferred to /pipeline-review** — see Deviations.
11. [ ] Manual: confirm 1-page resumes are visually/structurally unchanged from current export output (AC3) — side-by-side or screenshot diff against pre-change baseline. **Deferred to /pipeline-review** — see Deviations.
12. [ ] Record the manual verification matrix (2 browsers × 3 page-counts × 3 templates = 18 cells) in `docs/features/F-003-multipage-pdf-export/review.md`, noting any residual issues per cell. **Deferred to /pipeline-review** — per `docs/pipeline/PIPELINE.md`, `review.md` is stage 4's output, not stage 3's.
13. [x] Run `npm run lint && npm run build && npm test` — all green.

## Risk register
| Risk / landmine | Mitigation |
|-----------------|------------|
| Zoom-dependent height measurement corrupts page-count math as the user zooms | `normalizeHeight` divides by live `zoom` before comparing to `PAGE_HEIGHT_PX`; kept as an isolated pure function in `pagination.ts`, unit tested independent of real layout |
| `break-inside`/`page-break-inside` support/quirks differ across Chrome, Edge, Firefox print engines; Firefox zoom-in-print landmine already noted in spec | `zoom: 1 !important` at print time makes Firefox's zoom bugs moot for print output; both legacy and modern break properties included for broadest coverage; verified in the manual matrix (Step 10), not assumed from Chrome behavior |
| Orphan/widow control: heading alone at page bottom, body pushed to next page | `break-after: avoid` on headings paired with `break-inside: avoid` on item-level divs (primary mechanism — a section taller than one page can't itself avoid a break, so section-level is secondary best-effort) |
| 1-page regression (AC3) — CSS/print-hack changes could shift margins/positioning for the common case | Explicit manual regression check (Step 11) before considering the feature done; Step 1 investigates *why* absolute positioning exists before removing it, in case it solves a real single-page problem |
| `ResizeObserver` re-measurement firing on every edit keystroke, causing jank | `ResizeObserver` batches per frame; treat as acceptable trade-off unless testing shows visible jank — not a correctness issue |
| `PAGE_HEIGHT_PX` mm→px rounding drift compounding across many pages | Use the precise float (1122.5196...px), documented derivation in a code comment, round only for final display positioning |
| New floating break-line/page-indicator UI leaking into print output if `print:hidden` is misapplied | Explicit check in manual verification (Steps 9–10) that print output contains no break lines or page badge; jsdom test asserts indicator elements carry the `print:hidden` class (can't verify enforcement, only presence) |

## Test plan
- Unit: `src/lib/pagination.test.ts` — `computePageCount` at 0 / just-under-boundary /
  exact-boundary (explicit, locked-in choice for the exact-fit case) / just-over-boundary
  / multi-page rounding; `computePageBreakOffsets` for 1/2/3-page content;
  `normalizeHeight` proving zoom-independence by construction (e.g.
  `normalizeHeight(1000, 0.5) === 2000`).
- Integration/UI: light jsdom test on `Preview.tsx` indicator markup asserting
  "Page N of M" text and break-line container carry `print:hidden` (presence only, not
  print-media enforcement).
- Manual verification script (for the review stage): browser print-preview matrix —
  Chrome + Edge × 1/2/3-page resumes × 3 templates (18 cells) checking for orphaned
  headings, split item cards, and 1-page pixel-identical regression; recorded in
  `review.md`. Not automatable — jsdom has no real layout engine and cannot render
  `@page`/`break-inside`/print media at all.

## Deviations
- **Step 1 finding**: confirmed empirically in a live browser preview (Chromium via the
  preview tool) — `html`/`body`/`#root` all have `overflow: visible`, and the scroll
  container already carries `print:overflow-visible`. No ancestor clips overflow, so
  `#resume-page`'s `position: absolute !important` in `@media print` does not block
  multi-page print flow (it repositions the page to the origin; it doesn't add
  `overflow: hidden` or a fixed `height`). Decision: left the print-CSS positioning
  unchanged; Step 6 was a no-op beyond adding the new break-control rules (Step 4).
- **Measurement source changed mid-implementation**: empirically verified (same live
  preview) that in this Chromium build, `Element.scrollHeight` is *already*
  zoom-invariant (unaffected by an ancestor's CSS `zoom`), while
  `getBoundingClientRect().height` scales with zoom as the `zoom` property's spec
  intends. Relying on `scrollHeight`'s zoom-invariance would be a Chromium-specific
  quirk, not a cross-browser guarantee — and the spec explicitly flags Firefox's `zoom`
  behavior as inconsistent. `usePageCount` therefore measures via
  `getBoundingClientRect().height` and divides by the live `zoom` through
  `normalizeHeight`, matching the plan's original zoom-independence design rather than
  depending on an unverified cross-browser assumption.
- **`computeCurrentPage` added** (`src/lib/pagination.ts`, not in the original plan):
  AC1 says the indicator must read "Page N of M," which implies a live current-page
  number, not a static "Page 1." Added a small pure function
  `computeCurrentPage(scrollTopPx, pageCount)` plus an `onScroll` handler on the preview's
  scroll container in `Preview.tsx` to track it. Covered by 4 additional unit tests in
  `pagination.test.ts`.
- **Steps 9–12 (manual print/zoom verification, `review.md`) deferred to
  `/pipeline-review`**: two reasons. (1) Per `docs/pipeline/PIPELINE.md`, `review.md` is
  stage 4 REVIEW's output, not stage 3 BUILD's — F-002 followed the same split. (2) This
  session's browser-preview tool had a non-rendering tab for this run (`requestAnimationFrame`
  and `preview_screenshot` never resolved, so `ResizeObserver` never fired either) —
  confirmed via direct empirical test, not assumed. Pagination math was verified via unit
  tests instead (`pagination.test.ts`, 14 cases) and a jsdom render test with a mocked
  `ResizeObserver` (`Preview.test.tsx`, 2 cases) asserting the indicator/break-line
  markup and its `print:hidden` class. Actual print-engine behavior (break-inside
  enforcement, orphan control, 1-page pixel parity) still needs a real Chrome/Edge print
  pass before Gate 2 — this is exactly what the plan's Test plan already called
  "not automatable in jsdom," so nothing here is new risk, just later verification than
  originally sequenced.
- Created a project-root `.claude/launch.json` (mirroring `source_code/.claude/launch.json`
  but with `npm --prefix source_code run dev`) so the preview tool could start the dev
  server from the repo root. Tooling config only, not part of the shipped app.
