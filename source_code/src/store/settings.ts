import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import type { TemplateId } from '../types'
import { repairSettingsData, type PersistedSettings } from '../lib/schema'

export const GEMINI_MODELS = [
  { id: 'gemini-2.5-flash', label: 'Gemini 2.5 Flash (recommended)' },
  { id: 'gemini-2.5-pro', label: 'Gemini 2.5 Pro (highest quality)' },
  { id: 'gemini-2.5-flash-lite', label: 'Gemini 2.5 Flash-Lite (fastest)' },
] as const

interface SettingsStore {
  apiKey: string
  model: string
  template: TemplateId
  accent: string
  settingsOpen: boolean
  setApiKey: (apiKey: string) => void
  setModel: (model: string) => void
  setTemplate: (template: TemplateId) => void
  setAccent: (accent: string) => void
  openSettings: () => void
  closeSettings: () => void
}

const SETTINGS_DEFAULTS: PersistedSettings = {
  apiKey: '',
  model: 'gemini-2.5-flash',
  template: 'modern',
  accent: '#0f766e',
}

export function migrateSettingsState(persisted: unknown, version: number): PersistedSettings {
  if (version >= 1) return persisted as PersistedSettings
  return repairSettingsData(persisted, SETTINGS_DEFAULTS)
}

export const useSettings = create<SettingsStore>()(
  persist(
    (set) => ({
      apiKey: '',
      model: 'gemini-2.5-flash',
      template: 'modern',
      accent: '#0f766e',
      settingsOpen: false,
      setApiKey: (apiKey) => set({ apiKey }),
      setModel: (model) => set({ model }),
      setTemplate: (template) => set({ template }),
      setAccent: (accent) => set({ accent }),
      openSettings: () => set({ settingsOpen: true }),
      closeSettings: () => set({ settingsOpen: false }),
    }),
    {
      name: 'resume-builder:settings',
      version: 1,
      partialize: (s) => ({
        apiKey: s.apiKey,
        model: s.model,
        template: s.template,
        accent: s.accent,
      }),
      migrate: migrateSettingsState,
    },
  ),
)
