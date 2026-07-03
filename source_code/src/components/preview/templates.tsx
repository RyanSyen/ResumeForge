import type { ReactNode } from 'react'
import type { ResumeData, SectionKey } from '../../types'
import { SECTION_LABELS } from '../../types'

export interface TemplateProps {
  resume: ResumeData
  accent: string
}

function visible(resume: ResumeData, key: SectionKey): boolean {
  if (resume.hiddenSections.includes(key)) return false
  switch (key) {
    case 'summary':
      return resume.summary.trim() !== ''
    default:
      return resume[key].length > 0
  }
}

function orderedSections(resume: ResumeData, only?: SectionKey[]): SectionKey[] {
  return resume.sectionOrder.filter(
    (k) => visible(resume, k) && (!only || only.includes(k)),
  )
}

const dates = (start: string, end: string) =>
  [start, end].filter(Boolean).join(' – ')

const cleanBullets = (b: string[]) => b.filter((l) => l.trim() !== '')

function ContactLine({ resume, separator = '  •  ' }: { resume: ResumeData; separator?: string }) {
  const b = resume.basics
  const parts = [b.email, b.phone, b.location, b.website, b.linkedin, b.github].filter(Boolean)
  return <>{parts.join(separator)}</>
}

/* ---------------------------------- shared section bodies ---------------------------------- */

function ExperienceBody({ resume, accent }: TemplateProps) {
  return (
    <div className="space-y-3">
      {resume.experience.map((e) => (
        <div key={e.id} className="print-avoid-break">
          <div className="flex items-baseline justify-between gap-2">
            <span className="text-[13px] font-semibold">{e.position}</span>
            <span className="shrink-0 text-[11px] text-gray-500">{dates(e.startDate, e.endDate)}</span>
          </div>
          <div className="flex items-baseline justify-between gap-2">
            <span className="text-[12px] font-medium" style={{ color: accent }}>
              {e.company}
            </span>
            <span className="shrink-0 text-[11px] text-gray-500">{e.location}</span>
          </div>
          {cleanBullets(e.highlights).length > 0 && (
            <ul className="mt-1 list-disc space-y-0.5 pl-4 text-[12px] leading-snug text-gray-700">
              {cleanBullets(e.highlights).map((h, i) => (
                <li key={i}>{h}</li>
              ))}
            </ul>
          )}
        </div>
      ))}
    </div>
  )
}

function EducationBody({ resume }: TemplateProps) {
  return (
    <div className="space-y-2">
      {resume.education.map((e) => (
        <div key={e.id} className="print-avoid-break text-[12px]">
          <div className="flex items-baseline justify-between gap-2">
            <span className="font-semibold">{e.institution}</span>
            <span className="shrink-0 text-[11px] text-gray-500">{dates(e.startDate, e.endDate)}</span>
          </div>
          <div className="text-gray-700">
            {[e.degree, e.field].filter(Boolean).join(' ')}
            {e.score && <span className="text-gray-500"> · {e.score}</span>}
          </div>
        </div>
      ))}
    </div>
  )
}

function ProjectsBody({ resume, accent }: TemplateProps) {
  return (
    <div className="space-y-2">
      {resume.projects.map((p) => (
        <div key={p.id} className="print-avoid-break text-[12px]">
          <span className="font-semibold">{p.name}</span>
          {p.url && (
            <span className="ml-1.5 text-[11px]" style={{ color: accent }}>
              {p.url}
            </span>
          )}
          {p.description && <div className="text-gray-700">{p.description}</div>}
          {cleanBullets(p.highlights).length > 0 && (
            <ul className="mt-0.5 list-disc space-y-0.5 pl-4 leading-snug text-gray-700">
              {cleanBullets(p.highlights).map((h, i) => (
                <li key={i}>{h}</li>
              ))}
            </ul>
          )}
        </div>
      ))}
    </div>
  )
}

function SkillsBody({ resume }: TemplateProps) {
  return (
    <div className="space-y-1.5">
      {resume.skills.map((g) => (
        <div key={g.id} className="print-avoid-break text-[12px]">
          {g.category && <span className="font-semibold">{g.category}: </span>}
          <span className="text-gray-700">{g.skills.filter((s) => s.trim()).join(', ')}</span>
        </div>
      ))}
    </div>
  )
}

function CertificationsBody({ resume }: TemplateProps) {
  return (
    <div className="space-y-1">
      {resume.certifications.map((c) => (
        <div key={c.id} className="print-avoid-break text-[12px]">
          <span className="font-semibold">{c.name}</span>
          <span className="text-gray-600">
            {c.issuer && ` — ${c.issuer}`}
            {c.date && ` (${c.date})`}
          </span>
        </div>
      ))}
    </div>
  )
}

function LanguagesBody({ resume }: TemplateProps) {
  return (
    <div className="text-[12px] text-gray-700">
      {resume.languages.map((l) => [l.name, l.fluency && `(${l.fluency})`].filter(Boolean).join(' ')).join('  ·  ')}
    </div>
  )
}

