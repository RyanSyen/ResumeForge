import type { ResumeData } from '../types'
import { extractText } from './extract'
import { importResume } from './gemini'

export class ImportError extends Error {
  stage: 'extraction' | 'parsing'
  /** Only set for 'parsing' failures — extraction never produced text, so there's nothing to show. */
  rawText?: string

  constructor(stage: 'extraction' | 'parsing', message: string, rawText?: string) {
    super(message)
    this.name = 'ImportError'
    this.stage = stage
    this.rawText = rawText
  }
}

/**
 * Orchestrates extraction → AI parsing for resume import (F-004). Returns data only —
 * this module never touches the resume store — so the caller decides when (or whether)
 * to apply it, keeping "cancel leaves state untouched" true by construction.
 */
export async function importResumeFile(file: File): Promise<ResumeData> {
  let text: string
  try {
    text = await extractText(file)
  } catch (e) {
    throw new ImportError(
      'extraction',
      e instanceof Error ? e.message : 'Could not extract text from this file.',
    )
  }

  try {
    return await importResume(text)
  } catch (e) {
    throw new ImportError(
      'parsing',
      e instanceof Error ? e.message : 'Could not parse this resume with AI.',
      text,
    )
  }
}
