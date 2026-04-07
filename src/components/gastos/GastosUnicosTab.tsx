'use client'

import { useState, useEffect, useMemo } from 'react'
import { useSearchParams, useRouter } from 'next/navigation'
import { Plus, Pencil, Trash2, Wallet, ArrowUpDown, ArrowUp, ArrowDown, X } from 'lucide-react'
import { startOfMonth, endOfMonth } from 'date-fns'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
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
import { GastoUnicoForm } from '@/components/forms/GastoUnicoForm'
import { DualCurrencyDisplay } from '@/components/common/DualCurrencyDisplay'
import { CollapsibleFilters } from '@/components/common/CollapsibleFilters'
import { DATE_PRESETS, toDateString } from '@/lib/utils/datePresets'
import {
  useGastosUnicos,
  useCreateGastoUnico,
  useUpdateGastoUnico,
  useDeleteGastoUnico,
} from '@/lib/hooks/useGastosUnicos'
import { formatCurrency, formatCurrencyCompact, formatDate } from '@/lib/utils/formatters'
import { cleanFormData } from '@/lib/utils/cleanFormData'
import { showErrorToast } from '@/lib/utils/errorHandler'
import { ConfirmDialog } from '@/components/ui/confirm-dialog'
import { useConfirmDialog } from '@/lib/hooks/useConfirmDialog'
import type { GastoUnico } from '@/types'

type SortField = 'fecha' | 'descripcion' | 'monto_ars' | 'categoria'
type SortDirection = 'asc' | 'desc'

