'use client'

import { useState } from 'react'
import { Receipt, Trash2, RefreshCw, Filter } from 'lucide-react'
import { format } from 'date-fns'
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
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { useAllGastos, useDeleteGasto, useGenerateGastos } from '@/lib/hooks/useGastos'
import { formatCurrency } from '@/lib/utils/formatters'
import type { Gasto } from '@/types'

export default function GastosPage() {
  const [searchTerm, setSearchTerm] = useState('')
  const { data: response, isLoading } = useAllGastos()
  const deleteMutation = useDeleteGasto()
  const generateMutation = useGenerateGastos()

  const gastos = response?.data || []

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

  const filteredGastos = gastos.filter((gasto) =>
    gasto.descripcion.toLowerCase().includes(searchTerm.toLowerCase())
  )

  const totalGastos = filteredGastos.reduce(
    (sum, gasto) => sum + parseFloat(gasto.monto_ars),
    0
  )

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Gastos</h1>
          <p className="text-muted-foreground">
            Vista unificada de todos tus gastos
          </p>
        </div>
        <Button onClick={handleGenerate} disabled={generateMutation.isPending}>
          <RefreshCw
            className={`mr-2 h-4 w-4 ${
              generateMutation.isPending ? 'animate-spin' : ''
            }`}
          />
          Generar Gastos
        </Button>
      </div>

      <div className="grid gap-4 md:grid-cols-4">
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
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2">
              <Receipt className="h-5 w-5" />
              Todos los Gastos
            </CardTitle>
            <div className="flex items-center gap-2">
              <Filter className="h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Buscar por descripción..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-64"
              />
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="text-center py-8">Cargando gastos...</div>
          ) : filteredGastos.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              No hay gastos registrados.
            </div>
          ) : (
            <div className="max-h-[600px] overflow-y-auto">
              <Table>
                <TableHeader className="sticky top-0 bg-background">
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
                  {filteredGastos.map((gasto) => (
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
          )}
        </CardContent>
      </Card>
    </div>
  )
}
