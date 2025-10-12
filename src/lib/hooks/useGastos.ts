// src/lib/hooks/useGastos.ts
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { gastosApi } from '@/lib/api/endpoints/gastos'

const QUERY_KEY = 'gastos'

export function useGastos(filters?: Record<string, any>) {
  return useQuery({
    queryKey: [QUERY_KEY, filters],
    queryFn: () => gastosApi.getGastos(filters),
  })
}

export function useAllGastos() {
  return useQuery({
    queryKey: [QUERY_KEY, 'all'],
    queryFn: () => gastosApi.getAllGastos(),
  })
}

export function useGastosSummary(fecha_desde?: string, fecha_hasta?: string) {
  return useQuery({
    queryKey: [QUERY_KEY, 'summary', fecha_desde, fecha_hasta],
    queryFn: () => gastosApi.getSummary(fecha_desde, fecha_hasta),
  })
}

export function useDeleteGasto() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (id: number) => gastosApi.deleteGasto(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [QUERY_KEY] })
    },
  })
}

export function useGenerateGastos() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: () => gastosApi.generateGastos(),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [QUERY_KEY] })
    },
  })
}
