# Reactive Resume API PRD

## Executive Summary

Reactive Resume exposes a focused but broad platform API for programmatic resume lifecycle management, public resume distribution, AI-assisted resume transformation, analytics, and instance-level configuration discovery. The API is documented as part of Reactive Resume `v5.1.0` and is served under `/api/openapi`, with API-key authentication used for protected operations.

At the product level, the API positions Reactive Resume as more than a visual resume builder. It is a portable resume data platform centered on a structured `ResumeData` model, with first-class support for automation, targeted patch-based editing, optional AI augmentation, public sharing, and self-hosted deployment control.

Documented facts

- The published API spec identifies `Reactive Resume` version `5.1.0` and serves the API from `http://localhost:3000/api/openapi` in the spec examples.
- Protected endpoints use an API key passed in the `x-api-key` header.
- The documented API surface spans AI, authentication, feature flags, resumes, resume sharing, resume analysis, resume statistics, and platform statistics.
- Reactive Resume also documents MCP-based automation, JSON Schema portability, and self-hosting support.

Inferred product positioning

- Reactive Resume is intentionally designed as a resume data platform with multiple interfaces: web app, API, patch API, AI workflows, and MCP.
- The product’s differentiator is not only resume authoring, but structured, automatable, portable resume ownership with optional AI rather than mandatory AI.

---

## Product Overview

Reactive Resume is a privacy-minded, open-source resume builder with a documented API layer that supports full CRUD operations on resumes, partial data mutation, AI-powered analysis and import, public resume delivery, and operational introspection for hosted or self-hosted deployments.

The API is built around a canonical `ResumeData` object. That object includes core profile content, standard sections, custom sections, and presentation metadata such as template, layout, typography, colors, and page settings. This makes the API suitable for both content management and presentation management, rather than only storing plain text CV data.

Documented facts

- The schema documentation states Reactive Resume aims to provide a portable, well-documented, rigorously typed JSON resume schema.
- The schema explicitly includes basics, summary, standard resume sections, custom sections, and metadata for template/layout/design/typography/page settings.
- The API supports full resume retrieval, full update, partial patch, import, duplication, PDF download, public sharing, and analytics.

Inferred product positioning

- Reactive Resume is treating resume data as a durable application asset, not just a document export format.
- The separation between top-level resume properties and nested `ResumeData` suggests deliberate product design for both dashboard-style management and deep document editing.

---

## Problem Statement

Professionals and developers often need resume systems that are:

1. Structured and portable rather than locked into a proprietary editor.
2. Automatable for repeated tailoring and integration workflows.
3. Safe for iterative editing, including partial updates and draft-based experimentation.
4. Privacy-conscious, especially when public sharing and AI are involved.
5. Deployable in both hosted and self-hosted environments.

Most resume tools optimize for manual editing only. Reactive Resume’s API appears designed to solve the broader problem of resume programmability while keeping manual authoring, public sharing, and privacy controls intact.

Documented facts

- Reactive Resume explicitly documents API-based automation, MCP automation, JSON schema portability, public sharing controls, optional AI providers, and self-hosting.
- AI is optional, BYO-provider, and requires explicit provider configuration.
- Public sharing is opt-in and can be disabled or password-protected.

Inferred conclusion

- The API exists to make resumes operable by software agents, scripts, and integrations without forcing users to abandon the builder UX.

---

## Target Users

- Individual power users who want to automate resume edits, imports, and exports.
- Developers integrating resume workflows into scripts, apps, or internal tooling.
- AI-tool users connecting through MCP or API-driven automation.
- Self-hosters who need control over auth, storage, privacy, and infrastructure.
- Teams or platforms that want a structured resume schema and programmable document lifecycle.

Documented facts

- API keys are created from the dashboard and used for authenticated API access.
- MCP is documented as an automation path for compatible AI tools.
- Self-hosting supports custom auth, storage, feature flags, and optional AI infrastructure.

Inferred conclusion

- The product serves both end users and technical operators, with the API acting as the bridge between the two.

