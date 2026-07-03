import { beforeEach, describe, expect, it } from 'vitest'
import { useResume, newId, migrateResumeState } from './resume'
import { emptyResume, sampleResume } from '../data/sample'
import type { ResumeData } from '../types'

beforeEach(() => {
  useResume.getState().reset()
})

describe('addItem', () => {
  it('appends an item to the target section', () => {
    const item = { id: newId(), company: 'Acme', position: 'Eng', location: '', startDate: '', endDate: '', highlights: [] }
    useResume.getState().addItem('experience', item)
    expect(useResume.getState().resume.experience).toEqual([item])
  })
})

describe('updateItem', () => {
  it('patches only the matching item, preserving other fields', () => {
    const item = { id: newId(), company: 'Acme', position: 'Eng', location: '', startDate: '', endDate: '', highlights: [] }
    useResume.getState().addItem('experience', item)
    useResume.getState().updateItem('experience', item.id, { position: 'Senior Eng' })
    const updated = useResume.getState().resume.experience[0]
    expect(updated.position).toBe('Senior Eng')
    expect(updated.company).toBe('Acme')
  })

  it('is a no-op when the id does not match any item', () => {
    const item = { id: newId(), company: 'Acme', position: 'Eng', location: '', startDate: '', endDate: '', highlights: [] }
    useResume.getState().addItem('experience', item)
    useResume.getState().updateItem('experience', 'missing-id', { position: 'Ghost' })
    expect(useResume.getState().resume.experience).toEqual([item])
  })
})

describe('removeItem', () => {
  it('removes only the matching item', () => {
    const a = { id: newId(), company: 'A', position: '', location: '', startDate: '', endDate: '', highlights: [] }
    const b = { id: newId(), company: 'B', position: '', location: '', startDate: '', endDate: '', highlights: [] }
    useResume.getState().addItem('experience', a)
    useResume.getState().addItem('experience', b)
    useResume.getState().removeItem('experience', a.id)
    expect(useResume.getState().resume.experience).toEqual([b])
  })
})

describe('moveItem', () => {
  const mk = (label: string) => ({ id: newId(), company: label, position: '', location: '', startDate: '', endDate: '', highlights: [] })

  it('swaps a middle item with its neighbor', () => {
    const [a, b, c] = [mk('A'), mk('B'), mk('C')]
    useResume.getState().addItem('experience', a)
    useResume.getState().addItem('experience', b)
    useResume.getState().addItem('experience', c)
    useResume.getState().moveItem('experience', b.id, -1)
    expect(useResume.getState().resume.experience.map((e) => e.company)).toEqual(['B', 'A', 'C'])
  })

  it('is a no-op moving the first item up', () => {
    const [a, b] = [mk('A'), mk('B')]
    useResume.getState().addItem('experience', a)
    useResume.getState().addItem('experience', b)
    useResume.getState().moveItem('experience', a.id, -1)
    expect(useResume.getState().resume.experience.map((e) => e.company)).toEqual(['A', 'B'])
  })

  it('is a no-op moving the last item down', () => {
    const [a, b] = [mk('A'), mk('B')]
    useResume.getState().addItem('experience', a)
    useResume.getState().addItem('experience', b)
    useResume.getState().moveItem('experience', b.id, 1)
    expect(useResume.getState().resume.experience.map((e) => e.company)).toEqual(['A', 'B'])
  })
})

describe('moveSection', () => {
  it('swaps a middle section with its neighbor', () => {
    useResume.getState().moveSection('education', -1)
    expect(useResume.getState().resume.sectionOrder.slice(0, 3)).toEqual(['summary', 'education', 'experience'])
  })

  it('is a no-op moving the first section up', () => {
    const before = useResume.getState().resume.sectionOrder
    useResume.getState().moveSection('summary', -1)
    expect(useResume.getState().resume.sectionOrder).toEqual(before)
  })

  it('is a no-op moving the last section down', () => {
    const before = useResume.getState().resume.sectionOrder
    const last = before[before.length - 1]
    useResume.getState().moveSection(last, 1)
    expect(useResume.getState().resume.sectionOrder).toEqual(before)
  })
})

