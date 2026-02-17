// src/lib/hooks/useCompras.ts
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { comprasApi } from '@/lib/api/endpoints/compras'
import type { Compra } from '@/types'

const QUERY_KEY = 'compras'

export function useCompras() {
  return useQuery({
    queryKey: [QUERY_KEY],
    queryFn: () => comprasApi.getCompras(),
  })
}

export function useCompra(id: number) {
  return useQuery({
    queryKey: [QUERY_KEY, id],
    queryFn: () => comprasApi.getCompraById(id),
    enabled: !!id,
  })
}

export function useComprasByTarjeta(tarjetaId: number) {
  return useQuery({
    queryKey: [QUERY_KEY, { tarjeta_id: tarjetaId }],
    queryFn: () => comprasApi.getCompras({ tarjeta_id: tarjetaId }),
    enabled: !!tarjetaId,
  })
}

export function useCreateCompra() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (compra: Partial<Compra>) => comprasApi.createCompra(compra),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [QUERY_KEY] })
      queryClient.invalidateQueries({ queryKey: ['gastos'] })
    },
  })
}

export function useUpdateCompra() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ id, data }: { id: number; data: Partial<Compra> }) =>
      comprasApi.updateCompra(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [QUERY_KEY] })
      queryClient.invalidateQueries({ queryKey: ['gastos'] })
    },
  })
}

export function useDeleteCompra() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (id: number) => comprasApi.deleteCompra(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [QUERY_KEY] })
      queryClient.invalidateQueries({ queryKey: ['gastos'] })
    },
  })
}
