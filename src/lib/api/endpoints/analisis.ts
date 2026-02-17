// src/lib/api/endpoints/analisis.ts
import { apiClient } from '../client'
import type { StandardResponse, ProyeccionResponse, SaludFinancieraResponse } from '@/types'

export type PeriodoSaludFinanciera = 'semana' | 'mes' | 'trimestre' | 'anio'

export const analisisApi = {
  /**
   * Get expense projection for N months ahead
   * @param meses Number of months to project (1-12, default: 3)
   */
  getProyeccion: async (meses: number = 3) => {
    const { data } = await apiClient.get<StandardResponse<ProyeccionResponse>>(
      '/proyeccion',
      { params: { meses } }
    )
    return data
  },

  /**
   * Get financial health score analysis
   * @param periodo Period to analyze: 'semana', 'mes', 'trimestre', 'anio'
   */
  getSaludFinanciera: async (periodo: PeriodoSaludFinanciera = 'mes') => {
    const { data } = await apiClient.get<StandardResponse<SaludFinancieraResponse>>(
      '/salud-financiera',
      { params: { periodo } }
    )
    return data
  },
}
