// src/lib/hooks/useFuentesIngresoEditables.ts
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { fuentesIngresoApi, type CreateFuenteIngresoInput, type UpdateFuenteIngresoInput, type ReorderFuentesIngresoInput } from '@/lib/api/endpoints/fuentesIngreso'
import { analytics } from '@/lib/analytics'

const QUERY_KEY = 'fuentes-ingreso'
const CATALOGOS_KEY = 'catalogos'

export function useFuentesIngresoEditables(includeInactive = false) {
  return useQuery({
    queryKey: [QUERY_KEY, { includeInactive }],
    queryFn: () => fuentesIngresoApi.getFuentesIngreso(includeInactive),
    staleTime: 1000 * 60 * 5, // 5 minutes - shorter since user can modify
  })
}

export function useFuenteIngreso(id: number) {
  return useQuery({
    queryKey: [QUERY_KEY, id],
    queryFn: () => fuentesIngresoApi.getFuenteIngresoById(id),
    enabled: !!id,
  })
}

export function useCreateFuenteIngreso() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (input: CreateFuenteIngresoInput) => fuentesIngresoApi.createFuenteIngreso(input),
    onSuccess: () => {
      analytics.fuenteIngresoCreada()
      // Invalidate both the editable fuentes and the catalogos cache
      queryClient.invalidateQueries({ queryKey: [QUERY_KEY] })
      queryClient.invalidateQueries({ queryKey: [CATALOGOS_KEY] })
    },
  })
}

export function useUpdateFuenteIngreso() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ id, data }: { id: number; data: UpdateFuenteIngresoInput }) =>
      fuentesIngresoApi.updateFuenteIngreso(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [QUERY_KEY] })
      queryClient.invalidateQueries({ queryKey: [CATALOGOS_KEY] })
    },
  })
}

export function useToggleFuenteIngresoActivo() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (id: number) => fuentesIngresoApi.toggleActivo(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [QUERY_KEY] })
      queryClient.invalidateQueries({ queryKey: [CATALOGOS_KEY] })
    },
  })
}

export function useReorderFuentesIngreso() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (input: ReorderFuentesIngresoInput) => fuentesIngresoApi.reorderFuentesIngreso(input),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [QUERY_KEY] })
      queryClient.invalidateQueries({ queryKey: [CATALOGOS_KEY] })
    },
  })
}

export function useDeleteFuenteIngreso() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (id: number) => fuentesIngresoApi.deleteFuenteIngreso(id),
    onSuccess: () => {
      analytics.fuenteIngresoEliminada()
      queryClient.invalidateQueries({ queryKey: [QUERY_KEY] })
      queryClient.invalidateQueries({ queryKey: [CATALOGOS_KEY] })
    },
  })
}
