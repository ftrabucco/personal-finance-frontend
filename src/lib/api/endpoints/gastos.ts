// src/lib/api/endpoints/gastos.ts
import { apiClient } from '../client'
import type { StandardResponse, Gasto, GastoUnico, GastosSummary } from '@/types'

export const gastosApi = {
  // Gastos principales
  getGastos: async (filters?: Record<string, any>) => {
    const { data } = await apiClient.get<StandardResponse<Gasto[]>>('/gastos', {
      params: filters,
    })
    return data
  },

  getAllGastos: async () => {
    // La ruta /gastos sin filtros devuelve todos los gastos
    const { data } = await apiClient.get<StandardResponse<Gasto[]>>('/gastos')
    return data
  },

  getGastoById: async (id: number) => {
    const { data } = await apiClient.get<StandardResponse<Gasto>>(`/gastos/${id}`)
    return data
  },

  deleteGasto: async (id: number) => {
    const { data } = await apiClient.delete<StandardResponse<{ message: string }>>(
      `/gastos/${id}`
    )
    return data
  },

  getSummary: async (fecha_desde?: string, fecha_hasta?: string) => {
    const { data } = await apiClient.get<StandardResponse<GastosSummary>>(
      '/gastos/summary',
      { params: { fecha_desde, fecha_hasta } }
    )
    return data
  },

  generateGastos: async () => {
    const { data } = await apiClient.get<StandardResponse<{ message: string, generados: number }>>(
      '/gastos/generate'
    )
    return data
  },

  // Gastos únicos
  getGastosUnicos: async (params?: { tarjeta_id?: number }) => {
    const { data } = await apiClient.get<StandardResponse<GastoUnico[]>>('/gastos-unicos', { params })
    return data
  },

  getGastoUnicoById: async (id: number) => {
    const { data } = await apiClient.get<StandardResponse<GastoUnico>>(
      `/gastos-unicos/${id}`
    )
    return data
  },

  createGastoUnico: async (gasto: Partial<GastoUnico>) => {
    const { data } = await apiClient.post<StandardResponse<GastoUnico>>(
      '/gastos-unicos',
      gasto
    )
    return data
  },

  updateGastoUnico: async (id: number, gasto: Partial<GastoUnico>) => {
    const { data } = await apiClient.put<StandardResponse<GastoUnico>>(
      `/gastos-unicos/${id}`,
      gasto
    )
    return data
  },

  deleteGastoUnico: async (id: number) => {
    const { data } = await apiClient.delete<StandardResponse<{ message: string }>>(
      `/gastos-unicos/${id}`
    )
    return data
  },
}
