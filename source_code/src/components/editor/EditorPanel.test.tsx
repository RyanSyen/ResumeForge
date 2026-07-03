import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { cleanup, fireEvent, render, screen } from '@testing-library/react'
import { EditorPanel } from './EditorPanel'
import { useResume } from '../../store/resume'

beforeEach(() => {
  useResume.getState().reset()
})

afterEach(() => {
  cleanup()
})

describe('custom sections in the editor', () => {
  it('adds a custom section, renames it, and adds/edits/reorders/removes items', () => {
    render(<EditorPanel />)

    fireEvent.click(screen.getByText('Add custom section'))
    expect(useResume.getState().resume.customSections).toHaveLength(1)

    const nameField = screen.getByLabelText('Section name') as HTMLInputElement
    expect(nameField.value).toBe('Untitled Section')
    fireEvent.change(nameField, { target: { value: 'Publications' } })
    expect(useResume.getState().resume.customSections[0].title).toBe('Publications')

    fireEvent.click(screen.getByText('Add item'))
    fireEvent.click(screen.getByText('Add item'))
    expect(useResume.getState().resume.customSections[0].items).toHaveLength(2)

    const [firstItemId, secondItemId] = useResume.getState().resume.customSections[0].items.map((it) => it.id)
    useResume.getState().updateCustomItem(useResume.getState().resume.customSections[0].id, firstItemId, {
      title: 'Paper A',
    })
    useResume.getState().updateCustomItem(useResume.getState().resume.customSections[0].id, secondItemId, {
      title: 'Paper B',
    })
    expect(useResume.getState().resume.customSections[0].items.map((it) => it.title)).toEqual(['Paper A', 'Paper B'])

    const sectionId = useResume.getState().resume.customSections[0].id
    useResume.getState().moveCustomItem(sectionId, secondItemId, -1)
    expect(useResume.getState().resume.customSections[0].items.map((it) => it.title)).toEqual(['Paper B', 'Paper A'])

    useResume.getState().removeCustomItem(sectionId, firstItemId)
    expect(useResume.getState().resume.customSections[0].items).toHaveLength(1)
  })

  it('deletes a custom section only after confirmation, leaving sectionOrder/hiddenSections clean', () => {
    useResume.getState().addCustomSection('Publications')
    const id = useResume.getState().resume.customSections[0].id
    useResume.getState().toggleSection(id)

    render(<EditorPanel />)

    const confirmSpy = vi.spyOn(window, 'confirm').mockReturnValueOnce(false)
    fireEvent.click(screen.getByTitle('Delete section'))
    expect(useResume.getState().resume.customSections).toHaveLength(1)

    confirmSpy.mockReturnValueOnce(true)
    fireEvent.click(screen.getByTitle('Delete section'))
    const { resume } = useResume.getState()
    expect(resume.customSections).toHaveLength(0)
    expect(resume.sectionOrder).not.toContain(id)
    expect(resume.hiddenSections).not.toContain(id)

    confirmSpy.mockRestore()
  })
})
