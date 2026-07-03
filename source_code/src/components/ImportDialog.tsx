import { useRef, useState } from 'react'
import { create } from 'zustand'
import { AlertCircle, FileUp, KeyRound, Loader2, ShieldCheck, X } from 'lucide-react'
import type { ResumeData } from '../types'
import { useResume } from '../store/resume'
import { useSettings } from '../store/settings'
import { ImportError, importResumeFile } from '../lib/import'
import { Button } from './ui'

interface ImportDialogStore {
  open: boolean
  openDialog: () => void
  closeDialog: () => void
}

export const useImportDialog = create<ImportDialogStore>((set) => ({
  open: false,
  openDialog: () => set({ open: true }),
  closeDialog: () => set({ open: false }),
}))

export const openImportDialog = () => useImportDialog.getState().openDialog()

type Stage = 'idle' | 'loading' | 'preview' | 'failure'

const ACCEPT = '.pdf,.docx,application/pdf,application/vnd.openxmlformats-officedocument.wordprocessingml.document'

export function ImportDialog() {
  const open = useImportDialog((s) => s.open)
  const closeDialog = useImportDialog((s) => s.closeDialog)
  const setResume = useResume((s) => s.setResume)
  const hasKey = useSettings((s) => s.apiKey.trim() !== '')
  const openSettings = useSettings((s) => s.openSettings)
  const fileRef = useRef<HTMLInputElement>(null)
  // Guards against a stale response overwriting newer state: the dialog stays mounted
  // (App.tsx renders it unconditionally) while `close`/`reset` reset local state
  // immediately, so an abandoned in-flight request from a prior file selection can
  // resolve after the user reopened the dialog and picked a different file.
  const requestIdRef = useRef(0)

  const [stage, setStage] = useState<Stage>('idle')
  const [parsed, setParsed] = useState<ResumeData | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [rawText, setRawText] = useState<string | null>(null)

  if (!open) return null

  function reset() {
    requestIdRef.current += 1
    setStage('idle')
    setParsed(null)
    setError(null)
    setRawText(null)
  }

  function close() {
    reset()
    closeDialog()
  }

  async function handleFile(file: File | undefined) {
    if (!file) return
    if (!hasKey) {
      openSettings()
      return
    }
    const requestId = ++requestIdRef.current
    setStage('loading')
    setError(null)
    setRawText(null)
    try {
      const resume = await importResumeFile(file)
      if (requestId !== requestIdRef.current) return
      setParsed(resume)
      setStage('preview')
    } catch (e) {
      if (requestId !== requestIdRef.current) return
      setError(e instanceof Error ? e.message : 'Import failed.')
      setRawText(e instanceof ImportError ? (e.rawText ?? null) : null)
      setStage('failure')
    }
  }

  function apply() {
    if (!parsed) return
    setResume(parsed)
    close()
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4 print:hidden"
      onClick={close}
    >
      <div
        className="w-full max-w-md rounded-xl bg-white p-5 shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between">
          <h2 className="text-base font-semibold text-slate-900">Import resume</h2>
          <button type="button" onClick={close} className="rounded p-1 text-slate-400 hover:bg-slate-100 hover:text-slate-700">
            <X size={18} />
          </button>
        </div>

        {!hasKey && (
          <div className="mt-4 flex items-start gap-2.5 rounded-lg border border-amber-200 bg-amber-50 p-3">
            <KeyRound size={16} className="mt-0.5 shrink-0 text-amber-600" />
            <div className="text-xs text-amber-800">
              <p className="font-medium">Gemini API key required</p>
              <p className="mt-0.5">Importing uses AI to structure your resume — add your key to continue.</p>
              <Button variant="primary" className="mt-2 !py-1 !text-xs" onClick={openSettings}>
                Add API key
              </Button>
            </div>
          </div>
        )}

        {hasKey && stage === 'idle' && (
          <div className="mt-4">
            <p className="text-xs text-slate-500">
              Upload a PDF or DOCX resume. Gemini reads the text and pre-fills a structured draft
              for you to review before anything is replaced.
            </p>
            <input
              ref={fileRef}
              type="file"
              accept={ACCEPT}
              className="hidden"
              onChange={(e) => {
                handleFile(e.target.files?.[0])
                e.target.value = ''
              }}
            />
            <Button
              variant="primary"
              className="mt-3 w-full justify-center"
              onClick={() => fileRef.current?.click()}
            >
              <FileUp size={15} /> Choose file
            </Button>
            <div className="mt-3 flex items-start gap-2 rounded-md border border-slate-200 bg-slate-50 p-2.5 text-xs text-slate-500">
              <ShieldCheck size={14} className="mt-0.5 shrink-0 text-slate-400" />
              Your file is sent only to Google's Gemini API from your browser — never to any other
              server.
            </div>
          </div>
        )}

        {stage === 'loading' && (
          <div className="mt-6 flex flex-col items-center gap-2 py-4 text-sm text-slate-500">
            <Loader2 size={20} className="animate-spin text-teal-600" />
            Extracting and parsing your resume…
          </div>
        )}

        {stage === 'preview' && parsed && (
          <div className="mt-4">
            <p className="text-sm text-slate-700">Replace your current resume with this?</p>
            <div className="mt-2 space-y-1 rounded-md border border-slate-200 bg-slate-50 p-3 text-xs text-slate-700">
              <p className="text-sm font-semibold text-slate-900">{parsed.basics.fullName || '(no name found)'}</p>
              {parsed.basics.headline && <p className="text-slate-500">{parsed.basics.headline}</p>}
              <ul className="mt-2 grid grid-cols-2 gap-x-4 gap-y-1">
                <li>Experience: {parsed.experience.length}</li>
                <li>Education: {parsed.education.length}</li>
                <li>Projects: {parsed.projects.length}</li>
                <li>Skill groups: {parsed.skills.length}</li>
                <li>Certifications: {parsed.certifications.length}</li>
                <li>Languages: {parsed.languages.length}</li>
              </ul>
            </div>
            <div className="mt-4 flex items-center gap-2">
              <Button variant="primary" onClick={apply}>
                Replace resume
              </Button>
              <Button variant="secondary" onClick={reset}>
                Cancel
              </Button>
            </div>
          </div>
        )}

        {stage === 'failure' && (
          <div className="mt-4">
            <div className="flex items-start gap-2 rounded-md border border-red-200 bg-red-50 p-2.5 text-xs text-red-700">
              <AlertCircle size={14} className="mt-0.5 shrink-0" />
              {error}
            </div>
            {rawText && (
              <div className="mt-3">
                <p className="mb-1 text-xs font-medium text-slate-600">
                  Extracted text — copy this if you'd like to fill in your resume manually:
                </p>
                <textarea
                  readOnly
                  value={rawText}
                  rows={8}
                  className="w-full resize-y rounded-md border border-slate-300 bg-slate-50 px-2.5 py-1.5 text-xs text-slate-700"
                />
              </div>
            )}
            <div className="mt-3 flex items-center gap-2">
              <Button variant="secondary" onClick={reset}>
                Try again
              </Button>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
