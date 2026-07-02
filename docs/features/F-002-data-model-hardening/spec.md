---
id: F-002
title: Data model hardening — schema validation + persist versioning
status: building
priority: P0
source: Must-Have Core MVP Features §Structured resume data model; Living Product Map §3 debt items 3, 9
depends_on: [F-001]
---

# F-002 — Data Model Hardening

## User story
As a user, I want my resume data to survive app updates and malformed imports so that
I never lose work to a schema change or a bad JSON file.

## Current state
- JSON import validation is shallow — only `basics` presence checked
  (`source_code/src/lib/file.ts`); `experience: [{}]` (no `id`) imports and breaks
  keying, move/remove, and AI tailoring id-matching.
- None of the three persisted Zustand stores declare `version`/`migrate`
  (`source_code/src/store/resume.ts`, `settings.ts`, `useAi` in `AiPanel.tsx`) —
  any `ResumeData` shape change hydrates stale localStorage unchecked.

## Scope
- In: runtime schema validation (Zod) for `ResumeData` used by JSON import and store
  hydration; missing item `id`s repaired via `newId()`; unknown keys stripped;
  `version` + `migrate` on all three persisted stores; import errors surfaced with
  a specific reason (still native alert for now — UI polish is out).
- Out: changing the `ResumeData` shape itself; new UI; migrating the `useAi` store
  out of `AiPanel.tsx` (do it only if adding `version` there forces it).

## Acceptance criteria
1. [x] Importing JSON with items missing `id`s succeeds and every item ends up with a valid unique id.
2. [x] Importing JSON with wrong-typed fields (e.g. `skills: "foo"`) is rejected with a specific error message, resume state untouched.
3. [x] All three persisted stores have `version: 1` and a `migrate` function; hydrating a pre-version payload yields a valid current-shape state.
4. [x] Round-trip: export → import produces deep-equal `ResumeData`.
5. [x] Existing users' localStorage (current shape, no version key) hydrates without data loss.

## Constraints & landmines
- "Applied" detection in `AiPanel.tsx` is value-equality — validation must not normalize/reorder
  summary strings or highlight arrays, or Applied indicators break (§3.5).
- Zod adds a dependency — keep it out of the render path; validate at boundaries only
  (import, hydration), not per keystroke.

## Test expectations
Unit tests for the schema (valid/invalid/repairable payloads), migration from versionless
storage, and the export→import round-trip. Extend F-001's import suite rather than duplicating.
