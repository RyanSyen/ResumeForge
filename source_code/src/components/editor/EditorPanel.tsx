import { Plus } from 'lucide-react'
import type { SectionKey } from '../../types'
import { newId, useResume } from '../../store/resume'
import { generateSummary, improveText } from '../../lib/gemini'
import { AiAssist, Button, Field, TextArea } from '../ui'
import { ItemCard, SectionShell } from './SectionShell'

export function EditorPanel() {
  const order = useResume((s) => s.resume.sectionOrder)

  return (
    <div className="space-y-3 p-3">
      <BasicsEditor />
      {order.map((key, i) => {
        const shell = { first: i === 0, last: i === order.length - 1 }
        const editors: Record<SectionKey, React.ReactNode> = {
          summary: <SummaryEditor {...shell} key={key} />,
          experience: <ExperienceEditor {...shell} key={key} />,
          education: <EducationEditor {...shell} key={key} />,
          projects: <ProjectsEditor {...shell} key={key} />,
          skills: <SkillsEditor {...shell} key={key} />,
          certifications: <CertificationsEditor {...shell} key={key} />,
          languages: <LanguagesEditor {...shell} key={key} />,
        }
        return editors[key]
      })}
    </div>
  )
}

function BasicsEditor() {
  const basics = useResume((s) => s.resume.basics)
  const setBasics = useResume((s) => s.setBasics)

  return (
    <section className="rounded-lg border border-slate-200 bg-white">
      <header className="border-b border-slate-100 px-3 py-2">
        <h3 className="text-sm font-semibold text-slate-800">Personal Details</h3>
      </header>
      <div className="grid grid-cols-2 gap-2.5 p-3">
        <Field label="Full name" value={basics.fullName} onChange={(e) => setBasics({ fullName: e.target.value })} />
        <Field label="Headline / Title" value={basics.headline} onChange={(e) => setBasics({ headline: e.target.value })} />
        <Field label="Email" type="email" value={basics.email} onChange={(e) => setBasics({ email: e.target.value })} />
        <Field label="Phone" value={basics.phone} onChange={(e) => setBasics({ phone: e.target.value })} />
        <Field label="Location" value={basics.location} onChange={(e) => setBasics({ location: e.target.value })} />
        <Field label="Website" value={basics.website} onChange={(e) => setBasics({ website: e.target.value })} />
        <Field label="LinkedIn" value={basics.linkedin} onChange={(e) => setBasics({ linkedin: e.target.value })} />
        <Field label="GitHub" value={basics.github} onChange={(e) => setBasics({ github: e.target.value })} />
      </div>
    </section>
  )
}

function SummaryEditor({ first, last }: { first: boolean; last: boolean }) {
  const summary = useResume((s) => s.resume.summary)
  const resume = useResume((s) => s.resume)
  const setSummary = useResume((s) => s.setSummary)

  return (
    <SectionShell section="summary" first={first} last={last}>
      <TextArea
        label="Summary"
        rows={4}
        value={summary}
        onChange={(e) => setSummary(e.target.value)}
        placeholder="A 2-3 sentence pitch of who you are and the value you bring."
      />
      <div className="flex flex-wrap gap-1">
        <AiAssist
          label="Improve with AI"
          disabled={!summary.trim()}
          run={() => improveText(summary, 'professional resume summary')}
          onApply={setSummary}
        />
        <AiAssist
          label="Generate from resume"
          run={() => generateSummary(resume)}
          onApply={setSummary}
        />
      </div>
    </SectionShell>
  )
}

function AddButton({ label, onClick }: { label: string; onClick: () => void }) {
  return (
    <Button variant="secondary" className="w-full justify-center border-dashed" onClick={onClick}>
      <Plus size={14} /> {label}
    </Button>
  )
}

const splitLines = (v: string) => v.split('\n')
const nonEmptyLines = (v: string[]) => v.filter((l) => l.trim() !== '')