export function GastosUnicosTab() {
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [editingGasto, setEditingGasto] = useState<GastoUnico | null>(null)
  const [sortField, setSortField] = useState<SortField>('fecha')
  const [sortDirection, setSortDirection] = useState<SortDirection>('desc')
  // Default: current month
  const [fechaDesde, setFechaDesde] = useState(toDateString(startOfMonth(new Date())))
  const [fechaHasta, setFechaHasta] = useState(toDateString(endOfMonth(new Date())))
  const [categoriaFilter, setCategoriaFilter] = useState<string>('todas')
  const [monedaFilter, setMonedaFilter] = useState<string>('todas')
  const searchParams = useSearchParams()
  const router = useRouter()

  // Open dialog if ?new=true is in URL
  useEffect(() => {
    if (searchParams.get('new') === 'true') {
      setEditingGasto(null)
      setIsDialogOpen(true)
      router.replace('/gastos?tab=unicos', { scroll: false })
    }
  }, [searchParams, router])

  const { data: response, isLoading } = useGastosUnicos()
  const createMutation = useCreateGastoUnico()
  const updateMutation = useUpdateGastoUnico()
  const deleteMutation = useDeleteGastoUnico()
  const confirmDialog = useConfirmDialog()

  const gastos = response?.data || []

  // Extract unique categorias from data
  const categoriasUnicas = useMemo(() => {
    const map = new Map<number, string>()
    gastos.forEach(g => {
      if (g.categoria?.id && g.categoria?.nombre_categoria) {
        map.set(g.categoria.id, g.categoria.nombre_categoria)
      }
    })
    return Array.from(map.entries()).map(([id, nombre]) => ({ id, nombre })).sort((a, b) => a.nombre.localeCompare(b.nombre))
  }, [gastos])

  const hasActiveFilters = categoriaFilter !== 'todas' || monedaFilter !== 'todas' ||
    fechaDesde !== toDateString(startOfMonth(new Date())) || fechaHasta !== toDateString(endOfMonth(new Date()))
  const activeFilterCount = [categoriaFilter !== 'todas', monedaFilter !== 'todas',
    fechaDesde !== toDateString(startOfMonth(new Date())), fechaHasta !== toDateString(endOfMonth(new Date()))].filter(Boolean).length

  const filteredGastos = useMemo(() => {
    let filtered = gastos
    if (categoriaFilter !== 'todas') filtered = filtered.filter(g => g.categoria_gasto_id === Number(categoriaFilter))
    if (monedaFilter !== 'todas') filtered = filtered.filter(g => g.moneda_origen === monedaFilter)
    if (fechaDesde) filtered = filtered.filter(g => g.fecha >= fechaDesde)
    if (fechaHasta) filtered = filtered.filter(g => g.fecha <= fechaHasta)

    return [...filtered].sort((a, b) => {
      let comparison = 0
      switch (sortField) {
        case 'fecha':
          comparison = new Date(a.fecha).getTime() - new Date(b.fecha).getTime()
          break
        case 'descripcion':
          comparison = a.descripcion.localeCompare(b.descripcion)
          break
        case 'monto_ars':
          comparison = Number(a.monto_ars) - Number(b.monto_ars)
          break
        case 'categoria':
          comparison = (a.categoria?.nombre_categoria || '').localeCompare(b.categoria?.nombre_categoria || '')
          break
      }
      return sortDirection === 'asc' ? comparison : -comparison
    })
  }, [gastos, sortField, sortDirection, categoriaFilter, monedaFilter, fechaDesde, fechaHasta])

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
    setEditingGasto(null)
    setIsDialogOpen(true)
  }

  const handleEdit = (gasto: GastoUnico) => {
    setEditingGasto(gasto)
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

  const handleSubmit = async (data: Partial<GastoUnico>) => {
    try {
      const cleanData = cleanFormData(data)

      if (editingGasto) {
        await updateMutation.mutateAsync({
          id: editingGasto.id,
          data: cleanData,
        })
      } else {
        await createMutation.mutateAsync(cleanData)
      }
      setIsDialogOpen(false)
      setEditingGasto(null)
    } catch (error) {
      showErrorToast(error)
    }
  }

  const handleClearFilters = () => {
    setCategoriaFilter('todas')
    setMonedaFilter('todas')
    setFechaDesde(toDateString(startOfMonth(new Date())))
    setFechaHasta(toDateString(endOfMonth(new Date())))
  }

  const totalARS = filteredGastos.reduce((sum, gasto) => sum + (Number(gasto.monto_ars) || 0), 0)
  const totalUSD = filteredGastos.reduce((sum, gasto) => sum + (Number(gasto.monto_usd) || 0), 0)

  return (
    <div className="space-y-4 md:space-y-6">
      <div className="flex justify-end">
        <Button onClick={handleCreate} className="w-full sm:w-auto">
          <Plus className="mr-2 h-4 w-4" />
          Nuevo Gasto
        </Button>
      </div>

      <div className="grid grid-cols-2 gap-3 md:gap-4">
        <Card className="overflow-hidden">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Gastos</CardTitle>
            <Wallet className="h-4 w-4 text-muted-foreground shrink-0" />
          </CardHeader>
          <CardContent>
            <div className="space-y-1">
              <div className="text-lg sm:text-xl md:text-2xl font-bold truncate" title={formatCurrency(totalARS)}>
                {formatCurrencyCompact(totalARS)}
              </div>
              <div className="text-sm text-muted-foreground" title={`US$ ${totalUSD.toFixed(2)}`}>
                {formatCurrencyCompact(totalUSD, 'USD')}
              </div>
            </div>
            <p className="text-xs text-muted-foreground mt-2">
              Suma de gastos filtrados
            </p>
          </CardContent>
        </Card>

        <Card className="overflow-hidden">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Cantidad</CardTitle>
            <Wallet className="h-4 w-4 text-muted-foreground shrink-0" />
          </CardHeader>
          <CardContent>
            <div className="text-lg sm:text-xl md:text-2xl font-bold">{filteredGastos.length}</div>
            <p className="text-xs text-muted-foreground">
              {filteredGastos.length === 1 ? 'gasto encontrado' : 'gastos encontrados'}
            </p>
          </CardContent>
        </Card>
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
                {filteredGastos.length} resultados
              </span>
              <Button variant="ghost" size="sm" onClick={handleClearFilters} className="text-xs">
                <X className="h-4 w-4 mr-1" />
                Limpiar todo
              </Button>
            </div>
          )}
        </div>
      </CollapsibleFilters>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Wallet className="h-5 w-5" />
            Listado de Gastos
          </CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="text-center py-8">Cargando gastos...</div>
          ) : filteredGastos.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              {hasActiveFilters
                ? 'No hay gastos que coincidan con los filtros seleccionados.'
                : 'No hay gastos registrados. Crea tu primer gasto unico.'}
            </div>
          ) : (
            <>
              {/* Mobile: Cards */}
              <div className="space-y-3 md:hidden">
                {filteredGastos.map((gasto) => (
                  <div key={gasto.id} className="rounded-lg border p-3">
                    <div className="flex items-center justify-between gap-2 mb-2">
                      <Badge variant={gasto.procesado ? 'default' : 'secondary'} className="text-xs shrink-0">
                        {gasto.procesado ? 'Procesado' : 'Pendiente'}
                      </Badge>
                      <span className="text-xs text-muted-foreground">
                        {formatDate(gasto.fecha)}
                      </span>
                    </div>
                    <p className="font-medium truncate mb-1">{gasto.descripcion}</p>
                    <div className="flex items-center justify-between gap-2">
                      <p className="text-xs text-muted-foreground truncate">
                        {gasto.categoria?.nombre_categoria || 'Sin categoria'}
                      </p>
                      <div className="text-right shrink-0">
                        <DualCurrencyDisplay
                          montoArs={gasto.monto_ars}
                          montoUsd={gasto.monto_usd}
                          monedaOrigen={gasto.moneda_origen}
                          tipoCambio={gasto.tipo_cambio_usado}
                        />
                      </div>
                    </div>
                    <div className="flex justify-end mt-2 pt-2 border-t gap-2">
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-8"
                        onClick={() => handleEdit(gasto)}
                      >
                        <Pencil className="h-4 w-4 mr-1" />
                        Editar
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-8 text-destructive hover:text-destructive"
                        onClick={() => handleDeleteClick(gasto.id)}
                      >
                        <Trash2 className="h-4 w-4 mr-1" />
                        Eliminar
                      </Button>
                    </div>
                  </div>
                ))}
              </div>

              {/* Desktop: Table */}
              <div className="hidden md:block">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <SortableHeader field="fecha">Fecha</SortableHeader>
                      <SortableHeader field="descripcion">Descripcion</SortableHeader>
                      <SortableHeader field="categoria">Categoria</SortableHeader>
                      <SortableHeader field="monto_ars">Monto</SortableHeader>
                      <TableHead>Tipo de Pago</TableHead>
                      <TableHead>Estado</TableHead>
                      <TableHead className="text-right">Acciones</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredGastos.map((gasto) => (
                      <TableRow key={gasto.id}>
                        <TableCell>
                          {formatDate(gasto.fecha)}
                        </TableCell>
                        <TableCell className="max-w-[200px] truncate">
                          {gasto.descripcion}
                        </TableCell>
                        <TableCell>
                          {gasto.categoria?.nombre_categoria || 'Sin categoria'}
                        </TableCell>
                        <TableCell>
                          <DualCurrencyDisplay
                            montoArs={gasto.monto_ars}
                            montoUsd={gasto.monto_usd}
                            monedaOrigen={gasto.moneda_origen}
                            tipoCambio={gasto.tipo_cambio_usado}
                          />
                        </TableCell>
                        <TableCell>
                          {gasto.tipoPago?.nombre || 'N/A'}
                        </TableCell>
                        <TableCell>
                          <Badge variant={gasto.procesado ? 'default' : 'secondary'}>
                            {gasto.procesado ? 'Procesado' : 'Pendiente'}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-right">
                          <div className="flex justify-end gap-2">
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => handleEdit(gasto)}
                            >
                              <Pencil className="h-4 w-4" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => handleDeleteClick(gasto.id)}
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
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
              {editingGasto ? 'Editar Gasto Unico' : 'Nuevo Gasto Unico'}
            </DialogTitle>
            <DialogDescription>
              {editingGasto
                ? 'Modifica los datos del gasto unico'
                : 'Completa los datos para crear un nuevo gasto unico'}
            </DialogDescription>
          </DialogHeader>
          <GastoUnicoForm
            initialData={editingGasto || undefined}
            onSubmit={handleSubmit}
            onCancel={() => {
              setIsDialogOpen(false)
              setEditingGasto(null)
            }}
            isSubmitting={createMutation.isPending || updateMutation.isPending}
          />
        </DialogContent>
      </Dialog>

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
