# F-002 — Review Log

## 2026-07-03 — Stage 4 review

### Diff review
Reviewed `git diff main...HEAD -- . ':!source_code/package-lock.json'` (14 files,
+544/-43). Traced the Zod schema logic (`src/lib/schema.ts`) against every acceptance
criterion and edge case by hand — no correctness defects found. Notably verified:
- `idField`'s optional+transform correctly repairs missing/blank ids without ever
  rejecting on that basis alone (required for AC1 to *succeed*, not reject).
- `parseResumeData`'s field-naming error message resolves correctly even for nested
  path issues (e.g. `sectionOrder[0]` invalid enum value still reports field `sectionOrder`,
  not the array index) — confirmed by tracing Zod's issue `path` array structure.
- `repairResumeData`'s per-field `.catch()` correctly isolates failures: a wrong-typed
  `skills` field falls back to `[]` while a valid `basics` field passes through untouched
  in the same call — confirmed by the "preserves valid fields while repairing only the
  invalid ones" test.
- No circular import: `schema.ts` → `./id`, `resume.ts` → `../lib/schema` and
  `../lib/id`, no back-edge.

### Deviations (recorded in plan.md, reviewed here)
1. Migrate closures extracted to named exports for testability — reasonable, required
   for direct unit tests without simulating zustand's localStorage internals.
2. `JSON.parse` failure now has its own message (`'This file is not valid JSON.'`),
   distinct from schema-validation failure — direct, correct consequence of AC2; the
   one F-001 test this touched was updated to match, not silently left broken.
3. New oxlint warning on `AiPanel.tsx` (`react/only-export-components`) — pre-existing
   pattern in this file (Living Product Map §3.6), warning only, does not fail CI.
4. Bundle: 245.42 kB → 312.94 kB (+27%) / gzip 75.71 kB → 93.60 kB (+24%) after adding
   Zod. Proportionate to adding a full runtime validation library covering all 7 resume
   sections plus 3 store schemas — not flagged as a blocker.

All four are within the plan's anticipated scope, not surprises.

### Acceptance criteria walk (spec.md)
1. Missing-id import succeeds, unique ids assigned: **verified** —
   `file.test.ts` (single item, blank id, multiple items get distinct ids) and
   `schema.test.ts` (`parseResumeData` repair path) both cover this.
2. Wrong-typed field rejected with specific message: **verified** — `skills: "foo"`
   throws `Invalid "skills": expected an array.` (not the old generic message);
   `SchemaError` type confirmed distinct.
3. All three stores have `version: 1` + `migrate`, pre-version payload → valid state:
   **verified** — `resume.test.ts`, `settings.test.ts`, `AiPanel.test.ts` each test
   `migrate*State(persisted, 0)` against valid, malformed, and `undefined` inputs.
4. Export→import round-trip deep-equal: **verified** — `file.test.ts` round-trip test
   against the fully-populated sample resume.
5. Existing (versionless) localStorage hydrates without data loss: **verified** —
   `migrateResumeState(legacy, 0)` test asserts the sample resume survives migration
   unchanged; a second test confirms a malformed field is individually repaired
   without losing sibling valid fields.

### Test coverage vs. spec's "Test expectations"
31 new tests (58 total in the suite). Not snapshot-only — asserts values, thrown
error types/messages, and array contents throughout. `file.test.ts` was extended
per the spec's explicit instruction rather than duplicated into a new file.

### Local verification
```
npm run lint   → clean (1 pre-existing-pattern warning, not new scope creep; exit 0)
npm run build  → tsc -b && vite build succeeded; bundle +27%/+24% (documented above)
npm test       → 58 passed (58), 6 test files
```

### CI verification (learned from F-001's gap)
PR #2 opened immediately after local verification (this time `gh auth login` was
already done). GitHub Actions run 28611124090: **green** —
`npm ci && npm run lint && npm run build && npm test` all passed on a clean install.
No CI-observation gap to carry forward this time.

### Verdict (Stage 4)
No blocking findings. Proceeding to Stage 5 (Opus finalize).

## Final gate (Opus) — 2026-07-03

**VERDICT: SHIP**

Independent verification (fresh context, no implementation history): `npm run lint`
(1 pre-existing disclosed warning), `npm run build`, `npm test` (58 passing) all
re-run and green. Ran `madge` to independently confirm no circular imports —
the `id.ts` extraction achieved its purpose.

**Acceptance criteria — all 5 confirmed, with adversarial probing beyond a surface
re-read:**
1. AC1 — missing/blank-id repair genuinely succeeds in both schema paths, distinct
   ids assigned to multiple items.
2. AC2 — specifically probed the nested-field concern flagged in the review brief:
   `basics.email: 123` correctly **rejects** (not silently repaired) — `.partial()`
   does not weaken per-key type checks, confirming the strict/lenient split holds at
   the nested-field level, not just top-level.
3. AC3 — verified the migrate version comparison directly: `version >= 1` passthrough,
   `version < 1` repair, no off-by-one; versionless zustand payloads hydrate as v0.
4. AC4 — round-trip confirmed lossless; Zod does not reorder keys or mutate valid data.
5. AC5 — legacy localStorage migration preserves valid data, isolates malformed fields.

**Landmine check (§3.5 Applied/value-equality):** directly tested — a valid
`TailorResult` survives `repairAiData` byte-identical (`JSON.stringify` equal,
newlines preserved, highlight order preserved). Confirmed safe.

**Out-of-scope respected:** `ResumeData` shape unchanged, no new UI, `useAi` stays
private to `AiPanel.tsx`. Deviations (named migrate exports, JSON-error message split)
reviewed as reasonable, not scope creep.

**Non-blocking note for future features:** the lenient repair schema's `.catch()`
granularity is per-top-level-field — one corrupt sibling item drops the whole array
to `[]` rather than repairing just that item; one bad nested `basics` key drops all
of `basics`. Matches the plan's documented design, only affects recovery from
already-corrupt localStorage (never user-facing import, never throws). Worth revisiting
if finer-grained recovery is ever needed — not a blocker now.
