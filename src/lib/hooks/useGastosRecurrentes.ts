// src/lib/hooks/useGastosRecurrentes.ts
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { gastosRecurrentesApi } from '@/lib/api/endpoints/gastosRecurrentes'
import type { GastoRecurrente } from '@/types'

const QUERY_KEY = 'gastos-recurrentes'

export function useGastosRecurrentes() {
  return useQuery({
    queryKey: [QUERY_KEY],
    queryFn: () => gastosRecurrentesApi.getGastosRecurrentes(),
  })
}

export function useGastoRecurrente(id: number) {
  return useQuery({
    queryKey: [QUERY_KEY, id],
    queryFn: () => gastosRecurrentesApi.getGastoRecurrenteById(id),
    enabled: !!id,
  })
}

export function useRecurrentesByTarjeta(tarjetaId: number) {
  return useQuery({
    queryKey: [QUERY_KEY, { tarjeta_id: tarjetaId }],
    queryFn: () => gastosRecurrentesApi.getGastosRecurrentes({ tarjeta_id: tarjetaId }),
    enabled: !!tarjetaId,
  })
}

export function useCreateGastoRecurrente() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (gasto: Partial<GastoRecurrente>) =>
      gastosRecurrentesApi.createGastoRecurrente(gasto),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [QUERY_KEY] })
      queryClient.invalidateQueries({ queryKey: ['gastos'] })
    },
  })
}

export function useUpdateGastoRecurrente() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ id, data }: { id: number; data: Partial<GastoRecurrente> }) =>
      gastosRecurrentesApi.updateGastoRecurrente(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [QUERY_KEY] })
      queryClient.invalidateQueries({ queryKey: ['gastos'] })
    },
  })
}

export function useDeleteGastoRecurrente() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (id: number) => gastosRecurrentesApi.deleteGastoRecurrente(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [QUERY_KEY] })
      queryClient.invalidateQueries({ queryKey: ['gastos'] })
    },
  })
}

export function useToggleGastoRecurrente() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (id: number) => gastosRecurrentesApi.toggleActivo(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [QUERY_KEY] })
    },
  })
}
