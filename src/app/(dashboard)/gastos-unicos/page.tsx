'use client'

import { useState } from 'react'
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

export default function GastosUnicosPage() {
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [editingGasto, setEditingGasto] = useState<GastoUnico | null>(null)

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
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Gastos Únicos</h1>
          <p className="text-muted-foreground">
            Registra gastos que ocurren una sola vez
          </p>
        </div>
        <Button onClick={handleCreate}>
          <Plus className="mr-2 h-4 w-4" />
          Nuevo Gasto
        </Button>
      </div>

      {/* ✨ Cards con totales en ambas monedas */}
      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total ARS</CardTitle>
            <Wallet className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatCurrency(totalARS)}</div>
            <p className="text-xs text-muted-foreground">
              Gastos en pesos argentinos
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total USD</CardTitle>
            <Wallet className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">US$ {totalUSD.toFixed(2)}</div>
            <p className="text-xs text-muted-foreground">Gastos en dólares</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Cantidad</CardTitle>
            <Wallet className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{gastos.length}</div>
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
                    {/* ✨ Componente DualCurrencyDisplay */}
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
