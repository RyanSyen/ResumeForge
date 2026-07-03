import { afterEach, describe, expect, it, vi } from 'vitest'
import { extractText } from './index'
import * as pdfModule from './pdf'
import * as docxModule from './docx'

afterEach(() => {
  vi.restoreAllMocks()
})

function file(name: string, type: string): File {
  return new File(['content'], name, { type })
}

describe('extractText', () => {
  it('dispatches PDF MIME type to extractPdfText', async () => {
    const spy = vi.spyOn(pdfModule, 'extractPdfText').mockResolvedValue('pdf text')
    const result = await extractText(file('resume.pdf', 'application/pdf'))
    expect(result).toBe('pdf text')
    expect(spy).toHaveBeenCalledOnce()
  })

  it('dispatches .pdf extension to extractPdfText when MIME type is missing', async () => {
    const spy = vi.spyOn(pdfModule, 'extractPdfText').mockResolvedValue('pdf text')
    const result = await extractText(file('resume.pdf', ''))
    expect(result).toBe('pdf text')
    expect(spy).toHaveBeenCalledOnce()
  })

  it('dispatches DOCX MIME type to extractDocxText', async () => {
    const spy = vi.spyOn(docxModule, 'extractDocxText').mockResolvedValue('docx text')
    const result = await extractText(
      file('resume.docx', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'),
    )
    expect(result).toBe('docx text')
    expect(spy).toHaveBeenCalledOnce()
  })

  it('dispatches .docx extension to extractDocxText when MIME type is missing', async () => {
    const spy = vi.spyOn(docxModule, 'extractDocxText').mockResolvedValue('docx text')
    const result = await extractText(file('resume.docx', ''))
    expect(result).toBe('docx text')
    expect(spy).toHaveBeenCalledOnce()
  })

  it('rejects unsupported file types', async () => {
    await expect(extractText(file('resume.txt', 'text/plain'))).rejects.toThrow(
      'Unsupported file type. Please upload a PDF or DOCX resume.',
    )
  })
})
