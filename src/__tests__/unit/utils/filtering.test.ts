import { describe, it, expect } from 'vitest'
import { startOfMonth, endOfMonth, subMonths } from 'date-fns'

// Testing the filtering logic used in GastosPage
// This tests the pure filtering functions without React components

interface MockGasto {
  id: number
  descripcion: string
  tipo_origen: string
  categoria?: { id: number; nombre_categoria: string }
  fecha: string
  monto_ars: string
}

const mockGastos: MockGasto[] = [
  {
    id: 1,
    descripcion: 'Alquiler mensual',
    tipo_origen: 'recurrente',
    categoria: { id: 1, nombre_categoria: 'Vivienda' },
    fecha: new Date().toISOString(),
    monto_ars: '150000',
  },
  {
    id: 2,
    descripcion: 'Supermercado',
    tipo_origen: 'unico',
    categoria: { id: 2, nombre_categoria: 'Alimentación' },
    fecha: new Date().toISOString(),
    monto_ars: '25000',
  },
  {
    id: 3,
    descripcion: 'Netflix',
    tipo_origen: 'debito_automatico',
    categoria: { id: 3, nombre_categoria: 'Entretenimiento' },
    fecha: subMonths(new Date(), 1).toISOString(),
    monto_ars: '5000',
  },
  {
    id: 4,
    descripcion: 'Notebook Dell',
    tipo_origen: 'compra',
    categoria: { id: 4, nombre_categoria: 'Tecnología' },
    fecha: subMonths(new Date(), 2).toISOString(),
    monto_ars: '500000',
  },
  {
    id: 5,
    descripcion: 'Café en el centro',
    tipo_origen: 'unico',
    categoria: { id: 2, nombre_categoria: 'Alimentación' },
    fecha: new Date().toISOString(),
    monto_ars: '2500',
  },
]

// Filter function extracted from GastosPage logic
function filterGastos(
  gastos: MockGasto[],
  filters: {
    searchTerm?: string
    tipoOrigen?: string
    categoriaId?: string
    monthsAgo?: number | null
  }
): MockGasto[] {
  return gastos.filter((gasto) => {
    // Search filter
    if (
      filters.searchTerm &&
      !gasto.descripcion.toLowerCase().includes(filters.searchTerm.toLowerCase())
    ) {
      return false
    }

    // Tipo origen filter
    if (filters.tipoOrigen && filters.tipoOrigen !== 'all' && gasto.tipo_origen !== filters.tipoOrigen) {
      return false
    }

    // Categoria filter
    if (
      filters.categoriaId &&
      filters.categoriaId !== 'all' &&
      gasto.categoria?.id?.toString() !== filters.categoriaId
    ) {
      return false
    }

    // Month filter
    if (filters.monthsAgo !== null && filters.monthsAgo !== undefined) {
      const targetDate = subMonths(new Date(), filters.monthsAgo)
      const monthStart = startOfMonth(targetDate)
      const monthEnd = endOfMonth(targetDate)
      const gastoDate = new Date(gasto.fecha)

      if (gastoDate < monthStart || gastoDate > monthEnd) {
        return false
      }
    }

    return true
  })
}

// Pagination function
function paginateItems<T>(items: T[], page: number, itemsPerPage: number): T[] {
  const start = (page - 1) * itemsPerPage
  return items.slice(start, start + itemsPerPage)
}