function ExperienceEditor({ first, last }: { first: boolean; last: boolean }) {
  const items = useResume((s) => s.resume.experience)
  const { addItem, updateItem, removeItem, moveItem } = useResume.getState()

  return (
    <SectionShell section="experience" first={first} last={last}>
      {items.map((it, i) => (
        <ItemCard
          key={it.id}
          title={it.position}
          subtitle={it.company}
          first={i === 0}
          last={i === items.length - 1}
          onMoveUp={() => moveItem('experience', it.id, -1)}
          onMoveDown={() => moveItem('experience', it.id, 1)}
          onRemove={() => removeItem('experience', it.id)}
        >
          <div className="grid grid-cols-2 gap-2.5">
            <Field label="Position" value={it.position} onChange={(e) => updateItem('experience', it.id, { position: e.target.value })} />
            <Field label="Company" value={it.company} onChange={(e) => updateItem('experience', it.id, { company: e.target.value })} />
            <Field label="Start date" placeholder="Jan 2022" value={it.startDate} onChange={(e) => updateItem('experience', it.id, { startDate: e.target.value })} />
            <Field label="End date" placeholder="Present" value={it.endDate} onChange={(e) => updateItem('experience', it.id, { endDate: e.target.value })} />
          </div>
          <Field label="Location" value={it.location} onChange={(e) => updateItem('experience', it.id, { location: e.target.value })} />
          <TextArea
            label="Achievements"
            hint="one bullet per line"
            rows={4}
            value={it.highlights.join('\n')}
            onChange={(e) => updateItem('experience', it.id, { highlights: splitLines(e.target.value) })}
          />
          <AiAssist
            label="Improve bullets with AI"
            disabled={it.highlights.join('').trim() === ''}
            run={() =>
              improveText(
                nonEmptyLines(it.highlights).join('\n'),
                `resume achievement bullets for a ${it.position || 'professional'} role at ${it.company || 'a company'}`,
              )
            }
            onApply={(text) => updateItem('experience', it.id, { highlights: nonEmptyLines(splitLines(text)) })}
          />
        </ItemCard>
      ))}
      <AddButton
        label="Add experience"
        onClick={() =>
          addItem('experience', {
            id: newId(),
            company: '',
            position: '',
            location: '',
            startDate: '',
            endDate: '',
            highlights: [],
          })
        }
      />
    </SectionShell>
  )
}

function EducationEditor({ first, last }: { first: boolean; last: boolean }) {
  const items = useResume((s) => s.resume.education)
  const { addItem, updateItem, removeItem, moveItem } = useResume.getState()

  return (
    <SectionShell section="education" first={first} last={last}>
      {items.map((it, i) => (
        <ItemCard
          key={it.id}
          title={it.institution}
          subtitle={[it.degree, it.field].filter(Boolean).join(' ')}
          first={i === 0}
          last={i === items.length - 1}
          onMoveUp={() => moveItem('education', it.id, -1)}
          onMoveDown={() => moveItem('education', it.id, 1)}
          onRemove={() => removeItem('education', it.id)}
        >
          <Field label="Institution" value={it.institution} onChange={(e) => updateItem('education', it.id, { institution: e.target.value })} />
          <div className="grid grid-cols-2 gap-2.5">
            <Field label="Degree" placeholder="B.S." value={it.degree} onChange={(e) => updateItem('education', it.id, { degree: e.target.value })} />
            <Field label="Field of study" value={it.field} onChange={(e) => updateItem('education', it.id, { field: e.target.value })} />
            <Field label="Start" value={it.startDate} onChange={(e) => updateItem('education', it.id, { startDate: e.target.value })} />
            <Field label="End" value={it.endDate} onChange={(e) => updateItem('education', it.id, { endDate: e.target.value })} />
            <Field label="Location" value={it.location} onChange={(e) => updateItem('education', it.id, { location: e.target.value })} />
            <Field label="Score / GPA" value={it.score} onChange={(e) => updateItem('education', it.id, { score: e.target.value })} />
          </div>
        </ItemCard>
      ))}
      <AddButton
        label="Add education"
        onClick={() =>
          addItem('education', {
            id: newId(),
            institution: '',
            degree: '',
            field: '',
            location: '',
            startDate: '',
            endDate: '',
            score: '',
          })
        }
      />
    </SectionShell>
  )
}

function ProjectsEditor({ first, last }: { first: boolean; last: boolean }) {
  const items = useResume((s) => s.resume.projects)
  const { addItem, updateItem, removeItem, moveItem } = useResume.getState()

  return (
    <SectionShell section="projects" first={first} last={last}>
      {items.map((it, i) => (
        <ItemCard
          key={it.id}
          title={it.name}
          first={i === 0}
          last={i === items.length - 1}
          onMoveUp={() => moveItem('projects', it.id, -1)}
          onMoveDown={() => moveItem('projects', it.id, 1)}
          onRemove={() => removeItem('projects', it.id)}
        >
          <div className="grid grid-cols-2 gap-2.5">
            <Field label="Name" value={it.name} onChange={(e) => updateItem('projects', it.id, { name: e.target.value })} />
            <Field label="URL" value={it.url} onChange={(e) => updateItem('projects', it.id, { url: e.target.value })} />
          </div>
          <Field label="Description" value={it.description} onChange={(e) => updateItem('projects', it.id, { description: e.target.value })} />
          <TextArea
            label="Highlights"
            hint="one bullet per line"
            rows={3}
            value={it.highlights.join('\n')}
            onChange={(e) => updateItem('projects', it.id, { highlights: splitLines(e.target.value) })}
          />
        </ItemCard>
      ))}
      <AddButton
        label="Add project"
        onClick={() => addItem('projects', { id: newId(), name: '', url: '', description: '', highlights: [] })}
      />
    </SectionShell>
  )
}

