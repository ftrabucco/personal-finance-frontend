'use client'

import { useState } from 'react'
import { Plus, Pencil, Trash2, CreditCard } from 'lucide-react'
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
import { TarjetaForm } from '@/components/forms/TarjetaForm'
import {
  useTarjetas,
  useCreateTarjeta,
  useUpdateTarjeta,
  useDeleteTarjeta,
} from '@/lib/hooks/useTarjetas'
import type { Tarjeta } from '@/types'

export default function TarjetasPage() {
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [editingTarjeta, setEditingTarjeta] = useState<Tarjeta | null>(null)

  const { data: response, isLoading } = useTarjetas()
  const createMutation = useCreateTarjeta()
  const updateMutation = useUpdateTarjeta()
  const deleteMutation = useDeleteTarjeta()

  const tarjetas = response?.data || []

  const handleCreate = () => {
    setEditingTarjeta(null)
    setIsDialogOpen(true)
  }

  const handleEdit = (tarjeta: Tarjeta) => {
    setEditingTarjeta(tarjeta)
    setIsDialogOpen(true)
  }

  const handleDelete = async (id: number) => {
    if (window.confirm('¿Estás seguro de eliminar esta tarjeta?')) {
      try {
        await deleteMutation.mutateAsync(id)
      } catch (error) {
        console.error('Error al eliminar tarjeta:', error)
      }
    }
  }

  const handleSubmit = async (data: Partial<Tarjeta>) => {
    try {
      if (editingTarjeta) {
        await updateMutation.mutateAsync({
          id: editingTarjeta.id,
          data,
        })
      } else {
        await createMutation.mutateAsync(data)
      }
      setIsDialogOpen(false)
      setEditingTarjeta(null)
    } catch (error) {
      console.error('Error al guardar tarjeta:', error)
    }
  }

  const getTipoBadgeVariant = (tipo: string) => {
    switch (tipo) {
      case 'credito':
        return 'default'
      case 'debito':
        return 'secondary'
      case 'virtual':
        return 'outline'
      default:
        return 'default'
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Tarjetas</h1>
          <p className="text-muted-foreground">
            Gestiona tus tarjetas de débito y crédito
          </p>
        </div>
        <Button onClick={handleCreate}>
          <Plus className="mr-2 h-4 w-4" />
          Nueva Tarjeta
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <CreditCard className="h-5 w-5" />
            Mis Tarjetas
          </CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="text-center py-8">Cargando tarjetas...</div>
          ) : tarjetas.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              No hay tarjetas registradas. Crea tu primera tarjeta.
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Nombre</TableHead>
                  <TableHead>Tipo</TableHead>
                  <TableHead>Banco</TableHead>
                  <TableHead>Cierre</TableHead>
                  <TableHead>Vencimiento</TableHead>
                  <TableHead>Cuotas</TableHead>
                  <TableHead className="text-right">Acciones</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {tarjetas.map((tarjeta) => (
                  <TableRow key={tarjeta.id}>
                    <TableCell className="font-medium">
                      {tarjeta.nombre}
                      {tarjeta.ultimos_4_digitos && (
                        <span className="ml-2 text-muted-foreground">
                          ****{tarjeta.ultimos_4_digitos}
                        </span>
                      )}
                    </TableCell>
                    <TableCell>
                      <Badge variant={getTipoBadgeVariant(tarjeta.tipo)}>
                        {tarjeta.tipo}
                      </Badge>
                    </TableCell>
                    <TableCell>{tarjeta.banco}</TableCell>
                    <TableCell>
                      {tarjeta.dia_mes_cierre
                        ? `Día ${tarjeta.dia_mes_cierre}`
                        : '-'}
                    </TableCell>
                    <TableCell>
                      {tarjeta.dia_mes_vencimiento
                        ? `Día ${tarjeta.dia_mes_vencimiento}`
                        : '-'}
                    </TableCell>
                    <TableCell>
                      {tarjeta.permite_cuotas ? (
                        <Badge variant="success">Sí</Badge>
                      ) : (
                        <Badge variant="secondary">No</Badge>
                      )}
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-2">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleEdit(tarjeta)}
                        >
                          <Pencil className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleDelete(tarjeta.id)}
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
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {editingTarjeta ? 'Editar Tarjeta' : 'Nueva Tarjeta'}
            </DialogTitle>
            <DialogDescription>
              {editingTarjeta
                ? 'Modifica los datos de la tarjeta'
                : 'Completa el formulario para agregar una nueva tarjeta'}
            </DialogDescription>
          </DialogHeader>
          <TarjetaForm
            initialData={editingTarjeta || undefined}
            onSubmit={handleSubmit}
            onCancel={() => {
              setIsDialogOpen(false)
              setEditingTarjeta(null)
            }}
            isSubmitting={createMutation.isPending || updateMutation.isPending}
          />
        </DialogContent>
      </Dialog>
    </div>
  )
}
