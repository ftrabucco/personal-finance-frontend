// src/lib/api/endpoints/compras.ts
import { apiClient } from '../client'
import type { StandardResponse, Compra } from '@/types'

export const comprasApi = {
  getCompras: async (params?: { tarjeta_id?: number }) => {
    const { data } = await apiClient.get<StandardResponse<Compra[]>>('/compras', { params })
    return data
  },

  getCompraById: async (id: number) => {
    const { data } = await apiClient.get<StandardResponse<Compra>>(`/compras/${id}`)
    return data
  },

  createCompra: async (compra: Partial<Compra>) => {
    const { data } = await apiClient.post<StandardResponse<Compra>>('/compras', compra)
    return data
  },

  updateCompra: async (id: number, compra: Partial<Compra>) => {
    const { data } = await apiClient.put<StandardResponse<Compra>>(
      `/compras/${id}`,
      compra
    )
    return data
  },

  deleteCompra: async (id: number) => {
    const { data } = await apiClient.delete<StandardResponse<{ message: string }>>(
      `/compras/${id}`
    )
    return data
  },
}
