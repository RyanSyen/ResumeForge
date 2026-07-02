import { describe, expect, it } from 'vitest'
import {
  PAGE_HEIGHT_PX,
  computeCurrentPage,
  computePageBreakOffsets,
  computePageCount,
  normalizeHeight,
} from './pagination'

describe('computePageCount', () => {
  it('returns 1 for zero-height content', () => {
    expect(computePageCount(0)).toBe(1)
  })

  it('returns 1 for content just under one page', () => {
    expect(computePageCount(PAGE_HEIGHT_PX - 1)).toBe(1)
  })

  it('returns 1 for content exactly at one page', () => {
    expect(computePageCount(PAGE_HEIGHT_PX)).toBe(1)
  })

  it('returns 2 for content just over one page', () => {
    expect(computePageCount(PAGE_HEIGHT_PX + 1)).toBe(2)
  })

  it('rounds up for multi-page content', () => {
    expect(computePageCount(PAGE_HEIGHT_PX * 2.5)).toBe(3)
  })
})

describe('computePageBreakOffsets', () => {
  it('returns no offsets for 1-page content', () => {
    expect(computePageBreakOffsets(PAGE_HEIGHT_PX)).toEqual([])
  })

  it('returns one offset for content spanning into page 2', () => {
    expect(computePageBreakOffsets(PAGE_HEIGHT_PX + 1)).toEqual([PAGE_HEIGHT_PX])
  })

  it('returns two offsets for 3-page content', () => {
    expect(computePageBreakOffsets(PAGE_HEIGHT_PX * 2.5)).toEqual([
      PAGE_HEIGHT_PX,
      PAGE_HEIGHT_PX * 2,
    ])
  })
})

describe('normalizeHeight', () => {
  it('is zoom-independent by construction', () => {
    expect(normalizeHeight(1000, 0.5)).toBe(2000)
    expect(normalizeHeight(1000, 1)).toBe(1000)
    expect(normalizeHeight(850, 0.85)).toBe(1000)
  })
})

describe('computeCurrentPage', () => {
  it('returns 1 at the top of a multi-page document', () => {
    expect(computeCurrentPage(0, 3)).toBe(1)
  })

  it('advances to page 2 once scrolled past the first page', () => {
    expect(computeCurrentPage(PAGE_HEIGHT_PX + 1, 3)).toBe(2)
  })

  it('clamps to pageCount when scrolled past the last page boundary', () => {
    expect(computeCurrentPage(PAGE_HEIGHT_PX * 10, 3)).toBe(3)
  })

  it('clamps to 1 for a single-page document', () => {
    expect(computeCurrentPage(0, 1)).toBe(1)
  })
})
