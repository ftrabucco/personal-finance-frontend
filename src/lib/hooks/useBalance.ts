// src/lib/hooks/useBalance.ts
import { useQuery } from '@tanstack/react-query'
import { balanceApi } from '@/lib/api/endpoints/balance'

const BALANCE_EVOLUCION_KEY = 'balance-evolucion'

/**
 * Hook for fetching monthly balance evolution
 * @param desde Start month (YYYY-MM)
 * @param hasta End month (YYYY-MM)
 * @param enabled Whether to enable the query (default: true)
 */
export function useBalanceEvolucion(
  desde: string,
  hasta: string,
  enabled: boolean = true
) {
  return useQuery({
    queryKey: [BALANCE_EVOLUCION_KEY, desde, hasta],
    queryFn: () => balanceApi.getEvolucion(desde, hasta),
    enabled: enabled && !!desde && !!hasta,
    staleTime: 5 * 60 * 1000, // 5 minutes
  })
}
