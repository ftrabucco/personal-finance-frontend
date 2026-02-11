'use client'

import { useState } from 'react'
import { Plus, Pencil, Trash2, CreditCard, Power, PowerOff } from 'lucide-react'
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
import { DebitoAutomaticoForm } from '@/components/forms/DebitoAutomaticoForm'
import { DualCurrencyDisplay } from '@/components/common/DualCurrencyDisplay'
import {
  useDebitosAutomaticos,
  useCreateDebitoAutomatico,
  useUpdateDebitoAutomatico,
  useDeleteDebitoAutomatico,
  useToggleDebitoAutomatico,
} from '@/lib/hooks/useDebitosAutomaticos'
import { formatCurrency } from '@/lib/utils/formatters'
import type { DebitoAutomatico } from '@/types'

export default function DebitosAutomaticosPage() {
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [editingDebito, setEditingDebito] = useState<DebitoAutomatico | null>(null)

  const { data: response, isLoading } = useDebitosAutomaticos()
  const createMutation = useCreateDebitoAutomatico()
  const updateMutation = useUpdateDebitoAutomatico()
  const deleteMutation = useDeleteDebitoAutomatico()
  const toggleMutation = useToggleDebitoAutomatico()

  const debitos = response?.data || []

  const handleCreate = () => {
    setEditingDebito(null)
    setIsDialogOpen(true)
  }

  const handleEdit = (debito: DebitoAutomatico) => {
    setEditingDebito(debito)
    setIsDialogOpen(true)
  }

  const handleDelete = async (id: number) => {
    if (window.confirm('¿Estás seguro de eliminar este débito automático?')) {
      try {
        await deleteMutation.mutateAsync(id)
      } catch (error) {
        console.error('Error al eliminar débito:', error)
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

  const handleSubmit = async (data: Partial<DebitoAutomatico>) => {
    try {
      if (editingDebito) {
        await updateMutation.mutateAsync({
          id: editingDebito.id,
          data,
        })
      } else {
        await createMutation.mutateAsync(data)
      }
      setIsDialogOpen(false)
      setEditingDebito(null)
    } catch (error) {
      console.error('Error al guardar débito:', error)
    }
  }

  const debitosActivos = debitos.filter((d) => d.activo)
  const totalARS = debitosActivos.reduce(
    (sum, debito) => sum + (Number(debito.monto_ars) || 0),
    0
  )
  const totalUSD = debitosActivos.reduce(
    (sum, debito) => sum + (Number(debito.monto_usd) || 0),
    0
  )

  return (
    <div className="space-y-4 md:space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight md:text-3xl">
            Débitos Automáticos
          </h1>
          <p className="text-sm text-muted-foreground md:text-base">
            Gestiona tus suscripciones y servicios recurrentes
          </p>
        </div>
        <Button onClick={handleCreate} className="w-full sm:w-auto">
          <Plus className="mr-2 h-4 w-4" />
          Nuevo Débito
        </Button>
      </div>

      <div className="grid grid-cols-2 gap-3 md:grid-cols-3 md:gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Total Mensual
            </CardTitle>
            <CreditCard className="h-4 w-4 text-muted-foreground" />
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
              {debitosActivos.length} débitos activos
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Débitos Activos
            </CardTitle>
            <Power className="h-4 w-4 text-green-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{debitosActivos.length}</div>
            <p className="text-xs text-muted-foreground">En funcionamiento</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Débitos Inactivos
            </CardTitle>
            <PowerOff className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {debitos.length - debitosActivos.length}
            </div>
            <p className="text-xs text-muted-foreground">Pausados</p>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <CreditCard className="h-5 w-5" />
            Listado de Débitos Automáticos
          </CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="text-center py-8">Cargando débitos...</div>
          ) : debitos.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              No hay débitos automáticos registrados. Crea tu primer débito.
            </div>
          ) : (
            <>
              {/* Mobile: Cards */}
              <div className="space-y-3 md:hidden">
                {debitos.map((debito) => (
                  <div key={debito.id} className="rounded-lg border p-3">
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          {debito.activo ? (
                            <Badge variant="success" className="text-xs">Activo</Badge>
                          ) : (
                            <Badge variant="secondary" className="text-xs">Inactivo</Badge>
                          )}
                          <span className="text-xs text-muted-foreground">
                            Día {debito.dia_de_pago}
                          </span>
                        </div>
                        <p className="font-medium truncate">{debito.descripcion}</p>
                        <div className="flex items-center gap-2 text-xs text-muted-foreground">
                          <span>{debito.frecuencia?.nombre_frecuencia || '-'}</span>
                          {debito.categoria?.nombre_categoria && (
                            <>
                              <span>•</span>
                              <span>{debito.categoria.nombre_categoria}</span>
                            </>
                          )}
                        </div>
                      </div>
                      <div className="text-right shrink-0">
                        <DualCurrencyDisplay
                          montoArs={debito.monto_ars || 0}
                          montoUsd={debito.monto_usd || 0}
                          monedaOrigen={debito.moneda_origen || 'ARS'}
                          tipoCambio={debito.tipo_cambio_referencia}
                        />
                      </div>
                    </div>
                    <div className="flex justify-between items-center mt-2 pt-2 border-t">
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-8"
                        onClick={() => handleToggle(debito.id)}
                      >
                        {debito.activo ? (
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
                          onClick={() => handleEdit(debito)}
                        >
                          <Pencil className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-8 text-destructive hover:text-destructive"
                          onClick={() => handleDelete(debito.id)}
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
                      <TableHead>Día de Débito</TableHead>
                      <TableHead>Frecuencia</TableHead>
                      <TableHead>Categoría</TableHead>
                      <TableHead>Última Generación</TableHead>
                      <TableHead>Estado</TableHead>
                      <TableHead className="text-right">Acciones</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {debitos.map((debito) => (
                      <TableRow key={debito.id}>
                        <TableCell className="max-w-xs truncate font-medium">
                          {debito.descripcion}
                        </TableCell>
                        <TableCell>
                          <DualCurrencyDisplay
                            montoArs={debito.monto_ars || 0}
                            montoUsd={debito.monto_usd || 0}
                            monedaOrigen={debito.moneda_origen || 'ARS'}
                            tipoCambio={debito.tipo_cambio_referencia}
                          />
                        </TableCell>
                        <TableCell>Día {debito.dia_de_pago}</TableCell>
                        <TableCell>{debito.frecuencia?.nombre_frecuencia || '-'}</TableCell>
                        <TableCell>
                          {debito.categoria?.nombre_categoria || '-'}
                        </TableCell>
                        <TableCell>
                          {debito.ultima_fecha_generado
                            ? format(
                                new Date(debito.ultima_fecha_generado),
                                'dd/MM/yyyy'
                              )
                            : 'Nunca'}
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            {debito.activo ? (
                              <Badge variant="success">Activo</Badge>
                            ) : (
                              <Badge variant="secondary">Inactivo</Badge>
                            )}
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleToggle(debito.id)}
                              title={debito.activo ? 'Desactivar' : 'Activar'}
                            >
                              {debito.activo ? (
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
                              onClick={() => handleEdit(debito)}
                            >
                              <Pencil className="h-4 w-4" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleDelete(debito.id)}
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
              {editingDebito ? 'Editar Débito Automático' : 'Nuevo Débito Automático'}
            </DialogTitle>
            <DialogDescription>
              {editingDebito
                ? 'Modifica los datos del débito automático'
                : 'Completa el formulario para registrar un nuevo débito automático'}
            </DialogDescription>
          </DialogHeader>
          <DebitoAutomaticoForm
            initialData={editingDebito || undefined}
            onSubmit={handleSubmit}
            onCancel={() => {
              setIsDialogOpen(false)
              setEditingDebito(null)
            }}
            isSubmitting={createMutation.isPending || updateMutation.isPending}
          />
        </DialogContent>
      </Dialog>
    </div>
  )
}
