// src/lib/hooks/useIngresosUnicos.ts
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { ingresosUnicosApi } from '@/lib/api/endpoints/ingresosUnicos'
import type { IngresoUnico } from '@/types'

const QUERY_KEY = 'ingresos-unicos'

export function useIngresosUnicos() {
  return useQuery({
    queryKey: [QUERY_KEY],
    queryFn: () => ingresosUnicosApi.getIngresosUnicos(),
    // Backs the dashboard and el historial: ingresos can also be created by
    // another tab/device, not just this component's own mutations. Without
    // a refetch interval, the 5min global staleTime means those changes
    // never appear here until something else remounts the query.
    refetchInterval: 30_000,
  })
}

export function useIngresoUnico(id: number) {
  return useQuery({
    queryKey: [QUERY_KEY, id],
    queryFn: () => ingresosUnicosApi.getIngresoUnicoById(id),
    enabled: !!id,
  })
}

export function useIngresosUnicosByFuente(fuenteIngresoId: number) {
  return useQuery({
    queryKey: [QUERY_KEY, { fuente_ingreso_id: fuenteIngresoId }],
    queryFn: () => ingresosUnicosApi.getIngresosUnicos({ fuente_ingreso_id: fuenteIngresoId }),
    enabled: !!fuenteIngresoId,
  })
}

export function useCreateIngresoUnico() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (ingreso: Partial<IngresoUnico>) => ingresosUnicosApi.createIngresoUnico(ingreso),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [QUERY_KEY] })
    },
  })
}

export function useUpdateIngresoUnico() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ id, data }: { id: number; data: Partial<IngresoUnico> }) =>
      ingresosUnicosApi.updateIngresoUnico(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [QUERY_KEY] })
    },
  })
}

export function useDeleteIngresoUnico() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (id: number) => ingresosUnicosApi.deleteIngresoUnico(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [QUERY_KEY] })
    },
  })
}
