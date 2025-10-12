// src/types/api.ts

export interface StandardResponse<T> {
  success: boolean
  data: T
  meta?: {
    total: number
    type: 'single' | 'collection'
    pagination?: Pagination
  }
}

export interface Pagination {
  limit: number
  offset: number
  hasNext: boolean
  hasPrev: boolean
}

export interface StandardError {
  success: false
  error: string
  details?: any
  timestamp: string
}

export interface ValidationError {
  success: false
  error: string
  details: Array<{
    field: string
    message: string
    value?: any
  }>
  timestamp: string
}

export interface GastosSummary {
  periodo: {
    desde: string
    hasta: string
  }
  total_ars: number
  total_usd: number
  cantidad_gastos: number
  por_categoria: Record<string, {
    total_ars: number
    total_usd: number
    cantidad: number
  }>
  por_importancia: Record<string, {
    total_ars: number
    total_usd: number
    cantidad: number
  }>
  por_tipo_pago: Record<string, {
    total_ars: number
    total_usd: number
    cantidad: number
  }>
}

export interface LoginResponse {
  token: string
  user: {
    id: number
    nombre: string
    email: string
  }
}
