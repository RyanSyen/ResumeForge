import { afterEach, describe, expect, it, vi } from 'vitest'
import { importResumeJson } from './file'
import { emptyResume, sampleResume } from '../data/sample'

function jsonFile(content: string): File {
  return new File([content], 'resume.json', { type: 'application/json' })
}

afterEach(() => {
  vi.restoreAllMocks()
})

describe('importResumeJson', () => {
  it('resolves a fully-populated valid export', async () => {
    const sample = sampleResume()
    const result = await importResumeJson(jsonFile(JSON.stringify(sample)))
    expect(result).toEqual(sample)
  })

  it('fills in defaults for a payload missing optional sections', async () => {
    const minimal = { basics: { fullName: 'Jane Doe' } }
    const result = await importResumeJson(jsonFile(JSON.stringify(minimal)))
    expect(result.basics.fullName).toBe('Jane Doe')
    expect(result.basics.email).toBe('')
    expect(result.experience).toEqual([])
    expect(result.sectionOrder).toEqual(emptyResume().sectionOrder)
  })

  it('rejects invalid JSON', async () => {
    await expect(importResumeJson(jsonFile('{not valid json'))).rejects.toThrow(
      'This file is not a valid resume JSON export.',
    )
  })

  it('rejects a JSON object missing "basics"', async () => {
    await expect(importResumeJson(jsonFile(JSON.stringify({ summary: 'hi' })))).rejects.toThrow(
      'This file is not a valid resume JSON export.',
    )
  })

  it.each([
    ['a string', JSON.stringify('just a string')],
    ['an array', JSON.stringify(['a', 'b'])],
    ['null', JSON.stringify(null)],
  ])('rejects non-object JSON (%s)', async (_label, content) => {
    await expect(importResumeJson(jsonFile(content))).rejects.toThrow(
      'This file is not a valid resume JSON export.',
    )
  })

  it('rejects when the file cannot be read', async () => {
    const original = FileReader.prototype.readAsText
    FileReader.prototype.readAsText = function (this: FileReader) {
      this.onerror?.(new ProgressEvent('error') as unknown as ProgressEvent<FileReader>)
    }
    try {
      await expect(importResumeJson(jsonFile('{}'))).rejects.toThrow('Could not read the file.')
    } finally {
      FileReader.prototype.readAsText = original
    }
  })
})
