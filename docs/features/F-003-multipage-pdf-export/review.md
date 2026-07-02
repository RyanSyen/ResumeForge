# F-003 — Review Log

## Stage 4 review — 2026-07-03

### Code review (high effort, full branch diff)

Reviewed `git diff main...feature/F-003-multipage-pdf-export` (11 files, ~294
insertions). Checked security/perf/correctness/maintainability plus the project's
hard rules (`print:hidden` on new floating UI, no `ResumeData`/persisted-store shape
changes, shared-component break rules applied once).

| # | File | Finding | Severity | Resolution |
|---|------|---------|----------|------------|
| 1 | `src/lib/pagination.ts:7-9` | JSDoc on `normalizeHeight` claimed CSS `zoom` scales both `getBoundingClientRect()` and `scrollHeight`. Build-stage investigation had already found `scrollHeight` is zoom-*invariant* in this Chromium build (only `getBoundingClientRect()` scales) — the comment contradicted the codebase's own verified finding and the code, which measures via `getBoundingClientRect()` only. | Low (docs accuracy) | **Fixed** — comment corrected to state the verified behavior and why `getBoundingClientRect()` was chosen over `scrollHeight`. Commit `a1c9353`. |

No other findings. No CONFIRMED correctness, security, or performance issues in the
diff. `print:hidden` is present on both new floating elements (page badge, break-line
overlays). Break-control classes applied once in the six shared body components +
three template-level section wrappers (14 elements on the sample resume — matches:
7 section wrappers + 7 items), not duplicated per template. No store/persisted-shape
changes, so no Zustand `migrate` bump needed.

### Verification pass

Ran `npm run dev` in `source_code/` via the project's preview tooling and drove the
live app with `preview_eval`/`preview_click`/`preview_snapshot`.

**Environment note:** this session's preview browser tab was not pumping render
frames — confirmed directly: `requestAnimationFrame` callbacks and
`preview_screenshot` never resolved (30s timeout), on a freshly started server too, so
it's not a one-off. This blocks anything gated on the browser's render/paint loop:
native `ResizeObserver` delivery, and (separately, unrelated to this app) actual print
rendering. It does **not** block synchronous DOM reads (`getBoundingClientRect`,
`getComputedStyle`, stylesheet inspection) or React state updates from click events,
which all worked normally — so click-driven verification below is real, not
simulated.

**Workaround used:** `usePageCount`'s effect depends on `[pageRef, zoom]`, so clicking
a zoom button forces a synchronous re-run of `measure()` (not gated on the blocked
`ResizeObserver` delivery path) using whatever the real DOM layout is at that instant.
Injecting extra height into `#resume-page` via direct DOM manipulation, then clicking
zoom in/out, exercises the exact same `getBoundingClientRect()` → `normalizeHeight` →
`computePageCount`/`computePageBreakOffsets` pipeline the app uses in normal operation
(only the *trigger* — click vs. ResizeObserver — differs; a real user's content edits
trigger it via ResizeObserver in a normal, rendering browser).

| AC | Result | Evidence |
|----|--------|----------|
| 1. 2+ page resume shows a page-break line and "Page N of M" | **PASS** | Forced 3-page content height; badge read exactly `"Page 1 of 3"`; exactly 2 break-line elements at `top: 1122.52px` and `top: 2245.04px` — precisely 1× and 2× `PAGE_HEIGHT_PX` (1122.5196...). |
| 2. Print/export: no orphaned heading, no split item card, all 3 templates | **NOT RUN** | Requires an actual print engine (Ctrl+P / print-to-PDF); this session's tab cannot render/print. **Needs a human to run this in a real Chrome + Edge window before Gate 2** — script below. |
| 3. 1-page resumes export pixel-identical (no regression) | **NOT RUN (print half)**; preview-side regression check passed | Removed the forced multi-page content, re-triggered measurement — badge correctly disappeared (`badgePresent: false`), matching pre-F-003 single-page preview behavior. Print-output pixel comparison still needs the same real-browser pass as AC2. |
| 4. Preview zoom doesn't affect pagination/export | **PASS (preview half)**; export half not run | Clicked zoom in (0.85→1.05) then zoom out ×2 (1.05→0.85) with the same forced 3-page content: page count stayed `3` and break-line offsets stayed exactly `1122.52px`/`2245.04px` throughout — the offsets are stored/compared in unscaled px and only visually rescale via the browser's own `zoom` rendering, never recomputed from a zoomed reading. Export-output zoom-independence (trivially true since print forces `zoom: 1 !important`, unchanged by this feature) not re-confirmed via real print. |

Also confirmed: no new console errors at any point; all pre-existing UI (editor
panel, template switcher, accent colors, section reordering) unaffected — full
`preview_snapshot` after the above matches pre-change structure.

### Manual verification script (for AC2/AC3, to run in a real browser before Gate 2)

1. `npm run dev` in `source_code/`, open in Chrome.
2. Click **Sample** to load the sample resume (1 page). Ctrl+P → print preview →
   confirm output matches current production behavior (no visual regression) —
   compare against `main` if needed. Repeat in Edge.
3. In the editor, add enough experience entries/bullets to push the resume to 2 pages
   (watch for the new "Page 1 of 2" badge in the preview as a signal). Ctrl+P in
   Chrome: check no section heading sits alone at the bottom of page 1, no item
   card/bullet list is split across the page break. Repeat in Edge.
4. Repeat step 3 for a 3-page resume.
5. Repeat steps 3–4 for the **Classic** and **Compact** templates (template switcher,
   top toolbar).
6. Record pass/fail per cell (2 browsers × {1,2,3} pages × 3 templates = 18 cells) in
   a follow-up entry below this one.

### Test coverage

- `src/lib/pagination.test.ts` — 14 unit tests: `computePageCount` (0/under/exact/over
  boundary/multi-page), `computePageBreakOffsets` (1/2/3-page), `normalizeHeight`
  (zoom-independence), `computeCurrentPage` (top/mid-scroll/clamp-high/clamp-single-page).
- `src/components/preview/Preview.test.tsx` — 2 jsdom render tests (mocked
  `ResizeObserver`): no indicator for single-page content; indicator + break line with
  `print:hidden` class once content is forced multi-page.
- Matches spec's "Test expectations": unit tests for pagination measurement logic
  (done); manual verification script for print output (written above, execution
  pending human/real-browser pass).

### Lint / build / test

```
npm run lint   → clean (1 pre-existing unrelated warning: AiPanel.tsx fast-refresh)
npm run build  → tsc -b && vite build — success, no errors
npm test       → 73/73 passed (8 test files)
```

### Outstanding before Gate 2

AC2/AC3/AC4-export-half require a real-browser print pass (script above) — this is
exactly the "print output can't be asserted in jsdom" gap the spec's own Test
expectations called out, now additionally blocked by this session's non-rendering
preview tab for the *live preview* portions too (though those were separately
confirmed via the click-triggered workaround above, which reads real, unmocked DOM
layout). Recommend the human run the script before merging, or explicitly waive if
acceptable given the strength of the CSS-only approach and unit-test coverage.
