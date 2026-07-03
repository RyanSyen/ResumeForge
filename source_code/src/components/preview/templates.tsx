import type { CSSProperties, ReactNode } from 'react'
import type { ResumeData, SectionId, SectionKey } from '../../types'
import { SECTION_LABELS } from '../../types'

export interface TemplateProps {
  resume: ResumeData
  accent: string
}

/** Base font size (`--rf-font-size-base`) is 10.5px at the M setting — ratios below
 * are each element's original hardcoded px divided by 10.5, so at the M default
 * every element renders at its exact original pixel size (byte-identical to
 * pre-F-006 output); S/L scale every element proportionally, preserving hierarchy. */
function fs(px: number): CSSProperties {
  const ratio = (px / 10.5).toFixed(4)
  return { fontSize: `calc(var(--rf-font-size-base) * ${ratio})` }
}

/** Section-to-section gap, scaled by the "section spacing" setting. Original px
 * value is each template's own Tailwind margin utility (mt-4/mt-5/mb-4/mb-3.5). */
function sectionGap(px: number, side: 'marginTop' | 'marginBottom'): CSSProperties {
  return { [side]: `calc(var(--rf-spacing-scale) * ${px}px)` }
}

const bodyLineHeight: CSSProperties = { lineHeight: 'var(--rf-line-height)' }

function isSectionKey(key: SectionId): key is SectionKey {
  return key in SECTION_LABELS
}

function sectionLabel(resume: ResumeData, key: SectionId): string {
  if (isSectionKey(key)) return SECTION_LABELS[key]
  return resume.customSections.find((cs) => cs.id === key)?.title ?? ''
}

function visible(resume: ResumeData, key: SectionId): boolean {
  if (resume.hiddenSections.includes(key)) return false
  if (!isSectionKey(key)) {
    return (resume.customSections.find((cs) => cs.id === key)?.items.length ?? 0) > 0
  }
  switch (key) {
    case 'summary':
      return resume.summary.trim() !== ''
    default:
      return resume[key].length > 0
  }
}

