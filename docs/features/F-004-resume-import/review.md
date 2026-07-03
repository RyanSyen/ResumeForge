# F-004 — Review Log

## Stage 4 review — 2026-07-03

### Code review (high effort, full branch diff)

Reviewed `git diff main...feature/F-004-resume-import` (26 files, ~1400 insertions —
excludes `package-lock.json` and binary fixtures from close reading). Checked
security/perf/correctness/maintainability plus the project's hard rules (new AI calls
use `x-goog-api-key` not `?key=`, `print:hidden` on new floating UI, privacy promise
that file content never leaves the browser except direct Gemini calls).

| # | File | Finding | Severity | Resolution |
|---|------|---------|----------|------------|
| 1 | `src/components/ImportDialog.tsx` (`handleFile`) | Stale-response race: the dialog stays mounted (`App.tsx` renders it unconditionally) while `close()`/`reset()` reset local state immediately. If a user closes the dialog mid-`loading` (X button or backdrop click) and reopens it to pick a *different* file, the abandoned first request could resolve after the second one, silently overwriting the current preview/failure state with stale data — undermining AC3's preview-before-apply safety net. | Medium (correctness — undermines a core acceptance-criteria guarantee) | **Fixed** — added a `requestIdRef` counter incremented on every `reset()`/`handleFile()` call; the async continuation checks `requestId !== requestIdRef.current` before applying its result and bails silently if stale. Regression test added: `ImportDialog.test.tsx` — "ignores a stale response from an abandoned request after the dialog is closed and reopened". |
| 2 | `src/lib/extract/docx.ts` | A malformed/non-zip DOCX upload propagated `mammoth`'s raw internal JSZip error verbatim to the user — e.g. `"Can't find end of central directory : is this a zip file ? ... see https://stuk.github.io/jszip/..."` — confirmed by direct reproduction. This violates AC5 ("useful error") and the friendly-message convention every other error path in this feature (and `gemini.ts`'s `parseErrorResponse`) follows. | Medium (UX / spec compliance) | **Fixed** — wrapped `mammoth.extractRawText` in a try/catch that normalizes any thrown error to `"This file doesn't look like a valid DOCX. Try re-saving it from Word and uploading again."` Re-verified in a real browser: garbage `.docx` upload now shows the friendly message, not the JSZip internals. New fixture `fixtures/empty-resume.docx` (valid zip, empty body) added so the "no extractable text" path is tested separately from the "not a valid file" path — the old test conflated the two under a misleading name. |

No other CONFIRMED findings. Specifically checked and found no issues:
- **Auth pattern**: `importResume`'s Gemini call uses the `x-goog-api-key` header
  (verified against the real Google endpoint in the browser — a real 400 response with
  header auth, not `?key=`); existing `?key=` calls are untouched, as the plan
  specified (migration is an explicit follow-up, not in scope).
- **XSS**: extracted/parsed text is rendered via JSX text interpolation and a
  controlled `<textarea value={...}>` — no `dangerouslySetInnerHTML`, no injection
  vector introduced.
- **Secrets**: no API keys or other secrets committed; fixtures are synthetic sample
  resumes with no real PII.
- **`withDefaults()`** (`gemini.ts`): reviewed for aliasing risk — returns the shared
  `IMPORT_SCHEMA_TEMPLATE` object by reference when a whole sub-object/array is
  missing from Gemini's response. Traced through `parseResumeData`'s zod schema
  (`.transform((b) => ({ ...emptyResume().basics, ...b }))` etc.) — zod's `.parse()`
  spreads into new objects rather than mutating input, so no aliasing leaks into the
  `ResumeData` returned to callers. Not flagged as a finding; noted here for the
  record since it was investigated.
- **`print:hidden`**: present on `ImportDialog`'s root (`fixed inset-0 z-50 ... print:hidden`),
  matching `SettingsDialog`'s pattern; verified present via `ImportDialog.test.tsx`'s
  "dialog root carries print:hidden" test and confirmed in a real browser inspection.
- **No `ResumeData`/persisted-store shape changes** — F-004 only ever calls the
  existing `setResume()` with a `parseResumeData()`-validated object; no `migrate`
  version bump needed.

