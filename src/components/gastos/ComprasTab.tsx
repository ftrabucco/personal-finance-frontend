'use client'

import { useState, useEffect, useMemo } from 'react'
import { useSearchParams, useRouter } from 'next/navigation'
import { Plus, Pencil, Trash2, ShoppingCart, ArrowUpDown, ArrowUp, ArrowDown, CalendarClock, Clock, X } from 'lucide-react'
import { Input } from '@/components/ui/input'
import { addMonths, format, parseISO } from 'date-fns'
import { es } from 'date-fns/locale'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { CompraForm } from '@/components/forms/CompraForm'
import { DualCurrencyDisplay } from '@/components/common/DualCurrencyDisplay'
import { CollapsibleFilters } from '@/components/common/CollapsibleFilters'
import { DATE_PRESETS } from '@/lib/utils/datePresets'
import {
  useCompras,
  useCreateCompra,
  useUpdateCompra,
  useDeleteCompra,
} from '@/lib/hooks/useCompras'
import { formatCurrency, formatCurrencyCompact, formatDate } from '@/lib/utils/formatters'
import { cleanFormData } from '@/lib/utils/cleanFormData'
import { showErrorToast } from '@/lib/utils/errorHandler'
import { ConfirmDialog } from '@/components/ui/confirm-dialog'
import { useConfirmDialog } from '@/lib/hooks/useConfirmDialog'
import type { Compra } from '@/types'

type SortField = 'fecha_compra' | 'descripcion' | 'monto_total_ars' | 'cantidad_cuotas' | 'tarjeta' | 'cuota_mensual'
type SortDirection = 'asc' | 'desc'

function getCuotaMensualARS(compra: Compra): number {
  return (Number(compra.monto_total_ars) || 0) / (compra.cantidad_cuotas || 1)
}

function getCuotaMensualUSD(compra: Compra): number {
  return (Number(compra.monto_total_usd) || 0) / (compra.cantidad_cuotas || 1)
}

function getFechaFinEstimada(compra: Compra): Date {
  const fechaCompra = parseISO(compra.fecha_compra)
  const cuotasRestantes = compra.cantidad_cuotas - (compra.cuotas_pagadas || 0)
  return addMonths(fechaCompra, compra.cuotas_pagadas + cuotasRestantes)
}

