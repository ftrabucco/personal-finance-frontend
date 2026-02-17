// src/lib/hooks/useDebitosAutomaticos.ts
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { debitosAutomaticosApi } from '@/lib/api/endpoints/debitosAutomaticos'
import type { DebitoAutomatico } from '@/types'

const QUERY_KEY = 'debitos-automaticos'

export function useDebitosAutomaticos() {
  return useQuery({
    queryKey: [QUERY_KEY],
    queryFn: () => debitosAutomaticosApi.getDebitosAutomaticos(),
  })
}

export function useDebitoAutomatico(id: number) {
  return useQuery({
    queryKey: [QUERY_KEY, id],
    queryFn: () => debitosAutomaticosApi.getDebitoAutomaticoById(id),
    enabled: !!id,
  })
}

export function useDebitosByTarjeta(tarjetaId: number) {
  return useQuery({
    queryKey: [QUERY_KEY, { tarjeta_id: tarjetaId }],
    queryFn: () => debitosAutomaticosApi.getDebitosAutomaticos({ tarjeta_id: tarjetaId }),
    enabled: !!tarjetaId,
  })
}

export function useCreateDebitoAutomatico() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (debito: Partial<DebitoAutomatico>) =>
      debitosAutomaticosApi.createDebitoAutomatico(debito),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [QUERY_KEY] })
      queryClient.invalidateQueries({ queryKey: ['gastos'] })
    },
  })
}

export function useUpdateDebitoAutomatico() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ id, data }: { id: number; data: Partial<DebitoAutomatico> }) =>
      debitosAutomaticosApi.updateDebitoAutomatico(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [QUERY_KEY] })
      queryClient.invalidateQueries({ queryKey: ['gastos'] })
    },
  })
}

export function useDeleteDebitoAutomatico() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (id: number) => debitosAutomaticosApi.deleteDebitoAutomatico(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [QUERY_KEY] })
      queryClient.invalidateQueries({ queryKey: ['gastos'] })
    },
  })
}

export function useToggleDebitoAutomatico() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (id: number) => debitosAutomaticosApi.toggleActivo(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [QUERY_KEY] })
    },
  })
}
