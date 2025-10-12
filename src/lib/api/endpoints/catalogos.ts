// src/lib/api/endpoints/catalogos.ts
import { apiClient } from '../client'
import type { StandardResponse, Categoria, Importancia, TipoPago, Frecuencia } from '@/types'

export const catalogosApi = {
  // Categorías
  getCategorias: async () => {
    const { data } = await apiClient.get<StandardResponse<Categoria[]>>('/categorias')
    return data
  },

  // Importancias
  getImportancias: async () => {
    const { data } = await apiClient.get<StandardResponse<Importancia[]>>('/importancias')
    return data
  },

  // Tipos de Pago
  getTiposPago: async () => {
    const { data } = await apiClient.get<StandardResponse<TipoPago[]>>('/tipos-pago')
    return data
  },

  // Frecuencias
  getFrecuencias: async () => {
    const { data } = await apiClient.get<StandardResponse<Frecuencia[]>>('/frecuencias')
    return data
  },
}
