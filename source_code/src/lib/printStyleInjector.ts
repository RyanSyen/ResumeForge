import { getPageDimensionsMm, type PageFormatId } from './pageFormats'

const STYLE_ID = 'rf-print-page'

/**
 * `@page` cannot reliably reference CSS custom properties (CSS Paged Media spec
 * limitation) — so instead of a static stylesheet rule, we rewrite a single
 * `<style>` element in `<head>` with the literal `@page` rule whenever page
 * format/margins change. Safe to call repeatedly; it updates the same element.
 */
export function updatePrintPageStyle(format: PageFormatId, marginsMm: number): void {
  const { widthMm, heightMm } = getPageDimensionsMm(format)
  const css = `@page { size: ${widthMm}mm ${heightMm}mm; margin: ${marginsMm}mm; }`

  let el = document.getElementById(STYLE_ID) as HTMLStyleElement | null
  if (!el) {
    el = document.createElement('style')
    el.id = STYLE_ID
    document.head.appendChild(el)
  }
  el.textContent = css
}
