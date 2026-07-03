import { afterEach, beforeEach, describe, expect, it } from 'vitest'
import { cleanup, fireEvent, render, screen } from '@testing-library/react'
import { DesignDialog } from './DesignDialog'
import { useSettings } from '../store/settings'

afterEach(() => {
  cleanup()
})

beforeEach(() => {
  useSettings.setState({
    designPanelOpen: true,
    fontFamily: 'system-sans',
    fontSize: 'm',
    lineHeight: 'normal',
    sectionSpacing: 'normal',
    pageMargins: 'normal',
    pageFormat: 'a4',
    apiKey: 'unchanged-key',
    model: 'gemini-2.5-flash',
    template: 'modern',
    accent: '#0f766e',
  })
})

describe('DesignDialog', () => {
  it('renders nothing when closed', () => {
    useSettings.setState({ designPanelOpen: false })
    const { container } = render(<DesignDialog />)
    expect(container.firstChild).toBeNull()
  })

  it('updates the store when a segmented control is clicked', () => {
    render(<DesignDialog />)
    fireEvent.click(screen.getByRole('button', { name: 'L' }))
    expect(useSettings.getState().fontSize).toBe('l')
  })

  it('updates the store when the font select changes', () => {
    render(<DesignDialog />)
    fireEvent.change(screen.getByDisplayValue('System Sans'), { target: { value: 'merriweather' } })
    expect(useSettings.getState().fontFamily).toBe('merriweather')
  })

  it('updates page format independently of other design fields', () => {
    render(<DesignDialog />)
    fireEvent.click(screen.getByRole('button', { name: 'US Letter' }))
    expect(useSettings.getState().pageFormat).toBe('letter')
  })

  it('reset restores only design fields, leaving apiKey/model/template/accent untouched', () => {
    render(<DesignDialog />)
    fireEvent.click(screen.getByRole('button', { name: 'L' }))
    fireEvent.click(screen.getByRole('button', { name: 'Wide' }))
    fireEvent.click(screen.getByRole('button', { name: 'Reset to defaults' }))
    const state = useSettings.getState()
    expect(state.fontSize).toBe('m')
    expect(state.pageMargins).toBe('normal')
    expect(state.apiKey).toBe('unchanged-key')
    expect(state.template).toBe('modern')
    expect(state.accent).toBe('#0f766e')
  })

  it('switching templates preserves design settings (AC4)', () => {
    render(<DesignDialog />)
    fireEvent.click(screen.getByRole('button', { name: 'L' }))
    useSettings.getState().setTemplate('classic')
    expect(useSettings.getState().fontSize).toBe('l')
  })
})
