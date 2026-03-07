'use client'

import { useState, useEffect } from 'react'
import { X, Settings2, Sparkles } from 'lucide-react'
import { Button } from '@/components/ui/button'
import Link from 'next/link'

const STORAGE_KEY = 'modulos-discovery-dismissed'

export function ModulosDiscoveryBanner() {
  const [isDismissed, setIsDismissed] = useState(true) // Start hidden to avoid flash
  const [isVisible, setIsVisible] = useState(false)

  useEffect(() => {
    // Check localStorage on mount
    const dismissed = localStorage.getItem(STORAGE_KEY)
    if (!dismissed) {
      setIsDismissed(false)
      // Small delay for smooth entrance
      setTimeout(() => setIsVisible(true), 100)
    }
  }, [])

  const handleDismiss = () => {
    setIsVisible(false)
    // Wait for animation before hiding
    setTimeout(() => {
      setIsDismissed(true)
      localStorage.setItem(STORAGE_KEY, 'true')
    }, 300)
  }

  if (isDismissed) return null

  return (
    <div
      className={`
        relative overflow-hidden rounded-lg border border-blue-200 bg-gradient-to-r from-blue-50 to-indigo-50
        dark:border-blue-900 dark:from-blue-950/50 dark:to-indigo-950/50
        transition-all duration-300 ease-out
        ${isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 -translate-y-2'}
      `}
    >
      <div className="flex items-start gap-3 p-4">
        <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-blue-100 dark:bg-blue-900">
          <Sparkles className="h-4 w-4 text-blue-600 dark:text-blue-400" />
        </div>

        <div className="flex-1 min-w-0">
          <p className="text-sm font-medium text-blue-900 dark:text-blue-100">
            Personalizá tu experiencia
          </p>
          <p className="text-sm text-blue-700 dark:text-blue-300 mt-0.5">
            Podés activar funciones avanzadas como tarjetas, cuotas, proyecciones y más desde Configuración.
          </p>

          <div className="flex items-center gap-2 mt-3">
            <Link href="/configuracion">
              <Button size="sm" variant="default" className="h-8 gap-1.5">
                <Settings2 className="h-3.5 w-3.5" />
                Ir a Módulos
              </Button>
            </Link>
            <Button
              size="sm"
              variant="ghost"
              className="h-8 text-blue-700 hover:text-blue-900 dark:text-blue-300 dark:hover:text-blue-100"
              onClick={handleDismiss}
            >
              Ahora no
            </Button>
          </div>
        </div>

        <Button
          variant="ghost"
          size="icon"
          className="h-6 w-6 shrink-0 text-blue-400 hover:text-blue-600 dark:text-blue-500 dark:hover:text-blue-300"
          onClick={handleDismiss}
        >
          <X className="h-4 w-4" />
          <span className="sr-only">Cerrar</span>
        </Button>
      </div>
    </div>
  )
}
