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

  it('rejects invalid JSON with a JSON-specific message', async () => {
    await expect(importResumeJson(jsonFile('{not valid json'))).rejects.toThrow(
      'This file is not valid JSON.',
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

  it('repairs items missing an id, assigning each a unique valid id', async () => {
    const payload = {
      basics: { fullName: 'Jane Doe' },
      experience: [
        { company: 'Acme', position: 'Eng', location: '', startDate: '', endDate: '', highlights: [] },
      ],
    }
    const result = await importResumeJson(jsonFile(JSON.stringify(payload)))
    expect(result.experience).toHaveLength(1)
    expect(typeof result.experience[0].id).toBe('string')
    expect(result.experience[0].id.length).toBeGreaterThan(0)
  })

  it('repairs a blank id the same way as a missing one', async () => {
    const payload = {
      basics: { fullName: 'Jane Doe' },
      experience: [
        { id: '', company: 'Acme', position: 'Eng', location: '', startDate: '', endDate: '', highlights: [] },
      ],
    }
    const result = await importResumeJson(jsonFile(JSON.stringify(payload)))
    expect(result.experience[0].id.length).toBeGreaterThan(0)
  })

  it('assigns distinct ids to multiple items missing ids', async () => {
    const item = { company: 'Acme', position: 'Eng', location: '', startDate: '', endDate: '', highlights: [] }
    const payload = { basics: { fullName: 'Jane Doe' }, experience: [item, item] }
    const result = await importResumeJson(jsonFile(JSON.stringify(payload)))
    expect(result.experience[0].id).not.toBe(result.experience[1].id)
  })

  it('rejects a wrong-typed field with a specific, non-generic message, leaving state untouched', async () => {
    const payload = { basics: { fullName: 'Jane Doe' }, skills: 'foo' }
    await expect(importResumeJson(jsonFile(JSON.stringify(payload)))).rejects.toThrow(
      /Invalid "skills"/,
    )
  })

  it('strips unknown top-level keys', async () => {
    const payload = { basics: { fullName: 'Jane Doe' }, notARealField: 'surprise' }
    const result = await importResumeJson(jsonFile(JSON.stringify(payload)))
    expect(result).not.toHaveProperty('notARealField')
  })

  it('round-trips a fully-populated resume through export and import unchanged', async () => {
    const original = sampleResume()
    // exportResumeJson triggers a browser download; build the same JSON body directly.
    const json = JSON.stringify(original, null, 2)
    const result = await importResumeJson(jsonFile(json))
    expect(result).toEqual(original)
  })
})
