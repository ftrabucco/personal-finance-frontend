'use client'

import { useState, useEffect, useMemo } from 'react'
import { useSearchParams, useRouter } from 'next/navigation'
import { Pencil, Trash2, TrendingUp, ArrowUpDown, ArrowUp, ArrowDown, Search } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
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
import { IngresoUnicoForm } from '@/components/forms/IngresoUnicoForm'
import { DualCurrencyDisplay } from '@/components/common/DualCurrencyDisplay'
import {
  useIngresosUnicos,
  useCreateIngresoUnico,
  useUpdateIngresoUnico,
  useDeleteIngresoUnico,
} from '@/lib/hooks/useIngresosUnicos'
import { formatCurrency, formatCurrencyCompact, formatDate } from '@/lib/utils/formatters'
import { cleanFormData } from '@/lib/utils/cleanFormData'
import { showErrorToast } from '@/lib/utils/errorHandler'
import { ConfirmDialog } from '@/components/ui/confirm-dialog'
import { useConfirmDialog } from '@/lib/hooks/useConfirmDialog'
import type { IngresoUnico } from '@/types'

type SortField = 'fecha' | 'descripcion' | 'monto_ars' | 'fuente'
type SortDirection = 'asc' | 'desc'

export function IngresosUnicosTab() {
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [editingIngreso, setEditingIngreso] = useState<IngresoUnico | null>(null)
  const [searchQuery, setSearchQuery] = useState('')
  const [sortField, setSortField] = useState<SortField>('fecha')
  const [sortDirection, setSortDirection] = useState<SortDirection>('desc')
  const searchParams = useSearchParams()
  const router = useRouter()

  // Open dialog if ?new=true is in URL
  useEffect(() => {
    if (searchParams.get('new') === 'true') {
      setEditingIngreso(null)
      setIsDialogOpen(true)
      router.replace('/ingresos?tab=unicos', { scroll: false })
    }
  }, [searchParams, router])

  const { data: response, isLoading } = useIngresosUnicos()
  const createMutation = useCreateIngresoUnico()
  const updateMutation = useUpdateIngresoUnico()
  const deleteMutation = useDeleteIngresoUnico()
  const confirmDialog = useConfirmDialog()

  const ingresos = response?.data || []

  const filteredIngresos = useMemo(() => {
    if (!searchQuery.trim()) return ingresos
    const q = searchQuery.toLowerCase()
    return ingresos.filter(
      (i) =>
        i.descripcion.toLowerCase().includes(q) ||
        (i.fuenteIngreso?.nombre || '').toLowerCase().includes(q)
    )
  }, [ingresos, searchQuery])

  const sortedIngresos = useMemo(() => {
    return [...filteredIngresos].sort((a, b) => {
      let comparison = 0
      switch (sortField) {
        case 'fecha':
          comparison = new Date(a.fecha).getTime() - new Date(b.fecha).getTime()
          break
        case 'descripcion':
          comparison = a.descripcion.localeCompare(b.descripcion)
          break
        case 'monto_ars':
          comparison = Number(a.monto_ars) - Number(b.monto_ars)
          break
        case 'fuente':
          comparison = (a.fuenteIngreso?.nombre || '').localeCompare(b.fuenteIngreso?.nombre || '')
          break
      }
      return sortDirection === 'asc' ? comparison : -comparison
    })
  }, [filteredIngresos, sortField, sortDirection])

  const handleSort = (field: SortField) => {
    if (sortField === field) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc')
    } else {
      setSortField(field)
      setSortDirection('desc')
    }
  }

  const SortableHeader = ({ field, children }: { field: SortField; children: React.ReactNode }) => (
    <TableHead
      className="cursor-pointer select-none hover:bg-muted/50 transition-colors"
      onClick={() => handleSort(field)}
    >
      <div className="flex items-center gap-1">
        {children}
        {sortField === field ? (
          sortDirection === 'asc' ? (
            <ArrowUp className="h-4 w-4" />
          ) : (
            <ArrowDown className="h-4 w-4" />
          )
        ) : (
          <ArrowUpDown className="h-4 w-4 opacity-30" />
        )}
      </div>
    </TableHead>
  )

  const handleEdit = (ingreso: IngresoUnico) => {
    setEditingIngreso(ingreso)
    setIsDialogOpen(true)
  }

  const handleDeleteClick = (id: number) => {
    confirmDialog.requestConfirm(id)
  }

  const handleDeleteConfirm = async () => {
    const id = confirmDialog.confirm()
    if (id == null) return
    try {
      await deleteMutation.mutateAsync(id)
    } catch (error) {
      showErrorToast(error)
    }
  }

  const handleSubmit = async (data: Partial<IngresoUnico>) => {
    try {
      const cleanData = cleanFormData(data)

      if (editingIngreso) {
        await updateMutation.mutateAsync({
          id: editingIngreso.id,
          data: cleanData,
        })
      } else {
        await createMutation.mutateAsync(cleanData)
      }
      setIsDialogOpen(false)
      setEditingIngreso(null)
    } catch (error) {
      showErrorToast(error)
    }
  }

  const totalARS = ingresos.reduce((sum, ingreso) => sum + (Number(ingreso.monto_ars) || 0), 0)
  const totalUSD = ingresos.reduce((sum, ingreso) => sum + (Number(ingreso.monto_usd) || 0), 0)

  return (
    <div className="space-y-4 md:space-y-6">
      <div className="grid grid-cols-2 gap-3 md:grid-cols-3 md:gap-4">
        <Card className="overflow-hidden">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total ARS</CardTitle>
            <TrendingUp className="h-4 w-4 text-green-500 shrink-0" />
          </CardHeader>
          <CardContent>
            <div className="text-lg sm:text-xl md:text-2xl font-bold truncate text-green-600" title={formatCurrency(totalARS)}>{formatCurrencyCompact(totalARS)}</div>
            <p className="text-xs text-muted-foreground">
              Ingresos en pesos argentinos
            </p>
          </CardContent>
        </Card>

        <Card className="overflow-hidden">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total USD</CardTitle>
            <TrendingUp className="h-4 w-4 text-green-500 shrink-0" />
          </CardHeader>
          <CardContent>
            <div className="text-lg sm:text-xl md:text-2xl font-bold truncate text-green-600" title={`US$ ${totalUSD.toFixed(2)}`}>{formatCurrencyCompact(totalUSD, 'USD')}</div>
            <p className="text-xs text-muted-foreground">Ingresos en dólares</p>
          </CardContent>
        </Card>

        <Card className="overflow-hidden">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Cantidad</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground shrink-0" />
          </CardHeader>
          <CardContent>
            <div className="text-lg sm:text-xl md:text-2xl font-bold">{ingresos.length}</div>
            <p className="text-xs text-muted-foreground">
              {ingresos.length === 1 ? 'ingreso registrado' : 'ingresos registrados'}
            </p>
          </CardContent>
        </Card>
      </div>

      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          placeholder="Buscar por descripción o fuente..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="pl-9"
        />
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <TrendingUp className="h-5 w-5" />
            Listado de Ingresos
            {searchQuery && (
              <span className="text-sm font-normal text-muted-foreground">
                ({filteredIngresos.length} resultado{filteredIngresos.length !== 1 ? 's' : ''})
              </span>
            )}
          </CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="text-center py-8">Cargando ingresos...</div>
          ) : ingresos.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              No hay ingresos registrados. Crea tu primer ingreso único.
            </div>
          ) : (
            <>
              {/* Mobile: Cards */}
              <div className="space-y-3 md:hidden">
                {sortedIngresos.map((ingreso) => (
                  <div key={ingreso.id} className="rounded-lg border p-3">
                    <div className="flex items-center justify-between gap-2 mb-2">
                      <span className="text-xs font-medium text-green-600">
                        {ingreso.fuenteIngreso?.nombre || 'Sin fuente'}
                      </span>
                      <span className="text-xs text-muted-foreground">
                        {formatDate(ingreso.fecha)}
                      </span>
                    </div>
                    <p className="font-medium truncate mb-1">{ingreso.descripcion}</p>
                    <div className="flex items-center justify-between gap-2">
                      <div className="text-right shrink-0 ml-auto">
                        <DualCurrencyDisplay
                          montoArs={ingreso.monto_ars}
                          montoUsd={ingreso.monto_usd}
                          monedaOrigen={ingreso.moneda_origen}
                          tipoCambio={ingreso.tipo_cambio_usado}
                        />
                      </div>
                    </div>
                    <div className="flex justify-end mt-2 pt-2 border-t gap-2">
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-8"
                        onClick={() => handleEdit(ingreso)}
                      >
                        <Pencil className="h-4 w-4 mr-1" />
                        Editar
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-8 text-destructive hover:text-destructive"
                        onClick={() => handleDeleteClick(ingreso.id)}
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
                      <SortableHeader field="fecha">Fecha</SortableHeader>
                      <SortableHeader field="descripcion">Descripción</SortableHeader>
                      <SortableHeader field="fuente">Fuente</SortableHeader>
                      <SortableHeader field="monto_ars">Monto</SortableHeader>
                      <TableHead className="text-right">Acciones</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {sortedIngresos.map((ingreso) => (
                      <TableRow key={ingreso.id}>
                        <TableCell>
                          {formatDate(ingreso.fecha)}
                        </TableCell>
                        <TableCell className="max-w-[200px] truncate">
                          {ingreso.descripcion}
                        </TableCell>
                        <TableCell>
                          {ingreso.fuenteIngreso?.nombre || 'Sin fuente'}
                        </TableCell>
                        <TableCell>
                          <DualCurrencyDisplay
                            montoArs={ingreso.monto_ars}
                            montoUsd={ingreso.monto_usd}
                            monedaOrigen={ingreso.moneda_origen}
                            tipoCambio={ingreso.tipo_cambio_usado}
                          />
                        </TableCell>
                        <TableCell className="text-right">
                          <div className="flex justify-end gap-2">
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => handleEdit(ingreso)}
                            >
                              <Pencil className="h-4 w-4" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => handleDeleteClick(ingreso.id)}
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
              {editingIngreso ? 'Editar Ingreso Único' : 'Nuevo Ingreso Único'}
            </DialogTitle>
            <DialogDescription>
              {editingIngreso
                ? 'Modifica los datos del ingreso único'
                : 'Completa los datos para crear un nuevo ingreso único'}
            </DialogDescription>
          </DialogHeader>
          <IngresoUnicoForm
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

      <ConfirmDialog
        open={confirmDialog.isOpen}
        onOpenChange={confirmDialog.setIsOpen}
        title="Eliminar ingreso"
        description="¿Estás seguro de eliminar este ingreso? Esta acción no se puede deshacer."
        confirmLabel="Eliminar"
        onConfirm={handleDeleteConfirm}
        isLoading={deleteMutation.isPending}
      />
    </div>
  )
}
