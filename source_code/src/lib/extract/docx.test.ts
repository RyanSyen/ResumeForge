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

  it('throws a clear error when the DOCX has no extractable text', async () => {
    const empty = new File(['not a real docx'], 'empty.docx', {
      type: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    })
    await expect(extractDocxText(empty)).rejects.toThrow()
  })
})
