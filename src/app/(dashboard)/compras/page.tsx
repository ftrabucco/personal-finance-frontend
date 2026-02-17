'use client'

import { useState, useEffect, Suspense } from 'react'
import { useSearchParams, useRouter } from 'next/navigation'
import { Plus, Pencil, Trash2, ShoppingCart } from 'lucide-react'
import { format } from 'date-fns'
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
import { CompraForm } from '@/components/forms/CompraForm'
import { DualCurrencyDisplay } from '@/components/common/DualCurrencyDisplay'
import {
  useCompras,
  useCreateCompra,
  useUpdateCompra,
  useDeleteCompra,
} from '@/lib/hooks/useCompras'
import { formatCurrency, formatCurrencyCompact } from '@/lib/utils/formatters'
import { cleanFormData } from '@/lib/utils/cleanFormData'
import type { Compra } from '@/types'

function ComprasContent() {
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [editingCompra, setEditingCompra] = useState<Compra | null>(null)
  const searchParams = useSearchParams()
  const router = useRouter()

  // Open dialog if ?new=true is in URL
  useEffect(() => {
    if (searchParams.get('new') === 'true') {
      setEditingCompra(null)
      setIsDialogOpen(true)
      router.replace('/compras', { scroll: false })
    }
  }, [searchParams, router])

  const { data: response, isLoading } = useCompras()
  const createMutation = useCreateCompra()
  const updateMutation = useUpdateCompra()
  const deleteMutation = useDeleteCompra()

  const compras = response?.data || []

  const handleCreate = () => {
    setEditingCompra(null)
    setIsDialogOpen(true)
  }

  const handleEdit = (compra: Compra) => {
    setEditingCompra(compra)
    setIsDialogOpen(true)
  }

  const handleDelete = async (id: number) => {
    if (window.confirm('¿Estás seguro de eliminar esta compra?')) {
      try {
        await deleteMutation.mutateAsync(id)
      } catch (error) {
        console.error('Error al eliminar compra:', error)
      }
    }
  }

  const handleSubmit = async (data: Partial<Compra>) => {
    try {
      // Filtrar campos calculados por el backend (Joi.forbidden)
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
      console.error('Error al guardar compra:', error)
    }
  }

  const totalARS = compras.reduce((sum, compra) => sum + (Number(compra.monto_total_ars) || 0), 0)
  const totalUSD = compras.reduce((sum, compra) => sum + (Number(compra.monto_total_usd) || 0), 0)
  const comprasPendientes = compras.filter((c) => c.pendiente_cuotas).length

  return (
    <div className="space-y-4 md:space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight md:text-3xl">Compras</h1>
          <p className="text-sm text-muted-foreground md:text-base">
            Gestiona tus compras en cuotas
          </p>
        </div>
        <Button onClick={handleCreate} className="w-full sm:w-auto">
          <Plus className="mr-2 h-4 w-4" />
          Nueva Compra
        </Button>
      </div>

      <div className="grid grid-cols-2 gap-3 md:grid-cols-3 md:gap-4">
        <Card className="overflow-hidden">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total ARS</CardTitle>
            <ShoppingCart className="h-4 w-4 text-muted-foreground shrink-0" />
          </CardHeader>
          <CardContent>
            <div className="text-lg sm:text-xl md:text-2xl font-bold" title={formatCurrency(totalARS)}>{formatCurrencyCompact(totalARS)}</div>
            <p className="text-xs text-muted-foreground">Compras en pesos</p>
          </CardContent>
        </Card>

        <Card className="overflow-hidden">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total USD</CardTitle>
            <ShoppingCart className="h-4 w-4 text-muted-foreground shrink-0" />
          </CardHeader>
          <CardContent>
            <div className="text-lg sm:text-xl md:text-2xl font-bold" title={`US$ ${totalUSD.toFixed(2)}`}>{formatCurrencyCompact(totalUSD, 'USD')}</div>
            <p className="text-xs text-muted-foreground">Compras en dólares</p>
          </CardContent>
        </Card>

        <Card className="overflow-hidden">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Compras Pendientes
            </CardTitle>
            <ShoppingCart className="h-4 w-4 text-yellow-500 shrink-0" />
          </CardHeader>
          <CardContent>
            <div className="text-lg sm:text-xl md:text-2xl font-bold">{comprasPendientes}</div>
            <p className="text-xs text-muted-foreground">
              Con cuotas por pagar
            </p>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <ShoppingCart className="h-5 w-5" />
            Listado de Compras
          </CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="text-center py-8">Cargando compras...</div>
          ) : compras.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              No hay compras registradas. Crea tu primera compra.
            </div>
          ) : (
            <>
              {/* Mobile: Cards */}
              <div className="space-y-3 md:hidden">
                {compras.map((compra) => (
                  <div key={compra.id} className="rounded-lg border p-3">
                    <div className="flex items-center justify-between gap-2 mb-2">
                      <div className="flex items-center gap-2">
                        {compra.pendiente_cuotas ? (
                          <Badge variant="warning" className="text-xs">Pendiente</Badge>
                        ) : (
                          <Badge variant="success" className="text-xs">Finalizada</Badge>
                        )}
                        <span className="text-xs text-muted-foreground">
                          {format(new Date(compra.fecha_compra), 'dd/MM/yyyy')}
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
                      <div className="flex items-center gap-2 text-xs text-muted-foreground">
                        <span>{compra.cantidad_cuotas} cuotas</span>
                        {compra.tarjeta?.nombre && (
                          <>
                            <span>•</span>
                            <span className="truncate">{compra.tarjeta.nombre}</span>
                          </>
                        )}
                      </div>
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
                        onClick={() => handleDelete(compra.id)}
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
                      <TableHead>Fecha</TableHead>
                      <TableHead>Descripción</TableHead>
                      <TableHead>Categoría</TableHead>
                      <TableHead>Monto Total</TableHead>
                      <TableHead>Cuotas</TableHead>
                      <TableHead>Tarjeta</TableHead>
                      <TableHead>Estado</TableHead>
                      <TableHead className="text-right">Acciones</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {compras.map((compra) => {
                      return (
                        <TableRow key={compra.id}>
                          <TableCell>
                            {format(new Date(compra.fecha_compra), 'dd/MM/yyyy')}
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
                            <div className="flex flex-col">
                              <span className="font-medium">
                                {compra.cantidad_cuotas} cuotas
                              </span>
                            </div>
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
                                onClick={() => handleDelete(compra.id)}
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
              {editingCompra ? 'Editar Compra' : 'Nueva Compra'}
            </DialogTitle>
            <DialogDescription>
              {editingCompra
                ? 'Modifica los datos de la compra en cuotas'
                : 'Completa el formulario para registrar una nueva compra en cuotas'}
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
    </div>
  )
}

export default function ComprasPage() {
  return (
    <Suspense fallback={<div className="text-center py-8">Cargando...</div>}>
      <ComprasContent />
    </Suspense>
  )
}
