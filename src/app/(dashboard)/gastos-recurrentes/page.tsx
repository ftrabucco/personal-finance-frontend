'use client'

import { useState } from 'react'
import { Plus, Pencil, Trash2, Repeat, Power, PowerOff } from 'lucide-react'
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
import { GastoRecurrenteForm } from '@/components/forms/GastoRecurrenteForm'
import { DualCurrencyDisplay } from '@/components/common/DualCurrencyDisplay'
import {
  useGastosRecurrentes,
  useCreateGastoRecurrente,
  useUpdateGastoRecurrente,
  useDeleteGastoRecurrente,
  useToggleGastoRecurrente,
} from '@/lib/hooks/useGastosRecurrentes'
import { formatCurrency } from '@/lib/utils/formatters'
import type { GastoRecurrente } from '@/types'

export default function GastosRecurrentesPage() {
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [editingGasto, setEditingGasto] = useState<GastoRecurrente | null>(null)

  const { data: response, isLoading } = useGastosRecurrentes()
  const createMutation = useCreateGastoRecurrente()
  const updateMutation = useUpdateGastoRecurrente()
  const deleteMutation = useDeleteGastoRecurrente()
  const toggleMutation = useToggleGastoRecurrente()

  const gastos = response?.data || []

  const handleCreate = () => {
    setEditingGasto(null)
    setIsDialogOpen(true)
  }

  const handleEdit = (gasto: GastoRecurrente) => {
    setEditingGasto(gasto)
    setIsDialogOpen(true)
  }

  const handleDelete = async (id: number) => {
    if (window.confirm('¿Estás seguro de eliminar este gasto recurrente?')) {
      try {
        await deleteMutation.mutateAsync(id)
      } catch (error) {
        console.error('Error al eliminar gasto:', error)
      }
    }
  }

  const handleToggle = async (id: number) => {
    try {
      await toggleMutation.mutateAsync(id)
    } catch (error) {
      console.error('Error al cambiar estado:', error)
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
      console.error('Error al guardar gasto:', error)
    }
  }

  const gastosActivos = gastos.filter((g) => g.activo)
  const totalARS = gastosActivos.reduce(
    (sum, gasto) => sum + (Number(gasto.monto_ars) || 0),
    0
  )
  const totalUSD = gastosActivos.reduce(
    (sum, gasto) => sum + (Number(gasto.monto_usd) || 0),
    0
  )

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">
            Gastos Recurrentes
          </h1>
          <p className="text-muted-foreground">
            Gastos que se repiten según una frecuencia
          </p>
        </div>
        <Button onClick={handleCreate}>
          <Plus className="mr-2 h-4 w-4" />
          Nuevo Gasto
        </Button>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Total Mensual Estimado
            </CardTitle>
            <Repeat className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="space-y-1">
              <div className="text-2xl font-bold">
                {formatCurrency(totalARS)}
              </div>
              <div className="text-sm text-muted-foreground">
                US$ {Number(totalUSD).toFixed(2)}
              </div>
            </div>
            <p className="text-xs text-muted-foreground mt-2">
              {gastosActivos.length} gastos activos
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Gastos Activos
            </CardTitle>
            <Power className="h-4 w-4 text-green-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{gastosActivos.length}</div>
            <p className="text-xs text-muted-foreground">Generando gastos</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Gastos Inactivos
            </CardTitle>
            <PowerOff className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {gastos.length - gastosActivos.length}
            </div>
            <p className="text-xs text-muted-foreground">Pausados</p>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Repeat className="h-5 w-5" />
            Listado de Gastos Recurrentes
          </CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="text-center py-8">Cargando gastos...</div>
          ) : gastos.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              No hay gastos recurrentes registrados.
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Descripción</TableHead>
                  <TableHead>Monto</TableHead>
                  <TableHead>Día de Pago</TableHead>
                  <TableHead>Frecuencia</TableHead>
                  <TableHead>Categoría</TableHead>
                  <TableHead>Última Generación</TableHead>
                  <TableHead>Estado</TableHead>
                  <TableHead className="text-right">Acciones</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {gastos.map((gasto) => (
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
                      Día {gasto.dia_de_pago}
                      {gasto.mes_de_pago && ` (mes ${gasto.mes_de_pago})`}
                    </TableCell>
                    <TableCell>{gasto.frecuencia?.nombre || '-'}</TableCell>
                    <TableCell>
                      {gasto.categoria?.nombre_categoria || '-'}
                    </TableCell>
                    <TableCell>
                      {gasto.ultima_fecha_generado
                        ? format(
                            new Date(gasto.ultima_fecha_generado),
                            'dd/MM/yyyy'
                          )
                        : 'Nunca'}
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        {gasto.activo ? (
                          <Badge variant="success">Activo</Badge>
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
    </div>
  )
}
