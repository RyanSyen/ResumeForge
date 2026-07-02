# Resume Builder ("ResumeForge")

Client-only Vite + React 19 + TypeScript SPA. No backend, no auth, no router —
localStorage persistence, BYO-key Gemini AI. See ADR-001 for why (SSOT docs describe a
future Next.js/Supabase stack — that is aspirational, NOT current architecture).

## Layout
- `source_code/` — the app (all npm commands run here)
- `docs/pipeline/PIPELINE.md` — the development pipeline; all feature work follows it
- `docs/features/` — feature backlog, specs, plans (the pipeline's task queue)
- `docs/Living Product Map & Feature Inventory.md` — **accurate** system description;
  §3 lists tech-debt landmines every plan must check against
- `docs/decisions/` — ADRs

## Commands (run in source_code/)
```bash
npm run dev      # Vite dev server
npm run lint     # oxlint
npm run build    # tsc -b && vite build (typecheck + bundle)
npm test         # Vitest (arrives with F-001)
```

## Pipeline commands
`/pipeline-spec F-NNN` → `/pipeline-plan` (human approves plan) → `/pipeline-build` →
`/pipeline-review` → `/pipeline-finalize` (Opus ship gate) → human merges.
Feature status lives in spec.md frontmatter, mirrored in `docs/features/BACKLOG.md` —
update both on every transition.

## Hard rules
- No code before an approved plan.md (Gate 1). No merge without the Opus SHIP verdict (Gate 2).
- New AI calls: use `x-goog-api-key` header, never the `?key=` query param.
- Any new floating/portal UI must carry `print:hidden` (print-CSS PDF export).
- `ResumeData` or persisted-store shape changes require a Zustand `migrate` version bump + test (post F-002).
- Privacy promise: user data and API key never leave the browser except direct calls to Google.