---

## Value Proposition

Reactive Resume’s API value proposition is:

- Structured ownership: resumes live as typed JSON, not only as rendered documents.
- Automation-ready editing: full update plus JSON Patch for targeted modifications.
- Optional AI augmentation: import, analysis, and modification workflows without forcing a vendor-managed AI layer.
- Safe public distribution: public URLs, password verification, and engagement metrics.
- Operational flexibility: self-hosting, feature flags, health checks, and multiple auth/storage patterns.

Documented facts

- Patch operations are atomic and based on RFC 6902.
- AI workflows support provider/model/base URL/API key configuration.
- Public resumes can require password verification and expose engagement statistics to the owner.
- Self-hosted deployments support PostgreSQL, optional SMTP, optional S3, optional Redis, and feature flags.

Inferred strengths

- The product is especially strong for users who want tight control over where resume data lives and how it is transformed.
- The combination of schema portability + patching + AI makes Reactive Resume unusually suitable for iterative tailoring workflows.

---

## Core Product Capabilities

### 1. Resume lifecycle management

Create, list, retrieve, update, patch, duplicate, import, lock, delete, and export resumes.

### 2. Structured resume data platform

Operate on a rich `ResumeData` object that includes content sections plus formatting and layout metadata.

### 3. Public resume publishing

Expose resumes by username and slug, optionally password-protected, with owner-visible engagement metrics.

### 4. AI-powered augmentation

Test providers, parse PDF/DOCX files into resume data, analyze resumes, and support AI chat-driven modifications.

### 5. Platform introspection

Discover enabled auth providers, feature flags, and top-level platform statistics.

### 6. Automation interfaces

Support direct API usage, Patch API usage, and MCP-based tool access.

---

## API Domain / Surface Breakdown

## 1. AI

Documented endpoints

- `POST /ai/test-connection`
- `POST /ai/parse-pdf`
- `POST /ai/parse-docx`
- `POST /ai/chat`
- `POST /ai/analyze-resume`

Purpose This domain enables provider validation, AI-powered document ingestion, conversational resume modification, and structured resume analysis.

Documented facts

- Supported provider values include `openai`, `anthropic`, `gemini`, `vercel-ai-gateway`, `openrouter`, and `ollama`.
- AI parse endpoints accept provider credentials plus a base64-encoded file.
- DOCX parsing also requires a `mediaType`, with documented support for both legacy DOC and DOCX MIME types.
- AI chat streams a response and can use a `patch_resume` tool to generate JSON Patch operations.
- Resume analysis returns and persists structured output including `overallScore`, `scorecard`, `suggestions`, `strengths`, `updatedAt`, and `modelMeta`.
- AI provider credentials are documented as encrypted on the server when saved through the product settings.
- AI features are optional and require explicit provider setup.

Likely product role

- AI is an augmentation layer around the canonical resume data model, not a separate product surface.
- The most important AI value is structured transformation, not just chat.

Constraints / caveats

- AI behavior depends on external providers.
- Documentation explicitly warns users to review AI-generated changes and not rely on them blindly.
- The exact request/response contract for `POST /ai/chat` is not clearly surfaced in the fetched materials and should be treated as an open documentation question.

---

## 2. Authentication

Documented endpoints

- `GET /auth/providers`
- `DELETE /auth/account`

Purpose Expose instance auth configuration and support destructive account deletion.

Documented facts

- `GET /auth/providers` returns enabled auth providers and display names.
- Possible providers include password credentials, Google, GitHub, LinkedIn, and custom OAuth.
- `DELETE /auth/account` irreversibly deletes the authenticated user’s account and associated data, including resumes and uploaded files.

Product significance

- This is a lightweight admin/discovery/auth-support surface, not a full identity-management API.
- The platform expects primary identity UX to live in the web app while exposing just enough API surface for clients to adapt to instance capabilities.

---

## 3. Feature Flags

Documented endpoint

- `GET /flags`

