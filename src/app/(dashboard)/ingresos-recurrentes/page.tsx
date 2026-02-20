'use client'

import { useState, useEffect, Suspense } from 'react'
import { useSearchParams, useRouter } from 'next/navigation'
import { Plus, Pencil, Trash2, Repeat, Power, PowerOff } from 'lucide-react'
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
import type { IngresoRecurrente } from '@/types'

function IngresosRecurrentesContent() {
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [editingIngreso, setEditingIngreso] = useState<IngresoRecurrente | null>(null)
  const searchParams = useSearchParams()
  const router = useRouter()

  // Open dialog if ?new=true is in URL
  useEffect(() => {
    if (searchParams.get('new') === 'true') {
      setEditingIngreso(null)
      setIsDialogOpen(true)
      router.replace('/ingresos-recurrentes', { scroll: false })
    }
  }, [searchParams, router])

  const { data: response, isLoading } = useIngresosRecurrentes()
  const createMutation = useCreateIngresoRecurrente()
  const updateMutation = useUpdateIngresoRecurrente()
  const deleteMutation = useDeleteIngresoRecurrente()
  const toggleMutation = useToggleIngresoRecurrente()

  const ingresos = response?.data || []

  const handleCreate = () => {
    setEditingIngreso(null)
    setIsDialogOpen(true)
  }

  const handleEdit = (ingreso: IngresoRecurrente) => {
    setEditingIngreso(ingreso)
    setIsDialogOpen(true)
  }

  const handleDelete = async (id: number) => {
    if (window.confirm('¿Estás seguro de eliminar este ingreso recurrente?')) {
      try {
        await deleteMutation.mutateAsync(id)
      } catch (error) {
        console.error('Error al eliminar ingreso:', error)
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
      console.error('Error al guardar ingreso:', error)
    }
  }

  const ingresosActivos = ingresos.filter((i) => i.activo)

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
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight md:text-3xl">
            Ingresos Recurrentes
          </h1>
          <p className="text-sm text-muted-foreground md:text-base">
            Ingresos que se repiten periódicamente (sueldo, alquileres, etc.)
          </p>
        </div>
        <Button onClick={handleCreate} className="w-full sm:w-auto">
          <Plus className="mr-2 h-4 w-4" />
          Nuevo Ingreso Recurrente
        </Button>
      </div>

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

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Repeat className="h-5 w-5" />
            Listado de Ingresos Recurrentes
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
                {ingresos.map((ingreso) => (
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
                          onClick={() => handleDelete(ingreso.id)}
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
                      <TableHead>Día de Cobro</TableHead>
                      <TableHead>Frecuencia</TableHead>
                      <TableHead>Fuente</TableHead>
                      <TableHead>Estado</TableHead>
                      <TableHead className="text-right">Acciones</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {ingresos.map((ingreso) => (
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
                              onClick={() => handleDelete(ingreso.id)}
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
    </div>
  )
}

export default function IngresosRecurrentesPage() {
  return (
    <Suspense fallback={<div className="text-center py-8">Cargando...</div>}>
      <IngresosRecurrentesContent />
    </Suspense>
  )
}
