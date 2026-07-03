# F-006 — Stage 4 Review Log

## 2026-07-03 — Code review + verification pass

### Code review (high effort, independent agent, branch `feature/F-006-presentation-controls` vs `main`)

**Summary:** Well-scoped feature. Settings migration, `getDesignCssVars`, `pageFormats`, and
`printStyleInjector` were all found correctly implemented and well-tested. The plan's
Deviations section was checked against the actual diffs and found to accurately describe
intentional trade-offs (line-height scoping, margin symmetry change, Classic template's
font-default shift) rather than bugs.

**Confirmed findings:**

| # | File:Line | Finding | Severity | Resolution |
|---|-----------|---------|----------|------------|
| 1 | `source_code/src/components/preview/Preview.tsx` (onScroll handler) | `computeCurrentPage(scrollTop, pageCount)` omitted the third `pageHeightPx` argument, silently falling back to the hardcoded A4 `PAGE_HEIGHT_PX` constant even when `pageFormat === 'letter'` — the "Page X of Y" indicator would miscalculate against the wrong page-height boundary on US Letter. | High | **Fixed.** Added `getPageHeightPx(pageFormat)` as the third argument. Added a regression test in `pagination.test.ts` asserting `computeCurrentPage` gives a different (correct) result with an explicit non-default `pageHeightPx` vs. the implicit A4 default, so this can't silently regress again. |
| 2 | `source_code/src/store/settings.ts` (`migrateSettingsState`) | The `version >= 2` branch did a raw `as PersistedSettings` cast with zero runtime validation, unlike every other repair path in the codebase — a corrupted v2 `localStorage` payload (manual edit, partial write) would reach the store unvalidated, e.g. an invalid `fontSize` silently producing invalid CSS. | Medium | **Fixed.** `migrateSettingsState` now always runs the payload through `repairSettingsData` regardless of version, matching the defensive posture used elsewhere. Updated `settings.test.ts`: the "current version" test now asserts `toEqual` instead of `toBe` (validation always returns a new object), and a new test confirms a corrupted v2 payload is still repaired to valid defaults. |

**Stylistic notes (no action taken, judgment calls already made in the approved plan):**
- Segmented-group buttons in `DesignDialog.tsx` lack `role="radiogroup"`/`aria-pressed` semantics — minor a11y gap, consistent with (not worse than) existing patterns elsewhere in the app (e.g. accent-color swatches). Not blocking.
- The on-screen page-margin padding change (Tailwind `p-6/7/8` → `var(--rf-page-margin)`, ~15mm/56.7px at default vs. the old 24–32px) is a larger-than-a-glance visual change at "normal" — but this is the plan's explicitly documented, signed-off trade-off (symmetric adjustable margins replacing the old hardcoded asymmetric print margin), not a defect.

After fixes: `npm run lint` (only 3 pre-existing unrelated warnings), `npm run build` (typecheck + bundle clean), `npm test` — **160/160 tests passing** (up from 158; +2 for the `computeCurrentPage` and migration-validation regression tests).

### Acceptance criteria verification (dev server walkthrough, post-fix)

All 5 criteria checked off in `spec.md`:

1. **Every control updates the live preview immediately and survives reload — pass.** Set font (Merriweather), size (L), line height (Relaxed), section spacing (Compact), page margins (Wide), page format (US Letter) via the Design panel. Confirmed live via `getComputedStyle`/`localStorage` inspection: `#resume-page` font-family, width (815.99px = 215.9mm), and the injected `@page` rule (`215.9mm 279.4mm`, `margin: 20mm`) all updated immediately. Reloaded the page — all 6 values (plus `template`) persisted correctly.
2. **Exported PDF reflects all controls exactly, including US Letter via dynamic `@page` — pass** (mechanism-verified). Confirmed the injected `<style id="rf-print-page">` rule's literal dimensions/margin match `#resume-page`'s on-screen box exactly for both A4 and US Letter — the three previously-independent dimension sources (print `@page`, on-screen box, pagination math) are provably in sync. Full pixel-level PDF visual rendering was not captured in this headless preview environment (no real print engine available) — residual manual check for the human reviewer before ship, e.g. via an actual browser print-preview/print-to-PDF.
3. **Google fonts load with sensible fallbacks; export works offline with system-font fallback — pass** (with one residual caveat). Confirmed via live network inspection that the Google Fonts stylesheet request *and* the actual Merriweather `.woff2` font file both loaded successfully (200 OK). Every curated font's CSS stack was confirmed (unit test + live `getComputedStyle`) to end in a generic fallback family (`serif`/`sans-serif`). Actual offline/network-failure rendering was **not** exercised (no network-throttle/offline-simulation tool available in this environment) — this specific sub-claim relies on standard CSS fallback-stack behavior rather than a live offline test, and is flagged as a residual manual check.
4. **Switching templates preserves the user's design settings — pass.** With font/size/spacing/margins/format all set to non-defaults, switched the template selector from Modern → Classic; confirmed via `localStorage` that all 6 design fields were unchanged while `template` updated.
5. **Reset-to-defaults control exists per the design panel — pass.** Clicked "Reset to defaults" after setting all 6 fields to non-default values; confirmed via `localStorage` that all 6 design fields reverted to `SETTINGS_DEFAULTS` while `template` (`classic`, set in the AC4 step), `accent`, `apiKey`, and `model` were left untouched.

