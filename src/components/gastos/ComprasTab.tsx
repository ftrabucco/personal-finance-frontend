'use client'

import { useState, useEffect, useMemo } from 'react'
import { useSearchParams, useRouter } from 'next/navigation'
import { Plus, Pencil, Trash2, ShoppingCart, ArrowUpDown, ArrowUp, ArrowDown, CalendarClock, Clock } from 'lucide-react'
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
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { CompraForm } from '@/components/forms/CompraForm'
import { DualCurrencyDisplay } from '@/components/common/DualCurrencyDisplay'
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

type SortField = 'fecha_compra' | 'descripcion' | 'monto_total_ars' | 'cantidad_cuotas' | 'tarjeta'
type SortDirection = 'asc' | 'desc'

export function ComprasTab() {
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [editingCompra, setEditingCompra] = useState<Compra | null>(null)
  const [sortField, setSortField] = useState<SortField>('fecha_compra')
  const [sortDirection, setSortDirection] = useState<SortDirection>('desc')
  const [statusFilter, setStatusFilter] = useState<'todas' | 'pendientes' | 'finalizadas'>('todas')
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

  const filteredCompras = useMemo(() => {
    let filtered = compras
    if (statusFilter === 'pendientes') filtered = compras.filter(c => c.pendiente_cuotas)
    if (statusFilter === 'finalizadas') filtered = compras.filter(c => !c.pendiente_cuotas)

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
      }
      return sortDirection === 'asc' ? comparison : -comparison
    })
  }, [compras, sortField, sortDirection, statusFilter])

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

  const pendientes = compras.filter((c) => c.pendiente_cuotas)
  const comprasPendientesCount = pendientes.length
  const comprasFinalizadasCount = compras.length - comprasPendientesCount

  const cuotaMensualARS = pendientes.reduce((sum, c) =>
    sum + (Number(c.monto_total_ars) || 0) / (c.cantidad_cuotas || 1), 0)
  const cuotaMensualUSD = pendientes.reduce((sum, c) =>
    sum + (Number(c.monto_total_usd) || 0) / (c.cantidad_cuotas || 1), 0)

  const totalPendienteARS = pendientes.reduce((sum, c) => {
    const cuotaARS = (Number(c.monto_total_ars) || 0) / (c.cantidad_cuotas || 1)
    const restantes = c.cantidad_cuotas - (c.cuotas_pagadas || 0)
    return sum + cuotaARS * restantes
  }, 0)
  const totalPendienteUSD = pendientes.reduce((sum, c) => {
    const cuotaUSD = (Number(c.monto_total_usd) || 0) / (c.cantidad_cuotas || 1)
    const restantes = c.cantidad_cuotas - (c.cuotas_pagadas || 0)
    return sum + cuotaUSD * restantes
  }, 0)

  return (
    <div className="space-y-4 md:space-y-6">
      <div className="flex justify-end">
        <Button onClick={handleCreate} className="w-full sm:w-auto">
          <Plus className="mr-2 h-4 w-4" />
          Nueva Cuota
        </Button>
      </div>

      <div className="grid grid-cols-2 gap-3 md:grid-cols-4 md:gap-4">
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

        <Card className="overflow-hidden">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Pendientes</CardTitle>
            <ShoppingCart className="h-4 w-4 text-yellow-500 shrink-0" />
          </CardHeader>
          <CardContent>
            <div className="text-lg sm:text-xl md:text-2xl font-bold">{comprasPendientesCount}</div>
            <p className="text-xs text-muted-foreground">
              Con cuotas por pagar
            </p>
          </CardContent>
        </Card>

        <Card className="overflow-hidden">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Finalizadas</CardTitle>
            <ShoppingCart className="h-4 w-4 text-green-500 shrink-0" />
          </CardHeader>
          <CardContent>
            <div className="text-lg sm:text-xl md:text-2xl font-bold">{comprasFinalizadasCount}</div>
            <p className="text-xs text-muted-foreground">
              Completamente pagadas
            </p>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <CardTitle className="flex items-center gap-2">
              <ShoppingCart className="h-5 w-5" />
              Compras en Cuotas
            </CardTitle>
            <Tabs value={statusFilter} onValueChange={(v) => setStatusFilter(v as typeof statusFilter)}>
              <TabsList>
                <TabsTrigger value="todas">
                  Todas <Badge variant="secondary" className="ml-1.5">{compras.length}</Badge>
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
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="text-center py-8">Cargando compras...</div>
          ) : filteredCompras.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              No hay compras en cuotas registradas.
            </div>
          ) : (
            <>
              {/* Mobile: Cards */}
              <div className="space-y-3 md:hidden">
                {filteredCompras.map((compra) => (
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
                      {compra.cantidad_cuotas > 1 ? (
                        <div className="flex items-center gap-2 mt-1">
                          <Progress
                            value={(compra.cuotas_pagadas / compra.cantidad_cuotas) * 100}
                            className={`h-1.5 flex-1 ${!compra.pendiente_cuotas ? '[&>div]:bg-green-500' : '[&>div]:bg-yellow-500'}`}
                          />
                          <span className="text-xs text-muted-foreground whitespace-nowrap">
                            {compra.cuotas_pagadas}/{compra.cantidad_cuotas}
                          </span>
                        </div>
                      ) : (
                        <span className="text-xs text-muted-foreground">1 cuota</span>
                      )}
                      {compra.tarjeta?.nombre && (
                        <span className="text-xs text-muted-foreground truncate">{compra.tarjeta.nombre}</span>
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
                ))}
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
                      <SortableHeader field="cantidad_cuotas">Cuotas</SortableHeader>
                      <SortableHeader field="tarjeta">Tarjeta</SortableHeader>
                      <TableHead>Estado</TableHead>
                      <TableHead className="text-right">Acciones</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredCompras.map((compra) => {
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
                              <Badge variant="warning">Pendiente</Badge>
                            ) : (
                              <Badge variant="success">Finalizada</Badge>
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
