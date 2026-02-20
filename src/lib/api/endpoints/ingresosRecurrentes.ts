// src/lib/api/endpoints/ingresosRecurrentes.ts
import { apiClient } from '../client'
import type { StandardResponse, IngresoRecurrente } from '@/types'

export const ingresosRecurrentesApi = {
  getIngresosRecurrentes: async (params?: { fuente_ingreso_id?: number; activo?: boolean }) => {
    const { data } = await apiClient.get<StandardResponse<IngresoRecurrente[]>>('/ingresos-recurrentes', { params })
    return data
  },

  getIngresoRecurrenteById: async (id: number) => {
    const { data } = await apiClient.get<StandardResponse<IngresoRecurrente>>(
      `/ingresos-recurrentes/${id}`
    )
    return data
  },

  createIngresoRecurrente: async (ingreso: Partial<IngresoRecurrente>) => {
    const { data } = await apiClient.post<StandardResponse<{ ingresoRecurrente: IngresoRecurrente }>>(
      '/ingresos-recurrentes',
      ingreso
    )
    return data
  },

  updateIngresoRecurrente: async (id: number, ingreso: Partial<IngresoRecurrente>) => {
    const { data } = await apiClient.put<StandardResponse<IngresoRecurrente>>(
      `/ingresos-recurrentes/${id}`,
      ingreso
    )
    return data
  },

  deleteIngresoRecurrente: async (id: number) => {
    const { data } = await apiClient.delete<StandardResponse<{ message: string }>>(
      `/ingresos-recurrentes/${id}`
    )
    return data
  },

  toggleActivo: async (id: number) => {
    const { data } = await apiClient.patch<StandardResponse<IngresoRecurrente>>(
      `/ingresos-recurrentes/${id}/toggle-activo`
    )
    return data
  },
}
