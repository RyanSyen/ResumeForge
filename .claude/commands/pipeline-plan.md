---
description: "Pipeline stage 2: explore + plan agents produce an implementation plan for approval"
argument-hint: "F-NNN"
---

Run pipeline stage 2 (PLAN) for feature $ARGUMENTS per docs/pipeline/PIPELINE.md.

1. Read the feature's spec.md. If status is not `specced`, stop and say why.
2. Launch an Explore agent (thorough): map every file the change touches, existing
   patterns to follow, and which tech-debt landmines from
   docs/Living Product Map & Feature Inventory.md §3 are in the blast radius.
3. Launch a Plan agent with the spec + exploration findings: produce ordered steps,
   files-to-change table, risk register, and a test plan.
4. Write docs/features/$ARGUMENTS-<slug>/plan.md following
   docs/features/_templates/plan-template.md. Set spec status to `planned`; mirror in BACKLOG.md.
5. GATE 1: present the plan to the user for approval. Do NOT write any code.
   Record approval (who/when) in plan.md when granted.
