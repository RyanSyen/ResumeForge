import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { act, cleanup, render, screen } from '@testing-library/react'
import { Preview } from './Preview'

type ResizeCallback = (entries: ResizeObserverEntry[]) => void

let observedCallback: ResizeCallback | null = null

class FakeResizeObserver {
  constructor(callback: ResizeCallback) {
    observedCallback = callback
  }
  observe() {}
  disconnect() {}
  unobserve() {}
}

beforeEach(() => {
  observedCallback = null
  vi.stubGlobal('ResizeObserver', FakeResizeObserver)
})

afterEach(() => {
  cleanup()
  vi.unstubAllGlobals()
})

describe('Preview pagination indicator', () => {
  it('does not show a page indicator or break lines for single-page content', () => {
    render(<Preview />)
    expect(screen.queryByText(/Page \d+ of \d+/)).toBeNull()
  })

  it('shows a print:hidden page indicator and break line once content spans multiple pages', () => {
    render(<Preview />)
    const page = document.getElementById('resume-page')!
    vi.spyOn(page, 'getBoundingClientRect').mockReturnValue({
      height: 2500,
    } as DOMRect)

    act(() => {
      observedCallback?.([])
    })

    const badge = screen.getByText(/Page \d+ of \d+/)
    expect(badge.closest('.print\\:hidden')).not.toBeNull()
    expect(badge.textContent).toMatch(/Page 1 of \d+/)

    const breakLine = document.querySelector('.print\\:hidden.border-dashed')
    expect(breakLine).not.toBeNull()
  })
})
