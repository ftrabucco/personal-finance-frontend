import { describe, it, expect } from 'vitest'
import { z } from 'zod'

// Schema from GastoUnicoForm
const gastoUnicoSchema = z.object({
  descripcion: z.string().min(1, 'La descripción es requerida'),
  monto: z.number().positive('El monto debe ser mayor a 0'),
  moneda_origen: z.enum(['ARS', 'USD'], { message: 'La moneda es requerida' }),
  fecha: z.string().min(1, 'La fecha es requerida'),
  categoria_gasto_id: z.number({ message: 'La categoría es requerida' }),
  importancia_gasto_id: z.number({ message: 'La importancia es requerida' }),
  tipo_pago_id: z.number({ message: 'El tipo de pago es requerido' }),
  tarjeta_id: z.number().nullable(),
})

describe('GastoUnico Schema Validation', () => {
  describe('Valid cases', () => {
    it('should validate a complete gasto único in ARS', () => {
      const validGasto = {
        descripcion: 'Compra en supermercado',
        monto: 15000,
        moneda_origen: 'ARS' as const,
        fecha: '2024-01-15',
        categoria_gasto_id: 1,
        importancia_gasto_id: 2,
        tipo_pago_id: 1,
        tarjeta_id: null,
      }

      const result = gastoUnicoSchema.safeParse(validGasto)
      expect(result.success).toBe(true)
    })

    it('should validate a complete gasto único in USD', () => {
      const validGasto = {
        descripcion: 'Amazon purchase',
        monto: 50.99,
        moneda_origen: 'USD' as const,
        fecha: '2024-01-15',
        categoria_gasto_id: 5,
        importancia_gasto_id: 3,
        tipo_pago_id: 3,
        tarjeta_id: 2,
      }

      const result = gastoUnicoSchema.safeParse(validGasto)
      expect(result.success).toBe(true)
    })

    it('should validate gasto with tarjeta', () => {
      const validGasto = {
        descripcion: 'Cena restaurante',
        monto: 25000,
        moneda_origen: 'ARS' as const,
        fecha: '2024-01-20',
        categoria_gasto_id: 10,
        importancia_gasto_id: 3,
        tipo_pago_id: 3,
        tarjeta_id: 1,
      }

      const result = gastoUnicoSchema.safeParse(validGasto)
      expect(result.success).toBe(true)
    })
  })

  describe('Invalid cases - descripcion', () => {
    it('should reject empty descripcion', () => {
      const invalidGasto = {
        descripcion: '',
        monto: 100,
        moneda_origen: 'ARS' as const,
        fecha: '2024-01-15',
        categoria_gasto_id: 1,
        importancia_gasto_id: 1,
        tipo_pago_id: 1,
        tarjeta_id: null,
      }

      const result = gastoUnicoSchema.safeParse(invalidGasto)
      expect(result.success).toBe(false)
      if (!result.success) {
        expect(result.error.issues[0].message).toBe('La descripción es requerida')
      }
    })

    it('should reject missing descripcion', () => {
      const invalidGasto = {
        monto: 100,
        moneda_origen: 'ARS' as const,
        fecha: '2024-01-15',
        categoria_gasto_id: 1,
        importancia_gasto_id: 1,
        tipo_pago_id: 1,
        tarjeta_id: null,
      }

      const result = gastoUnicoSchema.safeParse(invalidGasto)
      expect(result.success).toBe(false)
    })
  })

  describe('Invalid cases - monto', () => {
    it('should reject zero monto', () => {
      const invalidGasto = {
        descripcion: 'Test',
        monto: 0,
        moneda_origen: 'ARS' as const,
        fecha: '2024-01-15',
        categoria_gasto_id: 1,
        importancia_gasto_id: 1,
        tipo_pago_id: 1,
        tarjeta_id: null,
      }

      const result = gastoUnicoSchema.safeParse(invalidGasto)
      expect(result.success).toBe(false)
      if (!result.success) {
        expect(result.error.issues[0].message).toBe('El monto debe ser mayor a 0')
      }
    })

    it('should reject negative monto', () => {
      const invalidGasto = {
        descripcion: 'Test',
        monto: -100,
        moneda_origen: 'ARS' as const,
        fecha: '2024-01-15',
        categoria_gasto_id: 1,
        importancia_gasto_id: 1,
        tipo_pago_id: 1,
        tarjeta_id: null,
      }

      const result = gastoUnicoSchema.safeParse(invalidGasto)
      expect(result.success).toBe(false)
    })

    it('should accept decimal monto', () => {
      const validGasto = {
        descripcion: 'Test',
        monto: 99.99,
        moneda_origen: 'ARS' as const,
        fecha: '2024-01-15',
        categoria_gasto_id: 1,
        importancia_gasto_id: 1,
        tipo_pago_id: 1,
        tarjeta_id: null,
      }

      const result = gastoUnicoSchema.safeParse(validGasto)
      expect(result.success).toBe(true)
    })
  })

  describe('Invalid cases - moneda_origen', () => {
    it('should reject invalid currency', () => {
      const invalidGasto = {
        descripcion: 'Test',
        monto: 100,
        moneda_origen: 'EUR',
        fecha: '2024-01-15',
        categoria_gasto_id: 1,
        importancia_gasto_id: 1,
        tipo_pago_id: 1,
        tarjeta_id: null,
      }

      const result = gastoUnicoSchema.safeParse(invalidGasto)
      expect(result.success).toBe(false)
    })

    it('should only accept ARS or USD', () => {
      const validARS = {
        descripcion: 'Test',
        monto: 100,
        moneda_origen: 'ARS' as const,
        fecha: '2024-01-15',
        categoria_gasto_id: 1,
        importancia_gasto_id: 1,
        tipo_pago_id: 1,
        tarjeta_id: null,
      }

      const validUSD = {
        ...validARS,
        moneda_origen: 'USD' as const,
      }

      expect(gastoUnicoSchema.safeParse(validARS).success).toBe(true)
      expect(gastoUnicoSchema.safeParse(validUSD).success).toBe(true)
    })
  })

  describe('Invalid cases - fecha', () => {
    it('should reject empty fecha', () => {
      const invalidGasto = {
        descripcion: 'Test',
        monto: 100,
        moneda_origen: 'ARS' as const,
        fecha: '',
        categoria_gasto_id: 1,
        importancia_gasto_id: 1,
        tipo_pago_id: 1,
        tarjeta_id: null,
      }

      const result = gastoUnicoSchema.safeParse(invalidGasto)
      expect(result.success).toBe(false)
      if (!result.success) {
        expect(result.error.issues[0].message).toBe('La fecha es requerida')
      }
    })
  })

  describe('Invalid cases - IDs', () => {
    it('should reject missing categoria_gasto_id', () => {
      const invalidGasto = {
        descripcion: 'Test',
        monto: 100,
        moneda_origen: 'ARS' as const,
        fecha: '2024-01-15',
        importancia_gasto_id: 1,
        tipo_pago_id: 1,
        tarjeta_id: null,
      }

      const result = gastoUnicoSchema.safeParse(invalidGasto)
      expect(result.success).toBe(false)
    })

    it('should reject missing importancia_gasto_id', () => {
      const invalidGasto = {
        descripcion: 'Test',
        monto: 100,
        moneda_origen: 'ARS' as const,
        fecha: '2024-01-15',
        categoria_gasto_id: 1,
        tipo_pago_id: 1,
        tarjeta_id: null,
      }

      const result = gastoUnicoSchema.safeParse(invalidGasto)
      expect(result.success).toBe(false)
    })

    it('should reject missing tipo_pago_id', () => {
      const invalidGasto = {
        descripcion: 'Test',
        monto: 100,
        moneda_origen: 'ARS' as const,
        fecha: '2024-01-15',
        categoria_gasto_id: 1,
        importancia_gasto_id: 1,
        tarjeta_id: null,
      }

      const result = gastoUnicoSchema.safeParse(invalidGasto)
      expect(result.success).toBe(false)
    })
  })

  describe('Edge cases - tarjeta_id', () => {
    it('should accept null tarjeta_id', () => {
      const validGasto = {
        descripcion: 'Test',
        monto: 100,
        moneda_origen: 'ARS' as const,
        fecha: '2024-01-15',
        categoria_gasto_id: 1,
        importancia_gasto_id: 1,
        tipo_pago_id: 1,
        tarjeta_id: null,
      }

      const result = gastoUnicoSchema.safeParse(validGasto)
      expect(result.success).toBe(true)
    })

    it('should accept valid tarjeta_id number', () => {
      const validGasto = {
        descripcion: 'Test',
        monto: 100,
        moneda_origen: 'ARS' as const,
        fecha: '2024-01-15',
        categoria_gasto_id: 1,
        importancia_gasto_id: 1,
        tipo_pago_id: 1,
        tarjeta_id: 5,
      }

      const result = gastoUnicoSchema.safeParse(validGasto)
      expect(result.success).toBe(true)
    })
  })
})
