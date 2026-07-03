import { describe, expect, it } from 'vitest'
import { migrateSettingsState } from './settings'

const DESIGN_DEFAULTS = {
  fontFamily: 'system-sans',
  fontSize: 'm',
  lineHeight: 'normal',
  sectionSpacing: 'normal',
  pageMargins: 'normal',
  pageFormat: 'a4',
}

describe('migrateSettingsState', () => {
  it('re-validates (not just passes through) a well-formed payload at the current version', () => {
    const state = {
      apiKey: 'abc',
      model: 'gemini-2.5-pro',
      template: 'classic' as const,
      accent: '#000',
      ...DESIGN_DEFAULTS,
    }
    expect(migrateSettingsState(state, 2)).toEqual(state)
  })

  it('does not let a corrupted v2 payload through unvalidated', () => {
    const corrupted = { apiKey: 'abc', fontSize: 'huge', pageFormat: 'tabloid' }
    const result = migrateSettingsState(corrupted, 2)
    expect(result.fontSize).toBe('m')
    expect(result.pageFormat).toBe('a4')
  })

  it('repairs a v1 payload, preserving the 4 legacy fields and defaulting new design fields', () => {
    const legacyV1 = { apiKey: 'abc', model: 'gemini-2.5-pro', template: 'classic', accent: '#000' }
    const result = migrateSettingsState(legacyV1, 1)
    expect(result).toEqual({ ...legacyV1, ...DESIGN_DEFAULTS })
  })

  it('repairs a versionless payload, preserving valid fields', () => {
    const legacy = { apiKey: 'abc', model: 'gemini-2.5-pro', template: 'classic', accent: '#000' }
    const result = migrateSettingsState(legacy, 0)
    expect(result).toEqual({ ...legacy, ...DESIGN_DEFAULTS })
  })

  it('falls back to defaults for wrong-typed fields without throwing', () => {
    const malformed = { apiKey: 'abc', template: 'not-a-real-template', fontSize: 'huge', pageFormat: 'tabloid' }
    const result = migrateSettingsState(malformed, 0)
    expect(result.apiKey).toBe('abc')
    expect(result.template).toBe('modern')
    expect(result.fontSize).toBe('m')
    expect(result.pageFormat).toBe('a4')
  })

  it('produces valid defaults when persisted state is missing entirely', () => {
    const result = migrateSettingsState(undefined, 0)
    expect(result).toEqual({
      apiKey: '',
      model: 'gemini-2.5-flash',
      template: 'modern',
      accent: '#0f766e',
      ...DESIGN_DEFAULTS,
    })
  })
})
