'use client'

import { createContext, useContext, ReactNode, useMemo } from 'react'
import { usePreferencias, useModulosDisponibles } from '@/lib/hooks/usePreferencias'
import { useAuth } from '@/lib/auth/authContext'
import type { ModulosDisponibles } from '@/types'

// Mapeo de módulos a rutas del sidebar
export const MODULO_ROUTES: Record<string, string[]> = {
  dashboard: ['/'],
  historial: ['/gastos'],
  gastos_unicos: ['/gastos-unicos'],
  ingresos_unicos: ['/ingresos-unicos'],
  configuracion: ['/configuracion'],
  perfil: ['/perfil'],
  compras: ['/compras'],
  gastos_recurrentes: ['/gastos-recurrentes'],
  debitos_automaticos: ['/debitos-automaticos'],
  ingresos_recurrentes: ['/ingresos-recurrentes'],
  tarjetas: ['/tarjetas'],
  cuentas_bancarias: ['/cuentas-bancarias'],
  proyecciones: ['/proyecciones'],
  salud_financiera: ['/salud-financiera'],
}

// Mapeo inverso: ruta -> módulo
export const ROUTE_TO_MODULO: Record<string, string> = Object.entries(MODULO_ROUTES).reduce(
  (acc, [modulo, rutas]) => {
    rutas.forEach(ruta => {
      acc[ruta] = modulo
    })
    return acc
  },
  {} as Record<string, string>
)

interface ModulosContextType {
  // Lista de módulos activos para el usuario
  modulosActivos: string[]
  // Todos los módulos disponibles con su metadata
  modulosDisponibles: ModulosDisponibles | undefined
  // Verifica si un módulo específico está activo
  isModuloActivo: (modulo: string) => boolean
  // Verifica si una ruta debe mostrarse
  isRutaVisible: (ruta: string) => boolean
  // Estado de carga
  isLoading: boolean
  // Estado de error
  isError: boolean
}

const ModulosContext = createContext<ModulosContextType | undefined>(undefined)

export function ModulosProvider({ children }: { children: ReactNode }) {
  const { isAuthenticated } = useAuth()
  const { data: preferencias, isLoading: prefLoading, isError: prefError } = usePreferencias({ enabled: isAuthenticated })
  const { data: modulosDisponibles, isLoading: modLoading, isError: modError } = useModulosDisponibles({ enabled: isAuthenticated })

  const isLoading = prefLoading || modLoading
  const isError = prefError || modError

  // Módulos activos = core + los que el usuario activó
  const modulosActivos = useMemo(() => {
    if (!preferencias || !modulosDisponibles) {
      // Durante la carga, mostramos todos para no flickear
      return Object.keys(MODULO_ROUTES)
    }

    const coreModulos = Object.entries(modulosDisponibles)
      .filter(([, config]) => config.core)
      .map(([key]) => key)

    return [...new Set([...coreModulos, ...preferencias.modulos_activos])]
  }, [preferencias, modulosDisponibles])

  const isModuloActivo = useMemo(() => {
    return (modulo: string): boolean => {
      // Durante la carga, asumimos todos activos
      if (!preferencias || !modulosDisponibles) {
        return true
      }

      // Módulos core siempre activos
      if (modulosDisponibles[modulo]?.core) {
        return true
      }

      return preferencias.modulos_activos.includes(modulo)
    }
  }, [preferencias, modulosDisponibles])

  const isRutaVisible = useMemo(() => {
    return (ruta: string): boolean => {
      const modulo = ROUTE_TO_MODULO[ruta]
      if (!modulo) {
        // Si la ruta no está mapeada a ningún módulo, la mostramos
        return true
      }
      return isModuloActivo(modulo)
    }
  }, [isModuloActivo])

  return (
    <ModulosContext.Provider
      value={{
        modulosActivos,
        modulosDisponibles,
        isModuloActivo,
        isRutaVisible,
        isLoading,
        isError,
      }}
    >
      {children}
    </ModulosContext.Provider>
  )
}

export function useModulosContext() {
  const context = useContext(ModulosContext)
  if (context === undefined) {
    throw new Error('useModulosContext must be used within a ModulosProvider')
  }
  return context
}
