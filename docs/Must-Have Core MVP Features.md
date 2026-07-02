## Must-Have Core MVP Features

### Resume creation and editing

The product needs a structured resume builder where users can create, edit, and manage all standard resume sections plus custom sections. This is the core job-to-be-done: helping users produce and maintain a professional resume without starting from scratch each time.

### Live visual preview

Users should see their resume update as they edit it. This matters because resume work is highly visual, and instant feedback reduces friction, speeds iteration, and builds confidence in the final output.

### Templates and presentation controls

The product needs multiple resume templates plus control over layout, typography, spacing, colors, and page format. This matters because users want both professional polish and the ability to adapt the same content to different styles or job contexts.

### Reliable export

The product must export resumes in high-quality formats, especially PDF, with strong preview-to-export consistency. This matters because the final deliverable is usually a document sent to employers, and formatting trust is essential.

### Resume import and portability

Users should be able to import existing resume data or documents to bootstrap a draft rather than retype everything. This matters because onboarding speed is a major adoption driver, and portability reduces lock-in.

### Public sharing with privacy controls

The product needs shareable resume links, with the ability to turn sharing on or off and optionally protect a resume with a password. This matters because users often need to send a current version quickly, but still want control over who can access it.

### AI-assisted resume improvement

The MVP should include AI features that help analyze, improve, and rewrite resumes, but in a reviewable way. This matters because the planned product is explicitly an AI resume builder, and the strongest differentiator is not just generation, but guided improvement with user approval.

### Structured resume data model

Under the product, resumes need to exist as structured reusable data, not just as a visual document. This matters because it enables editing, exporting, tailoring, automation, and long-term portability across different outputs and workflows.

## Important But Secondary Features

### Version-safe iteration workflows

Features like duplicate resume, lock/finalize resume, and controlled editing states are important for managing multiple variants safely. This matters because job seekers often tailor resumes for different roles and need a way to experiment without losing a stable version.

### Resume analytics

Basic owner-facing metrics such as views and downloads are useful once sharing exists. This matters because users want lightweight feedback on whether their resume is being seen, without needing a full analytics product.

### Job-targeted tailoring

The changelog suggests a workflow where resumes can be tailored to specific job postings. This matters because it moves the product from generic authoring into outcome-oriented job search support.

### DOCX and JSON export

Beyond PDF, editable and structured exports add practical flexibility. This matters because some users need to continue editing elsewhere, and structured export supports backup, reuse, and interoperability.

### Trustworthy AI controls

AI suggestions should be reviewable, inspectable, and reversible rather than applied blindly. This matters because trust is a major adoption barrier for AI in professional documents, and reviewability is a product differentiator.

### International and multilingual document support

Good support for RTL languages, CJK, and multilingual rendering is important for broad usability. This matters because resume quality often breaks down in non-English contexts, and strong global output quality can be a real market advantage.

## Nice-to-Have / Advanced Features

### AI agent workspace

A separate AI draft workspace with thread history, attachments, and reversible actions is an advanced extension of AI editing. This matters because it supports deeper iterative workflows, but is not necessary for proving the core product.

### API, patch-based editing, and MCP automation

Programmatic resume management and AI-tool integration are strong platform features, especially for power users and external workflows. This matters because it expands the product into infrastructure territory, but it is secondary to the end-user builder experience for initial scope.

### Self-hosting and deployment flexibility

Self-hosting, custom auth, storage options, and instance feature flags make the product attractive to technical teams and privacy-sensitive organizations. This matters strategically, but it is not required to validate the core user-facing resume builder.

### Structured customization system

A governed styling system beyond basic theming can make customization safer and more consistent across builder, public view, and exports. This matters for scale and reliability, but can come after the main editing and export experience is solid.

### Platform-level configuration and operational introspection

Things like feature flags, provider discovery, health checks, and instance stats are useful for operating a platform product. This matters for maturity and technical extensibility, but it is not a primary end-user scope driver.

## Product Definition

This AI resume builder is fundamentally a structured resume creation and optimization platform: a tool where users can create a polished resume, improve it with AI, tailor it for opportunities, export it reliably, and share it with control. At its core, it is not just a document editor or template picker, but a system for managing resumes as reusable, portable, high-quality career assets.
