# SSOT — AI Resume Builder & Tailor Platform

> Single Source of Truth: product strategy + system architecture + immediate execution spec.
> Feed this entire file as context for code generation. Last updated: 2026-07-02.

---

## PART 1: MASTER PRODUCT ROADMAP & WIKI

### Vision Statement

We turn one master resume into an unlimited number of job-winning, ATS-optimized applications in under 60 seconds. Every tech professional deserves an AI career copilot that speaks recruiter, hiring manager, and parsing algorithm fluently — without fabricating a single line of experience.

### User Personas

**Persona 1: The Active Job Hunter — "Sprint Sam"**
- Mid-level software engineer (3–7 YOE), applying to 10–30 roles per week, often post-layoff or on a visa clock.
- Pain points:
  - Manually rewriting bullets per job description takes 30–45 min/application; at volume, he ships generic resumes instead.
  - Gets silently filtered by ATS keyword matching despite being qualified ("keyword gap" he can't see).
  - Loses track of which resume version went to which company.
- Success metric for him: applications per hour up, screening-call rate up.

**Persona 2: The Passive Explorer — "Selective Priya"**
- Senior engineer / tech lead, employed and comfortable, but opportunistically applies to 1–2 dream roles per month.
- Pain points:
  - Resume is 18 months stale; the activation energy to update it kills the application entirely.
  - Doesn't know how her profile reads against a specific senior/staff JD (leadership vs. IC signal).
  - Wants precision, not volume — one perfectly-positioned resume, and she's paranoid about AI making things up.
- Success metric for her: confidence to hit "apply" on the role she actually wants.

### High-Level Epic Roadmap

**Phase 1 — MVP (now → +8 weeks): "Tailor one resume, prove the magic."**
- Auth + onboarding (Supabase Auth: email + Google OAuth)
- Master resume ingestion (paste text / structured form; PDF parsing deferred)
- **AI Resume Tailoring Module** ← current epic (see Part 3)
- Match score + keyword gap display
- Copy-to-clipboard / plain-text export of tailored resume
- Basic usage limits (N free tailorings) to instrument willingness-to-pay

**Phase 2 — Growth (+2 → +5 months): "Own the whole application loop."**
- PDF/DOCX upload + parsing into the structured resume model
- Templated PDF export (2–3 ATS-safe templates)
- Job application tracker (which version → which company → status)
- Stripe billing: free tier + Pro subscription
- AI cover letter generation (reuses the tailoring pipeline)
- Version history / diff view between master and tailored resumes

**Phase 3 — Scale (+5 months →): "From tool to career platform."**
- Chrome extension: tailor directly from LinkedIn/Greenhouse/Lever job pages
- Interview prep module (likely questions derived from JD + resume delta)
- Team/coach seats (bootcamps, career coaches, outplacement firms) — B2B wedge
- Analytics loop: anonymized response-rate data → "resumes like yours got X% more callbacks with Y"
- Multi-model routing + fine-tuned rewrite model to cut inference cost

---

## PART 2: SYSTEM ARCHITECTURE & README

### Tech Stack Inventory

| Layer | Technology | Notes |
|---|---|---|
| Frontend | Next.js 15 (App Router) + TypeScript | Server Components by default; Client Components only for interactive editors |
| Styling | TailwindCSS + shadcn/ui | No custom design system in MVP |
| Backend | Next.js Route Handlers + Server Actions | No separate API service; monolith until Phase 3 |
| Database | Supabase (PostgreSQL 15) | RLS on every table, no exceptions |
| Auth | Supabase Auth | Email/password + Google OAuth |
| AI | OpenAI API — `gpt-4o` for tailoring, `gpt-4o-mini` for keyword extraction | JSON mode / structured outputs everywhere |
| Hosting | Vercel | Preview deploys per branch; `main` → production |
| Validation | Zod | Single schema per API boundary, shared client/server |

### Target Core Database Schema

```sql
-- Users: 1:1 extension of Supabase auth.users. Never store app data on auth.users.
create table public.profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  email text not null,
  full_name text,
  plan text not null default 'free' check (plan in ('free', 'pro')),
  tailor_credits_remaining int not null default 5,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- Resumes: the user's master resume(s). Content is structured JSON, not a blob of text.
create table public.resumes (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles (id) on delete cascade,
  title text not null default 'My Resume',
  -- Canonical structured format (single source for rendering, tailoring, export):
  -- { summary: string,
  --   experience: [{ company, role, start_date, end_date, bullets: string[] }],
  --   skills: string[],
  --   education: [{ school, degree, year }] }
  content jsonb not null,
  is_master boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- JobMatches: one row per tailoring run (JD + source resume + AI output).
create table public.job_matches (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles (id) on delete cascade,
  resume_id uuid not null references public.resumes (id) on delete cascade,
  job_title text,
  company_name text,
  job_description text not null,
  extracted_keywords jsonb,          -- { hard_skills: [], soft_skills: [], tools: [] }
  tailored_content jsonb,            -- same shape as resumes.content
  match_score int check (match_score between 0 and 100),
  status text not null default 'pending'
    check (status in ('pending', 'processing', 'completed', 'failed')),
  error_message text,
  created_at timestamptz not null default now(),
  completed_at timestamptz
);

create index idx_resumes_user_id on public.resumes (user_id);
create index idx_job_matches_user_id_created on public.job_matches (user_id, created_at desc);
create index idx_job_matches_resume_id on public.job_matches (resume_id);

-- RLS: users only ever see their own rows.
alter table public.profiles enable row level security;
alter table public.resumes enable row level security;
alter table public.job_matches enable row level security;

create policy "own profile" on public.profiles
  for all using (auth.uid() = id);
create policy "own resumes" on public.resumes
  for all using (auth.uid() = user_id);
create policy "own job_matches" on public.job_matches
  for all using (auth.uid() = user_id);

-- Auto-create profile on signup.
create or replace function public.handle_new_user()
returns trigger language plpgsql security definer set search_path = '' as $$
begin
  insert into public.profiles (id, email)
  values (new.id, new.email);
  return new;
end;
$$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();
```

### Core Deployment & Dev Commands

```bash
# ---- Local development ----
npm install
npx supabase start                        # local Supabase stack (Docker)
npm run dev                               # Next.js on http://localhost:3000

# ---- Database migrations ----
npx supabase migration new <name>         # create migration file
npx supabase db reset                     # rebuild local DB from migrations + seed
npx supabase db push                      # apply migrations to linked remote project
npx supabase gen types typescript --local > src/lib/database.types.ts

# ---- Quality gates (run before every push) ----
npm run lint && npm run typecheck && npm run test

# ---- Deploy ----
git push origin <branch>                  # Vercel preview deploy (automatic)
git push origin main                      # production deploy (automatic)
npx vercel --prod                         # manual production deploy (escape hatch)
```

```bash
# ---- Required environment variables (.env.local) ----
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=      # server-only, never exposed to client
OPENAI_API_KEY=                 # server-only
```

---

## PART 3: THE "ONE-SPEC" — AI RESUME TAILORING MODULE

### Context & Value

**Problem this solves:** A qualified mid-level engineer pastes a job description; today they spend 30–45 minutes manually rewriting resume bullets to mirror the JD's keywords and phrasing, or they don't bother and get filtered by the ATS. This feature does that rewrite in <30 seconds: it extracts the JD's keywords, rewrites the user's existing bullets to align with them, and shows a match score — **without inventing experience the user doesn't have.** This is the product's core magic moment; everything else in the app exists to feed or monetize this loop.

**Out of scope for v1 (be ruthless):**
- ❌ PDF/DOCX upload or parsing (master resume comes from structured form / paste)
- ❌ PDF export of the tailored result (copy-to-clipboard only)
- ❌ Cover letter generation
- ❌ Streaming token-by-token UI (single loading state → full result)
- ❌ Editing the tailored output in-app (user copies out; editing is Phase 2)
- ❌ Scraping job URLs (user pastes JD text manually)
- ❌ Multiple tailoring "tones" or settings — one good default

### User Flow & Logic

1. **Entry:** User is on `/dashboard`, has ≥1 master resume. Clicks **"Tailor for a Job"**.
2. **Input:** `/tailor` page shows: resume selector (defaults to master), textarea for JD paste, optional job title + company fields, **"Tailor My Resume"** button.
3. **Client validation (before any network call):**
   - JD empty or < 100 chars → inline error: "Paste the full job description (at least 100 characters)."
   - JD > 15,000 chars → truncate to 15,000 and show notice.
   - No resume selected / resume has zero bullets → block with error linking to resume editor.
4. **Submit:** `POST /api/tailor`. Button → disabled + progress state ("Analyzing job description…" → "Rewriting your bullets…" — timed copy, purely cosmetic).
5. **Server pipeline (inside the route handler):**
   a. Auth check via Supabase server client → `401` if no session.
   b. Zod-validate body → `400` on failure.
   c. Check `profiles.tailor_credits_remaining > 0` → `402` if exhausted (UI shows upgrade prompt).
   d. Insert `job_matches` row with `status = 'processing'`.
   e. **Call 1 (gpt-4o-mini):** extract keywords from JD → store in `extracted_keywords`.
   f. **Call 2 (gpt-4o):** rewrite resume content against keywords (prompt below) → validate output with Zod; one retry on malformed JSON.
   g. Compute `match_score` **deterministically in code** (keyword coverage in tailored text — don't let the LLM grade itself).
   h. Update row: `status = 'completed'`, `tailored_content`, `match_score`, `completed_at`; decrement credits.
   i. Return the full `job_matches` record.
6. **Result:** `/tailor/[matchId]` renders side-by-side original vs. tailored bullets (changes highlighted), match score badge, matched/missing keyword chips, **Copy tailored resume** button.

**Edge cases:**

| Case | Handling |
|---|---|
| OpenAI timeout (>60s) | `AbortController` at 60s → mark row `failed` + `error_message`, return `504`; UI shows "Took too long — try again" retry button. **Credit is NOT decremented on any failure.** |
| OpenAI 429/5xx | One retry with 2s backoff → then `failed` + `502`. |
| Malformed JSON from model | One re-request appending "Return ONLY valid JSON." → then `failed` + `502`. |
| Model output fails anti-fabrication check (bullet count/structure mismatch) | Treat as malformed → retry once → fail. |
| Duplicate submit (double-click) | Button disabled on first click; server ignores identical (user, resume, JD-hash) request within 60s. |
| Session expires mid-request | `401` → client redirects to `/login?next=/tailor`. |
| Non-JD text pasted (e.g., lorem ipsum) | Extraction call returns `is_valid_jd: false` → `422`, "This doesn't look like a job description." |

### Technical Execution Plan (for Cursor)

#### 1. Data Model Changes

The Part 2 schema already includes everything this feature needs (`job_matches` with `status`, `extracted_keywords`, `tailored_content`, `match_score`, `error_message`; `profiles.tailor_credits_remaining`). Ship it as the initial migration:

```bash
npx supabase migration new init_core_schema
# paste Part 2 DDL → npx supabase db reset
```

#### 2. API Endpoints

**`POST /api/tailor`** — runs the full pipeline synchronously (~10–25s; set route `maxDuration = 90` on Vercel).

Request:
```json
{
  "resumeId": "uuid",
  "jobDescription": "string (100–15000 chars)",
  "jobTitle": "string | null",
  "companyName": "string | null"
}
```

Success `200`:
```json
{
  "id": "uuid",
  "status": "completed",
  "matchScore": 78,
  "extractedKeywords": {
    "hard_skills": ["TypeScript", "React", "GraphQL"],
    "soft_skills": ["cross-functional collaboration"],
    "tools": ["Datadog", "Kubernetes"]
  },
  "tailoredContent": { "summary": "...", "experience": [], "skills": [], "education": [] },
  "originalContent": { "summary": "...", "experience": [], "skills": [], "education": [] },
  "creditsRemaining": 4
}
```

Errors (consistent envelope `{ "error": { "code": string, "message": string } }`):
| Status | Code | Trigger |
|---|---|---|
| 400 | `INVALID_INPUT` | Zod failure |
| 401 | `UNAUTHORIZED` | No session |
| 402 | `NO_CREDITS` | Credits exhausted |
| 404 | `RESUME_NOT_FOUND` | Bad `resumeId` / not owner |
| 422 | `NOT_A_JOB_DESCRIPTION` | JD validity check failed |
| 502 | `AI_ERROR` | Model failure after retry |
| 504 | `AI_TIMEOUT` | 60s abort |

**`GET /api/tailor/[matchId]`** — fetch one completed match (result page reload). Returns the same success shape; `404` if not owner.

File plan:
```
src/app/api/tailor/route.ts            # POST handler (auth → validate → credits → pipeline)
src/app/api/tailor/[matchId]/route.ts  # GET handler
src/lib/ai/extract-keywords.ts         # Call 1 (gpt-4o-mini)
src/lib/ai/tailor-resume.ts            # Call 2 (gpt-4o) + Zod output validation
src/lib/ai/match-score.ts              # deterministic keyword-coverage scorer
src/lib/schemas/tailor.ts              # shared Zod schemas (request, resume content, AI output)
src/app/tailor/page.tsx                # input form (client component)
src/app/tailor/[matchId]/page.tsx      # results view (server component)
```

#### 3. AI Prompting Strategy

**Call 1 — Keyword extraction (`gpt-4o-mini`, temperature 0, JSON mode):**

```text
You are an ATS (Applicant Tracking System) analysis engine. Extract the
skills and requirements that an ATS or recruiter would screen for in the
job description below.

Return ONLY valid JSON:
{
  "is_valid_jd": boolean,          // false if the text is not a job description
  "job_title_guess": string,
  "hard_skills": string[],         // languages, frameworks, methodologies (max 15)
  "soft_skills": string[],         // max 5
  "tools": string[],               // platforms, infra, software (max 10)
  "seniority_signals": string[]    // e.g. "leads projects", "mentors juniors" (max 5)
}

Use the exact spelling and casing from the job description (an ATS matches
literal strings). Do not infer skills that are not stated or strongly implied.

JOB DESCRIPTION:
"""
{{jobDescription}}
"""
```

**Call 2 — Resume tailoring (`gpt-4o`, temperature 0.3, JSON mode):**

System prompt:
```text
You are an expert technical resume writer for software engineers. You rewrite
resume content so it aligns with a target job's keywords while remaining 100%
truthful to the candidate's real experience.

HARD RULES — never violate:
1. NEVER invent skills, tools, employers, titles, dates, metrics, or
   accomplishments not present in the original resume. If a target keyword has
   no basis in the original, put it in "missing_keywords" — do NOT insert it.
2. Preserve structure exactly: same number of jobs, in the same order, with
   identical company names, role titles, and dates. Same number of bullets per
   job (±1 only when merging two redundant bullets).
3. Preserve all real numbers/metrics; never fabricate new ones.

REWRITING GUIDELINES:
- Mirror the job's exact terminology where truthful (original says "built
  REST services", job says "API development" → "developed RESTful APIs").
- Lead every bullet with a strong action verb; strip filler ("responsible
  for", "helped with").
- Structure bullets as accomplishment + measurable outcome where the original
  provides one.
- Reorder the skills list so job-relevant skills come first. You may add a
  skill ONLY if it is evidenced in the original experience bullets.
- Rewrite the summary to position the candidate for this role, using only
  facts from the resume.
- Keep each bullet under 200 characters.

Return ONLY valid JSON:
{
  "summary": string,
  "experience": [{ "company": string, "role": string, "start_date": string,
                   "end_date": string, "bullets": string[] }],
  "skills": string[],
  "education": [{ "school": string, "degree": string, "year": string }],
  "missing_keywords": string[],   // target keywords with no truthful basis
  "change_notes": string[]        // one line per meaningful rewrite, for the diff UI
}
```

User message:
```text
TARGET JOB: {{jobTitle}} at {{companyName}}

TARGET KEYWORDS (from ATS analysis):
{{extractedKeywordsJson}}

ORIGINAL RESUME (JSON):
{{resumeContentJson}}

Rewrite the resume for this job. Remember: alignment without fabrication.
```

**Post-generation guards (in `tailor-resume.ts`, not the prompt):**
- Zod-parse the output; verify company names, titles, and dates are byte-identical to the original; verify per-job bullet count within ±1. Any violation → treat as malformed (retry once, then fail).
- `match-score.ts`: `score = round(100 * matchedKeywords / totalKeywords)`, where a keyword counts as matched via case-insensitive whole-word search over the tailored text. Deterministic, explainable, and it powers the keyword chips UI directly.

---

## Definition of Done (current epic)

- [ ] Migration applied; RLS verified with a second test account
- [ ] `POST /api/tailor` passes: happy path, empty JD, no credits, fake-JD 422, forced-timeout 504
- [ ] Anti-fabrication guard has a unit test (model output with altered company name → rejected)
- [ ] Result page renders diff + score + keyword chips; copy button outputs clean plain text
- [ ] Failed runs never decrement credits
- [ ] `npm run lint && npm run typecheck && npm run test` clean on `main`
