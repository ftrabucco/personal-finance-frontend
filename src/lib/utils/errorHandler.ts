// src/lib/utils/errorHandler.ts
import { AxiosError } from 'axios'
import type { StandardError, ValidationError } from '@/types'

export function handleApiError(error: unknown): string {
  if (error instanceof AxiosError) {
    const apiError = error.response?.data as StandardError | ValidationError

    if (apiError && 'details' in apiError && Array.isArray(apiError.details)) {
      // Errores de validación
      return apiError.details.map(d => d.message).join(', ')
    }

    return apiError?.error || 'Error al procesar la solicitud'
  }

  return 'Error inesperado'
}

export function getErrorMessage(error: unknown): string {
  if (error instanceof Error) {
    return error.message
  }

  if (typeof error === 'string') {
    return error
  }

  return 'Ha ocurrido un error inesperado'
}
