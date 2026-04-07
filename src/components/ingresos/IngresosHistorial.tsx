'use client'

import { useState, useMemo, useCallback } from 'react'
import { Trash2, ChevronLeft, ChevronRight, X, Download, ChevronDown, CalendarDays, FolderOpen } from 'lucide-react'
import { startOfMonth, endOfMonth, getDaysInMonth, format, isToday, isYesterday, isThisWeek, isThisMonth, parseISO } from 'date-fns'
import { es } from 'date-fns/locale'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { SearchableSelect } from '@/components/ui/searchable-select'
import { useIngresosUnicos, useDeleteIngresoUnico } from '@/lib/hooks/useIngresosUnicos'
import { useIngresosRecurrentes } from '@/lib/hooks/useIngresosRecurrentes'
import { formatCurrency, formatCurrencyCompact, formatDate } from '@/lib/utils/formatters'
import { cn } from '@/lib/utils'
import { CollapsibleFilters } from '@/components/common/CollapsibleFilters'
import { DATE_PRESETS } from '@/lib/utils/datePresets'
import { showErrorToast } from '@/lib/utils/errorHandler'
import { ConfirmDialog } from '@/components/ui/confirm-dialog'
import { useConfirmDialog } from '@/lib/hooks/useConfirmDialog'

const ITEMS_PER_PAGE = 30

const TIPO_ORIGEN_OPTIONS = [
  { value: 'all', label: 'Todos los tipos' },
  { value: 'unico', label: 'Único' },
  { value: 'recurrente', label: 'Recurrente' },
]

const TIPO_LABELS: Record<string, string> = {
  unico: 'Único',
  recurrente: 'Recurrente',
}

const TIPO_COLORS: Record<string, string> = {
  unico: 'text-blue-500',
  recurrente: 'text-emerald-500',
}

function toDateString(date: Date): string {
  return format(date, 'yyyy-MM-dd')
}

function getDateGroup(fecha: string): string {
  const date = parseISO(fecha.slice(0, 10))
  if (isToday(date)) return 'Hoy'
  if (isYesterday(date)) return 'Ayer'
  if (isThisWeek(date, { weekStartsOn: 1 })) return 'Esta semana'
  if (isThisMonth(date)) return 'Este mes'
  return format(date, 'MMMM yyyy', { locale: es })
}

interface IngresoItem {
  id: number
  fecha: string
  descripcion: string
  monto_ars: string
  monto_usd?: string | null
  tipo_origen: string
  fuente?: { id?: number; nombre?: string } | null
  frecuencia?: string | null
  dia_de_pago?: number | null
  activo?: boolean
}

