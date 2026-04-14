import { apiClient } from '../client'
import type { StandardResponse, PreferenciasUsuario, ModulosDisponibles } from '@/types'

export interface UpdatePreferenciasPayload {
  modulos_activos?: string[]
  tema?: 'light' | 'dark' | 'system'
  balance_inicial?: number
}

export interface ToggleModuloPayload {
  modulo: string
  activo: boolean
}

export const preferenciasApi = {
  // Obtener preferencias del usuario
  getPreferencias: async () => {
    const { data } = await apiClient.get<StandardResponse<PreferenciasUsuario>>('/preferencias')
    return data
  },

  // Actualizar preferencias
  updatePreferencias: async (payload: UpdatePreferenciasPayload) => {
    const { data } = await apiClient.put<StandardResponse<PreferenciasUsuario>>('/preferencias', payload)
    return data
  },

  // Toggle un módulo específico
  toggleModulo: async (payload: ToggleModuloPayload) => {
    const { data } = await apiClient.patch<StandardResponse<PreferenciasUsuario>>('/preferencias/modulos', payload)
    return data
  },

  // Obtener módulos con estado (activos para el usuario)
  getModulos: async () => {
    const { data } = await apiClient.get<StandardResponse<ModulosDisponibles>>('/modulos')
    return data
  },

  // Obtener lista de módulos disponibles (sin estado de usuario)
  getModulosDisponibles: async () => {
    const { data } = await apiClient.get<StandardResponse<ModulosDisponibles>>('/modulos/disponibles')
    return data
  },
}
