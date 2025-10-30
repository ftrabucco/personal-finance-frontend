// src/lib/hooks/useTipoCambio.ts
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { tipoCambioApi } from '../api/endpoints/tipoCambio'
import { showSuccessToast, showErrorToast } from '../utils/errorHandler'

export function useTipoCambioActual() {
  return useQuery({
    queryKey: ['tipo-cambio', 'actual'],
    queryFn: tipoCambioApi.getActual,
    staleTime: 1000 * 60 * 60, // 1 hora (los TC no cambian tan seguido)
  })
}

export function useTipoCambioPorFecha(fecha: string) {
  return useQuery({
    queryKey: ['tipo-cambio', 'fecha', fecha],
    queryFn: () => tipoCambioApi.getByFecha(fecha),
    enabled: !!fecha,
    staleTime: Infinity, // Los TC históricos no cambian nunca
  })
}

export function useTipoCambioHistorial(params?: {
  fecha?: string
  fecha_desde?: string
  fecha_hasta?: string
  fuente?: 'BCRA' | 'DolarAPI' | 'manual'
  limit?: number
  offset?: number
}) {
  return useQuery({
    queryKey: ['tipo-cambio', 'historial', params],
    queryFn: () => tipoCambioApi.getHistorial(params),
    staleTime: 1000 * 60 * 60, // 1 hora
  })
}

export function useActualizarTipoCambio() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: tipoCambioApi.actualizar,
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['tipo-cambio'] })
      showSuccessToast(
        'Tipo de cambio actualizado',
        `Fuente: ${data.data.fuente} - $${data.data.tipoCambio.valor_venta}`
      )
    },
    onError: (error) => {
      showErrorToast(error, {
        description: 'No se pudo actualizar el tipo de cambio desde las APIs externas',
      })
    },
  })
}

export function useCreateTipoCambio() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: tipoCambioApi.create,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tipo-cambio'] })
      showSuccessToast('Tipo de cambio creado', 'El tipo de cambio fue creado exitosamente')
    },
    onError: (error) => {
      showErrorToast(error, {
        description: 'Error al crear el tipo de cambio',
      })
    },
  })
}

export function useDeleteTipoCambio() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: tipoCambioApi.delete,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tipo-cambio'] })
      showSuccessToast('Tipo de cambio eliminado', 'El tipo de cambio fue eliminado exitosamente')
    },
    onError: (error) => {
      showErrorToast(error, {
        description: 'Error al eliminar el tipo de cambio',
      })
    },
  })
}
