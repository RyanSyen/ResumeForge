---
description: "Pipeline stage 5: cross-model (Opus) ship/no-ship gate"
argument-hint: "F-NNN"
---

Run pipeline stage 5 (FINALIZE) for feature $ARGUMENTS per docs/pipeline/PIPELINE.md.

1. Confirm stage 4 completed (review.md has a passing report; all acceptance criteria checked).
2. Launch a fresh reviewer with `model: opus` via the Agent tool (general-purpose).
   Give it ONLY: the branch diff (`git diff main...HEAD`), spec.md, plan.md, and
   docs/Living Product Map & Feature Inventory.md §3. No implementation history —
   fresh eyes are the point. Its brief: verify the diff satisfies every acceptance
   criterion, respects out-of-scope, and introduces no regressions/landmine violations;
   return verdict SHIP or NO-SHIP with itemized blockers.
3. Append the verdict + blockers to review.md under a "## Final gate (Opus)" heading.
4. SHIP → set status `ship-approved`, mirror in BACKLOG.md, and hand to the user for
   Gate 2 (merge to main; PR + CI once the GitHub remote exists).
   NO-SHIP → set status back to `building`, list the blockers, and stop for user direction.
