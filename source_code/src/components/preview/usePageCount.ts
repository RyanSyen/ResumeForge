import { useEffect, useState } from 'react'
import { computePageBreakOffsets, computePageCount, getPageHeightPx, normalizeHeight } from '../../lib/pagination'
import type { PageFormatId } from '../../lib/pageFormats'

export function usePageCount(pageRef: React.RefObject<HTMLElement | null>, zoom: number, format: PageFormatId) {
  const [contentHeightPx, setContentHeightPx] = useState(0)

  useEffect(() => {
    const el = pageRef.current
    if (!el) return

    const measure = () => setContentHeightPx(normalizeHeight(el.getBoundingClientRect().height, zoom))
    measure()

    const observer = new ResizeObserver(measure)
    observer.observe(el)
    return () => observer.disconnect()
  }, [pageRef, zoom])

  const pageHeightPx = getPageHeightPx(format)
  return {
    pageCount: computePageCount(contentHeightPx, pageHeightPx),
    breakOffsets: computePageBreakOffsets(contentHeightPx, pageHeightPx),
  }
}
