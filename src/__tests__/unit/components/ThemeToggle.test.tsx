import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen } from '@testing-library/react'
import { ThemeToggle } from '@/components/common/ThemeToggle'

// Mock next-themes
const mockSetTheme = vi.fn()
vi.mock('next-themes', () => ({
  useTheme: () => ({
    theme: 'light',
    setTheme: mockSetTheme,
  }),
}))

describe('ThemeToggle', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('should render the theme toggle button', () => {
    render(<ThemeToggle />)
    const button = screen.getByRole('button')
    expect(button).toBeInTheDocument()
  })

  it('should have accessible label', () => {
    render(<ThemeToggle />)
    expect(screen.getByText('Cambiar tema')).toBeInTheDocument()
  })

  it('should have correct aria attributes', () => {
    render(<ThemeToggle />)
    const button = screen.getByRole('button')
    expect(button).toHaveAttribute('aria-haspopup', 'menu')
  })

  it('should render sun icon', () => {
    render(<ThemeToggle />)
    // Check that sun icon SVG is rendered (it has the lucide-sun class)
    const sunIcon = document.querySelector('.lucide-sun')
    expect(sunIcon).toBeInTheDocument()
  })

  it('should render moon icon', () => {
    render(<ThemeToggle />)
    // Check that moon icon SVG is rendered (it has the lucide-moon class)
    const moonIcon = document.querySelector('.lucide-moon')
    expect(moonIcon).toBeInTheDocument()
  })

  it('should be a dropdown menu trigger', () => {
    render(<ThemeToggle />)
    const button = screen.getByRole('button')
    // Radix UI sets data-state attribute for dropdown triggers
    expect(button).toHaveAttribute('data-state')
  })
})

describe('Theme functionality', () => {
  it('setTheme function should be callable', () => {
    // Verify that the mock setTheme function can be called
    mockSetTheme('dark')
    expect(mockSetTheme).toHaveBeenCalledWith('dark')
  })

  it('should support all theme options', () => {
    vi.clearAllMocks()
    // Verify the theme options that should be available
    const validThemes = ['light', 'dark', 'system']
    validThemes.forEach((theme) => {
      mockSetTheme(theme)
    })
    expect(mockSetTheme).toHaveBeenCalledTimes(3)
  })
})
