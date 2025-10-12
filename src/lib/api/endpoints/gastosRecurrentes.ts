// src/lib/api/endpoints/gastosRecurrentes.ts
import { apiClient } from '../client'
import type { StandardResponse, GastoRecurrente } from '@/types'

export const gastosRecurrentesApi = {
  getGastosRecurrentes: async () => {
    const { data } = await apiClient.get<StandardResponse<GastoRecurrente[]>>('/gastos-recurrentes')
    return data
  },

  getGastoRecurrenteById: async (id: number) => {
    const { data } = await apiClient.get<StandardResponse<GastoRecurrente>>(
      `/gastos-recurrentes/${id}`
    )
    return data
  },

  createGastoRecurrente: async (gasto: Partial<GastoRecurrente>) => {
    const { data } = await apiClient.post<StandardResponse<GastoRecurrente>>(
      '/gastos-recurrentes',
      gasto
    )
    return data
  },

  updateGastoRecurrente: async (id: number, gasto: Partial<GastoRecurrente>) => {
    const { data } = await apiClient.put<StandardResponse<GastoRecurrente>>(
      `/gastos-recurrentes/${id}`,
      gasto
    )
    return data
  },

  deleteGastoRecurrente: async (id: number) => {
    const { data } = await apiClient.delete<StandardResponse<{ message: string }>>(
      `/gastos-recurrentes/${id}`
    )
    return data
  },

  toggleActivo: async (id: number) => {
    // Primero obtenemos el gasto actual
    const gastoResponse = await apiClient.get<StandardResponse<GastoRecurrente>>(
      `/gastos-recurrentes/${id}`
    )
    const gasto = gastoResponse.data.data

    // Preparar datos para actualizar - enviar todos los campos necesarios
    const updateData = {
      descripcion: gasto.descripcion,
      monto: gasto.monto,
      dia_de_pago: gasto.dia_de_pago,
      mes_de_pago: gasto.mes_de_pago,
      fecha_inicio: gasto.fecha_inicio,
      categoria_gasto_id: gasto.categoria_gasto_id,
      importancia_gasto_id: gasto.importancia_gasto_id,
      tipo_pago_id: gasto.tipo_pago_id,
      tarjeta_id: gasto.tarjeta_id,
      frecuencia_gasto_id: gasto.frecuencia_gasto_id,
      activo: !gasto.activo, // Toggle del estado
    }

    const { data } = await apiClient.put<StandardResponse<GastoRecurrente>>(
      `/gastos-recurrentes/${id}`,
      updateData
    )
    return data
  },
}