function orderedSections(resume: ResumeData, only?: SectionId[]): SectionId[] {
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
            <span style={fs(13)} className="font-semibold">{e.position}</span>
            <span style={fs(11)} className="shrink-0 text-gray-500">{dates(e.startDate, e.endDate)}</span>
          </div>
          <div className="flex items-baseline justify-between gap-2">
            <span style={{ ...fs(12), color: accent }} className="font-medium">
              {e.company}
            </span>
            <span style={fs(11)} className="shrink-0 text-gray-500">{e.location}</span>
          </div>
          {cleanBullets(e.highlights).length > 0 && (
            <ul style={{ ...fs(12), ...bodyLineHeight }} className="mt-1 list-disc space-y-0.5 pl-4 text-gray-700">
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
        <div key={e.id} style={fs(12)} className="print-avoid-break">
          <div className="flex items-baseline justify-between gap-2">
            <span className="font-semibold">{e.institution}</span>
            <span style={fs(11)} className="shrink-0 text-gray-500">{dates(e.startDate, e.endDate)}</span>
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
        <div key={p.id} style={fs(12)} className="print-avoid-break">
          <span className="font-semibold">{p.name}</span>
          {p.url && (
            <span style={{ ...fs(11), color: accent }} className="ml-1.5">
              {p.url}
            </span>
          )}
          {p.description && <div className="text-gray-700">{p.description}</div>}
          {cleanBullets(p.highlights).length > 0 && (
            <ul style={bodyLineHeight} className="mt-0.5 list-disc space-y-0.5 pl-4 text-gray-700">
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
        <div key={g.id} style={fs(12)} className="print-avoid-break">
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
        <div key={c.id} style={fs(12)} className="print-avoid-break">
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
    <div style={fs(12)} className="text-gray-700">
      {resume.languages.map((l) => [l.name, l.fluency && `(${l.fluency})`].filter(Boolean).join(' ')).join('  ·  ')}
    </div>
  )
}

function CustomSectionBody({ resume, accent, sectionId }: TemplateProps & { sectionId: string }) {
  const section = resume.customSections.find((cs) => cs.id === sectionId)
  if (!section) return null
  return (
    <div className="space-y-2">
      {section.items.map((it) => (
        <div key={it.id} style={fs(12)} className="print-avoid-break">
          <div className="flex items-baseline justify-between gap-2">
            <span className="font-semibold">{it.title}</span>
            <span style={fs(11)} className="shrink-0 text-gray-500">{it.date}</span>
          </div>
          {it.subtitle && (
            <div style={{ ...fs(12), color: accent }} className="font-medium">
              {it.subtitle}
            </div>
          )}
          {it.description && <div className="text-gray-700">{it.description}</div>}
          {cleanBullets(it.bullets).length > 0 && (
            <ul style={bodyLineHeight} className="mt-0.5 list-disc space-y-0.5 pl-4 text-gray-700">
              {cleanBullets(it.bullets).map((h, i) => (
                <li key={i}>{h}</li>
              ))}
            </ul>
          )}
        </div>
      ))}
    </div>
  )
}

function sectionBody(key: SectionId, props: TemplateProps): ReactNode {
  switch (key) {
    case 'summary':
      return (
        <p style={{ ...fs(12), ...bodyLineHeight }} className="text-gray-700">
          {props.resume.summary}
        </p>
      )
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
    default:
      return <CustomSectionBody {...props} sectionId={key} />
  }
}

/* --------------------------------------- templates --------------------------------------- */

export function ModernTemplate(props: TemplateProps) {
  const { resume, accent } = props
  const b = resume.basics
  const sidebarKeys: SectionId[] = ['skills', 'certifications', 'languages']
  const mainKeys: SectionId[] = [
    'summary',
    'experience',
    'education',
    'projects',
    ...resume.customSections.map((cs) => cs.id),
  ]
  const sidebar = orderedSections(resume, sidebarKeys)
  const main = orderedSections(resume, mainKeys)
  const contacts = [b.email, b.phone, b.location, b.website, b.linkedin, b.github].filter(Boolean)

  return (
    <div className="flex min-h-full">
      <aside
        className="w-[34%] shrink-0 text-white"
        style={{ backgroundColor: accent, padding: 'var(--rf-page-margin)' }}
      >
        <h1 style={fs(22)} className="font-bold leading-tight">{b.fullName || 'Your Name'}</h1>
        {b.headline && <p style={fs(12)} className="mt-1 text-white/80">{b.headline}</p>}
        <div style={fs(11)} className="mt-5 space-y-1.5 text-white/90">
          {contacts.map((c) => (
            <div key={c} className="break-words">{c}</div>
          ))}
        </div>
        {sidebar.map((key) => (
          <div key={key} style={sectionGap(20, 'marginTop')} className="print-avoid-break">
            <h2
              style={fs(11)}
              className="print-avoid-break-after mb-1.5 border-b border-white/30 pb-1 font-bold uppercase tracking-wider"
            >
              {sectionLabel(resume, key)}
            </h2>
            <div className="[&_*]:!text-white/90 [&_.font-semibold]:!text-white">
              {sectionBody(key, props)}
            </div>
          </div>
        ))}
      </aside>
      <main className="flex-1" style={{ padding: 'var(--rf-page-margin)' }}>
        {main.map((key) => (
          <div key={key} style={sectionGap(16, 'marginBottom')} className="print-avoid-break">
            <h2
              style={{ ...fs(12), color: accent }}
              className="print-avoid-break-after mb-1.5 font-bold uppercase tracking-wider"
            >
              {sectionLabel(resume, key)}
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
    <div style={{ padding: 'var(--rf-page-margin)' }}>
      <header className="border-b-2 pb-3 text-center" style={{ borderColor: accent }}>
        <h1 style={fs(26)} className="font-bold tracking-wide">{b.fullName || 'Your Name'}</h1>
        {b.headline && <p style={fs(13)} className="italic text-gray-600">{b.headline}</p>}
        <p style={fs(11)} className="mt-1.5 text-gray-600">
          <ContactLine resume={resume} />
        </p>
      </header>
      {orderedSections(resume).map((key) => (
        <div key={key} style={sectionGap(16, 'marginTop')} className="print-avoid-break">
          <h2
            style={{ ...fs(13), borderColor: accent, color: accent }}
            className="print-avoid-break-after mb-1.5 border-b pb-0.5 font-bold uppercase tracking-widest"
          >
            {sectionLabel(resume, key)}
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
    <div style={{ padding: 'var(--rf-page-margin)' }}>
      <header className="flex items-end justify-between gap-4">
        <div>
          <h1 style={{ ...fs(24), color: accent }} className="font-bold leading-tight">
            {b.fullName || 'Your Name'}
          </h1>
          {b.headline && <p style={fs(13)} className="font-medium text-gray-600">{b.headline}</p>}
        </div>
        <div style={{ ...fs(10.5), ...bodyLineHeight }} className="text-right text-gray-600">
          {[b.email, b.phone].filter(Boolean).join(' · ')}
          <br />
          {[b.location, b.website].filter(Boolean).join(' · ')}
          <br />
          {[b.linkedin, b.github].filter(Boolean).join(' · ')}
        </div>
      </header>
      <hr className="my-3 border-t-2" style={{ borderColor: accent }} />
      {orderedSections(resume).map((key) => (
        <div key={key} style={sectionGap(14, 'marginBottom')} className="print-avoid-break">
          <h2 style={fs(11.5)} className="print-avoid-break-after mb-1 font-bold uppercase tracking-wider text-gray-800">
            {sectionLabel(resume, key)}
          </h2>
          {sectionBody(key, props)}
        </div>
      ))}
    </div>
  )
}
