# F-005 — Review Log

## Stage 4 review — 2026-07-03

### Code review (high effort, full branch diff)

Reviewed `git diff main...feature/F-005-custom-sections` (17 files, ~800 insertions)
via an independent agent with no implementation history — given only the diff, the
feature description, and `CLAUDE.md`'s hard rules — then verified each finding
directly against the source before acting. Checked correctness, migration safety,
schema soundness, type-safety escape hatches (`as` casts), editor/template rendering
correctness, and test quality; explicitly instructed not to flag pre-existing
patterns, style nitpicks, or the spec's declared out-of-scope items (custom field
schemas, custom sections in AI *rewrite* suggestions, drag-and-drop).

| # | File | Finding | Severity | Resolution |
|---|------|---------|----------|------------|
| 1 | `src/store/resume.ts` (`migrateResumeState`/`migrateV1ToV2`) | The v1→v2 migration path did not run persisted data through the same id-validity repair the v0 and strict-import paths get. A v1 payload with a corrupted `sectionOrder`/`hiddenSections` entry (e.g. hand-edited localStorage, or a bug in some future code path) would carry a dangling section id straight through into v2, where no delete control in the UI could ever remove it — a "ghost" section slot with no editor entry point to fix it. | Medium (data-corruption survival gap; violates the migration-safety guarantee the same PR added for v0/import) | **Fixed** — simplified `migrateResumeState` to route every payload below v2 (both v0 and v1) through the existing lenient `repairResumeData`, which already defaults `customSections` to `[]` and filters dangling `sectionOrder`/`hiddenSections` ids (added earlier in this same PR for the import path). This removed a redundant, narrower `migrateV1ToV2` function entirely rather than patching it. **Regression test added**: `resume.test.ts` — "drops a dangling section id when migrating a v1 payload instead of smuggling it through". Re-verified live in the browser: staged a v1 localStorage payload with a forged `sectionOrder`/`hiddenSections` id, reloaded, confirmed the migrated state has the id stripped from both fields with no console errors. |
| 2 | `src/lib/gemini.ts` (`IMPORT_SCHEMA_TEMPLATE`) | An empty-array `customSections: []` entry was added to the AI-import prompt template "for consistency." `withDefaults()` fills missing item fields from `template[0]` — for an empty array, that's `undefined`, so any custom-section item Gemini's PDF/DOCX parser returned would pass through completely unfilled. Since `customSectionItemShape` requires `title`/`subtitle`/`date`/`description`/`bullets` as non-optional, a plausible partial Gemini response (it isn't even shown an example item shape to follow) would fail strict schema validation and **abort the entire import**, not just drop the custom section. | Medium (correctness — a specific input can break an unrelated, already-working import flow) | **Fixed** — removed `customSections` from `IMPORT_SCHEMA_TEMPLATE` entirely. Nothing in the F-005 spec requires the AI-driven PDF/DOCX import pipeline to extract custom sections from unstructured text (spec's "JSON export/import" scope line refers to the plain JSON round-trip in `file.ts`, already correctly handled without template changes); this restores identical prior behavior for that path. `parseResumeData`'s `.optional().default([])` on `customSections` (added in this PR) means the top-level field is still safely defaulted when Gemini's response omits it, which it now always will. |
| 3 | `src/lib/schema.ts` (`checkSectionIds`) | `customSections` ids aren't checked for uniqueness; two sections sharing an id (only reachable via hand-edited/malformed JSON import, not any UI action — `newId()` is `crypto.randomUUID()`-sourced) would make `.find()`-based store actions (`removeCustomSection`, `renameCustomSection`, etc.) always resolve to the first match, silently stranding the second. | Low (no live trigger in the current UI or any code path in this diff; only reachable via adversarial/malformed JSON) | **Not fixed — assessed and waived.** No code path in this diff or the app's UI can produce a duplicate custom-section id; enforcing uniqueness in the schema would be speculative hardening for an input shape nothing currently generates. Recorded here for visibility rather than silently dropped, per the reviewer's flag. |
| 4 | `src/components/editor/SectionShell.tsx` | `SECTION_LABELS[section as SectionKey]` was an unsound cast in the `label` fallback branch — currently dead in practice (every `CustomSectionEditor` caller passes `label` explicitly), but would silently render a blank heading instead of a type error if a future caller ever omitted it for a non-built-in id. | Low (type-safety hygiene, no live bug) | **Fixed** — replaced the cast with a runtime `isSectionKey()` guard (matching the identical pattern already used in `templates.tsx`) before indexing `SECTION_LABELS`, falling back to an empty string for a non-built-in id with no `label` prop instead of an unchecked cast. |

No other CONFIRMED findings. Specifically checked and found no issues:
- **Zustand immutability**: all new custom-section/item store actions (`addCustomSection`,
  `renameCustomSection`, `removeCustomSection`, `addCustomItem`, `updateCustomItem`,
  `removeCustomItem`, `moveCustomItem`) spread correctly throughout — no direct
  mutation of `s.resume` or nested arrays.
- **`moveCustomItem` swap math**: bounds-checked identically to the existing
  `moveItem`/`moveSection` pattern (no-op at first/last position).
- **Cross-field schema validation wiring**: confirmed `checkSectionIds`'s `superRefine`
  runs after `customSections` is fully parsed/defaulted in both `strictResumeSchema`
  and the lenient schema in `repairResumeData`, so a dangling id is caught in both the
  strict-import and lenient-repair paths, not just one.
