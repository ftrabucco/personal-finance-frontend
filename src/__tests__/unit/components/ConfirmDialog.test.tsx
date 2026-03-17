import { describe, it, expect, vi } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import { ConfirmDialog } from '@/components/ui/confirm-dialog'

describe('ConfirmDialog', () => {
  const defaultProps = {
    open: true,
    onOpenChange: vi.fn(),
    description: '¿Estás seguro?',
    onConfirm: vi.fn(),
  }

  it('should render title, description, and buttons', () => {
    render(<ConfirmDialog {...defaultProps} title="Eliminar" />)

    expect(screen.getByText('Eliminar')).toBeInTheDocument()
    expect(screen.getByText('¿Estás seguro?')).toBeInTheDocument()
    expect(screen.getByText('Confirmar')).toBeInTheDocument()
    expect(screen.getByText('Cancelar')).toBeInTheDocument()
  })

  it('should use default title when not provided', () => {
    render(<ConfirmDialog {...defaultProps} description="Confirmar eliminación" />)

    expect(screen.getByText('¿Estás seguro?')).toBeInTheDocument()
    expect(screen.getByText('Confirmar eliminación')).toBeInTheDocument()
  })

  it('should use custom button labels', () => {
    render(
      <ConfirmDialog
        {...defaultProps}
        confirmLabel="Sí, eliminar"
        cancelLabel="No, volver"
      />
    )

    expect(screen.getByText('Sí, eliminar')).toBeInTheDocument()
    expect(screen.getByText('No, volver')).toBeInTheDocument()
  })

  it('should call onConfirm when confirm button clicked', () => {
    const onConfirm = vi.fn()
    render(<ConfirmDialog {...defaultProps} onConfirm={onConfirm} />)

    fireEvent.click(screen.getByText('Confirmar'))
    expect(onConfirm).toHaveBeenCalledTimes(1)
  })

  it('should call onOpenChange(false) when cancel button clicked', () => {
    const onOpenChange = vi.fn()
    render(<ConfirmDialog {...defaultProps} onOpenChange={onOpenChange} />)

    fireEvent.click(screen.getByText('Cancelar'))
    expect(onOpenChange).toHaveBeenCalledWith(false)
  })

  it('should show loading text when isLoading', () => {
    render(<ConfirmDialog {...defaultProps} isLoading confirmLabel="Eliminar" />)

    expect(screen.getByText('Procesando...')).toBeInTheDocument()
    expect(screen.queryByText('Eliminar')).not.toBeInTheDocument()
  })

  it('should disable buttons when isLoading', () => {
    render(<ConfirmDialog {...defaultProps} isLoading />)

    expect(screen.getByText('Cancelar')).toBeDisabled()
    expect(screen.getByText('Procesando...')).toBeDisabled()
  })

  it('should not render when open is false', () => {
    render(<ConfirmDialog {...defaultProps} open={false} />)

    expect(screen.queryByText('¿Estás seguro?')).not.toBeInTheDocument()
  })
})