function sectionBody(key: SectionKey, props: TemplateProps): ReactNode {
  switch (key) {
    case 'summary':
      return <p className="text-[12px] leading-snug text-gray-700">{props.resume.summary}</p>
    case 'experience':
      return <ExperienceBody {...props} />
    case 'education':
      return <EducationBody {...props} />
    case 'projects':
      return <ProjectsBody {...props} />
    case 'skills':
      return <SkillsBody {...props} />
    case 'certifications':
      return <CertificationsBody {...props} />
    case 'languages':
      return <LanguagesBody {...props} />
  }
}

/* --------------------------------------- templates --------------------------------------- */

export function ModernTemplate(props: TemplateProps) {
  const { resume, accent } = props
  const b = resume.basics
  const sidebarKeys: SectionKey[] = ['skills', 'certifications', 'languages']
  const mainKeys: SectionKey[] = ['summary', 'experience', 'education', 'projects']
  const sidebar = orderedSections(resume, sidebarKeys)
  const main = orderedSections(resume, mainKeys)
  const contacts = [b.email, b.phone, b.location, b.website, b.linkedin, b.github].filter(Boolean)

  return (
    <div className="flex min-h-full font-sans">
      <aside className="w-[34%] shrink-0 p-6 text-white" style={{ backgroundColor: accent }}>
        <h1 className="text-[22px] font-bold leading-tight">{b.fullName || 'Your Name'}</h1>
        {b.headline && <p className="mt-1 text-[12px] text-white/80">{b.headline}</p>}
        <div className="mt-5 space-y-1.5 text-[11px] text-white/90">
          {contacts.map((c) => (
            <div key={c} className="break-words">{c}</div>
          ))}
        </div>
        {sidebar.map((key) => (
          <div key={key} className="print-avoid-break mt-5">
            <h2 className="print-avoid-break-after mb-1.5 border-b border-white/30 pb-1 text-[11px] font-bold uppercase tracking-wider">
              {SECTION_LABELS[key]}
            </h2>
            <div className="[&_*]:!text-white/90 [&_.font-semibold]:!text-white">
              {sectionBody(key, props)}
            </div>
          </div>
        ))}
      </aside>
      <main className="flex-1 p-6">
        {main.map((key) => (
          <div key={key} className="print-avoid-break mb-4">
            <h2
              className="print-avoid-break-after mb-1.5 text-[12px] font-bold uppercase tracking-wider"
              style={{ color: accent }}
            >
              {SECTION_LABELS[key]}
            </h2>
            {sectionBody(key, props)}
          </div>
        ))}
      </main>
    </div>
  )
}

export function ClassicTemplate(props: TemplateProps) {
  const { resume, accent } = props
  const b = resume.basics

  return (
    <div className="p-8 font-serif">
      <header className="border-b-2 pb-3 text-center" style={{ borderColor: accent }}>
        <h1 className="text-[26px] font-bold tracking-wide">{b.fullName || 'Your Name'}</h1>
        {b.headline && <p className="text-[13px] italic text-gray-600">{b.headline}</p>}
        <p className="mt-1.5 text-[11px] text-gray-600">
          <ContactLine resume={resume} />
        </p>
      </header>
      {orderedSections(resume).map((key) => (
        <div key={key} className="print-avoid-break mt-4">
          <h2
            className="print-avoid-break-after mb-1.5 border-b pb-0.5 text-[13px] font-bold uppercase tracking-widest"
            style={{ borderColor: accent, color: accent }}
          >
            {SECTION_LABELS[key]}
          </h2>
          {sectionBody(key, props)}
        </div>
      ))}
    </div>
  )
}

export function CompactTemplate(props: TemplateProps) {
  const { resume, accent } = props
  const b = resume.basics

  return (
    <div className="p-7 font-sans">
      <header className="flex items-end justify-between gap-4">
        <div>
          <h1 className="text-[24px] font-bold leading-tight" style={{ color: accent }}>
            {b.fullName || 'Your Name'}
          </h1>
          {b.headline && <p className="text-[13px] font-medium text-gray-600">{b.headline}</p>}
        </div>
        <div className="text-right text-[10.5px] leading-relaxed text-gray-600">
          {[b.email, b.phone].filter(Boolean).join(' · ')}
          <br />
          {[b.location, b.website].filter(Boolean).join(' · ')}
          <br />
          {[b.linkedin, b.github].filter(Boolean).join(' · ')}
        </div>
      </header>
      <hr className="my-3 border-t-2" style={{ borderColor: accent }} />
      {orderedSections(resume).map((key) => (
        <div key={key} className="print-avoid-break mb-3.5">
          <h2 className="print-avoid-break-after mb-1 text-[11.5px] font-bold uppercase tracking-wider text-gray-800">
            {SECTION_LABELS[key]}
          </h2>
          {sectionBody(key, props)}
        </div>
      ))}
    </div>
  )
}
