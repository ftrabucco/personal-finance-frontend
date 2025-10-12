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
import {
  useGastosUnicos,
  useCreateGastoUnico,
  useUpdateGastoUnico,
  useDeleteGastoUnico,
} from '@/lib/hooks/useGastosUnicos'
import { formatCurrency } from '@/lib/utils/formatters'
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
      console.error('Error al guardar gasto:', error)
    }
  }

  const totalGastos = gastos.reduce((sum, gasto) => sum + gasto.monto, 0)

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

      <div className="grid gap-4 md:grid-cols-2">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Total de Gastos
            </CardTitle>
            <Wallet className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {formatCurrency(totalGastos)}
            </div>
            <p className="text-xs text-muted-foreground">
              {gastos.length} {gastos.length === 1 ? 'gasto' : 'gastos'}{' '}
              registrado{gastos.length === 1 ? '' : 's'}
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
                    <TableCell className="max-w-xs truncate">
                      {gasto.descripcion}
                    </TableCell>
                    <TableCell>
                      {gasto.categoria?.nombre_categoria || '-'}
                    </TableCell>
                    <TableCell className="font-semibold">
                      {formatCurrency(gasto.monto)}
                    </TableCell>
                    <TableCell>{gasto.tipoPago?.nombre || '-'}</TableCell>
                    <TableCell>
                      {gasto.procesado ? (
                        <Badge variant="success">Procesado</Badge>
                      ) : (
                        <Badge variant="warning">Pendiente</Badge>
                      )}
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-2">
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
                          onClick={() => handleDelete(gasto.id)}
                        >
                          <Trash2 className="h-4 w-4 text-destructive" />
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
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>
              {editingGasto ? 'Editar Gasto' : 'Nuevo Gasto Único'}
            </DialogTitle>
            <DialogDescription>
              {editingGasto
                ? 'Modifica los datos del gasto único'
                : 'Completa el formulario para registrar un gasto único'}
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
