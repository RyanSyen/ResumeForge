import { describe, expect, it } from 'vitest'
import { parseResumeData, repairResumeData, SchemaError } from './schema'
import { emptyResume, sampleResume } from '../data/sample'

describe('parseResumeData', () => {
  it('passes a fully-populated valid resume through unchanged', () => {
    const sample = sampleResume()
    expect(parseResumeData(sample)).toEqual(sample)
  })

  it('repairs a missing item id', () => {
    const payload = {
      basics: emptyResume().basics,
      experience: [{ company: 'Acme', position: '', location: '', startDate: '', endDate: '', highlights: [] }],
    }
    const result = parseResumeData(payload)
    expect(result.experience[0].id).toBeTruthy()
  })

  it('throws a SchemaError naming the offending field for a wrong-typed value', () => {
    const payload = { basics: emptyResume().basics, skills: 'foo' }
    expect(() => parseResumeData(payload)).toThrow(SchemaError)
    expect(() => parseResumeData(payload)).toThrow(/"skills"/)
  })

  it('throws when basics is missing entirely', () => {
    expect(() => parseResumeData({ summary: 'hi' })).toThrow(SchemaError)
  })

  it('strips unknown top-level keys', () => {
    const payload = { basics: emptyResume().basics, bogus: 'nope' }
    const result = parseResumeData(payload) as unknown as Record<string, unknown>
    expect(result).not.toHaveProperty('bogus')
  })

  it('strips unknown item-level keys', () => {
    const payload = {
      basics: emptyResume().basics,
      experience: [
        { id: 'e1', company: 'Acme', position: '', location: '', startDate: '', endDate: '', highlights: [], extra: 'nope' },
      ],
    }
    const result = parseResumeData(payload) as unknown as { experience: Record<string, unknown>[] }
    expect(result.experience[0]).not.toHaveProperty('extra')
  })

  it('falls back to the default section order when present-but-empty', () => {
    const payload = { basics: emptyResume().basics, sectionOrder: [] }
    const result = parseResumeData(payload)
    expect(result.sectionOrder).toEqual(emptyResume().sectionOrder)
  })

  it('rejects an invalid section key in sectionOrder', () => {
    const payload = { basics: emptyResume().basics, sectionOrder: ['not-a-real-section'] }
    expect(() => parseResumeData(payload)).toThrow(SchemaError)
  })

  it('round-trips a resume with populated customSections unchanged', () => {
    const sample = sampleResume()
    expect(sample.customSections.length).toBeGreaterThan(0)
    expect(parseResumeData(sample)).toEqual(sample)
  })

  it('repairs a missing item id inside a custom section', () => {
    const payload = {
      basics: emptyResume().basics,
      customSections: [
        {
          id: 'cst-1',
          title: 'Publications',
          items: [{ title: 'Paper A', subtitle: '', date: '', description: '', bullets: [] }],
        },
      ],
      sectionOrder: [...emptyResume().sectionOrder, 'cst-1'],
    }
    const result = parseResumeData(payload)
    expect(result.customSections[0].items[0].id).toBeTruthy()
  })

  it('throws a SchemaError naming customSections for a wrong-typed value', () => {
    const payload = { basics: emptyResume().basics, customSections: 'not an array' }
    expect(() => parseResumeData(payload)).toThrow(SchemaError)
    expect(() => parseResumeData(payload)).toThrow(/"customSections"/)
  })

  it('rejects a sectionOrder entry that is neither a built-in key nor a known custom section id', () => {
    const payload = {
      basics: emptyResume().basics,
      customSections: [{ id: 'cst-1', title: 'Publications', items: [] }],
      sectionOrder: [...emptyResume().sectionOrder, 'cst-forged'],
    }
    expect(() => parseResumeData(payload)).toThrow(SchemaError)
  })

  it('rejects a hiddenSections entry that is not a known custom section id', () => {
    const payload = {
      basics: emptyResume().basics,
      hiddenSections: ['cst-forged'],
    }
    expect(() => parseResumeData(payload)).toThrow(SchemaError)
  })
})

describe('repairResumeData', () => {
  it('never throws, even on completely invalid input', () => {
    expect(() => repairResumeData(null)).not.toThrow()
    expect(() => repairResumeData('not an object')).not.toThrow()
    expect(() => repairResumeData(42)).not.toThrow()
    expect(() => repairResumeData({ skills: 'foo', experience: 'bar' })).not.toThrow()
  })

  it('returns a fully valid empty-shaped resume for garbage input', () => {
    const result = repairResumeData({ totally: 'unrelated' })
    expect(result.basics).toEqual(emptyResume().basics)
    expect(result.experience).toEqual([])
    expect(result.sectionOrder).toEqual(emptyResume().sectionOrder)
  })

  it('preserves valid fields while repairing only the invalid ones', () => {
    const result = repairResumeData({
      basics: { ...emptyResume().basics, fullName: 'Jane Doe' },
      skills: 'not an array', // invalid — should fall back
    })
    expect(result.basics.fullName).toBe('Jane Doe')
    expect(result.skills).toEqual([])
  })

  it('leaves an already-valid resume unchanged', () => {
    const sample = sampleResume()
    expect(repairResumeData(sample)).toEqual(sample)
  })

  it('repairs missing item ids without throwing', () => {
    const result = repairResumeData({
      basics: emptyResume().basics,
      experience: [{ company: 'Acme', position: '', location: '', startDate: '', endDate: '', highlights: [] }],
    })
    expect(result.experience[0].id).toBeTruthy()
  })

  it('falls back to an empty customSections array on garbage input', () => {
    const result = repairResumeData({ basics: emptyResume().basics, customSections: 'not an array' })
    expect(result.customSections).toEqual([])
  })

  it('drops a dangling section id from sectionOrder/hiddenSections instead of throwing', () => {
    const result = repairResumeData({
      basics: emptyResume().basics,
      sectionOrder: [...emptyResume().sectionOrder, 'cst-forged'],
      hiddenSections: ['cst-forged'],
    })
    expect(result.sectionOrder).not.toContain('cst-forged')
    expect(result.hiddenSections).not.toContain('cst-forged')
  })
})
