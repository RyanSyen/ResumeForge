# Reactive Resume

## Executive Summary

Reactive Resume is a free, open-source, privacy-minded resume builder designed to help people create, update, export, and share resumes with more control than typical resume-building tools. It combines a modern browser-based editing experience with practical output options such as PDF, DOCX, JSON export, public sharing, optional AI assistance, API access, MCP support, and self-hosting.

For internal stakeholders, the product matters because it is not just another template library. Its positioning is stronger: user-controlled resume creation with transparency, portability, automation potential, and deployment flexibility. For future technical evaluation, the docs also show clear platform credibility through open-source licensing, self-hosting guidance, schema-based data portability, and explicit AI/privacy tradeoffs.

## Product Brief

Reactive Resume is a browser-based resume builder for people who need to create professional resumes, keep them current, and share them in whichever form a workflow requires. The primary end user is an individual job seeker, but the product is also relevant to organizations or technical teams that care about data control, customization, or integration.

What it serves:

- Individual users who want a clean, modern resume workflow without being locked into a closed platform.
- Privacy-conscious users who want explicit control over sharing and optional AI usage.
- Power users who want structured exports, reusable resume data, and automation.
- Technical operators who may want to self-host, integrate via API, or connect AI tools through MCP.

Why it matters:

- It reduces friction in the core resume workflow: create, iterate, export, and share.
- It makes privacy and control part of the product story, not an afterthought.
- It treats resume data as something portable and reusable, not just something trapped in a visual editor.
- It can serve both lightweight consumer use and more technical, infrastructure-aware use cases.

## Core Product Features

### 1. Full resume creation and editing workflow

Reactive Resume provides a browser-based builder for creating and managing resumes from a dashboard. Users can add and edit standard resume content such as profile details, summary, experience, education, skills, projects, and other sections, then refine layout and presentation before export or sharing.

### 2. Live visual editing

A major strength is the real-time preview model. Users see changes instantly while editing, which lowers iteration cost and makes the product feel more like a true document workspace than a form-based generator.

### 3. Multiple professionally designed templates

Reactive Resume includes a wide set of templates with different visual styles while keeping support for the same underlying resume features and sections. This gives users presentation choice without forcing them to rebuild content for each design.

### 4. Layout and presentation controls

The product supports page formats such as A4, Letter, and Free-Form. Free-Form is especially notable because it is positioned for digital-first resume use, removing the usual tension around forced page boundaries when printing is not the priority. Users can also adjust colors, typography, layout, spacing, and related presentation settings.

### 5. Export flexibility

Reactive Resume supports export in three documented formats:

- `PDF` for applications, email, printing, and fixed-layout sharing
- `DOCX` for further editing in Word or Google Docs
- `JSON` for backups, restoring, importing, and structured-data workflows

This is an important product capability because it supports both human-facing and system-facing use cases.

### 6. Public sharing with control

Users can publish a public resume URL for human recipients. These links are not search-indexed by default, can be turned on or off, and can optionally be password protected. The public page can also expose PDF download for viewers.

### 7. Resume engagement visibility

For shared resumes, Reactive Resume tracks public engagement metrics such as views and last viewed time. This adds lightweight feedback without turning the product into a full analytics platform.

### 8. Import options

Reactive Resume can create a new resume from several existing formats:

- Reactive Resume JSON
- Reactive Resume v4 JSON
- JSON Resume
- PDF with AI parsing
- Microsoft Word with AI parsing

This makes migration and onboarding easier, especially for users coming from older exports or structured resume data.

### 9. Optional AI-assisted workflows

AI is not mandatory. When enabled by the user, Reactive Resume can support:

- resume analysis with score, strengths, and suggestions;
- AI-assisted builder edits with proposal review before applying changes;
- AI-based import parsing for PDF and Word files;
- an AI Agent workspace for isolated draft-based iteration.

The docs are careful here: AI is bring-your-own-provider, requires explicit setup, and should be reviewed before final use.

### 10. API, Patch API, and MCP support

Reactive Resume goes beyond end-user editing with authenticated API access, JSON Patch-based resume updates, and an MCP server that allows compatible AI tools to list, read, create, import, duplicate, and patch resumes through natural language and structured tools.

### 11. Self-hosting and deployment flexibility

