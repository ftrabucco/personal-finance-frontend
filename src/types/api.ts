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

// Proyección de gastos
export interface GastoProyectado {
  tipo: 'recurrente' | 'debito_automatico' | 'compra'
  id_origen: number
  descripcion: string
  monto_ars: number
  monto_usd: number
  fecha_proyectada: string
  categoria: string
  importancia: string
  frecuencia?: string
  cuota_numero?: number
  cuotas_totales?: number
}

export interface ProyeccionMensual {
  mes: string // YYYY-MM
  total_ars: number
  total_usd: number
  cantidad_gastos: number
  gastos: GastoProyectado[]
}

export interface ProyeccionResumen {
  total_ars: number
  total_usd: number
  meses_proyectados: number
  promedio_mensual_ars: number
  promedio_mensual_usd: number
}

export interface ProyeccionResponse {
  proyeccion: ProyeccionMensual[]
  resumen: ProyeccionResumen
}

// Salud Financiera
export interface DesgloseMetrica {
  valor: number
  descripcion: string
  peso: number
  puntos: number
  cantidad_categorias?: number
}

export interface SaludFinancieraDesglose {
  ratio_esenciales: DesgloseMetrica
  gastos_evitables: DesgloseMetrica
  tendencia: DesgloseMetrica
  diversificacion: DesgloseMetrica
}

export interface DistribucionAgregada {
  total_ars: number
  cantidad: number
}

export interface SaludFinancieraDistribucion {
  por_importancia: Record<string, DistribucionAgregada>
  por_categoria: Record<string, DistribucionAgregada>
  por_tipo_pago: Record<string, DistribucionAgregada>
}

export interface SaludFinancieraResponse {
  score: number
  calificacion: 'Excelente' | 'Muy Buena' | 'Buena' | 'Regular' | 'Mejorable' | 'Crítica'
  mensaje?: string
  periodo: {
    tipo: string
    desde: string
    hasta: string
  }
  totales: {
    total_ars: number
    cantidad_gastos: number
  }
  desglose: SaludFinancieraDesglose | null
  distribucion?: SaludFinancieraDistribucion
  recomendaciones: string[]
}
