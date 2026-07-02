# F-001 — Review Log

## 2026-07-02 — Stage 4 review

### Diff review
Reviewed `git diff main...HEAD` (14 files, +1559/-53, dominated by `package-lock.json`).
No CONFIRMED findings. Notes:
- `parseJson` export widening is intentional per plan.md risk register — accepted, not a defect.
- `vite.config.ts` switched `defineConfig` import from `'vite'` to `'vitest/config'` — this
  re-export is a superset of Vite's config type with `test` typed; confirmed no loss of
  Vite-side config typing (plugins array still typechecks).
- Config/scope changes match plan.md's "Files to change" table exactly — no undocumented deviations.

### Acceptance criteria walk (spec.md)
1. `npm test` runs and passes locally: **verified**, 27/27 green. **CI-side verification
   blocked** — see "Known gap" below.
2. Store mutation tests (add/update/remove/move item, move section, toggle, reset): **verified**
   — `src/store/resume.test.ts`, all pass, edge no-ops explicitly asserted.
3. `parseJson` tests (clean/fenced/prose/unparseable): **verified** — `src/lib/gemini.test.ts`.
4. Import tests (valid/missing-optional/non-object/missing-basics): **verified** —
   `src/lib/file.test.ts`, includes a `FileReader.onerror` path beyond the spec's minimum.
5. CI fails on test failure: **verified locally** — deliberately broke an assertion in
   `gemini.test.ts` mid-build (`{a:1}` → `{a:999}`), confirmed `vitest run` reported the
   failure with a clear diff, then reverted before committing. **CI-side (GitHub Actions)
   verification blocked** — see below.

### Test coverage vs. spec's "Test expectations"
Suites assert real behavior (values, thrown messages, array contents) — no snapshot-only
tests. Matches spec.

### Local verification
```
npm run lint   → clean (oxlint, no findings)
npm run build  → tsc -b && vite build succeeded, bundle size unchanged from pre-F-001 baseline
npm test       → 27 passed (27), 3 test files
```

### Known gap: CI-on-GitHub not yet observed green
`gh auth login` has not been run in this environment, so `gh` cannot create a PR or query
Actions runs (git's own push/fetch use a separate credential helper that does work). The
CI workflow (`.github/workflows/ci.yml`) triggers on `push: branches: [main]` or on a
`pull_request` — neither condition is met by a plain feature-branch push, so no run exists
yet to inspect (confirmed via public API: 0 runs for this branch).

**This means acceptance criteria 1 and 5's "in CI" clause is unverified on GitHub itself.**
The CI job runs the identical commands (`npm ci && npm run lint && npm run build && npm test`)
that were just run and passed locally on a clean install path, so risk is low, but it is
not proof. Recommend: run `gh auth login` once, then either open a PR (triggers CI) or
this gets verified naturally when Gate 2 opens a PR/merges.

### Verdict (Stage 4)
No blocking findings. Proceeding to Stage 5 (Opus finalize) with the CI-on-GitHub gap
carried forward as a flagged item for the human at Gate 2, not a build blocker.

## Final gate (Opus) — 2026-07-02

**VERDICT: SHIP**

Independent verification (fresh context, no implementation history), run by the reviewer itself:
- `npm run lint` → clean; `npm run build` → succeeded, 245 kB bundle; `npm test` → 27/27 passed.
- Repeated the deliberate red-run independently (mutated a `parseJson` assertion — 4 tests
  failed, `vitest run` exited non-zero — reverted, confirmed clean tree). AC-5 holds.

**Acceptance criteria:** all 5 confirmed met. Specifically checked and confirmed correct:
`moveItem`/`moveSection` edge no-ops against the real `DEFAULT_ORDER` and swap logic;
`parseJson` fenced/prose/unparseable cases against the actual source (brace-slicing,
exact error string); `file.test.ts` `it.each` non-object fixtures are not tautological —
each reaches the real validation guard in `file.ts`; `parseJson` export confirmed
non-behavioral (single internal caller only).

**Out-of-scope / landmines:** no scope creep — sole production change is the `export`
keyword on `parseJson`. No Living Product Map §3 landmine touched (no production logic
changed).

**Non-blocking notes for future features:**
- `.oxlintrc.json`'s `ignorePatterns` is not actually honored by oxlint for `.test.ts` —
  currently inert because lint has zero findings anyway. Worth a real fix (or removal of
  the false assumption) whenever oxlint's actual ignore mechanism is confirmed — track as
  a small follow-up, not a blocker.
- `setResume` test asserts a shallow-merge behavior (weaker than `file.ts`'s deep merge)
  but only asserts fields valid under that real behavior — no false-pass risk.
- CI-on-GitHub still not observed green (no PR opened yet — `gh` unauthenticated in this
  environment). Recommend `gh auth login` then opening the PR before/at merge.
