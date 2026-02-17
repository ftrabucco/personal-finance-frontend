// src/lib/utils/formatters.ts
import { format, parseISO } from 'date-fns'
import { es } from 'date-fns/locale'

export function formatCurrency(
  amount: number | string,
  currency: 'ARS' | 'USD' = 'ARS'
): string {
  const numAmount = typeof amount === 'string' ? parseFloat(amount) : amount

  return new Intl.NumberFormat('es-AR', {
    style: 'currency',
    currency,
    minimumFractionDigits: 2,
  }).format(numAmount)
}

/**
 * Formato compacto para números grandes (para cards/widgets)
 * Ej: 5090000 -> "$5,09M" o 150000 -> "$150K"
 */
export function formatCurrencyCompact(
  amount: number | string,
  currency: 'ARS' | 'USD' = 'ARS'
): string {
  const numAmount = typeof amount === 'string' ? parseFloat(amount) : amount
  const prefix = currency === 'USD' ? 'US$ ' : '$ '

  if (Math.abs(numAmount) >= 1000000) {
    return `${prefix}${(numAmount / 1000000).toFixed(2).replace('.', ',')}M`
  }
  if (Math.abs(numAmount) >= 100000) {
    return `${prefix}${Math.round(numAmount / 1000)}K`
  }
  // Para números menores, sin decimales si son enteros grandes
  if (Math.abs(numAmount) >= 10000) {
    return new Intl.NumberFormat('es-AR', {
      style: 'currency',
      currency,
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(numAmount)
  }

  return formatCurrency(numAmount, currency)
}

export function formatDate(
  dateString: string,
  formatStr: string = 'dd/MM/yyyy'
): string {
  return format(parseISO(dateString), formatStr, { locale: es })
}

export function formatDateForInput(dateString: string): string {
  return format(parseISO(dateString), 'yyyy-MM-dd')
}

export function formatDateTime(
  dateString: string,
  formatStr: string = 'dd/MM/yyyy HH:mm'
): string {
  return format(parseISO(dateString), formatStr, { locale: es })
}
