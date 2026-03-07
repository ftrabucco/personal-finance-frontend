'use client'

import { useState } from 'react'
import { Plus, Pencil, Trash2, Building2, Power, PowerOff, DollarSign } from 'lucide-react'
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
import { CuentaBancariaForm } from '@/components/forms/CuentaBancariaForm'
import {
  useCuentasBancarias,
  useCreateCuentaBancaria,
  useUpdateCuentaBancaria,
  useDeleteCuentaBancaria,
} from '@/lib/hooks/useCuentasBancarias'
import type { CuentaBancaria } from '@/types'

export default function CuentasBancariasPage() {
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [editingCuenta, setEditingCuenta] = useState<CuentaBancaria | null>(null)

  const { data: response, isLoading } = useCuentasBancarias()
  const createMutation = useCreateCuentaBancaria()
  const updateMutation = useUpdateCuentaBancaria()
  const deleteMutation = useDeleteCuentaBancaria()

  const cuentas = response?.data || []

  const handleCreate = () => {
    setEditingCuenta(null)
    setIsDialogOpen(true)
  }

  const handleEdit = (cuenta: CuentaBancaria) => {
    setEditingCuenta(cuenta)
    setIsDialogOpen(true)
  }

  const handleDelete = async (id: number) => {
    if (window.confirm('¿Estas seguro de eliminar esta cuenta bancaria?')) {
      try {
        await deleteMutation.mutateAsync(id)
      } catch (error: unknown) {
        const errorMessage = error instanceof Error ? error.message : 'Error desconocido'
        if (errorMessage.includes('en uso') || errorMessage.includes('being used')) {
          alert('No se puede eliminar la cuenta porque esta siendo usada en debitos automaticos')
        } else {
          console.error('Error al eliminar cuenta:', error)
        }
      }
    }
  }

  const handleSubmit = async (data: Partial<CuentaBancaria>) => {
    try {
      // Normalize empty string to null for ultimos_4_digitos
      const normalizedData = {
        ...data,
        ultimos_4_digitos: data.ultimos_4_digitos === '' ? null : data.ultimos_4_digitos,
      }

      if (editingCuenta) {
        await updateMutation.mutateAsync({
          id: editingCuenta.id,
          data: normalizedData,
        })
      } else {
        await createMutation.mutateAsync(normalizedData)
      }
      setIsDialogOpen(false)
      setEditingCuenta(null)
    } catch (error) {
      console.error('Error al guardar cuenta:', error)
    }
  }

  const getTipoBadgeVariant = (tipo: string) => {
    switch (tipo) {
      case 'ahorro':
        return 'secondary'
      case 'corriente':
        return 'default'
      default:
        return 'default'
    }
  }

  const getMonedaBadgeVariant = (moneda: string) => {
    switch (moneda) {
      case 'USD':
        return 'success'
      case 'ARS':
        return 'outline'
      default:
        return 'outline'
    }
  }

  const cuentasActivas = cuentas.filter((c) => c.activa)

  return (
    <div className="space-y-4 md:space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight md:text-3xl">
            Cuentas Bancarias
          </h1>
          <p className="text-sm text-muted-foreground md:text-base">
            Gestiona las cuentas bancarias para tus debitos automaticos
          </p>
        </div>
        <Button onClick={handleCreate} className="w-full sm:w-auto">
          <Plus className="mr-2 h-4 w-4" />
          Nueva Cuenta
        </Button>
      </div>

      <div className="grid grid-cols-2 gap-3 md:grid-cols-3 md:gap-4">
        <Card className="overflow-hidden">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Total Cuentas
            </CardTitle>
            <Building2 className="h-4 w-4 text-muted-foreground shrink-0" />
          </CardHeader>
          <CardContent>
            <div className="text-lg sm:text-xl md:text-2xl font-bold">
              {cuentas.length}
            </div>
            <p className="text-xs text-muted-foreground">
              {cuentasActivas.length} activas
            </p>
          </CardContent>
        </Card>

        <Card className="overflow-hidden">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Cuentas ARS
            </CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground shrink-0" />
          </CardHeader>
          <CardContent>
            <div className="text-lg sm:text-xl md:text-2xl font-bold">
              {cuentas.filter((c) => c.moneda === 'ARS').length}
            </div>
            <p className="text-xs text-muted-foreground">En pesos</p>
          </CardContent>
        </Card>

        <Card className="overflow-hidden">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Cuentas USD
            </CardTitle>
            <DollarSign className="h-4 w-4 text-green-500 shrink-0" />
          </CardHeader>
          <CardContent>
            <div className="text-lg sm:text-xl md:text-2xl font-bold">
              {cuentas.filter((c) => c.moneda === 'USD').length}
            </div>
            <p className="text-xs text-muted-foreground">En dolares</p>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Building2 className="h-5 w-5" />
            Mis Cuentas Bancarias
          </CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="text-center py-8">Cargando cuentas...</div>
          ) : cuentas.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              No hay cuentas bancarias registradas. Crea tu primera cuenta.
            </div>
          ) : (
            <>
              {/* Mobile: Cards */}
              <div className="space-y-3 md:hidden">
                {cuentas.map((cuenta) => (
                  <div key={cuenta.id} className="rounded-lg border p-4">
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex items-center gap-3">
                        <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/10">
                          <Building2 className="h-5 w-5 text-primary" />
                        </div>
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="font-medium">{cuenta.nombre}</span>
                            {!cuenta.activa && (
                              <PowerOff className="h-4 w-4 text-muted-foreground" />
                            )}
                          </div>
                          <div className="flex items-center gap-2 text-sm text-muted-foreground">
                            <span>{cuenta.banco}</span>
                            {cuenta.ultimos_4_digitos && (
                              <span>****{cuenta.ultimos_4_digitos}</span>
                            )}
                          </div>
                          <div className="flex items-center gap-2 mt-1">
                            <Badge variant={getTipoBadgeVariant(cuenta.tipo)} className="text-xs">
                              {cuenta.tipo === 'ahorro' ? 'Caja de Ahorro' : 'Cuenta Corriente'}
                            </Badge>
                            <Badge variant={getMonedaBadgeVariant(cuenta.moneda)} className="text-xs">
                              {cuenta.moneda}
                            </Badge>
                          </div>
                        </div>
                      </div>
                      <div className="flex gap-1">
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-9 w-9"
                          onClick={() => handleEdit(cuenta)}
                        >
                          <Pencil className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-9 w-9"
                          onClick={() => handleDelete(cuenta.id)}
                        >
                          <Trash2 className="h-4 w-4 text-destructive" />
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
                      <TableHead>Nombre</TableHead>
                      <TableHead>Banco</TableHead>
                      <TableHead>Tipo</TableHead>
                      <TableHead>Moneda</TableHead>
                      <TableHead>Estado</TableHead>
                      <TableHead className="text-right">Acciones</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {cuentas.map((cuenta) => (
                      <TableRow key={cuenta.id}>
                        <TableCell className="font-medium">
                          {cuenta.nombre}
                          {cuenta.ultimos_4_digitos && (
                            <span className="ml-2 text-muted-foreground">
                              ****{cuenta.ultimos_4_digitos}
                            </span>
                          )}
                        </TableCell>
                        <TableCell>{cuenta.banco}</TableCell>
                        <TableCell>
                          <Badge variant={getTipoBadgeVariant(cuenta.tipo)}>
                            {cuenta.tipo === 'ahorro' ? 'Caja de Ahorro' : 'Cuenta Corriente'}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <Badge variant={getMonedaBadgeVariant(cuenta.moneda)}>
                            {cuenta.moneda}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          {cuenta.activa ? (
                            <div className="flex items-center gap-1">
                              <Power className="h-4 w-4 text-green-500" />
                              <span className="text-green-600">Activa</span>
                            </div>
                          ) : (
                            <div className="flex items-center gap-1">
                              <PowerOff className="h-4 w-4 text-muted-foreground" />
                              <span className="text-muted-foreground">Inactiva</span>
                            </div>
                          )}
                        </TableCell>
                        <TableCell className="text-right">
                          <div className="flex justify-end gap-2">
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleEdit(cuenta)}
                            >
                              <Pencil className="h-4 w-4" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleDelete(cuenta.id)}
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
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {editingCuenta ? 'Editar Cuenta Bancaria' : 'Nueva Cuenta Bancaria'}
            </DialogTitle>
            <DialogDescription>
              {editingCuenta
                ? 'Modifica los datos de la cuenta bancaria'
                : 'Completa el formulario para agregar una nueva cuenta bancaria'}
            </DialogDescription>
          </DialogHeader>
          <CuentaBancariaForm
            initialData={editingCuenta || undefined}
            onSubmit={handleSubmit}
            onCancel={() => {
              setIsDialogOpen(false)
              setEditingCuenta(null)
            }}
            isSubmitting={createMutation.isPending || updateMutation.isPending}
          />
        </DialogContent>
      </Dialog>
    </div>
  )
}
