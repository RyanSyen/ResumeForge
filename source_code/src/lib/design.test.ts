import { describe, expect, it } from 'vitest'
import { FONTS, getDesignCssVars } from './design'

describe('getDesignCssVars', () => {
  it('maps a default (M/normal/normal/normal) settings object to the expected variables', () => {
    const vars = getDesignCssVars({
      fontFamily: 'system-sans',
      fontSize: 'm',
      lineHeight: 'normal',
      sectionSpacing: 'normal',
      pageMargins: 'normal',
    })
    expect(vars).toEqual({
      '--rf-font-family': 'ui-sans-serif, system-ui, -apple-system, sans-serif',
      '--rf-font-size-base': '10.5px',
      '--rf-line-height': '1.4',
      '--rf-spacing-scale': '1',
      '--rf-page-margin': '15mm',
    })
  })

  it('maps every font id to a distinct stack', () => {
    for (const font of FONTS) {
      const vars = getDesignCssVars({
        fontFamily: font.id,
        fontSize: 'm',
        lineHeight: 'normal',
        sectionSpacing: 'normal',
        pageMargins: 'normal',
      })
      expect(vars['--rf-font-family']).toBe(font.stack)
    }
  })

  it('maps S and L font sizes to values on either side of M', () => {
    const s = getDesignCssVars({
      fontFamily: 'system-sans',
      fontSize: 's',
      lineHeight: 'normal',
      sectionSpacing: 'normal',
      pageMargins: 'normal',
    })
    const l = getDesignCssVars({
      fontFamily: 'system-sans',
      fontSize: 'l',
      lineHeight: 'normal',
      sectionSpacing: 'normal',
      pageMargins: 'normal',
    })
    expect(parseFloat(s['--rf-font-size-base'])).toBeLessThan(parseFloat(l['--rf-font-size-base']))
  })

  it('maps margin presets to increasing mm values', () => {
    const narrow = getDesignCssVars({
      fontFamily: 'system-sans',
      fontSize: 'm',
      lineHeight: 'normal',
      sectionSpacing: 'normal',
      pageMargins: 'narrow',
    })
    const wide = getDesignCssVars({
      fontFamily: 'system-sans',
      fontSize: 'm',
      lineHeight: 'normal',
      sectionSpacing: 'normal',
      pageMargins: 'wide',
    })
    expect(parseFloat(narrow['--rf-page-margin'])).toBeLessThan(parseFloat(wide['--rf-page-margin']))
  })

  it('every curated font stack terminates in a generic fallback family (offline-safe, AC3)', () => {
    for (const font of FONTS) {
      expect(font.stack).toMatch(/(sans-serif|serif)$/)
    }
  })
})
