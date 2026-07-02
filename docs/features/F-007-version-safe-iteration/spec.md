---
id: F-007
title: Version-safe iteration (undo, duplicate, snapshots)
status: proposed
priority: P2
source: Must-Have Core MVP Features §Version-safe iteration workflows
depends_on: [F-002]
---

# F-007 — Version-Safe Iteration (stub)

Undo/redo for editor actions, "duplicate resume" for tailoring variants, and named
local snapshots — so users can experiment (especially with AI apply) without losing
a stable version. Currently there is **no undo** and `reset()` is destructive behind
a native `confirm()`.

*Stub — run `/pipeline-spec F-007` to produce the full spec when it reaches the front
of the queue. Key open question: single-resume + snapshots vs. a multi-resume library
(the latter drifts toward the SSOT Phase 2 "Resume Library" and may deserve its own feature).*
