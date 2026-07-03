import { extractPdfText } from './pdf'
import { extractDocxText } from './docx'

const DOCX_MIME = 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'

export async function extractText(file: File): Promise<string> {
  const name = file.name.toLowerCase()
  if (file.type === 'application/pdf' || name.endsWith('.pdf')) {
    return extractPdfText(file)
  }
  if (file.type === DOCX_MIME || name.endsWith('.docx')) {
    return extractDocxText(file)
  }
  throw new Error('Unsupported file type. Please upload a PDF or DOCX resume.')
}