Purpose Expose instance-wide product configuration that affects client behavior.

Documented facts

- The documented response includes `disableSignups`, `disableEmailAuth`, and `showSponsors`.
- Self-hosting documentation also references other operational flags such as rate-limit, image-processing, unsafe OAuth redirect, and unsafe AI base URL flags.

Product significance

- Feature flags let client applications and operators adapt behavior to deployment policy.
- This is particularly relevant for self-hosted or enterprise-like deployments.

Open question

- The API docs surface only a subset of flags compared with self-hosting documentation. It is unclear whether the endpoint intentionally omits certain operational flags or whether docs are lagging.

---

## 4. Resumes

Documented endpoints

- `GET /resumes`
- `POST /resumes`
- `GET /resumes/{id}`
- `PUT /resumes/{id}`
- `PATCH /resumes/{id}`
- `DELETE /resumes/{id}`
- `POST /resumes/import`
- `POST /resumes/{id}/duplicate`
- `POST /resumes/{id}/lock`
- `GET /resumes/{id}/pdf`
- `GET /resumes/tags`

Purpose This is the core API domain and primary value center of the platform.

Documented facts

- `GET /resumes` returns metadata only, not full `ResumeData`, for performance.
- Listing supports filtering by `tags` and sorting by `lastUpdatedAt`, `createdAt`, or `name`.
- `POST /resumes` creates a resume with `name`, `slug`, `tags`, and optional `withSampleData`.
- `GET /resumes/{id}` returns top-level metadata plus full `data` and `hasPassword`.
- `PUT /resumes/{id}` updates top-level fields.
- `PATCH /resumes/{id}` applies RFC 6902 JSON Patch operations to the resume `data` object only.
- Locked resumes cannot be updated, patched, or deleted.
- `POST /resumes/import` creates a new resume from a `ResumeData` object with random name and slug generation.
- `POST /resumes/{id}/duplicate` creates a copy and can override name, slug, and tags.
- `GET /resumes/{id}/pdf` returns `application/pdf` with a forced-download disposition header.
- `GET /resumes/tags` returns a sorted set of unique tags across the user’s resumes.

Product significance

- The API supports both object-level and document-level workflows.
- The separation of `PUT` and `PATCH` is a strong design choice: clients can choose whole-object mutation or precise targeted edits.
- Tags, lock state, and duplication make this suitable for iterative workflow management, not just single-file resume storage.

---

## 5. Resume Sharing

Documented endpoints

- `GET /resumes/{username}/{slug}`
- `PUT /resumes/{id}/password`
- `DELETE /resumes/{id}/password`
- `POST /resumes/{username}/{slug}/password/verify`

Purpose Expose resumes publicly while preserving user control.

Documented facts

- Public resume retrieval is based on `{username}` and `{slug}`.
- If a resume is password-protected and not yet verified, the API returns `401` with code `NEED_PASSWORD`.
- Password verification grants access for the duration of the viewer’s session.
- Password length must be between 6 and 64 characters.
- Public resume URLs are documented as not search-indexed by default.
- If authenticated as the owner, private resumes are also accessible from the public-slug endpoint.
- Public sharing can be disabled, and statistics are preserved when public access is turned off.

Product significance

- Sharing is modeled as controlled publication, not anonymous document dumping.
- Password verification plus session-based access balances simple sharing with lightweight access control.

Constraint

- This is not documented as identity-based access control; it is link-based access with optional password protection.

---

## 6. Resume Analysis

Documented endpoint

- `GET /resumes/{id}/analysis`

Purpose Retrieve the latest persisted AI analysis for a resume.

Documented facts

- A stored analysis may be absent; the endpoint can return `null`.
- The analysis model includes `overallScore`, `scorecard`, `suggestions`, `strengths`, `updatedAt`, and `modelMeta`.
- Suggestions include fields such as `title`, `impact`, `why`, `exampleRewrite`, and `copyPrompt`.

Product significance

- Reactive Resume is not only generating text; it is persisting structured coaching output that downstream clients can present or reuse.
- This opens room for auditability and iterative AI-review workflows.

