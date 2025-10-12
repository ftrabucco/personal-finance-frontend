'use client'

// src/components/error/ErrorBoundary.tsx
import React, { Component, ErrorInfo, ReactNode } from 'react'
import { AlertTriangle, RefreshCw } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { errorLogger, ErrorType, ErrorSeverity } from '@/lib/utils/errorHandler'

interface Props {
  children: ReactNode
  fallback?: ReactNode
  onError?: (error: Error, errorInfo: ErrorInfo) => void
  showDetails?: boolean
}

interface State {
  hasError: boolean
  error?: Error
  errorInfo?: ErrorInfo
}

export class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props)
    this.state = { hasError: false }
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error }
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    // Log el error
    errorLogger.log({
      type: ErrorType.UNKNOWN,
      severity: ErrorSeverity.HIGH,
      message: error.message,
      originalError: error,
      timestamp: new Date().toISOString(),
      context: {
        componentStack: errorInfo.componentStack,
      },
    })

    // Callback personalizado
    this.props.onError?.(error, errorInfo)

    // Guardar errorInfo en el estado
    this.setState({ errorInfo })
  }

  render() {
    if (this.state.hasError) {
      // Fallback personalizado
      if (this.props.fallback) {
        return this.props.fallback
      }

      // Fallback por defecto
      return (
        <div className="flex items-center justify-center min-h-[400px] p-8">
          <div className="text-center max-w-md">
            {/* Icon */}
            <div className="flex justify-center mb-4">
              <AlertTriangle className="h-16 w-16 text-yellow-500" strokeWidth={1.5} />
            </div>

            {/* Title */}
            <h2 className="text-2xl font-bold text-gray-900 dark:text-gray-100 mb-2">
              Algo salió mal
            </h2>

            {/* Message */}
            <p className="text-gray-600 dark:text-gray-400 mb-6">
              Ha ocurrido un error inesperado. Por favor, intenta recargar la página.
            </p>

            {/* Error details (development only) */}
            {this.props.showDetails && process.env.NODE_ENV === 'development' && this.state.error && (
              <details className="text-left bg-red-50 dark:bg-red-900/20 rounded-lg p-4 mb-4">
                <summary className="cursor-pointer font-semibold text-sm text-red-700 dark:text-red-400 mb-2">
                  Detalles del error (solo en desarrollo)
                </summary>
                <div className="mt-2 text-xs">
                  <p className="text-red-600 dark:text-red-400 font-mono mb-2">
                    {this.state.error.message}
                  </p>
                  {this.state.error.stack && (
                    <pre className="text-gray-600 dark:text-gray-400 overflow-auto max-h-48 p-2 bg-white dark:bg-gray-900 rounded">
                      {this.state.error.stack}
                    </pre>
                  )}
                  {this.state.errorInfo && (
                    <pre className="text-gray-600 dark:text-gray-400 overflow-auto max-h-48 p-2 bg-white dark:bg-gray-900 rounded mt-2">
                      {this.state.errorInfo.componentStack}
                    </pre>
                  )}
                </div>
              </details>
            )}

            {/* Actions */}
            <div className="flex flex-col sm:flex-row gap-3 justify-center">
              <Button
                onClick={() => {
                  this.setState({ hasError: false, error: undefined, errorInfo: undefined })
                }}
                size="lg"
              >
                <RefreshCw className="mr-2 h-4 w-4" />
                Intentar nuevamente
              </Button>
              <Button
                variant="outline"
                onClick={() => window.location.reload()}
                size="lg"
              >
                Recargar página
              </Button>
            </div>
          </div>
        </div>
      )
    }

    return this.props.children
  }
}

// Hook para usar en componentes funcionales
export function useErrorHandler() {
  const [error, setError] = React.useState<Error | null>(null)

  React.useEffect(() => {
    if (error) {
      throw error
    }
  }, [error])

  return setError
}
