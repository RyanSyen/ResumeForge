# F-006 — Implementation Plan

*Status: approved · Approved by: Ryan Wong · Date: 2026-07-03*

## Approach

Add a `DesignSettings` slice to the existing settings store (font family, base size, line height, section spacing, page margins, page format), persisted with a v1→v2 migration following the exact `migrateSettingsState`/`repairSettingsData` pattern already established. A new pure function `getDesignCssVars(settings)` maps these enum values to CSS custom properties, applied as an inline style on `#resume-page` so they cascade into the three templates; the templates are refactored to consume `var(--rf-*)` in place of hardcoded Tailwind text-size/spacing/font classes, with the "M / normal / normal" defaults chosen to exactly reproduce today's rendering (zero visual change until a user opens the new Design panel). Page format (A4/US Letter) is centralized in one `PAGE_FORMATS` config consumed by three previously-independent, now-synchronized call sites: the runtime-injected `@page` print rule (CSS Paged Media doesn't support `var()` inside `@page`, so a literal `<style>` tag is rewritten via `useEffect` on format change), `Preview.tsx`'s inline page-box dimensions, and `pagination.ts`'s page-height math. Controls live in a new `DesignDialog.tsx` modal (same structural pattern as `SettingsDialog.tsx`, `print:hidden`), opened from a new Toolbar icon.

Alternatives rejected: (a) driving typography via Tailwind config theme extensions instead of CSS variables — rejected, Tailwind classes are static at build time and can't reactively bind to runtime store values without generating a combinatorial class explosion per settings the spec explicitly warns against; (b) freeform mm/px inputs for margins and font size — rejected in favor of small enums (S/M/L, compact/normal/relaxed) to keep Zod validation simple and prevent extreme values from breaking pagination math; (c) using a PDF-generation library (jsPDF/html2canvas) to sidestep the `@page` limitation — rejected as out-of-scope, F-003 already committed to native `window.print()` and changing that mechanism is a much larger, unrelated change.

## Files to change

| File | Change |
|------|--------|
| `source_code/src/lib/schema.ts` | Extend `PersistedSettings` with new design fields; extend `repairSettingsData` with enum-validated `.catch(default)` entries for each. |
| `source_code/src/store/settings.ts` | Add design fields + setters to `SettingsStore`/`SETTINGS_DEFAULTS`; add `designPanelOpen`/`openDesignPanel`/`closeDesignPanel` (UI-only, not persisted); add `resetDesignSettings()`; bump `version: 2`; extend `migrateSettingsState`; update `partialize`. |
| `source_code/src/store/settings.test.ts` | Add v1→v2 migration tests (pass-through at v2, repair v1 payload preserving 4 legacy fields + defaulting new ones, malformed-field fallback, missing-state fallback). |
| `source_code/src/lib/design.ts` (new) | `DesignSettings` type slice; curated `FONTS` list (id/label/CSS stack with fallback terminator); `FONT_SIZE_SCALE`, `LINE_HEIGHT_SCALE`, `SPACING_SCALE`, `MARGIN_SCALE` config objects; `getDesignCssVars(settings): Record<string,string>`. |
| `source_code/src/lib/design.test.ts` (new) | Unit tests for `getDesignCssVars` per enum combination; static check that every `FONTS` entry's CSS stack ends in `serif`/`sans-serif`. |
| `source_code/src/lib/pageFormats.ts` (new) | `PAGE_FORMATS` (A4/Letter mm dimensions + margin presets); `getPageDimensionsMm(format)`; `getMarginsMm(marginSetting)`. |
| `source_code/src/lib/pageFormats.test.ts` (new) | Unit tests for dimension/margin lookups. |
| `source_code/src/lib/pagination.ts` | Replace constant `PAGE_HEIGHT_PX` with `getPageHeightPx(format, marginsMm)`; thread through `usePageCount`/`computePageCount`/`computePageBreakOffsets`/`computeCurrentPage`. |
| `source_code/src/lib/pagination.test.ts` | Extend for both formats/margin presets. |
| `source_code/src/lib/printStyleInjector.ts` (new) | `updatePrintPageStyle(format, marginsMm)` — creates/updates a `<style id="rf-print-page">` head element with a literal `@page { size: ...; margin: ...; }` rule. |
| `source_code/src/lib/printStyleInjector.test.ts` (new) | jsdom test asserting injected `<style>` content matches expected literal values per format/margin combo. |
| `source_code/src/components/preview/Preview.tsx` | Read design settings from store; apply `getDesignCssVars` as inline style on `#resume-page`; call `updatePrintPageStyle` in a `useEffect` keyed on format/margins; replace hardcoded `210mm`/`297mm` with `getPageDimensionsMm(format)`; thread page height into `usePageCount`. |
| `source_code/src/components/preview/usePageCount.ts` | Accept page-height (or format+margins) param instead of the old module constant. |
| `source_code/src/components/preview/templates.tsx` | Replace hardcoded Tailwind text-size/spacing/margin/font-family classes with `var(--rf-*)`-driven inline styles across `ModernTemplate`/`ClassicTemplate`/`CompactTemplate`; keep `print-avoid-break*` classes, layout classes, and the accent-color mechanism untouched. |
| `source_code/src/components/preview/templates.test.tsx` | Add assertions that rendering uses the new inline-style variables; regression-check default output is unchanged from current snapshot. |
| `source_code/src/components/DesignDialog.tsx` (new) | Modal (styled like `SettingsDialog.tsx`, `print:hidden`) housing font/size/line-height/spacing/margins/format controls + reset button. |
| `source_code/src/components/DesignDialog.test.tsx` (new) | Renders; each control updates the store; reset restores design defaults without touching `apiKey`/`model`/`template`/`accent`. |
| `source_code/src/components/Toolbar.tsx` | Add a "Design" icon button (e.g. `Palette`) opening `DesignDialog`. |
| `source_code/src/App.tsx` | Mount `<DesignDialog />` alongside `<SettingsDialog />`/`<ImportDialog />`. |
| `source_code/index.html` | Add Google Fonts `preconnect` + stylesheet `<link>` for the curated non-system fonts. |
| `source_code/src/index.css` | Remove the static `@page {...}` block (superseded by runtime injection); remove hardcoded `210mm`/`297mm` from the static `#resume-page` print rule; add `:root` default `--rf-*` fallback declarations matching current rendering. |

