'use client'

// src/app/error.tsx
import { useEffect } from 'react'
import { AlertCircle, RefreshCw, Home } from 'lucide-react'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { errorLogger } from '@/lib/utils/errorHandler'

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  useEffect(() => {
    // Log el error en nuestro sistema centralizado
    errorLogger.log({
      type: 'UNKNOWN' as any,
      severity: 'HIGH' as any,
      message: error.message,
      originalError: error,
      timestamp: new Date().toISOString(),
      context: {
        digest: error.digest,
        stack: error.stack,
      },
    })
  }, [error])

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-red-50 to-orange-50 dark:from-gray-900 dark:to-gray-800 px-4">
      <div className="text-center max-w-2xl">
        {/* Icon */}
        <div className="flex justify-center mb-6">
          <div className="relative">
            <div className="absolute inset-0 bg-red-500/20 blur-3xl rounded-full" />
            <AlertCircle className="relative h-24 w-24 text-red-500" strokeWidth={1.5} />
          </div>
        </div>

        {/* Title */}
        <h1 className="text-4xl font-bold text-gray-900 dark:text-gray-100 mb-4">
          ¡Algo salió mal!
        </h1>

        {/* Error Message */}
        <p className="text-gray-600 dark:text-gray-400 mb-2">
          Ha ocurrido un error inesperado. Estamos trabajando para resolverlo.
        </p>

        {/* Technical details (development only) */}
        {process.env.NODE_ENV === 'development' && (
          <details className="mt-6 text-left bg-gray-100 dark:bg-gray-800 rounded-lg p-4">
            <summary className="cursor-pointer font-semibold text-sm text-gray-700 dark:text-gray-300 mb-2">
              Detalles técnicos (solo en desarrollo)
            </summary>
            <div className="mt-2 text-xs">
              <p className="text-red-600 dark:text-red-400 font-mono mb-2">{error.message}</p>
              {error.digest && (
                <p className="text-gray-600 dark:text-gray-400 mb-2">
                  Error ID: <code className="bg-gray-200 dark:bg-gray-700 px-1 py-0.5 rounded">{error.digest}</code>
                </p>
              )}
              {error.stack && (
                <pre className="text-gray-600 dark:text-gray-400 overflow-auto max-h-48 p-2 bg-white dark:bg-gray-900 rounded">
                  {error.stack}
                </pre>
              )}
            </div>
          </details>
        )}

        {/* Actions */}
        <div className="flex flex-col sm:flex-row gap-4 justify-center mt-8">
          <Button onClick={reset} size="lg">
            <RefreshCw className="mr-2 h-4 w-4" />
            Intentar nuevamente
          </Button>
          <Button asChild variant="outline" size="lg">
            <Link href="/">
              <Home className="mr-2 h-4 w-4" />
              Ir al inicio
            </Link>
          </Button>
        </div>

        {/* Help text */}
        <p className="mt-8 text-sm text-gray-500 dark:text-gray-400">
          Si el problema persiste, por favor contacta al soporte técnico.
        </p>
      </div>
    </div>
  )
}
