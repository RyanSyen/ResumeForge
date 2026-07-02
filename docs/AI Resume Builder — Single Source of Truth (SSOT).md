# AI Resume Builder — Single Source of Truth (SSOT)

*Last updated: 2026-07-02*

---

## PART 1: MASTER PRODUCT ROADMAP & WIKI

### Vision Statement

We turn the resume from a static document into a living, job-specific asset — every application gets a resume tailored to its exact requirements in under 60 seconds. We win by making ATS-optimization and keyword-matching invisible, automatic, and trustworthy.

### User Personas

**Persona 1: "The Active Job Hunter" — Priya**

- Mid-level software engineer, 3-6 YOE, applying to 15-30 jobs/week during an active search.
- Pain: Manually rewriting resume bullets for each JD is exhausting; she either sends the same generic resume everywhere (low callback rate) or burns 30+ min per application tailoring by hand.
- Pain: No visibility into *why* her resume gets auto-rejected by ATS — she suspects keyword mismatch but can't diagnose it.
- Success metric for us: time-to-tailored-resume < 2 minutes, measurable increase in her callback rate.

**Persona 2: "The Passive Explorer" — Daniel**

- Senior engineer, currently employed, not actively looking but keeps an eye on interesting roles.
- Pain: His resume is 18 months stale. When a recruiter DMs him with a JD, he has no fast way to check fit or refresh bullets before deciding whether to engage.
- Pain: Low tolerance for friction — if tailoring takes more than a couple minutes or requires re-uploading/reformatting, he'll just ignore the opportunity.
- Success metric for us: near-zero-friction "paste JD → see fit score + quick tailor" loop.

### High-Level Epic Roadmap

**Phase 1 — MVP (Prove the core loop)**

