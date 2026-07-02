# F-002 — Implementation Plan

*Status: approved · Approved by: Ryan · Date: 2026-07-03*

## Approach
Add `zod@^4.4.3` (verified current registry version, TS 6.0.2-compatible, no peer
dependency issues) and build one schema module, `src/lib/schema.ts`, that exports two
functions built from the same field-level schemas:

- **`parseResumeData(raw: unknown): ResumeData`** — strict. Missing/blank item `id`s are
  silently repaired (this is explicitly required to *succeed* per spec AC1). Wrong-typed
  fields (e.g. `skills: "foo"`) throw a `SchemaError` with a specific, field-naming message.
  Used by `importResumeJson` — user-facing import should reject bad data loudly.
- **`repairResumeData(raw: unknown): ResumeData`** — lenient, never throws. Built from the
  same schemas but with `.catch(default)` at every field, so malformed/missing data
  silently falls back to `emptyResume()`'s value for that field instead of failing the
  whole parse. Used by store `migrate` — rehydrating a user's existing localStorage must
  never crash the app on load, even if some field is unexpectedly shaped.

Both variants strip unknown keys (Zod object schemas do this by default — no extra config).
Both repair missing/blank item ids the same way (shared item-schema building blocks).

`newId()` currently lives in `src/store/resume.ts`; `schema.ts` needs it too, and
`resume.ts` will need to import `schema.ts` for its `migrate` function — a direct import
would cycle. Extract `newId()` to a new tiny module `src/lib/id.ts` first; both `resume.ts`
and `schema.ts` import from there.

Settings and the `useAi` store get the same `version: 1` + Zod-backed `repair*` treatment,
scaled down (small flat shapes, no item-id repair needed) — for consistency and because
AC3 requires hydration to yield a *valid, correctly-typed* state, not just "has the keys."

Rejected alternative: hand-rolled validation (no Zod) — the field count (7 sections × their
own shapes) makes manual type-guards error-prone and unreadable; Zod's `.catch()` gives the
strict/lenient split almost for free from one schema definition.

## Files to change
| File | Change |
|------|--------|
| `package.json` | add `zod@^4.4.3` dependency |
| `src/lib/id.ts` | new — `newId()` moved here from `resume.ts` (no logic change) |
| `src/store/resume.ts` | import `newId` from `./../lib/id`; add `version: 1` + `migrate` using `repairResumeData` |
| `src/lib/schema.ts` | new — Zod schemas for all 7 `ResumeData` sections + `Basics`; exports `parseResumeData` (strict, throws `SchemaError`) and `repairResumeData` (lenient, never throws) |
| `src/lib/file.ts` | `importResumeJson` delegates validation to `parseResumeData`; JSON-parse failures keep their own message, schema failures surface `SchemaError.message` |
| `src/store/settings.ts` | add `version: 1` + lightweight Zod-backed `migrate` |
| `src/components/ai/AiPanel.tsx` | `useAi` store: add `version: 1` + lightweight Zod-backed `migrate` for `{ jobDescription, result }` |
| `src/store/resume.test.ts` | extend: hydration/migration tests (versionless payload → valid v1 state) |
| `src/lib/file.test.ts` | extend: missing-id repair, wrong-typed field rejection with specific message, unknown-key stripping, export→import round-trip |
| `src/lib/schema.test.ts` | new — direct tests of `parseResumeData`/`repairResumeData` (valid/invalid/repairable payloads) |

## Steps
1. [x] Add `zod@^4.4.3` to `package.json`; `npm install`.
2. [x] Create `src/lib/id.ts` with `newId()`; update `resume.ts` to import from it (no behavior change) — run tests to confirm still green before continuing.
3. [x] Write `src/lib/schema.ts`:
   - Field schemas for `Basics` (all 8 string fields, `.catch('')` variant for lenient mode) and each of the 6 list-item shapes (`ExperienceItem`, `EducationItem`, `ProjectItem`, `SkillGroup`, `CertificationItem`, `LanguageItem`), each with `id` optional/blank-repaired via a shared item-id transform using `newId()`.
   - `SectionKey`/`sectionOrder`/`hiddenSections`: array of the 7-value enum; missing → default order / `[]`; present-but-invalid → reject in strict mode, fall back to default in lenient mode.
   - Compose `resumeDataSchema` (strict) and a lenient variant (same shapes, `.catch()` per top-level field falling back to the matching `emptyResume()` field).
   - Export `class SchemaError extends Error`, `parseResumeData(raw): ResumeData` (throws `SchemaError` with a message naming the offending field, e.g. `Invalid "skills": expected an array.`), `repairResumeData(raw): ResumeData` (never throws).
