import { beforeEach, describe, expect, it } from 'vitest'
import { useResume, newId } from './resume'
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
