---
id: F-003
title: Multi-page support & reliable PDF export
status: in-review
priority: P1
source: Must-Have Core MVP Features §Reliable export, §Live visual preview
depends_on: [F-001]
---

# F-003 — Multi-Page Support & Reliable PDF Export

## User story
As a user with more than one page of experience, I want the preview to show real page
boundaries and the exported PDF to break pages cleanly so that what I send to employers
matches exactly what I saw.

## Current state
- Preview is a single fixed `210mm × min-height 297mm` page; content overflows page 1
  silently with no pagination (`source_code/src/components/preview/Preview.tsx`).
- Export is a print-CSS hack: `body * { visibility: hidden }` + absolute positioning of
  `#resume-page` (`source_code/src/index.css`) — fragile, and multi-page content gets
  cut or mis-positioned (§3.2).

## Scope
- In: visual page-break indicators in the preview; CSS `break-inside: avoid` on section
  and item boundaries so print pagination never splits a bullet/heading from its context;
  page count indicator; print CSS made robust for N pages across the 3 templates.
- Out: switching to a PDF library (html2pdf/react-pdf) — only if print CSS is proven
  unable to meet the criteria, and that decision escalates to the human at plan stage;
  per-template page-break customization; headers/footers/page numbers on the PDF.

## Acceptance criteria
1. [ ] A resume with 2+ pages of content shows a page-break line and "Page N of M" in the preview.
2. [ ] Printed/exported PDF of a 2-page resume: no section heading orphaned at a page bottom, no item card split mid-bullet, in all 3 templates.
3. [ ] 1-page resumes export pixel-identical to current behavior (no regression).
4. [ ] Preview zoom does not affect pagination or export output.

## Constraints & landmines
- Print CSS block (§3.2): any new floating UI (page indicators) must carry `print:hidden`.
- CSS `zoom` is non-standard and behaves differently in Firefox — pagination math must not
  depend on rendered zoomed heights.
- Templates share section components — break rules should live once, not per template.

## Test expectations
Unit tests for the pagination measurement logic. Manual verification script covering
Chrome + Edge print output for sample resumes at 1, 2, and 3 pages in all templates
(record in review.md — print output can't be asserted in jsdom).
