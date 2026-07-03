/**
 * A4 page height in px at 96dpi: 297mm * 96 / 25.4. Kept as a precise float
 * (not rounded) so page-break offsets don't drift across many pages.
 */
export const PAGE_HEIGHT_PX = (297 * 96) / 25.4

/**
 * CSS `zoom` on an ancestor scales a descendant's `getBoundingClientRect()` (confirmed
 * empirically; `scrollHeight` was NOT affected in Chromium, but that's an
 * implementation quirk, not a spec guarantee — measure via getBoundingClientRect and
 * normalize here instead of relying on it). Dividing by the live zoom factor recovers
 * the unscaled height so pagination math stays correct at any zoom level.
 */
export function normalizeHeight(observedHeightPx: number, zoom: number): number {
  return observedHeightPx / zoom
}

export function computePageCount(contentHeightPx: number): number {
  return Math.max(1, Math.ceil(contentHeightPx / PAGE_HEIGHT_PX))
}

export function computePageBreakOffsets(contentHeightPx: number): number[] {
  const pageCount = computePageCount(contentHeightPx)
  const offsets: number[] = []
  for (let i = 1; i < pageCount; i++) {
    offsets.push(i * PAGE_HEIGHT_PX)
  }
  return offsets
}

export function computeCurrentPage(scrollTopPx: number, pageCount: number): number {
  const page = Math.floor(scrollTopPx / PAGE_HEIGHT_PX) + 1
  return Math.min(Math.max(page, 1), pageCount)
}
