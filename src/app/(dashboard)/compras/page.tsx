'use client'

import { useState } from 'react'
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
import {
  useCompras,
  useCreateCompra,
  useUpdateCompra,
  useDeleteCompra,
} from '@/lib/hooks/useCompras'
import { formatCurrency } from '@/lib/utils/formatters'
import type { Compra } from '@/types'

export default function ComprasPage() {
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [editingCompra, setEditingCompra] = useState<Compra | null>(null)

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
      if (editingCompra) {
        await updateMutation.mutateAsync({
          id: editingCompra.id,
          data,
        })
      } else {
        await createMutation.mutateAsync(data)
      }
      setIsDialogOpen(false)
      setEditingCompra(null)
    } catch (error) {
      console.error('Error al guardar compra:', error)
    }
  }

  const totalCompras = compras.reduce((sum, compra) => sum + compra.monto_total, 0)
  const comprasPendientes = compras.filter((c) => c.pendiente_cuotas).length

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Compras</h1>
          <p className="text-muted-foreground">
            Gestiona tus compras en cuotas
          </p>
        </div>
        <Button onClick={handleCreate}>
          <Plus className="mr-2 h-4 w-4" />
          Nueva Compra
        </Button>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Total en Compras
            </CardTitle>
            <ShoppingCart className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {formatCurrency(totalCompras)}
            </div>
            <p className="text-xs text-muted-foreground">
              {compras.length} {compras.length === 1 ? 'compra' : 'compras'}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Compras Pendientes
            </CardTitle>
            <ShoppingCart className="h-4 w-4 text-yellow-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{comprasPendientes}</div>
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
                  const montoPorCuota = compra.monto_total / compra.cantidad_cuotas
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
                      <TableCell className="font-semibold">
                        {formatCurrency(compra.monto_total)}
                      </TableCell>
                      <TableCell>
                        <div className="flex flex-col">
                          <span className="font-medium">
                            {compra.cantidad_cuotas} cuotas
                          </span>
                          <span className="text-xs text-muted-foreground">
                            {formatCurrency(montoPorCuota)}/mes
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
