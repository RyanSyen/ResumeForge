---
description: "Pipeline stage 1: produce or refine a feature spec from the backlog"
argument-hint: "F-NNN"
---

Run pipeline stage 1 (SPEC) for feature $ARGUMENTS per docs/pipeline/PIPELINE.md.

1. Read docs/features/BACKLOG.md, the feature's folder (if it exists), the source
   requirement docs it cites, and docs/Living Product Map & Feature Inventory.md.
2. Use an Explore agent to verify the "Current state" claims against the actual code —
   never spec against stale assumptions.
3. Write/update docs/features/$ARGUMENTS-<slug>/spec.md following
   docs/features/_templates/spec-template.md. Acceptance criteria must be independently
   verifiable; Out-of-scope must be explicit enough to stop agent scope creep.
4. Set status to `specced` in the spec frontmatter and mirror it in BACKLOG.md.
5. Present the spec summary and any open product questions to the user.
