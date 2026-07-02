import { useSettings } from '../store/settings'
import type { ResumeData, TailorResult } from '../types'

const BASE = 'https://generativelanguage.googleapis.com/v1beta/models'

export class MissingKeyError extends Error {
  constructor() {
    super('Add your Gemini API key in Settings to use AI features.')
    this.name = 'MissingKeyError'
  }
}

interface GeminiOptions {
  json?: boolean
  temperature?: number
}

export async function generateContent(prompt: string, opts: GeminiOptions = {}): Promise<string> {
  const { apiKey, model } = useSettings.getState()
  if (!apiKey.trim()) throw new MissingKeyError()

  const res = await fetch(`${BASE}/${model}:generateContent?key=${encodeURIComponent(apiKey.trim())}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      contents: [{ role: 'user', parts: [{ text: prompt }] }],
      generationConfig: {
        temperature: opts.temperature ?? 0.4,
        ...(opts.json ? { responseMimeType: 'application/json' } : {}),
      },
    }),
  })

  if (!res.ok) {
    let detail = ''
    try {
      const body = await res.json()
      detail = body?.error?.message ?? ''
    } catch {
      /* non-JSON error body */
    }
    if (res.status === 400 && /api key/i.test(detail)) {
      throw new Error('Your Gemini API key is invalid. Check it in Settings.')
    }
    if (res.status === 403) {
      throw new Error('Your Gemini API key was rejected (403). Check it in Settings.')
    }
    if (res.status === 429) {
      throw new Error('Gemini rate limit reached. Wait a moment and try again.')
    }
    throw new Error(detail || `Gemini request failed (HTTP ${res.status}).`)
  }

  const data = await res.json()
  const text: string =
    data?.candidates?.[0]?.content?.parts
      ?.map((p: { text?: string }) => p.text ?? '')
      .join('') ?? ''
  if (!text.trim()) throw new Error('Gemini returned an empty response. Try again.')
  return text
}

export function parseJson<T>(text: string): T {
  const cleaned = text
    .trim()
    .replace(/^```(?:json)?\s*/i, '')
    .replace(/```\s*$/, '')
  try {
    return JSON.parse(cleaned) as T
  } catch {
    const start = cleaned.indexOf('{')
    const end = cleaned.lastIndexOf('}')
    if (start >= 0 && end > start) {
      return JSON.parse(cleaned.slice(start, end + 1)) as T
    }
    throw new Error('Gemini returned a response that could not be parsed. Try again.')
  }
}

function resumeToText(resume: ResumeData): string {
  const b = resume.basics
  const lines: string[] = [
    `Name: ${b.fullName}`,
    `Headline: ${b.headline}`,
    `Location: ${b.location}`,
    '',
    `SUMMARY:\n${resume.summary || '(none)'}`,
    '',
    'EXPERIENCE (each item has a stable "id"):',
    ...resume.experience.map((e) =>
      JSON.stringify({
        id: e.id,
        company: e.company,
        position: e.position,
        dates: `${e.startDate} - ${e.endDate}`,
        highlights: e.highlights,
      }),
    ),
    '',
    'EDUCATION:',
    ...resume.education.map((e) => `- ${e.degree} ${e.field}, ${e.institution} (${e.startDate}-${e.endDate})`),
    '',
    'PROJECTS:',
    ...resume.projects.map((p) => `- ${p.name}: ${p.description} ${p.highlights.join('; ')}`),
    '',
    'SKILLS:',
    ...resume.skills.map((g) => `- ${g.category}: ${g.skills.join(', ')}`),
    '',
    'CERTIFICATIONS:',
    ...resume.certifications.map((c) => `- ${c.name} (${c.issuer}, ${c.date})`),
  ]
  return lines.join('\n')
}

export async function improveText(text: string, context: string): Promise<string> {
  const prompt = [
    'You are an expert resume writer.',
    `Rewrite the following ${context} to be more impactful, concise, and achievement-oriented.`,
    'Use strong action verbs and quantify impact where the original text supports it.',
    'Never invent facts, employers, numbers, or credentials that are not present in the original.',
    'Keep roughly the same length and the same line structure (if the input has multiple lines, return the same number of lines).',
    'Return ONLY the rewritten text with no commentary, no markdown, no quotes.',
    '',
    'TEXT:',
    text,
  ].join('\n')
  return (await generateContent(prompt)).trim()
}

export async function generateSummary(resume: ResumeData): Promise<string> {
  const prompt = [
    'You are an expert resume writer.',
    'Write a compelling professional summary (2-3 sentences, first person implied, no "I") for this candidate based on their resume below.',
    'Never invent facts. Return ONLY the summary text with no commentary or markdown.',
    '',
    resumeToText(resume),
  ].join('\n')
  return (await generateContent(prompt)).trim()
}

export async function tailorResume(resume: ResumeData, jobDescription: string): Promise<TailorResult> {
  const prompt = [
    'You are an expert resume writer and ATS (applicant tracking system) optimization specialist.',
    'Analyze how well the candidate resume matches the target job description, then tailor the resume content toward it.',
    '',
    'STRICT RULES:',
    '- Never invent employers, job titles, dates, degrees, or credentials.',
    '- Only rephrase, re-prioritize, and emphasize content that truthfully follows from the resume.',
    '- skillsToAdd may only contain skills clearly implied by the candidate experience but missing from the skills list.',
    '- For experience, copy the exact "id" values from the resume data.',
    '',
    'Return ONLY valid JSON matching exactly this schema:',
    JSON.stringify({
      matchScore: 'number 0-100, how well the CURRENT resume matches the job',
      matchedKeywords: ['important job keywords already present in the resume'],
      missingKeywords: ['important job keywords absent from the resume'],
      summary: 'rewritten professional summary targeted at this job, 2-3 sentences',
      skillsToAdd: ['skills implied by experience but not listed'],
      experience: [{ id: 'exact id from resume', highlights: ['rewritten achievement bullets emphasizing job-relevant impact'] }],
      recommendations: ['3-5 actionable improvement tips'],
    }),
    '',
    '=== CANDIDATE RESUME ===',
    resumeToText(resume),
    '',
    '=== TARGET JOB DESCRIPTION ===',
    jobDescription,
  ].join('\n')

  const raw = await generateContent(prompt, { json: true, temperature: 0.3 })
  const result = parseJson<TailorResult>(raw)

  return {
    matchScore: Math.max(0, Math.min(100, Number(result.matchScore) || 0)),
    matchedKeywords: Array.isArray(result.matchedKeywords) ? result.matchedKeywords : [],
    missingKeywords: Array.isArray(result.missingKeywords) ? result.missingKeywords : [],
    summary: typeof result.summary === 'string' ? result.summary : '',
    skillsToAdd: Array.isArray(result.skillsToAdd) ? result.skillsToAdd : [],
    experience: Array.isArray(result.experience)
      ? result.experience.filter((e) => e && typeof e.id === 'string' && Array.isArray(e.highlights))
      : [],
    recommendations: Array.isArray(result.recommendations) ? result.recommendations : [],
  }
}

export async function testConnection(): Promise<void> {
  await generateContent('Reply with the single word: ok')
}