describe('toggleSection', () => {
  it('hides then un-hides a section (idempotent toggle)', () => {
    useResume.getState().toggleSection('projects')
    expect(useResume.getState().resume.hiddenSections).toContain('projects')
    useResume.getState().toggleSection('projects')
    expect(useResume.getState().resume.hiddenSections).not.toContain('projects')
  })
})

describe('reset', () => {
  it('returns the resume to empty defaults after mutations', () => {
    useResume.getState().setSummary('something')
    useResume.getState().reset()
    expect(useResume.getState().resume).toEqual(emptyResume())
  })
})

describe('setResume', () => {
  it('merges a partial payload over empty-resume defaults', () => {
    const partial = { basics: { fullName: 'Jane Doe' } } as unknown as ResumeData
    useResume.getState().setResume(partial)
    const result = useResume.getState().resume
    expect(result.basics.fullName).toBe('Jane Doe')
    expect(result.experience).toEqual([])
    expect(result.sectionOrder).toEqual(emptyResume().sectionOrder)
  })
})

describe('loadSample', () => {
  it('loads the sample resume', () => {
    useResume.getState().loadSample()
    expect(useResume.getState().resume).toEqual(sampleResume())
  })
})

describe('migrateResumeState', () => {
  it('passes through unchanged when already at the current version', () => {
    const state = { resume: sampleResume() }
    expect(migrateResumeState(state, 2)).toBe(state)
  })

  it('adds an empty customSections array when migrating a v1 payload that lacks it', () => {
    const { customSections: _drop, ...v1Resume } = sampleResume()
    const legacy = { resume: v1Resume as unknown as ResumeData }
    const result = migrateResumeState(legacy, 1)
    expect(result.resume.customSections).toEqual([])
    expect(result.resume.experience).toEqual(sampleResume().experience)
  })

  it('leaves an existing customSections array untouched when migrating a v1 payload', () => {
    const legacy = { resume: sampleResume() }
    const result = migrateResumeState(legacy, 1)
    expect(result.resume.customSections).toEqual(sampleResume().customSections)
  })

  it('repairs a versionless payload (pre-F-002 localStorage shape) without data loss', () => {
    const legacy = { resume: sampleResume() }
    const result = migrateResumeState(legacy, 0)
    expect(result.resume).toEqual(sampleResume())
  })

  it('never throws on a malformed versionless payload, yielding a valid resume', () => {
    const malformed = { resume: { basics: { fullName: 'Jane' }, skills: 'not an array' } }
    const result = migrateResumeState(malformed, 0)
    expect(result.resume.basics.fullName).toBe('Jane')
    expect(result.resume.skills).toEqual([])
  })

  it('produces a fully valid empty resume when persisted state is missing entirely', () => {
    const result = migrateResumeState(undefined, 0)
    expect(result.resume).toEqual(emptyResume())
  })
})

