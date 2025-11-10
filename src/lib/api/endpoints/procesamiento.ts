// src/lib/api/endpoints/procesamiento.ts
import { apiClient } from '../client'
import type { StandardResponse } from '@/types'

export interface ProcesamientoResult {
  gastosRecurrentesProcesados: number
  comprasesProcesadas: number
  debitosProcesados: number
  totalGastosGenerados: number
  detalles: {
    gastosRecurrentes: Array<{
      id: number
      descripcion: string
      gastoGeneradoId: number
    }>
    compras: Array<{
      id: number
      descripcion: string
      gastoGeneradoId: number
    }>
    debitos: Array<{
      id: number
      descripcion: string
      gastoGeneradoId: number
    }>
  }
}

export const procesamientoApi = {
  // Procesar todos los gastos pendientes (recurrentes, compras, débitos)
  // El backend usa GET /gastos/generate
  procesarTodosPendientes: async () => {
    const { data } = await apiClient.get<StandardResponse<ProcesamientoResult>>(
      '/gastos/generate'
    )
    return data
  },

  // Procesar solo gastos recurrentes
  procesarGastosRecurrentes: async () => {
    const { data } = await apiClient.post<StandardResponse<ProcesamientoResult>>(
      '/procesamiento/gastos-recurrentes'
    )
    return data
  },

  // Procesar solo cuotas de compras
  procesarCompras: async () => {
    const { data } = await apiClient.post<StandardResponse<ProcesamientoResult>>(
      '/procesamiento/compras'
    )
    return data
  },

  // Procesar solo débitos automáticos
  procesarDebitos: async () => {
    const { data } = await apiClient.post<StandardResponse<ProcesamientoResult>>(
      '/procesamiento/debitos-automaticos'
    )
    return data
  },
}