## Steps

1. [ ] **Settings schema + store (migration v1→v2)**: Add design fields to `PersistedSettings` (`src/lib/schema.ts`) and `SettingsStore`/`SETTINGS_DEFAULTS` (`src/store/settings.ts`) — font id, size (S/M/L), line height (compact/normal/relaxed), section spacing (compact/normal/relaxed), margins (narrow/normal/wide), page format (a4/letter). Add enum-validated `repairSettingsData` entries. Bump `version: 2`; `migrateSettingsState` becomes `if (version >= 2) return persisted as PersistedSettings; return repairSettingsData(persisted, SETTINGS_DEFAULTS)` (collapses v0/v1 through the existing lenient repair, mirroring the resume store's precedent). Defaults must reproduce current rendering exactly (M/normal/normal/normal/a4). No UI or template changes yet.
2. [ ] **Settings migration tests**: Extend `settings.test.ts` — pass-through at v2; repair a legacy 4-field v1 payload, asserting old fields preserved and new fields defaulted; malformed new-field fallback; missing-state fallback.
3. [ ] **`getDesignCssVars` + `PAGE_FORMATS`**: New `src/lib/design.ts` (curated 6-font list with fallback stacks, size/line-height/spacing/margin scales, `getDesignCssVars`) and `src/lib/pageFormats.ts` (`PAGE_FORMATS`, `getPageDimensionsMm`, `getMarginsMm`). Pure functions, no DOM dependency yet.
4. [ ] **Unit tests for Step 3**: `design.test.ts` (exact CSS var output per enum value; fallback-stack shape check) and `pageFormats.test.ts` (dimension/margin lookups for both formats).
5. [ ] **Wire CSS variables into the render tree**: In `Preview.tsx`, compute `getDesignCssVars` and apply as inline style on `#resume-page`; add matching `:root`/`#resume-page` default `--rf-*` declarations in `index.css` so unstyled/pre-hydration state matches current look. No template markup changes yet — verify via `getComputedStyle` in a component test that variables are present with expected values.
6. [ ] **Refactor `ModernTemplate` to consume variables**: Replace its hardcoded text-size/spacing/margin/font classes with `var(--rf-*)`-driven inline styles; keep `print-avoid-break*`, layout classes (`w-[34%]`, `flex`, etc.), and the accent-color mechanism untouched. Run `templates.test.tsx` after this diff before moving to the next template.
7. [ ] **Refactor `ClassicTemplate`** — same treatment, separate diff, re-run tests.
8. [ ] **Refactor `CompactTemplate`** — same treatment, separate diff, re-run tests. Visually compare all 3 templates' default output (M/normal/normal/normal) against pre-refactor screenshots to confirm zero regression before proceeding.
9. [ ] **Dynamic page format — pagination math**: In `pagination.ts`, replace the `PAGE_HEIGHT_PX` constant with `getPageHeightPx(format, marginsMm)`; update `usePageCount`/`computePageCount`/`computePageBreakOffsets`/`computeCurrentPage` to accept it as a parameter. Extend `pagination.test.ts` for both formats/margin presets.
10. [ ] **Dynamic page format — print + preview sync**: Add `printStyleInjector.ts` (`updatePrintPageStyle(format, marginsMm)` rewriting a single `<style id="rf-print-page">` head element with the literal `@page` rule). Remove the static `@page` block and hardcoded `210mm`/`297mm` `#resume-page` print dimensions from `index.css`. In `Preview.tsx`: replace the inline `210mm`/`297mm` page-box style with `getPageDimensionsMm(format)`; call `updatePrintPageStyle` in a `useEffect` on format/margin change; also call it defensively in the Toolbar's print-button `onClick` immediately before `window.print()` as a belt-and-suspenders guard against stale styles. Add `printStyleInjector.test.ts` asserting injected content per format/margin combo.
11. [ ] **Design panel UI**: Add `designPanelOpen`/`openDesignPanel`/`closeDesignPanel` and `resetDesignSettings()` to the settings store. Build `DesignDialog.tsx` (styled like `SettingsDialog.tsx`, `print:hidden`) with: font `<select>`, size/line-height/spacing/margin segmented button groups, format `<select>`, and a reset button restoring only the design fields (leaving `apiKey`/`model`/`template`/`accent` untouched). Add the Toolbar icon button and mount `<DesignDialog />` in `App.tsx`.
12. [ ] **`DesignDialog` tests**: Render, verify each control updates the store, verify reset restores defaults without touching non-design fields, verify switching templates leaves design fields unchanged (AC4).
13. [ ] **Font loading**: Curate 6 fonts (2-3 system-only + 3-4 Google Fonts, e.g. Inter, Merriweather, Roboto Slab, Lato), each with a complete CSS fallback stack terminating in `serif`/`sans-serif`. Add `preconnect` + stylesheet `<link>` tags to `index.html` with `display=swap`. No JS font-load detection — fallback is pure CSS.
14. [ ] **Full typecheck + test suite pass**: Run `npm run build` (tsc) and `npm test`; fix residual issues.
15. [ ] **Manual verification pass**: Walk the 5 acceptance criteria per the manual script below; write results into this plan's Deviations/results section.

## Risk register

| Risk / landmine | Mitigation |
|-----------------|------------|
| `@page` cannot reference CSS custom properties (CSS Paged Media spec limitation) | Runtime-injected literal `<style id="rf-print-page">@page{size:...}</style>` rewritten via `useEffect` on format/margin change (Step 10), plus a defensive re-apply in the print button's `onClick` immediately before `window.print()` in case of a state/effect timing edge case. |
| Page dimensions hardcoded in 3 previously-independent places (`@page` rule, `#resume-page` inline size, `pagination.ts` height constant) can desync | All three now derive from the single `PAGE_FORMATS`/`getPageDimensionsMm` source of truth (Step 9-10); no call site may hardcode `210`/`297`/`216`/`279` again. |
| Tailwind-class-to-CSS-variable template refactor visually regresses existing output | Default enum values (M/normal/normal/normal/a4) are chosen to exactly reproduce today's literals; refactor is done per-template in 3 separate diffs (Steps 6-8) with `templates.test.tsx` re-run after each and a visual screenshot comparison before proceeding; `print-avoid-break*`, layout classes, and accent-color styling are explicitly out of scope for this refactor. |
| Google Fonts offline/network-failure behavior (AC3) | Every curated font's CSS stack ends in a generic fallback family; `display=swap` means text is visible in fallback immediately regardless of webfont load success; no JS detection needed. Verified manually (Vitest/jsdom can't drive real network font loading). |
| Settings migration v1→v2 correctness | Follows the exact established `migrateSettingsState`/`repairSettingsData` pattern (Zod `.catch(default)` per field) rather than inventing new mechanics; explicit test asserts legacy 4 fields survive a v1 payload untouched (Step 2). |
| New `DesignDialog` modal/trigger must respect the project's `print:hidden` hard rule | `DesignDialog.tsx` root carries `print:hidden` exactly like `SettingsDialog.tsx`; Toolbar icon button lives inside the already-`print:hidden` header, confirmed not rendered via a portal. |

