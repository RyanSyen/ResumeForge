# Development Pipeline — Requirements to Production

*Owner: Ryan · Established: 2026-07-02 · Status: v1*

Stage-gated pipeline that transforms product requirements into shipped features.
Each feature moves through the stages below; agents do the work, humans hold the two gates.

## Stage Overview

```
Requirements (docs/*.md, SSOT)
      │
      ▼
[1] SPEC ──────── /pipeline-spec F-xxx      → docs/features/F-xxx/spec.md
      │
      ▼
[2] PLAN ──────── /pipeline-plan F-xxx      → docs/features/F-xxx/plan.md
      │                                        (Explore agent + Plan agent)
      ▼
 ◆ GATE 1: Human approves plan.md
      │
      ▼
[3] BUILD ─────── /pipeline-build F-xxx     → feature/F-xxx branch (worktree)
      │                                        (Implementation agent)
      ▼
[4] REVIEW ────── /pipeline-review F-xxx    → findings fixed, tests green
      │                                        (/code-review + verify agent)
      ▼
[5] FINALIZE ──── /pipeline-finalize F-xxx  → SHIP / NO-SHIP verdict
      │                                        (cross-model review: Opus)
      ▼
 ◆ GATE 2: Human merges to main
      │
      ▼
[6] SHIP ──────── PR → CI green → merge → deploy (/ship once GitHub remote exists)
```

## Stage Contracts

### 1. SPEC — requirement → feature spec
- **Input:** a backlog entry in `docs/features/BACKLOG.md` + source requirement docs.
- **Agent:** main session (with Explore agent for codebase gap analysis).
- **Output:** `docs/features/F-xxx-<slug>/spec.md` following `docs/features/_templates/spec-template.md`.
- **Done when:** acceptance criteria are testable, out-of-scope is explicit, dependencies listed.

### 2. PLAN — spec → implementation plan
- **Input:** approved `spec.md`.
- **Agents:** `Explore` (map every file the change touches, read constraints in
  `docs/Living Product Map & Feature Inventory.md` §3) then `Plan` (step-by-step design).
- **Output:** `plan.md` in the feature folder: ordered steps, files-to-change table,
  risk register (which tech-debt landmines it walks near), and a test plan.
- **Gate 1:** human reviews and approves the plan. No code before approval.

### 3. BUILD — plan → code
- **Agent:** implementation agent in an isolated git worktree, branch `feature/F-xxx-<slug>`.
- **Rules:** follow the approved plan; conventional commits; deviations from plan must be
  recorded in `plan.md` under "## Deviations" with the why.
- **Done when:** all plan steps checked off, lint + typecheck + build + tests pass locally.

### 4. REVIEW — code → verified code
- **Agents:** `/code-review` (bug hunt on the diff) + a verify pass that runs the app
  and walks the spec's acceptance criteria one by one.
- **Rules:** every CONFIRMED finding is fixed or explicitly waived by the human.
  New/changed behavior needs tests (Vitest) — no test, no pass.

### 5. FINALIZE — cross-model ship gate
- **Agent:** a **different model (Opus)** reviews the full branch diff against `spec.md`
  acceptance criteria and `plan.md`, with fresh context (no implementation history).
- **Output:** verdict appended to the feature's `review.md`: `SHIP` or `NO-SHIP` with
  itemized blockers. NO-SHIP loops back to stage 3/4 with the blocker list.

### 6. SHIP — merge & deploy
- PR to `main`, CI must be green (`.github/workflows/ci.yml`: lint, typecheck+build, tests).
- Human merges (Gate 2). Deploy via `/ship` workflow (pending GitHub remote + hosting).

## Feature Status Lifecycle

`proposed → specced → planned → building → in-review → ship-approved → done`

Status lives in the frontmatter of each feature's `spec.md` and is mirrored in
`docs/features/BACKLOG.md`. Update both at every stage transition.

## Conventions

- Feature IDs: `F-NNN` (zero-padded, never reused). Folder: `docs/features/F-NNN-<slug>/`.
- One feature = one branch = one PR. Keep features small enough to review in one sitting.
- Branch names: `feature/F-NNN-<slug>`; commits: Conventional Commits.
- All agent outputs are files in the feature folder — the pipeline state must be
  reconstructable from the repo alone (no state trapped in chat history).
- Session reports (review findings, verification runs) are timestamped inside `review.md`.
