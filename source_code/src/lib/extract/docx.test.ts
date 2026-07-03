import { readFileSync } from 'node:fs'
import { join } from 'node:path'
import { describe, expect, it } from 'vitest'
import { extractDocxText } from './docx'

function fixture(name: string): File {
  const buf = readFileSync(join(__dirname, 'fixtures', name))
  return new File([buf], name, {
    type: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  })
}

describe('extractDocxText', () => {
  it('extracts text from a real single-column resume DOCX', async () => {
    const text = await extractDocxText(fixture('sample-resume.docx'))
    expect(text).toContain('Jordan Rivera')
    expect(text).toContain('Product Manager')
    expect(text).toContain('Bluewave Systems')
    expect(text).toContain('EDUCATION')
    expect(text).toContain('SKILLS')
  })

  it('throws a friendly error when the file is not a valid DOCX (not a zip)', async () => {
    const notADocx = new File(['not a real docx'], 'not-a-docx.docx', {
      type: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    })
    await expect(extractDocxText(notADocx)).rejects.toThrow(
      "This file doesn't look like a valid DOCX. Try re-saving it from Word and uploading again.",
    )
  })

  it('throws a clear error when a valid DOCX has no extractable text', async () => {
    const text = await extractDocxText(fixture('empty-resume.docx')).catch((e) => e)
    expect(text).toBeInstanceOf(Error)
    expect(text.message).toBe('No text could be extracted from this DOCX file.')
  })
})
