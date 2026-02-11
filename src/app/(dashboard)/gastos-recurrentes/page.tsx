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
    <div className="space-y-4 md:space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight md:text-3xl">
            Gastos Recurrentes
          </h1>
          <p className="text-sm text-muted-foreground md:text-base">
            Gastos que se repiten según una frecuencia
          </p>
        </div>
        <Button onClick={handleCreate} className="w-full sm:w-auto">
          <Plus className="mr-2 h-4 w-4" />
          Nuevo Gasto
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
              <div className="text-lg sm:text-xl md:text-2xl font-bold truncate" title={formatCurrency(totalARS)}>
                {formatCurrency(totalARS)}
              </div>
              <div className="text-sm text-muted-foreground truncate" title={`US$ ${Number(totalUSD).toFixed(2)}`}>
                US$ {Number(totalUSD).toFixed(2)}
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
            <>
              {/* Mobile: Cards */}
              <div className="space-y-3 md:hidden">
                {gastos.map((gasto) => (
                  <div key={gasto.id} className="rounded-lg border p-3">
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          {gasto.activo ? (
                            <Badge variant="success" className="text-xs">Activo</Badge>
                          ) : (
                            <Badge variant="secondary" className="text-xs">Inactivo</Badge>
                          )}
                          <span className="text-xs text-muted-foreground">
                            Día {gasto.dia_de_pago}
                          </span>
                        </div>
                        <p className="font-medium truncate">{gasto.descripcion}</p>
                        <div className="flex items-center gap-2 text-xs text-muted-foreground">
                          <span>{gasto.frecuencia?.nombre_frecuencia || '-'}</span>
                          {gasto.categoria?.nombre_categoria && (
                            <>
                              <span>•</span>
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
                          onClick={() => handleDelete(gasto.id)}
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
                        <TableCell>{gasto.frecuencia?.nombre_frecuencia || '-'}</TableCell>
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
    </div>
  )
}
