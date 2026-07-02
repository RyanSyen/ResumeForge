import { useRef } from 'react'
import { FileJson, FileText, Printer, RotateCcw, Settings2, Upload } from 'lucide-react'
import type { TemplateId } from '../types'
import { useResume } from '../store/resume'
import { useSettings } from '../store/settings'
import { exportResumeJson, importResumeJson } from '../lib/file'
import { Button } from './ui'

const ACCENTS = ['#0f766e', '#1d4ed8', '#7c3aed', '#be185d', '#b45309', '#334155']

export function Toolbar() {
  const resume = useResume((s) => s.resume)
  const setResume = useResume((s) => s.setResume)
  const loadSample = useResume((s) => s.loadSample)
  const reset = useResume((s) => s.reset)
  const { template, setTemplate, accent, setAccent, openSettings, apiKey } = useSettings()
  const fileRef = useRef<HTMLInputElement>(null)

  async function handleImport(file: File | undefined) {
    if (!file) return
    try {
      setResume(await importResumeJson(file))
    } catch (e) {
      alert(e instanceof Error ? e.message : 'Import failed.')
    }
  }

  return (
    <header className="flex items-center gap-3 border-b border-slate-200 bg-white px-4 py-2 print:hidden">
      <div className="flex items-center gap-2">
        <FileText size={20} className="text-teal-700" />
        <span className="text-sm font-bold tracking-tight text-slate-900">ResumeForge</span>
        <span className="rounded bg-violet-100 px-1.5 py-0.5 text-[10px] font-semibold text-violet-700">
          Gemini AI
        </span>
      </div>

      <div className="mx-2 h-5 w-px bg-slate-200" />

      <select
        value={template}
        onChange={(e) => setTemplate(e.target.value as TemplateId)}
        className="rounded-md border border-slate-300 px-2 py-1 text-xs font-medium text-slate-700 outline-none"
        title="Template"
      >
        <option value="modern">Modern</option>
        <option value="classic">Classic</option>
        <option value="compact">Compact</option>
      </select>

      <div className="flex items-center gap-1" title="Accent color">
        {ACCENTS.map((c) => (
          <button
            key={c}
            type="button"
            onClick={() => setAccent(c)}
            className={`h-5 w-5 rounded-full border-2 transition-transform hover:scale-110 ${
              accent === c ? 'border-slate-900' : 'border-transparent'
            }`}
            style={{ backgroundColor: c }}
            aria-label={`Accent ${c}`}
          />
        ))}
      </div>

      <div className="flex-1" />

      <Button variant="ghost" className="!text-xs" onClick={loadSample} title="Load sample resume">
        Sample
      </Button>
      <Button
        variant="ghost"
        className="!text-xs"
        onClick={() => {
          if (confirm('Clear the entire resume? This cannot be undone.')) reset()
        }}
        title="Start from scratch"
      >
        <RotateCcw size={13} /> Reset
      </Button>

      <div className="mx-1 h-5 w-px bg-slate-200" />

      <input
        ref={fileRef}
        type="file"
        accept="application/json"
        className="hidden"
        onChange={(e) => {
          handleImport(e.target.files?.[0])
          e.target.value = ''
        }}
      />
      <Button variant="secondary" className="!text-xs" onClick={() => fileRef.current?.click()}>
        <Upload size={13} /> Import
      </Button>
      <Button variant="secondary" className="!text-xs" onClick={() => exportResumeJson(resume)}>
        <FileJson size={13} /> Export
      </Button>
      <Button variant="primary" className="!text-xs" onClick={() => window.print()}>
        <Printer size={13} /> Download PDF
      </Button>

      <button
        type="button"
        onClick={openSettings}
        title="AI settings (Gemini API key)"
        className="relative rounded-md p-1.5 text-slate-500 hover:bg-slate-100 hover:text-slate-800"
      >
        <Settings2 size={17} />
        {!apiKey.trim() && (
          <span className="absolute -right-0.5 -top-0.5 h-2 w-2 rounded-full bg-amber-400" />
        )}
      </button>
    </header>
  )
}
