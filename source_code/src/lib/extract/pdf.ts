export async function extractPdfText(file: File): Promise<string> {
  const pdfjsLib = await import('pdfjs-dist/legacy/build/pdf.mjs')
  const data = new Uint8Array(await file.arrayBuffer())
  // No `workerSrc` is configured: pdfjs-dist falls back to running its "fake worker" on
  // the main thread automatically (see PDFWorker#initialize's try/catch around
  // `new Worker(...)`), which is fine for the small resume files this feature handles
  // and avoids configuring worker asset bundling under Vite entirely.
  const doc = await pdfjsLib.getDocument({ data, verbosity: 0 }).promise

  const pages: string[] = []
  for (let i = 1; i <= doc.numPages; i++) {
    const page = await doc.getPage(i)
    const content = await page.getTextContent()
    pages.push(content.items.map((item) => ('str' in item ? item.str : '')).join(' '))
  }

  const text = pages.join('\n\n').trim()
  if (!text) {
    throw new Error(
      'No text could be extracted from this PDF — it may be a scanned image. Try a text-based PDF instead.',
    )
  }
  return text
}
