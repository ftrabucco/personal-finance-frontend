// src/lib/hooks/useIngresosRecurrentes.ts
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { ingresosRecurrentesApi } from '@/lib/api/endpoints/ingresosRecurrentes'
import type { IngresoRecurrente } from '@/types'

const QUERY_KEY = 'ingresos-recurrentes'

export function useIngresosRecurrentes() {
  return useQuery({
    queryKey: [QUERY_KEY],
    queryFn: () => ingresosRecurrentesApi.getIngresosRecurrentes(),
  })
}

export function useIngresoRecurrente(id: number) {
  return useQuery({
    queryKey: [QUERY_KEY, id],
    queryFn: () => ingresosRecurrentesApi.getIngresoRecurrenteById(id),
    enabled: !!id,
  })
}

export function useIngresosRecurrentesByFuente(fuenteIngresoId: number) {
  return useQuery({
    queryKey: [QUERY_KEY, { fuente_ingreso_id: fuenteIngresoId }],
    queryFn: () => ingresosRecurrentesApi.getIngresosRecurrentes({ fuente_ingreso_id: fuenteIngresoId }),
    enabled: !!fuenteIngresoId,
  })
}

export function useCreateIngresoRecurrente() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (ingreso: Partial<IngresoRecurrente>) =>
      ingresosRecurrentesApi.createIngresoRecurrente(ingreso),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [QUERY_KEY] })
    },
  })
}

export function useUpdateIngresoRecurrente() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ id, data }: { id: number; data: Partial<IngresoRecurrente> }) =>
      ingresosRecurrentesApi.updateIngresoRecurrente(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [QUERY_KEY] })
    },
  })
}

export function useDeleteIngresoRecurrente() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (id: number) => ingresosRecurrentesApi.deleteIngresoRecurrente(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [QUERY_KEY] })
    },
  })
}

export function useToggleIngresoRecurrente() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (id: number) => ingresosRecurrentesApi.toggleActivo(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [QUERY_KEY] })
    },
  })
}
