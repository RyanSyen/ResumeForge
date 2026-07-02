export interface Basics {
  fullName: string
  headline: string
  email: string
  phone: string
  location: string
  website: string
  linkedin: string
  github: string
}

export interface ExperienceItem {
  id: string
  company: string
  position: string
  location: string
  startDate: string
  endDate: string
  highlights: string[]
}

export interface EducationItem {
  id: string
  institution: string
  degree: string
  field: string
  location: string
  startDate: string
  endDate: string
  score: string
}

export interface ProjectItem {
  id: string
  name: string
  url: string
  description: string
  highlights: string[]
}

export interface SkillGroup {
  id: string
  category: string
  skills: string[]
}

export interface CertificationItem {
  id: string
  name: string
  issuer: string
  date: string
  url: string
}

export interface LanguageItem {
  id: string
  name: string
  fluency: string
}

export type SectionKey =
  | 'summary'
  | 'experience'
  | 'education'
  | 'projects'
  | 'skills'
  | 'certifications'
  | 'languages'

export type ListKey = Exclude<SectionKey, 'summary'>

export interface ResumeData {
  basics: Basics
  summary: string
  experience: ExperienceItem[]
  education: EducationItem[]
  projects: ProjectItem[]
  skills: SkillGroup[]
  certifications: CertificationItem[]
  languages: LanguageItem[]
  sectionOrder: SectionKey[]
  hiddenSections: SectionKey[]
}

export const SECTION_LABELS: Record<SectionKey, string> = {
  summary: 'Professional Summary',
  experience: 'Work Experience',
  education: 'Education',
  projects: 'Projects',
  skills: 'Skills',
  certifications: 'Certifications',
  languages: 'Languages',
}

export type TemplateId = 'modern' | 'classic' | 'compact'

export interface TailorResult {
  matchScore: number
  matchedKeywords: string[]
  missingKeywords: string[]
  summary: string
  skillsToAdd: string[]
  experience: { id: string; highlights: string[] }[]
  recommendations: string[]
}
