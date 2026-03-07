import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { preferenciasApi, UpdatePreferenciasPayload, ToggleModuloPayload } from '@/lib/api/endpoints/preferencias'
import type { PreferenciasUsuario, ModulosDisponibles } from '@/types'

// Query keys
export const preferenciasKeys = {
  all: ['preferencias'] as const,
  preferencias: () => [...preferenciasKeys.all, 'user'] as const,
  modulos: () => [...preferenciasKeys.all, 'modulos'] as const,
  modulosDisponibles: () => [...preferenciasKeys.all, 'modulos-disponibles'] as const,
}

// Hook para obtener las preferencias del usuario
export function usePreferencias(options?: { enabled?: boolean }) {
  return useQuery({
    queryKey: preferenciasKeys.preferencias(),
    queryFn: async () => {
      const response = await preferenciasApi.getPreferencias()
      return response.data
    },
    staleTime: 1000 * 60 * 5, // 5 minutos
    gcTime: 1000 * 60 * 30, // 30 minutos cache
    enabled: options?.enabled ?? true,
  })
}

// Hook para obtener los módulos con estado para el usuario
export function useModulos() {
  return useQuery({
    queryKey: preferenciasKeys.modulos(),
    queryFn: async () => {
      const response = await preferenciasApi.getModulos()
      return response.data
    },
    staleTime: 1000 * 60 * 5,
    gcTime: 1000 * 60 * 30,
  })
}

// Hook para obtener los módulos disponibles (sin estado de usuario)
export function useModulosDisponibles(options?: { enabled?: boolean }) {
  return useQuery({
    queryKey: preferenciasKeys.modulosDisponibles(),
    queryFn: async () => {
      const response = await preferenciasApi.getModulosDisponibles()
      return response.data
    },
    staleTime: 1000 * 60 * 60, // 1 hora - esto no cambia
    gcTime: 1000 * 60 * 60 * 24,
    enabled: options?.enabled ?? true,
  })
}

// Hook para actualizar preferencias
export function useUpdatePreferencias() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (payload: UpdatePreferenciasPayload) =>
      preferenciasApi.updatePreferencias(payload),
    onSuccess: (response) => {
      // Actualizar cache de preferencias
      queryClient.setQueryData(preferenciasKeys.preferencias(), response.data)
      // Invalidar módulos para refrescar estado
      queryClient.invalidateQueries({ queryKey: preferenciasKeys.modulos() })
    },
  })
}

// Hook para toggle de módulo individual
export function useToggleModulo() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (payload: ToggleModuloPayload) =>
      preferenciasApi.toggleModulo(payload),
    onMutate: async (payload) => {
      // Optimistic update
      await queryClient.cancelQueries({ queryKey: preferenciasKeys.preferencias() })

      const previousPreferencias = queryClient.getQueryData<PreferenciasUsuario>(
        preferenciasKeys.preferencias()
      )

      if (previousPreferencias) {
        const newModulos = payload.activo
          ? [...previousPreferencias.modulos_activos, payload.modulo]
          : previousPreferencias.modulos_activos.filter(m => m !== payload.modulo)

        queryClient.setQueryData(preferenciasKeys.preferencias(), {
          ...previousPreferencias,
          modulos_activos: newModulos,
        })
      }

      return { previousPreferencias }
    },
    onError: (_err, _payload, context) => {
      // Rollback on error
      if (context?.previousPreferencias) {
        queryClient.setQueryData(
          preferenciasKeys.preferencias(),
          context.previousPreferencias
        )
      }
    },
    onSettled: () => {
      // Refetch to ensure consistency
      queryClient.invalidateQueries({ queryKey: preferenciasKeys.preferencias() })
      queryClient.invalidateQueries({ queryKey: preferenciasKeys.modulos() })
    },
  })
}

// Helper hook para verificar si un módulo está activo
export function useIsModuloActivo(modulo: string): boolean {
  const { data: preferencias } = usePreferencias()
  const { data: modulosDisponibles } = useModulosDisponibles()

  // Si no hay datos aún, asumimos que está activo para no ocultar cosas innecesariamente
  if (!preferencias || !modulosDisponibles) {
    return true
  }

  // Si el módulo es core, siempre está activo
  if (modulosDisponibles[modulo]?.core) {
    return true
  }

  return preferencias.modulos_activos.includes(modulo)
}
