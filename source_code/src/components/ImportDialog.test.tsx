import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { cleanup, fireEvent, render, screen } from '@testing-library/react'
import { ImportDialog, openImportDialog, useImportDialog } from './ImportDialog'
import { useResume } from '../store/resume'
import { useSettings } from '../store/settings'
import { ImportError } from '../lib/import'
import * as importModule from '../lib/import'
import { emptyResume, sampleResume } from '../data/sample'

const settingsBefore = useSettings.getState()
const resumeBefore = useResume.getState().resume

beforeEach(() => {
  useSettings.setState({ apiKey: 'test-api-key', settingsOpen: false })
  useResume.setState({ resume: sampleResume() })
})

afterEach(() => {
  cleanup()
  useImportDialog.setState({ open: false })
  useSettings.setState(settingsBefore)
  useResume.setState({ resume: resumeBefore })
  vi.restoreAllMocks()
})

function fileInput(): HTMLInputElement {
  return document.querySelector('input[type="file"]') as HTMLInputElement
}

describe('ImportDialog', () => {
  it('renders nothing when closed', () => {
    const { container } = render(<ImportDialog />)
    expect(container.firstChild).toBeNull()
  })

  it('shows the API-key gate with no file picker when no key is configured', () => {
    useSettings.setState({ apiKey: '' })
    openImportDialog()
    render(<ImportDialog />)

    expect(screen.getByText('Gemini API key required')).toBeTruthy()
    expect(fileInput()).toBeNull()
  })

  it('clicking "Add API key" routes to Settings without attempting extraction', () => {
    useSettings.setState({ apiKey: '' })
    const spy = vi.spyOn(importModule, 'importResumeFile')
    openImportDialog()
    render(<ImportDialog />)

    fireEvent.click(screen.getByText('Add API key'))
    expect(useSettings.getState().settingsOpen).toBe(true)
    expect(spy).not.toHaveBeenCalled()
  })

  it('shows a preview summary before applying', async () => {
    const parsed = { ...emptyResume(), basics: { ...emptyResume().basics, fullName: 'Jane Doe' } }
    vi.spyOn(importModule, 'importResumeFile').mockResolvedValue(parsed)

    openImportDialog()
    render(<ImportDialog />)
    fireEvent.change(fileInput(), {
      target: { files: [new File(['content'], 'resume.pdf', { type: 'application/pdf' })] },
    })

    expect(await screen.findByText('Jane Doe')).toBeTruthy()
    expect(useResume.getState().resume.basics.fullName).not.toBe('Jane Doe')
  })

  it('cancel leaves the resume completely untouched', async () => {
    const parsed = { ...emptyResume(), basics: { ...emptyResume().basics, fullName: 'Jane Doe' } }
    vi.spyOn(importModule, 'importResumeFile').mockResolvedValue(parsed)
    const before = useResume.getState().resume

    openImportDialog()
    render(<ImportDialog />)
    fireEvent.change(fileInput(), {
      target: { files: [new File(['content'], 'resume.pdf', { type: 'application/pdf' })] },
    })
    await screen.findByText('Jane Doe')
    fireEvent.click(screen.getByText('Cancel'))

    expect(useResume.getState().resume).toEqual(before)
  })

  it('confirm applies the parsed resume via a single setResume call', async () => {
    const parsed = { ...emptyResume(), basics: { ...emptyResume().basics, fullName: 'Jane Doe' } }
    vi.spyOn(importModule, 'importResumeFile').mockResolvedValue(parsed)

    openImportDialog()
    render(<ImportDialog />)
    fireEvent.change(fileInput(), {
      target: { files: [new File(['content'], 'resume.pdf', { type: 'application/pdf' })] },
    })
    await screen.findByText('Jane Doe')
    fireEvent.click(screen.getByText('Replace resume'))

    expect(useResume.getState().resume).toEqual(parsed)
  })

  it('shows the raw extracted text alongside the error on AI-parsing failure', async () => {
    vi.spyOn(importModule, 'importResumeFile').mockRejectedValue(
      new ImportError('parsing', 'Gemini rate limit reached.', 'Jane Doe raw extracted text'),
    )
    const before = useResume.getState().resume

    openImportDialog()
    render(<ImportDialog />)
    fireEvent.change(fileInput(), {
      target: { files: [new File(['content'], 'resume.pdf', { type: 'application/pdf' })] },
    })

    expect(await screen.findByText('Gemini rate limit reached.')).toBeTruthy()
    const textarea = screen.getByDisplayValue('Jane Doe raw extracted text') as HTMLTextAreaElement
    expect(textarea.readOnly).toBe(true)
    expect(useResume.getState().resume).toEqual(before)
  })

  it('shows only the error, no raw text box, on an extraction failure', async () => {
    vi.spyOn(importModule, 'importResumeFile').mockRejectedValue(
      new ImportError('extraction', 'No text could be extracted from this PDF.'),
    )

    openImportDialog()
    render(<ImportDialog />)
    fireEvent.change(fileInput(), {
      target: { files: [new File(['content'], 'resume.pdf', { type: 'application/pdf' })] },
    })

    expect(await screen.findByText('No text could be extracted from this PDF.')).toBeTruthy()
    expect(document.querySelector('textarea')).toBeNull()
  })

  it('dialog root carries print:hidden', () => {
    openImportDialog()
    const { container } = render(<ImportDialog />)
    expect(container.querySelector('.print\\:hidden')).not.toBeNull()
  })
})
