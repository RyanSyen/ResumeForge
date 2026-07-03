import { beforeEach, describe, expect, it } from 'vitest'
import { updatePrintPageStyle } from './printStyleInjector'

describe('updatePrintPageStyle', () => {
  beforeEach(() => {
    document.getElementById('rf-print-page')?.remove()
  })

  it('injects a single style element with the literal @page rule for A4', () => {
    updatePrintPageStyle('a4', 15)
    const el = document.getElementById('rf-print-page')
    expect(el).not.toBeNull()
    expect(el?.textContent).toBe('@page { size: 210mm 297mm; margin: 15mm; }')
  })

  it('injects the literal @page rule for US Letter', () => {
    updatePrintPageStyle('letter', 10)
    const el = document.getElementById('rf-print-page')
    expect(el?.textContent).toBe('@page { size: 215.9mm 279.4mm; margin: 10mm; }')
  })

  it('reuses the same style element on repeated calls instead of duplicating it', () => {
    updatePrintPageStyle('a4', 15)
    updatePrintPageStyle('letter', 20)
    const elements = document.querySelectorAll('#rf-print-page')
    expect(elements.length).toBe(1)
    expect(elements[0].textContent).toBe('@page { size: 215.9mm 279.4mm; margin: 20mm; }')
  })
})