- User auth + resume upload/parse (PDF/DOCX → structured JSON)
- Manual resume builder (sections: contact, summary, experience, education, skills)
- **AI Resume Tailoring Module** (this doc's Part 3 — the wedge feature)
- Basic ATS keyword match score (JD vs. resume)
- Export tailored resume to PDF/DOCX
- Single-tier pricing gate (e.g., 3 free tailors, then paywall)

**Phase 2 — Growth (Retention & virality)**

- Multiple resume versions per user ("Resume Library")
- Job application tracker (status: applied/interview/offer/rejected) linked to tailored resumes
- Cover letter generation from same JD context
- Resume scoring against multiple JDs simultaneously (batch tailoring)
- Chrome extension: capture JD from LinkedIn/Indeed with one click
- Referral program / shareable resume score

**Phase 3 — Scale (Moat & monetization depth)**

- Interview prep module (AI-generated questions from JD + resume gap analysis)
- Recruiter-facing product (reverse marketplace: tailored-candidate matching)
- Fine-tuned/custom scoring model (move off generic LLM prompting for ATS scoring)
- Team/enterprise tier (career coaches, bootcamps managing multiple candidates)
- Multi-language resume support

---

## PART 2: SYSTEM ARCHITECTURE & README

### Tech Stack Inventory

| Layer           | Choice                                                                                               |
| --------------- | ---------------------------------------------------------------------------------------------------- |
| Frontend        | Next.js 14+ (App Router), TypeScript, TailwindCSS                                                    |
| UI Components   | shadcn/ui (recommended — pairs cleanly with Tailwind + Cursor codegen)                               |
| Backend         | Next.js Server Actions + Route Handlers (no separate backend service for MVP)                        |
| Database        | Supabase (PostgreSQL)                                                                                |
| Auth            | Supabase Auth (email + OAuth)                                                                        |
| File Storage    | Supabase Storage (resume uploads, generated PDFs)                                                    |
| AI Models       | OpenAI API (gpt-4o-mini for tailoring/scoring cost efficiency; gpt-4o fallback for complex rewrites) |
| Hosting         | Vercel (frontend + serverless functions)                                                             |
| Background Jobs | Vercel Cron / Supabase Edge Functions (for async parsing if needed)                                  |

### Target Core Database Schema

```sql
-- ============================================
-- USERS
-- Supabase Auth manages auth.users; this extends it.
-- ============================================
create table public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  email text not null unique,
  full_name text,
  plan text not null default 'free' check (plan in ('free', 'pro', 'team')),
  tailor_credits_remaining int not null default 3,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- ============================================
-- RESUMES
-- Stores both the raw uploaded file ref and parsed structured content.
-- ============================================
create table public.resumes (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  title text not null default 'Untitled Resume',
  source_file_path text,              -- Supabase Storage path, if uploaded
  raw_text text,                      -- extracted plain text
  parsed_content jsonb not null default '{}'::jsonb, -- structured: {summary, experience[], education[], skills[]}
  is_base_resume boolean not null default true,  -- true = original, false = a tailored derivative
  parent_resume_id uuid references public.resumes(id) on delete set null, -- links tailored version to its base
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index idx_resumes_user_id on public.resumes(user_id);
create index idx_resumes_parent_id on public.resumes(parent_resume_id);

-- ============================================
-- JOB MATCHES
-- One row per (resume x job description) tailoring event.
-- ============================================
create table public.job_matches (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  base_resume_id uuid not null references public.resumes(id) on delete cascade,
  tailored_resume_id uuid references public.resumes(id) on delete set null,
  job_title text,
  company_name text,
  job_description_text text not null,
  match_score numeric(5,2),           -- 0-100 ATS keyword match score
  matched_keywords jsonb default '[]'::jsonb,
  missing_keywords jsonb default '[]'::jsonb,
  status text not null default 'draft' check (status in ('draft', 'tailored', 'applied', 'interview', 'rejected', 'offer')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index idx_job_matches_user_id on public.job_matches(user_id);
create index idx_job_matches_base_resume_id on public.job_matches(base_resume_id);

-- ============================================
-- updated_at trigger (reuse across tables)
-- ============================================
create or replace function public.set_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

create trigger trg_profiles_updated_at before update on public.profiles
  for each row execute function public.set_updated_at();
create trigger trg_resumes_updated_at before update on public.resumes
  for each row execute function public.set_updated_at();
create trigger trg_job_matches_updated_at before update on public.job_matches
  for each row execute function public.set_updated_at();

-- ============================================
-- Row Level Security
-- ============================================
alter table public.profiles enable row level security;
alter table public.resumes enable row level security;
alter table public.job_matches enable row level security;

create policy "Users manage own profile" on public.profiles
  for all using (auth.uid() = id);
create policy "Users manage own resumes" on public.resumes
  for all using (auth.uid() = user_id);
create policy "Users manage own job matches" on public.job_matches
  for all using (auth.uid() = user_id);
```

### Core Deployment & Dev Commands

```bash
# ---- Local Dev ----
npm run dev                          # start Next.js dev server (localhost:3000)
supabase start                       # start local Supabase stack (Docker)
supabase status                      # show local API URL, anon key, etc.

# ---- Database Migrations ----
supabase migration new <name>        # create a new migration file
supabase db reset                    # wipe local DB, reapply all migrations + seed
supabase db push                     # push local migrations to linked remote project
supabase gen types typescript --local > types/supabase.ts   # regenerate TS types after schema change

# ---- Deployment ----
vercel                               # deploy preview build
vercel --prod                        # deploy to production
supabase link --project-ref <ref>    # link local repo to remote Supabase project (one-time)
supabase db push --linked            # apply migrations to production Supabase

# ---- Env vars needed (Vercel + .env.local) ----
# NEXT_PUBLIC_SUPABASE_URL
# NEXT_PUBLIC_SUPABASE_ANON_KEY
# SUPABASE_SERVICE_ROLE_KEY   (server-only)
# OPENAI_API_KEY              (server-only)
```

---

## PART 3: THE "ONE-SPEC" — AI Resume Tailoring Module

### Context & Value

**Problem this solves:** A user has one base resume but needs a version whose language mirrors a specific job description's keywords and priorities — because most ATS systems and human skimmers pattern-match on keyword overlap, not general quality. Manually doing this per-application is the single biggest time sink in job hunting.

**Out of scope for v1 (keep it lean):**

- No cover letter generation (Phase 2).
- No JD auto-fetch from URL — user pastes JD text manually only.
- No multi-resume-version comparison UI — one tailored output per run, replace-on-retry.
- No fine-tuned scoring model — use LLM-based scoring via prompt, not a separate ML pipeline.
- No PDF template/design customization in this pass — reuse existing base resume's export format.
- No collaborative/team editing.

### User Flow & Logic

1. User is on their base resume's detail page. Clicks **"Tailor to a Job"**.
2. Modal/panel opens with a `<textarea>` for JD paste. Client-side validation: JD text must be ≥ 100 characters (reject with inline error: "Paste the full job description for accurate tailoring").
3. User clicks **"Generate Tailored Resume"**.
4. Client calls Server Action `tailorResume()` with `{ baseResumeId, jobDescriptionText }`.
5. Server checks `tailor_credits_remaining` on the user's profile.
   - If `0` and plan is `free` → return `402`-style error payload, client shows paywall modal. **Stop.**
6. Server fetches `parsed_content` for `baseResumeId`, verifies ownership (RLS + explicit check).
7. Server constructs prompt (see AI Prompting Strategy below) and calls OpenAI API.
   - **Timeout handling:** wrap call with a 25s timeout (Vercel serverless function limit awareness). On timeout, return error `{ success: false, error: 'timeout' }`; client shows "This is taking longer than expected — retry?" with a retry button, and the credit is **not** deducted.
   - **Empty/malformed JD:** if JD text after trimming whitespace is empty or non-English boilerplate (e.g., just a URL), server-side validation rejects before calling OpenAI — return `400` with `{ error: 'invalid_job_description' }`.
   - **OpenAI API error (5xx/rate limit):** catch, return `{ success: false, error: 'ai_provider_error' }`, no credit deducted, log to server console with correlation ID.
8. On success: server parses the AI's JSON response, validates shape (each bullet must map to an existing experience entry — reject/retry once if the model hallucinates a new job entry).
9. Server writes:
   - New row in `resumes` (`is_base_resume = false`, `parent_resume_id = baseResumeId`, `parsed_content` = tailored JSON).
   - New row in `job_matches` (`base_resume_id`, `tailored_resume_id`, `match_score`, `matched_keywords`, `missing_keywords`, `status = 'tailored'`).
   - Decrement `profiles.tailor_credits_remaining` by 1 (atomic SQL update, not read-then-write).
10. Server returns `{ success: true, tailoredResumeId, matchScore, matchedKeywords, missingKeywords }`.
11. Client redirects to tailored resume view, shows match score with a visual diff (before/after bullets highlighted) and a toast: "Resume tailored — 2 credits remaining."
12. User can export to PDF/DOCX from this view (reuses existing export pipeline, no new work needed here).

**Edge cases explicitly handled above:** empty JD, timeout, AI provider error, hallucinated content, zero credits, ownership check.

### Technical Execution Plan for Cursor

#### Data Model Changes

No new tables required — `resumes` and `job_matches` (Part 2 schema) already support this via `parent_resume_id` and `base_resume_id`/`tailored_resume_id`. Only addition needed:

```sql
-- Track cost/usage per tailoring event for future rate-limiting/analytics
alter table public.job_matches
  add column ai_model_used text,
  add column ai_tokens_used int;
```

#### API Endpoints / Server Actions

**Server Action: `tailorResume`** (`app/actions/tailor-resume.ts`)

```typescript
// Request
type TailorResumeInput = {
  baseResumeId: string;   // uuid
  jobDescriptionText: string;
  jobTitle?: string;
  companyName?: string;
};

// Response
type TailorResumeResult =
  | {
      success: true;
      tailoredResumeId: string;
      jobMatchId: string;
      matchScore: number;
      matchedKeywords: string[];
      missingKeywords: string[];
      creditsRemaining: number;
    }
  | {
      success: false;
      error: 'timeout' | 'ai_provider_error' | 'invalid_job_description' | 'no_credits' | 'unauthorized';
    };
```

**Route Handler (if client needs REST instead of Server Action, e.g. for Chrome extension in Phase 2): `POST /api/resumes/tailor`**

- Request body: same as `TailorResumeInput`
- Response: same as `TailorResumeResult`
- Auth: Supabase session cookie or Bearer token

#### AI Prompting Strategy

**System Prompt:**

```
You are an expert technical resume writer and ATS optimization specialist.
Your job is to rewrite resume bullet points so they align with a target job
description, while staying 100% truthful to the candidate's actual experience.

STRICT RULES:
1. Never invent employers, job titles, dates, degrees, or metrics that are not
   present in the original resume. You may rephrase and reframe, never fabricate.
2. Preserve the original number and order of experience entries. Do not add or
   remove jobs, companies, or education entries.
3. For each experience entry, rewrite its bullet points to:
   - Naturally incorporate relevant keywords/skills from the job description
     where the candidate's actual experience supports it.
   - Lead with strong action verbs and quantify impact only if a number
     already exists in the original bullet (never invent metrics).
   - Keep each bullet under 220 characters.
4. Identify keywords from the job description that ARE reflected in the
   tailored resume ("matchedKeywords") and important ones that are NOT
   ("missingKeywords") — these are gaps the candidate may want to address
   elsewhere (e.g., in a cover letter), not to be faked into the resume.
5. Compute a matchScore (0-100) representing overall keyword/skill alignment
   between the tailored resume and the job description.
6. Output ONLY valid JSON matching the schema below. No prose, no markdown
   fences, no explanation.

OUTPUT SCHEMA:
{
  "summary": string,
  "experience": [
    {
      "originalEntryId": string,
      "bullets": string[]
    }
  ],
  "matchScore": number,
  "matchedKeywords": string[],
  "missingKeywords": string[]
}
```

**User Prompt Template:**

```
BASE RESUME (structured JSON):
{{parsed_content_json}}

TARGET JOB DESCRIPTION:
{{job_description_text}}

Rewrite the resume's summary and experience bullets to align with this job
description, following all rules in the system prompt. Return the JSON object only.
```

**Model config:**

- Model: `gpt-4o-mini` (default) — fall back to `gpt-4o` if `parsed_content` exceeds ~4000 tokens or if a `retry` flag is set after a validation failure.
- `temperature: 0.3` (favor consistency/truthfulness over creative variation).
- `response_format: { type: "json_object" }` to enforce valid JSON output.
- Max output tokens: 2000 (sufficient for a full resume rewrite; prevents runaway cost).

**Post-processing validation (server-side, before DB write):**

- Confirm `experience[].originalEntryId` values are a subset of the original resume's entry IDs — reject/retry once if the model introduced new IDs.
- Clamp `matchScore` to `[0, 100]`.
- Truncate any bullet exceeding 220 chars as a safety net (should be rare given prompt constraint).
