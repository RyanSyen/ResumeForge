---
id: F-004
title: Resume import (PDF/DOCX → structured data)
status: in-review
priority: P1
source: Must-Have Core MVP Features §Resume import and portability
depends_on: [F-002]
---

# F-004 — Resume Import (PDF/DOCX → Structured Data)

## User story
As a new user with an existing resume file, I want to upload it and get a pre-filled
structured draft so that I don't retype my career history to try the product.

## Current state
Only JSON import exists (`source_code/src/lib/file.ts`) — useful for backup/restore of
this app's own exports, useless for onboarding from a real-world resume.

## Scope
- In: "Import resume" accepting PDF and DOCX; client-side text extraction
  (`pdfjs-dist` for PDF, `mammoth` for DOCX — browser builds, keeps the no-backend model);
  extracted text → Gemini structured-parse call returning `ResumeData`-shaped JSON
  (reuse `parseJson` + F-002 schema validation); preview-before-apply screen
  ("Replace current resume?" with section-level summary of what was parsed);
  graceful failure path (show extracted raw text for copy/paste when parsing fails).
- Out: image/scanned-PDF OCR; LinkedIn import; merge-into-existing-resume (replace only);
  importing without a Gemini API key (feature is gated on key like other AI features).

## Acceptance criteria
1. [ ] A typical single-column text PDF resume imports into correctly populated sections (basics, experience with dates/bullets, education, skills). **NOT VERIFIED — no Gemini API key available in this environment; see review.md.**
2. [ ] A DOCX of the same resume produces an equivalent result. **NOT VERIFIED — same reason as AC1.**
3. [x] Parsed result is shown for confirmation before overwriting the current resume; cancel leaves state untouched.
4. [x] All imported items pass F-002 schema validation and carry valid `id`s.
5. [x] Extraction or AI failure shows a useful error plus the raw extracted text; no partial resume state is written.
6. [x] No key configured → routed to settings (same pattern as existing AI features).

## Constraints & landmines
- Follow the AI-call pattern of `src/lib/gemini.ts` but **do not copy the `?key=` query-param
  auth** (§3.1) — use the `x-goog-api-key` header for the new call, and migrate existing
  calls only if trivial (else note as follow-up).
- `pdfjs-dist` needs its worker configured under Vite — verify bundle impact; lazy-load
  both extractors so the main bundle doesn't grow for non-importing users.
- Privacy promise: file content goes only browser → Google, never to any app server. State this in the import UI.

## Test expectations
Unit: extraction-to-prompt assembly, response validation/repair path, cancel/failure paths.
Fixtures: at least one real PDF and DOCX fixture parsed in CI (extraction layer only;
the Gemini call is mocked).