export function IngresosHistorial() {
  const [searchTerm, setSearchTerm] = useState('')
  const [tipoOrigenFilter, setTipoOrigenFilter] = useState('all')
  const [fuenteFilter, setFuenteFilter] = useState('all')
  const [dateFrom, setDateFrom] = useState(toDateString(startOfMonth(new Date())))
  const [dateTo, setDateTo] = useState(toDateString(endOfMonth(new Date())))
  const [currentPage, setCurrentPage] = useState(1)

  const [expandedId, setExpandedId] = useState<string | null>(null)
  const [groupBy, setGroupBy] = useState<'date' | 'fuente'>('date')

  const { data: unicosResponse, isLoading: loadingUnicos } = useIngresosUnicos()
  const { data: recurrentesResponse, isLoading: loadingRecurrentes } = useIngresosRecurrentes()
  const deleteMutation = useDeleteIngresoUnico()
  const confirmDialog = useConfirmDialog()

  const isLoading = loadingUnicos || loadingRecurrentes

  // Combine both data sources into a unified list
  const allIngresos: IngresoItem[] = useMemo(() => {
    const unicos = (unicosResponse?.data || []).map((i) => ({
      id: i.id,
      fecha: i.fecha,
      descripcion: i.descripcion,
      monto_ars: String(i.monto_ars),
      monto_usd: i.monto_usd ? String(i.monto_usd) : null,
      tipo_origen: 'unico' as const,
      fuente: i.fuenteIngreso ? { id: i.fuenteIngreso.id, nombre: i.fuenteIngreso.nombre } : null,
    }))

    const now = new Date()
    const currentMonth = now.getMonth()
    const currentYear = now.getFullYear()

    const recurrentes = (recurrentesResponse?.data || [])
      .filter((i) => i.activo)
      .map((i) => {
        // Use dia_de_pago to build a synthetic date for the current month
        const daysInMonth = getDaysInMonth(now)
        const dia = Math.min(i.dia_de_pago, daysInMonth)
        const fecha = `${currentYear}-${String(currentMonth + 1).padStart(2, '0')}-${String(dia).padStart(2, '0')}`
        return {
          id: i.id,
          fecha,
          descripcion: i.descripcion,
          monto_ars: String(i.monto_ars),
          monto_usd: i.monto_usd ? String(i.monto_usd) : null,
          tipo_origen: 'recurrente' as const,
          fuente: i.fuenteIngreso ? { id: i.fuenteIngreso.id, nombre: i.fuenteIngreso.nombre } : null,
          frecuencia: i.frecuencia?.nombre_frecuencia || null,
          dia_de_pago: i.dia_de_pago,
          activo: i.activo,
        }
      })

    return [...unicos, ...recurrentes]
  }, [unicosResponse, recurrentesResponse])

  // Extract unique fuentes
  const fuentes = useMemo(() => {
    const map = new Map<number, string>()
    allIngresos.forEach((i) => {
      if (i.fuente?.id && i.fuente?.nombre) {
        map.set(i.fuente.id, i.fuente.nombre)
      }
    })
    return Array.from(map.entries())
      .map(([id, nombre]) => ({ value: id.toString(), label: nombre }))
      .sort((a, b) => a.label.localeCompare(b.label))
  }, [allIngresos])

  const handleDeleteClick = (compositeId: string) => {
    // Only allow deleting únicos
    const [tipo, idStr] = compositeId.split('-')
    if (tipo !== 'unico') return
    confirmDialog.requestConfirm(Number(idStr))
  }

  const handleDeleteConfirm = async () => {
    const id = confirmDialog.confirm()
    if (id == null) return
    try {
      await deleteMutation.mutateAsync(id)
      if (expandedId === `unico-${id}`) setExpandedId(null)
    } catch (error) {
      showErrorToast(error)
    }
  }

  const filteredIngresos = useMemo(() => {
    return allIngresos.filter((ingreso) => {
      if (searchTerm) {
        const term = searchTerm.toLowerCase()
        const matchDesc = ingreso.descripcion.toLowerCase().includes(term)
        const matchFuente = ingreso.fuente?.nombre?.toLowerCase().includes(term)
        if (!matchDesc && !matchFuente) return false
      }
      if (tipoOrigenFilter !== 'all' && ingreso.tipo_origen !== tipoOrigenFilter) {
        return false
      }
      if (fuenteFilter !== 'all' && ingreso.fuente?.id?.toString() !== fuenteFilter) {
        return false
      }
      if (dateFrom) {
        const ingresoDate = ingreso.fecha.slice(0, 10)
        if (ingresoDate < dateFrom) return false
      }
      if (dateTo) {
        const ingresoDate = ingreso.fecha.slice(0, 10)
        if (ingresoDate > dateTo) return false
      }
      return true
    }).sort((a, b) => new Date(b.fecha).getTime() - new Date(a.fecha).getTime())
  }, [allIngresos, searchTerm, tipoOrigenFilter, fuenteFilter, dateFrom, dateTo])

  const totalPages = Math.max(1, Math.ceil(filteredIngresos.length / ITEMS_PER_PAGE))
  const safePage = Math.min(currentPage, totalPages)
  const paginatedIngresos = useMemo(() => {
    const start = (safePage - 1) * ITEMS_PER_PAGE
    return filteredIngresos.slice(start, start + ITEMS_PER_PAGE)
  }, [filteredIngresos, safePage])

  // Group paginated ingresos
  const groupedIngresos = useMemo(() => {
    const groups: { label: string; items: typeof paginatedIngresos; subtotal?: number }[] = []

    if (groupBy === 'fuente') {
      const fuenteMap = new Map<string, typeof paginatedIngresos>()
      paginatedIngresos.forEach((ingreso) => {
        const fuente = ingreso.fuente?.nombre || 'Sin fuente'
        if (!fuenteMap.has(fuente)) fuenteMap.set(fuente, [])
        fuenteMap.get(fuente)!.push(ingreso)
      })
      const sorted = Array.from(fuenteMap.entries()).sort((a, b) => {
        const totalA = a[1].reduce((s, g) => s + parseFloat(g.monto_ars), 0)
        const totalB = b[1].reduce((s, g) => s + parseFloat(g.monto_ars), 0)
        return totalB - totalA
      })
      sorted.forEach(([fuente, items]) => {
        const subtotal = items.reduce((s, g) => s + parseFloat(g.monto_ars), 0)
        groups.push({ label: fuente, items, subtotal })
      })
    } else {
      let currentGroup: string | null = null
      paginatedIngresos.forEach((ingreso) => {
        const group = getDateGroup(ingreso.fecha)
        if (group !== currentGroup) {
          groups.push({ label: group, items: [] })
          currentGroup = group
        }
        groups[groups.length - 1].items.push(ingreso)
      })
    }

    return groups
  }, [paginatedIngresos, groupBy])

  const clearFilters = () => {
    setSearchTerm('')
    setTipoOrigenFilter('all')
    setFuenteFilter('all')
    setDateFrom('')
    setDateTo('')
    setCurrentPage(1)
  }

  const defaultDateFrom = toDateString(startOfMonth(new Date()))
  const defaultDateTo = toDateString(endOfMonth(new Date()))
  const datesChanged = dateFrom !== defaultDateFrom || dateTo !== defaultDateTo
  const hasActiveFilters = searchTerm || tipoOrigenFilter !== 'all' || fuenteFilter !== 'all' || datesChanged
  const activeFilterCount = [searchTerm, tipoOrigenFilter !== 'all', fuenteFilter !== 'all', datesChanged].filter(Boolean).length

  // Summary
  const summary = useMemo(() => {
    const totalARS = filteredIngresos.reduce((sum, g) => sum + parseFloat(g.monto_ars), 0)
    const totalUSD = filteredIngresos.reduce((sum, g) => sum + parseFloat(g.monto_usd || '0'), 0)
    const count = filteredIngresos.length
    const avgARS = count > 0 ? totalARS / count : 0

    const fuenteMap = new Map<string, number>()
    filteredIngresos.forEach((g) => {
      const fuente = g.fuente?.nombre || 'Sin fuente'
      fuenteMap.set(fuente, (fuenteMap.get(fuente) || 0) + parseFloat(g.monto_ars))
    })
    const topFuentes = Array.from(fuenteMap.entries())
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5)

    return { totalARS, totalUSD, count, avgARS, topFuentes }
  }, [filteredIngresos])

  // CSV Export
  const handleExportCSV = useCallback(() => {
    if (filteredIngresos.length === 0) return
    const headers = ['Fecha', 'Descripción', 'Tipo', 'Fuente', 'Monto ARS', 'Monto USD']
    const escapeCSV = (val: string) => `"${val.replace(/"/g, '""')}"`
    const rows = filteredIngresos.map((g) => [
      g.fecha,
      escapeCSV(g.descripcion),
      g.tipo_origen,
      escapeCSV(g.fuente?.nombre || ''),
      g.monto_ars,
      g.monto_usd || '',
    ])
    const csv = [headers.join(','), ...rows.map((r) => r.join(','))].join('\n')
    const blob = new Blob(['\ufeff' + csv], { type: 'text/csv;charset=utf-8;' })
    const url = URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    link.download = `ingresos_${format(new Date(), 'yyyy-MM-dd')}.csv`
    link.click()
    URL.revokeObjectURL(url)
  }, [filteredIngresos])

  const toggleExpanded = (compositeId: string) => {
    setExpandedId(expandedId === compositeId ? null : compositeId)
  }

  return (
    <div className="space-y-4 md:space-y-6">
      {/* Summary strip */}
      <div className="flex items-center gap-4 overflow-x-auto pb-1">
        <div className="flex items-center gap-2 shrink-0">
          <span className="text-2xl font-bold text-green-600">{formatCurrencyCompact(summary.totalARS)}</span>
          <span className="text-sm text-muted-foreground">en {summary.count} ingresos</span>
        </div>
        {summary.totalUSD > 0 && (
          <span className="text-sm text-muted-foreground shrink-0">
            ({formatCurrencyCompact(summary.totalUSD, 'USD')})
          </span>
        )}
        <span className="text-sm text-muted-foreground shrink-0">
          · Promedio {formatCurrencyCompact(summary.avgARS)}
        </span>
      </div>

      {/* Fuente breakdown */}
      {summary.topFuentes.length > 0 && (
        <div className="space-y-1.5">
          {summary.topFuentes.map(([fuente, amount]) => {
            const pct = summary.totalARS > 0 ? (amount / summary.totalARS) * 100 : 0
            return (
              <div key={fuente} className="flex items-center gap-3 text-sm">
                <span className="w-[140px] sm:w-[180px] truncate text-muted-foreground">{fuente}</span>
                <div className="flex-1 h-2 bg-muted rounded-full overflow-hidden">
                  <div className="h-full bg-green-500/70 rounded-full" style={{ width: `${pct}%` }} />
                </div>
                <span className="w-[70px] text-right font-medium shrink-0">{formatCurrencyCompact(amount)}</span>
                <span className="w-[35px] text-right text-xs text-muted-foreground shrink-0">{pct.toFixed(0)}%</span>
              </div>
            )
          })}
        </div>
      )}

      {/* Search + Group toggle + Export */}
      <div className="flex items-center gap-2">
        <Input
          placeholder="Buscar por descripción o fuente..."
          value={searchTerm}
          onChange={(e) => { setSearchTerm(e.target.value); setCurrentPage(1) }}
          className="flex-1 sm:max-w-xs"
        />
        <Button
          variant="outline"
          size="sm"
          onClick={() => setGroupBy(groupBy === 'date' ? 'fuente' : 'date')}
          className="shrink-0"
          title={groupBy === 'date' ? 'Agrupar por fuente' : 'Agrupar por fecha'}
        >
          {groupBy === 'date' ? <FolderOpen className="h-4 w-4" /> : <CalendarDays className="h-4 w-4" />}
        </Button>
        <Button
          variant="outline"
          size="sm"
          onClick={handleExportCSV}
          disabled={filteredIngresos.length === 0}
          className="shrink-0"
        >
          <Download className="h-4 w-4" />
          <span className="hidden sm:inline ml-1.5">CSV</span>
        </Button>
      </div>

      {/* Collapsible filters */}
      <CollapsibleFilters
        activeFilterCount={activeFilterCount}
        defaultOpen={!!hasActiveFilters}
        datePresets={DATE_PRESETS}
        onPresetSelect={(from, to) => { setDateFrom(from); setDateTo(to); setCurrentPage(1) }}
        currentDateFrom={dateFrom}
        currentDateTo={dateTo}
      >
        <div className="space-y-3">
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <SearchableSelect
              options={TIPO_ORIGEN_OPTIONS.map((o) => ({ value: o.value, label: o.label }))}
              value={tipoOrigenFilter}
              onValueChange={(v) => { setTipoOrigenFilter(v); setCurrentPage(1) }}
              placeholder="Tipo de ingreso"
              searchPlaceholder="Buscar tipo..."
            />

            <SearchableSelect
              options={[
                { value: 'all', label: 'Todas las fuentes' },
                ...fuentes,
              ]}
              value={fuenteFilter}
              onValueChange={(v) => { setFuenteFilter(v); setCurrentPage(1) }}
              placeholder="Fuente"
              searchPlaceholder="Buscar fuente..."
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs text-muted-foreground mb-1 block">Desde</label>
              <Input
                type="date"
                value={dateFrom}
                onChange={(e) => { setDateFrom(e.target.value); setCurrentPage(1) }}
              />
            </div>
            <div>
              <label className="text-xs text-muted-foreground mb-1 block">Hasta</label>
              <Input
                type="date"
                value={dateTo}
                onChange={(e) => { setDateTo(e.target.value); setCurrentPage(1) }}
              />
            </div>
          </div>

          {hasActiveFilters && (
            <div className="flex items-center justify-between pt-2 border-t">
              <span className="text-sm text-muted-foreground">
                {filteredIngresos.length} resultados
              </span>
              <Button variant="ghost" size="sm" onClick={clearFilters} className="text-xs">
                <X className="h-3 w-3 mr-1" />
                Limpiar todo
              </Button>
            </div>
          )}
        </div>
      </CollapsibleFilters>

      {/* Ingresos list */}
      {isLoading ? (
        <div className="text-center py-8 text-muted-foreground">Cargando ingresos...</div>
      ) : filteredIngresos.length === 0 ? (
        <div className="text-center py-8 text-muted-foreground">
          {hasActiveFilters ? 'No hay ingresos que coincidan con los filtros.' : 'No hay ingresos registrados.'}
        </div>
      ) : (
        <div className="space-y-1">
          {groupedIngresos.map((group) => (
            <div key={group.label}>
              {/* Group header */}
              <div className="sticky top-0 z-10 bg-background/95 backdrop-blur-sm py-2 px-1 flex items-center justify-between">
                <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                  {group.label}
                  <span className="ml-1.5 normal-case font-normal">({group.items.length})</span>
                </span>
                {group.subtotal !== undefined && (
                  <span className="text-xs font-semibold text-muted-foreground tabular-nums">
                    {formatCurrencyCompact(group.subtotal)}
                  </span>
                )}
              </div>

              {/* Ingreso rows */}
              <div className="space-y-px">
                {group.items.map((ingreso) => {
                  const compositeId = `${ingreso.tipo_origen}-${ingreso.id}`
                  const isExpanded = expandedId === compositeId
                  return (
                    <div key={compositeId} className="group">
                      {/* Main row */}
                      <button
                        className={cn(
                          'w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-left transition-colors',
                          'hover:bg-accent/50',
                          isExpanded && 'bg-accent/50'
                        )}
                        onClick={() => toggleExpanded(compositeId)}
                        aria-expanded={isExpanded}
                      >
                        {/* Date */}
                        <span className="text-xs text-muted-foreground w-[42px] shrink-0 tabular-nums">
                          {format(parseISO(ingreso.fecha.slice(0, 10)), 'dd/MM')}
                        </span>

                        {/* Type dot */}
                        <span className={cn('text-lg leading-none shrink-0', TIPO_COLORS[ingreso.tipo_origen] || 'text-muted-foreground')}>
                          ·
                        </span>

                        {/* Description + Fuente */}
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium truncate">{ingreso.descripcion}</p>
                          <p className="text-xs text-muted-foreground truncate">
                            {ingreso.fuente?.nombre || 'Sin fuente'}
                            {ingreso.tipo_origen === 'recurrente' && ingreso.dia_de_pago ? ` · Día ${ingreso.dia_de_pago}` : ''}
                          </p>
                        </div>

                        {/* Amount */}
                        <span className="text-sm font-semibold tabular-nums shrink-0 text-green-600">
                          {formatCurrency(parseFloat(ingreso.monto_ars))}
                        </span>

                        {/* Expand indicator */}
                        <ChevronDown className={cn(
                          'h-4 w-4 text-muted-foreground/50 shrink-0 transition-transform',
                          isExpanded && 'rotate-180'
                        )} />
                      </button>

                      {/* Expanded detail */}
                      {isExpanded && (
                        <div className="ml-[60px] mr-3 pb-3 flex flex-wrap items-center gap-x-4 gap-y-2 text-xs text-muted-foreground">
                          <span>
                            <span className="font-medium text-foreground">{TIPO_LABELS[ingreso.tipo_origen] || ingreso.tipo_origen}</span>
                          </span>
                          {ingreso.monto_usd && parseFloat(ingreso.monto_usd) > 0 && (
                            <span>USD ${parseFloat(ingreso.monto_usd).toFixed(2)}</span>
                          )}
                          {ingreso.frecuencia && (
                            <span>{ingreso.frecuencia}</span>
                          )}
                          <span>{formatDate(ingreso.fecha)}</span>
                          <div className="flex-1" />
                          {ingreso.tipo_origen === 'unico' && (
                            <Button
                              variant="ghost"
                              size="sm"
                              className="h-7 text-xs text-destructive hover:text-destructive px-2"
                              onClick={(e) => { e.stopPropagation(); handleDeleteClick(compositeId) }}
                            >
                              <Trash2 className="h-3.5 w-3.5 mr-1" />
                              Eliminar
                            </Button>
                          )}
                        </div>
                      )}
                    </div>
                  )
                })}
              </div>
            </div>
          ))}

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex flex-col gap-3 pt-4 border-t sm:flex-row sm:items-center sm:justify-between">
              <p className="text-sm text-muted-foreground text-center sm:text-left">
                {((safePage - 1) * ITEMS_PER_PAGE) + 1}–{Math.min(safePage * ITEMS_PER_PAGE, filteredIngresos.length)} de {filteredIngresos.length}
              </p>
              <div className="flex items-center justify-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                  disabled={safePage === 1}
                >
                  <ChevronLeft className="h-4 w-4" />
                </Button>
                <span className="text-sm text-muted-foreground px-2">
                  {safePage} / {totalPages}
                </span>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                  disabled={safePage === totalPages}
                >
                  <ChevronRight className="h-4 w-4" />
                </Button>
              </div>
            </div>
          )}
        </div>
      )}
      <ConfirmDialog
        open={confirmDialog.isOpen}
        onOpenChange={confirmDialog.setIsOpen}
        title="Eliminar ingreso"
        description="¿Estás seguro de eliminar este ingreso? Esta acción no se puede deshacer."
        confirmLabel="Eliminar"
        onConfirm={handleDeleteConfirm}
        isLoading={deleteMutation.isPending}
      />
    </div>
  )
}