Reactive Resume can be self-hosted with Docker and PostgreSQL, with optional SMTP, S3-compatible storage, SSO/custom OAuth, Redis for AI Agent support, and feature flags for instance behavior. This materially broadens its relevance beyond a consumer-only tool.

## USPs / Differentiators

### Privacy-minded by design

Reactive Resume positions privacy as a core principle. The documentation emphasizes no tracking, no ads, private-by-default editing, explicit sharing controls, and optional AI rather than mandatory AI dependence.

### Open source with real operating flexibility

Many resume builders offer user convenience; fewer combine convenience with MIT licensing, public source code, and documented self-hosting. Reactive Resume does.

### Portability beyond PDF

The product treats resume data as structured information, not just a rendered document. JSON export, import workflows, the published schema, the Patch API, and MCP support all reinforce that resume data can be reused, validated, transformed, and automated.

### Optional, user-controlled AI

Reactive Resume does not frame AI as an unavoidable black box. Instead, users choose whether to enable it, which provider to use, and when to send content to that provider. That is a meaningful differentiator in a market where AI is often bundled opaquely.

### Strong bridge between product UX and technical extensibility

The same product can serve a non-technical user through a hosted builder and a technical team through self-hosting, API access, MCP integration, and schema-driven workflows. That combination is unusually broad.

## Feature Highlights

- Build once, reuse everywhere: create a resume in the browser, then export as `PDF`, `DOCX`, or `JSON` depending on the workflow.
- Stay visually in control: live preview and quick builder dock actions reduce trial-and-error during editing.
- Share the current version, not stale attachments: public links reflect the latest resume instantly.
- Protect sensitive sharing: enable password protection when a link should not be openly viewable.
- Keep ownership of your data: use structured exports for backup, migration, and reuse.
- Use AI on your terms: connect your own provider, review changes before applying them, and skip AI entirely if preferred.
- Move faster with automation: use the API, Patch API, or MCP server for programmatic and AI-assisted workflows.
- Deploy your own instance when needed: self-host with Docker and PostgreSQL for more control over infrastructure and policy.
- Support digital-first job search workflows: Free-Form layout removes unnecessary print-era constraints when a continuous digital document is more practical.
- Build on transparent foundations: open source, public docs, and a published schema improve trust and inspectability.

## Comparison with Other Resume Builder Categories

### High-level narrative comparison

Compared with template-first resume builders, Reactive Resume appears broader and more infrastructure-aware. It still covers the expected template and export workflow, but adds stronger portability, privacy, and automation capabilities.

Compared with ATS-focused builders, Reactive Resume is less narrowly positioned around one optimization narrative and more around user control, structured data, and flexible outputs. Its documentation does support ATS-relevant digital workflows, especially through Free-Form PDFs and schema-based structured data, but the product story is not limited to ATS tuning alone.

Compared with generic design tools, Reactive Resume is much more purpose-built. A generic design tool may offer broader visual freedom, but Reactive Resume provides resume-native structure, sharing workflows, exports, schema portability, and specialized editing controls that reduce setup overhead.

Compared with closed SaaS resume builders, Reactive Resume is notably stronger on transparency, self-hosting, data portability, and technical extensibility. Closed platforms may still compete on simplicity or bundled services, but Reactive Resume has a more credible ownership and control story.

### Comparison matrix

