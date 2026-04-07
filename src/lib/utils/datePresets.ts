import { startOfMonth, endOfMonth, subMonths, format } from 'date-fns'
import type { DatePreset } from '@/components/common/CollapsibleFilters'

export function toDateString(date: Date): string {
  return format(date, 'yyyy-MM-dd')
}

export const DATE_PRESETS: DatePreset[] = [
  { label: 'Este mes', getRange: () => ({ from: toDateString(startOfMonth(new Date())), to: toDateString(endOfMonth(new Date())) }) },
  { label: 'Mes anterior', getRange: () => ({ from: toDateString(startOfMonth(subMonths(new Date(), 1))), to: toDateString(endOfMonth(subMonths(new Date(), 1))) }) },
  { label: 'Últimos 3 meses', getRange: () => ({ from: toDateString(startOfMonth(subMonths(new Date(), 2))), to: toDateString(endOfMonth(new Date())) }) },
  { label: 'Todo', getRange: () => ({ from: '', to: '' }) },
]
