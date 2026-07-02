import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import type { Basics, ListKey, ResumeData, SectionKey } from '../types'
import { emptyResume, sampleResume } from '../data/sample'

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
  moveSection: (key: SectionKey, dir: -1 | 1) => void
  toggleSection: (key: SectionKey) => void
  loadSample: () => void
  reset: () => void
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

      loadSample: () => set({ resume: sampleResume() }),
      reset: () => set({ resume: emptyResume() }),
    }),
    { name: 'resume-builder:resume' },
  ),
)

export function newId(): string {
  return crypto.randomUUID()
}