export function ComprasTab() {
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [editingCompra, setEditingCompra] = useState<Compra | null>(null)
  const [sortField, setSortField] = useState<SortField>('fecha_compra')
  const [sortDirection, setSortDirection] = useState<SortDirection>('desc')
  const [statusFilter, setStatusFilter] = useState<'todas' | 'pendientes' | 'finalizadas'>('pendientes')
  const [tarjetaFilter, setTarjetaFilter] = useState<string>('todas')
  const [categoriaFilter, setCategoriaFilter] = useState<string>('todas')
  const [monedaFilter, setMonedaFilter] = useState<string>('todas')
  const [fechaDesde, setFechaDesde] = useState<string>('')
  const [fechaHasta, setFechaHasta] = useState<string>('')
  const searchParams = useSearchParams()
  const router = useRouter()

  // Open dialog if ?new=true is in URL
  useEffect(() => {
    if (searchParams.get('new') === 'true') {
      setEditingCompra(null)
      setIsDialogOpen(true)
      router.replace('/gastos?tab=cuotas', { scroll: false })
    }
  }, [searchParams, router])

  const { data: response, isLoading } = useCompras()
  const createMutation = useCreateCompra()
  const updateMutation = useUpdateCompra()
  const deleteMutation = useDeleteCompra()
  const confirmDialog = useConfirmDialog()

  const compras = response?.data || []

  // Extract unique tarjetas and categorias from data
  const tarjetasUnicas = useMemo(() => {
    const map = new Map<number, string>()
    compras.forEach(c => {
      if (c.tarjeta?.id && c.tarjeta?.nombre) {
        map.set(c.tarjeta.id, c.tarjeta.nombre)
      }
    })
    return Array.from(map.entries()).map(([id, nombre]) => ({ id, nombre })).sort((a, b) => a.nombre.localeCompare(b.nombre))
  }, [compras])

  const categoriasUnicas = useMemo(() => {
    const map = new Map<number, string>()
    compras.forEach(c => {
      if (c.categoria?.id && c.categoria?.nombre_categoria) {
        map.set(c.categoria.id, c.categoria.nombre_categoria)
      }
    })
    return Array.from(map.entries()).map(([id, nombre]) => ({ id, nombre })).sort((a, b) => a.nombre.localeCompare(b.nombre))
  }, [compras])

  const hasActiveFilters = tarjetaFilter !== 'todas' || categoriaFilter !== 'todas' || monedaFilter !== 'todas' || fechaDesde !== '' || fechaHasta !== ''
  const activeFilterCount = [tarjetaFilter !== 'todas', categoriaFilter !== 'todas', monedaFilter !== 'todas', fechaDesde !== '', fechaHasta !== ''].filter(Boolean).length

  const filteredCompras = useMemo(() => {
    let filtered = compras
    if (statusFilter === 'pendientes') filtered = filtered.filter(c => c.pendiente_cuotas)
    if (statusFilter === 'finalizadas') filtered = filtered.filter(c => !c.pendiente_cuotas)
    if (tarjetaFilter !== 'todas') filtered = filtered.filter(c => c.tarjeta_id === Number(tarjetaFilter))
    if (categoriaFilter !== 'todas') filtered = filtered.filter(c => c.categoria_gasto_id === Number(categoriaFilter))
    if (monedaFilter !== 'todas') filtered = filtered.filter(c => c.moneda_origen === monedaFilter)
    if (fechaDesde) filtered = filtered.filter(c => c.fecha_compra >= fechaDesde)
    if (fechaHasta) filtered = filtered.filter(c => c.fecha_compra <= fechaHasta)

    return [...filtered].sort((a, b) => {
      let comparison = 0
      switch (sortField) {
        case 'fecha_compra':
          comparison = new Date(a.fecha_compra).getTime() - new Date(b.fecha_compra).getTime()
          break
        case 'descripcion':
          comparison = a.descripcion.localeCompare(b.descripcion)
          break
        case 'monto_total_ars':
          comparison = Number(a.monto_total_ars) - Number(b.monto_total_ars)
          break
        case 'cantidad_cuotas':
          comparison = a.cantidad_cuotas - b.cantidad_cuotas
          break
        case 'tarjeta':
          comparison = (a.tarjeta?.nombre || '').localeCompare(b.tarjeta?.nombre || '')
          break
        case 'cuota_mensual':
          comparison = getCuotaMensualARS(a) - getCuotaMensualARS(b)
          break
      }
      return sortDirection === 'asc' ? comparison : -comparison
    })
  }, [compras, sortField, sortDirection, statusFilter, tarjetaFilter, categoriaFilter, monedaFilter, fechaDesde, fechaHasta])

  const handleSort = (field: SortField) => {
    if (sortField === field) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc')
    } else {
      setSortField(field)
      setSortDirection('desc')
    }
  }

  const SortableHeader = ({ field, children }: { field: SortField; children: React.ReactNode }) => (
    <TableHead
      className="cursor-pointer select-none hover:bg-muted/50 transition-colors"
      onClick={() => handleSort(field)}
    >
      <div className="flex items-center gap-1">
        {children}
        {sortField === field ? (
          sortDirection === 'asc' ? (
            <ArrowUp className="h-4 w-4" />
          ) : (
            <ArrowDown className="h-4 w-4" />
          )
        ) : (
          <ArrowUpDown className="h-4 w-4 opacity-30" />
        )}
      </div>
    </TableHead>
  )

  const handleCreate = () => {
    setEditingCompra(null)
    setIsDialogOpen(true)
  }

  const handleEdit = (compra: Compra) => {
    setEditingCompra(compra)
    setIsDialogOpen(true)
  }

  const handleDeleteClick = (id: number) => {
    confirmDialog.requestConfirm(id)
  }

  const handleDeleteConfirm = async () => {
    const id = confirmDialog.confirm()
    if (id == null) return
    try {
      await deleteMutation.mutateAsync(id)
    } catch (error) {
      showErrorToast(error)
    }
  }

  const handleSubmit = async (data: Partial<Compra>) => {
    try {
      const cleanData = cleanFormData(data)

      if (editingCompra) {
        await updateMutation.mutateAsync({
          id: editingCompra.id,
          data: cleanData,
        })
      } else {
        await createMutation.mutateAsync(cleanData)
      }
      setIsDialogOpen(false)
      setEditingCompra(null)
    } catch (error) {
      showErrorToast(error)
    }
  }

  const handleClearFilters = () => {
    setTarjetaFilter('todas')
    setCategoriaFilter('todas')
    setMonedaFilter('todas')
    setFechaDesde('')
    setFechaHasta('')
  }

  // Summary calculations based on filtered data (respond to filters)
  const pendientesForSummary = filteredCompras.filter((c) => c.pendiente_cuotas)

  const cuotaMensualARS = pendientesForSummary.reduce((sum, c) =>
    sum + getCuotaMensualARS(c), 0)
  const cuotaMensualUSD = pendientesForSummary.reduce((sum, c) =>
    sum + getCuotaMensualUSD(c), 0)

  const totalPendienteARS = pendientesForSummary.reduce((sum, c) => {
    const cuotaARS = getCuotaMensualARS(c)
    const restantes = c.cantidad_cuotas - (c.cuotas_pagadas || 0)
    return sum + cuotaARS * restantes
  }, 0)
  const totalPendienteUSD = pendientesForSummary.reduce((sum, c) => {
    const cuotaUSD = getCuotaMensualUSD(c)
    const restantes = c.cantidad_cuotas - (c.cuotas_pagadas || 0)
    return sum + cuotaUSD * restantes
  }, 0)

  // Counts for status tabs (before tarjeta/categoria filters but after status)
  const comprasAfterExtraFilters = useMemo(() => {
    let filtered = compras
    if (tarjetaFilter !== 'todas') filtered = filtered.filter(c => c.tarjeta_id === Number(tarjetaFilter))
    if (categoriaFilter !== 'todas') filtered = filtered.filter(c => c.categoria_gasto_id === Number(categoriaFilter))
    if (monedaFilter !== 'todas') filtered = filtered.filter(c => c.moneda_origen === monedaFilter)
    if (fechaDesde) filtered = filtered.filter(c => c.fecha_compra >= fechaDesde)
    if (fechaHasta) filtered = filtered.filter(c => c.fecha_compra <= fechaHasta)
    return filtered
  }, [compras, tarjetaFilter, categoriaFilter, monedaFilter, fechaDesde, fechaHasta])

  const comprasPendientesCount = comprasAfterExtraFilters.filter(c => c.pendiente_cuotas).length
  const comprasFinalizadasCount = comprasAfterExtraFilters.filter(c => !c.pendiente_cuotas).length

  return (
    <div className="space-y-4 md:space-y-6">
      <div className="flex justify-end">
        <Button onClick={handleCreate} className="w-full sm:w-auto">
          <Plus className="mr-2 h-4 w-4" />
          Nueva Cuota
        </Button>
      </div>

      <div className="grid grid-cols-2 gap-3 md:grid-cols-3 md:gap-4">
        <Card className="overflow-hidden">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Cuotas del Mes</CardTitle>
            <CalendarClock className="h-4 w-4 text-muted-foreground shrink-0" />
          </CardHeader>
          <CardContent>
            <div className="space-y-1">
              <div className="text-lg sm:text-xl md:text-2xl font-bold" title={formatCurrency(cuotaMensualARS)}>
                {formatCurrencyCompact(cuotaMensualARS)}
              </div>
              {cuotaMensualUSD > 0 && (
                <div className="text-sm text-muted-foreground">
                  {formatCurrencyCompact(cuotaMensualUSD, 'USD')}
                </div>
              )}
            </div>
            <p className="text-xs text-muted-foreground mt-2">
              Cuotas a pagar este mes
            </p>
          </CardContent>
        </Card>

        <Card className="overflow-hidden">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Pendiente</CardTitle>
            <Clock className="h-4 w-4 text-yellow-500 shrink-0" />
          </CardHeader>
          <CardContent>
            <div className="space-y-1">
              <div className="text-lg sm:text-xl md:text-2xl font-bold" title={formatCurrency(totalPendienteARS)}>
                {formatCurrencyCompact(totalPendienteARS)}
              </div>
              {totalPendienteUSD > 0 && (
                <div className="text-sm text-muted-foreground">
                  {formatCurrencyCompact(totalPendienteUSD, 'USD')}
                </div>
              )}
            </div>
            <p className="text-xs text-muted-foreground mt-2">
              Suma de cuotas restantes
            </p>
          </CardContent>
        </Card>

        <Card className="overflow-hidden col-span-2 md:col-span-1">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Compras</CardTitle>
            <ShoppingCart className="h-4 w-4 text-muted-foreground shrink-0" />
          </CardHeader>
          <CardContent>
            <div className="flex items-baseline gap-3">
              <div>
                <span className="text-lg sm:text-xl md:text-2xl font-bold text-yellow-500">{comprasPendientesCount}</span>
                <span className="text-xs text-muted-foreground ml-1">pendientes</span>
              </div>
              <div className="text-muted-foreground">/</div>
              <div>
                <span className="text-lg sm:text-xl md:text-2xl font-bold text-green-500">{comprasFinalizadasCount}</span>
                <span className="text-xs text-muted-foreground ml-1">finalizadas</span>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <div className="flex flex-col gap-4">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
              <CardTitle className="flex items-center gap-2">
                <ShoppingCart className="h-5 w-5" />
                Compras en Cuotas
              </CardTitle>
              <Tabs value={statusFilter} onValueChange={(v) => setStatusFilter(v as typeof statusFilter)}>
                <TabsList>
                  <TabsTrigger value="todas">
                    Todas <Badge variant="secondary" className="ml-1.5">{comprasAfterExtraFilters.length}</Badge>
                  </TabsTrigger>
                  <TabsTrigger value="pendientes">
                    Pendientes <Badge variant="warning" className="ml-1.5">{comprasPendientesCount}</Badge>
                  </TabsTrigger>
                  <TabsTrigger value="finalizadas">
                    Finalizadas <Badge variant="success" className="ml-1.5">{comprasFinalizadasCount}</Badge>
                  </TabsTrigger>
                </TabsList>
              </Tabs>
            </div>

            <CollapsibleFilters
              activeFilterCount={activeFilterCount}
              datePresets={DATE_PRESETS}
              onPresetSelect={(from, to) => { setFechaDesde(from); setFechaHasta(to) }}
              currentDateFrom={fechaDesde}
              currentDateTo={fechaHasta}
            >
              <div className="space-y-3">
                <div className="flex flex-1 flex-wrap gap-2">
                  <Select value={tarjetaFilter} onValueChange={setTarjetaFilter}>
                    <SelectTrigger className="w-full sm:w-[180px] h-9">
                      <SelectValue placeholder="Tarjeta" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="todas">Todas las tarjetas</SelectItem>
                      {tarjetasUnicas.map(t => (
                        <SelectItem key={t.id} value={String(t.id)}>{t.nombre}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <Select value={categoriaFilter} onValueChange={setCategoriaFilter}>
                    <SelectTrigger className="w-full sm:w-[180px] h-9">
                      <SelectValue placeholder="Categoría" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="todas">Todas las categorías</SelectItem>
                      {categoriasUnicas.map(c => (
                        <SelectItem key={c.id} value={String(c.id)}>{c.nombre}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <Select value={monedaFilter} onValueChange={setMonedaFilter}>
                    <SelectTrigger className="w-full sm:w-[140px] h-9">
                      <SelectValue placeholder="Moneda" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="todas">Todas las monedas</SelectItem>
                      <SelectItem value="ARS">ARS</SelectItem>
                      <SelectItem value="USD">USD</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="flex items-center gap-2 flex-wrap">
                  <div>
                    <label className="text-xs text-muted-foreground mb-1 block">Desde</label>
                    <Input
                      type="date"
                      value={fechaDesde}
                      onChange={(e) => setFechaDesde(e.target.value)}
                      className="h-9 w-full sm:w-[160px]"
                    />
                  </div>
                  <div>
                    <label className="text-xs text-muted-foreground mb-1 block">Hasta</label>
                    <Input
                      type="date"
                      value={fechaHasta}
                      onChange={(e) => setFechaHasta(e.target.value)}
                      className="h-9 w-full sm:w-[160px]"
                    />
                  </div>
                </div>
                {hasActiveFilters && (
                  <div className="flex items-center justify-between pt-2 border-t">
                    <span className="text-sm text-muted-foreground">
                      {filteredCompras.length} resultados
                    </span>
                    <Button variant="ghost" size="sm" onClick={handleClearFilters} className="text-xs">
                      <X className="h-4 w-4 mr-1" />
                      Limpiar todo
                    </Button>
                  </div>
                )}
              </div>
            </CollapsibleFilters>
          </div>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="text-center py-8">Cargando compras...</div>
          ) : filteredCompras.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              {hasActiveFilters || statusFilter !== 'pendientes'
                ? 'No hay compras que coincidan con los filtros seleccionados.'
                : 'No hay compras en cuotas pendientes.'}
            </div>
          ) : (
            <>
              {/* Mobile: Cards */}
              <div className="space-y-3 md:hidden">
                {filteredCompras.map((compra) => {
                  const cuotaMensual = getCuotaMensualARS(compra)
                  const cuotaMensualUsd = getCuotaMensualUSD(compra)
                  const fechaFin = getFechaFinEstimada(compra)
                  return (
                    <div key={compra.id} className="rounded-lg border p-3">
                      <div className="flex items-center justify-between gap-2 mb-2">
                        <div className="flex items-center gap-2">
                          {compra.pendiente_cuotas ? (
                            <Badge variant="warning" className="text-xs">Pendiente</Badge>
                          ) : (
                            <Badge variant="success" className="text-xs">Finalizada</Badge>
                          )}
                          <span className="text-xs text-muted-foreground">
                            {formatDate(compra.fecha_compra)}
                          </span>
                        </div>
                        <DualCurrencyDisplay
                          montoArs={compra.monto_total_ars}
                          montoUsd={compra.monto_total_usd}
                          monedaOrigen={compra.moneda_origen}
                          tipoCambio={compra.tipo_cambio_usado}
                        />
                      </div>
                      <div className="min-w-0">
                        <p className="font-medium truncate">{compra.descripcion}</p>
                        {compra.pendiente_cuotas && (
                          <div className="flex items-center justify-between mt-1">
                            <span className="text-sm font-semibold text-primary">
                              {formatCurrency(cuotaMensual)}/mes
                            </span>
                            <span className="text-xs text-muted-foreground">
                              Termina {format(fechaFin, 'MMM yyyy', { locale: es })}
                            </span>
                          </div>
                        )}
                        {compra.cantidad_cuotas > 1 ? (
                          <div className="flex items-center gap-2 mt-1">
                            <Progress
                              value={(compra.cuotas_pagadas / compra.cantidad_cuotas) * 100}
                              className={`h-1.5 flex-1 ${!compra.pendiente_cuotas ? '[&>div]:bg-green-500' : '[&>div]:bg-yellow-500'}`}
                            />
                            <span className="text-xs text-muted-foreground whitespace-nowrap">
                              Cuota {compra.cuotas_pagadas} de {compra.cantidad_cuotas}
                            </span>
                          </div>
                        ) : (
                          <span className="text-xs text-muted-foreground">1 cuota</span>
                        )}
                        {compra.tarjeta?.nombre && (
                          <span className="text-xs text-muted-foreground truncate block mt-0.5">{compra.tarjeta.nombre}</span>
                        )}
                      </div>
                      <div className="flex justify-end mt-2 pt-2 border-t gap-2">
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-8"
                          onClick={() => handleEdit(compra)}
                        >
                          <Pencil className="h-4 w-4 mr-1" />
                          Editar
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-8 text-destructive hover:text-destructive"
                          onClick={() => handleDeleteClick(compra.id)}
                        >
                          <Trash2 className="h-4 w-4 mr-1" />
                          Eliminar
                        </Button>
                      </div>
                    </div>
                  )
                })}
              </div>

              {/* Desktop: Table */}
              <div className="hidden md:block">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <SortableHeader field="fecha_compra">Fecha</SortableHeader>
                      <SortableHeader field="descripcion">Descripcion</SortableHeader>
                      <TableHead>Categoria</TableHead>
                      <SortableHeader field="monto_total_ars">Monto Total</SortableHeader>
                      <SortableHeader field="cuota_mensual">Cuota/Mes</SortableHeader>
                      <SortableHeader field="cantidad_cuotas">Progreso</SortableHeader>
                      <SortableHeader field="tarjeta">Tarjeta</SortableHeader>
                      <TableHead>Finaliza</TableHead>
                      <TableHead className="text-right">Acciones</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredCompras.map((compra) => {
                      const cuotaMensual = getCuotaMensualARS(compra)
                      const cuotaMensualUsd = getCuotaMensualUSD(compra)
                      const fechaFin = getFechaFinEstimada(compra)
                      return (
                        <TableRow key={compra.id}>
                          <TableCell>
                            {formatDate(compra.fecha_compra)}
                          </TableCell>
                          <TableCell className="max-w-xs truncate">
                            {compra.descripcion}
                          </TableCell>
                          <TableCell>
                            {compra.categoria?.nombre_categoria || '-'}
                          </TableCell>
                          <TableCell>
                            <DualCurrencyDisplay
                              montoArs={compra.monto_total_ars}
                              montoUsd={compra.monto_total_usd}
                              monedaOrigen={compra.moneda_origen}
                              tipoCambio={compra.tipo_cambio_usado}
                            />
                          </TableCell>
                          <TableCell>
                            {compra.pendiente_cuotas ? (
                              <div className="flex flex-col">
                                <span className="font-semibold text-primary">
                                  {formatCurrency(cuotaMensual)}
                                </span>
                                {compra.moneda_origen === 'USD' && cuotaMensualUsd > 0 && (
                                  <span className="text-xs text-muted-foreground">
                                    US$ {cuotaMensualUsd.toFixed(2)}
                                  </span>
                                )}
                              </div>
                            ) : (
                              <span className="text-muted-foreground">-</span>
                            )}
                          </TableCell>
                          <TableCell>
                            {compra.cantidad_cuotas > 1 ? (
                              <div className="flex items-center gap-2 min-w-[120px]">
                                <Progress
                                  value={(compra.cuotas_pagadas / compra.cantidad_cuotas) * 100}
                                  className={`h-2 flex-1 ${!compra.pendiente_cuotas ? '[&>div]:bg-green-500' : '[&>div]:bg-yellow-500'}`}
                                />
                                <span className="text-sm text-muted-foreground whitespace-nowrap">
                                  {compra.cuotas_pagadas}/{compra.cantidad_cuotas}
                                </span>
                              </div>
                            ) : (
                              <Badge variant="secondary">1 cuota</Badge>
                            )}
                          </TableCell>
                          <TableCell>{compra.tarjeta?.nombre || '-'}</TableCell>
                          <TableCell>
                            {compra.pendiente_cuotas ? (
                              <span className="text-sm text-muted-foreground whitespace-nowrap">
                                {format(fechaFin, 'MMM yyyy', { locale: es })}
                              </span>
                            ) : (
                              <Badge variant="success">Pagada</Badge>
                            )}
                          </TableCell>
                          <TableCell className="text-right">
                            <div className="flex justify-end gap-2">
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => handleEdit(compra)}
                              >
                                <Pencil className="h-4 w-4" />
                              </Button>
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => handleDeleteClick(compra.id)}
                              >
                                <Trash2 className="h-4 w-4 text-destructive" />
                              </Button>
                            </div>
                          </TableCell>
                        </TableRow>
                      )
                    })}
                  </TableBody>
                </Table>
              </div>
            </>
          )}
        </CardContent>
      </Card>

      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              {editingCompra ? 'Editar Cuota' : 'Nueva Cuota'}
            </DialogTitle>
            <DialogDescription>
              {editingCompra
                ? 'Modifica los datos de la compra en cuotas'
                : 'Registra una nueva compra en cuotas'}
            </DialogDescription>
          </DialogHeader>
          <CompraForm
            initialData={editingCompra || undefined}
            onSubmit={handleSubmit}
            onCancel={() => {
              setIsDialogOpen(false)
              setEditingCompra(null)
            }}
            isSubmitting={createMutation.isPending || updateMutation.isPending}
          />
        </DialogContent>
      </Dialog>

      <ConfirmDialog
        open={confirmDialog.isOpen}
        onOpenChange={confirmDialog.setIsOpen}
        title="Eliminar compra"
        description="¿Estás seguro de eliminar esta compra? Esta acción no se puede deshacer."
        confirmLabel="Eliminar"
        onConfirm={handleDeleteConfirm}
        isLoading={deleteMutation.isPending}
      />
    </div>
  )
}
