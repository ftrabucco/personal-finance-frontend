'use client'

import { useState, useEffect, Suspense } from 'react'
import { useSearchParams, useRouter } from 'next/navigation'
import { Plus, Pencil, Trash2, Wallet } from 'lucide-react'
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
import { GastoUnicoForm } from '@/components/forms/GastoUnicoForm'
import { DualCurrencyDisplay } from '@/components/common/DualCurrencyDisplay' // ✨ Import
import {
  useGastosUnicos,
  useCreateGastoUnico,
  useUpdateGastoUnico,
  useDeleteGastoUnico,
} from '@/lib/hooks/useGastosUnicos'
import { formatCurrency } from '@/lib/utils/formatters'
import { cleanFormData } from '@/lib/utils/cleanFormData'
import type { GastoUnico } from '@/types'

function GastosUnicosContent() {
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [editingGasto, setEditingGasto] = useState<GastoUnico | null>(null)
  const searchParams = useSearchParams()
  const router = useRouter()

  // Open dialog if ?new=true is in URL
  useEffect(() => {
    if (searchParams.get('new') === 'true') {
      setEditingGasto(null)
      setIsDialogOpen(true)
      // Remove the query param from URL
      router.replace('/gastos-unicos', { scroll: false })
    }
  }, [searchParams, router])

  const { data: response, isLoading } = useGastosUnicos()
  const createMutation = useCreateGastoUnico()
  const updateMutation = useUpdateGastoUnico()
  const deleteMutation = useDeleteGastoUnico()

  const gastos = response?.data || []

  const handleCreate = () => {
    setEditingGasto(null)
    setIsDialogOpen(true)
  }

  const handleEdit = (gasto: GastoUnico) => {
    setEditingGasto(gasto)
    setIsDialogOpen(true)
  }

  const handleDelete = async (id: number) => {
    if (window.confirm('¿Estás seguro de eliminar este gasto?')) {
      try {
        await deleteMutation.mutateAsync(id)
      } catch (error) {
        console.error('Error al eliminar gasto:', error)
      }
    }
  }

  const handleSubmit = async (data: Partial<GastoUnico>) => {
    try {
      // Filtrar campos calculados por el backend (Joi.forbidden)
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
      console.error('Error al guardar gasto:', error)
    }
  }

  // ✨ Totales en ambas monedas
  const totalARS = gastos.reduce((sum, gasto) => sum + (Number(gasto.monto_ars) || 0), 0)
  const totalUSD = gastos.reduce((sum, gasto) => sum + (Number(gasto.monto_usd) || 0), 0)

  return (
    <div className="space-y-4 md:space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight md:text-3xl">Gastos Únicos</h1>
          <p className="text-sm text-muted-foreground md:text-base">
            Registra gastos que ocurren una sola vez
          </p>
        </div>
        <Button onClick={handleCreate} className="w-full sm:w-auto">
          <Plus className="mr-2 h-4 w-4" />
          Nuevo Gasto
        </Button>
      </div>

      {/* Cards con totales en ambas monedas */}
      <div className="grid grid-cols-2 gap-3 md:grid-cols-3 md:gap-4">
        <Card className="overflow-hidden">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total ARS</CardTitle>
            <Wallet className="h-4 w-4 text-muted-foreground shrink-0" />
          </CardHeader>
          <CardContent>
            <div className="text-lg sm:text-xl md:text-2xl font-bold truncate" title={formatCurrency(totalARS)}>{formatCurrency(totalARS)}</div>
            <p className="text-xs text-muted-foreground">
              Gastos en pesos argentinos
            </p>
          </CardContent>
        </Card>

        <Card className="overflow-hidden">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total USD</CardTitle>
            <Wallet className="h-4 w-4 text-muted-foreground shrink-0" />
          </CardHeader>
          <CardContent>
            <div className="text-lg sm:text-xl md:text-2xl font-bold truncate" title={`US$ ${totalUSD.toFixed(2)}`}>US$ {totalUSD.toFixed(2)}</div>
            <p className="text-xs text-muted-foreground">Gastos en dólares</p>
          </CardContent>
        </Card>

        <Card className="overflow-hidden">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Cantidad</CardTitle>
            <Wallet className="h-4 w-4 text-muted-foreground shrink-0" />
          </CardHeader>
          <CardContent>
            <div className="text-lg sm:text-xl md:text-2xl font-bold">{gastos.length}</div>
            <p className="text-xs text-muted-foreground">
              {gastos.length === 1 ? 'gasto registrado' : 'gastos registrados'}
            </p>
          </CardContent>
        </Card>
      </div>

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
          ) : gastos.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              No hay gastos registrados. Crea tu primer gasto único.
            </div>
          ) : (
            <>
              {/* Mobile: Cards */}
              <div className="space-y-3 md:hidden">
                {gastos.map((gasto) => (
                  <div key={gasto.id} className="rounded-lg border p-3">
                    <div className="flex items-center justify-between gap-2 mb-2">
                      <Badge variant={gasto.procesado ? 'default' : 'secondary'} className="text-xs shrink-0">
                        {gasto.procesado ? 'Procesado' : 'Pendiente'}
                      </Badge>
                      <span className="text-xs text-muted-foreground">
                        {format(new Date(gasto.fecha), 'dd/MM/yyyy')}
                      </span>
                    </div>
                    <p className="font-medium truncate mb-1">{gasto.descripcion}</p>
                    <div className="flex items-center justify-between gap-2">
                      <p className="text-xs text-muted-foreground truncate">
                        {gasto.categoria?.nombre_categoria || 'Sin categoría'}
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
                        onClick={() => handleDelete(gasto.id)}
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
                      <TableHead>Monto</TableHead>
                      <TableHead>Tipo de Pago</TableHead>
                      <TableHead>Estado</TableHead>
                      <TableHead className="text-right">Acciones</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {gastos.map((gasto) => (
                      <TableRow key={gasto.id}>
                        <TableCell>
                          {format(new Date(gasto.fecha), 'dd/MM/yyyy')}
                        </TableCell>
                        <TableCell className="max-w-[200px] truncate">
                          {gasto.descripcion}
                        </TableCell>
                        <TableCell>
                          {gasto.categoria?.nombre_categoria || 'Sin categoría'}
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
                              onClick={() => handleDelete(gasto.id)}
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
              {editingGasto ? 'Editar Gasto Único' : 'Nuevo Gasto Único'}
            </DialogTitle>
            <DialogDescription>
              {editingGasto
                ? 'Modifica los datos del gasto único'
                : 'Completa los datos para crear un nuevo gasto único'}
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
    </div>
  )
}

export default function GastosUnicosPage() {
  return (
    <Suspense fallback={<div className="text-center py-8">Cargando...</div>}>
      <GastosUnicosContent />
    </Suspense>
  )
}
