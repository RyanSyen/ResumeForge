import type { InputHTMLAttributes, ReactNode, TextareaHTMLAttributes } from 'react'
import { useState } from 'react'
import { Loader2, Sparkles } from 'lucide-react'

export function Field({
  label,
  ...props
}: { label: string } & InputHTMLAttributes<HTMLInputElement>) {
  return (
    <label className="block">
      <span className="mb-1 block text-xs font-medium text-slate-600">{label}</span>
      <input
        {...props}
        className="w-full rounded-md border border-slate-300 px-2.5 py-1.5 text-sm text-slate-900 outline-none focus:border-teal-500 focus:ring-2 focus:ring-teal-100"
      />
    </label>
  )
}

export function TextArea({
  label,
  hint,
  ...props
}: { label: string; hint?: string } & TextareaHTMLAttributes<HTMLTextAreaElement>) {
  return (
    <label className="block">
      <span className="mb-1 block text-xs font-medium text-slate-600">
        {label}
        {hint && <span className="ml-1 font-normal text-slate-400">— {hint}</span>}
      </span>
      <textarea
        {...props}
        className="w-full resize-y rounded-md border border-slate-300 px-2.5 py-1.5 text-sm text-slate-900 outline-none focus:border-teal-500 focus:ring-2 focus:ring-teal-100"
      />
    </label>
  )
}

export function Button({
  variant = 'secondary',
  className = '',
  ...props
}: {
  variant?: 'primary' | 'secondary' | 'ghost' | 'danger'
  className?: string
} & React.ButtonHTMLAttributes<HTMLButtonElement>) {
  const styles = {
    primary: 'bg-teal-700 text-white hover:bg-teal-800 disabled:bg-teal-300',
    secondary:
      'border border-slate-300 bg-white text-slate-700 hover:bg-slate-50 disabled:text-slate-300',
    ghost: 'text-slate-500 hover:bg-slate-100 hover:text-slate-800 disabled:text-slate-300',
    danger: 'text-red-500 hover:bg-red-50 hover:text-red-700',
  }[variant]
  return (
    <button
      type="button"
      {...props}
      className={`inline-flex items-center gap-1.5 rounded-md px-2.5 py-1.5 text-sm font-medium transition-colors disabled:cursor-not-allowed ${styles} ${className}`}
    />
  )
}

export function IconButton({
  title,
  onClick,
  disabled,
  danger,
  children,
}: {
  title: string
  onClick: () => void
  disabled?: boolean
  danger?: boolean
  children: ReactNode
}) {
  return (
    <button
      type="button"
      title={title}
      disabled={disabled}
      onClick={(e) => {
        e.preventDefault()
        e.stopPropagation()
        onClick()
      }}
      className={`rounded p-1 transition-colors disabled:cursor-not-allowed disabled:opacity-30 ${
        danger ? 'text-red-400 hover:bg-red-50 hover:text-red-600' : 'text-slate-400 hover:bg-slate-200 hover:text-slate-700'
      }`}
    >
      {children}
    </button>
  )
}

/**
 * Reusable AI assist affordance: runs an async text transform and shows the
 * suggestion inline with Apply/Discard so the user's text is never silently
 * overwritten.
 */
export function AiAssist({
  label,
  disabled,
  run,
  onApply,
}: {
  label: string
  disabled?: boolean
  run: () => Promise<string>
  onApply: (text: string) => void
}) {
  const [loading, setLoading] = useState(false)
  const [suggestion, setSuggestion] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)

  async function handleRun() {
    setLoading(true)
    setError(null)
    setSuggestion(null)
    try {
      setSuggestion(await run())
    } catch (e) {
      setError(e instanceof Error ? e.message : 'AI request failed.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div>
      <button
        type="button"
        onClick={handleRun}
        disabled={disabled || loading}
        className="inline-flex items-center gap-1 rounded-md px-2 py-1 text-xs font-medium text-violet-600 transition-colors hover:bg-violet-50 disabled:cursor-not-allowed disabled:opacity-40"
      >
        {loading ? <Loader2 size={13} className="animate-spin" /> : <Sparkles size={13} />}
        {loading ? 'Thinking…' : label}
      </button>
      {error && <p className="mt-1 text-xs text-red-600">{error}</p>}
      {suggestion !== null && (
        <div className="mt-2 rounded-md border border-violet-200 bg-violet-50 p-2.5">
          <p className="whitespace-pre-wrap text-xs text-slate-700">{suggestion}</p>
          <div className="mt-2 flex gap-2">
            <Button
              variant="primary"
              className="!px-2 !py-1 !text-xs"
              onClick={() => {
                onApply(suggestion)
                setSuggestion(null)
              }}
            >
              Apply
            </Button>
            <Button variant="ghost" className="!px-2 !py-1 !text-xs" onClick={() => setSuggestion(null)}>
              Discard
            </Button>
          </div>
        </div>
      )}
    </div>
  )
}
