'use client'

import { useState, useEffect, useMemo } from 'react'
import { useSearchParams, useRouter } from 'next/navigation'
import { Pencil, Trash2, Repeat, Power, PowerOff, ArrowUpDown, ArrowUp, ArrowDown, Search, X } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
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
import { IngresoRecurrenteForm } from '@/components/forms/IngresoRecurrenteForm'
import { DualCurrencyDisplay } from '@/components/common/DualCurrencyDisplay'
import {
  useIngresosRecurrentes,
  useCreateIngresoRecurrente,
  useUpdateIngresoRecurrente,
  useDeleteIngresoRecurrente,
  useToggleIngresoRecurrente,
} from '@/lib/hooks/useIngresosRecurrentes'
import { formatCurrency, formatCurrencyCompact } from '@/lib/utils/formatters'
import { showErrorToast } from '@/lib/utils/errorHandler'
import { ConfirmDialog } from '@/components/ui/confirm-dialog'
import { useConfirmDialog } from '@/lib/hooks/useConfirmDialog'
import type { IngresoRecurrente } from '@/types'

type SortField = 'descripcion' | 'monto_ars' | 'dia_de_pago' | 'fuente'
type SortDirection = 'asc' | 'desc'

export function IngresosRecurrentesTab() {
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [editingIngreso, setEditingIngreso] = useState<IngresoRecurrente | null>(null)
  const [searchQuery, setSearchQuery] = useState('')
  const [sortField, setSortField] = useState<SortField>('descripcion')
  const [sortDirection, setSortDirection] = useState<SortDirection>('asc')
  const [fuenteFilter, setFuenteFilter] = useState<string>('todas')
  const [estadoFilter, setEstadoFilter] = useState<string>('activos')
  const searchParams = useSearchParams()
  const router = useRouter()

  // Open dialog if ?new=true is in URL
  useEffect(() => {
    if (searchParams.get('new') === 'true') {
      setEditingIngreso(null)
      setIsDialogOpen(true)
      router.replace('/ingresos?tab=recurrentes', { scroll: false })
    }
  }, [searchParams, router])

  const { data: response, isLoading } = useIngresosRecurrentes()
  const createMutation = useCreateIngresoRecurrente()
  const updateMutation = useUpdateIngresoRecurrente()
  const deleteMutation = useDeleteIngresoRecurrente()
  const toggleMutation = useToggleIngresoRecurrente()
  const confirmDialog = useConfirmDialog()

  const ingresos = response?.data || []

  // Extract unique fuentes from data
  const fuentesUnicas = useMemo(() => {
    const map = new Map<number, string>()
    ingresos.forEach(i => {
      if (i.fuenteIngreso?.id && i.fuenteIngreso?.nombre) {
        map.set(i.fuenteIngreso.id, i.fuenteIngreso.nombre)
      }
    })
    return Array.from(map.entries()).map(([id, nombre]) => ({ id, nombre })).sort((a, b) => a.nombre.localeCompare(b.nombre))
  }, [ingresos])

  const hasActiveFilters = fuenteFilter !== 'todas' || estadoFilter !== 'activos'
  const activeFilterCount = [fuenteFilter !== 'todas', estadoFilter !== 'activos'].filter(Boolean).length

  const filteredIngresos = useMemo(() => {
    let filtered = ingresos
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase()
      filtered = filtered.filter(
        (i) =>
          i.descripcion.toLowerCase().includes(q) ||
          (i.fuenteIngreso?.nombre || '').toLowerCase().includes(q) ||
          (i.frecuencia?.nombre_frecuencia || '').toLowerCase().includes(q)
      )
    }
    if (estadoFilter === 'activos') filtered = filtered.filter(i => i.activo)
    if (estadoFilter === 'inactivos') filtered = filtered.filter(i => !i.activo)
    if (fuenteFilter !== 'todas') filtered = filtered.filter(i => i.fuente_ingreso_id === Number(fuenteFilter))
    return filtered
  }, [ingresos, searchQuery, estadoFilter, fuenteFilter])

  const sortedIngresos = useMemo(() => {
    return [...filteredIngresos].sort((a, b) => {
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
        case 'fuente':
          comparison = (a.fuenteIngreso?.nombre || '').localeCompare(b.fuenteIngreso?.nombre || '')
          break
      }
      return sortDirection === 'asc' ? comparison : -comparison
    })
  }, [filteredIngresos, sortField, sortDirection])

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

  const handleEdit = (ingreso: IngresoRecurrente) => {
    setEditingIngreso(ingreso)
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

  const handleSubmit = async (data: Partial<IngresoRecurrente>) => {
    try {
      if (editingIngreso) {
        await updateMutation.mutateAsync({
          id: editingIngreso.id,
          data,
        })
      } else {
        await createMutation.mutateAsync(data)
      }
      setIsDialogOpen(false)
      setEditingIngreso(null)
    } catch (error) {
      showErrorToast(error)
    }
  }

  const handleClearFilters = () => {
    setFuenteFilter('todas')
    setEstadoFilter('activos')
  }

  const ingresosActivos = filteredIngresos.filter((i) => i.activo)

  const totalARS = ingresosActivos.reduce(
    (sum, ingreso) => sum + (Number(ingreso.monto_ars) || 0),
    0
  )
  const totalUSD = ingresosActivos.reduce(
    (sum, ingreso) => sum + (Number(ingreso.monto_usd) || 0),
    0
  )

  return (
    <div className="space-y-4 md:space-y-6">
      <div className="grid grid-cols-2 gap-3 md:grid-cols-3 md:gap-4">
        <Card className="overflow-hidden">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Total Mensual Estimado
            </CardTitle>
            <Repeat className="h-4 w-4 text-green-500 shrink-0" />
          </CardHeader>
          <CardContent>
            <div className="space-y-1">
              <div className="text-lg sm:text-xl md:text-2xl font-bold text-green-600" title={formatCurrency(totalARS)}>
                {formatCurrencyCompact(totalARS)}
              </div>
              <div className="text-sm text-muted-foreground" title={`US$ ${Number(totalUSD).toFixed(2)}`}>
                {formatCurrencyCompact(totalUSD, 'USD')}
              </div>
            </div>
            <p className="text-xs text-muted-foreground mt-2">
              {ingresosActivos.length} ingresos activos
            </p>
          </CardContent>
        </Card>

        <Card className="overflow-hidden">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Ingresos Activos
            </CardTitle>
            <Power className="h-4 w-4 text-green-500 shrink-0" />
          </CardHeader>
          <CardContent>
            <div className="text-lg sm:text-xl md:text-2xl font-bold">{ingresosActivos.length}</div>
            <p className="text-xs text-muted-foreground">Generando ingresos</p>
          </CardContent>
        </Card>

        <Card className="overflow-hidden">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Ingresos Inactivos
            </CardTitle>
            <PowerOff className="h-4 w-4 text-muted-foreground shrink-0" />
          </CardHeader>
          <CardContent>
            <div className="text-lg sm:text-xl md:text-2xl font-bold">
              {ingresos.length - ingresosActivos.length}
            </div>
            <p className="text-xs text-muted-foreground">Pausados</p>
          </CardContent>
        </Card>
      </div>

      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          placeholder="Buscar por descripción, fuente o frecuencia..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="pl-9"
        />
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
            <Select value={fuenteFilter} onValueChange={setFuenteFilter}>
              <SelectTrigger className="w-full sm:w-[180px] h-9">
                <SelectValue placeholder="Fuente" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="todas">Todas las fuentes</SelectItem>
                {fuentesUnicas.map(f => (
                  <SelectItem key={f.id} value={String(f.id)}>{f.nombre}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          {hasActiveFilters && (
            <div className="flex items-center justify-between pt-2 border-t">
              <span className="text-sm text-muted-foreground">
                {filteredIngresos.length} resultados
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
            Listado de Ingresos Recurrentes
            {searchQuery && (
              <span className="text-sm font-normal text-muted-foreground">
                ({filteredIngresos.length} resultado{filteredIngresos.length !== 1 ? 's' : ''})
              </span>
            )}
          </CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="text-center py-8">Cargando ingresos recurrentes...</div>
          ) : ingresos.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              No hay ingresos recurrentes registrados.
            </div>
          ) : (
            <>
              {/* Mobile: Cards */}
              <div className="space-y-3 md:hidden">
                {sortedIngresos.map((ingreso) => (
                  <div key={ingreso.id} className="rounded-lg border p-3">
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1 flex-wrap">
                          <Badge variant={ingreso.activo ? 'success' : 'secondary'} className="text-xs">
                            {ingreso.activo ? 'Activo' : 'Inactivo'}
                          </Badge>
                          <span className="text-xs text-muted-foreground">
                            Día {ingreso.dia_de_pago}
                          </span>
                        </div>
                        <p className="font-medium truncate">{ingreso.descripcion}</p>
                        <div className="flex items-center gap-2 text-xs text-muted-foreground">
                          <span>{ingreso.frecuencia?.nombre_frecuencia || '-'}</span>
                          {ingreso.fuenteIngreso?.nombre && (
                            <>
                              <span>•</span>
                              <span>{ingreso.fuenteIngreso.nombre}</span>
                            </>
                          )}
                        </div>
                      </div>
                      <div className="text-right shrink-0">
                        <DualCurrencyDisplay
                          montoArs={ingreso.monto_ars || 0}
                          montoUsd={ingreso.monto_usd || 0}
                          monedaOrigen={ingreso.moneda_origen || 'ARS'}
                          tipoCambio={ingreso.tipo_cambio_referencia}
                        />
                      </div>
                    </div>
                    <div className="flex justify-between items-center mt-2 pt-2 border-t">
                      <div className="flex gap-1">
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-8"
                          onClick={() => handleToggle(ingreso.id)}
                        >
                          {ingreso.activo ? (
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
                      </div>
                      <div className="flex gap-2">
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-8"
                          onClick={() => handleEdit(ingreso)}
                        >
                          <Pencil className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-8 text-destructive hover:text-destructive"
                          onClick={() => handleDeleteClick(ingreso.id)}
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
                      <SortableHeader field="descripcion">Descripción</SortableHeader>
                      <SortableHeader field="monto_ars">Monto</SortableHeader>
                      <SortableHeader field="dia_de_pago">Día de Cobro</SortableHeader>
                      <TableHead>Frecuencia</TableHead>
                      <SortableHeader field="fuente">Fuente</SortableHeader>
                      <TableHead>Estado</TableHead>
                      <TableHead className="text-right">Acciones</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {sortedIngresos.map((ingreso) => (
                      <TableRow key={ingreso.id}>
                        <TableCell className="max-w-xs truncate font-medium">
                          {ingreso.descripcion}
                        </TableCell>
                        <TableCell>
                          <DualCurrencyDisplay
                            montoArs={ingreso.monto_ars || 0}
                            montoUsd={ingreso.monto_usd || 0}
                            monedaOrigen={ingreso.moneda_origen || 'ARS'}
                            tipoCambio={ingreso.tipo_cambio_referencia}
                          />
                        </TableCell>
                        <TableCell>
                          Día {ingreso.dia_de_pago}
                          {ingreso.mes_de_pago && ` (mes ${ingreso.mes_de_pago})`}
                        </TableCell>
                        <TableCell>{ingreso.frecuencia?.nombre_frecuencia || '-'}</TableCell>
                        <TableCell>
                          {ingreso.fuenteIngreso?.nombre || '-'}
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <Badge variant={ingreso.activo ? 'success' : 'secondary'}>
                              {ingreso.activo ? 'Activo' : 'Inactivo'}
                            </Badge>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleToggle(ingreso.id)}
                              title={
                                ingreso.activo ? 'Desactivar' : 'Activar'
                              }
                            >
                              {ingreso.activo ? (
                                <PowerOff className="h-4 w-4 text-yellow-500" />
                              ) : (
                                <Power className="h-4 w-4 text-green-500" />
                              )}
                            </Button>
                          </div>
                        </TableCell>
                        <TableCell className="text-right">
                          <div className="flex justify-end gap-2">
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleEdit(ingreso)}
                            >
                              <Pencil className="h-4 w-4" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleDeleteClick(ingreso.id)}
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
              {editingIngreso ? 'Editar Ingreso Recurrente' : 'Nuevo Ingreso Recurrente'}
            </DialogTitle>
            <DialogDescription>
              {editingIngreso
                ? 'Modifica los datos del ingreso recurrente'
                : 'Completa el formulario para registrar un nuevo ingreso recurrente'}
            </DialogDescription>
          </DialogHeader>
          <IngresoRecurrenteForm
            initialData={editingIngreso || undefined}
            onSubmit={handleSubmit}
            onCancel={() => {
              setIsDialogOpen(false)
              setEditingIngreso(null)
            }}
            isSubmitting={createMutation.isPending || updateMutation.isPending}
          />
        </DialogContent>
      </Dialog>

      <ConfirmDialog
        open={confirmDialog.isOpen}
        onOpenChange={confirmDialog.setIsOpen}
        title="Eliminar ingreso recurrente"
        description="¿Estás seguro de eliminar este ingreso recurrente? Esta acción no se puede deshacer."
        confirmLabel="Eliminar"
        onConfirm={handleDeleteConfirm}
        isLoading={deleteMutation.isPending}
      />
    </div>
  )
}
