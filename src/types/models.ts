// src/types/models.ts

export interface User {
  id: number
  nombre: string
  email: string
  createdAt?: string
  updatedAt?: string
}

export interface Gasto {
  id: number
  fecha: string // ISO date
  monto_ars: string
  monto_usd: string | null
  descripcion: string
  categoria_gasto_id: number
  importancia_gasto_id: number
  frecuencia_gasto_id: number | null
  cantidad_cuotas_totales: number | null
  cantidad_cuotas_pagadas: number | null
  tipo_pago_id: number
  tarjeta_id: number | null
  usuario_id: number
  tipo_origen: 'unico' | 'recurrente' | 'debito_automatico' | 'compra'
  id_origen: number
  createdAt: string
  updatedAt: string
  // Relaciones
  categoria?: Categoria
  importancia?: Importancia
  tipoPago?: TipoPago
  tarjeta?: Tarjeta
  frecuencia?: Frecuencia
}

export interface GastoUnico {
  id: number
  descripcion: string
  monto: number
  moneda_origen: Moneda
  monto_ars: number
  monto_usd: number
  tipo_cambio_usado: number
  fecha: string
  categoria_gasto_id: number
  importancia_gasto_id: number
  tipo_pago_id: number
  tarjeta_id: number | null
  procesado: boolean
  createdAt: string
  updatedAt: string
  // Relaciones
  categoria?: Categoria
  importancia?: Importancia
  tipoPago?: TipoPago
  tarjeta?: Tarjeta
}

export interface Compra {
  id: number
  descripcion: string
  monto_total: number
  moneda_origen: Moneda
  monto_total_ars: number
  monto_total_usd: number
  tipo_cambio_usado: number
  monto_pagado: number
  fecha_compra: string
  cantidad_cuotas: number
  pendiente_cuotas: boolean
  categoria_gasto_id: number
  importancia_gasto_id: number
  tipo_pago_id: number
  tarjeta_id: number | null
  cuotas_pagadas: number
  createdAt: string
  updatedAt: string
  // Relaciones
  categoria?: Categoria
  importancia?: Importancia
  tipoPago?: TipoPago
  tarjeta?: Tarjeta
}

export interface GastoRecurrente {
  id: number
  descripcion: string
  monto: number
  moneda_origen: Moneda
  monto_ars: number
  monto_usd: number
  tipo_cambio_referencia: number
  dia_de_pago: number
  mes_de_pago: number | null
  activo: boolean
  ultima_fecha_generado: string | null
  fecha_inicio: string | null
  categoria_gasto_id: number
  importancia_gasto_id: number
  tipo_pago_id: number
  tarjeta_id: number | null
  frecuencia_gasto_id: number
  createdAt: string
  updatedAt: string
  // Relaciones
  categoria?: Categoria
  importancia?: Importancia
  tipoPago?: TipoPago
  tarjeta?: Tarjeta
  frecuencia?: Frecuencia
}

export interface DebitoAutomatico {
  id: number
  descripcion: string
  monto: number
  moneda_origen: Moneda
  monto_ars: number
  monto_usd: number
  tipo_cambio_referencia: number
  dia_de_pago: number | null // Null when using credit card due date
  usa_vencimiento_tarjeta: boolean // If true, uses credit card's due date instead of dia_de_pago
  activo: boolean
  ultima_fecha_generado: string | null
  categoria_gasto_id: number
  importancia_gasto_id: number
  tipo_pago_id: number
  tarjeta_id: number | null
  cuenta_bancaria_id: number | null // Bank account for direct debits
  frecuencia_gasto_id: number
  createdAt: string
  updatedAt: string
  // Relaciones
  categoria?: Categoria
  importancia?: Importancia
  tipoPago?: TipoPago
  tarjeta?: Tarjeta
  cuentaBancaria?: CuentaBancaria
  frecuencia?: Frecuencia
}

export interface Tarjeta {
  id: number
  nombre: string
  tipo: 'debito' | 'credito' | 'virtual'
  banco: string
  ultimos_4_digitos: string | null
  dia_mes_cierre: number | null
  dia_mes_vencimiento: number | null
  permite_cuotas: boolean
  usuario_id: number
  createdAt?: string
  updatedAt?: string
}

