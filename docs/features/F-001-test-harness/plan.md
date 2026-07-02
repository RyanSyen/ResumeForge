# F-001 — Implementation Plan

*Status: approved · Approved by: Ryan · Date: 2026-07-02*

## Approach
Wire Vitest directly into the existing `vite.config.ts` via a `test` block (avoids
maintaining two config files; Vite 8 supports this natively) with jsdom as the test
environment. Add React Testing Library only as a devDependency for future component
tests — F-001's seed suites are store/util-only, no RTL usage needed yet, so it is not
exercised in this pass but is available for F-002+. Use current registry versions
(verified 2026-07-02), not the Explore agent's guessed Vitest 1.x — Vite 8 requires
Vitest ^4.0.0.

Rejected alternative: separate `vitest.config.ts` — adds a second config to keep in
sync with `vite.config.ts` for no benefit at this project's size.

## Files to change
| File | Change |
|------|--------|
| `package.json` | add devDependencies: `vitest@^4.1.9`, `jsdom@^29.1.1`, `@testing-library/react@^16.3.2`, `@testing-library/jest-dom@^6.9.1`; add `"test": "vitest run"` and `"test:watch": "vitest"` scripts |
| `vite.config.ts` | add `test: { environment: 'jsdom', globals: true }` block; add `/// <reference types="vitest/config" />` if needed for typing |
| `tsconfig.app.json` | add `"types": ["vite/client", "vitest/globals"]` so `describe/it/expect` resolve without per-file imports |
| `.oxlintrc.json` | add `"ignorePatterns": ["**/*.test.ts", "**/*.test.tsx"]` so lint doesn't flag test-only patterns (e.g. unused mocks) |
| `src/lib/gemini.ts` | export `parseJson` (currently module-private) so it's directly testable — minimal, additive change, no behavior change |
| `src/store/resume.test.ts` | new — store mutation tests |
| `src/lib/gemini.test.ts` | new — `parseJson` tests |
| `src/lib/file.test.ts` | new — `importResumeJson` tests |
| `.github/workflows/ci.yml` | uncomment `npm test` step |

## Steps
1. [x] Add devDependencies and npm scripts to `package.json`; run `npm install`.
2. [x] Add `test` block to `vite.config.ts`; add `vitest/globals` to `tsconfig.app.json` types.
3. [x] Add oxlint ignore pattern for test files.
4. [x] Export `parseJson` from `src/lib/gemini.ts` (add to existing export statement, no logic change).
5. [x] Write `src/store/resume.test.ts`: covers `addItem`, `updateItem`, `removeItem`,
   `moveItem` (mid-list + both-edges no-op), `moveSection` (both-edges no-op),
   `toggleSection` (on/off idempotency), `reset`, `setResume` (merge-with-defaults),
   `loadSample`. Reset Zustand store state between tests (call `reset()` or re-import
   fresh state per the store's public API — no reaching into internals).
6. [x] Write `src/lib/gemini.test.ts`: `parseJson` with clean JSON, ```json-fenced JSON,
   JSON embedded in prose, and unparseable input (assert it throws the documented error).
7. [x] Write `src/lib/file.test.ts`: `importResumeJson` with a valid full `File`, a valid
   `File` missing optional sections (assert defaults filled), invalid JSON `File`,
   non-object JSON `File`, JSON object missing `basics`, and a `FileReader` error path
   (mock `FileReader.prototype.readAsText` to trigger `onerror`).
8. [x] Run `npm run lint && npm run build && npm test` locally — all green.
9. [x] Uncomment the `npm test` line in `.github/workflows/ci.yml`.
10. [x] Confirm `npm test` is red-then-green at least once during development (e.g. a
    deliberately wrong assertion) to prove the harness actually fails on failure —
    record the observation in review.md, don't leave the deliberate failure in the diff.

## Risk register
| Risk / landmine | Mitigation |
|-----------------|------------|
| Zustand `persist` middleware reads `localStorage` at module import time; test isolation could leak state between test files | jsdom provides `localStorage`; call the store's own `reset()` action in a `beforeEach` rather than clearing localStorage directly, so tests exercise the real reset path |
| `crypto.randomUUID()` availability in the jsdom/node test environment | Node needed for Vitest is already ≥19 per repo tooling; verify in CI node-version matrix (currently unpinned — check `actions/setup-node` version in ci.yml, set to Node 22 to match) |
| Exporting `parseJson` slightly widens `gemini.ts`'s public surface | Acceptable — it's a pure function with no side effects; note in review.md as an intentional minor scope addition, not a deviation requiring re-approval |
| oxlint strict rules (`noUnusedLocals` etc. from tsconfig, not oxlint itself) could flag test helper variables | Write tests without unused locals; this is normal test hygiene, not a config workaround |

## Test plan
- Unit: the three suites above (store, `parseJson`, `importResumeJson`) — see Steps 5-7 for exact case list, which is the spec's full acceptance-criteria set.
- Integration/UI: none in this pass (RTL installed but unused — F-002+ can add component tests).
- Manual verification script (for review stage): run `npm test` and confirm all cases pass;
  run `npm run build` to confirm the new deps/config don't break the production bundle;
  temporarily break one assertion to confirm `npm test` exits non-zero (proves the CI gate works), then revert.

## Deviations
*(filled during build)*
