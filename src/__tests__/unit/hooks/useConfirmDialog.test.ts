import { describe, it, expect } from 'vitest'
import { renderHook, act } from '@testing-library/react'
import { useConfirmDialog } from '@/lib/hooks/useConfirmDialog'

describe('useConfirmDialog', () => {
  it('should start closed with no pending id', () => {
    const { result } = renderHook(() => useConfirmDialog())

    expect(result.current.isOpen).toBe(false)
    expect(result.current.pendingId).toBeNull()
  })

  it('should open and set pending id on requestConfirm', () => {
    const { result } = renderHook(() => useConfirmDialog())

    act(() => {
      result.current.requestConfirm(42)
    })

    expect(result.current.isOpen).toBe(true)
    expect(result.current.pendingId).toBe(42)
  })

  it('should return the pending id and reset on confirm', () => {
    const { result } = renderHook(() => useConfirmDialog())

    act(() => {
      result.current.requestConfirm(7)
    })

    let confirmedId: number | null = null
    act(() => {
      confirmedId = result.current.confirm()
    })

    expect(confirmedId).toBe(7)
    expect(result.current.isOpen).toBe(false)
    expect(result.current.pendingId).toBeNull()
  })

  it('should reset state on cancel', () => {
    const { result } = renderHook(() => useConfirmDialog())

    act(() => {
      result.current.requestConfirm(99)
    })

    act(() => {
      result.current.cancel()
    })

    expect(result.current.isOpen).toBe(false)
    expect(result.current.pendingId).toBeNull()
  })

  it('should allow toggling via setIsOpen', () => {
    const { result } = renderHook(() => useConfirmDialog())

    act(() => {
      result.current.setIsOpen(true)
    })

    expect(result.current.isOpen).toBe(true)

    act(() => {
      result.current.setIsOpen(false)
    })

    expect(result.current.isOpen).toBe(false)
  })

  it('should handle multiple sequential confirm requests', () => {
    const { result } = renderHook(() => useConfirmDialog())

    act(() => {
      result.current.requestConfirm(1)
    })
    act(() => {
      result.current.cancel()
    })

    act(() => {
      result.current.requestConfirm(2)
    })

    expect(result.current.pendingId).toBe(2)

    let confirmedId: number | null = null
    act(() => {
      confirmedId = result.current.confirm()
    })

    expect(confirmedId).toBe(2)
  })
})
