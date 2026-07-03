import type { ReactNode } from 'react'
import { ChevronDown, ChevronUp, Eye, EyeOff, Trash2 } from 'lucide-react'
import type { SectionId, SectionKey } from '../../types'
import { SECTION_LABELS } from '../../types'
import { useResume } from '../../store/resume'
import { IconButton } from '../ui'

export function SectionShell({
  section,
  label,
  first,
  last,
  children,
  actions,
  onDelete,
}: {
  section: SectionId
  label?: string
  first: boolean
  last: boolean
  children: ReactNode
  actions?: ReactNode
  onDelete?: () => void
}) {
  const hidden = useResume((s) => s.resume.hiddenSections.includes(section))
  const moveSection = useResume((s) => s.moveSection)
  const toggleSection = useResume((s) => s.toggleSection)

  return (
    <section className={`rounded-lg border border-slate-200 bg-white ${hidden ? 'opacity-60' : ''}`}>
      <header className="flex items-center gap-1 border-b border-slate-100 px-3 py-2">
        <h3 className="flex-1 text-sm font-semibold text-slate-800">
          {label ?? SECTION_LABELS[section as SectionKey]}
        </h3>
        {actions}
        <IconButton title="Move section up" disabled={first} onClick={() => moveSection(section, -1)}>
          <ChevronUp size={15} />
        </IconButton>
        <IconButton title="Move section down" disabled={last} onClick={() => moveSection(section, 1)}>
          <ChevronDown size={15} />
        </IconButton>
        <IconButton
          title={hidden ? 'Show section on resume' : 'Hide section from resume'}
          onClick={() => toggleSection(section)}
        >
          {hidden ? <EyeOff size={15} /> : <Eye size={15} />}
        </IconButton>
        {onDelete && (
          <IconButton title="Delete section" danger onClick={onDelete}>
            <Trash2 size={15} />
          </IconButton>
        )}
      </header>
      {!hidden && <div className="space-y-3 p-3">{children}</div>}
    </section>
  )
}

export function ItemCard({
  title,
  subtitle,
  first,
  last,
  onMoveUp,
  onMoveDown,
  onRemove,
  children,
}: {
  title: string
  subtitle?: string
  first: boolean
  last: boolean
  onMoveUp: () => void
  onMoveDown: () => void
  onRemove: () => void
  children: ReactNode
}) {
  return (
    <details className="group rounded-md border border-slate-200 bg-slate-50">
      <summary className="flex cursor-pointer list-none items-center gap-1 px-2.5 py-2 [&::-webkit-details-marker]:hidden">
        <ChevronDown
          size={14}
          className="shrink-0 text-slate-400 transition-transform group-open:rotate-180"
        />
        <span className="min-w-0 flex-1 truncate text-sm">
          <span className="font-medium text-slate-800">{title || 'Untitled'}</span>
          {subtitle && <span className="ml-1.5 text-xs text-slate-500">{subtitle}</span>}
        </span>
        <IconButton title="Move up" disabled={first} onClick={onMoveUp}>
          <ChevronUp size={14} />
        </IconButton>
        <IconButton title="Move down" disabled={last} onClick={onMoveDown}>
          <ChevronDown size={14} />
        </IconButton>
        <IconButton title="Delete" danger onClick={onRemove}>
          <Trash2 size={14} />
        </IconButton>
      </summary>
      <div className="space-y-2.5 border-t border-slate-200 p-2.5">{children}</div>
    </details>
  )
}
