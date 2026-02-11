'use client'

import { useState, useMemo } from 'react'
import { Receipt, Trash2, RefreshCw, Filter, ChevronLeft, ChevronRight, X } from 'lucide-react'
import { format, startOfMonth, endOfMonth, subMonths } from 'date-fns'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { useAllGastos, useDeleteGasto, useGenerateGastos } from '@/lib/hooks/useGastos'
import { useCategorias } from '@/lib/hooks/useCatalogos'
import { formatCurrency } from '@/lib/utils/formatters'
import type { Gasto } from '@/types'

const ITEMS_PER_PAGE = 20

const TIPO_ORIGEN_OPTIONS = [
  { value: 'all', label: 'Todos los tipos' },
  { value: 'unico', label: 'Único' },
  { value: 'recurrente', label: 'Recurrente' },
  { value: 'debito_automatico', label: 'Débito Automático' },
  { value: 'compra', label: 'Compra' },
]

const MONTH_OPTIONS = [
  { value: 'all', label: 'Todas las fechas' },
  { value: '0', label: 'Mes actual' },
  { value: '1', label: 'Mes anterior' },
  { value: '2', label: 'Hace 2 meses' },
  { value: '3', label: 'Hace 3 meses' },
]

export default function GastosPage() {
  const [searchTerm, setSearchTerm] = useState('')
  const [tipoOrigenFilter, setTipoOrigenFilter] = useState('all')
  const [categoriaFilter, setCategoriaFilter] = useState('all')
  const [monthFilter, setMonthFilter] = useState('all')
  const [currentPage, setCurrentPage] = useState(1)

  const { data: response, isLoading } = useAllGastos()
  const { data: categoriasResponse } = useCategorias()
  const deleteMutation = useDeleteGasto()
  const generateMutation = useGenerateGastos()

  const gastos = response?.data || []
  const categorias = categoriasResponse?.data || []

  const handleDelete = async (id: number) => {
    if (window.confirm('¿Estás seguro de eliminar este gasto?')) {
      try {
        await deleteMutation.mutateAsync(id)
      } catch (error) {
        console.error('Error al eliminar gasto:', error)
      }
    }
  }

  const handleGenerate = async () => {
    try {
      const result = await generateMutation.mutateAsync()
      alert(`Se generaron ${result.data.generados} gastos nuevos`)
    } catch (error) {
      console.error('Error al generar gastos:', error)
    }
  }

  const getTipoOrigenBadge = (tipoOrigen: string) => {
    switch (tipoOrigen) {
      case 'unico':
        return <Badge variant="default">Único</Badge>
      case 'recurrente':
        return <Badge variant="secondary">Recurrente</Badge>
      case 'debito_automatico':
        return <Badge variant="outline">Débito Auto.</Badge>
      case 'compra':
        return <Badge>Compra</Badge>
      default:
        return <Badge variant="secondary">{tipoOrigen}</Badge>
    }
  }

  // Filter gastos based on all criteria
  const filteredGastos = useMemo(() => {
    return gastos.filter((gasto) => {
      // Search filter
      if (searchTerm && !gasto.descripcion.toLowerCase().includes(searchTerm.toLowerCase())) {
        return false
      }

      // Tipo origen filter
      if (tipoOrigenFilter !== 'all' && gasto.tipo_origen !== tipoOrigenFilter) {
        return false
      }

      // Categoria filter
      if (categoriaFilter !== 'all' && gasto.categoria?.id?.toString() !== categoriaFilter) {
        return false
      }

      // Month filter
      if (monthFilter !== 'all') {
        const monthsAgo = parseInt(monthFilter)
        const targetDate = subMonths(new Date(), monthsAgo)
        const monthStart = startOfMonth(targetDate)
        const monthEnd = endOfMonth(targetDate)
        const gastoDate = new Date(gasto.fecha)

        if (gastoDate < monthStart || gastoDate > monthEnd) {
          return false
        }
      }

      return true
    })
  }, [gastos, searchTerm, tipoOrigenFilter, categoriaFilter, monthFilter])

  // Pagination
  const totalPages = Math.ceil(filteredGastos.length / ITEMS_PER_PAGE)
  const paginatedGastos = useMemo(() => {
    const start = (currentPage - 1) * ITEMS_PER_PAGE
    return filteredGastos.slice(start, start + ITEMS_PER_PAGE)
  }, [filteredGastos, currentPage])

  // Reset to page 1 when filters change
  const handleFilterChange = (setter: (value: string) => void) => (value: string) => {
    setter(value)
    setCurrentPage(1)
  }

  const clearFilters = () => {
    setSearchTerm('')
    setTipoOrigenFilter('all')
    setCategoriaFilter('all')
    setMonthFilter('all')
    setCurrentPage(1)
  }

  const hasActiveFilters = searchTerm || tipoOrigenFilter !== 'all' || categoriaFilter !== 'all' || monthFilter !== 'all'

  const totalGastos = filteredGastos.reduce(
    (sum, gasto) => sum + parseFloat(gasto.monto_ars),
    0
  )

  return (
    <div className="space-y-4 md:space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight md:text-3xl">Gastos</h1>
          <p className="text-sm text-muted-foreground md:text-base">
            Vista unificada de todos tus gastos
          </p>
        </div>
        <Button onClick={handleGenerate} disabled={generateMutation.isPending} className="w-full sm:w-auto">
          <RefreshCw
            className={`mr-2 h-4 w-4 ${
              generateMutation.isPending ? 'animate-spin' : ''
            }`}
          />
          Generar Gastos
        </Button>
      </div>

      <div className="grid grid-cols-2 gap-3 md:grid-cols-4 md:gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Total de Gastos
            </CardTitle>
            <Receipt className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {formatCurrency(totalGastos)}
            </div>
            <p className="text-xs text-muted-foreground">
              {filteredGastos.length} gastos
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Únicos</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {filteredGastos.filter((g) => g.tipo_origen === 'unico').length}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Recurrentes</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {
                filteredGastos.filter((g) => g.tipo_origen === 'recurrente')
                  .length
              }
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Compras</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {filteredGastos.filter((g) => g.tipo_origen === 'compra').length}
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader className="pb-3">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <CardTitle className="flex items-center gap-2 text-lg md:text-xl">
              <Receipt className="h-5 w-5" />
              Todos los Gastos
            </CardTitle>
            <div className="flex items-center gap-2">
              <Filter className="h-4 w-4 text-muted-foreground hidden sm:block" />
              <Input
                placeholder="Buscar..."
                value={searchTerm}
                onChange={(e) => {
                  setSearchTerm(e.target.value)
                  setCurrentPage(1)
                }}
                className="w-full sm:w-48"
              />
            </div>
          </div>

          {/* Filters */}
          <div className="flex flex-col gap-3 mt-4 pt-4 border-t">
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
              <Select value={tipoOrigenFilter} onValueChange={handleFilterChange(setTipoOrigenFilter)}>
                <SelectTrigger>
                  <SelectValue placeholder="Tipo de gasto" />
                </SelectTrigger>
                <SelectContent>
                  {TIPO_ORIGEN_OPTIONS.map((option) => (
                    <SelectItem key={option.value} value={option.value}>
                      {option.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>

              <Select value={categoriaFilter} onValueChange={handleFilterChange(setCategoriaFilter)}>
                <SelectTrigger>
                  <SelectValue placeholder="Categoría" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todas las categorías</SelectItem>
                  {categorias.map((cat) => (
                    <SelectItem key={cat.id} value={cat.id.toString()}>
                      {cat.nombre_categoria}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>

              <Select value={monthFilter} onValueChange={handleFilterChange(setMonthFilter)}>
                <SelectTrigger>
                  <SelectValue placeholder="Período" />
                </SelectTrigger>
                <SelectContent>
                  {MONTH_OPTIONS.map((option) => (
                    <SelectItem key={option.value} value={option.value}>
                      {option.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {hasActiveFilters && (
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">
                  {filteredGastos.length} gastos encontrados
                </span>
                <Button variant="ghost" size="sm" onClick={clearFilters}>
                  <X className="h-4 w-4 mr-1" />
                  Limpiar filtros
                </Button>
              </div>
            )}
          </div>
        </CardHeader>
        <CardContent className="px-3 md:px-6">
          {isLoading ? (
            <div className="text-center py-8">Cargando gastos...</div>
          ) : filteredGastos.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              {hasActiveFilters
                ? 'No hay gastos que coincidan con los filtros.'
                : 'No hay gastos registrados.'}
            </div>
          ) : (
            <>
              {/* Mobile: Cards */}
              <div className="space-y-3 md:hidden">
                {paginatedGastos.map((gasto) => (
                  <div
                    key={gasto.id}
                    className="rounded-lg border p-3"
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          {getTipoOrigenBadge(gasto.tipo_origen)}
                          <span className="text-xs text-muted-foreground">
                            {format(new Date(gasto.fecha), 'dd/MM/yyyy')}
                          </span>
                        </div>
                        <p className="font-medium truncate">{gasto.descripcion}</p>
                        <p className="text-xs text-muted-foreground">
                          {gasto.categoria?.nombre_categoria || 'Sin categoría'}
                        </p>
                      </div>
                      <div className="text-right shrink-0">
                        <p className="font-bold text-base">
                          {formatCurrency(parseFloat(gasto.monto_ars))}
                        </p>
                        {gasto.monto_usd && (
                          <p className="text-xs text-muted-foreground">
                            USD ${parseFloat(gasto.monto_usd).toFixed(2)}
                          </p>
                        )}
                        {gasto.cantidad_cuotas_totales && (
                          <p className="text-xs text-muted-foreground">
                            Cuota {gasto.cantidad_cuotas_pagadas}/{gasto.cantidad_cuotas_totales}
                          </p>
                        )}
                      </div>
                    </div>
                    <div className="flex justify-end mt-2 pt-2 border-t">
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-8 text-destructive hover:text-destructive"
                        onClick={() => handleDelete(gasto.id)}
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
                      <TableHead>Fecha</TableHead>
                      <TableHead>Descripción</TableHead>
                      <TableHead>Tipo</TableHead>
                      <TableHead>Categoría</TableHead>
                      <TableHead>Monto ARS</TableHead>
                      <TableHead>Monto USD</TableHead>
                      <TableHead>Tipo de Pago</TableHead>
                      <TableHead>Cuotas</TableHead>
                      <TableHead className="text-right">Acciones</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {paginatedGastos.map((gasto) => (
                      <TableRow key={gasto.id}>
                        <TableCell>
                          {format(new Date(gasto.fecha), 'dd/MM/yyyy')}
                        </TableCell>
                        <TableCell className="max-w-xs truncate">
                          {gasto.descripcion}
                        </TableCell>
                        <TableCell>{getTipoOrigenBadge(gasto.tipo_origen)}</TableCell>
                        <TableCell>
                          {gasto.categoria?.nombre_categoria || '-'}
                        </TableCell>
                        <TableCell className="font-semibold">
                          {formatCurrency(parseFloat(gasto.monto_ars))}
                        </TableCell>
                        <TableCell>
                          {gasto.monto_usd
                            ? `$${parseFloat(gasto.monto_usd).toFixed(2)}`
                            : '-'}
                        </TableCell>
                        <TableCell>{gasto.tipoPago?.nombre || '-'}</TableCell>
                        <TableCell>
                          {gasto.cantidad_cuotas_totales ? (
                            <span className="text-xs">
                              {gasto.cantidad_cuotas_pagadas}/
                              {gasto.cantidad_cuotas_totales}
                            </span>
                          ) : (
                            '-'
                          )}
                        </TableCell>
                        <TableCell className="text-right">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleDelete(gasto.id)}
                          >
                            <Trash2 className="h-4 w-4 text-destructive" />
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>

              {/* Pagination */}
              {totalPages > 1 && (
                <div className="flex flex-col gap-3 mt-4 pt-4 border-t sm:flex-row sm:items-center sm:justify-between">
                  <p className="text-sm text-muted-foreground text-center sm:text-left">
                    Mostrando {((currentPage - 1) * ITEMS_PER_PAGE) + 1} - {Math.min(currentPage * ITEMS_PER_PAGE, filteredGastos.length)} de {filteredGastos.length} gastos
                  </p>
                  <div className="flex items-center justify-center gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                      disabled={currentPage === 1}
                    >
                      <ChevronLeft className="h-4 w-4" />
                      <span className="hidden sm:inline ml-1">Anterior</span>
                    </Button>
                    <div className="flex items-center gap-1">
                      {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                        let pageNum: number
                        if (totalPages <= 5) {
                          pageNum = i + 1
                        } else if (currentPage <= 3) {
                          pageNum = i + 1
                        } else if (currentPage >= totalPages - 2) {
                          pageNum = totalPages - 4 + i
                        } else {
                          pageNum = currentPage - 2 + i
                        }
                        return (
                          <Button
                            key={pageNum}
                            variant={currentPage === pageNum ? 'default' : 'outline'}
                            size="sm"
                            className="w-8 h-8 p-0"
                            onClick={() => setCurrentPage(pageNum)}
                          >
                            {pageNum}
                          </Button>
                        )
                      })}
                    </div>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                      disabled={currentPage === totalPages}
                    >
                      <span className="hidden sm:inline mr-1">Siguiente</span>
                      <ChevronRight className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              )}
            </>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
