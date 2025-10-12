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
  fecha_compra: string
  cantidad_cuotas: number
  pendiente_cuotas: boolean
  categoria_gasto_id: number
  importancia_gasto_id: number
  tipo_pago_id: number
  tarjeta_id: number | null
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
  dia_de_pago: number
  activo: boolean
  ultima_fecha_generado: string | null
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

export interface Tarjeta {
  id: number
  nombre: string
  tipo: 'debito' | 'credito' | 'virtual'
  banco: string
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
  nombre: string
}
