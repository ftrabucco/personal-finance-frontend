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

      // Verificar si tenemos datos válidos
      if (!result) {
        toast.success('Procesamiento completado', {
          description: 'Se ejecutó el procesamiento de gastos pendientes',
          duration: 5000,
        })
      } else {
        // Intentar extraer los valores de forma segura
        const totalGastos = result.totalGastosGenerados || result.total || 0
        const recurrentes = result.gastosRecurrentesProcesados || result.recurrentes || 0
        const cuotas = result.comprasesProcesadas || result.compras || 0
        const debitos = result.debitosProcesados || result.debitos || 0

        // Mostrar toast con resumen
        toast.success('Procesamiento completado', {
          description: `Se generaron ${totalGastos} gastos: ${recurrentes} recurrentes, ${cuotas} cuotas, ${debitos} débitos`,
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
