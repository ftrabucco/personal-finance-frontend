import { describe, it, expect } from 'vitest'
import { renderHook, waitFor } from '@testing-library/react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { useCategorias, useImportancias, useTiposPago, useFrecuencias } from '@/lib/hooks/useCatalogos'
import type { ReactNode } from 'react'

// Wrapper para React Query
const createWrapper = () => {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: {
        retry: false,
        gcTime: 0,
      },
    },
  })
  return ({ children }: { children: ReactNode }) => (
    <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
  )
}

describe('Catálogos Hooks', () => {
  describe('useCategorias', () => {
    it('should return all 35 categorías', async () => {
      const { result } = renderHook(() => useCategorias(), {
        wrapper: createWrapper(),
      })

      await waitFor(() => expect(result.current.isSuccess).toBe(true))

      expect(result.current.data?.data).toBeDefined()
      expect(result.current.data?.data).toHaveLength(35)
    })

    it('should include expected categorías', async () => {
      const { result } = renderHook(() => useCategorias(), {
        wrapper: createWrapper(),
      })

      await waitFor(() => expect(result.current.isSuccess).toBe(true))

      const categorias = result.current.data?.data || []
      const nombres = categorias.map((c) => c.nombre_categoria)

      expect(nombres).toContain('Alquiler')
      expect(nombres).toContain('Supermercado')
      expect(nombres).toContain('Streaming / Suscripciones')
      expect(nombres).toContain('Otros')
    })

    it('should have correct structure for each categoria', async () => {
      const { result } = renderHook(() => useCategorias(), {
        wrapper: createWrapper(),
      })

      await waitFor(() => expect(result.current.isSuccess).toBe(true))

      const firstCategoria = result.current.data?.data?.[0]
      expect(firstCategoria).toHaveProperty('id')
      expect(firstCategoria).toHaveProperty('nombre_categoria')
      expect(typeof firstCategoria?.id).toBe('number')
      expect(typeof firstCategoria?.nombre_categoria).toBe('string')
    })

    it('should have sequential IDs starting from 1', async () => {
      const { result } = renderHook(() => useCategorias(), {
        wrapper: createWrapper(),
      })

      await waitFor(() => expect(result.current.isSuccess).toBe(true))

      const categorias = result.current.data?.data || []
      expect(categorias[0].id).toBe(1)
      expect(categorias[1].id).toBe(2)
      expect(categorias[34].id).toBe(35)
    })
  })

  describe('useImportancias', () => {
    it('should return all 5 importancias', async () => {
      const { result } = renderHook(() => useImportancias(), {
        wrapper: createWrapper(),
      })

      await waitFor(() => expect(result.current.isSuccess).toBe(true))

      expect(result.current.data?.data).toBeDefined()
      expect(result.current.data?.data).toHaveLength(5)
    })

    it('should include expected importancias', async () => {
      const { result } = renderHook(() => useImportancias(), {
        wrapper: createWrapper(),
      })

      await waitFor(() => expect(result.current.isSuccess).toBe(true))

      const importancias = result.current.data?.data || []
      const nombres = importancias.map((i) => i.nombre_importancia)

      expect(nombres).toContain('Esencial')
      expect(nombres).toContain('Importante')
      expect(nombres).toContain('Nice to have')
      expect(nombres).toContain('Prescindible')
      expect(nombres).toContain('No debería')
    })

    it('should have correct structure', async () => {
      const { result } = renderHook(() => useImportancias(), {
        wrapper: createWrapper(),
      })

      await waitFor(() => expect(result.current.isSuccess).toBe(true))

      const firstImportancia = result.current.data?.data?.[0]
      expect(firstImportancia).toHaveProperty('id')
      expect(firstImportancia).toHaveProperty('nombre_importancia')
    })
  })

  describe('useTiposPago', () => {
    it('should return all 6 tipos de pago', async () => {
      const { result } = renderHook(() => useTiposPago(), {
        wrapper: createWrapper(),
      })

      await waitFor(() => expect(result.current.isSuccess).toBe(true))

      expect(result.current.data?.data).toBeDefined()
      expect(result.current.data?.data).toHaveLength(6)
    })

    it('should include expected tipos de pago', async () => {
      const { result } = renderHook(() => useTiposPago(), {
        wrapper: createWrapper(),
      })

      await waitFor(() => expect(result.current.isSuccess).toBe(true))

      const tipos = result.current.data?.data || []
      const nombres = tipos.map((t) => t.nombre)

      expect(nombres).toContain('Efectivo')
      expect(nombres).toContain('Débito')
      expect(nombres).toContain('Crédito')
      expect(nombres).toContain('Transferencia')
      expect(nombres).toContain('MercadoPago')
      expect(nombres).toContain('Cheque')
    })

    it('should have correct permite_cuotas values', async () => {
      const { result } = renderHook(() => useTiposPago(), {
        wrapper: createWrapper(),
      })

      await waitFor(() => expect(result.current.isSuccess).toBe(true))

      const tipos = result.current.data?.data || []
      const credito = tipos.find((t) => t.nombre === 'Crédito')
      const efectivo = tipos.find((t) => t.nombre === 'Efectivo')

      expect(credito?.permite_cuotas).toBe(true)
      expect(efectivo?.permite_cuotas).toBe(false)
    })

    it('should have correct structure', async () => {
      const { result } = renderHook(() => useTiposPago(), {
        wrapper: createWrapper(),
      })

      await waitFor(() => expect(result.current.isSuccess).toBe(true))

      const firstTipo = result.current.data?.data?.[0]
      expect(firstTipo).toHaveProperty('id')
      expect(firstTipo).toHaveProperty('nombre')
      expect(firstTipo).toHaveProperty('permite_cuotas')
      expect(typeof firstTipo?.permite_cuotas).toBe('boolean')
    })
  })

  describe('useFrecuencias', () => {
    it('should return all 8 frecuencias', async () => {
      const { result } = renderHook(() => useFrecuencias(), {
        wrapper: createWrapper(),
      })

      await waitFor(() => expect(result.current.isSuccess).toBe(true))

      expect(result.current.data?.data).toBeDefined()
      expect(result.current.data?.data).toHaveLength(8)
    })

    it('should include expected frecuencias', async () => {
      const { result } = renderHook(() => useFrecuencias(), {
        wrapper: createWrapper(),
      })

      await waitFor(() => expect(result.current.isSuccess).toBe(true))

      const frecuencias = result.current.data?.data || []
      const nombres = frecuencias.map((f) => f.nombre_frecuencia)

      expect(nombres).toContain('Único')
      expect(nombres).toContain('Diario')
      expect(nombres).toContain('Semanal')
      expect(nombres).toContain('Mensual')
      expect(nombres).toContain('Bimestral')
      expect(nombres).toContain('Trimestral')
      expect(nombres).toContain('Semestral')
      expect(nombres).toContain('Anual')
    })

    it('should have correct structure', async () => {
      const { result } = renderHook(() => useFrecuencias(), {
        wrapper: createWrapper(),
      })

      await waitFor(() => expect(result.current.isSuccess).toBe(true))

      const firstFrecuencia = result.current.data?.data?.[0]
      expect(firstFrecuencia).toHaveProperty('id')
      expect(firstFrecuencia).toHaveProperty('nombre_frecuencia')
    })
  })
})
