// src/lib/api/endpoints/tipoCambio.ts
import { apiClient } from '../client'
import type { StandardResponse } from '@/types'
import type { TipoCambio } from '@/types/models'

export const tipoCambioApi = {
  // Obtener tipo de cambio actual (más reciente)
  getActual: async () => {
    const { data } = await apiClient.get<StandardResponse<TipoCambio>>('/tipo-cambio/actual')
    return data
  },

  // Obtener tipo de cambio por fecha (con fallback automático)
  getByFecha: async (fecha: string) => {
    const { data } = await apiClient.get<StandardResponse<TipoCambio>>(
      `/tipo-cambio/fecha/${fecha}`
    )
    return data
  },

  // Obtener tipo de cambio por ID
  getById: async (id: number) => {
    const { data } = await apiClient.get<StandardResponse<TipoCambio>>(`/tipo-cambio/${id}`)
    return data
  },

  // Obtener historial de tipos de cambio con filtros
  getHistorial: async (params?: {
    fecha?: string
    fecha_desde?: string
    fecha_hasta?: string
    fuente?: 'BCRA' | 'DolarAPI' | 'manual'
    limit?: number
    offset?: number
  }) => {
    const { data } = await apiClient.get<StandardResponse<TipoCambio[]>>('/tipo-cambio', {
      params,
    })
    return data
  },

  // Crear tipo de cambio manualmente
  create: async (payload: {
    fecha: string
    valor_compra_usd_ars: number
    valor_venta_usd_ars: number
    fuente?: string
  }) => {
    const { data } = await apiClient.post<StandardResponse<TipoCambio>>('/tipo-cambio', payload)
    return data
  },

  // Forzar actualización desde APIs externas
  actualizar: async () => {
    const { data } = await apiClient.post<
      StandardResponse<{
        message: string
        tipoCambio: TipoCambio
        fuente: string
      }>
    >('/tipo-cambio/actualizar')
    return data
  },

  // Eliminar tipo de cambio
  delete: async (id: number) => {
    const { data } = await apiClient.delete<StandardResponse<{ message: string }>>(
      `/tipo-cambio/${id}`
    )
    return data
  },
}