function SkillsEditor({ first, last }: { first: boolean; last: boolean }) {
  const items = useResume((s) => s.resume.skills)
  const { addItem, updateItem, removeItem, moveItem } = useResume.getState()

  return (
    <SectionShell section="skills" first={first} last={last}>
      {items.map((it, i) => (
        <ItemCard
          key={it.id}
          title={it.category}
          subtitle={`${it.skills.filter((s) => s.trim()).length} skills`}
          first={i === 0}
          last={i === items.length - 1}
          onMoveUp={() => moveItem('skills', it.id, -1)}
          onMoveDown={() => moveItem('skills', it.id, 1)}
          onRemove={() => removeItem('skills', it.id)}
        >
          <Field label="Category" placeholder="Languages" value={it.category} onChange={(e) => updateItem('skills', it.id, { category: e.target.value })} />
          <TextArea
            label="Skills"
            hint="comma separated"
            rows={2}
            value={it.skills.join(', ')}
            onChange={(e) => updateItem('skills', it.id, { skills: e.target.value.split(',').map((s) => s.trimStart()) })}
          />
        </ItemCard>
      ))}
      <AddButton
        label="Add skill group"
        onClick={() => addItem('skills', { id: newId(), category: '', skills: [] })}
      />
    </SectionShell>
  )
}

function CertificationsEditor({ first, last }: { first: boolean; last: boolean }) {
  const items = useResume((s) => s.resume.certifications)
  const { addItem, updateItem, removeItem, moveItem } = useResume.getState()

  return (
    <SectionShell section="certifications" first={first} last={last}>
      {items.map((it, i) => (
        <ItemCard
          key={it.id}
          title={it.name}
          subtitle={it.issuer}
          first={i === 0}
          last={i === items.length - 1}
          onMoveUp={() => moveItem('certifications', it.id, -1)}
          onMoveDown={() => moveItem('certifications', it.id, 1)}
          onRemove={() => removeItem('certifications', it.id)}
        >
          <Field label="Name" value={it.name} onChange={(e) => updateItem('certifications', it.id, { name: e.target.value })} />
          <div className="grid grid-cols-2 gap-2.5">
            <Field label="Issuer" value={it.issuer} onChange={(e) => updateItem('certifications', it.id, { issuer: e.target.value })} />
            <Field label="Date" value={it.date} onChange={(e) => updateItem('certifications', it.id, { date: e.target.value })} />
          </div>
          <Field label="URL" value={it.url} onChange={(e) => updateItem('certifications', it.id, { url: e.target.value })} />
        </ItemCard>
      ))}
      <AddButton
        label="Add certification"
        onClick={() => addItem('certifications', { id: newId(), name: '', issuer: '', date: '', url: '' })}
      />
    </SectionShell>
  )
}

function LanguagesEditor({ first, last }: { first: boolean; last: boolean }) {
  const items = useResume((s) => s.resume.languages)
  const { addItem, updateItem, removeItem, moveItem } = useResume.getState()

  return (
    <SectionShell section="languages" first={first} last={last}>
      {items.map((it, i) => (
        <ItemCard
          key={it.id}
          title={it.name}
          subtitle={it.fluency}
          first={i === 0}
          last={i === items.length - 1}
          onMoveUp={() => moveItem('languages', it.id, -1)}
          onMoveDown={() => moveItem('languages', it.id, 1)}
          onRemove={() => removeItem('languages', it.id)}
        >
          <div className="grid grid-cols-2 gap-2.5">
            <Field label="Language" value={it.name} onChange={(e) => updateItem('languages', it.id, { name: e.target.value })} />
            <Field label="Fluency" placeholder="Native / Fluent / B2" value={it.fluency} onChange={(e) => updateItem('languages', it.id, { fluency: e.target.value })} />
          </div>
        </ItemCard>
      ))}
      <AddButton
        label="Add language"
        onClick={() => addItem('languages', { id: newId(), name: '', fluency: '' })}
      />
    </SectionShell>
  )
}