---

## 7. Resume Statistics

Documented endpoint

- `GET /resumes/{id}/statistics`

Purpose Provide owner-facing public engagement metrics.

Documented facts

- Returns `isPublic`, `views`, `downloads`, `lastViewedAt`, and `lastDownloadedAt`.
- Owner self-visits are documented as excluded from view statistics.
- Visitors cannot see these stats.

Product significance

- This adds a measurable distribution layer to the product.
- The feature is lightweight but valuable for job-seeking workflows.

---

## 8. Platform Statistics

Documented endpoints

- `GET /statistics/users`
- `GET /statistics/resumes`
- `GET /statistics/github/stars`

Purpose Expose high-level instance or project metrics.

Documented facts

- User count and resume count are cached for up to 6 hours.
- GitHub star count is cached for up to 6 hours and falls back to the last known value if GitHub is unavailable.

Product significance

- These endpoints are not essential to core resume workflows, but they support dashboards, marketing surfaces, and instance-level visibility.

---

## Key Workflows

## 1. Manual-to-programmatic resume management

1. User creates or imports a resume.
2. Client lists resumes and retrieves full `ResumeData`.
3. Client updates whole resumes via `PUT` or makes surgical edits via `PATCH`.
4. User exports to PDF or shares publicly.

## 2. Safe iterative editing

1. Retrieve current resume state.
2. Apply atomic JSON Patch operations, optionally with `test` steps for optimistic safety.
3. Use lock state to freeze finalized versions.
4. Duplicate resumes before large transformations.

## 3. Public sharing and engagement tracking

1. User marks a resume public in product UX.
2. Resume becomes accessible via `/resumes/{username}/{slug}`.
3. Optional password verification gates access.
4. Owner retrieves views/downloads statistics.

## 4. AI-assisted import and refinement

1. Configure and test AI provider.
2. Parse PDF or DOCX into `ResumeData`.
3. Analyze resume for scorecard/strengths/suggestions.
4. Use AI chat and patching workflows to refine the draft.

## 5. Agentic automation

1. Create API key or connect through MCP.
2. Read existing resume state.
3. Patch targeted fields or import structured source material.
4. Validate visually in the builder or export as PDF.

---

## Functional Requirements

## Core data model

- The product must expose a canonical structured `ResumeData` object.
- The data model must support content sections, custom sections, and presentation metadata.
- Resume data should remain portable through JSON schema alignment.

## Identity and access

- Protected endpoints must require authenticated access via `x-api-key`.
- Public resume retrieval must work without authenticated user identity.
- Password-protected public resumes must require a verification step before content access.

## Resume management

- Users must be able to create, list, read, update, patch, duplicate, import, lock, delete, and export resumes.
- Slugs must be unique per user context when creating new resumes.
- Locked resumes must reject mutating operations.

## Partial mutation

- The API must support RFC 6902 patch operations.
- Patch application must be atomic.
- Patch failures must reject the entire operation.

## AI augmentation

- Users must be able to test provider connectivity before using AI.
- AI-assisted parsing should convert supported source files into `ResumeData`.
- AI-assisted analysis should return structured results and persist the latest result.
- AI-assisted modification should support resume edits through patch-based transformation.

## Discovery and configuration

- Clients must be able to discover enabled auth providers and feature flags.
- Clients should be able to adapt UI/behavior to instance capabilities.

## Distribution and analytics

- Users must be able to publish resumes by stable URL shape.
- Public sharing must support optional password protection.
- Owners must be able to retrieve engagement metrics.

---

## Cross-Cutting Concerns

## Authentication

Documented fact

- Protected operations use API keys in the `x-api-key` header.

Implication

- This is simple for server-to-server and scripting use, but less expressive than scoped OAuth-style delegated authorization.

## Validation

Documented facts

