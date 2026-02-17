// src/lib/hooks/useAnalisis.ts
import { useQuery } from '@tanstack/react-query'
import { analisisApi, PeriodoSaludFinanciera } from '@/lib/api/endpoints/analisis'

const PROYECCION_KEY = 'proyeccion'
const SALUD_FINANCIERA_KEY = 'salud-financiera'

/**
 * Hook for fetching expense projections
 * @param meses Number of months to project (1-12)
 * @param enabled Whether to enable the query (default: true)
 */
export function useProyeccion(meses: number = 3, enabled: boolean = true) {
  return useQuery({
    queryKey: [PROYECCION_KEY, meses],
    queryFn: () => analisisApi.getProyeccion(meses),
    enabled,
    staleTime: 5 * 60 * 1000, // 5 minutes - projections don't change frequently
  })
}

/**
 * Hook for fetching financial health score
 * @param periodo Period to analyze: 'semana', 'mes', 'trimestre', 'anio'
 * @param enabled Whether to enable the query (default: true)
 */
export function useSaludFinanciera(
  periodo: PeriodoSaludFinanciera = 'mes',
  enabled: boolean = true
) {
  return useQuery({
    queryKey: [SALUD_FINANCIERA_KEY, periodo],
    queryFn: () => analisisApi.getSaludFinanciera(periodo),
    enabled,
    staleTime: 5 * 60 * 1000, // 5 minutes
  })
}
