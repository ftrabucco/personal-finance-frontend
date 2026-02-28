// src/lib/hooks/useCategoriasEditables.ts
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { categoriasApi, type CreateCategoriaInput, type UpdateCategoriaInput, type ReorderCategoriasInput } from '@/lib/api/endpoints/categorias'
import { analytics } from '@/lib/analytics'

const QUERY_KEY = 'categorias'
const CATALOGOS_KEY = 'catalogos'

export function useCategoriasEditables(includeInactive = false) {
  return useQuery({
    queryKey: [QUERY_KEY, { includeInactive }],
    queryFn: () => categoriasApi.getCategorias(includeInactive),
    staleTime: 1000 * 60 * 5, // 5 minutes - shorter since user can modify
  })
}

export function useCategoria(id: number) {
  return useQuery({
    queryKey: [QUERY_KEY, id],
    queryFn: () => categoriasApi.getCategoriaById(id),
    enabled: !!id,
  })
}

export function useCreateCategoria() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (input: CreateCategoriaInput) => categoriasApi.createCategoria(input),
    onSuccess: () => {
      analytics.track('categoria_created')
      // Invalidate both the editable categories and the catalogos cache
      queryClient.invalidateQueries({ queryKey: [QUERY_KEY] })
      queryClient.invalidateQueries({ queryKey: [CATALOGOS_KEY] })
    },
  })
}

export function useUpdateCategoria() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ id, data }: { id: number; data: UpdateCategoriaInput }) =>
      categoriasApi.updateCategoria(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [QUERY_KEY] })
      queryClient.invalidateQueries({ queryKey: [CATALOGOS_KEY] })
    },
  })
}

export function useToggleCategoriaActivo() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (id: number) => categoriasApi.toggleActivo(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [QUERY_KEY] })
      queryClient.invalidateQueries({ queryKey: [CATALOGOS_KEY] })
    },
  })
}

export function useReorderCategorias() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (input: ReorderCategoriasInput) => categoriasApi.reorderCategorias(input),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [QUERY_KEY] })
      queryClient.invalidateQueries({ queryKey: [CATALOGOS_KEY] })
    },
  })
}

export function useDeleteCategoria() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (id: number) => categoriasApi.deleteCategoria(id),
    onSuccess: () => {
      analytics.track('categoria_deleted')
      queryClient.invalidateQueries({ queryKey: [QUERY_KEY] })
      queryClient.invalidateQueries({ queryKey: [CATALOGOS_KEY] })
    },
  })
}