4. [x] Update `src/lib/file.ts`: `importResumeJson` calls `parseResumeData(data)` instead of the current shallow merge; keep the existing `FileReader.onerror` → `'Could not read the file.'` and a `JSON.parse` failure → `'This file is not valid JSON.'`; let `SchemaError` messages surface as-is (satisfies AC2's "specific error message").
5. [x] Update `src/store/resume.ts`: add `version: 1`, `migrate: (persisted, version) => version < 1 ? { resume: repairResumeData((persisted as { resume?: unknown })?.resume) } : persisted as { resume: ResumeData }`.
6. [x] Update `src/store/settings.ts` and the `useAi` store in `AiPanel.tsx`: add `version: 1` + small lenient Zod schemas + `migrate` following the same pattern, scoped to their flat shapes.
7. [x] Write `src/lib/schema.test.ts`: valid payload passes through unchanged; missing ids repaired (both strict and lenient); wrong-typed field throws `SchemaError` with a message that names the field (strict) vs. silently defaults (lenient); unknown top-level and item-level keys stripped.
8. [x] Extend `src/lib/file.test.ts` per spec AC1/AC2/AC4: missing-id import succeeds with generated ids; `skills: "foo"`-style payload rejected with a specific (non-generic) message; export→import round-trip is deep-equal for the sample resume.
9. [x] Extend `src/store/resume.test.ts`: simulate a pre-version localStorage payload (raw object matching the old un-versioned shape, including a malformed field) and confirm `migrate` produces a fully valid `ResumeData` without throwing — proves AC3 + AC5.
10. [x] Add light migration tests for settings/`useAi` stores (versionless payload → valid v1 state).
11. [x] Run `npm run lint && npm run build && npm test` — all green. Confirm bundle size increase from adding Zod is reported in review.md (informational, not a gate).

## Risk register
| Risk / landmine | Mitigation |
|-----------------|------------|
| Circular import between `resume.ts` and `schema.ts` via `newId()` | Extracted to `src/lib/id.ts` (step 2), both modules import from there |
| "Applied" detection in `AiPanel.tsx` is value-equality (summary string, `JSON.stringify` of highlights) — §3.5 landmine | Validation/repair must not reorder object keys or normalize string content for already-valid data; only missing/wrong-typed fields get touched. Add an explicit test: a valid `TailorResult` survives `repairResumeData`-equivalent unchanged. |
| Round-trip AC4 could break if Zod's `.default()`/`.catch()` fills a field that was legitimately empty/omitted differently than the original | Test the *sample* resume (fully populated, no gaps) round-trips deep-equal; a separate test covers the fill-defaults case as a distinct, intentionally-different assertion |
| `sectionOrder`/`hiddenSections` present-but-invalid now rejects in strict import mode, where the old shallow check silently fell back to defaults | Documented UX-tightening, in scope per spec AC2's "wrong-typed fields... rejected." Existing users' own localStorage never has invalid `sectionOrder` (only the app writes it), so this only affects hand-edited/foreign JSON imports — acceptable per spec intent |
| Zod adds bundle weight | Check `npm run build` output size in review.md; Zod tree-shakes reasonably well for the subset used here — flag only if the increase looks disproportionate |

## Test plan
- Unit: `schema.test.ts` (new, core validation/repair logic), extended `resume.test.ts`
  (migration), extended `file.test.ts` (import behavior against the new schema).
- Integration/UI: none — all changes are at the data/store boundary, no component changes.
- Manual verification script: run the app, `loadSample()`, export JSON, edit the file to
  remove an item's `id` and to set `skills` to a string, re-import twice — confirm the
  id-missing file imports successfully and the wrong-typed file is rejected with a specific
  message (not the old generic one).

## Deviations
- Extracted each store's inline `migrate` closure into a named exported function
  (`migrateResumeState`, `migrateSettingsState`, `migrateAiState`) rather than an inline
  arrow function in the `persist()` config. Not specified in the plan, but necessary for
  direct unit testing (steps 9-10) without reverse-engineering zustand's persist/localStorage
  internals in tests. `useAi` itself stays private to `AiPanel.tsx` per the out-of-scope
  constraint — only the migrate function is exported.
- `importResumeJson`'s `JSON.parse` failure now returns `'This file is not valid JSON.'`
  instead of reusing the generic `'This file is not a valid resume JSON export.'` message
  (schema-validation failures use the latter, or `SchemaError`'s specific message). This is
  a direct consequence of AC2 ("specific error message") and was implicit in the plan's
  step 4 wording but not called out as changing an F-001 test — updated
  `file.test.ts`'s "rejects invalid JSON" test to match the more specific message.
- `oxlint`'s `react/only-export-components` now warns (not errors) on `AiPanel.tsx` for
  the new `migrateAiState` export — pre-existing non-blocking pattern in this file
  (Living Product Map §3.6), not a new problem introduced, but worth a mention since it's
  a new warning that wasn't there before.
- Bundle size: 245.42 kB → 312.94 kB raw (75.71 kB → 93.60 kB gzip) after adding Zod —
  a ~27%/~24% increase. Not flagged as disproportionate (Zod is a full runtime validation
  library covering all 7 resume sections), but noted per the risk register.
