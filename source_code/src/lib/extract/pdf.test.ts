import { readFileSync } from 'node:fs'
import { join } from 'node:path'
import { describe, expect, it } from 'vitest'
import { extractPdfText } from './pdf'

function fixture(name: string): File {
  const buf = readFileSync(join(__dirname, 'fixtures', name))
  return new File([buf], name, { type: 'application/pdf' })
}

describe('extractPdfText', () => {
  it('extracts text from a real single-column resume PDF', async () => {
    const text = await extractPdfText(fixture('sample-resume.pdf'))
    expect(text).toContain('Jordan Rivera')
    expect(text).toContain('Product Manager')
    expect(text).toContain('Bluewave Systems')
    expect(text).toContain('EDUCATION')
    expect(text).toContain('SKILLS')
  })

  it('throws a clear error when the PDF has no extractable text', async () => {
    // Minimal valid single-page PDF with no content stream text.
    const blankPdf = [
      '%PDF-1.4',
      '1 0 obj<< /Type /Catalog /Pages 2 0 R >>endobj',
      '2 0 obj<< /Type /Pages /Kids [3 0 R] /Count 1 >>endobj',
      '3 0 obj<< /Type /Page /Parent 2 0 R /MediaBox [0 0 612 792] >>endobj',
      'trailer<< /Root 1 0 R >>',
      '%%EOF',
    ].join('\n')
    const file = new File([blankPdf], 'blank.pdf', { type: 'application/pdf' })
    await expect(extractPdfText(file)).rejects.toThrow(/No text could be extracted/)
  })
})
