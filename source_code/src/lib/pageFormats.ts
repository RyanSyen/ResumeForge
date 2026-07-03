import { MARGIN_SCALE, type MarginId } from './design'

export type PageFormatId = 'a4' | 'letter'

export interface PageDimensionsMm {
  widthMm: number
  heightMm: number
}

export const PAGE_FORMATS: Record<PageFormatId, PageDimensionsMm> = {
  a4: { widthMm: 210, heightMm: 297 },
  letter: { widthMm: 215.9, heightMm: 279.4 },
}

export function getPageDimensionsMm(format: PageFormatId): PageDimensionsMm {
  return PAGE_FORMATS[format]
}

const MM_PER_IN = 25.4
const CSS_PX_PER_IN = 96

export function mmToPx(mm: number): number {
  return (mm * CSS_PX_PER_IN) / MM_PER_IN
}

export function getMarginsMm(marginSetting: MarginId): number {
  return parseFloat(MARGIN_SCALE[marginSetting])
}

/**
 * CSS variables for the on-screen `#resume-page` box (width/height). Kept separate
 * from `getDesignCssVars` (typography/spacing) since page format is not a
 * "design" concern in the settings shape, but both land on the same element.
 */
export function getPageCssVars(format: PageFormatId): Record<string, string> {
  const { widthMm, heightMm } = getPageDimensionsMm(format)
  return {
    '--rf-page-width': `${widthMm}mm`,
    '--rf-page-height': `${heightMm}mm`,
  }
}
