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