| Category         | Reactive Resume                                                      | Template-first resume builders                  | ATS-focused resume builders                    | Generic design tools                                 | Closed SaaS resume builders                          |
| ---------------- | -------------------------------------------------------------------- | ----------------------------------------------- | ---------------------------------------------- | ---------------------------------------------------- | ---------------------------------------------------- |
| Primary value    | Resume creation plus control, portability, and extensibility         | Fast template selection and document generation | Resume optimization around screening workflows | Flexible visual design                               | Managed end-to-end resume service                    |
| Editing model    | Structured builder with live preview                                 | Usually guided builder or template forms        | Usually guided builder with optimization cues  | Freeform canvas/document editing                     | Usually guided builder inside a proprietary platform |
| Export formats   | `PDF`, `DOCX`, `JSON`                                                | Typically document exports first                | Typically document exports first               | Depends on tool and workflow                         | Usually document exports, portability varies         |
| Public sharing   | Built-in public URL with optional password protection and view stats | Varies                                          | Varies                                         | Usually requires manual publishing workflow          | Varies by platform                                   |
| Data portability | Strong, with JSON export/import, published schema, Patch API         | Often limited to platform-specific workflows    | Often focused on final document outputs        | Content is portable, but resume structure may not be | Often weaker due to platform lock-in                 |
| Privacy posture  | Privacy-focused positioning, explicit sharing, optional AI           | Varies widely                                   | Varies widely                                  | Depends on the platform                              | Depends on vendor policy                             |
| AI model         | Optional BYO-provider AI                                             | Often bundled or absent                         | Often bundled around optimization              | External or general-purpose AI add-ons               | Often platform-managed AI                            |
| Open source      | Yes                                                                  | Typically no                                    | Typically no                                   | Usually no                                           | No                                                   |
| Self-hosting     | Yes                                                                  | Rare                                            | Rare                                           | Rare for mainstream tools                            | No                                                   |
| Automation       | API, JSON Patch, MCP                                                 | Usually limited                                 | Usually limited                                | Usually external/indirect                            | Usually limited to vendor features                   |
| Best fit         | Users or teams wanting both polish and control                       | Users wanting speed and simplicity              | Users optimizing for screening guidance        | Users prioritizing custom visual design              | Users comfortable with vendor-managed workflow       |

## Why This Matters for a Tech Lead

Reactive Resume has stronger technical credibility than a typical resume-builder product because the documentation makes its architecture and operating model legible. The platform is open source under MIT, supports self-hosting with Docker, documents deployment dependencies clearly, and exposes structured interfaces through API, JSON Patch, MCP, and a published JSON schema.

From a governance and platform perspective, the most relevant attributes are:

- self-hosting support for infrastructure control;
- open-source transparency for code inspection and customization;
- privacy-aware defaults and explicit sharing controls;
- portable structured data rather than PDF-only lock-in;
- optional AI with provider choice instead of hard-coded platform AI;
- automation surfaces that make the product usable inside broader workflows.

In short, the product is credible not only as an end-user tool, but also as a controllable platform component.

## Conclusion

Reactive Resume stands out as a resume builder that combines consumer-grade usability with unusually strong control, portability, and technical flexibility. For internal stakeholders, the clearest story is that it is not just a resume editor; it is a privacy-minded, open-source resume platform with credible product depth. For technical reviewers, the combination of self-hosting, structured data, automation interfaces, and optional AI control makes it materially more interesting than the average category offering.

## Source Links

- [Getting Started / Introduction](https://docs.rxresu.me/getting-started)
- [Documentation Index](https://docs.rxresu.me/llms.txt)
- [Free Resume Builder](https://docs.rxresu.me/use-cases/free-resume-builder)
- [Open-Source Resume Builder](https://docs.rxresu.me/use-cases/open-source-resume-builder)
- [Privacy-Focused Resume Builder](https://docs.rxresu.me/use-cases/privacy-focused-resume-builder)
- [AI Resume Builder](https://docs.rxresu.me/use-cases/ai-resume-builder)
- [API and MCP Resume Automation](https://docs.rxresu.me/use-cases/api-mcp-resume-automation)
- [Export and Share Resumes](https://docs.rxresu.me/use-cases/export-and-share-resumes)
- [Exporting Your Resume](https://docs.rxresu.me/guides/exporting-your-resume)
- [Importing Resumes](https://docs.rxresu.me/guides/importing-resumes)
- [Sharing Your Resume Publicly](https://docs.rxresu.me/guides/sharing-your-resume-publicly)
- [Using AI in the Builder](https://docs.rxresu.me/guides/using-ai-in-the-builder)
- [Using the AI Agent Workspace](https://docs.rxresu.me/guides/using-ai-agent)
- [Using the Builder Dock](https://docs.rxresu.me/guides/using-the-builder-dock)
- [Choosing a Template](https://docs.rxresu.me/guides/choosing-a-template)
- [Selecting the Right Page Format](https://docs.rxresu.me/guides/selecting-page-format)
- [JSON Resume Schema](https://docs.rxresu.me/guides/json-resume-schema)
- [Using the MCP Server](https://docs.rxresu.me/guides/using-the-mcp-server)
- [Self-Hosting with Docker](https://docs.rxresu.me/self-hosting/docker)
