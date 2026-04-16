'use client'

import { useState, useEffect, useMemo } from 'react'
import { useSearchParams, useRouter } from 'next/navigation'
import { Plus, Pencil, Trash2, Repeat, Power, PowerOff, Play, ArrowUpDown, ArrowUp, ArrowDown, X } from 'lucide-react'
import { isSameMonth } from 'date-fns'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { CollapsibleFilters } from '@/components/common/CollapsibleFilters'
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
import { Badge } from '@/components/ui/badge'
import { GastoRecurrenteForm } from '@/components/forms/GastoRecurrenteForm'
import { DualCurrencyDisplay } from '@/components/common/DualCurrencyDisplay'
import {
  useGastosRecurrentes,
  useCreateGastoRecurrente,
  useUpdateGastoRecurrente,
  useDeleteGastoRecurrente,
  useToggleGastoRecurrente,
} from '@/lib/hooks/useGastosRecurrentes'
import { useProcesarGastoRecurrenteIndividual } from '@/lib/hooks/useProcesamiento'
import { formatCurrency, formatCurrencyCompact, formatDate } from '@/lib/utils/formatters'
import { showErrorToast } from '@/lib/utils/errorHandler'
import { ConfirmDialog } from '@/components/ui/confirm-dialog'
import { useConfirmDialog } from '@/lib/hooks/useConfirmDialog'
import type { GastoRecurrente } from '@/types'

type SortField = 'descripcion' | 'monto_ars' | 'dia_de_pago' | 'categoria'
type SortDirection = 'asc' | 'desc'

