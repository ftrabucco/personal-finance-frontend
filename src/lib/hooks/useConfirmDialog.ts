import { useState, useCallback } from 'react'

export function useConfirmDialog() {
  const [isOpen, setIsOpen] = useState(false)
  const [pendingId, setPendingId] = useState<number | null>(null)

  const requestConfirm = useCallback((id: number) => {
    setPendingId(id)
    setIsOpen(true)
  }, [])

  const confirm = useCallback(() => {
    const id = pendingId
    setIsOpen(false)
    setPendingId(null)
    return id
  }, [pendingId])

  const cancel = useCallback(() => {
    setIsOpen(false)
    setPendingId(null)
  }, [])

  return { isOpen, pendingId, requestConfirm, confirm, cancel, setIsOpen }
}