describe('Gastos Filtering', () => {
  describe('Search filter', () => {
    it('should filter by description (case insensitive)', () => {
      const result = filterGastos(mockGastos, { searchTerm: 'alquiler' })
      expect(result).toHaveLength(1)
      expect(result[0].descripcion).toBe('Alquiler mensual')
    })

    it('should return all items when search term is empty', () => {
      const result = filterGastos(mockGastos, { searchTerm: '' })
      expect(result).toHaveLength(5)
    })

    it('should return empty array when no matches', () => {
      const result = filterGastos(mockGastos, { searchTerm: 'xyz123' })
      expect(result).toHaveLength(0)
    })

    it('should match partial descriptions', () => {
      const result = filterGastos(mockGastos, { searchTerm: 'super' })
      expect(result).toHaveLength(1)
      expect(result[0].descripcion).toBe('Supermercado')
    })
  })

  describe('Tipo origen filter', () => {
    it('should filter by tipo unico', () => {
      const result = filterGastos(mockGastos, { tipoOrigen: 'unico' })
      expect(result).toHaveLength(2)
      expect(result.every((g) => g.tipo_origen === 'unico')).toBe(true)
    })

    it('should filter by tipo recurrente', () => {
      const result = filterGastos(mockGastos, { tipoOrigen: 'recurrente' })
      expect(result).toHaveLength(1)
      expect(result[0].tipo_origen).toBe('recurrente')
    })

    it('should filter by tipo debito_automatico', () => {
      const result = filterGastos(mockGastos, { tipoOrigen: 'debito_automatico' })
      expect(result).toHaveLength(1)
      expect(result[0].tipo_origen).toBe('debito_automatico')
    })

    it('should filter by tipo compra', () => {
      const result = filterGastos(mockGastos, { tipoOrigen: 'compra' })
      expect(result).toHaveLength(1)
      expect(result[0].tipo_origen).toBe('compra')
    })

    it('should return all items when tipo is "all"', () => {
      const result = filterGastos(mockGastos, { tipoOrigen: 'all' })
      expect(result).toHaveLength(5)
    })
  })

  describe('Categoria filter', () => {
    it('should filter by categoria id', () => {
      const result = filterGastos(mockGastos, { categoriaId: '2' })
      expect(result).toHaveLength(2)
      expect(result.every((g) => g.categoria?.id === 2)).toBe(true)
    })

    it('should return all items when categoria is "all"', () => {
      const result = filterGastos(mockGastos, { categoriaId: 'all' })
      expect(result).toHaveLength(5)
    })

    it('should return empty when categoria does not exist', () => {
      const result = filterGastos(mockGastos, { categoriaId: '999' })
      expect(result).toHaveLength(0)
    })
  })

  describe('Month filter', () => {
    it('should filter current month (monthsAgo = 0)', () => {
      const result = filterGastos(mockGastos, { monthsAgo: 0 })
      // Items 1, 2, 5 are from current month
      expect(result).toHaveLength(3)
    })

    it('should filter previous month (monthsAgo = 1)', () => {
      const result = filterGastos(mockGastos, { monthsAgo: 1 })
      // Item 3 is from previous month
      expect(result).toHaveLength(1)
      expect(result[0].descripcion).toBe('Netflix')
    })

    it('should filter 2 months ago', () => {
      const result = filterGastos(mockGastos, { monthsAgo: 2 })
      // Item 4 is from 2 months ago
      expect(result).toHaveLength(1)
      expect(result[0].descripcion).toBe('Notebook Dell')
    })

    it('should return all items when monthsAgo is null', () => {
      const result = filterGastos(mockGastos, { monthsAgo: null })
      expect(result).toHaveLength(5)
    })
  })

  describe('Combined filters', () => {
    it('should combine search and tipo origen filters', () => {
      const result = filterGastos(mockGastos, {
        searchTerm: 'café',
        tipoOrigen: 'unico',
      })
      expect(result).toHaveLength(1)
      expect(result[0].descripcion).toBe('Café en el centro')
    })

    it('should combine all filters', () => {
      const result = filterGastos(mockGastos, {
        searchTerm: '',
        tipoOrigen: 'unico',
        categoriaId: '2',
        monthsAgo: 0,
      })
      expect(result).toHaveLength(2)
    })

    it('should return empty when combined filters have no match', () => {
      const result = filterGastos(mockGastos, {
        tipoOrigen: 'compra',
        monthsAgo: 0, // Compra is from 2 months ago
      })
      expect(result).toHaveLength(0)
    })
  })
})

describe('Pagination', () => {
  const items = Array.from({ length: 50 }, (_, i) => ({ id: i + 1 }))

  it('should return first page correctly', () => {
    const result = paginateItems(items, 1, 20)
    expect(result).toHaveLength(20)
    expect(result[0].id).toBe(1)
    expect(result[19].id).toBe(20)
  })

  it('should return second page correctly', () => {
    const result = paginateItems(items, 2, 20)
    expect(result).toHaveLength(20)
    expect(result[0].id).toBe(21)
    expect(result[19].id).toBe(40)
  })

  it('should return partial last page', () => {
    const result = paginateItems(items, 3, 20)
    expect(result).toHaveLength(10)
    expect(result[0].id).toBe(41)
    expect(result[9].id).toBe(50)
  })

  it('should return empty array for out of range page', () => {
    const result = paginateItems(items, 10, 20)
    expect(result).toHaveLength(0)
  })

  it('should handle items per page of 1', () => {
    const result = paginateItems(items, 5, 1)
    expect(result).toHaveLength(1)
    expect(result[0].id).toBe(5)
  })

  it('should calculate total pages correctly', () => {
    const totalItems = 45
    const itemsPerPage = 20
    const totalPages = Math.ceil(totalItems / itemsPerPage)
    expect(totalPages).toBe(3)
  })
})
