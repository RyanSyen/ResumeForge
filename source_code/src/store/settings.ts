import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import type { TemplateId } from '../types'
import { repairSettingsData, type PersistedSettings } from '../lib/schema'
import type { FontId, FontSizeId, LineHeightId, SpacingId, MarginId } from '../lib/design'
import type { PageFormatId } from '../lib/pageFormats'

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
  fontFamily: FontId
  fontSize: FontSizeId
  lineHeight: LineHeightId
  sectionSpacing: SpacingId
  pageMargins: MarginId
  pageFormat: PageFormatId
  settingsOpen: boolean
  designPanelOpen: boolean
  setApiKey: (apiKey: string) => void
  setModel: (model: string) => void
  setTemplate: (template: TemplateId) => void
  setAccent: (accent: string) => void
  setFontFamily: (fontFamily: FontId) => void
  setFontSize: (fontSize: FontSizeId) => void
  setLineHeight: (lineHeight: LineHeightId) => void
  setSectionSpacing: (sectionSpacing: SpacingId) => void
  setPageMargins: (pageMargins: MarginId) => void
  setPageFormat: (pageFormat: PageFormatId) => void
  resetDesignSettings: () => void
  openSettings: () => void
  closeSettings: () => void
  openDesignPanel: () => void
  closeDesignPanel: () => void
}

const DESIGN_DEFAULTS = {
  fontFamily: 'system-sans' as FontId,
  fontSize: 'm' as FontSizeId,
  lineHeight: 'normal' as LineHeightId,
  sectionSpacing: 'normal' as SpacingId,
  pageMargins: 'normal' as MarginId,
  pageFormat: 'a4' as PageFormatId,
}

const SETTINGS_DEFAULTS: PersistedSettings = {
  apiKey: '',
  model: 'gemini-2.5-flash',
  template: 'modern',
  accent: '#0f766e',
  ...DESIGN_DEFAULTS,
}

export function migrateSettingsState(persisted: unknown, _version: number): PersistedSettings {
  // Always validate, even at the current version — a raw passthrough would let a
  // corrupted v2 payload (partial write, manual localStorage edit) reach the store
  // unvalidated, e.g. an invalid fontSize silently breaking the CSS variable it drives.
  return repairSettingsData(persisted, SETTINGS_DEFAULTS)
}

export const useSettings = create<SettingsStore>()(
  persist(
    (set) => ({
      ...SETTINGS_DEFAULTS,
      settingsOpen: false,
      designPanelOpen: false,
      setApiKey: (apiKey) => set({ apiKey }),
      setModel: (model) => set({ model }),
      setTemplate: (template) => set({ template }),
      setAccent: (accent) => set({ accent }),
      setFontFamily: (fontFamily) => set({ fontFamily }),
      setFontSize: (fontSize) => set({ fontSize }),
      setLineHeight: (lineHeight) => set({ lineHeight }),
      setSectionSpacing: (sectionSpacing) => set({ sectionSpacing }),
      setPageMargins: (pageMargins) => set({ pageMargins }),
      setPageFormat: (pageFormat) => set({ pageFormat }),
      resetDesignSettings: () => set({ ...DESIGN_DEFAULTS }),
      openSettings: () => set({ settingsOpen: true }),
      closeSettings: () => set({ settingsOpen: false }),
      openDesignPanel: () => set({ designPanelOpen: true }),
      closeDesignPanel: () => set({ designPanelOpen: false }),
    }),
    {
      name: 'resume-builder:settings',
      version: 2,
      partialize: (s) => ({
        apiKey: s.apiKey,
        model: s.model,
        template: s.template,
        accent: s.accent,
        fontFamily: s.fontFamily,
        fontSize: s.fontSize,
        lineHeight: s.lineHeight,
        sectionSpacing: s.sectionSpacing,
        pageMargins: s.pageMargins,
        pageFormat: s.pageFormat,
      }),
      migrate: migrateSettingsState,
    },
  ),
)
