// src/lib/api/queryClient.ts
import { QueryClient, QueryCache, MutationCache } from '@tanstack/react-query'
import { AxiosError } from 'axios'
import { showErrorToast } from '@/lib/utils/errorHandler'

export const queryClient = new QueryClient({
  queryCache: new QueryCache({
    onError: (error) => {
      // Los errores 401 se manejan en el interceptor de axios
      if (error instanceof AxiosError && error.response?.status === 401) {
        return
      }
      // Mostrar toast de error para otros casos
      showErrorToast(error, {
        description: 'Error al cargar los datos',
      })
    },
  }),
  mutationCache: new MutationCache({
    onError: (error) => {
      // Los errores 401 se manejan en el interceptor de axios
      if (error instanceof AxiosError && error.response?.status === 401) {
        return
      }
      // Mostrar toast de error
      showErrorToast(error, {
        description: 'Error al guardar los cambios',
      })
    },
  }),
  defaultOptions: {
    queries: {
      staleTime: 1000 * 60 * 5, // 5 minutos
      retry: (failureCount, error) => {
        // No reintentar en errores 4xx (excepto 408 timeout)
        if (error instanceof AxiosError) {
          const status = error.response?.status
          if (status && status >= 400 && status < 500 && status !== 408) {
            return false
          }
        }
        // Reintentar hasta 2 veces para otros errores
        return failureCount < 2
      },
      refetchOnWindowFocus: false,
    },
    mutations: {
      retry: false, // No reintentar mutations automáticamente
    },
  },
})
