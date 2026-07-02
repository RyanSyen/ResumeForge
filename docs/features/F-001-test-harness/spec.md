---
id: F-001
title: Test harness & pipeline safety net
status: in-review
priority: P0
source: Pipeline prerequisite (PIPELINE.md stage 4) + Living Product Map §3 debt item 8
depends_on: []
---

# F-001 — Test Harness & Pipeline Safety Net

## User story
As the development pipeline, I need an automated test harness so that every feature's
review stage can enforce "no test, no pass" and refactors don't silently break the
highest-risk untested code paths.

## Current state
Zero tests of any kind (`Living Product Map` §3.8). Highest-risk untested areas:
- Zustand store mutations in `source_code/src/store/resume.ts` (move/add/remove/toggle)
- Gemini JSON parsing fallback `parseJson()` brace-slicing in `source_code/src/lib/gemini.ts`
- JSON import merge/validation in `source_code/src/lib/file.ts`

## Scope
- In: Vitest + React Testing Library + jsdom wired into `source_code`; `npm test` script;
  CI test job enabled in `.github/workflows/ci.yml`; seed tests covering the three
  high-risk areas above (store mutations, `parseJson`, import merge).
- Out: E2E/browser tests (Playwright — later), visual regression, coverage thresholds.

## Acceptance criteria
1. [x] `npm test` runs Vitest and passes locally (27/27). CI pass pending push — verify at review stage.
2. [x] Store mutation tests: add/update/remove/move item, move section, toggle hidden,
       reset — each asserts resulting `ResumeData` shape and bounds behavior (no-op at edges).
3. [x] `parseJson` tests: clean JSON, fenced JSON (```json), JSON embedded in prose,
       and unparseable input (error path).
4. [x] Import tests: valid file, file missing optional sections (defaults applied),
       non-object / missing `basics` (rejected with error).
5. [x] CI fails when any test fails — verified locally by deliberately breaking an
       assertion (`gemini.test.ts`, reverted); CI-side confirmation pending push.

## Constraints & landmines
- Do not refactor production code to make it testable in this feature — test what exists;
  refactors belong to F-002.
- `crypto.randomUUID()` is used in stores — jsdom/node ≥19 provides it; polyfill only if CI node lacks it.

## Test expectations
This feature *is* the tests. Review verifies the seed suites meaningfully assert behavior
(not snapshot-only) and CI wiring works by demonstrating a deliberate red run.
