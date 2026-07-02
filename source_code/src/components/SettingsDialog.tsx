import { useState } from 'react'
import { Check, Eye, EyeOff, Loader2, X } from 'lucide-react'
import { GEMINI_MODELS, useSettings } from '../store/settings'
import { testConnection } from '../lib/gemini'
import { Button } from './ui'

export function SettingsDialog() {
  const open = useSettings((s) => s.settingsOpen)
  const close = useSettings((s) => s.closeSettings)
  const apiKey = useSettings((s) => s.apiKey)
  const setApiKey = useSettings((s) => s.setApiKey)
  const model = useSettings((s) => s.model)
  const setModel = useSettings((s) => s.setModel)

  const [showKey, setShowKey] = useState(false)
  const [testState, setTestState] = useState<'idle' | 'testing' | 'ok' | 'error'>('idle')
  const [testMessage, setTestMessage] = useState('')

  if (!open) return null

  async function runTest() {
    setTestState('testing')
    setTestMessage('')
    try {
      await testConnection()
      setTestState('ok')
    } catch (e) {
      setTestState('error')
      setTestMessage(e instanceof Error ? e.message : 'Connection failed.')
    }
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
          <h2 className="text-base font-semibold text-slate-900">AI Settings</h2>
          <button type="button" onClick={close} className="rounded p-1 text-slate-400 hover:bg-slate-100 hover:text-slate-700">
            <X size={18} />
          </button>
        </div>

        <label className="mt-4 block">
          <span className="mb-1 block text-xs font-medium text-slate-600">Gemini API key</span>
          <div className="relative">
            <input
              type={showKey ? 'text' : 'password'}
              value={apiKey}
              onChange={(e) => {
                setApiKey(e.target.value)
                setTestState('idle')
              }}
              placeholder="AIza…"
              autoComplete="off"
              className="w-full rounded-md border border-slate-300 px-2.5 py-1.5 pr-9 text-sm outline-none focus:border-teal-500 focus:ring-2 focus:ring-teal-100"
            />
            <button
              type="button"
              onClick={() => setShowKey((v) => !v)}
              className="absolute right-2 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
              title={showKey ? 'Hide key' : 'Show key'}
            >
              {showKey ? <EyeOff size={15} /> : <Eye size={15} />}
            </button>
          </div>
        </label>
        <p className="mt-1.5 text-xs text-slate-500">
          Get a free key at{' '}
          <a
            href="https://aistudio.google.com/apikey"
            target="_blank"
            rel="noreferrer"
            className="font-medium text-teal-700 underline"
          >
            aistudio.google.com/apikey
          </a>
          . Your key is stored only in this browser (localStorage) and sent directly to Google —
          never to any other server.
        </p>

        <label className="mt-4 block">
          <span className="mb-1 block text-xs font-medium text-slate-600">Model</span>
          <select
            value={model}
            onChange={(e) => setModel(e.target.value)}
            className="w-full rounded-md border border-slate-300 px-2 py-1.5 text-sm outline-none focus:border-teal-500"
          >
            {GEMINI_MODELS.map((m) => (
              <option key={m.id} value={m.id}>
                {m.label}
              </option>
            ))}
          </select>
        </label>

        <div className="mt-5 flex items-center gap-2">
          <Button variant="secondary" disabled={!apiKey.trim() || testState === 'testing'} onClick={runTest}>
            {testState === 'testing' && <Loader2 size={14} className="animate-spin" />}
            {testState === 'ok' && <Check size={14} className="text-emerald-600" />}
            Test connection
          </Button>
          <Button variant="primary" onClick={close}>
            Done
          </Button>
        </div>
        {testState === 'ok' && <p className="mt-2 text-xs text-emerald-600">Connected — Gemini responded successfully.</p>}
        {testState === 'error' && <p className="mt-2 text-xs text-red-600">{testMessage}</p>}
      </div>
    </div>
  )
}