export interface Categoria {
  id: number
  nombre_categoria: string
  usuario_id: number | null  // null = categoría del sistema
  activo: boolean
  orden: number
  icono: string | null
  // Metadata calculada por el backend
  es_sistema?: boolean
  puede_eliminar?: boolean
  visible?: boolean  // visibility preference (for system categories uses user prefs, for user categories uses activo)
}

export interface Importancia {
  id: number
  nombre_importancia: string
}

export interface TipoPago {
  id: number
  nombre: string
  permite_cuotas: boolean
}

export interface Frecuencia {
  id: number
  nombre_frecuencia: string
}

// Tipo de cambio
export interface TipoCambio {
  id?: number
  fecha: string // ISO date
  valor_compra_usd_ars: number
  valor_venta_usd_ars: number
  fuente: 'BCRA' | 'DolarAPI' | 'manual' | string
  activo?: boolean
  ultima_actualizacion?: string
  createdAt?: string
  updatedAt?: string
}

// Enum para monedas
export type Moneda = 'ARS' | 'USD'

// Fuente de Ingreso (catálogo)
export interface FuenteIngreso {
  id: number
  nombre: string
  usuario_id: number | null  // null = fuente del sistema
  activo: boolean
  orden: number
  icono: string | null
  // Metadata calculada por el backend
  es_sistema?: boolean
  puede_eliminar?: boolean
  visible?: boolean  // visibility preference (for system sources uses user prefs, for user sources uses activo)
}

// Ingreso Único
export interface IngresoUnico {
  id: number
  descripcion: string
  monto: number
  moneda_origen: Moneda
  monto_ars: number
  monto_usd: number
  tipo_cambio_usado: number
  fecha: string
  fuente_ingreso_id: number
  usuario_id: number
  created_at: string
  updated_at: string
  // Relaciones
  fuenteIngreso?: FuenteIngreso
}

// Ingreso Recurrente
export interface IngresoRecurrente {
  id: number
  descripcion: string
  monto: number
  moneda_origen: Moneda
  monto_ars: number
  monto_usd: number
  tipo_cambio_referencia: number
  dia_de_pago: number
  mes_de_pago: number | null
  activo: boolean
  fecha_inicio: string | null
  fecha_fin: string | null
  fuente_ingreso_id: number
  frecuencia_gasto_id: number
  usuario_id: number
  created_at: string
  updated_at: string
  // Relaciones
  fuenteIngreso?: FuenteIngreso
  frecuencia?: Frecuencia
}

// Cuenta Bancaria
export interface CuentaBancaria {
  id: number
  nombre: string
  banco: string
  tipo: 'ahorro' | 'corriente'
  ultimos_4_digitos: string | null
  moneda: Moneda
  activa: boolean
  usuario_id: number
  createdAt?: string
  updatedAt?: string
}

// Preferencias de Usuario
export type DashboardSection =
  | 'balance_acumulado'
  | 'tasa_ahorro'
  | 'evolucion_tabla'
  | 'ingresos_vs_gastos'
  | 'gastos_categoria'
  | 'desglose_mes'
  | 'gastos_recientes'
  | 'proyeccion'

export const DASHBOARD_SECTIONS_DEFAULT: DashboardSection[] = [
  'balance_acumulado',
  'tasa_ahorro',
  'evolucion_tabla',
  'ingresos_vs_gastos',
  'gastos_categoria',
  'desglose_mes',
  'gastos_recientes',
  'proyeccion',
]

export const DASHBOARD_SECTION_LABELS: Record<DashboardSection, string> = {
  balance_acumulado: 'Balance Acumulado',
  tasa_ahorro: 'Tasa de Ahorro',
  evolucion_tabla: 'Evolución Mensual',
  ingresos_vs_gastos: 'Ingresos vs Gastos',
  gastos_categoria: 'Gastos por Categoría',
  desglose_mes: 'Desglose del Mes',
  gastos_recientes: 'Gastos Recientes',
  proyeccion: 'Proyección',
}

export interface PreferenciasUsuario {
  id: number
  usuario_id: number
  modulos_activos: string[]
  tema: 'light' | 'dark' | 'system'
  balance_inicial: number
  dashboard_sections: DashboardSection[]
  created_at?: string
  updated_at?: string
}

// Información de Módulo
export interface ModuloInfo {
  nombre: string
  descripcion: string
  core: boolean
  activo?: boolean
}

// Mapa de módulos disponibles
export type ModulosDisponibles = Record<string, ModuloInfo>
