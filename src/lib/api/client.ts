// src/lib/api/client.ts
import axios, { AxiosError, InternalAxiosRequestConfig } from 'axios'
import { errorLogger, ErrorType, ErrorSeverity } from '@/lib/utils/errorHandler'

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3030/api'

export const apiClient = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
  timeout: 30000, // 30 segundos timeout
})

// Interceptor para agregar token automáticamente y logging de requests
apiClient.interceptors.request.use(
  (config: InternalAxiosRequestConfig) => {
    // Log de request (solo en desarrollo)
    if (process.env.NODE_ENV === 'development') {
      console.log(`🚀 API Request: ${config.method?.toUpperCase()} ${config.url}`, {
        params: config.params,
        data: config.data,
      })
    }

    // En el cliente (browser)
    if (typeof window !== 'undefined') {
      const token = localStorage.getItem('token')
      if (token) {
        config.headers.Authorization = `Bearer ${token}`
      }
    }
    return config
  },
  (error) => {
    // Log de error en request
    errorLogger.log({
      type: ErrorType.NETWORK,
      severity: ErrorSeverity.MEDIUM,
      message: 'Error al preparar la solicitud',
      originalError: error,
      timestamp: new Date().toISOString(),
    })
    return Promise.reject(error)
  }
)

// Interceptor para manejo de respuestas y errores
apiClient.interceptors.response.use(
  (response) => {
    // Log de respuesta exitosa (solo en desarrollo)
    if (process.env.NODE_ENV === 'development') {
      console.log(`✅ API Response: ${response.config.method?.toUpperCase()} ${response.config.url}`, {
        status: response.status,
        data: response.data,
      })
    }
    return response
  },
  async (error: AxiosError) => {
    const status = error.response?.status
    const url = error.config?.url
    const method = error.config?.method?.toUpperCase()

    // Log detallado del error
    if (process.env.NODE_ENV === 'development') {
      console.error(`❌ API Error: ${method} ${url}`, {
        status,
        statusText: error.response?.statusText,
        data: error.response?.data,
        message: error.message,
      })
    }

    // Manejo específico por código de error
    if (status === 401) {
      // Token inválido o expirado
      errorLogger.log({
        type: ErrorType.AUTHENTICATION,
        severity: ErrorSeverity.HIGH,
        message: 'Sesión expirada. Por favor, inicia sesión nuevamente.',
        originalError: error,
        statusCode: status,
        timestamp: new Date().toISOString(),
        context: { url, method },
      })

      if (typeof window !== 'undefined') {
        localStorage.removeItem('token')
        localStorage.removeItem('user')
        // Eliminar cookie
        document.cookie = 'token=; path=/; expires=Thu, 01 Jan 1970 00:00:01 GMT;'

        // Solo redirigir si no estamos ya en login
        if (!window.location.pathname.includes('/login')) {
          window.location.href = '/login?session=expired'
        }
      }
    } else if (status === 403) {
      // Acceso prohibido
      errorLogger.log({
        type: ErrorType.AUTHORIZATION,
        severity: ErrorSeverity.MEDIUM,
        message: 'No tienes permisos para realizar esta acción',
        originalError: error,
        statusCode: status,
        timestamp: new Date().toISOString(),
        context: { url, method },
      })
    } else if (status === 404) {
      // Recurso no encontrado
      errorLogger.log({
        type: ErrorType.NOT_FOUND,
        severity: ErrorSeverity.LOW,
        message: `Recurso no encontrado: ${url}`,
        originalError: error,
        statusCode: status,
        timestamp: new Date().toISOString(),
        context: { url, method },
      })
    } else if (status && status >= 500) {
      // Error del servidor
      errorLogger.log({
        type: ErrorType.SERVER,
        severity: ErrorSeverity.HIGH,
        message: 'Error del servidor. Por favor, intenta nuevamente más tarde.',
        originalError: error,
        statusCode: status,
        timestamp: new Date().toISOString(),
        context: { url, method },
      })
    } else if (!error.response) {
      // Error de red (sin respuesta del servidor)
      errorLogger.log({
        type: ErrorType.NETWORK,
        severity: ErrorSeverity.MEDIUM,
        message: 'Error de conexión. Verifica tu conexión a internet.',
        originalError: error,
        timestamp: new Date().toISOString(),
        context: { url, method },
      })
    }

    return Promise.reject(error)
  }
)