### Test coverage vs. spec's "Test expectations"

Spec requires: "Unit tests for settings store migration and the settings→CSS-variable mapping. Manual verification script for export fidelity per format/font combination."

- Settings store migration: `source_code/src/store/settings.test.ts` — 6 tests covering v1→v2 repair, versionless/v0 repair, malformed-field fallback, missing-state fallback, current-version re-validation, and corrupted-v2-payload rejection (added during this review pass).
- Settings→CSS-variable mapping: `source_code/src/lib/design.test.ts` — 5 tests covering exact variable output at defaults, every font id, S/L size ordering, margin preset ordering, and fallback-stack shape.
- Additional coverage beyond the spec's minimum (added during build, not required but strengthens confidence): `pageFormats.test.ts`, `printStyleInjector.test.ts`, `pagination.test.ts` (page-height-per-format + the new non-default-height regression test), `templates.test.tsx` (CSS-variable-driven rendering), `DesignDialog.test.tsx` (control wiring, reset scope, template-switch independence).
- Manual verification script: executed above via live dev-server walkthrough; results recorded per acceptance criterion. Full print-to-PDF visual fidelity and true offline-network rendering remain residual manual checks for a human with a real browser print dialog and network-throttling tool, called out explicitly rather than silently assumed.

### Final state
- Lint: clean (3 pre-existing unrelated warnings).
- Build (`tsc -b && vite build`): clean.
- Tests: 160/160 passing (19 test files).
- All 5 acceptance criteria checked off in `spec.md`.
- 2 confirmed code-review findings, both fixed and covered by new regression tests.

## Final gate (Opus) — 2026-07-03

Independent Opus review, given only the branch diff (`git diff main...HEAD`), `spec.md`,
`plan.md`, and Living Product Map §3 — no implementation history or prior review context.

### VERDICT: SHIP

**Blockers: none.**

All 5 acceptance criteria independently re-verified against the code (not just the
checkmarks): persistence/migration (AC1), dynamic `@page` for both formats (AC2), font
fallback-stack shape (AC3), template-switch independence (AC4), reset scope (AC5). No
scope creep against the spec's out-of-scope list. No landmine violations (print-CSS hack
discipline, `print:hidden`, schema-versioning pattern all respected). No injection risk in
the runtime-injected `@page` `<style>` tag — values are enum/config-derived, never
user free-text.

**Non-blocking observations:**
1. The plan's Deviations section didn't disclose that per-template inner padding is now
   driven by the page-margin control (Tailwind `p-6/7/8` → `var(--rf-page-margin)`), which
   does change the on-screen default look more than the "zero visual change" framing
   implied — correct semantics (visible margin should match the print margin), just an
   under-documented deviation, not a defect.
2. Recommends a human print one A4 and one US Letter page before merge to confirm no
   content clipping at print time, since real PDF rendering wasn't captured in any
   automated pass (this echoes the same residual manual check already flagged in the
   stage-4 log above).
3. Minor: `getPageCssVars` sets `--rf-page-width/height` on `#resume-page` inline style
   while the same element also sets explicit `width`/`minHeight` from the same source —
   redundant but harmless (the CSS vars feed `@media print`; the inline dims drive the
   on-screen box).

**Gate 2 (merge to `main`) is clear to proceed** once the human reviewer optionally
confirms the residual print-fidelity check above.
