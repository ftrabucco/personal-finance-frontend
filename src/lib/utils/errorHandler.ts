// src/lib/utils/errorHandler.ts
import { AxiosError } from 'axios'
import type { StandardError, ValidationError } from '@/types'
import { toast } from 'sonner'

// Tipos de errores
export enum ErrorType {
  NETWORK = 'NETWORK',
  VALIDATION = 'VALIDATION',
  AUTHENTICATION = 'AUTHENTICATION',
  AUTHORIZATION = 'AUTHORIZATION',
  NOT_FOUND = 'NOT_FOUND',
  SERVER = 'SERVER',
  UNKNOWN = 'UNKNOWN',
}

// Severidad del error
export enum ErrorSeverity {
  LOW = 'LOW',
  MEDIUM = 'MEDIUM',
  HIGH = 'HIGH',
  CRITICAL = 'CRITICAL',
}

interface ErrorDetails {
  type: ErrorType
  severity: ErrorSeverity
  message: string
  originalError?: unknown
  statusCode?: number
  timestamp: string
  context?: Record<string, unknown>
}

// Logger centralizado
class ErrorLogger {
  private logs: ErrorDetails[] = []
  private maxLogs = 100

  log(details: ErrorDetails) {
    // Agregar timestamp
    const logEntry = {
      ...details,
      timestamp: new Date().toISOString(),
    }

    // Agregar al historial
    this.logs.unshift(logEntry)
    if (this.logs.length > this.maxLogs) {
      this.logs.pop()
    }

    // Log en consola según severidad
    const logMethod = this.getLogMethod(details.severity)
    logMethod(
      `[${details.severity}] ${details.type}: ${details.message}`,
      details.originalError
    )

    // En producción, aquí enviarías a un servicio como Sentry, LogRocket, etc.
    if (process.env.NODE_ENV === 'production' && details.severity === ErrorSeverity.CRITICAL) {
      // TODO: Enviar a servicio de logging externo
      // Sentry.captureException(details.originalError)
    }
  }

  private getLogMethod(severity: ErrorSeverity) {
    switch (severity) {
      case ErrorSeverity.CRITICAL:
      case ErrorSeverity.HIGH:
        return console.error
      case ErrorSeverity.MEDIUM:
        return console.warn
      case ErrorSeverity.LOW:
      default:
        return console.info
    }
  }

  getLogs(): ErrorDetails[] {
    return [...this.logs]
  }

  clearLogs() {
    this.logs = []
  }
}

// Instancia global del logger
export const errorLogger = new ErrorLogger()

// Clasificar error basado en el código de estado
function classifyError(statusCode?: number): { type: ErrorType; severity: ErrorSeverity } {
  if (!statusCode) {
    return { type: ErrorType.NETWORK, severity: ErrorSeverity.MEDIUM }
  }

  if (statusCode === 401) {
    return { type: ErrorType.AUTHENTICATION, severity: ErrorSeverity.HIGH }
  }

  if (statusCode === 403) {
    return { type: ErrorType.AUTHORIZATION, severity: ErrorSeverity.MEDIUM }
  }

  if (statusCode === 404) {
    return { type: ErrorType.NOT_FOUND, severity: ErrorSeverity.LOW }
  }

  if (statusCode === 422) {
    return { type: ErrorType.VALIDATION, severity: ErrorSeverity.LOW }
  }

  if (statusCode >= 500) {
    return { type: ErrorType.SERVER, severity: ErrorSeverity.HIGH }
  }

  if (statusCode >= 400) {
    return { type: ErrorType.VALIDATION, severity: ErrorSeverity.MEDIUM }
  }

  return { type: ErrorType.UNKNOWN, severity: ErrorSeverity.MEDIUM }
}

// Extraer mensaje de error del response
export function handleApiError(error: unknown, context?: Record<string, unknown>): string {
  let message = 'Error al procesar la solicitud'
  let statusCode: number | undefined
  let errorType = ErrorType.UNKNOWN
  let severity = ErrorSeverity.MEDIUM

  if (error instanceof AxiosError) {
    statusCode = error.response?.status
    const classification = classifyError(statusCode)
    errorType = classification.type
    severity = classification.severity

    const apiError = error.response?.data as StandardError | ValidationError | { message?: string; errors?: string[] }

    // Errores con array de errores (formato del backend)
    if (apiError && 'errors' in apiError && Array.isArray(apiError.errors)) {
      message = apiError.errors.join(', ')
      errorType = ErrorType.VALIDATION
      severity = ErrorSeverity.LOW
    }
    // Errores de validación con details
    else if (apiError && 'details' in apiError && Array.isArray(apiError.details)) {
      message = apiError.details.map((d) => d.message).join(', ')
      errorType = ErrorType.VALIDATION
      severity = ErrorSeverity.LOW
    }
    // Error con mensaje directo
    else if (apiError && 'message' in apiError && apiError.message) {
      message = apiError.message
    }
    // Error estándar
    else if (apiError && 'error' in apiError && apiError.error) {
      message = apiError.error
    }
    // Error de red
    else if (!error.response) {
      message = 'Error de conexión. Verifica tu conexión a internet.'
      errorType = ErrorType.NETWORK
      severity = ErrorSeverity.MEDIUM
    }
    // Timeout
    else if (error.code === 'ECONNABORTED') {
      message = 'La solicitud tardó demasiado tiempo. Intenta nuevamente.'
      errorType = ErrorType.NETWORK
      severity = ErrorSeverity.LOW
    }
  } else if (error instanceof Error) {
    message = error.message
  }

  // Log del error
  errorLogger.log({
    type: errorType,
    severity,
    message,
    originalError: error,
    statusCode,
    timestamp: new Date().toISOString(),
    context,
  })

  return message
}

// Obtener mensaje genérico de error
export function getErrorMessage(error: unknown): string {
  if (error instanceof Error) {
    return error.message
  }

  if (typeof error === 'string') {
    return error
  }

  return 'Ha ocurrido un error inesperado'
}

// Mostrar toast de error
export function showErrorToast(error: unknown, context?: Record<string, unknown>) {
  const message = handleApiError(error, context)
  toast.error(message, {
    duration: 5000,
    description: context?.description as string | undefined,
  })
}

// Mostrar toast de éxito
export function showSuccessToast(message: string, description?: string) {
  toast.success(message, {
    duration: 3000,
    description,
  })
}

// Mostrar toast de info
export function showInfoToast(message: string, description?: string) {
  toast.info(message, {
    duration: 4000,
    description,
  })
}

// Mostrar toast de warning
export function showWarningToast(message: string, description?: string) {
  toast.warning(message, {
    duration: 4000,
    description,
  })
}

// Helper para manejar errores en try-catch
export async function withErrorHandling<T>(
  fn: () => Promise<T>,
  options?: {
    onError?: (error: unknown) => void
    showToast?: boolean
    context?: Record<string, unknown>
  }
): Promise<T | null> {
  try {
    return await fn()
  } catch (error) {
    if (options?.showToast !== false) {
      showErrorToast(error, options?.context)
    }
    options?.onError?.(error)
    return null
  }
}
