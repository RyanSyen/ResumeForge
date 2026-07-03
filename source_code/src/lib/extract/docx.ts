interface NodeBufferGlobal {
  Buffer?: { from(data: ArrayBuffer): unknown }
}

export async function extractDocxText(file: File): Promise<string> {
  const mammoth = await import('mammoth')
  const arrayBuffer = await file.arrayBuffer()
  // mammoth's Node build reads `buffer`, its browser build reads `arrayBuffer` — pass both so
  // whichever variant a bundler/test-runner resolves to finds the field it expects. Reading
  // `Buffer` off `globalThis` (rather than the bare identifier) avoids needing Node's ambient
  // types in this browser-only tsconfig.
  const nodeBuffer = (globalThis as NodeBufferGlobal).Buffer
  const options = nodeBuffer ? { arrayBuffer, buffer: nodeBuffer.from(arrayBuffer) } : { arrayBuffer }

  let result: { value: string }
  try {
    result = await mammoth.extractRawText(options)
  } catch {
    // mammoth's own errors are JSZip internals ("Can't find end of central directory...",
    // with a link to JSZip's docs) — not useful to an end user, so normalize them.
    throw new Error('This file doesn\'t look like a valid DOCX. Try re-saving it from Word and uploading again.')
  }

  const text = result.value.trim()
  if (!text) {
    throw new Error('No text could be extracted from this DOCX file.')
  }
  return text
}
