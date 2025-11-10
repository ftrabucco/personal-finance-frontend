// src/lib/api/endpoints/procesamiento.ts
import { apiClient } from '../client'
import type { StandardResponse } from '@/types'

export interface ProcesamientoResult {
  summary: {
    total_generated: number
    total_errors: number
    breakdown: {
      gastos_recurrentes?: {
        generated: number
        errors: number
      }
      compras?: {
        generated: number
        errors: number
      }
      debitos_automaticos?: {
        generated: number
        errors: number
      }
    }
    type: string
  }
  details: {
    success: Array<{
      type: string
      id: number
      descripcion: string
      gasto_id: number
      timestamp: string
    }>
    errors: Array<{
      type: string
      id: number
      error: string
      descripcion: string
      timestamp: string
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
