'use client'

import { useState, useMemo, useCallback, useEffect } from 'react'
import { Trash2, RefreshCw, ChevronLeft, ChevronRight, X, Download, Plus, SlidersHorizontal, ChevronDown, CalendarDays, FolderOpen } from 'lucide-react'
import { startOfMonth, endOfMonth, subMonths, format, isToday, isYesterday, isThisWeek, isThisMonth, parseISO } from 'date-fns'
import { es } from 'date-fns/locale'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { SearchableSelect } from '@/components/ui/searchable-select'
import { useAllGastos, useDeleteGasto, useGenerateGastos } from '@/lib/hooks/useGastos'
import { useCategorias, useImportancias } from '@/lib/hooks/useCatalogos'
import { formatCurrency, formatCurrencyCompact, formatDate } from '@/lib/utils/formatters'
import { cn } from '@/lib/utils'
import { useSearchParams } from 'next/navigation'
import { QuickGastoDialog } from '@/components/gastos/QuickGastoDialog'
import { ConfirmDialog } from '@/components/ui/confirm-dialog'
import { useConfirmDialog } from '@/lib/hooks/useConfirmDialog'

const ITEMS_PER_PAGE = 30

const TIPO_ORIGEN_OPTIONS = [
  { value: 'all', label: 'Todos los tipos' },
  { value: 'unico', label: 'Único' },
  { value: 'recurrente', label: 'Recurrente' },
  { value: 'debito_automatico', label: 'Débito Automático' },
  { value: 'compra', label: 'Cuota' },
]

const TIPO_LABELS: Record<string, string> = {
  unico: 'Único',
  recurrente: 'Recurrente',
  debito_automatico: 'Débito Auto',
  compra: 'Cuota',
}

const TIPO_COLORS: Record<string, string> = {
  unico: 'text-blue-500',
  recurrente: 'text-emerald-500',
  debito_automatico: 'text-amber-500',
  compra: 'text-purple-500',
}

function toDateString(date: Date): string {
  return format(date, 'yyyy-MM-dd')
}

const DATE_PRESETS = [
  { label: 'Este mes', getRange: () => ({ from: toDateString(startOfMonth(new Date())), to: toDateString(endOfMonth(new Date())) }) },
  { label: 'Mes anterior', getRange: () => ({ from: toDateString(startOfMonth(subMonths(new Date(), 1))), to: toDateString(endOfMonth(subMonths(new Date(), 1))) }) },
  { label: 'Últimos 3 meses', getRange: () => ({ from: toDateString(startOfMonth(subMonths(new Date(), 2))), to: toDateString(endOfMonth(new Date())) }) },
  { label: 'Últimos 6 meses', getRange: () => ({ from: toDateString(startOfMonth(subMonths(new Date(), 5))), to: toDateString(endOfMonth(new Date())) }) },
]

// Group gastos by date label
function getDateGroup(fecha: string): string {
  const date = parseISO(fecha.slice(0, 10))
  if (isToday(date)) return 'Hoy'
  if (isYesterday(date)) return 'Ayer'
  if (isThisWeek(date, { weekStartsOn: 1 })) return 'Esta semana'
  if (isThisMonth(date)) return 'Este mes'
  return format(date, 'MMMM yyyy', { locale: es })
}

interface GastoItem {
  id: number
  fecha: string
  descripcion: string
  monto_ars: string
  monto_usd?: string | null
  tipo_origen: string
  categoria?: { id?: number; nombre_categoria?: string } | null
  importancia?: { id?: number; nombre_importancia?: string } | null
  tipoPago?: { nombre?: string } | null
  cantidad_cuotas_totales?: number | null
  cantidad_cuotas_pagadas?: number | null
}

