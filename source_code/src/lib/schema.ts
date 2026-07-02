import { z } from 'zod'
import type { ResumeData, SectionKey, TailorResult, TemplateId } from '../types'
import { emptyResume } from '../data/sample'
import { newId } from './id'

export class SchemaError extends Error {
  constructor(message: string) {
    super(message)
    this.name = 'SchemaError'
  }
}

const SECTION_KEYS: [SectionKey, ...SectionKey[]] = [
  'summary',
  'experience',
  'education',
  'projects',
  'skills',
  'certifications',
  'languages',
]

const idField = z
  .string()
  .optional()
  .transform((id) => (id && id.trim().length > 0 ? id : newId()))

const basicsShape = {
  fullName: z.string(),
  headline: z.string(),
  email: z.string(),
  phone: z.string(),
  location: z.string(),
  website: z.string(),
  linkedin: z.string(),
  github: z.string(),
}

const experienceShape = {
  id: idField,
  company: z.string(),
  position: z.string(),
  location: z.string(),
  startDate: z.string(),
  endDate: z.string(),
  highlights: z.array(z.string()),
}

const educationShape = {
  id: idField,
  institution: z.string(),
  degree: z.string(),
  field: z.string(),
  location: z.string(),
  startDate: z.string(),
  endDate: z.string(),
  score: z.string(),
}

const projectShape = {
  id: idField,
  name: z.string(),
  url: z.string(),
  description: z.string(),
  highlights: z.array(z.string()),
}

const skillGroupShape = {
  id: idField,
  category: z.string(),
  skills: z.array(z.string()),
}

const certificationShape = {
  id: idField,
  name: z.string(),
  issuer: z.string(),
  date: z.string(),
  url: z.string(),
}

const languageShape = {
  id: idField,
  name: z.string(),
  fluency: z.string(),
}

const sectionKeySchema = z.enum(SECTION_KEYS)

function fieldError(field: string, expected: string): SchemaError {
  return new SchemaError(`Invalid "${field}": expected ${expected}.`)
}

/**
 * Strict schema: wrong-typed fields fail the parse (caller decides the message).
 * Missing/blank item ids are still repaired here — that is required to succeed, not reject.
 */
const strictResumeSchema = z.object({
  basics: z.object(basicsShape).partial().transform((b) => ({ ...emptyResume().basics, ...b })),
  summary: z.string().optional().default(''),
  experience: z.array(z.object(experienceShape)).optional().default([]),
  education: z.array(z.object(educationShape)).optional().default([]),
  projects: z.array(z.object(projectShape)).optional().default([]),
  skills: z.array(z.object(skillGroupShape)).optional().default([]),
  certifications: z.array(z.object(certificationShape)).optional().default([]),
  languages: z.array(z.object(languageShape)).optional().default([]),
  sectionOrder: z
    .array(sectionKeySchema)
    .optional()
    .transform((order) => (order && order.length > 0 ? order : emptyResume().sectionOrder)),
  hiddenSections: z.array(sectionKeySchema).optional().default([]),
})

const FIELD_EXPECTATIONS: Record<string, string> = {
  basics: 'an object',
  summary: 'a string',
  experience: 'an array',
  education: 'an array',
  projects: 'an array',
  skills: 'an array',
  certifications: 'an array',
  languages: 'an array',
  sectionOrder: 'an array of valid section names',
  hiddenSections: 'an array of valid section names',
}

export function parseResumeData(raw: unknown): ResumeData {
  const result = strictResumeSchema.safeParse(raw)
  if (!result.success) {
    const issue = result.error.issues[0]
    const field = String(issue?.path[0] ?? 'resume')
    throw fieldError(field, FIELD_EXPECTATIONS[field] ?? 'a different shape')
  }
  return result.data as ResumeData
}

/**
 * Lenient schema: every top-level field falls back to the emptyResume() default
 * on any validation failure, so this never throws. Used to rehydrate a user's own
 * localStorage, which must not crash the app even if a field is unexpectedly shaped.
 */
export function repairResumeData(raw: unknown): ResumeData {
  const base = emptyResume()
  const source = raw && typeof raw === 'object' ? (raw as Record<string, unknown>) : {}

  const lenientSchema = z.object({
    basics: z
      .object(basicsShape)
      .partial()
      .catch({})
      .transform((b) => ({ ...base.basics, ...b })),
    summary: z.string().catch(base.summary),
    experience: z.array(z.object(experienceShape)).catch(base.experience),
    education: z.array(z.object(educationShape)).catch(base.education),
    projects: z.array(z.object(projectShape)).catch(base.projects),
    skills: z.array(z.object(skillGroupShape)).catch(base.skills),
    certifications: z.array(z.object(certificationShape)).catch(base.certifications),
    languages: z.array(z.object(languageShape)).catch(base.languages),
    sectionOrder: z
      .array(sectionKeySchema)
      .catch(base.sectionOrder)
      .transform((order) => (order.length > 0 ? order : base.sectionOrder)),
    hiddenSections: z.array(sectionKeySchema).catch(base.hiddenSections),
  })

  return lenientSchema.parse(source) as ResumeData
}

const TEMPLATE_IDS: [TemplateId, ...TemplateId[]] = ['modern', 'classic', 'compact']

export interface PersistedSettings {
  apiKey: string
  model: string
  template: TemplateId
  accent: string
}

export function repairSettingsData(raw: unknown, defaults: PersistedSettings): PersistedSettings {
  const schema = z.object({
    apiKey: z.string().catch(defaults.apiKey),
    model: z.string().catch(defaults.model),
    template: z.enum(TEMPLATE_IDS).catch(defaults.template),
    accent: z.string().catch(defaults.accent),
  })
  const source = raw && typeof raw === 'object' ? raw : {}
  return schema.parse(source)
}

const tailorResultShape = {
  matchScore: z.number(),
  matchedKeywords: z.array(z.string()),
  missingKeywords: z.array(z.string()),
  summary: z.string(),
  skillsToAdd: z.array(z.string()),
  experience: z.array(z.object({ id: z.string(), highlights: z.array(z.string()) })),
  recommendations: z.array(z.string()),
}

export interface PersistedAiState {
  jobDescription: string
  result: TailorResult | null
}

export function repairAiData(raw: unknown): PersistedAiState {
  const schema = z.object({
    jobDescription: z.string().catch(''),
    result: z.object(tailorResultShape).nullable().catch(null),
  })
  const source = raw && typeof raw === 'object' ? raw : {}
  return schema.parse(source) as PersistedAiState
}
