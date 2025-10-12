// src/lib/api/endpoints/debitosAutomaticos.ts
import { apiClient } from '../client'
import type { StandardResponse, DebitoAutomatico } from '@/types'

export const debitosAutomaticosApi = {
  getDebitosAutomaticos: async () => {
    const { data } = await apiClient.get<StandardResponse<DebitoAutomatico[]>>('/debitos-automaticos')
    return data
  },

  getDebitoAutomaticoById: async (id: number) => {
    const { data } = await apiClient.get<StandardResponse<DebitoAutomatico>>(
      `/debitos-automaticos/${id}`
    )
    return data
  },

  createDebitoAutomatico: async (debito: Partial<DebitoAutomatico>) => {
    const { data } = await apiClient.post<StandardResponse<DebitoAutomatico>>(
      '/debitos-automaticos',
      debito
    )
    return data
  },

  updateDebitoAutomatico: async (id: number, debito: Partial<DebitoAutomatico>) => {
    const { data } = await apiClient.put<StandardResponse<DebitoAutomatico>>(
      `/debitos-automaticos/${id}`,
      debito
    )
    return data
  },

  deleteDebitoAutomatico: async (id: number) => {
    const { data } = await apiClient.delete<StandardResponse<{ message: string }>>(
      `/debitos-automaticos/${id}`
    )
    return data
  },

  toggleActivo: async (id: number) => {
    // Primero obtenemos el débito actual
    const debitoResponse = await apiClient.get<StandardResponse<DebitoAutomatico>>(
      `/debitos-automaticos/${id}`
    )
    const debito = debitoResponse.data.data

    // Preparar datos para actualizar - enviar todos los campos necesarios
    const updateData = {
      descripcion: debito.descripcion,
      monto: debito.monto,
      dia_de_pago: debito.dia_de_pago,
      mes_de_pago: debito.mes_de_pago,
      categoria_gasto_id: debito.categoria_gasto_id,
      importancia_gasto_id: debito.importancia_gasto_id,
      tipo_pago_id: debito.tipo_pago_id,
      tarjeta_id: debito.tarjeta_id,
      frecuencia_gasto_id: debito.frecuencia_gasto_id,
      activo: !debito.activo, // Toggle del estado
    }

    const { data } = await apiClient.put<StandardResponse<DebitoAutomatico>>(
      `/debitos-automaticos/${id}`,
      updateData
    )
    return data
  },
}
