import { afterEach, describe, expect, it } from 'vitest'
import { cleanup, render, screen } from '@testing-library/react'
import { ClassicTemplate, CompactTemplate, ModernTemplate } from './templates'
import { sampleResume } from '../../data/sample'

afterEach(() => {
  cleanup()
})

const resume = sampleResume()
const props = { resume, accent: '#0f766e' }

describe.each([
  ['ModernTemplate', ModernTemplate],
  ['ClassicTemplate', ClassicTemplate],
  ['CompactTemplate', CompactTemplate],
])('%s custom section rendering', (_name, Template) => {
  it("renders the custom section's title and item content", () => {
    render(<Template {...props} />)
    const customSection = resume.customSections[0]
    expect(screen.getByText(customSection.title)).toBeTruthy()
    const item = customSection.items[0]
    expect(screen.getByText(item.title)).toBeTruthy()
    expect(screen.getByText(item.description)).toBeTruthy()
  })

  it('carries print-avoid-break classes on the custom section, matching built-in sections', () => {
    render(<Template {...props} />)
    const customSection = resume.customSections[0]
    const heading = screen.getByText(customSection.title)
    const sectionEl = heading.closest('.print-avoid-break')
    expect(sectionEl).not.toBeNull()
  })
})