export function GastosRecurrentesTab() {
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [editingGasto, setEditingGasto] = useState<GastoRecurrente | null>(null)
  const [sortField, setSortField] = useState<SortField>('descripcion')
  const [sortDirection, setSortDirection] = useState<SortDirection>('asc')
  const [categoriaFilter, setCategoriaFilter] = useState<string>('todas')
  const [estadoFilter, setEstadoFilter] = useState<string>('activos')
  const searchParams = useSearchParams()
  const router = useRouter()

  // Open dialog if ?new=true is in URL
  useEffect(() => {
    if (searchParams.get('new') === 'true') {
      setEditingGasto(null)
      setIsDialogOpen(true)
      router.replace('/gastos?tab=recurrentes', { scroll: false })
    }
  }, [searchParams, router])

  const { data: response, isLoading } = useGastosRecurrentes()
  const createMutation = useCreateGastoRecurrente()
  const updateMutation = useUpdateGastoRecurrente()
  const deleteMutation = useDeleteGastoRecurrente()
  const confirmDialog = useConfirmDialog()
  const toggleMutation = useToggleGastoRecurrente()
  const procesarMutation = useProcesarGastoRecurrenteIndividual()

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

  const hasActiveFilters = categoriaFilter !== 'todas' || estadoFilter !== 'activos'
  const activeFilterCount = [categoriaFilter !== 'todas', estadoFilter !== 'activos'].filter(Boolean).length

  const sortedGastos = useMemo(() => {
    let filtered = gastos
    if (estadoFilter === 'activos') filtered = filtered.filter(g => g.activo)
    if (estadoFilter === 'inactivos') filtered = filtered.filter(g => !g.activo)
    if (categoriaFilter !== 'todas') filtered = filtered.filter(g => g.categoria_gasto_id === Number(categoriaFilter))

    return [...filtered].sort((a, b) => {
      let comparison = 0
      switch (sortField) {
        case 'descripcion':
          comparison = a.descripcion.localeCompare(b.descripcion)
          break
        case 'monto_ars':
          comparison = Number(a.monto_ars) - Number(b.monto_ars)
          break
        case 'dia_de_pago':
          comparison = a.dia_de_pago - b.dia_de_pago
          break
        case 'categoria':
          comparison = (a.categoria?.nombre_categoria || '').localeCompare(b.categoria?.nombre_categoria || '')
          break
      }
      return sortDirection === 'asc' ? comparison : -comparison
    })
  }, [gastos, sortField, sortDirection, categoriaFilter, estadoFilter])

  const handleSort = (field: SortField) => {
    if (sortField === field) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc')
    } else {
      setSortField(field)
      setSortDirection('asc')
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

  const handleEdit = (gasto: GastoRecurrente) => {
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

  const handleToggle = async (id: number) => {
    try {
      await toggleMutation.mutateAsync(id)
    } catch (error) {
      showErrorToast(error)
    }
  }

  const handleProcesar = async (id: number) => {
    try {
      await procesarMutation.mutateAsync(id)
    } catch (error) {
      showErrorToast(error)
    }
  }

  const handleSubmit = async (data: Partial<GastoRecurrente>) => {
    try {
      if (editingGasto) {
        await updateMutation.mutateAsync({
          id: editingGasto.id,
          data,
        })
      } else {
        await createMutation.mutateAsync(data)
      }
      setIsDialogOpen(false)
      setEditingGasto(null)
    } catch (error) {
      showErrorToast(error)
    }
  }

  const handleClearFilters = () => {
    setCategoriaFilter('todas')
    setEstadoFilter('activos')
  }

  const gastosActivos = sortedGastos.filter((g) => g.activo)

  const isProcesadoEsteMes = (ultimaFecha: string | null | undefined): boolean => {
    if (!ultimaFecha) return false
    return isSameMonth(new Date(ultimaFecha), new Date())
  }

  function montoMensualEquivalente(gasto: GastoRecurrente, moneda: 'ars' | 'usd'): number {
    const monto = moneda === 'ars' ? Number(gasto.monto_ars) || 0 : Number(gasto.monto_usd) || 0
    const freq = gasto.frecuencia?.nombre_frecuencia?.toLowerCase()
    if (freq === 'trimestral') return monto / 3
    if (freq === 'semestral') return monto / 6
    if (freq === 'anual') return monto / 12
    if (freq === 'bimestral') return monto / 2
    return monto // mensual, quincenal, semanal, diaria — se suman tal cual
  }

  const totalARS = gastosActivos.reduce(
    (sum, gasto) => sum + montoMensualEquivalente(gasto, 'ars'),
    0
  )
  const totalUSD = gastosActivos.reduce(
    (sum, gasto) => sum + montoMensualEquivalente(gasto, 'usd'),
    0
  )

  return (
    <div className="space-y-4 md:space-y-6">
      <div className="flex justify-end">
        <Button onClick={handleCreate} className="w-full sm:w-auto">
          <Plus className="mr-2 h-4 w-4" />
          Nuevo Gasto Recurrente
        </Button>
      </div>

      <div className="grid grid-cols-2 gap-3 md:grid-cols-3 md:gap-4">
        <Card className="overflow-hidden">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Total Mensual Estimado
            </CardTitle>
            <Repeat className="h-4 w-4 text-muted-foreground shrink-0" />
          </CardHeader>
          <CardContent>
            <div className="space-y-1">
              <div className="text-lg sm:text-xl md:text-2xl font-bold" title={formatCurrency(totalARS)}>
                {formatCurrencyCompact(totalARS)}
              </div>
              <div className="text-sm text-muted-foreground" title={`US$ ${Number(totalUSD).toFixed(2)}`}>
                {formatCurrencyCompact(totalUSD, 'USD')}
              </div>
            </div>
            <p className="text-xs text-muted-foreground mt-2">
              {gastosActivos.length} gastos activos
            </p>
          </CardContent>
        </Card>

        <Card className="overflow-hidden">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Gastos Activos
            </CardTitle>
            <Power className="h-4 w-4 text-green-500 shrink-0" />
          </CardHeader>
          <CardContent>
            <div className="text-lg sm:text-xl md:text-2xl font-bold">{gastosActivos.length}</div>
            <p className="text-xs text-muted-foreground">Generando gastos</p>
          </CardContent>
        </Card>

        <Card className="overflow-hidden">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Gastos Inactivos
            </CardTitle>
            <PowerOff className="h-4 w-4 text-muted-foreground shrink-0" />
          </CardHeader>
          <CardContent>
            <div className="text-lg sm:text-xl md:text-2xl font-bold">
              {gastos.length - gastosActivos.length}
            </div>
            <p className="text-xs text-muted-foreground">Pausados</p>
          </CardContent>
        </Card>
      </div>

      <CollapsibleFilters activeFilterCount={activeFilterCount}>
        <div className="space-y-3">
          <div className="flex flex-1 flex-wrap gap-2">
            <Select value={estadoFilter} onValueChange={setEstadoFilter}>
              <SelectTrigger className="w-full sm:w-[160px] h-9">
                <SelectValue placeholder="Estado" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="todos">Todos</SelectItem>
                <SelectItem value="activos">Activos</SelectItem>
                <SelectItem value="inactivos">Inactivos</SelectItem>
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
          </div>
          {hasActiveFilters && (
            <div className="flex items-center justify-between pt-2 border-t">
              <span className="text-sm text-muted-foreground">
                {sortedGastos.length} resultados
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
            <Repeat className="h-5 w-5" />
            Listado de Gastos Recurrentes
          </CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="text-center py-8">Cargando gastos recurrentes...</div>
          ) : gastos.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              No hay gastos recurrentes registrados.
            </div>
          ) : (
            <>
              {/* Mobile: Cards */}
              <div className="space-y-3 md:hidden">
                {sortedGastos.map((gasto) => (
                  <div key={gasto.id} className="rounded-lg border p-3">
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1 flex-wrap">
                          {gasto.activo ? (
                            isProcesadoEsteMes(gasto.ultima_fecha_generado) ? (
                              <Badge variant="success" className="text-xs">Pagado</Badge>
                            ) : (
                              <Badge variant="warning" className="text-xs">Pendiente</Badge>
                            )
                          ) : (
                            <Badge variant="secondary" className="text-xs">Inactivo</Badge>
                          )}
                          <span className="text-xs text-muted-foreground">
                            Dia {gasto.dia_de_pago}
                          </span>
                        </div>
                        <p className="font-medium truncate">{gasto.descripcion}</p>
                        <div className="flex items-center gap-2 text-xs text-muted-foreground">
                          <span>{gasto.frecuencia?.nombre_frecuencia || '-'}</span>
                          {gasto.categoria?.nombre_categoria && (
                            <>
                              <span>-</span>
                              <span>{gasto.categoria.nombre_categoria}</span>
                            </>
                          )}
                        </div>
                      </div>
                      <div className="text-right shrink-0">
                        <DualCurrencyDisplay
                          montoArs={gasto.monto_ars || 0}
                          montoUsd={gasto.monto_usd || 0}
                          monedaOrigen={gasto.moneda_origen || 'ARS'}
                          tipoCambio={gasto.tipo_cambio_referencia}
                        />
                      </div>
                    </div>
                    <div className="flex justify-between items-center mt-2 pt-2 border-t">
                      <div className="flex gap-1">
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-8"
                          onClick={() => handleToggle(gasto.id)}
                        >
                          {gasto.activo ? (
                            <>
                              <PowerOff className="h-4 w-4 mr-1 text-yellow-500" />
                              Pausar
                            </>
                          ) : (
                            <>
                              <Power className="h-4 w-4 mr-1 text-green-500" />
                              Activar
                            </>
                          )}
                        </Button>
                        {gasto.activo && (
                          <Button
                            variant="ghost"
                            size="sm"
                            className="h-8"
                            onClick={() => handleProcesar(gasto.id)}
                            disabled={procesarMutation.isPending}
                          >
                            <Play className="h-4 w-4 mr-1 text-blue-500" />
                            Procesar
                          </Button>
                        )}
                      </div>
                      <div className="flex gap-2">
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-8"
                          onClick={() => handleEdit(gasto)}
                        >
                          <Pencil className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-8 text-destructive hover:text-destructive"
                          onClick={() => handleDeleteClick(gasto.id)}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              {/* Desktop: Table */}
              <div className="hidden md:block">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <SortableHeader field="descripcion">Descripcion</SortableHeader>
                      <SortableHeader field="monto_ars">Monto</SortableHeader>
                      <SortableHeader field="dia_de_pago">Dia de Pago</SortableHeader>
                      <TableHead>Frecuencia</TableHead>
                      <SortableHeader field="categoria">Categoria</SortableHeader>
                      <TableHead>Ultima Generacion</TableHead>
                      <TableHead>Estado</TableHead>
                      <TableHead className="text-right">Acciones</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {sortedGastos.map((gasto) => (
                      <TableRow key={gasto.id}>
                        <TableCell className="max-w-xs truncate font-medium">
                          {gasto.descripcion}
                        </TableCell>
                        <TableCell>
                          <DualCurrencyDisplay
                            montoArs={gasto.monto_ars || 0}
                            montoUsd={gasto.monto_usd || 0}
                            monedaOrigen={gasto.moneda_origen || 'ARS'}
                            tipoCambio={gasto.tipo_cambio_referencia}
                          />
                        </TableCell>
                        <TableCell>
                          Dia {gasto.dia_de_pago}
                          {gasto.mes_de_pago && ` (mes ${gasto.mes_de_pago})`}
                        </TableCell>
                        <TableCell>{gasto.frecuencia?.nombre_frecuencia || '-'}</TableCell>
                        <TableCell>
                          {gasto.categoria?.nombre_categoria || '-'}
                        </TableCell>
                        <TableCell>
                          {gasto.ultima_fecha_generado
                            ? formatDate(gasto.ultima_fecha_generado)
                            : 'Nunca'}
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            {gasto.activo ? (
                              isProcesadoEsteMes(gasto.ultima_fecha_generado) ? (
                                <Badge variant="success">Pagado</Badge>
                              ) : (
                                <Badge variant="warning">Pendiente</Badge>
                              )
                            ) : (
                              <Badge variant="secondary">Inactivo</Badge>
                            )}
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleToggle(gasto.id)}
                              title={
                                gasto.activo ? 'Desactivar' : 'Activar'
                              }
                            >
                              {gasto.activo ? (
                                <PowerOff className="h-4 w-4 text-yellow-500" />
                              ) : (
                                <Power className="h-4 w-4 text-green-500" />
                              )}
                            </Button>
                          </div>
                        </TableCell>
                        <TableCell className="text-right">
                          <div className="flex justify-end gap-2">
                            {gasto.activo && (
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => handleProcesar(gasto.id)}
                                disabled={procesarMutation.isPending}
                                title="Procesar este mes"
                              >
                                <Play className="h-4 w-4 text-blue-500" />
                              </Button>
                            )}
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleEdit(gasto)}
                            >
                              <Pencil className="h-4 w-4" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleDeleteClick(gasto.id)}
                            >
                              <Trash2 className="h-4 w-4 text-destructive" />
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
              {editingGasto ? 'Editar Gasto Recurrente' : 'Nuevo Gasto Recurrente'}
            </DialogTitle>
            <DialogDescription>
              {editingGasto
                ? 'Modifica los datos del gasto recurrente'
                : 'Completa el formulario para registrar un nuevo gasto recurrente'}
            </DialogDescription>
          </DialogHeader>
          <GastoRecurrenteForm
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
        title="Eliminar gasto recurrente"
        description="¿Estás seguro de eliminar este gasto recurrente? Esta acción no se puede deshacer."
        confirmLabel="Eliminar"
        onConfirm={handleDeleteConfirm}
        isLoading={deleteMutation.isPending}
      />
    </div>
  )
}
