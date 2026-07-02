import { describe, expect, it } from 'vitest'
import { migrateAiState } from './AiPanel'

const validResult = {
  matchScore: 80,
  matchedKeywords: ['react'],
  missingKeywords: ['aws'],
  summary: 'A summary',
  skillsToAdd: ['AWS'],
  experience: [{ id: 'exp-1', highlights: ['Did a thing'] }],
  recommendations: ['Add AWS'],
}

describe('migrateAiState', () => {
  it('passes through unchanged when already at the current version', () => {
    const state = { jobDescription: 'JD text', result: validResult }
    expect(migrateAiState(state, 1)).toBe(state)
  })

  it('repairs a versionless payload, preserving a valid result unchanged', () => {
    const legacy = { jobDescription: 'JD text', result: validResult }
    const result = migrateAiState(legacy, 0)
    expect(result).toEqual(legacy)
  })

  it('falls back to a null result for a malformed result without throwing', () => {
    const malformed = { jobDescription: 'JD text', result: { matchScore: 'not a number' } }
    const result = migrateAiState(malformed, 0)
    expect(result.jobDescription).toBe('JD text')
    expect(result.result).toBeNull()
  })

  it('produces valid defaults when persisted state is missing entirely', () => {
    const result = migrateAiState(undefined, 0)
    expect(result).toEqual({ jobDescription: '', result: null })
  })
})
