import { describe, expect, it } from 'vitest'
import { getPageDimensionsMm, getMarginsMm, mmToPx } from './pageFormats'

describe('getPageDimensionsMm', () => {
  it('returns A4 dimensions', () => {
    expect(getPageDimensionsMm('a4')).toEqual({ widthMm: 210, heightMm: 297 })
  })

  it('returns US Letter dimensions', () => {
    expect(getPageDimensionsMm('letter')).toEqual({ widthMm: 215.9, heightMm: 279.4 })
  })
})

describe('getMarginsMm', () => {
  it('returns increasing margin values for narrow/normal/wide', () => {
    const narrow = getMarginsMm('narrow')
    const normal = getMarginsMm('normal')
    const wide = getMarginsMm('wide')
    expect(narrow).toBeLessThan(normal)
    expect(normal).toBeLessThan(wide)
  })
})

describe('mmToPx', () => {
  it('converts mm to CSS px at 96dpi', () => {
    expect(mmToPx(25.4)).toBeCloseTo(96, 5)
  })
})
