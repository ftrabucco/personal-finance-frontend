import { describe, it, expect, vi, beforeEach } from 'vitest'
import { renderHook, waitFor } from '@testing-library/react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { useBalanceEvolucion } from '@/lib/hooks/useBalance'
import type { ReactNode } from 'react'

// Mock the API client
vi.mock('@/lib/api/client', () => ({
  apiClient: {
    get: vi.fn(),
  },
}))

import { apiClient } from '@/lib/api/client'

const mockBalanceResponse = {
  success: true,
  data: {
    balance_inicial: 500000,
    meses: [
      {
        mes: '2026-03',
        ingresos_ars: 200000,
        gastos_ars: 150000,
        saldo_ars: 50000,
        acumulado_ars: 550000,
        ingresos_usd: 150,
        gastos_usd: 100,
        saldo_usd: 50,
        acumulado_usd: 50,
      },
      {
        mes: '2026-04',
        ingresos_ars: 180000,
        gastos_ars: 190000,
        saldo_ars: -10000,
        acumulado_ars: 540000,
        ingresos_usd: 130,
        gastos_usd: 140,
        saldo_usd: -10,
        acumulado_usd: 40,
      },
    ],
    balance_actual_ars: 540000,
    balance_actual_usd: 40,
  },
}

// Wrapper for React Query
function createWrapper() {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: { retry: false },
    },
  })
  return ({ children }: { children: ReactNode }) => (
    <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
  )
}

describe('useBalanceEvolucion', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('should fetch balance evolution data', async () => {
    vi.mocked(apiClient.get).mockResolvedValueOnce({ data: mockBalanceResponse })

    const { result } = renderHook(
      () => useBalanceEvolucion('2026-03', '2026-04'),
      { wrapper: createWrapper() }
    )

    await waitFor(() => expect(result.current.isSuccess).toBe(true))

    expect(result.current.data?.data.balance_inicial).toBe(500000)
    expect(result.current.data?.data.meses).toHaveLength(2)
    expect(result.current.data?.data.balance_actual_ars).toBe(540000)
  })

  it('should call API with correct params', async () => {
    vi.mocked(apiClient.get).mockResolvedValueOnce({ data: mockBalanceResponse })

    renderHook(
      () => useBalanceEvolucion('2026-01', '2026-04'),
      { wrapper: createWrapper() }
    )

    await waitFor(() => {
      expect(apiClient.get).toHaveBeenCalledWith(
        '/balance/evolucion',
        { params: { desde: '2026-01', hasta: '2026-04' } }
      )
    })
  })

  it('should not fetch when disabled', () => {
    renderHook(
      () => useBalanceEvolucion('2026-01', '2026-04', false),
      { wrapper: createWrapper() }
    )

    expect(apiClient.get).not.toHaveBeenCalled()
  })

  it('should not fetch when desde/hasta are empty', () => {
    renderHook(
      () => useBalanceEvolucion('', ''),
      { wrapper: createWrapper() }
    )

    expect(apiClient.get).not.toHaveBeenCalled()
  })

  it('should handle API error', async () => {
    vi.mocked(apiClient.get).mockRejectedValueOnce(new Error('Network error'))

    const { result } = renderHook(
      () => useBalanceEvolucion('2026-03', '2026-04'),
      { wrapper: createWrapper() }
    )

    await waitFor(() => expect(result.current.isError).toBe(true))
    expect(result.current.error?.message).toBe('Network error')
  })
})
