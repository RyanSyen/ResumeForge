import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import type {
  Basics,
  CustomSectionItem,
  ListKey,
  ResumeData,
  SectionId,
} from '../types'
import { emptyResume, sampleResume } from '../data/sample'
import { repairResumeData } from '../lib/schema'
import { newId } from '../lib/id'

type ListItemOf<K extends ListKey> = ResumeData[K][number]

interface ResumeStore {
  resume: ResumeData
  setResume: (resume: ResumeData) => void
  setBasics: (patch: Partial<Basics>) => void
  setSummary: (summary: string) => void
  addItem: <K extends ListKey>(key: K, item: ListItemOf<K>) => void
  updateItem: <K extends ListKey>(key: K, id: string, patch: Partial<ListItemOf<K>>) => void
  removeItem: (key: ListKey, id: string) => void
  moveItem: (key: ListKey, id: string, dir: -1 | 1) => void
  moveSection: (key: SectionId, dir: -1 | 1) => void
  toggleSection: (key: SectionId) => void
  addCustomSection: (title: string) => void
  renameCustomSection: (id: string, title: string) => void
  removeCustomSection: (id: string) => void
  addCustomItem: (sectionId: string, item: CustomSectionItem) => void
  updateCustomItem: (sectionId: string, itemId: string, patch: Partial<CustomSectionItem>) => void
  removeCustomItem: (sectionId: string, itemId: string) => void
  moveCustomItem: (sectionId: string, itemId: string, dir: -1 | 1) => void
  loadSample: () => void
  reset: () => void
}

export function migrateResumeState(persisted: unknown, version: number): { resume: ResumeData } {
  if (version >= 2) return persisted as { resume: ResumeData }
  // v0 and v1 payloads both go through the same lenient repair: it already defaults
  // customSections to [] and drops any sectionOrder/hiddenSections id that doesn't
  // resolve to a built-in key or a known custom section, so a corrupted pre-v2
  // payload can't smuggle a dangling id past this migration the way a targeted
  // v1->v2-only transform would.
  const resume = (persisted as { resume?: unknown } | undefined)?.resume
  return { resume: repairResumeData(resume) }
}

export const useResume = create<ResumeStore>()(
  persist(
    (set) => ({
      resume: sampleResume(),

      setResume: (resume) => set({ resume: { ...emptyResume(), ...resume } }),

      setBasics: (patch) =>
        set((s) => ({ resume: { ...s.resume, basics: { ...s.resume.basics, ...patch } } })),

      setSummary: (summary) => set((s) => ({ resume: { ...s.resume, summary } })),

      addItem: (key, item) =>
        set((s) => ({
          resume: { ...s.resume, [key]: [...s.resume[key], item] },
        })),

      updateItem: (key, id, patch) =>
        set((s) => ({
          resume: {
            ...s.resume,
            [key]: (s.resume[key] as { id: string }[]).map((it) =>
              it.id === id ? { ...it, ...patch } : it,
            ),
          },
        })),

      removeItem: (key, id) =>
        set((s) => ({
          resume: {
            ...s.resume,
            [key]: (s.resume[key] as { id: string }[]).filter((it) => it.id !== id),
          },
        })),

      moveItem: (key, id, dir) =>
        set((s) => {
          const list = [...(s.resume[key] as { id: string }[])]
          const i = list.findIndex((it) => it.id === id)
          const j = i + dir
          if (i < 0 || j < 0 || j >= list.length) return s
          ;[list[i], list[j]] = [list[j], list[i]]
          return { resume: { ...s.resume, [key]: list } }
        }),

      moveSection: (key, dir) =>
        set((s) => {
          const order = [...s.resume.sectionOrder]
          const i = order.indexOf(key)
          const j = i + dir
          if (i < 0 || j < 0 || j >= order.length) return s
          ;[order[i], order[j]] = [order[j], order[i]]
          return { resume: { ...s.resume, sectionOrder: order } }
        }),

      toggleSection: (key) =>
        set((s) => {
          const hidden = s.resume.hiddenSections.includes(key)
            ? s.resume.hiddenSections.filter((k) => k !== key)
            : [...s.resume.hiddenSections, key]
          return { resume: { ...s.resume, hiddenSections: hidden } }
        }),

      addCustomSection: (title) =>
        set((s) => {
          const id = newId()
          return {
            resume: {
              ...s.resume,
              customSections: [...s.resume.customSections, { id, title, items: [] }],
              sectionOrder: [...s.resume.sectionOrder, id],
            },
          }
        }),

      renameCustomSection: (id, title) =>
        set((s) => ({
          resume: {
            ...s.resume,
            customSections: s.resume.customSections.map((cs) =>
              cs.id === id ? { ...cs, title } : cs,
            ),
          },
        })),

      removeCustomSection: (id) =>
        set((s) => ({
          resume: {
            ...s.resume,
            customSections: s.resume.customSections.filter((cs) => cs.id !== id),
            sectionOrder: s.resume.sectionOrder.filter((k) => k !== id),
            hiddenSections: s.resume.hiddenSections.filter((k) => k !== id),
          },
        })),

      addCustomItem: (sectionId, item) =>
        set((s) => ({
          resume: {
            ...s.resume,
            customSections: s.resume.customSections.map((cs) =>
              cs.id === sectionId ? { ...cs, items: [...cs.items, item] } : cs,
            ),
          },
        })),

      updateCustomItem: (sectionId, itemId, patch) =>
        set((s) => ({
          resume: {
            ...s.resume,
            customSections: s.resume.customSections.map((cs) =>
              cs.id === sectionId
                ? {
                    ...cs,
                    items: cs.items.map((it) => (it.id === itemId ? { ...it, ...patch } : it)),
                  }
                : cs,
            ),
          },
        })),

      removeCustomItem: (sectionId, itemId) =>
        set((s) => ({
          resume: {
            ...s.resume,
            customSections: s.resume.customSections.map((cs) =>
              cs.id === sectionId ? { ...cs, items: cs.items.filter((it) => it.id !== itemId) } : cs,
            ),
          },
        })),

      moveCustomItem: (sectionId, itemId, dir) =>
        set((s) => {
          const section = s.resume.customSections.find((cs) => cs.id === sectionId)
          if (!section) return s
          const items = [...section.items]
          const i = items.findIndex((it) => it.id === itemId)
          const j = i + dir
          if (i < 0 || j < 0 || j >= items.length) return s
          ;[items[i], items[j]] = [items[j], items[i]]
          return {
            resume: {
              ...s.resume,
              customSections: s.resume.customSections.map((cs) =>
                cs.id === sectionId ? { ...cs, items } : cs,
              ),
            },
          }
        }),

      loadSample: () => set({ resume: sampleResume() }),
      reset: () => set({ resume: emptyResume() }),
    }),
    {
      name: 'resume-builder:resume',
      version: 2,
      migrate: migrateResumeState,
    },
  ),
)

export { newId } from '../lib/id'
