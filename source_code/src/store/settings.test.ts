import { describe, expect, it } from 'vitest'
import { migrateSettingsState } from './settings'

describe('migrateSettingsState', () => {
  it('passes through unchanged when already at the current version', () => {
    const state = { apiKey: 'abc', model: 'gemini-2.5-pro', template: 'classic' as const, accent: '#000' }
    expect(migrateSettingsState(state, 1)).toBe(state)
  })

  it('repairs a versionless payload, preserving valid fields', () => {
    const legacy = { apiKey: 'abc', model: 'gemini-2.5-pro', template: 'classic', accent: '#000' }
    const result = migrateSettingsState(legacy, 0)
    expect(result).toEqual(legacy)
  })

  it('falls back to defaults for wrong-typed fields without throwing', () => {
    const malformed = { apiKey: 'abc', template: 'not-a-real-template' }
    const result = migrateSettingsState(malformed, 0)
    expect(result.apiKey).toBe('abc')
    expect(result.template).toBe('modern')
  })

  it('produces valid defaults when persisted state is missing entirely', () => {
    const result = migrateSettingsState(undefined, 0)
    expect(result).toEqual({ apiKey: '', model: 'gemini-2.5-flash', template: 'modern', accent: '#0f766e' })
  })
})
