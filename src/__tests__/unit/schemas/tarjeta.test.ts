import { describe, it, expect } from 'vitest'
import { z } from 'zod'

// Schema copiado de TarjetaForm.tsx para testing
const tarjetaSchema = z.object({
  nombre: z.string().min(1, 'El nombre es requerido'),
  tipo: z.enum(['debito', 'credito', 'virtual'], {
    message: 'El tipo es requerido',
  }),
  banco: z.string().min(1, 'El banco es requerido'),
  dia_mes_cierre: z.number().min(1).max(31).nullable(),
  dia_mes_vencimiento: z.number().min(1).max(31).nullable(),
  permite_cuotas: z.boolean(),
})

describe('Tarjeta Schema Validation', () => {
  describe('Valid cases', () => {
    it('should validate a valid tarjeta de débito', () => {
      const validTarjeta = {
        nombre: 'Visa Débito Santander',
        tipo: 'debito' as const,
        banco: 'Santander',
        dia_mes_cierre: null,
        dia_mes_vencimiento: null,
        permite_cuotas: false,
      }

      const result = tarjetaSchema.safeParse(validTarjeta)
      expect(result.success).toBe(true)
      if (result.success) {
        expect(result.data).toEqual(validTarjeta)
      }
    })

    it('should validate a valid tarjeta de crédito', () => {
      const validTarjeta = {
        nombre: 'Visa Crédito',
        tipo: 'credito' as const,
        banco: 'Galicia',
        dia_mes_cierre: 15,
        dia_mes_vencimiento: 20,
        permite_cuotas: true,
      }

      const result = tarjetaSchema.safeParse(validTarjeta)
      expect(result.success).toBe(true)
    })

    it('should validate a tarjeta virtual', () => {
      const validTarjeta = {
        nombre: 'Mercado Pago Virtual',
        tipo: 'virtual' as const,
        banco: 'Mercado Pago',
        dia_mes_cierre: null,
        dia_mes_vencimiento: null,
        permite_cuotas: false,
      }

      const result = tarjetaSchema.safeParse(validTarjeta)
      expect(result.success).toBe(true)
    })
  })

  describe('Invalid cases - nombre', () => {
    it('should reject tarjeta without nombre', () => {
      const invalidTarjeta = {
        tipo: 'debito' as const,
        banco: 'Santander',
        dia_mes_cierre: null,
        dia_mes_vencimiento: null,
        permite_cuotas: false,
      }

      const result = tarjetaSchema.safeParse(invalidTarjeta)
      expect(result.success).toBe(false)
      if (!result.success) {
        // Zod 4 devuelve "Invalid input: expected string, received undefined"
        expect(result.error.issues[0].message).toContain('expected string')
      }
    })

    it('should reject tarjeta with empty nombre', () => {
      const invalidTarjeta = {
        nombre: '',
        tipo: 'debito' as const,
        banco: 'Santander',
        dia_mes_cierre: null,
        dia_mes_vencimiento: null,
        permite_cuotas: false,
      }

      const result = tarjetaSchema.safeParse(invalidTarjeta)
      expect(result.success).toBe(false)
      if (!result.success) {
        expect(result.error.issues[0].message).toBe('El nombre es requerido')
      }
    })
  })

  describe('Invalid cases - tipo', () => {
    it('should reject tarjeta with invalid tipo', () => {
      const invalidTarjeta = {
        nombre: 'Test Card',
        tipo: 'invalid',
        banco: 'Santander',
        dia_mes_cierre: null,
        dia_mes_vencimiento: null,
        permite_cuotas: false,
      }

      const result = tarjetaSchema.safeParse(invalidTarjeta)
      expect(result.success).toBe(false)
      if (!result.success) {
        expect(result.error.issues[0].message).toBe('El tipo es requerido')
      }
    })

    it('should reject tarjeta without tipo', () => {
      const invalidTarjeta = {
        nombre: 'Test Card',
        banco: 'Santander',
        dia_mes_cierre: null,
        dia_mes_vencimiento: null,
        permite_cuotas: false,
      }

      const result = tarjetaSchema.safeParse(invalidTarjeta)
      expect(result.success).toBe(false)
    })
  })

  describe('Invalid cases - banco', () => {
    it('should reject tarjeta without banco', () => {
      const invalidTarjeta = {
        nombre: 'Test Card',
        tipo: 'debito' as const,
        dia_mes_cierre: null,
        dia_mes_vencimiento: null,
        permite_cuotas: false,
      }

      const result = tarjetaSchema.safeParse(invalidTarjeta)
      expect(result.success).toBe(false)
    })

    it('should reject tarjeta with empty banco', () => {
      const invalidTarjeta = {
        nombre: 'Test Card',
        tipo: 'debito' as const,
        banco: '',
        dia_mes_cierre: null,
        dia_mes_vencimiento: null,
        permite_cuotas: false,
      }

      const result = tarjetaSchema.safeParse(invalidTarjeta)
      expect(result.success).toBe(false)
      if (!result.success) {
        expect(result.error.issues[0].message).toBe('El banco es requerido')
      }
    })
  })

  describe('Edge cases - día de cierre y vencimiento', () => {
    it('should reject dia_mes_cierre less than 1', () => {
      const invalidTarjeta = {
        nombre: 'Visa Crédito',
        tipo: 'credito' as const,
        banco: 'Santander',
        dia_mes_cierre: 0,
        dia_mes_vencimiento: 20,
        permite_cuotas: true,
      }

      const result = tarjetaSchema.safeParse(invalidTarjeta)
      expect(result.success).toBe(false)
    })

    it('should reject dia_mes_cierre greater than 31', () => {
      const invalidTarjeta = {
        nombre: 'Visa Crédito',
        tipo: 'credito' as const,
        banco: 'Santander',
        dia_mes_cierre: 32,
        dia_mes_vencimiento: 20,
        permite_cuotas: true,
      }

      const result = tarjetaSchema.safeParse(invalidTarjeta)
      expect(result.success).toBe(false)
    })

    it('should reject dia_mes_vencimiento less than 1', () => {
      const invalidTarjeta = {
        nombre: 'Visa Crédito',
        tipo: 'credito' as const,
        banco: 'Santander',
        dia_mes_cierre: 15,
        dia_mes_vencimiento: 0,
        permite_cuotas: true,
      }

      const result = tarjetaSchema.safeParse(invalidTarjeta)
      expect(result.success).toBe(false)
    })

    it('should accept valid boundary values (1 and 31)', () => {
      const validTarjeta = {
        nombre: 'Visa Crédito',
        tipo: 'credito' as const,
        banco: 'Santander',
        dia_mes_cierre: 1,
        dia_mes_vencimiento: 31,
        permite_cuotas: true,
      }

      const result = tarjetaSchema.safeParse(validTarjeta)
      expect(result.success).toBe(true)
    })

    it('should accept null values for cierre and vencimiento', () => {
      const validTarjeta = {
        nombre: 'Tarjeta Test',
        tipo: 'debito' as const,
        banco: 'Banco Test',
        dia_mes_cierre: null,
        dia_mes_vencimiento: null,
        permite_cuotas: false,
      }

      const result = tarjetaSchema.safeParse(validTarjeta)
      expect(result.success).toBe(true)
    })
  })

  describe('Edge cases - permite_cuotas', () => {
    it('should accept false for permite_cuotas', () => {
      const validTarjeta = {
        nombre: 'Tarjeta Test',
        tipo: 'debito' as const,
        banco: 'Banco Test',
        dia_mes_cierre: null,
        dia_mes_vencimiento: null,
        permite_cuotas: false,
      }

      const result = tarjetaSchema.safeParse(validTarjeta)
      expect(result.success).toBe(true)
    })

    it('should reject tarjeta without permite_cuotas field', () => {
      const invalidTarjeta = {
        nombre: 'Tarjeta Test',
        tipo: 'debito' as const,
        banco: 'Banco Test',
        dia_mes_cierre: null,
        dia_mes_vencimiento: null,
      }

      const result = tarjetaSchema.safeParse(invalidTarjeta)
      expect(result.success).toBe(false)
    })
  })
})
