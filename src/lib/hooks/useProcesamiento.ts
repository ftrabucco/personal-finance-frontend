// src/lib/hooks/useProcesamiento.ts
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { procesamientoApi } from '@/lib/api/endpoints/procesamiento'
import { toast } from 'sonner'

export function useProcesarTodosPendientes() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: procesamientoApi.procesarTodosPendientes,
    onSuccess: (data) => {
      // Log para debug
      console.log('Respuesta del backend:', data)

      const result = data.data
      const summary = result?.summary
      const details = result?.details

      // Extraer información del resumen
      const totalGenerados = summary?.total_generated || 0
      const totalErrores = summary?.total_errors || 0
      const breakdown = summary?.breakdown || {}

      // Contar por tipo
      const recurrentes = breakdown.gastos_recurrentes?.generated || 0
      const cuotas = breakdown.compras?.generated || 0
      const debitos = breakdown.debitos_automaticos?.generated || 0

      // Mostrar toast con resumen
      if (totalGenerados > 0 || totalErrores > 0) {
        const successMsg = totalGenerados > 0
          ? `✅ ${totalGenerados} gastos generados: ${recurrentes} recurrentes, ${cuotas} cuotas, ${debitos} débitos`
          : 'No hay gastos pendientes para procesar'

        const errorMsg = totalErrores > 0
          ? `\n⚠️ ${totalErrores} errores al procesar`
          : ''

        toast.success('Procesamiento completado', {
          description: successMsg + errorMsg,
          duration: 5000,
        })

        // Si hay errores, mostrarlos en consola para debug
        if (totalErrores > 0 && details?.errors) {
          console.warn('Errores durante el procesamiento:', details.errors)
        }
      } else {
        toast.success('Procesamiento completado', {
          description: 'No hay gastos pendientes para generar',
          duration: 5000,
        })
      }

      // Invalidar queries para refrescar datos
      queryClient.invalidateQueries({ queryKey: ['gastos'] })
      queryClient.invalidateQueries({ queryKey: ['gastos-recurrentes'] })
      queryClient.invalidateQueries({ queryKey: ['compras'] })
      queryClient.invalidateQueries({ queryKey: ['debitos-automaticos'] })
    },
    onError: (error: any) => {
      console.error('Error al procesar:', error)
      toast.error('Error al procesar gastos pendientes', {
        description: error.response?.data?.message || error.message || 'Error desconocido',
      })
    },
  })
}

export function useProcesarGastosRecurrentes() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: procesamientoApi.procesarGastosRecurrentes,
    onSuccess: (data) => {
      const result = data.data
      toast.success('Gastos recurrentes procesados', {
        description: `Se procesaron ${result.gastosRecurrentesProcesados} gastos recurrentes`,
      })
      queryClient.invalidateQueries({ queryKey: ['gastos'] })
      queryClient.invalidateQueries({ queryKey: ['gastos-recurrentes'] })
    },
    onError: (error: any) => {
      toast.error('Error al procesar gastos recurrentes', {
        description: error.response?.data?.message || error.message,
      })
    },
  })
}

export function useProcesarCompras() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: procesamientoApi.procesarCompras,
    onSuccess: (data) => {
      const result = data.data
      toast.success('Cuotas procesadas', {
        description: `Se procesaron ${result.comprasesProcesadas} cuotas de compras`,
      })
      queryClient.invalidateQueries({ queryKey: ['gastos'] })
      queryClient.invalidateQueries({ queryKey: ['compras'] })
    },
    onError: (error: any) => {
      toast.error('Error al procesar cuotas', {
        description: error.response?.data?.message || error.message,
      })
    },
  })
}

export function useProcesarDebitos() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: procesamientoApi.procesarDebitos,
    onSuccess: (data) => {
      const result = data.data
      toast.success('Débitos procesados', {
        description: `Se procesaron ${result.debitosProcesados} débitos automáticos`,
      })
      queryClient.invalidateQueries({ queryKey: ['gastos'] })
      queryClient.invalidateQueries({ queryKey: ['debitos-automaticos'] })
    },
    onError: (error: any) => {
      toast.error('Error al procesar débitos', {
        description: error.response?.data?.message || error.message,
      })
    },
  })
}
