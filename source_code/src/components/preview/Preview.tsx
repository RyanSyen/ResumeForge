import { useEffect, useRef, useState } from 'react'
import { ZoomIn, ZoomOut } from 'lucide-react'
import { useResume } from '../../store/resume'
import { useSettings } from '../../store/settings'
import { computeCurrentPage, getPageHeightPx } from '../../lib/pagination'
import { getDesignCssVars } from '../../lib/design'
import { getMarginsMm, getPageCssVars, getPageDimensionsMm } from '../../lib/pageFormats'
import { updatePrintPageStyle } from '../../lib/printStyleInjector'
import { ClassicTemplate, CompactTemplate, ModernTemplate } from './templates'
import { IconButton } from '../ui'
import { usePageCount } from './usePageCount'

const TEMPLATES = {
  modern: ModernTemplate,
  classic: ClassicTemplate,
  compact: CompactTemplate,
} as const

export function Preview() {
  const resume = useResume((s) => s.resume)
  const template = useSettings((s) => s.template)
  const accent = useSettings((s) => s.accent)
  const fontFamily = useSettings((s) => s.fontFamily)
  const fontSize = useSettings((s) => s.fontSize)
  const lineHeight = useSettings((s) => s.lineHeight)
  const sectionSpacing = useSettings((s) => s.sectionSpacing)
  const pageMargins = useSettings((s) => s.pageMargins)
  const pageFormat = useSettings((s) => s.pageFormat)
  const [zoom, setZoom] = useState(0.85)
  const [currentPage, setCurrentPage] = useState(1)
  const pageRef = useRef<HTMLDivElement>(null)
  const { pageCount, breakOffsets } = usePageCount(pageRef, zoom, pageFormat)

  const Template = TEMPLATES[template] ?? ModernTemplate
  const marginsMm = getMarginsMm(pageMargins)
  const { widthMm, heightMm } = getPageDimensionsMm(pageFormat)

  useEffect(() => {
    updatePrintPageStyle(pageFormat, marginsMm)
  }, [pageFormat, marginsMm])

  const pageStyle = {
    ...getDesignCssVars({ fontFamily, fontSize, lineHeight, sectionSpacing, pageMargins }),
    ...getPageCssVars(pageFormat),
    width: `${widthMm}mm`,
    minHeight: `${heightMm}mm`,
    fontFamily: 'var(--rf-font-family)',
  }

  return (
    <div
      className="relative flex-1 overflow-auto bg-slate-200/70 print:overflow-visible print:bg-white"
      onScroll={(e) =>
        setCurrentPage(
          computeCurrentPage(e.currentTarget.scrollTop / zoom, pageCount, getPageHeightPx(pageFormat)),
        )
      }
    >
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
      {pageCount > 1 && (
        <div className="fixed bottom-5 left-5 z-10 rounded-full border border-slate-200 bg-white px-3 py-1 text-xs text-slate-600 shadow-md print:hidden">
          Page {currentPage} of {pageCount}
        </div>
      )}
      <div className="flex justify-center p-8">
        <div id="preview-zoom" className="relative" style={{ zoom }}>
          {breakOffsets.map((offset) => (
            <div
              key={offset}
              className="pointer-events-none absolute left-0 right-0 z-10 border-t-2 border-dashed border-slate-400 print:hidden"
              style={{ top: offset }}
            />
          ))}
          <div id="resume-page" ref={pageRef} className="bg-white text-gray-900 shadow-xl" style={pageStyle}>
            <Template resume={resume} accent={accent} />
          </div>
        </div>
      </div>
    </div>
  )
}
