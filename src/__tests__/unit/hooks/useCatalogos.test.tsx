import { describe, it, expect, vi, beforeEach } from 'vitest'
import { renderHook, waitFor } from '@testing-library/react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { useCategorias, useImportancias, useTiposPago, useFrecuencias } from '@/lib/hooks/useCatalogos'
import type { ReactNode } from 'react'

// Mock the API client
vi.mock('@/lib/api/client', () => ({
  apiClient: {
    get: vi.fn(),
  },
}))

import { apiClient } from '@/lib/api/client'

// Mock data
const mockCategorias = [
  { id: 1, nombre_categoria: 'Alquiler' },
  { id: 2, nombre_categoria: 'Supermercado' },
  { id: 3, nombre_categoria: 'Streaming / Suscripciones' },
  { id: 4, nombre_categoria: 'Otros' },
]

const mockImportancias = [
  { id: 1, nombre_importancia: 'Necesario' },
  { id: 2, nombre_importancia: 'Deseado' },
  { id: 3, nombre_importancia: 'Prescindible' },
]

const mockTiposPago = [
  { id: 1, nombre: 'Efectivo', permite_cuotas: false },
  { id: 2, nombre: 'Débito', permite_cuotas: false },
  { id: 3, nombre: 'Crédito', permite_cuotas: true },
  { id: 4, nombre: 'Transferencia', permite_cuotas: false },
  { id: 5, nombre: 'MercadoPago', permite_cuotas: false },
  { id: 6, nombre: 'Cheque', permite_cuotas: false },
]

const mockFrecuencias = [
  { id: 1, nombre_frecuencia: 'Único' },
  { id: 2, nombre_frecuencia: 'Diario' },
  { id: 3, nombre_frecuencia: 'Semanal' },
  { id: 4, nombre_frecuencia: 'Mensual' },
  { id: 5, nombre_frecuencia: 'Bimestral' },
  { id: 6, nombre_frecuencia: 'Trimestral' },
  { id: 7, nombre_frecuencia: 'Semestral' },
  { id: 8, nombre_frecuencia: 'Anual' },
]

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
  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe('useCategorias', () => {
    it('should fetch and return categorías', async () => {
      vi.mocked(apiClient.get).mockResolvedValueOnce({
        data: { success: true, data: mockCategorias },
      })

      const { result } = renderHook(() => useCategorias(), {
        wrapper: createWrapper(),
      })

      await waitFor(() => expect(result.current.isSuccess).toBe(true))

      expect(result.current.data?.data).toBeDefined()
      expect(result.current.data?.data).toHaveLength(4)
      expect(apiClient.get).toHaveBeenCalledWith('/catalogos/categorias')
    })

    it('should include expected categorías', async () => {
      vi.mocked(apiClient.get).mockResolvedValueOnce({
        data: { success: true, data: mockCategorias },
      })

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
      vi.mocked(apiClient.get).mockResolvedValueOnce({
        data: { success: true, data: mockCategorias },
      })

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

    it('should handle API error gracefully', async () => {
      vi.mocked(apiClient.get).mockRejectedValueOnce(new Error('Network error'))

      const { result } = renderHook(() => useCategorias(), {
        wrapper: createWrapper(),
      })

      await waitFor(() => expect(result.current.isError).toBe(true))

      expect(result.current.data).toBeUndefined()
    })
  })

  describe('useImportancias', () => {
    it('should fetch and return importancias', async () => {
      vi.mocked(apiClient.get).mockResolvedValueOnce({
        data: { success: true, data: mockImportancias },
      })

      const { result } = renderHook(() => useImportancias(), {
        wrapper: createWrapper(),
      })

      await waitFor(() => expect(result.current.isSuccess).toBe(true))

      expect(result.current.data?.data).toBeDefined()
      expect(result.current.data?.data).toHaveLength(3)
    })

    it('should include expected importancias', async () => {
      vi.mocked(apiClient.get).mockResolvedValueOnce({
        data: { success: true, data: mockImportancias },
      })

      const { result } = renderHook(() => useImportancias(), {
        wrapper: createWrapper(),
      })

      await waitFor(() => expect(result.current.isSuccess).toBe(true))

      const importancias = result.current.data?.data || []
      const nombres = importancias.map((i) => i.nombre_importancia)

      expect(nombres).toContain('Necesario')
      expect(nombres).toContain('Deseado')
      expect(nombres).toContain('Prescindible')
    })

    it('should have correct structure', async () => {
      vi.mocked(apiClient.get).mockResolvedValueOnce({
        data: { success: true, data: mockImportancias },
      })

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
    it('should fetch and return tipos de pago', async () => {
      vi.mocked(apiClient.get).mockResolvedValueOnce({
        data: { success: true, data: mockTiposPago },
      })

      const { result } = renderHook(() => useTiposPago(), {
        wrapper: createWrapper(),
      })

      await waitFor(() => expect(result.current.isSuccess).toBe(true))

      expect(result.current.data?.data).toBeDefined()
      expect(result.current.data?.data).toHaveLength(6)
    })

    it('should include expected tipos de pago', async () => {
      vi.mocked(apiClient.get).mockResolvedValueOnce({
        data: { success: true, data: mockTiposPago },
      })

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
      vi.mocked(apiClient.get).mockResolvedValueOnce({
        data: { success: true, data: mockTiposPago },
      })

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
      vi.mocked(apiClient.get).mockResolvedValueOnce({
        data: { success: true, data: mockTiposPago },
      })

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
    it('should fetch and return frecuencias', async () => {
      vi.mocked(apiClient.get).mockResolvedValueOnce({
        data: { success: true, data: mockFrecuencias },
      })

      const { result } = renderHook(() => useFrecuencias(), {
        wrapper: createWrapper(),
      })

      await waitFor(() => expect(result.current.isSuccess).toBe(true))

      expect(result.current.data?.data).toBeDefined()
      expect(result.current.data?.data).toHaveLength(8)
    })

    it('should include expected frecuencias', async () => {
      vi.mocked(apiClient.get).mockResolvedValueOnce({
        data: { success: true, data: mockFrecuencias },
      })

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
      vi.mocked(apiClient.get).mockResolvedValueOnce({
        data: { success: true, data: mockFrecuencias },
      })

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
