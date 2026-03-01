// src/lib/api/endpoints/categorias.ts
import { apiClient } from '../client'
import type { StandardResponse, Categoria } from '@/types'

export interface CreateCategoriaInput {
  nombre_categoria: string
  icono?: string
  orden?: number
}

export interface UpdateCategoriaInput {
  nombre_categoria?: string
  icono?: string
  orden?: number
  activo?: boolean
}

export interface ReorderCategoriasInput {
  orden: Array<{ id: number; orden: number }>
}

export const categoriasApi = {
  // Obtener todas las categorías del usuario (sistema + personalizadas)
  getCategorias: async (includeInactive = false) => {
    const params = includeInactive ? '?includeInactive=true' : ''
    const { data } = await apiClient.get<StandardResponse<Categoria[]>>(`/categorias${params}`)
    return data.data
  },

  // Obtener una categoría por ID
  getCategoriaById: async (id: number) => {
    const { data } = await apiClient.get<StandardResponse<Categoria>>(`/categorias/${id}`)
    return data.data
  },

  // Crear una nueva categoría personalizada
  createCategoria: async (input: CreateCategoriaInput) => {
    const { data } = await apiClient.post<StandardResponse<Categoria>>('/categorias', input)
    return data.data
  },

  // Actualizar una categoría (solo personalizadas)
  updateCategoria: async (id: number, input: UpdateCategoriaInput) => {
    const { data } = await apiClient.put<StandardResponse<Categoria>>(`/categorias/${id}`, input)
    return data.data
  },

  // Toggle activo/inactivo de una categoría
  toggleActivo: async (id: number) => {
    const { data } = await apiClient.patch<StandardResponse<Categoria>>(`/categorias/${id}/toggle-activo`)
    return data.data
  },

  // Reordenar categorías
  reorderCategorias: async (input: ReorderCategoriasInput) => {
    const { data } = await apiClient.put<StandardResponse<{ message: string }>>('/categorias/reorder', input)
    return data.data
  },

  // Eliminar una categoría (solo personalizadas no usadas)
  deleteCategoria: async (id: number) => {
    const { data } = await apiClient.delete<StandardResponse<{ message: string }>>(`/categorias/${id}`)
    return data.data
  },
}
