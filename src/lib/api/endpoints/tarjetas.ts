// src/lib/api/endpoints/tarjetas.ts
import { apiClient } from '../client'
import type { StandardResponse, Tarjeta } from '@/types'

export const tarjetasApi = {
  getTarjetas: async () => {
    const { data } = await apiClient.get<StandardResponse<Tarjeta[]>>('/tarjetas')
    return data
  },

  getTarjetaById: async (id: number) => {
    const { data } = await apiClient.get<StandardResponse<Tarjeta>>(`/tarjetas/${id}`)
    return data
  },

  createTarjeta: async (tarjeta: Partial<Tarjeta>) => {
    const { data } = await apiClient.post<StandardResponse<Tarjeta>>('/tarjetas', tarjeta)
    return data
  },

  updateTarjeta: async (id: number, tarjeta: Partial<Tarjeta>) => {
    const { data } = await apiClient.put<StandardResponse<Tarjeta>>(
      `/tarjetas/${id}`,
      tarjeta
    )
    return data
  },

  deleteTarjeta: async (id: number) => {
    const { data } = await apiClient.delete<StandardResponse<{ message: string }>>(
      `/tarjetas/${id}`
    )
    return data
  },

  checkUsage: async (id: number) => {
    const { data } = await apiClient.get<StandardResponse<{ en_uso: boolean, cantidad_usos: number }>>(
      `/tarjetas/${id}/usage`
    )
    return data
  },
}
