# Feature Backlog — MVP

*Derived from `docs/Must-Have Core MVP Features.md`, gap-analyzed against
`docs/Living Product Map & Feature Inventory.md` (what the SPA already ships).
Direction (decided 2026-07-02, see ADR-001): evolve the current client-only SPA;
backend features are a later milestone.*

## Already shipped (no feature needed)

| MVP requirement | Shipped as |
|---|---|
| Resume creation & editing (standard sections) | Content editor — all 7 standard sections, reorder/hide/delete |
| Live visual preview | Live A4 preview, 3 templates, accent colors, zoom |
| AI-assisted improvement (reviewable) | Inline AI assist + AI Tailor tab, apply/discard flow |
| Structured resume data model | `ResumeData` type + Zustand stores + JSON import/export |

## Active backlog (priority order)

| ID | Feature | Priority | Status | Depends on |
|----|---------|----------|--------|------------|
| F-001 | Test harness & pipeline safety net | P0 | done | — |
| F-002 | Data model hardening (schema validation + persist versioning) | P0 | building | F-001 |
| F-003 | Multi-page support & reliable PDF export | P1 | specced | F-001 |
| F-004 | Resume import (PDF/DOCX → structured data) | P1 | specced | F-002 |
| F-005 | Custom sections | P1 | specced | F-002 |
| F-006 | Presentation controls (typography, spacing, page format) | P1 | specced | F-003 |
| F-007 | Version-safe iteration (undo, duplicate, snapshots) | P2 | proposed | F-002 |
| F-008 | Public sharing with privacy controls | P2 | proposed | backend milestone |

### Priority rationale
- **F-001 first:** the codebase has zero tests; the pipeline's review stage requires
  a harness to enforce "no test, no pass". Everything else builds on it.
- **F-002 second:** every remaining feature mutates `ResumeData` or localStorage shape;
  without schema versioning/migration, each of them risks corrupting existing user data.
- **F-003/F-004:** export reliability and import are the two biggest user-facing gaps
  in the must-have list (formatting trust + onboarding speed).
- **F-008 deferred:** requires a backend (hosting, links, passwords) — first feature of
  the post-MVP backend milestone, spec kept as a stub until then.
