# ResumeForge — AI Resume Builder & Tailor

A web-based resume builder inspired by [Reactive Resume](https://github.com/amruthpillai/reactive-resume), with Google Gemini integration for AI-assisted writing and job-description tailoring. Pure client-side app — your resume and API key never leave your browser.

## Features

### Resume builder
- **Sections**: personal details, summary, work experience, education, projects, skills (grouped), certifications, languages
- **Section control**: reorder sections, hide/show any section, reorder items within a section
- **Live preview**: A4 page rendered in real time with zoom controls
- **3 templates**: Modern (accent sidebar), Classic (serif, centered), Compact — switchable instantly
- **6 accent colors**
- **Persistence**: everything auto-saves to browser localStorage
- **Import / Export**: portable JSON format
- **PDF download**: print-optimized A4 output via the browser print dialog (`Download PDF`)
- **Sample resume** one click away to explore the app

### Gemini AI integration (bring your own key)
The app prompts for your Gemini API key (Settings gear, or automatically when you first use an AI feature). Get a free key at [aistudio.google.com/apikey](https://aistudio.google.com/apikey). The key is stored only in localStorage and requests go directly from your browser to Google — no middleman server.

- **Tailor to a job** (AI Tailor tab): paste a job description and Gemini returns
  - a 0–100 match score with matched / missing ATS keywords
  - a rewritten summary targeted at the role
  - rewritten achievement bullets per experience entry
  - skills implied by your experience that are missing from your skills list
  - actionable recommendations
  - every suggestion has its own **Apply** button — nothing changes without your approval
- **Improve with AI**: one-click rewrite of your summary or experience bullets (action verbs, quantified impact, no invented facts)
- **Generate summary** from the rest of your resume
- **Model choice**: Gemini 2.5 Flash (default), 2.5 Pro, or 2.5 Flash-Lite
- **Test connection** button in settings to validate your key

## Getting started

```bash
npm install
npm run dev      # http://localhost:5173
npm run build    # production build in dist/
npm run preview  # serve the production build
```

## Tech stack

- React 19 + TypeScript + Vite 8
- Tailwind CSS 4
- Zustand (state + localStorage persistence)
- Gemini REST API (`generativelanguage.googleapis.com`), JSON response mode
- lucide-react icons

## Architecture

```
src/
├── types.ts                    # resume data model, tailor result types
├── data/sample.ts              # empty + sample resume factories
├── store/
│   ├── resume.ts               # resume state (zustand, persisted)
│   └── settings.ts             # API key, model, template, accent (persisted)
├── lib/
│   ├── gemini.ts               # Gemini client + prompts (improve / summary / tailor)
│   └── file.ts                 # JSON import/export
└── components/
    ├── Toolbar.tsx             # template, accent, import/export, PDF, settings
    ├── SettingsDialog.tsx      # API key entry + model + connection test
    ├── ui.tsx                  # Field, Button, AiAssist (suggest → apply/discard)
    ├── editor/                 # per-section editors with reorder/hide controls
    ├── ai/AiPanel.tsx          # job-description tailoring workflow
    └── preview/                # A4 preview + Modern/Classic/Compact templates
```

## Notes & known limits (POC)

- PDF export uses the browser print dialog; select "Save as PDF" and disable headers/footers for best results.
- AI prompts instruct Gemini to never invent employers, dates, or credentials — but always review suggestions before applying (each has an explicit Apply step).
- Single resume per browser profile; use Export/Import JSON to manage multiple versions.
- No backend/accounts by design — deploy the `dist/` folder to any static host (Vercel, Netlify, S3, nginx).
