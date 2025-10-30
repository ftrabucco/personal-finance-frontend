// src/lib/utils/cleanFormData.ts

/**
 * Limpia campos calculados por el backend antes de enviar.
 * El backend usa Joi.forbidden() en estos campos y rechaza con 400 si se envían.
 */

const FORBIDDEN_FIELDS = [
  // Campos multi-moneda calculados
  'monto_ars',
  'monto_usd',
  'monto_total_ars',
  'monto_total_usd',
  'tipo_cambio_usado',
  'tipo_cambio_referencia',

  // Otros campos calculados/automáticos
  'procesado',
  'pendiente_cuotas',
  'monto_pagado',
  'gasto',

  // Campos de auditoría (timestamps)
  'createdAt',
  'updatedAt',

  // ID (en caso de create)
  // 'id', // Comentado porque en update sí lo necesitamos
]

/**
 * Limpia un objeto eliminando campos prohibidos por el backend
 */
export function cleanFormData<T extends Record<string, any>>(data: T): Partial<T> {
  const cleaned = { ...data }

  FORBIDDEN_FIELDS.forEach(field => {
    if (field in cleaned) {
      delete cleaned[field]
    }
  })

  // También eliminar relaciones anidadas
  if ('categoria' in cleaned) delete cleaned.categoria
  if ('importancia' in cleaned) delete cleaned.importancia
  if ('tipoPago' in cleaned) delete cleaned.tipoPago
  if ('tarjeta' in cleaned) delete cleaned.tarjeta
  if ('frecuencia' in cleaned) delete cleaned.frecuencia

  return cleaned
}

/**
 * Para GastoUnico específicamente
 */
export function cleanGastoUnicoData(data: any) {
  return cleanFormData(data)
}

/**
 * Para Compra específicamente
 */
export function cleanCompraData(data: any) {
  return cleanFormData(data)
}

/**
 * Para GastoRecurrente específicamente
 */
export function cleanGastoRecurrenteData(data: any) {
  return cleanFormData(data)
}

/**
 * Para DebitoAutomatico específicamente
 */
export function cleanDebitoAutomaticoData(data: any) {
  return cleanFormData(data)
}
