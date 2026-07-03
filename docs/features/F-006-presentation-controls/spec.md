---
id: F-006
title: Presentation controls (typography, spacing, page format)
status: in-review
priority: P1
source: Must-Have Core MVP Features §Templates and presentation controls
depends_on: [F-003]
---

# F-006 — Presentation Controls

## User story
As a user, I want to adjust fonts, sizing, spacing, and page format so that I can fit
my content well and match the visual style to the role I'm applying for.

## Current state
Only template choice (3) and accent color (6 swatches) exist
(`source_code/src/store/settings.ts`, `Toolbar.tsx`). Typography, spacing, and page
format are hard-coded per template in `templates.tsx`.

## Scope
- In: a "Design" control panel with — font family (curated list of ~6 system/Google fonts),
  base font size (S/M/L or pt range), line height, section spacing (compact/normal/relaxed),
  page margins, page format (A4/US Letter); settings persist per the settings store
  (migration bump); all controls apply live to preview and export across all 3 templates.
- Out: arbitrary font upload, per-section overrides, custom color palettes beyond accent,
  a full theming/token system (SSOT "structured customization system" is post-MVP).

## Acceptance criteria
1. [ ] Every control updates the live preview immediately and survives reload.
2. [ ] Exported PDF reflects all controls exactly (including US Letter page size via dynamic `@page`).
3. [ ] Google fonts load with sensible fallbacks; export works offline with system-font fallback.
4. [ ] Switching templates preserves the user's design settings.
5. [ ] Reset-to-defaults control exists per the design panel.

## Constraints & landmines
- Page format interacts with F-003 pagination math and the `@page { size: A4 }` rule —
  size must become dynamic; this is why F-006 depends on F-003.
- Settings store shape change ⇒ `migrate` bump (F-002 pattern).
- Templates hard-code Tailwind classes — plan should introduce CSS variables driven by
  settings rather than conditional class explosions.

## Test expectations
Unit tests for settings store migration and the settings→CSS-variable mapping.
Manual verification script for export fidelity per format/font combination.
