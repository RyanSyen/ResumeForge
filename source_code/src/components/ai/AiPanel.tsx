import { useState } from 'react'
import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import { AlertCircle, Check, KeyRound, Loader2, Sparkles, Wand2 } from 'lucide-react'
import type { TailorResult } from '../../types'
import { newId, useResume } from '../../store/resume'
import { useSettings } from '../../store/settings'
import { MissingKeyError, tailorResume } from '../../lib/gemini'
import { Button } from '../ui'

interface AiStore {
  jobDescription: string
  result: TailorResult | null
  setJobDescription: (jd: string) => void
  setResult: (r: TailorResult | null) => void
}

const useAi = create<AiStore>()(
  persist(
    (set) => ({
      jobDescription: '',
      result: null,
      setJobDescription: (jobDescription) => set({ jobDescription }),
      setResult: (result) => set({ result }),
    }),
    { name: 'resume-builder:ai' },
  ),
)

export function AiPanel() {
  const { jobDescription, result, setJobDescription, setResult } = useAi()
  const resume = useResume((s) => s.resume)
  const hasKey = useSettings((s) => s.apiKey.trim() !== '')
  const openSettings = useSettings((s) => s.openSettings)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function analyze() {
    if (!hasKey) {
      openSettings()
      return
    }
    setLoading(true)
    setError(null)
    try {
      setResult(await tailorResume(resume, jobDescription))
    } catch (e) {
      if (e instanceof MissingKeyError) {
        openSettings()
      } else {
        setError(e instanceof Error ? e.message : 'AI request failed.')
      }
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="space-y-3 p-3">
      {!hasKey && (
        <div className="flex items-start gap-2.5 rounded-lg border border-amber-200 bg-amber-50 p-3">
          <KeyRound size={16} className="mt-0.5 shrink-0 text-amber-600" />
          <div className="text-xs text-amber-800">
            <p className="font-medium">Gemini API key required</p>
            <p className="mt-0.5">
              AI features call Google Gemini directly from your browser using your own free API key.
            </p>
            <Button variant="primary" className="mt-2 !py-1 !text-xs" onClick={openSettings}>
              Add API key
            </Button>
          </div>
        </div>
      )}

      <section className="rounded-lg border border-slate-200 bg-white p-3">
        <h3 className="text-sm font-semibold text-slate-800">Tailor to a job</h3>
        <p className="mt-0.5 text-xs text-slate-500">
          Paste the job description. Gemini scores the match, finds missing ATS keywords, and
          rewrites your summary and bullets for this role — you approve every change.
        </p>
        <textarea
          rows={8}
          value={jobDescription}
          onChange={(e) => setJobDescription(e.target.value)}
          placeholder="Paste the full job description here…"
          className="mt-2 w-full resize-y rounded-md border border-slate-300 px-2.5 py-1.5 text-sm outline-none focus:border-teal-500 focus:ring-2 focus:ring-teal-100"
        />
        <Button
          variant="primary"
          className="mt-2 w-full justify-center"
          disabled={loading || jobDescription.trim().length < 40}
          onClick={analyze}
        >
          {loading ? <Loader2 size={15} className="animate-spin" /> : <Wand2 size={15} />}
          {loading ? 'Analyzing with Gemini…' : 'Analyze & tailor resume'}
        </Button>
        {jobDescription.trim().length > 0 && jobDescription.trim().length < 40 && (
          <p className="mt-1.5 text-xs text-slate-400">Paste a fuller job description (at least a few sentences).</p>
        )}
        {error && (
          <div className="mt-2 flex items-start gap-2 rounded-md border border-red-200 bg-red-50 p-2.5 text-xs text-red-700">
            <AlertCircle size={14} className="mt-0.5 shrink-0" />
            {error}
          </div>
        )}
      </section>

      {result && <TailorResults result={result} />}
    </div>
  )
}

function TailorResults({ result }: { result: TailorResult }) {
  const scoreColor =
    result.matchScore >= 75 ? 'text-emerald-600' : result.matchScore >= 50 ? 'text-amber-600' : 'text-red-600'
  const barColor =
    result.matchScore >= 75 ? 'bg-emerald-500' : result.matchScore >= 50 ? 'bg-amber-500' : 'bg-red-500'

  return (
    <div className="space-y-3">
      <section className="rounded-lg border border-slate-200 bg-white p-3">
        <div className="flex items-baseline justify-between">
          <h3 className="text-sm font-semibold text-slate-800">Match score</h3>
          <span className={`text-xl font-bold tabular-nums ${scoreColor}`}>{result.matchScore}%</span>
        </div>
        <div className="mt-1.5 h-2 overflow-hidden rounded-full bg-slate-100">
          <div className={`h-full rounded-full ${barColor}`} style={{ width: `${result.matchScore}%` }} />
        </div>
        {result.matchedKeywords.length > 0 && (
          <KeywordChips label="Matched keywords" items={result.matchedKeywords} tone="green" />
        )}
        {result.missingKeywords.length > 0 && (
          <KeywordChips label="Missing keywords" items={result.missingKeywords} tone="amber" />
        )}
      </section>

      {result.summary && <SummarySuggestion text={result.summary} />}
      {result.skillsToAdd.length > 0 && <SkillsSuggestion skills={result.skillsToAdd} />}
      <ExperienceSuggestions items={result.experience} />

      {result.recommendations.length > 0 && (
        <section className="rounded-lg border border-slate-200 bg-white p-3">
          <h3 className="text-sm font-semibold text-slate-800">Recommendations</h3>
          <ul className="mt-1.5 list-disc space-y-1 pl-4 text-xs text-slate-600">
            {result.recommendations.map((r, i) => (
              <li key={i}>{r}</li>
            ))}
          </ul>
        </section>
      )}
    </div>
  )
}

function KeywordChips({ label, items, tone }: { label: string; items: string[]; tone: 'green' | 'amber' }) {
  const chip =
    tone === 'green'
      ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
      : 'bg-amber-50 text-amber-700 border-amber-200'
  return (
    <div className="mt-2.5">
      <p className="text-xs font-medium text-slate-600">{label}</p>
      <div className="mt-1 flex flex-wrap gap-1">
        {items.map((k) => (
          <span key={k} className={`rounded-full border px-2 py-0.5 text-[11px] ${chip}`}>
            {k}
          </span>
        ))}
      </div>
    </div>
  )
}

function ApplyCard({
  title,
  applied,
  onApply,
  children,
}: {
  title: string
  applied: boolean
  onApply: () => void
  children: React.ReactNode
}) {
  return (
    <section className="rounded-lg border border-violet-200 bg-white p-3">
      <div className="flex items-center justify-between gap-2">
        <h3 className="flex items-center gap-1.5 text-sm font-semibold text-slate-800">
          <Sparkles size={13} className="text-violet-500" /> {title}
        </h3>
        {applied ? (
          <span className="inline-flex items-center gap-1 text-xs font-medium text-emerald-600">
            <Check size={13} /> Applied
          </span>
        ) : (
          <Button variant="primary" className="!px-2.5 !py-1 !text-xs" onClick={onApply}>
            Apply
          </Button>
        )}
      </div>
      <div className="mt-1.5">{children}</div>
    </section>
  )
}

function SummarySuggestion({ text }: { text: string }) {
  const setSummary = useResume((s) => s.setSummary)
  const applied = useResume((s) => s.resume.summary === text)
  return (
    <ApplyCard title="Tailored summary" applied={applied} onApply={() => setSummary(text)}>
      <p className="text-xs leading-relaxed text-slate-600">{text}</p>
    </ApplyCard>
  )
}

function SkillsSuggestion({ skills }: { skills: string[] }) {
  const resume = useResume((s) => s.resume)
  const { addItem, updateItem } = useResume.getState()
  const existing = new Set(
    resume.skills.flatMap((g) => g.skills).map((s) => s.trim().toLowerCase()),
  )
  const missing = skills.filter((s) => !existing.has(s.trim().toLowerCase()))
  const applied = missing.length === 0

  function apply() {
    const first = resume.skills[0]
    if (first) {
      updateItem('skills', first.id, { skills: [...first.skills, ...missing] })
    } else {
      addItem('skills', { id: newId(), category: 'Skills', skills: missing })
    }
  }

  return (
    <ApplyCard title="Skills to add" applied={applied} onApply={apply}>
      <div className="flex flex-wrap gap-1">
        {skills.map((s) => (
          <span
            key={s}
            className="rounded-full border border-slate-200 bg-slate-50 px-2 py-0.5 text-[11px] text-slate-700"
          >
            {s}
          </span>
        ))}
      </div>
    </ApplyCard>
  )
}

function ExperienceSuggestions({ items }: { items: TailorResult['experience'] }) {
  const experience = useResume((s) => s.resume.experience)
  const updateItem = useResume((s) => s.updateItem)

  const valid = items
    .map((sug) => ({ sug, exp: experience.find((e) => e.id === sug.id) }))
    .filter((x) => x.exp && x.sug.highlights.length > 0)

  if (valid.length === 0) return null

  return (
    <>
      {valid.map(({ sug, exp }) => {
        const applied = JSON.stringify(exp!.highlights) === JSON.stringify(sug.highlights)
        return (
          <ApplyCard
            key={sug.id}
            title={`Rewritten bullets — ${exp!.position || exp!.company}`}
            applied={applied}
            onApply={() => updateItem('experience', sug.id, { highlights: sug.highlights })}
          >
            <ul className="list-disc space-y-1 pl-4 text-xs text-slate-600">
              {sug.highlights.map((h, i) => (
                <li key={i}>{h}</li>
              ))}
            </ul>
          </ApplyCard>
        )
      })}
    </>
  )
}
