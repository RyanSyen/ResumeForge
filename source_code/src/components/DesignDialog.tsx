import { X } from 'lucide-react'
import { useSettings } from '../store/settings'
import { FONTS } from '../lib/design'
import type { FontId, FontSizeId, LineHeightId, MarginId, SpacingId } from '../lib/design'
import type { PageFormatId } from '../lib/pageFormats'
import { Button } from './ui'

const FONT_SIZE_OPTIONS: { id: FontSizeId; label: string }[] = [
  { id: 's', label: 'S' },
  { id: 'm', label: 'M' },
  { id: 'l', label: 'L' },
]

const LINE_HEIGHT_OPTIONS: { id: LineHeightId; label: string }[] = [
  { id: 'compact', label: 'Compact' },
  { id: 'normal', label: 'Normal' },
  { id: 'relaxed', label: 'Relaxed' },
]

const SPACING_OPTIONS: { id: SpacingId; label: string }[] = [
  { id: 'compact', label: 'Compact' },
  { id: 'normal', label: 'Normal' },
  { id: 'relaxed', label: 'Relaxed' },
]

const MARGIN_OPTIONS: { id: MarginId; label: string }[] = [
  { id: 'narrow', label: 'Narrow' },
  { id: 'normal', label: 'Normal' },
  { id: 'wide', label: 'Wide' },
]

const PAGE_FORMAT_OPTIONS: { id: PageFormatId; label: string }[] = [
  { id: 'a4', label: 'A4' },
  { id: 'letter', label: 'US Letter' },
]

function SegmentedGroup<T extends string>({
  options,
  value,
  onChange,
}: {
  options: { id: T; label: string }[]
  value: T
  onChange: (id: T) => void
}) {
  return (
    <div className="flex overflow-hidden rounded-md border border-slate-300">
      {options.map((opt) => (
        <button
          key={opt.id}
          type="button"
          onClick={() => onChange(opt.id)}
          className={`flex-1 px-2 py-1.5 text-xs font-medium transition-colors ${
            value === opt.id ? 'bg-teal-600 text-white' : 'bg-white text-slate-600 hover:bg-slate-50'
          }`}
        >
          {opt.label}
        </button>
      ))}
    </div>
  )
}

export function DesignDialog() {
  const open = useSettings((s) => s.designPanelOpen)
  const close = useSettings((s) => s.closeDesignPanel)
  const fontFamily = useSettings((s) => s.fontFamily)
  const setFontFamily = useSettings((s) => s.setFontFamily)
  const fontSize = useSettings((s) => s.fontSize)
  const setFontSize = useSettings((s) => s.setFontSize)
  const lineHeight = useSettings((s) => s.lineHeight)
  const setLineHeight = useSettings((s) => s.setLineHeight)
  const sectionSpacing = useSettings((s) => s.sectionSpacing)
  const setSectionSpacing = useSettings((s) => s.setSectionSpacing)
  const pageMargins = useSettings((s) => s.pageMargins)
  const setPageMargins = useSettings((s) => s.setPageMargins)
  const pageFormat = useSettings((s) => s.pageFormat)
  const setPageFormat = useSettings((s) => s.setPageFormat)
  const resetDesignSettings = useSettings((s) => s.resetDesignSettings)

  if (!open) return null

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
          <h2 className="text-base font-semibold text-slate-900">Design</h2>
          <button type="button" onClick={close} className="rounded p-1 text-slate-400 hover:bg-slate-100 hover:text-slate-700">
            <X size={18} />
          </button>
        </div>

        <label className="mt-4 block">
          <span className="mb-1 block text-xs font-medium text-slate-600">Font</span>
          <select
            value={fontFamily}
            onChange={(e) => setFontFamily(e.target.value as FontId)}
            className="w-full rounded-md border border-slate-300 px-2 py-1.5 text-sm outline-none focus:border-teal-500"
          >
            {FONTS.map((f) => (
              <option key={f.id} value={f.id}>
                {f.label}
              </option>
            ))}
          </select>
        </label>

        <div className="mt-4">
          <span className="mb-1 block text-xs font-medium text-slate-600">Font size</span>
          <SegmentedGroup options={FONT_SIZE_OPTIONS} value={fontSize} onChange={setFontSize} />
        </div>

        <div className="mt-4">
          <span className="mb-1 block text-xs font-medium text-slate-600">Line height</span>
          <SegmentedGroup options={LINE_HEIGHT_OPTIONS} value={lineHeight} onChange={setLineHeight} />
        </div>

        <div className="mt-4">
          <span className="mb-1 block text-xs font-medium text-slate-600">Section spacing</span>
          <SegmentedGroup options={SPACING_OPTIONS} value={sectionSpacing} onChange={setSectionSpacing} />
        </div>

        <div className="mt-4">
          <span className="mb-1 block text-xs font-medium text-slate-600">Page margins</span>
          <SegmentedGroup options={MARGIN_OPTIONS} value={pageMargins} onChange={setPageMargins} />
        </div>

        <div className="mt-4">
          <span className="mb-1 block text-xs font-medium text-slate-600">Page format</span>
          <SegmentedGroup options={PAGE_FORMAT_OPTIONS} value={pageFormat} onChange={setPageFormat} />
        </div>

        <div className="mt-5 flex items-center justify-between">
          <Button variant="ghost" className="!text-xs" onClick={resetDesignSettings}>
            Reset to defaults
          </Button>
          <Button variant="primary" onClick={close}>
            Done
          </Button>
        </div>
      </div>
    </div>
  )
}