export function GastosHistorial() {
  const searchParams = useSearchParams()

  const [searchTerm, setSearchTerm] = useState('')
  const [tipoOrigenFilter, setTipoOrigenFilter] = useState('all')
  const [categoriaFilter, setCategoriaFilter] = useState('all')
  const [importanciaFilter, setImportanciaFilter] = useState('all')
  const [dateFrom, setDateFrom] = useState('')
  const [dateTo, setDateTo] = useState('')
  const [currentPage, setCurrentPage] = useState(1)
  const [quickAddOpen, setQuickAddOpen] = useState(false)
  const [filtersOpen, setFiltersOpen] = useState(false)
  const [expandedId, setExpandedId] = useState<number | null>(null)
  const [groupBy, setGroupBy] = useState<'date' | 'category'>('date')

  // Initialize filters from URL params (e.g. navigating from dashboard charts)
  useEffect(() => {
    const cat = searchParams.get('categoria')
    const from = searchParams.get('dateFrom')
    const to = searchParams.get('dateTo')
    const imp = searchParams.get('importancia')
    let hasFilter = false
    if (cat) { setCategoriaFilter(cat); hasFilter = true }
    if (from) { setDateFrom(from); hasFilter = true }
    if (to) { setDateTo(to); hasFilter = true }
    if (imp) { setImportanciaFilter(imp); hasFilter = true }
    if (hasFilter) setFiltersOpen(true)
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  const { data: response, isLoading } = useAllGastos()
  const { data: categoriasResponse } = useCategorias()
  const { data: importanciasData } = useImportancias()
  const deleteMutation = useDeleteGasto()
  const confirmDialog = useConfirmDialog()
  const generateMutation = useGenerateGastos()

  const gastos = response?.data || []
  const categorias = categoriasResponse?.data || []
  const importancias = (Array.isArray(importanciasData) ? importanciasData : importanciasData?.data) || []

  const handleDeleteClick = (id: number) => {
    confirmDialog.requestConfirm(id)
  }

  const handleDeleteConfirm = async () => {
    const id = confirmDialog.confirm()
    if (id == null) return
    try {
      await deleteMutation.mutateAsync(id)
      if (expandedId === id) setExpandedId(null)
    } catch (error) {
      console.error('Error al eliminar gasto:', error)
    }
  }

  const handleGenerate = async () => {
    try {
      const result = await generateMutation.mutateAsync()
      alert(`Se generaron ${result.data.generados} gastos nuevos`)
    } catch (error) {
      console.error('Error al generar gastos:', error)
    }
  }

  const filteredGastos = useMemo(() => {
    return gastos.filter((gasto) => {
      if (searchTerm) {
        const term = searchTerm.toLowerCase()
        const matchDesc = gasto.descripcion.toLowerCase().includes(term)
        const matchCat = gasto.categoria?.nombre_categoria?.toLowerCase().includes(term)
        if (!matchDesc && !matchCat) return false
      }
      if (tipoOrigenFilter !== 'all' && gasto.tipo_origen !== tipoOrigenFilter) {
        return false
      }
      if (categoriaFilter !== 'all' && gasto.categoria?.id?.toString() !== categoriaFilter) {
        return false
      }
      if (importanciaFilter !== 'all' && gasto.importancia?.id?.toString() !== importanciaFilter) {
        return false
      }
      if (dateFrom) {
        const gastoDate = gasto.fecha.slice(0, 10)
        if (gastoDate < dateFrom) return false
      }
      if (dateTo) {
        const gastoDate = gasto.fecha.slice(0, 10)
        if (gastoDate > dateTo) return false
      }
      return true
    }).sort((a, b) => new Date(b.fecha).getTime() - new Date(a.fecha).getTime())
  }, [gastos, searchTerm, tipoOrigenFilter, categoriaFilter, importanciaFilter, dateFrom, dateTo])

  const totalPages = Math.ceil(filteredGastos.length / ITEMS_PER_PAGE)
  const paginatedGastos = useMemo(() => {
    const start = (currentPage - 1) * ITEMS_PER_PAGE
    return filteredGastos.slice(start, start + ITEMS_PER_PAGE)
  }, [filteredGastos, currentPage])

  // Group paginated gastos by date or category
  const groupedGastos = useMemo(() => {
    const groups: { label: string; items: typeof paginatedGastos; subtotal?: number }[] = []

    if (groupBy === 'category') {
      const catMap = new Map<string, typeof paginatedGastos>()
      paginatedGastos.forEach((gasto) => {
        const cat = gasto.categoria?.nombre_categoria || 'Sin categoría'
        if (!catMap.has(cat)) catMap.set(cat, [])
        catMap.get(cat)!.push(gasto)
      })
      // Sort categories by total amount descending
      const sorted = Array.from(catMap.entries()).sort((a, b) => {
        const totalA = a[1].reduce((s, g) => s + parseFloat(g.monto_ars), 0)
        const totalB = b[1].reduce((s, g) => s + parseFloat(g.monto_ars), 0)
        return totalB - totalA
      })
      sorted.forEach(([cat, items]) => {
        const subtotal = items.reduce((s, g) => s + parseFloat(g.monto_ars), 0)
        groups.push({ label: cat, items, subtotal })
      })
    } else {
      let currentGroup: string | null = null
      paginatedGastos.forEach((gasto) => {
        const group = getDateGroup(gasto.fecha)
        if (group !== currentGroup) {
          groups.push({ label: group, items: [] })
          currentGroup = group
        }
        groups[groups.length - 1].items.push(gasto)
      })
    }

    return groups
  }, [paginatedGastos, groupBy])

  const applyPreset = (preset: typeof DATE_PRESETS[number]) => {
    const { from, to } = preset.getRange()
    setDateFrom(from)
    setDateTo(to)
    setCurrentPage(1)
    setFiltersOpen(false)
  }

  const clearFilters = () => {
    setSearchTerm('')
    setTipoOrigenFilter('all')
    setCategoriaFilter('all')
    setImportanciaFilter('all')
    setDateFrom('')
    setDateTo('')
    setCurrentPage(1)
  }

  const hasActiveFilters = searchTerm || tipoOrigenFilter !== 'all' || categoriaFilter !== 'all' || importanciaFilter !== 'all' || dateFrom || dateTo
  const activeFilterCount = [searchTerm, tipoOrigenFilter !== 'all', categoriaFilter !== 'all', importanciaFilter !== 'all', dateFrom || dateTo].filter(Boolean).length

  // ── Summary ──
  const summary = useMemo(() => {
    const totalARS = filteredGastos.reduce((sum, g) => sum + parseFloat(g.monto_ars), 0)
    const totalUSD = filteredGastos.reduce((sum, g) => sum + parseFloat(g.monto_usd || '0'), 0)
    const count = filteredGastos.length
    const avgARS = count > 0 ? totalARS / count : 0

    const catMap = new Map<string, number>()
    filteredGastos.forEach((g) => {
      const cat = g.categoria?.nombre_categoria || 'Sin categoría'
      catMap.set(cat, (catMap.get(cat) || 0) + parseFloat(g.monto_ars))
    })
    const topCategories = Array.from(catMap.entries())
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5)

    return { totalARS, totalUSD, count, avgARS, topCategories }
  }, [filteredGastos])

  // ── CSV Export ──
  const handleExportCSV = useCallback(() => {
    if (filteredGastos.length === 0) return
    const headers = ['Fecha', 'Descripción', 'Tipo', 'Categoría', 'Monto ARS', 'Monto USD', 'Tipo de Pago', 'Cuotas']
    const rows = filteredGastos.map((g) => [
      g.fecha,
      `"${g.descripcion.replace(/"/g, '""')}"`,
      g.tipo_origen,
      g.categoria?.nombre_categoria || '',
      g.monto_ars,
      g.monto_usd || '',
      g.tipoPago?.nombre || '',
      g.cantidad_cuotas_totales ? `${g.cantidad_cuotas_pagadas}/${g.cantidad_cuotas_totales}` : '',
    ])
    const csv = [headers.join(','), ...rows.map((r) => r.join(','))].join('\n')
    const blob = new Blob(['\ufeff' + csv], { type: 'text/csv;charset=utf-8;' })
    const url = URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    link.download = `gastos_${format(new Date(), 'yyyy-MM-dd')}.csv`
    link.click()
    URL.revokeObjectURL(url)
  }, [filteredGastos])

  const toggleExpanded = (id: number) => {
    setExpandedId(expandedId === id ? null : id)
  }

  return (
    <div className="space-y-4 md:space-y-6">
      {/* Header: actions */}
      <div className="flex items-center justify-between gap-2">
        <Button
          variant="outline"
          size="sm"
          onClick={handleGenerate}
          disabled={generateMutation.isPending}
        >
          <RefreshCw className={`mr-2 h-4 w-4 ${generateMutation.isPending ? 'animate-spin' : ''}`} />
          <span className="hidden sm:inline">Generar Gastos</span>
          <span className="sm:hidden">Generar</span>
        </Button>
        <Button onClick={() => setQuickAddOpen(true)} className="gap-2">
          <Plus className="h-4 w-4" />
          Nuevo Gasto
        </Button>
      </div>

      <QuickGastoDialog open={quickAddOpen} onOpenChange={setQuickAddOpen} />

      {/* Summary strip */}
      <div className="flex items-center gap-4 overflow-x-auto pb-1">
        <div className="flex items-center gap-2 shrink-0">
          <span className="text-2xl font-bold">{formatCurrencyCompact(summary.totalARS)}</span>
          <span className="text-sm text-muted-foreground">en {summary.count} gastos</span>
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

      {/* Category breakdown (always visible if there are gastos) */}
      {summary.topCategories.length > 0 && (
        <div className="space-y-1.5">
          {summary.topCategories.map(([cat, amount]) => {
            const pct = summary.totalARS > 0 ? (amount / summary.totalARS) * 100 : 0
            return (
              <div key={cat} className="flex items-center gap-3 text-sm">
                <span className="w-[140px] sm:w-[180px] truncate text-muted-foreground">{cat}</span>
                <div className="flex-1 h-2 bg-muted rounded-full overflow-hidden">
                  <div className="h-full bg-primary/70 rounded-full" style={{ width: `${pct}%` }} />
                </div>
                <span className="w-[70px] text-right font-medium shrink-0">{formatCurrencyCompact(amount)}</span>
                <span className="w-[35px] text-right text-xs text-muted-foreground shrink-0">{pct.toFixed(0)}%</span>
              </div>
            )
          })}
        </div>
      )}

      {/* Search + Group toggle + Filter toggle + Export */}
      <div className="flex items-center gap-2">
        <Input
          placeholder="Buscar por descripción o categoría..."
          value={searchTerm}
          onChange={(e) => { setSearchTerm(e.target.value); setCurrentPage(1) }}
          className="flex-1 sm:max-w-xs"
        />
        <Button
          variant="outline"
          size="sm"
          onClick={() => setGroupBy(groupBy === 'date' ? 'category' : 'date')}
          className="shrink-0"
          title={groupBy === 'date' ? 'Agrupar por categoría' : 'Agrupar por fecha'}
        >
          {groupBy === 'date' ? <FolderOpen className="h-4 w-4" /> : <CalendarDays className="h-4 w-4" />}
        </Button>
        <Button
          variant={hasActiveFilters ? 'default' : 'outline'}
          size="sm"
          onClick={() => setFiltersOpen(!filtersOpen)}
          className="gap-1.5 shrink-0"
        >
          <SlidersHorizontal className="h-4 w-4" />
          <span className="hidden sm:inline">Filtros</span>
          {activeFilterCount > 0 && (
            <Badge variant="secondary" className="h-5 w-5 p-0 flex items-center justify-center text-[10px] rounded-full">
              {activeFilterCount}
            </Badge>
          )}
        </Button>
        <Button
          variant="outline"
          size="sm"
          onClick={handleExportCSV}
          disabled={filteredGastos.length === 0}
          className="shrink-0"
        >
          <Download className="h-4 w-4" />
          <span className="hidden sm:inline ml-1.5">CSV</span>
        </Button>
      </div>

      {/* Importancia quick-filter chips (always visible) */}
      {importancias.length > 0 && (
        <div className="flex flex-wrap gap-1.5">
          <Button
            variant={importanciaFilter === 'all' ? 'default' : 'outline'}
            size="sm"
            className="h-7 text-xs"
            onClick={() => { setImportanciaFilter('all'); setCurrentPage(1) }}
          >
            Todas
          </Button>
          {importancias.map((imp) => (
            <Button
              key={imp.id}
              variant={importanciaFilter === imp.id.toString() ? 'default' : 'outline'}
              size="sm"
              className="h-7 text-xs"
              onClick={() => { setImportanciaFilter(imp.id.toString()); setCurrentPage(1) }}
            >
              {imp.nombre_importancia}
            </Button>
          ))}
        </div>
      )}

      {/* Collapsible filters */}
      {filtersOpen && (
        <Card>
          <CardContent className="pt-4 pb-4 space-y-3">
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              <SearchableSelect
                options={TIPO_ORIGEN_OPTIONS.map((o) => ({ value: o.value, label: o.label }))}
                value={tipoOrigenFilter}
                onValueChange={(v) => { setTipoOrigenFilter(v); setCurrentPage(1) }}
                placeholder="Tipo de gasto"
                searchPlaceholder="Buscar tipo..."
              />

              <SearchableSelect
                options={[
                  { value: 'all', label: 'Todas las categorías' },
                  ...categorias.map((cat) => ({
                    value: cat.id.toString(),
                    label: cat.nombre_categoria,
                  })),
                ]}
                value={categoriaFilter}
                onValueChange={(v) => { setCategoriaFilter(v); setCurrentPage(1) }}
                placeholder="Categoría"
                searchPlaceholder="Buscar categoría..."
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

            <div className="flex flex-wrap gap-1.5">
              {DATE_PRESETS.map((preset) => (
                <Button
                  key={preset.label}
                  variant="outline"
                  size="sm"
                  className="h-7 text-xs"
                  onClick={() => applyPreset(preset)}
                >
                  {preset.label}
                </Button>
              ))}
            </div>

            {hasActiveFilters && (
              <div className="flex items-center justify-between pt-2 border-t">
                <span className="text-sm text-muted-foreground">
                  {filteredGastos.length} resultados
                </span>
                <Button variant="ghost" size="sm" onClick={clearFilters} className="text-xs">
                  <X className="h-3 w-3 mr-1" />
                  Limpiar todo
                </Button>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Gastos list grouped by date */}
      {isLoading ? (
        <div className="text-center py-8 text-muted-foreground">Cargando gastos...</div>
      ) : filteredGastos.length === 0 ? (
        <div className="text-center py-8 text-muted-foreground">
          {hasActiveFilters ? 'No hay gastos que coincidan con los filtros.' : 'No hay gastos registrados.'}
        </div>
      ) : (
        <div className="space-y-1">
          {groupedGastos.map((group) => (
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

              {/* Gasto rows */}
              <div className="space-y-px">
                {group.items.map((gasto) => {
                  const isExpanded = expandedId === gasto.id
                  return (
                    <div key={gasto.id} className="group">
                      {/* Main row — clickable */}
                      <button
                        className={cn(
                          'w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-left transition-colors',
                          'hover:bg-accent/50',
                          isExpanded && 'bg-accent/50'
                        )}
                        onClick={() => toggleExpanded(gasto.id)}
                        aria-expanded={isExpanded}
                      >
                        {/* Date (compact) */}
                        <span className="text-xs text-muted-foreground w-[42px] shrink-0 tabular-nums">
                          {format(parseISO(gasto.fecha.slice(0, 10)), 'dd/MM')}
                        </span>

                        {/* Type dot */}
                        <span className={cn('text-lg leading-none shrink-0', TIPO_COLORS[gasto.tipo_origen] || 'text-muted-foreground')}>
                          ·
                        </span>

                        {/* Description + Category */}
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium truncate">{gasto.descripcion}</p>
                          <p className="text-xs text-muted-foreground truncate">
                            {gasto.categoria?.nombre_categoria || 'Sin categoría'}
                            {gasto.cantidad_cuotas_totales ? ` · Cuota ${gasto.cantidad_cuotas_pagadas}/${gasto.cantidad_cuotas_totales}` : ''}
                          </p>
                        </div>

                        {/* Amount */}
                        <span className="text-sm font-semibold tabular-nums shrink-0">
                          {formatCurrency(parseFloat(gasto.monto_ars))}
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
                            <span className="font-medium text-foreground">{TIPO_LABELS[gasto.tipo_origen] || gasto.tipo_origen}</span>
                          </span>
                          {gasto.monto_usd && parseFloat(gasto.monto_usd) > 0 && (
                            <span>USD ${parseFloat(gasto.monto_usd).toFixed(2)}</span>
                          )}
                          {gasto.tipoPago?.nombre && (
                            <span>{gasto.tipoPago.nombre}</span>
                          )}
                          <span>{formatDate(gasto.fecha)}</span>
                          <div className="flex-1" />
                          <Button
                            variant="ghost"
                            size="sm"
                            className="h-7 text-xs text-destructive hover:text-destructive px-2"
                            onClick={(e) => { e.stopPropagation(); handleDeleteClick(gasto.id) }}
                          >
                            <Trash2 className="h-3.5 w-3.5 mr-1" />
                            Eliminar
                          </Button>
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
                {((currentPage - 1) * ITEMS_PER_PAGE) + 1}–{Math.min(currentPage * ITEMS_PER_PAGE, filteredGastos.length)} de {filteredGastos.length}
              </p>
              <div className="flex items-center justify-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                  disabled={currentPage === 1}
                >
                  <ChevronLeft className="h-4 w-4" />
                </Button>
                <span className="text-sm text-muted-foreground px-2">
                  {currentPage} / {totalPages}
                </span>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                  disabled={currentPage === totalPages}
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
        title="Eliminar gasto"
        description="¿Estás seguro de eliminar este gasto? Esta acción no se puede deshacer."
        confirmLabel="Eliminar"
        onConfirm={handleDeleteConfirm}
        isLoading={deleteMutation.isPending}
      />
    </div>
  )
}
