---
description: "Pipeline stage 3: implement the approved plan on a feature branch"
argument-hint: "F-NNN"
---

Run pipeline stage 3 (BUILD) for feature $ARGUMENTS per docs/pipeline/PIPELINE.md.

1. Read spec.md and plan.md. If the plan is not marked approved, stop — Gate 1 first.
2. Create branch `feature/$ARGUMENTS-<slug>` (use a worktree via EnterWorktree if other
   work is in flight on the current checkout). Set spec status to `building`; mirror in BACKLOG.md.
3. Implement the plan steps in order, checking each off in plan.md as completed.
   Conventional Commits per coherent unit of work. Any departure from the plan goes in
   plan.md "## Deviations" with the why — never silently.
4. Write the tests the spec's "Test expectations" demands alongside the code.
5. Done when: all steps checked, `npm run lint`, `npm run build`, and `npm test` pass in
   source_code/. Then set status to `in-review` and tell the user to run /pipeline-review $ARGUMENTS.
