// src/lib/hooks/useCatalogos.ts
import { useQuery } from '@tanstack/react-query'
import { apiClient } from '@/lib/api/client'
import type { Categoria, Importancia, TipoPago, Frecuencia } from '@/types'

// Types for API response
interface CatalogosResponse {
  success: boolean
  data: {
    categorias: Categoria[]
    importancias: Importancia[]
    tiposPago: TipoPago[]
    frecuencias: Frecuencia[]
  }
}

interface SingleCatalogResponse<T> {
  success: boolean
  data: T[]
}

// Fetch all catalogs in a single request (more efficient)
async function fetchAllCatalogos(): Promise<CatalogosResponse['data']> {
  const response = await apiClient.get<CatalogosResponse>('/catalogos')
  return response.data.data
}

// Individual fetch functions
async function fetchCategorias(): Promise<Categoria[]> {
  const response = await apiClient.get<SingleCatalogResponse<Categoria>>('/catalogos/categorias')
  return response.data.data
}

async function fetchImportancias(): Promise<Importancia[]> {
  const response = await apiClient.get<SingleCatalogResponse<Importancia>>('/catalogos/importancias')
  return response.data.data
}

async function fetchTiposPago(): Promise<TipoPago[]> {
  const response = await apiClient.get<SingleCatalogResponse<TipoPago>>('/catalogos/tipos-pago')
  return response.data.data
}

async function fetchFrecuencias(): Promise<Frecuencia[]> {
  const response = await apiClient.get<SingleCatalogResponse<Frecuencia>>('/catalogos/frecuencias')
  return response.data.data
}

export function useCategorias() {
  return useQuery({
    queryKey: ['catalogos', 'categorias'],
    queryFn: fetchCategorias,
    staleTime: 1000 * 60 * 60, // 1 hour - catalogs don't change often
    gcTime: 1000 * 60 * 60 * 24, // 24 hours cache
    select: (data) => ({ data }),
  })
}

export function useImportancias() {
  return useQuery({
    queryKey: ['catalogos', 'importancias'],
    queryFn: fetchImportancias,
    staleTime: 1000 * 60 * 60,
    gcTime: 1000 * 60 * 60 * 24,
    select: (data) => ({ data }),
  })
}

export function useTiposPago() {
  return useQuery({
    queryKey: ['catalogos', 'tipos-pago'],
    queryFn: fetchTiposPago,
    staleTime: 1000 * 60 * 60,
    gcTime: 1000 * 60 * 60 * 24,
    select: (data) => ({ data }),
  })
}

export function useFrecuencias() {
  return useQuery({
    queryKey: ['catalogos', 'frecuencias'],
    queryFn: fetchFrecuencias,
    staleTime: 1000 * 60 * 60,
    gcTime: 1000 * 60 * 60 * 24,
    select: (data) => ({ data }),
  })
}

// Hook combinado para cargar todos los catálogos de una vez (más eficiente)
export function useCatalogosCompletos() {
  const query = useQuery({
    queryKey: ['catalogos', 'all'],
    queryFn: fetchAllCatalogos,
    staleTime: 1000 * 60 * 60, // 1 hour
    gcTime: 1000 * 60 * 60 * 24, // 24 hours
  })

  return {
    categorias: {
      data: query.data ? { data: query.data.categorias } : undefined,
      isLoading: query.isLoading,
      isError: query.isError,
    },
    importancias: {
      data: query.data ? { data: query.data.importancias } : undefined,
      isLoading: query.isLoading,
      isError: query.isError,
    },
    tiposPago: {
      data: query.data ? { data: query.data.tiposPago } : undefined,
      isLoading: query.isLoading,
      isError: query.isError,
    },
    frecuencias: {
      data: query.data ? { data: query.data.frecuencias } : undefined,
      isLoading: query.isLoading,
      isError: query.isError,
    },
    isLoading: query.isLoading,
    isError: query.isError,
  }
}
