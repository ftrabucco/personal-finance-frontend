// src/lib/api/endpoints/fuentesIngreso.ts
import { apiClient } from '../client'
import type { StandardResponse, FuenteIngreso } from '@/types'

export interface CreateFuenteIngresoInput {
  nombre: string
  icono?: string
  orden?: number
}

export interface UpdateFuenteIngresoInput {
  nombre?: string
  icono?: string
  orden?: number
  activo?: boolean
}

export interface ReorderFuentesIngresoInput {
  orden: Array<{ id: number; orden: number }>
}

export const fuentesIngresoApi = {
  // Obtener todas las fuentes de ingreso del usuario (sistema + personalizadas)
  getFuentesIngreso: async (includeInactive = false) => {
    const params = includeInactive ? '?includeInactive=true' : ''
    const { data } = await apiClient.get<StandardResponse<FuenteIngreso[]>>(`/fuentes-ingreso${params}`)
    return data.data
  },

  // Obtener una fuente por ID
  getFuenteIngresoById: async (id: number) => {
    const { data } = await apiClient.get<StandardResponse<FuenteIngreso>>(`/fuentes-ingreso/${id}`)
    return data.data
  },

  // Crear una nueva fuente de ingreso personalizada
  createFuenteIngreso: async (input: CreateFuenteIngresoInput) => {
    const { data } = await apiClient.post<StandardResponse<FuenteIngreso>>('/fuentes-ingreso', input)
    return data.data
  },

  // Actualizar una fuente (solo personalizadas)
  updateFuenteIngreso: async (id: number, input: UpdateFuenteIngresoInput) => {
    const { data } = await apiClient.put<StandardResponse<FuenteIngreso>>(`/fuentes-ingreso/${id}`, input)
    return data.data
  },

  // Toggle activo/inactivo de una fuente
  toggleActivo: async (id: number) => {
    const { data } = await apiClient.patch<StandardResponse<FuenteIngreso>>(`/fuentes-ingreso/${id}/toggle-activo`)
    return data.data
  },

  // Reordenar fuentes
  reorderFuentesIngreso: async (input: ReorderFuentesIngresoInput) => {
    const { data } = await apiClient.put<StandardResponse<{ message: string }>>('/fuentes-ingreso/reorder', input)
    return data.data
  },

  // Eliminar una fuente (solo personalizadas no usadas)
  deleteFuenteIngreso: async (id: number) => {
    const { data } = await apiClient.delete<StandardResponse<{ message: string }>>(`/fuentes-ingreso/${id}`)
    return data.data
  },
}
