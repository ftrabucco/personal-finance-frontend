'use client'

// src/app/not-found.tsx
import Link from 'next/link'
import { FileQuestion, Home, ArrowLeft } from 'lucide-react'
import { Button } from '@/components/ui/button'

export default function NotFound() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-900 dark:to-gray-800 px-4">
      <div className="text-center">
        {/* Icon */}
        <div className="flex justify-center mb-6">
          <div className="relative">
            <div className="absolute inset-0 bg-primary/20 blur-3xl rounded-full" />
            <FileQuestion className="relative h-24 w-24 text-primary" strokeWidth={1.5} />
          </div>
        </div>

        {/* 404 */}
        <h1 className="text-9xl font-bold text-gray-200 dark:text-gray-700 mb-2">404</h1>

        {/* Message */}
        <h2 className="text-3xl font-bold text-gray-900 dark:text-gray-100 mb-4">
          Página no encontrada
        </h2>
        <p className="text-gray-600 dark:text-gray-400 mb-8 max-w-md mx-auto">
          Lo sentimos, la página que estás buscando no existe o ha sido movida.
        </p>

        {/* Actions */}
        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <Button asChild size="lg">
            <Link href="/">
              <Home className="mr-2 h-4 w-4" />
              Ir al inicio
            </Link>
          </Button>
          <Button asChild variant="outline" size="lg" onClick={() => window.history.back()}>
            <button>
              <ArrowLeft className="mr-2 h-4 w-4" />
              Volver atrás
            </button>
          </Button>
        </div>

        {/* Additional help */}
        <div className="mt-12 text-sm text-gray-500 dark:text-gray-400">
          <p>¿Necesitas ayuda? Verifica que la URL sea correcta.</p>
        </div>
      </div>
    </div>
  )
}
