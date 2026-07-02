---
description: "Pipeline stage 4: code review + acceptance-criteria verification"
argument-hint: "F-NNN"
---

Run pipeline stage 4 (REVIEW) for feature $ARGUMENTS per docs/pipeline/PIPELINE.md.

1. Confirm you are on branch `feature/$ARGUMENTS-<slug>` with status `in-review`.
2. Run /code-review at high effort on the branch diff. Fix every CONFIRMED finding
   (or record an explicit human waiver in review.md).
3. Verification pass: run the app (npm run dev in source_code/) and walk the spec's
   acceptance criteria one by one — check each off in spec.md only when observed working.
   Criteria marked "manual verification" get their script executed and results recorded.
4. Confirm test coverage matches the spec's "Test expectations"; lint/build/test all green.
5. Append a timestamped report to docs/features/$ARGUMENTS-<slug>/review.md:
   findings + resolutions, criteria results, test summary.
6. Tell the user to run /pipeline-finalize $ARGUMENTS for the cross-model gate.
