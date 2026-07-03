import { useEffect, useState } from 'react'
import { computePageBreakOffsets, computePageCount, normalizeHeight } from '../../lib/pagination'

export function usePageCount(pageRef: React.RefObject<HTMLElement | null>, zoom: number) {
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

  return {
    pageCount: computePageCount(contentHeightPx),
    breakOffsets: computePageBreakOffsets(contentHeightPx),
  }
}