- Resume data is validated against schema-driven expectations.
- Patch failures can occur for structurally invalid operations, invalid paths, or data that fails schema validation.
- Creation enforces slug uniqueness.
- Password length has explicit bounds.
- AI parse endpoints enforce request shape, required fields, and supported providers/media types.

## Errors

Documented facts

- The docs explicitly call out errors such as `UNAUTHORIZED`, `NOT_FOUND`, `RESUME_LOCKED`, `INVALID_PATCH_OPERATIONS`, `RESUME_SLUG_ALREADY_EXISTS`, `BAD_REQUEST`, `BAD_GATEWAY`, and `NEED_PASSWORD`.
- AI parsing can return `502` when provider communication fails.
- Health checks return `503` when dependencies are unhealthy.

## Extensibility

Documented facts

- Resume data supports custom sections.
- The schema is published and intended for adoption by third parties.
- MCP is documented as an alternate interface for AI tools.
- Self-hosting supports custom OAuth and S3-compatible storage.

Inferred conclusion

- The platform is intentionally extensible at the data-model and deployment layers, more than at a public plugin/API-composition layer.

---

## Developer Experience

Reactive Resume provides a notably usable developer experience for a resume platform.

Documented strengths

- Clear API-key flow from the dashboard.
- OpenAPI spec is published.
- Patch API is separately documented with concrete examples.
- JSON schema is published and intended for validation/editor support.
- MCP is documented for tool-based automation.
- Self-hosting docs are detailed, with environment variables, health checks, and troubleshooting.

DX advantages

- API consumers can choose low-friction integration styles: CRUD, patch, import/export, AI workflows, or MCP.
- JSON Patch is a strong fit for AI-generated diffs and targeted scripts.
- The schema-centric model reduces ambiguity for clients generating or validating resume data.

DX limitations / open questions

- The exact request/response shape for some AI and non-JSON endpoints is less explicit than ideal in the fetched docs.
- There is no clearly documented pagination model because the current resume list appears unpaginated.
- No documented versioning strategy beyond the published product/API version was found in the reviewed materials.

---

## Operational Considerations

Reactive Resume’s API is shaped by the fact that the product is both hosted and self-hostable.

Documented facts

- Self-hosting requires PostgreSQL.
- SMTP is optional; if not configured, emails are logged to console.
- Storage can be local or S3-compatible.
- Saved AI provider management requires `ENCRYPTION_SECRET`.
- AI Agent workspace requires `REDIS_URL`.
- The health endpoint is `/api/health` and checks database and storage.
- Newer versions perform PDF generation client-side rather than through an external server-side print service.
- Feature flags can disable signups, email auth, image processing, and rate limiting, and can relax safety around OAuth redirect URIs or AI base URLs in trusted self-hosted deployments.

Operational implications

- The API is viable for both single-user deployments and fuller hosted environments.
- AI and attachment-heavy workflows add infrastructure requirements beyond baseline CRUD.
- Health-check behavior is good for containerized environments and reverse-proxy routing.

---

## Security & Privacy

Reactive Resume’s API surface reflects a privacy-aware posture, though some tradeoffs remain.

Documented facts

- The product is open source and self-hostable.
- Public sharing is opt-in and not search-indexed by default.
- Public resumes can be password-protected.
- AI is optional and BYO-provider.
- AI keys are treated as sensitive and documented as encrypted when stored through product settings.
- Self-hosted deployments can enable unsafe AI base URLs, but the docs explicitly warn that this is an SSRF risk and should be used only in trusted deployments.
- Deleting an account removes resumes and uploaded files irreversibly.

Strengths

- Privacy-sensitive users can avoid AI entirely.
- Public access is explicit and reversible.
- Self-hosting allows full control over auth, storage, and infrastructure.

Risks

- API-key authentication appears account-centric rather than scope-centric.
- Public resume passwording is lightweight and session-based, not a full ACL model.
- AI usage necessarily exposes content to the chosen provider.
- Unsafe self-hosted flags can weaken deployment security if misused.

---

## Product Strengths

Explicitly supported strengths

