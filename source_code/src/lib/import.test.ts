import { readFileSync } from 'node:fs'
import { join } from 'node:path'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { ImportError, importResumeFile } from './import'
import * as extractModule from './extract'
import * as geminiModule from './gemini'
import { emptyResume } from '../data/sample'

afterEach(() => {
  vi.restoreAllMocks()
})

function file(name = 'resume.pdf'): File {
  return new File(['content'], name, { type: 'application/pdf' })
}

describe('importResumeFile', () => {
  it('resolves with the parsed ResumeData on success', async () => {
    vi.spyOn(extractModule, 'extractText').mockResolvedValue('Jane Doe, Engineer')
    const parsed = { ...emptyResume(), basics: { ...emptyResume().basics, fullName: 'Jane Doe' } }
    vi.spyOn(geminiModule, 'importResume').mockResolvedValue(parsed)

    const result = await importResumeFile(file())
    expect(result).toEqual(parsed)
  })

  it('tags an extraction failure with stage "extraction" and no raw text', async () => {
    vi.spyOn(extractModule, 'extractText').mockRejectedValue(new Error('No text could be extracted.'))
    const parseSpy = vi.spyOn(geminiModule, 'importResume')

    const err = await importResumeFile(file()).catch((e) => e)
    expect(err).toBeInstanceOf(ImportError)
    expect((err as ImportError).stage).toBe('extraction')
    expect((err as ImportError).message).toBe('No text could be extracted.')
    expect((err as ImportError).rawText).toBeUndefined()
    expect(parseSpy).not.toHaveBeenCalled()
  })

  it('tags an AI parsing failure with stage "parsing" and retains the raw extracted text', async () => {
    vi.spyOn(extractModule, 'extractText').mockResolvedValue('Jane Doe, Engineer')
    vi.spyOn(geminiModule, 'importResume').mockRejectedValue(new Error('Gemini rate limit reached.'))

    const err = await importResumeFile(file()).catch((e) => e)
    expect(err).toBeInstanceOf(ImportError)
    expect((err as ImportError).stage).toBe('parsing')
    expect((err as ImportError).message).toBe('Gemini rate limit reached.')
    expect((err as ImportError).rawText).toBe('Jane Doe, Engineer')
  })

  it('never imports the resume store — orchestration is pure data-in/data-out', () => {
    const source = readFileSync(join(__dirname, 'import.ts'), 'utf-8')
    expect(source).not.toMatch(/store\/resume/)
  })
})
