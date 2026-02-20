// src/lib/api/endpoints/ingresosUnicos.ts
import { apiClient } from '../client'
import type { StandardResponse, IngresoUnico } from '@/types'

export const ingresosUnicosApi = {
  getIngresosUnicos: async (params?: { fuente_ingreso_id?: number; fecha_desde?: string; fecha_hasta?: string }) => {
    const { data } = await apiClient.get<StandardResponse<IngresoUnico[]>>('/ingresos-unicos', { params })
    return data
  },

  getIngresoUnicoById: async (id: number) => {
    const { data } = await apiClient.get<StandardResponse<IngresoUnico>>(
      `/ingresos-unicos/${id}`
    )
    return data
  },

  createIngresoUnico: async (ingreso: Partial<IngresoUnico>) => {
    const { data } = await apiClient.post<StandardResponse<IngresoUnico>>(
      '/ingresos-unicos',
      ingreso
    )
    return data
  },

  updateIngresoUnico: async (id: number, ingreso: Partial<IngresoUnico>) => {
    const { data } = await apiClient.put<StandardResponse<IngresoUnico>>(
      `/ingresos-unicos/${id}`,
      ingreso
    )
    return data
  },

  deleteIngresoUnico: async (id: number) => {
    const { data } = await apiClient.delete<StandardResponse<{ message: string }>>(
      `/ingresos-unicos/${id}`
    )
    return data
  },
}
