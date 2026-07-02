# ADR-001: Evolve the client-only SPA; defer the backend

*Date: 2026-07-02 · Status: Accepted · Decider: Ryan*

## Context
The SSOT docs (both root `SSOT.md` and `docs/AI Resume Builder — SSOT.md`) specify
Next.js + Supabase + OpenAI with auth, credits, and server-side tailoring. The actual
codebase (`source_code/`) is a working client-only Vite + React 19 SPA with localStorage
persistence and BYO-key Gemini called from the browser. Several MVP features (public
sharing, credit gating) require a backend; most others do not and several already exist
in the SPA.

## Decision
Build the MVP by evolving the current SPA. Keep the no-backend, BYO-key, local-first
model. Backend-dependent features (F-008 public sharing, auth, credits/paywall) form a
separate post-MVP milestone; when it starts, the backend's shape is driven by those
features' actual needs, not adopted wholesale from SSOT Part 2.

## Consequences
- Fastest path to a complete usable MVP; zero hosting/AI cost; strong privacy story.
- SSOT Part 2 (Next.js/Supabase/OpenAI stack, DB schema) is **aspirational, not current**
  — agents must treat `docs/Living Product Map & Feature Inventory.md` as the accurate
  system description until the SSOT docs are reconciled.
- Monetization (credit gating) is deferred along with the backend.
- The two divergent SSOT files need consolidation into one doc that separates
  "current architecture" from "future backend milestone".
