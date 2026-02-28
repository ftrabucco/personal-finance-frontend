// src/lib/hooks/useTarjetas.ts
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { tarjetasApi } from '@/lib/api/endpoints/tarjetas'
import { analytics } from '@/lib/analytics'
import type { Tarjeta } from '@/types'

const QUERY_KEY = 'tarjetas'

export function useTarjetas() {
  return useQuery({
    queryKey: [QUERY_KEY],
    queryFn: () => tarjetasApi.getTarjetas(),
  })
}

export function useTarjeta(id: number) {
  return useQuery({
    queryKey: [QUERY_KEY, id],
    queryFn: () => tarjetasApi.getTarjetaById(id),
    enabled: !!id,
  })
}

export function useCreateTarjeta() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (tarjeta: Partial<Tarjeta>) => tarjetasApi.createTarjeta(tarjeta),
    onSuccess: (_, variables) => {
      analytics.tarjetaCreada(variables.tipo)
      queryClient.invalidateQueries({ queryKey: [QUERY_KEY] })
    },
  })
}

export function useUpdateTarjeta() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ id, data }: { id: number; data: Partial<Tarjeta> }) =>
      tarjetasApi.updateTarjeta(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [QUERY_KEY] })
    },
  })
}

export function useDeleteTarjeta() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (id: number) => tarjetasApi.deleteTarjeta(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [QUERY_KEY] })
    },
  })
}

export function useCheckTarjetaUsage(id: number) {
  return useQuery({
    queryKey: [QUERY_KEY, id, 'usage'],
    queryFn: () => tarjetasApi.checkUsage(id),
    enabled: !!id,
  })
}
