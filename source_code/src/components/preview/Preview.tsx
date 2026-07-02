import { useState } from 'react'
import { ZoomIn, ZoomOut } from 'lucide-react'
import { useResume } from '../../store/resume'
import { useSettings } from '../../store/settings'
import { ClassicTemplate, CompactTemplate, ModernTemplate } from './templates'
import { IconButton } from '../ui'

const TEMPLATES = {
  modern: ModernTemplate,
  classic: ClassicTemplate,
  compact: CompactTemplate,
} as const

export function Preview() {
  const resume = useResume((s) => s.resume)
  const template = useSettings((s) => s.template)
  const accent = useSettings((s) => s.accent)
  const [zoom, setZoom] = useState(0.85)

  const Template = TEMPLATES[template] ?? ModernTemplate

  return (
    <div className="relative flex-1 overflow-auto bg-slate-200/70 print:overflow-visible print:bg-white">
      <div className="fixed bottom-5 right-5 z-10 flex items-center gap-1 rounded-full border border-slate-200 bg-white px-2 py-1 shadow-md print:hidden">
        <IconButton title="Zoom out" onClick={() => setZoom((z) => Math.max(0.4, z - 0.1))}>
          <ZoomOut size={16} />
        </IconButton>
        <span className="w-10 text-center text-xs tabular-nums text-slate-600">
          {Math.round(zoom * 100)}%
        </span>
        <IconButton title="Zoom in" onClick={() => setZoom((z) => Math.min(1.5, z + 0.1))}>
          <ZoomIn size={16} />
        </IconButton>
      </div>
      <div className="flex justify-center p-8">
        <div id="preview-zoom" style={{ zoom }}>
          <div
            id="resume-page"
            className="bg-white text-gray-900 shadow-xl"
            style={{ width: '210mm', minHeight: '297mm' }}
          >
            <Template resume={resume} accent={accent} />
          </div>
        </div>
      </div>
    </div>
  )
}
