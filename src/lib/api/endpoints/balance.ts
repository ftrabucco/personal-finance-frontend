// src/lib/api/endpoints/balance.ts
import { apiClient } from '../client'
import type { StandardResponse, BalanceEvolucionResponse } from '@/types'

export const balanceApi = {
  /**
   * Get monthly balance evolution for a date range
   * @param desde Start month (YYYY-MM)
   * @param hasta End month (YYYY-MM)
   */
  getEvolucion: async (desde: string, hasta: string) => {
    const { data } = await apiClient.get<StandardResponse<BalanceEvolucionResponse>>(
      '/balance/evolucion',
      { params: { desde, hasta } }
    )
    return data
  },
}
