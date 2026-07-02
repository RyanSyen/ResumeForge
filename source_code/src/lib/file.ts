import type { ResumeData } from '../types'
import { emptyResume } from '../data/sample'

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
      try {
        const data = JSON.parse(String(reader.result))
        if (!data || typeof data !== 'object' || !data.basics) {
          throw new Error('not a resume file')
        }
        const base = emptyResume()
        resolve({
          ...base,
          ...data,
          basics: { ...base.basics, ...data.basics },
          sectionOrder:
            Array.isArray(data.sectionOrder) && data.sectionOrder.length > 0
              ? data.sectionOrder
              : base.sectionOrder,
        })
      } catch {
        reject(new Error('This file is not a valid resume JSON export.'))
      }
    }
    reader.readAsText(file)
  })
}