- Strong canonical resume data model.
- Full resume lifecycle API.
- First-class partial updates with atomic JSON Patch.
- Optional AI workflows tied to structured data, not only freeform text.
- Public sharing with owner-controlled privacy controls.
- Published schema and automation guidance.
- Strong self-hosting and operational documentation.

Higher-level inferred strengths

- The platform is unusually well-suited for AI-agent editing because patch operations map naturally to controlled document changes.
- Reactive Resume has a coherent “resume as structured asset” story across builder UX, API, MCP, sharing, and portability.
- The product appears to balance end-user accessibility with developer ergonomics better than many niche document tools.

---

## Risks and Limitations

### Product / API limitations

- The public API surface appears intentionally narrow around resume workflows; it is not a general collaboration platform API.
- No documented pagination, bulk operations, or webhooks were identified.
- No documented scoped permissions or per-key granular authorization were identified.
- Public sharing is oriented to link distribution, not enterprise document governance.
- Some AI endpoint details are under-documented relative to the rest of the API.

### Adoption risks

- Consumers that want strict audit trails, role-based access, or enterprise controls may find the current API surface too lightweight.
- Heavy AI workflows create provider dependency, cost exposure, and output-quality variability.
- Resume portability is strong, but interoperability depends on external systems adopting the schema.

---

## Success Metrics

If this API were being managed as a product surface, success could be measured through:

### Adoption

- Number of API keys created.
- Number of resumes created/imported through API or MCP workflows.
- Share of resumes updated through `PATCH` versus manual builder-only workflows.

### Engagement

- Frequency of public sharing enablement.
- Resume views and downloads per shared resume.
- Usage rates of AI analysis and import endpoints.

### Reliability

- Success/failure rates for AI parsing and analysis.
- Patch failure rates by error code.
- Health endpoint uptime in hosted and self-hosted environments.

### Ecosystem growth

- MCP client usage.
- Third-party integrations built on the JSON schema.
- Self-hosted deployment growth.

Note These are product recommendations, not documented existing telemetry commitments.

---

## Future Enhancements

These are inferred opportunities, not documented roadmap items.

- Scoped API keys with per-operation permissions.
- Pagination and bulk APIs for larger accounts.
- Better documented streaming contract for AI chat.
- Webhooks or event subscriptions for resume changes and public engagement.
- First-class diff/preview endpoints for patches before apply.
- Version history and rollback APIs for resume changes.
- More explicit API rate-limit documentation and client guidance.
- Richer public analytics while preserving privacy.
- Stronger import/export interoperability guarantees across third-party ecosystems.

---

## Open Questions

1. What is the exact request and streaming response contract for `POST /ai/chat`?
2. Are API keys scoped in any way beyond account ownership, or are they full-account credentials?
3. Is there any documented or enforced rate limit for non-auth endpoints in hosted deployments?
4. Are resume list responses intentionally unpaginated, or is pagination planned but not yet documented?
5. Which feature flags are guaranteed to appear in `GET /flags`, and which are internal/operational only?
6. Is there any official API versioning/deprecation policy beyond the published app version?
7. Does the MCP surface expose the full API breadth, or only a curated subset of resume operations?
8. Are there documented upload/file endpoints elsewhere, or are file lifecycles intentionally hidden behind higher-level workflows?
9. Is public resume PDF download exposed through API for unauthenticated viewers, or only through the web experience?
10. Are there concurrency/versioning primitives beyond JSON Patch `test` operations?

---

## Bottom Line

Reactive Resume’s API is a well-scoped platform API for structured resume ownership and automation. Its center of gravity is the `ResumeData` model, with the strongest capabilities concentrated in resume CRUD, patch-based mutation, public sharing, AI-assisted transformation, and self-hosted operational flexibility.

The clearest documented story is: create and manage resumes as structured data, automate precise edits, optionally enrich with AI, publish safely, and retain deployment/privacy control. Where the documentation is thinner, the gaps are mostly around operational sophistication and advanced API-consumer concerns rather than around the core product model itself.
