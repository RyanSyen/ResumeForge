export type FontId = 'system-sans' | 'system-serif' | 'inter' | 'merriweather' | 'roboto-slab' | 'lato'
export type FontSizeId = 's' | 'm' | 'l'
export type LineHeightId = 'compact' | 'normal' | 'relaxed'
export type SpacingId = 'compact' | 'normal' | 'relaxed'
export type MarginId = 'narrow' | 'normal' | 'wide'

export interface DesignSettings {
  fontFamily: FontId
  fontSize: FontSizeId
  lineHeight: LineHeightId
  sectionSpacing: SpacingId
  pageMargins: MarginId
}

export interface FontOption {
  id: FontId
  label: string
  stack: string
}

// Stacks all terminate in a generic family so text stays legible offline/without
// the webfont (AC3) — no JS font-load detection needed.
export const FONTS: FontOption[] = [
  { id: 'system-sans', label: 'System Sans', stack: 'ui-sans-serif, system-ui, -apple-system, sans-serif' },
  { id: 'system-serif', label: 'System Serif', stack: 'ui-serif, Georgia, Cambria, serif' },
  { id: 'inter', label: 'Inter', stack: "'Inter', ui-sans-serif, system-ui, sans-serif" },
  { id: 'merriweather', label: 'Merriweather', stack: "'Merriweather', Georgia, 'Times New Roman', serif" },
  { id: 'roboto-slab', label: 'Roboto Slab', stack: "'Roboto Slab', Georgia, 'Times New Roman', serif" },
  { id: 'lato', label: 'Lato', stack: "'Lato', ui-sans-serif, system-ui, sans-serif" },
]

// Base document font size in px per S/M/L; template text sizes scale proportionally
// off this via rem-like multipliers so relative hierarchy (name vs. body vs. label)
// is preserved at every size.
export const FONT_SIZE_SCALE: Record<FontSizeId, string> = {
  s: '9.5px',
  m: '10.5px',
  l: '11.5px',
}

export const LINE_HEIGHT_SCALE: Record<LineHeightId, string> = {
  compact: '1.25',
  normal: '1.4',
  relaxed: '1.6',
}

// Multiplier applied to each template's base spacing values (space-y-*, mt-*/mb-*).
export const SPACING_SCALE: Record<SpacingId, string> = {
  compact: '0.75',
  normal: '1',
  relaxed: '1.35',
}

export const MARGIN_SCALE: Record<MarginId, string> = {
  narrow: '10mm',
  normal: '15mm',
  wide: '20mm',
}

export function getFont(id: FontId): FontOption {
  return FONTS.find((f) => f.id === id) ?? FONTS[0]
}

export function getDesignCssVars(settings: DesignSettings): Record<string, string> {
  return {
    '--rf-font-family': getFont(settings.fontFamily).stack,
    '--rf-font-size-base': FONT_SIZE_SCALE[settings.fontSize],
    '--rf-line-height': LINE_HEIGHT_SCALE[settings.lineHeight],
    '--rf-spacing-scale': SPACING_SCALE[settings.sectionSpacing],
    '--rf-page-margin': MARGIN_SCALE[settings.pageMargins],
  }
}