## Test plan

- **Unit**: `settings.test.ts` (v1→v2 migration), `design.test.ts` (`getDesignCssVars` mapping, font fallback-stack shape), `pageFormats.test.ts` (dimension/margin lookups), `pagination.test.ts` (page-height math per format), `printStyleInjector.test.ts` (injected `<style>` content per format/margin combo).
- **Integration/UI**: `DesignDialog.test.tsx` (each control updates store; reset restores only design fields; template switch preserves design settings — AC4); `templates.test.tsx` (rendering consumes `var(--rf-*)`, default output matches pre-refactor baseline).
- **Manual verification script (for the review stage)**:
  1. For each of {Modern, Classic, Compact} × {A4, US Letter} × 2-3 font/size/spacing/margin combinations: set controls, confirm live preview updates immediately (AC1).
  2. Reload the browser after setting non-default values — confirm all design settings persist (AC1).
  3. Export via `window.print()`/print-to-PDF for each format — visually confirm page size, margins, and typography match the on-screen preview exactly, including US Letter (AC2).
  4. Throttle/disable network in devtools, reload, confirm text still renders legibly via fallback fonts and export still succeeds (AC3).
  5. Switch templates after setting non-default design values — confirm design settings are unchanged (AC4).
  6. Open the Design panel, change several values, click Reset — confirm all design controls revert to defaults while API key/model/template/accent are untouched (AC5).

## Deviations
*(filled during build — every departure from the approved steps, with why)*