describe('custom sections', () => {
  it('addCustomSection creates a section and appends its id to sectionOrder', () => {
    useResume.getState().addCustomSection('Publications')
    const { resume } = useResume.getState()
    expect(resume.customSections).toHaveLength(1)
    const section = resume.customSections[0]
    expect(section.title).toBe('Publications')
    expect(section.items).toEqual([])
    expect(resume.sectionOrder.at(-1)).toBe(section.id)
  })

  it('renameCustomSection patches only the title of the matching section', () => {
    useResume.getState().addCustomSection('Publications')
    const id = useResume.getState().resume.customSections[0].id
    useResume.getState().renameCustomSection(id, 'Talks')
    expect(useResume.getState().resume.customSections[0].title).toBe('Talks')
  })

  it('removeCustomSection removes the section and strips its id from sectionOrder and hiddenSections', () => {
    useResume.getState().addCustomSection('Publications')
    const id = useResume.getState().resume.customSections[0].id
    useResume.getState().toggleSection(id)
    expect(useResume.getState().resume.hiddenSections).toContain(id)

    useResume.getState().removeCustomSection(id)
    const { resume } = useResume.getState()
    expect(resume.customSections).toEqual([])
    expect(resume.sectionOrder).not.toContain(id)
    expect(resume.hiddenSections).not.toContain(id)
  })

  it('moveSection and toggleSection work when passed a custom section id', () => {
    useResume.getState().addCustomSection('Publications')
    const id = useResume.getState().resume.customSections[0].id
    const before = useResume.getState().resume.sectionOrder
    useResume.getState().moveSection(id, -1)
    expect(useResume.getState().resume.sectionOrder.at(-1)).toBe(before.at(-2))
    expect(useResume.getState().resume.sectionOrder.at(-2)).toBe(id)
  })

  describe('custom items', () => {
    function withSection() {
      useResume.getState().addCustomSection('Publications')
      return useResume.getState().resume.customSections[0].id
    }
    const mk = (title: string) => ({ id: newId(), title, subtitle: '', date: '', description: '', bullets: [] })

    it('addCustomItem appends an item to the section', () => {
      const sectionId = withSection()
      const item = mk('Paper A')
      useResume.getState().addCustomItem(sectionId, item)
      expect(useResume.getState().resume.customSections[0].items).toEqual([item])
    })

    it('updateCustomItem patches only the matching item, preserving other fields', () => {
      const sectionId = withSection()
      const item = mk('Paper A')
      useResume.getState().addCustomItem(sectionId, item)
      useResume.getState().updateCustomItem(sectionId, item.id, { subtitle: 'IEEE' })
      const updated = useResume.getState().resume.customSections[0].items[0]
      expect(updated.subtitle).toBe('IEEE')
      expect(updated.title).toBe('Paper A')
    })

    it('updateCustomItem is a no-op when the id does not match any item', () => {
      const sectionId = withSection()
      const item = mk('Paper A')
      useResume.getState().addCustomItem(sectionId, item)
      useResume.getState().updateCustomItem(sectionId, 'missing-id', { title: 'Ghost' })
      expect(useResume.getState().resume.customSections[0].items).toEqual([item])
    })

    it('removeCustomItem removes only the matching item', () => {
      const sectionId = withSection()
      const a = mk('A')
      const b = mk('B')
      useResume.getState().addCustomItem(sectionId, a)
      useResume.getState().addCustomItem(sectionId, b)
      useResume.getState().removeCustomItem(sectionId, a.id)
      expect(useResume.getState().resume.customSections[0].items).toEqual([b])
    })

    it('moveCustomItem swaps a middle item with its neighbor', () => {
      const sectionId = withSection()
      const [a, b, c] = [mk('A'), mk('B'), mk('C')]
      useResume.getState().addCustomItem(sectionId, a)
      useResume.getState().addCustomItem(sectionId, b)
      useResume.getState().addCustomItem(sectionId, c)
      useResume.getState().moveCustomItem(sectionId, b.id, -1)
      expect(useResume.getState().resume.customSections[0].items.map((it) => it.title)).toEqual(['B', 'A', 'C'])
    })

    it('moveCustomItem is a no-op moving the first item up', () => {
      const sectionId = withSection()
      const [a, b] = [mk('A'), mk('B')]
      useResume.getState().addCustomItem(sectionId, a)
      useResume.getState().addCustomItem(sectionId, b)
      useResume.getState().moveCustomItem(sectionId, a.id, -1)
      expect(useResume.getState().resume.customSections[0].items.map((it) => it.title)).toEqual(['A', 'B'])
    })

    it('moveCustomItem is a no-op moving the last item down', () => {
      const sectionId = withSection()
      const [a, b] = [mk('A'), mk('B')]
      useResume.getState().addCustomItem(sectionId, a)
      useResume.getState().addCustomItem(sectionId, b)
      useResume.getState().moveCustomItem(sectionId, b.id, 1)
      expect(useResume.getState().resume.customSections[0].items.map((it) => it.title)).toEqual(['A', 'B'])
    })
  })
})
