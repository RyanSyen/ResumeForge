export async function extractDocxText(file: File): Promise<string> {
  const mammoth = await import('mammoth')
  const arrayBuffer = await file.arrayBuffer()
  // mammoth's Node build reads `buffer`, its browser build reads `arrayBuffer` — pass both so
  // whichever variant a bundler/test-runner resolves to finds the field it expects.
  const options =
    typeof Buffer !== 'undefined'
      ? { arrayBuffer, buffer: Buffer.from(arrayBuffer) }
      : { arrayBuffer }
  const result = await mammoth.extractRawText(options)

  const text = result.value.trim()
  if (!text) {
    throw new Error('No text could be extracted from this DOCX file.')
  }
  return text
}
