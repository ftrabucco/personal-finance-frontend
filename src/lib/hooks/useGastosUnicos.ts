// src/lib/hooks/useGastosUnicos.ts
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { gastosApi } from '@/lib/api/endpoints/gastos'
import type { GastoUnico } from '@/types'

const QUERY_KEY = 'gastos-unicos'

export function useGastosUnicos() {
  return useQuery({
    queryKey: [QUERY_KEY],
    queryFn: () => gastosApi.getGastosUnicos(),
  })
}

export function useGastoUnico(id: number) {
  return useQuery({
    queryKey: [QUERY_KEY, id],
    queryFn: () => gastosApi.getGastoUnicoById(id),
    enabled: !!id,
  })
}

export function useGastosUnicosByTarjeta(tarjetaId: number) {
  return useQuery({
    queryKey: [QUERY_KEY, { tarjeta_id: tarjetaId }],
    queryFn: () => gastosApi.getGastosUnicos({ tarjeta_id: tarjetaId }),
    enabled: !!tarjetaId,
  })
}

export function useCreateGastoUnico() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (gasto: Partial<GastoUnico>) => gastosApi.createGastoUnico(gasto),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [QUERY_KEY] })
      queryClient.invalidateQueries({ queryKey: ['gastos'] })
    },
  })
}

export function useUpdateGastoUnico() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ id, data }: { id: number; data: Partial<GastoUnico> }) =>
      gastosApi.updateGastoUnico(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [QUERY_KEY] })
      queryClient.invalidateQueries({ queryKey: ['gastos'] })
    },
  })
}

export function useDeleteGastoUnico() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (id: number) => gastosApi.deleteGastoUnico(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [QUERY_KEY] })
      queryClient.invalidateQueries({ queryKey: ['gastos'] })
    },
  })
}
