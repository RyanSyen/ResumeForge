import type { ResumeData } from '../types'
import { parseResumeData, SchemaError } from './schema'

export function exportResumeJson(resume: ResumeData) {
  const blob = new Blob([JSON.stringify(resume, null, 2)], { type: 'application/json' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  const name = resume.basics.fullName.trim().replace(/\s+/g, '-').toLowerCase() || 'resume'
  a.download = `${name}.json`
  a.click()
  URL.revokeObjectURL(url)
}

export function importResumeJson(file: File): Promise<ResumeData> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onerror = () => reject(new Error('Could not read the file.'))
    reader.onload = () => {
      let data: unknown
      try {
        data = JSON.parse(String(reader.result))
      } catch {
        reject(new Error('This file is not valid JSON.'))
        return
      }
      if (!data || typeof data !== 'object' || Array.isArray(data) || !('basics' in data)) {
        reject(new Error('This file is not a valid resume JSON export.'))
        return
      }
      try {
        resolve(parseResumeData(data))
      } catch (err) {
        reject(err instanceof SchemaError ? err : new Error('This file is not a valid resume JSON export.'))
      }
    }
    reader.readAsText(file)
  })
}