### Verification pass

Ran `npm run dev` in `source_code/` via the project's preview tooling and drove the
live app with `preview_eval`/`preview_click`/`preview_snapshot`, injecting the real
PDF/DOCX fixture bytes into the actual file input via a `DataTransfer`-constructed
`File` + dispatched `change` event (browser automation can't drive a native OS
file-chooser dialog, so this exercises the app's real code path from that point
onward, unmodified).

| AC | Result | Evidence |
|----|--------|----------|
| 1. Typical single-column PDF imports into correctly populated sections | **NOT RUN** | No Gemini API key available in this environment. User explicitly chose to skip real-key verification (2026-07-03, recorded in `plan.md` Deviations) rather than share a key insecurely. Everything *except* Gemini's actual output quality is verified: extraction produces the exact fixture text in a real browser: `parseJson`/`parseResumeData`/`withDefaults` correctly structure and repair a realistic mocked response (`gemini.test.ts`). **Needs a human with a real key to run before Gate 2.** |
| 2. DOCX of the same resume produces an equivalent result | **NOT RUN** | Same reason as AC1. DOCX extraction itself is confirmed working end-to-end in a real browser (mammoth's browser-field resolution under Vite, verified). |
| 3. Preview-before-apply; cancel leaves state untouched | **PASS** | `ImportDialog.test.tsx`: preview summary renders before any store mutation; cancel leaves `useResume` state `toEqual` its pre-dialog value; confirm calls `setResume` exactly once with the parsed data. Real-browser UI structure (preview/cancel/apply buttons, summary layout) visually confirmed present and correctly gated by `stage`. |
| 4. All imported items pass F-002 schema validation, valid `id`s | **PASS** | `gemini.test.ts`: a mocked Gemini response with an experience item missing `id` is repaired to a valid, non-empty, unique id via the same `parseResumeData()` JSON import uses. A wrong-typed field (`skills` as a string) is correctly rejected, not silently coerced — confirms `withDefaults()` only fills genuine absence, not malformed data. |
| 5. Extraction/AI failure shows useful error + raw text; no partial state written | **PASS** | Real browser: both a genuine PDF extraction → real (rejected) Gemini call and a malformed-DOCX extraction failure show the friendly error correctly (see code-review finding #2 above, now fixed and re-verified). `import.ts`/`ImportDialog.test.tsx` confirm `useResume` is never touched except by the single explicit `apply()` call — extraction failures carry no raw text (nothing to show), AI-parsing failures do. |
| 6. No key configured → routed to Settings | **PASS** | Real browser: clearing the API key and reopening "Import resume" shows the key-required gate with **no file input rendered at all** — extraction is never attempted. `ImportDialog.test.tsx` confirms `importResumeFile` is never called in this state. |

Also confirmed: no new console errors/warnings at any point in the browser session
(checked after every interaction); the pdfjs worker asset (`pdf.worker-*.mjs`) loads
correctly under Vite in a real browser — this was **not** a given, see `plan.md`
Deviations for a real bug this same verification pass caught and required a second
fix for (an unconfigured `workerSrc` throws synchronously in real browsers, unlike in
jsdom, where `pdfjs-dist`'s `isNodeJS` check masks the issue).

### Test coverage vs. spec's "Test expectations"

Spec requires: unit tests for extraction-to-prompt assembly, response
validation/repair path, cancel/failure paths; at least one real PDF and DOCX fixture
parsed in CI (extraction layer only, Gemini mocked).

- `src/lib/extract/pdf.test.ts`, `docx.test.ts` — real fixture parsed end-to-end
  (`sample-resume.pdf`/`.docx`), plus empty-content and invalid-file error paths
  (`empty-resume.docx` added this stage for the "no extractable text" case
  specifically, separate from "not a valid file").
- `src/lib/extract/index.test.ts` — MIME/extension dispatch, unsupported-type
  rejection (extractors mocked).
- `src/lib/gemini.test.ts` — `importResume` prompt assembly (extracted text +
  no-invention instructions present), header-auth confirmation (`x-goog-api-key`, not
  `?key=`), response repair (missing ids), response rejection (wrong-typed field),
  unparseable response, missing-key routing.
- `src/lib/import.test.ts` — orchestration success path, extraction-failure tagging
  (no raw text), parsing-failure tagging (raw text retained), and a structural check
  that the orchestration module never imports the resume store.
- `src/components/ImportDialog.test.tsx` (10 tests) — no-key gate, preview rendering,
  cancel/confirm mutation behavior, failure-state raw-text rendering,
  `print:hidden` presence, and the new stale-response regression test.

`npm run lint && npm run build && npm test` — all green: **103 tests, 13 files**;
`tsc -b` clean; lint has only pre-existing-pattern warnings (`AiPanel.tsx` and now
`ImportDialog.tsx`, both for the same "fast-refresh + exported constants" rule, no
errors). Bundle check unchanged from build stage: `pdfjs-dist`/`mammoth` remain in
their own dynamically-imported chunks, not the main bundle.

### Residual risk carried to Gate 2

AC1/AC2 (real Gemini output quality for a typical resume) are unverified by design —
a deliberate, recorded trade-off to avoid handling a live API key insecurely in this
session. Everything downstream of a Gemini response is verified via realistic mocked
responses matching the exact schema `importResume` produces. A human with a real
Gemini key should exercise the flow once before merge; if AC1/AC2 fail, the fix is
almost certainly a prompt-quality iteration in `gemini.ts`'s `importResume`, not a
change to the surrounding extraction/validation/UI code reviewed here.

## Final gate (Opus) — 2026-07-03

*Cross-model review per `docs/pipeline/PIPELINE.md` stage 5. Fresh Opus session, given
only the branch diff (`git diff main...feature/F-004-resume-import`), `spec.md`,
`plan.md`, and `docs/Living Product Map & Feature Inventory.md` §3 — no implementation
history, no access to this review's own findings above.*

### Verdict: **SHIP**

> The diff is a clean, well-scoped implementation that satisfies every
> code-verifiable acceptance criterion, respects the out-of-scope list, steps on none
> of the §3 landmines, and introduces no regressions. Build, lint, and the full test
> suite (103 tests, 13 files) pass on the branch. The only unresolved items are the
> two AI-output-quality criteria (AC1/AC2), which are structurally correct but require
> a live Gemini key to confirm — this is documented honestly in the spec, plan
> Deviations, and AC checkboxes, not hidden.

**Acceptance criteria**: AC3–AC6 assessed **Pass** with specific file/line evidence
cited (`ImportDialog.tsx`, `import.ts`, `gemini.test.ts`, `ImportDialog.test.tsx`).
AC1/AC2 assessed **"structurally correct; runtime-unverified"** — explicitly not
scored as a false pass, matching this review's own AC table above.

**Landmine compliance (§3)**: §3.1 (`?key=` query-param) correctly avoided —
`x-goog-api-key` header confirmed via test assertion on the actual fetch call args;
existing `?key=` calls correctly left untouched per the spec's migration-is-a-follow-up
constraint. §3.2 (print-CSS) — `print:hidden` present on `ImportDialog`'s root. §3.3
(shallow import validation) — F-004's path is stricter than existing JSON import, not
weaker. No persisted-shape change, no migration bump needed.

**Scope discipline**: no creep — no OCR, no LinkedIn import, no merge-into-existing;
image-only PDFs correctly surface as an extraction failure rather than being silently
guessed at.

**Notable observations for the human merger** (non-blocking):
1. AC1/AC2 output quality genuinely unverified — run one real PDF + one real DOCX
   through preview→apply with a live key before relying on this in production.
2. `tsconfig.vitest.json` and `withDefaults()` (both out-of-plan additions) reviewed
   independently and found sound.
3. The `pdf.ts` `typeof Worker !== 'undefined'` guard is subtle — unit tests don't
   exercise the real-browser worker branch (jsdom masks the bug this guard fixes); a
   `pdfjs-dist` version bump should get a real-browser PDF-import smoke test, not just
   `npm test`.
4. `ImportDialog.tsx`'s lint warning (`react(only-export-components)`) matches an
   already-accepted pattern on `AiPanel.tsx` — same character, not new debt.

No blockers. Approved to merge.
