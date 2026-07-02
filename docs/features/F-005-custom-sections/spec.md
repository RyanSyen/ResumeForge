---
id: F-005
title: Custom sections
status: specced
priority: P1
source: Must-Have Core MVP Features §Resume creation and editing ("plus custom sections")
depends_on: [F-002]
---

# F-005 — Custom Sections

## User story
As a user whose background doesn't fit the 7 standard sections (publications, volunteering,
awards, talks), I want to add my own titled sections so that my resume tells my full story.

## Current state
`ResumeData` in `source_code/src/types.ts` hard-codes 7 sections; `sectionOrder`,
`hiddenSections`, the editor, and all 3 templates iterate that fixed set. No way to add
a section without a code change.

## Scope
- In: `customSections: CustomSection[]` on `ResumeData` (id, title, items with
  title/subtitle/date/description/bullets); create/rename/delete custom sections in the
  editor; custom sections participate in `sectionOrder`, hide/show, and item reordering
  exactly like built-ins; rendered by all 3 templates; included in JSON export/import,
  AI Tailor serialization (`resumeToText`), and F-002 schema + store migration (v2).
- Out: custom field schemas per section (fixed generic item shape only); custom sections
  in AI *rewrite* suggestions (serialize them for context, but bullets rewrite targets
  stay experience-only for now); drag-and-drop (keep move buttons).

## Acceptance criteria
1. [ ] User can add a custom section with a name, add/edit/reorder/delete items in it, and see it live in the preview in all 3 templates.
2. [ ] Custom sections reorder and hide/show exactly like built-in sections.
3. [ ] Export → import round-trips custom sections losslessly; store migration bumps to v2 and preserves existing data.
4. [ ] Deleting a custom section requires confirmation and removes it from `sectionOrder`/`hiddenSections` without corrupting either.
5. [ ] AI Tailor still works with custom sections present (they appear in the serialized resume context).

## Constraints & landmines
- `sectionOrder`/`hiddenSections` currently type against a union of fixed keys — the type
  change ripples through `resume.ts`, `EditorPanel.tsx`, `templates.tsx`; plan must map this fully.
- Store shape change ⇒ F-002 `migrate` bump is mandatory, with a test.
- Templates render sections via per-key conditionals today — prefer extending the shared
  section components over per-template forks.

## Test expectations
Store tests: custom section CRUD, order/hide integration, migration v1→v2.
Schema tests: round-trip with custom sections. Template smoke test: custom section renders.
