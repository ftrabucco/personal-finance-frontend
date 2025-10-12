'use client'

// src/app/global-error.tsx
import { AlertTriangle } from 'lucide-react'

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  return (
    <html>
      <body>
        <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4">
          <div className="text-center max-w-md">
            {/* Icon */}
            <div className="flex justify-center mb-6">
              <AlertTriangle className="h-20 w-20 text-red-500" strokeWidth={1.5} />
            </div>

            {/* Title */}
            <h1 className="text-3xl font-bold text-gray-900 mb-4">Error Crítico</h1>

            {/* Message */}
            <p className="text-gray-600 mb-6">
              Ha ocurrido un error crítico en la aplicación. Por favor, recarga la página.
            </p>

            {/* Error details in development */}
            {process.env.NODE_ENV === 'development' && (
              <div className="mt-4 p-4 bg-red-50 rounded-lg text-left">
                <p className="text-sm text-red-800 font-mono break-all">{error.message}</p>
                {error.digest && (
                  <p className="text-xs text-gray-600 mt-2">Error ID: {error.digest}</p>
                )}
              </div>
            )}

            {/* Actions */}
            <div className="flex flex-col gap-3 mt-8">
              <button
                onClick={reset}
                className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium"
              >
                Intentar nuevamente
              </button>
              <button
                onClick={() => window.location.href = '/'}
                className="px-6 py-3 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
              >
                Ir al inicio
              </button>
            </div>
          </div>
        </div>
      </body>
    </html>
  )
}
