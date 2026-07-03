import { getPageDimensionsMm, mmToPx, type PageFormatId } from './pageFormats'

/** A4 page height in px at 96dpi — kept for backward-compatible callers/tests. */
export const PAGE_HEIGHT_PX = mmToPx(297)

/**
 * Page height in px for a given format. Print margins are applied by the `@page`
 * rule at print time (outside this content box), so they don't factor into
 * on-screen pagination math — only the page format itself does.
 */
export function getPageHeightPx(format: PageFormatId): number {
  return mmToPx(getPageDimensionsMm(format).heightMm)
}

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

export function computePageCount(contentHeightPx: number, pageHeightPx: number = PAGE_HEIGHT_PX): number {
  return Math.max(1, Math.ceil(contentHeightPx / pageHeightPx))
}

export function computePageBreakOffsets(
  contentHeightPx: number,
  pageHeightPx: number = PAGE_HEIGHT_PX,
): number[] {
  const pageCount = computePageCount(contentHeightPx, pageHeightPx)
  const offsets: number[] = []
  for (let i = 1; i < pageCount; i++) {
    offsets.push(i * pageHeightPx)
  }
  return offsets
}

export function computeCurrentPage(
  scrollTopPx: number,
  pageCount: number,
  pageHeightPx: number = PAGE_HEIGHT_PX,
): number {
  const page = Math.floor(scrollTopPx / pageHeightPx) + 1
  return Math.min(Math.max(page, 1), pageCount)
}