- **Template rendering**: `isSectionKey`/`sectionLabel`/`visible`/`orderedSections` in
  `templates.tsx` — no double-render or silent-drop path found; `ModernTemplate`'s
  `mainKeys` is the only list a custom id is added to, so a custom section can't
  appear in both the sidebar and main columns.
- **React keys**: all new `.map()` calls (custom section list, custom item list,
  `CustomSectionBody` bullets) use stable `id`-based (or pre-existing-pattern index)
  keys — no new key-collision risk.
- **`print:hidden` / floating UI**: no new floating/portal UI introduced by this
  feature — n/a.
- **AI key handling**: no new AI calls added; `resumeToText()` extension only adds to
  an existing prompt string, no new network call or auth path.

### Verification pass

Ran `npm run dev` in `source_code/` via the project's preview tooling and drove the
live app with `preview_eval`/`preview_click`/`preview_fill`/`preview_snapshot`.

| AC | Result | Evidence |
|----|--------|----------|
| 1. Add a custom section with a name, add/edit/reorder/delete items, live in preview across all 3 templates | **PASS** | Live browser: added a section via "Add custom section," renamed it, added/edited/reordered/removed items through `EditorPanel`/`CustomSectionEditor`; sample resume's "Publications" section (title + item title/subtitle/date/description/bullets) confirmed rendering correctly in Modern, Classic, and Compact templates via `preview_eval` DOM inspection. `EditorPanel.test.tsx` and `templates.test.tsx` cover this at the automated level. |
| 2. Reorder and hide/show exactly like built-in sections | **PASS** | Live browser: toggled the custom section's visibility — disappeared from/reappeared in the rendered preview identically to a built-in section (e.g. Summary). Moved it up in `sectionOrder` and confirmed the Classic template (linear, unsplit rendering) reflects the new position relative to Languages. (Modern's sidebar/main split means a custom section's position relative to sidebar-only built-ins doesn't visibly change on move, which is identical, pre-existing behavior for any built-in main-column section — not a regression.) |
| 3. Export → import round-trips losslessly; migration bumps to v2, preserves existing data | **PASS** | `file.test.ts`'s existing round-trip tests (`sampleResume()` now includes a custom section) pass unmodified. Live `localStorage` inspection confirmed `version: 2` and a fully-intact `customSections` array after reorder/reload. Additionally verified the fixed migration path (finding #1 above) by staging a v1 payload with a dangling id and confirming clean removal on load. |
| 4. Delete requires confirmation, cleans up `sectionOrder`/`hiddenSections` without corrupting either | **PASS** | Live browser: stubbed `window.confirm` to return `false` then `true`. Cancel left the section and its delete button intact; confirm removed it from the DOM, `customSections`, `sectionOrder`, and `hiddenSections` simultaneously with no orphaned ids and no console errors (confirmed via `localStorage` read after the render flush). `EditorPanel.test.tsx` covers this at the automated level. |
| 5. AI Tailor still works with custom sections present; they appear in serialized context | **PASS** | No live Gemini call made (BYO-key model, no key available in this environment — consistent with F-004's precedent). `resumeToText()`'s `CUSTOM SECTIONS:` block confirmed via a new `gemini.test.ts` test that asserts the outgoing prompt body (mocked `fetch`) contains the custom section's title and item title. `tailorResume()`'s rewrite-suggestion logic is unmodified — bullet-rewrite targets remain experience-only, per spec's explicit out-of-scope. |

No console errors or warnings observed at any point across either verification session
(build-stage pass and this post-fix re-verification pass).

### Test coverage vs. spec's "Test expectations"

Spec requires: store tests (custom section CRUD, order/hide integration, migration
v1→v2); schema tests (round-trip with custom sections); template smoke test (custom
section renders).

- `src/store/resume.test.ts` — custom section CRUD (add/rename/remove), custom item
  CRUD (add/update/remove/move with no-op boundary cases), `moveSection`/`toggleSection`
  with a custom id, migration v1→v2 (including the new dangling-id regression test).
- `src/lib/schema.test.ts` — round-trip with populated `customSections`, missing-item-id
  repair, wrong-typed `customSections` rejection, dangling `sectionOrder`/`hiddenSections`
  id rejection (strict) and silent-drop (lenient).
- `src/components/preview/templates.test.tsx` (new) — custom section title/item content
  renders across all 3 templates; `print-avoid-break` class present, guarding the F-003
  pagination landmine.
- Beyond the spec's minimum bar: `src/components/editor/EditorPanel.test.tsx` (new) —
  end-to-end add/rename/item-CRUD/delete-with-confirmation through the actual rendered
  editor, not just the store layer; `src/lib/gemini.test.ts` addition — confirms custom
  sections appear in the AI Tailor prompt context (AC5).

`npm run lint && npm run build && npm test` — all green: **133 tests, 15 files**;
`tsc -b` clean; lint has only the two pre-existing `AiPanel.tsx`/`ImportDialog.tsx`
fast-refresh warnings (unrelated to this diff, unchanged).

### Residual risk carried to Gate 2

None blocking. Finding #3 (duplicate custom-section id, schema-level) is a documented,
unfixed, low-severity theoretical gap with no live trigger — see table above. AI Tailor
serialization (AC5) is verified via prompt-content assertion rather than a live Gemini
call, matching F-004's precedent for this BYO-key environment constraint.
