export async function extractPdfText(file: File): Promise<string> {
  const pdfjsLib = await import('pdfjs-dist/legacy/build/pdf.mjs')
  // Required in real browsers: PDFWorker#initialize reads `GlobalWorkerOptions.workerSrc`
  // via a getter that throws synchronously *before* its own try/catch if unset, so an
  // unconfigured workerSrc is NOT a safe way to force main-thread parsing there — it just
  // throws. Only set it when a real `Worker` exists: in Node/jsdom (no Worker), pdfjs's
  // `isNodeJS` check disables workers unconditionally and never reads workerSrc at all —
  // setting it there to an http(s) URL instead breaks the Node fake-worker path, which
  // resolves the module via a plain ESM import that can't fetch http(s) (see plan.md
  // Deviations). Vite resolves this to a fingerprinted asset URL in the browser build.
  if (typeof Worker !== 'undefined') {
    pdfjsLib.GlobalWorkerOptions.workerSrc = new URL(
      'pdfjs-dist/legacy/build/pdf.worker.mjs',
      import.meta.url,
    ).toString()
  }
  const data = new Uint8Array(await file.arrayBuffer())
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
