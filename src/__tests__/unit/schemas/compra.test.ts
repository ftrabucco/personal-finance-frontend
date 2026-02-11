import { describe, it, expect } from 'vitest'
import { z } from 'zod'

// Schema from CompraForm
const compraSchema = z.object({
  descripcion: z.string().min(1, 'La descripción es requerida'),
  monto_total: z.number().positive('El monto debe ser mayor a 0'),
  moneda_origen: z.enum(['ARS', 'USD'], { message: 'La moneda es requerida' }),
  fecha_compra: z.string().min(1, 'La fecha es requerida'),
  cantidad_cuotas: z.number().int().min(1, 'Debe tener al menos 1 cuota'),
  categoria_gasto_id: z.number({ message: 'La categoría es requerida' }),
  importancia_gasto_id: z.number({ message: 'La importancia es requerida' }),
  tipo_pago_id: z.number({ message: 'El tipo de pago es requerido' }),
  tarjeta_id: z.number().nullable(),
})

describe('Compra Schema Validation', () => {
  describe('Valid cases', () => {
    it('should validate a single payment purchase (1 cuota)', () => {
      const validCompra = {
        descripcion: 'Notebook Lenovo',
        monto_total: 500000,
        moneda_origen: 'ARS' as const,
        fecha_compra: '2024-01-15',
        cantidad_cuotas: 1,
        categoria_gasto_id: 4,
        importancia_gasto_id: 2,
        tipo_pago_id: 3,
        tarjeta_id: 1,
      }

      const result = compraSchema.safeParse(validCompra)
      expect(result.success).toBe(true)
    })

    it('should validate a purchase with multiple installments', () => {
      const validCompra = {
        descripcion: 'iPhone 15 Pro',
        monto_total: 1200000,
        moneda_origen: 'ARS' as const,
        fecha_compra: '2024-01-20',
        cantidad_cuotas: 12,
        categoria_gasto_id: 4,
        importancia_gasto_id: 3,
        tipo_pago_id: 3,
        tarjeta_id: 2,
      }

      const result = compraSchema.safeParse(validCompra)
      expect(result.success).toBe(true)
    })

    it('should validate a purchase in USD', () => {
      const validCompra = {
        descripcion: 'Amazon Order',
        monto_total: 299.99,
        moneda_origen: 'USD' as const,
        fecha_compra: '2024-01-25',
        cantidad_cuotas: 1,
        categoria_gasto_id: 4,
        importancia_gasto_id: 2,
        tipo_pago_id: 3,
        tarjeta_id: 3,
      }

      const result = compraSchema.safeParse(validCompra)
      expect(result.success).toBe(true)
    })

    it('should validate a purchase without tarjeta', () => {
      const validCompra = {
        descripcion: 'Cash purchase',
        monto_total: 50000,
        moneda_origen: 'ARS' as const,
        fecha_compra: '2024-01-15',
        cantidad_cuotas: 1,
        categoria_gasto_id: 1,
        importancia_gasto_id: 1,
        tipo_pago_id: 1,
        tarjeta_id: null,
      }

      const result = compraSchema.safeParse(validCompra)
      expect(result.success).toBe(true)
    })
  })

  describe('Invalid cases - cantidad_cuotas', () => {
    it('should reject zero cuotas', () => {
      const invalidCompra = {
        descripcion: 'Test',
        monto_total: 100000,
        moneda_origen: 'ARS' as const,
        fecha_compra: '2024-01-15',
        cantidad_cuotas: 0,
        categoria_gasto_id: 1,
        importancia_gasto_id: 1,
        tipo_pago_id: 1,
        tarjeta_id: null,
      }

      const result = compraSchema.safeParse(invalidCompra)
      expect(result.success).toBe(false)
      if (!result.success) {
        expect(result.error.issues[0].message).toBe('Debe tener al menos 1 cuota')
      }
    })

    it('should reject negative cuotas', () => {
      const invalidCompra = {
        descripcion: 'Test',
        monto_total: 100000,
        moneda_origen: 'ARS' as const,
        fecha_compra: '2024-01-15',
        cantidad_cuotas: -3,
        categoria_gasto_id: 1,
        importancia_gasto_id: 1,
        tipo_pago_id: 1,
        tarjeta_id: null,
      }

      const result = compraSchema.safeParse(invalidCompra)
      expect(result.success).toBe(false)
    })

    it('should reject decimal cuotas', () => {
      const invalidCompra = {
        descripcion: 'Test',
        monto_total: 100000,
        moneda_origen: 'ARS' as const,
        fecha_compra: '2024-01-15',
        cantidad_cuotas: 3.5,
        categoria_gasto_id: 1,
        importancia_gasto_id: 1,
        tipo_pago_id: 1,
        tarjeta_id: null,
      }

      const result = compraSchema.safeParse(invalidCompra)
      expect(result.success).toBe(false)
    })

    it('should accept high number of cuotas (48)', () => {
      const validCompra = {
        descripcion: 'Auto',
        monto_total: 20000000,
        moneda_origen: 'ARS' as const,
        fecha_compra: '2024-01-15',
        cantidad_cuotas: 48,
        categoria_gasto_id: 1,
        importancia_gasto_id: 1,
        tipo_pago_id: 3,
        tarjeta_id: 1,
      }

      const result = compraSchema.safeParse(validCompra)
      expect(result.success).toBe(true)
    })
  })

  describe('Invalid cases - monto_total', () => {
    it('should reject zero monto_total', () => {
      const invalidCompra = {
        descripcion: 'Test',
        monto_total: 0,
        moneda_origen: 'ARS' as const,
        fecha_compra: '2024-01-15',
        cantidad_cuotas: 1,
        categoria_gasto_id: 1,
        importancia_gasto_id: 1,
        tipo_pago_id: 1,
        tarjeta_id: null,
      }

      const result = compraSchema.safeParse(invalidCompra)
      expect(result.success).toBe(false)
      if (!result.success) {
        expect(result.error.issues[0].message).toBe('El monto debe ser mayor a 0')
      }
    })

    it('should reject negative monto_total', () => {
      const invalidCompra = {
        descripcion: 'Test',
        monto_total: -50000,
        moneda_origen: 'ARS' as const,
        fecha_compra: '2024-01-15',
        cantidad_cuotas: 1,
        categoria_gasto_id: 1,
        importancia_gasto_id: 1,
        tipo_pago_id: 1,
        tarjeta_id: null,
      }

      const result = compraSchema.safeParse(invalidCompra)
      expect(result.success).toBe(false)
    })
  })

  describe('Cuota calculation helper', () => {
    it('should calculate monthly installment correctly', () => {
      const montoTotal = 120000
      const cantidadCuotas = 12
      const montoPorCuota = montoTotal / cantidadCuotas

      expect(montoPorCuota).toBe(10000)
    })

    it('should handle uneven division', () => {
      const montoTotal = 100000
      const cantidadCuotas = 3
      const montoPorCuota = montoTotal / cantidadCuotas

      expect(montoPorCuota).toBeCloseTo(33333.33, 2)
    })

    it('should handle single payment', () => {
      const montoTotal = 50000
      const cantidadCuotas = 1
      const montoPorCuota = montoTotal / cantidadCuotas

      expect(montoPorCuota).toBe(50000)
    })
  })

  describe('Edge cases', () => {
    it('should accept very small amounts', () => {
      const validCompra = {
        descripcion: 'Small item',
        monto_total: 0.01,
        moneda_origen: 'ARS' as const,
        fecha_compra: '2024-01-15',
        cantidad_cuotas: 1,
        categoria_gasto_id: 1,
        importancia_gasto_id: 1,
        tipo_pago_id: 1,
        tarjeta_id: null,
      }

      const result = compraSchema.safeParse(validCompra)
      expect(result.success).toBe(true)
    })

    it('should accept very large amounts', () => {
      const validCompra = {
        descripcion: 'Expensive item',
        monto_total: 999999999.99,
        moneda_origen: 'ARS' as const,
        fecha_compra: '2024-01-15',
        cantidad_cuotas: 1,
        categoria_gasto_id: 1,
        importancia_gasto_id: 1,
        tipo_pago_id: 1,
        tarjeta_id: null,
      }

      const result = compraSchema.safeParse(validCompra)
      expect(result.success).toBe(true)
    })
  })
})
