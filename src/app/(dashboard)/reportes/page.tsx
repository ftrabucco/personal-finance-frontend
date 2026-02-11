'use client'

// src/app/(dashboard)/reportes/page.tsx
import { useState, useMemo } from 'react'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Badge } from '@/components/ui/badge'
import {
  BarChart3,
  TrendingUp,
  TrendingDown,
  Calendar,
  PieChart,
  DollarSign,
  CreditCard,
  AlertTriangle,
} from 'lucide-react'
import { useAllGastos } from '@/lib/hooks/useGastos'
import { useCompras } from '@/lib/hooks/useCompras'
import { useGastosRecurrentes } from '@/lib/hooks/useGastosRecurrentes'
import { useDebitosAutomaticos } from '@/lib/hooks/useDebitosAutomaticos'
import { useCategorias, useImportancias } from '@/lib/hooks/useCatalogos'
import { formatCurrency } from '@/lib/utils/formatters'
import {
  startOfMonth,
  endOfMonth,
  format,
  subMonths,
  parseISO,
  isWithinInterval,
} from 'date-fns'
import { es } from 'date-fns/locale'

export default function ReportesPage() {
  const [selectedMonth, setSelectedMonth] = useState('0') // 0 = mes actual

  // Helper function to safely format USD amounts
  const formatUSD = (amount: number | undefined | null): string => {
    const value = Number(amount) || 0
    return `US$ ${value.toFixed(2)}`
  }

  // Fetch data
  const { data: gastosResponse, isLoading: loadingGastos } = useAllGastos()
  const { data: comprasResponse, isLoading: loadingCompras } = useCompras()
  const { data: gastosRecurrentesResponse, isLoading: loadingRecurrentes } =
    useGastosRecurrentes()
  const { data: debitosResponse, isLoading: loadingDebitos } =
    useDebitosAutomaticos()
  const { data: categoriasResponse } = useCategorias()
  const { data: importanciasResponse } = useImportancias()

  const gastos = gastosResponse?.data || []
  const compras = comprasResponse?.data || []
  const gastosRecurrentes = gastosRecurrentesResponse?.data || []
  const debitos = debitosResponse?.data || []
  const categorias = categoriasResponse?.data || []
  const importancias = importanciasResponse?.data || []

  const isLoading = loadingGastos || loadingCompras || loadingRecurrentes || loadingDebitos

  // Calculate date range based on selected month
  const dateRange = useMemo(() => {
    const monthsAgo = parseInt(selectedMonth)
    const targetDate = subMonths(new Date(), monthsAgo)
    return {
      start: startOfMonth(targetDate),
      end: endOfMonth(targetDate),
      monthName: format(targetDate, 'MMMM yyyy', { locale: es }),
    }
  }, [selectedMonth])

  // Filter gastos by selected month
  const gastosDelPeriodo = useMemo(() => {
    return gastos.filter((gasto) => {
      const fecha = parseISO(gasto.fecha)
      return isWithinInterval(fecha, { start: dateRange.start, end: dateRange.end })
    })
  }, [gastos, dateRange])

  // Calculate total expenses
  const totalGastos = useMemo(() => {
    return gastosDelPeriodo.reduce((sum, gasto) => sum + parseFloat(gasto.monto_ars), 0)
  }, [gastosDelPeriodo])

  // Group by category
  const gastosPorCategoria = useMemo(() => {
    const grouped = gastosDelPeriodo.reduce(
      (acc, gasto) => {
        const categoriaId = gasto.categoria_gasto_id
        const categoria = categorias.find((c) => c.id === categoriaId)
        const categoriaNombre = categoria?.nombre_categoria || 'Sin categoría'

        if (!acc[categoriaNombre]) {
          acc[categoriaNombre] = 0
        }
        acc[categoriaNombre] += parseFloat(gasto.monto_ars)
        return acc
      },
      {} as Record<string, number>
    )

    return Object.entries(grouped)
      .map(([categoria, monto]) => ({ categoria, monto }))
      .sort((a, b) => b.monto - a.monto)
  }, [gastosDelPeriodo, categorias])

  // Group by importance
  const gastosPorImportancia = useMemo(() => {
    const grouped = gastosDelPeriodo.reduce(
      (acc, gasto) => {
        const importanciaId = gasto.importancia_gasto_id
        const importancia = importancias.find((i) => i.id === importanciaId)
        const importanciaNombre = importancia?.nombre_importancia || 'Sin clasificar'

        if (!acc[importanciaNombre]) {
          acc[importanciaNombre] = 0
        }
        acc[importanciaNombre] += parseFloat(gasto.monto_ars)
        return acc
      },
      {} as Record<string, number>
    )

    return Object.entries(grouped)
      .map(([importancia, monto]) => ({ importancia, monto }))
      .sort((a, b) => b.monto - a.monto)
  }, [gastosDelPeriodo, importancias])

  // Calculate monthly average (last 6 months)
  const promedioMensual = useMemo(() => {
    const last6Months = Array.from({ length: 6 }, (_, i) => {
      const date = subMonths(new Date(), i)
      const start = startOfMonth(date)
      const end = endOfMonth(date)

      const gastosDelMes = gastos.filter((gasto) => {
        const fecha = parseISO(gasto.fecha)
        return isWithinInterval(fecha, { start, end })
      })

      const total = gastosDelMes.reduce(
        (sum, gasto) => sum + parseFloat(gasto.monto_ars),
        0
      )

      return {
        mes: format(date, 'MMM yyyy', { locale: es }),
        total,
      }
    }).reverse()

    const promedio =
      last6Months.reduce((sum, month) => sum + month.total, 0) / last6Months.length

    return {
      data: last6Months,
      promedio,
    }
  }, [gastos])

  // Calculate recurring expenses for the month (ARS and USD)
  const gastosRecurrentesDelMes = useMemo(() => {
    const ars = gastosRecurrentes
      .filter((g) => g.activo)
      .reduce((sum, gasto) => sum + (gasto.monto_ars || 0), 0)
    const usd = gastosRecurrentes
      .filter((g) => g.activo)
      .reduce((sum, gasto) => sum + (gasto.monto_usd || 0), 0)
    return { ars, usd }
  }, [gastosRecurrentes])

  const debitosDelMes = useMemo(() => {
    const ars = debitos
      .filter((d) => d.activo)
      .reduce((sum, debito) => sum + (debito.monto_ars || 0), 0)
    const usd = debitos
      .filter((d) => d.activo)
      .reduce((sum, debito) => sum + (debito.monto_usd || 0), 0)
    return { ars, usd }
  }, [debitos])

  // Calculate pending installments (monthly payment for active installment purchases)
  const cuotasPendientes = useMemo(() => {
    const ars = compras
      .filter((c) => c.pendiente_cuotas)
      .reduce((sum, compra) => sum + (compra.monto_pagado || 0), 0)
    const usd = compras
      .filter((c) => c.pendiente_cuotas)
      .reduce((sum, compra) => {
        // Calculate USD amount for the monthly installment
        const cuotaUsd = (compra.monto_total_usd || 0) / (compra.cantidad_cuotas || 1)
        return sum + cuotaUsd
      }, 0)
    return { ars, usd }
  }, [compras])

  // Compare with previous month
  const comparacionMesAnterior = useMemo(() => {
    if (parseInt(selectedMonth) >= 5) return null // No data for comparison

    const prevMonthDate = subMonths(new Date(), parseInt(selectedMonth) + 1)
    const prevStart = startOfMonth(prevMonthDate)
    const prevEnd = endOfMonth(prevMonthDate)

    const gastosMesAnterior = gastos.filter((gasto) => {
      const fecha = parseISO(gasto.fecha)
      return isWithinInterval(fecha, { start: prevStart, end: prevEnd })
    })

    const totalMesAnterior = gastosMesAnterior.reduce(
      (sum, gasto) => sum + parseFloat(gasto.monto_ars),
      0
    )

    const diferencia = totalGastos - totalMesAnterior
    const porcentaje =
      totalMesAnterior > 0 ? (diferencia / totalMesAnterior) * 100 : 0

    return {
      mesAnterior: totalMesAnterior,
      diferencia,
      porcentaje,
      aumentó: diferencia > 0,
    }
  }, [gastos, totalGastos, selectedMonth])

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <BarChart3 className="h-12 w-12 text-muted-foreground animate-pulse mx-auto mb-4" />
          <p className="text-muted-foreground">Cargando reportes...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-4 md:space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold md:text-3xl">Reportes Financieros</h1>
          <p className="text-sm text-muted-foreground md:text-base">
            Análisis detallado de tus gastos e ingresos
          </p>
        </div>

        {/* Month selector */}
        <Select value={selectedMonth} onValueChange={setSelectedMonth}>
          <SelectTrigger className="w-full sm:w-[200px]">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="0">Mes actual</SelectItem>
            <SelectItem value="1">Hace 1 mes</SelectItem>
            <SelectItem value="2">Hace 2 meses</SelectItem>
            <SelectItem value="3">Hace 3 meses</SelectItem>
            <SelectItem value="4">Hace 4 meses</SelectItem>
            <SelectItem value="5">Hace 5 meses</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Selected period */}
      <Card className="bg-primary/5 border-primary/20">
        <CardContent className="pt-4 md:pt-6">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <div className="flex items-center gap-2 mb-1">
                <Calendar className="h-5 w-5 text-primary" />
                <span className="text-sm text-muted-foreground">Período analizado</span>
              </div>
              <p className="text-xl font-bold capitalize md:text-2xl">{dateRange.monthName}</p>
            </div>
            <div className="sm:text-right">
              <p className="text-sm text-muted-foreground mb-1">Total gastado</p>
              <p className="text-2xl font-bold md:text-3xl">{formatCurrency(totalGastos)}</p>
              <p className="text-xs text-muted-foreground mt-1">
                {gastosDelPeriodo.length} gastos registrados
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Comparison with previous month */}
      {comparacionMesAnterior && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              {comparacionMesAnterior.aumentó ? (
                <TrendingUp className="h-5 w-5 text-red-500" />
              ) : (
                <TrendingDown className="h-5 w-5 text-green-500" />
              )}
              Comparación con mes anterior
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-3 sm:gap-4">
              <div>
                <p className="text-sm text-muted-foreground">Mes anterior</p>
                <p className="text-lg font-semibold md:text-xl">
                  {formatCurrency(comparacionMesAnterior.mesAnterior)}
                </p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Diferencia</p>
                <p
                  className={`text-lg font-semibold md:text-xl ${
                    comparacionMesAnterior.aumentó ? 'text-red-500' : 'text-green-500'
                  }`}
                >
                  {comparacionMesAnterior.aumentó ? '+' : ''}
                  {formatCurrency(comparacionMesAnterior.diferencia)}
                </p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Variación</p>
                <p
                  className={`text-lg font-semibold md:text-xl ${
                    comparacionMesAnterior.aumentó ? 'text-red-500' : 'text-green-500'
                  }`}
                >
                  {comparacionMesAnterior.aumentó ? '+' : ''}
                  {comparacionMesAnterior.porcentaje.toFixed(1)}%
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Grid with reports */}
      <div className="grid gap-4 md:gap-6 md:grid-cols-2">
        {/* Gastos por categoría */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <PieChart className="h-5 w-5" />
              Gastos por Categoría
            </CardTitle>
            <CardDescription>
              Top categorías de gasto en {dateRange.monthName}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {gastosPorCategoria.length === 0 ? (
                <p className="text-sm text-muted-foreground text-center py-4">
                  No hay gastos en este período
                </p>
              ) : (
                gastosPorCategoria.slice(0, 8).map((item, index) => {
                  const porcentaje = (item.monto / totalGastos) * 100
                  return (
                    <div key={item.categoria}>
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-sm font-medium">
                          {index + 1}. {item.categoria}
                        </span>
                        <span className="text-sm font-semibold">
                          {formatCurrency(item.monto)}
                        </span>
                      </div>
                      <div className="flex items-center gap-2">
                        <div className="flex-1 bg-secondary rounded-full h-2 overflow-hidden">
                          <div
                            className="bg-primary h-full transition-all"
                            style={{ width: `${porcentaje}%` }}
                          />
                        </div>
                        <span className="text-xs text-muted-foreground w-12 text-right">
                          {porcentaje.toFixed(1)}%
                        </span>
                      </div>
                    </div>
                  )
                })
              )}
            </div>
          </CardContent>
        </Card>

        {/* Gastos por importancia */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <AlertTriangle className="h-5 w-5" />
              Gastos por Importancia
            </CardTitle>
            <CardDescription>
              Distribución según prioridad en {dateRange.monthName}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {gastosPorImportancia.length === 0 ? (
                <p className="text-sm text-muted-foreground text-center py-4">
                  No hay gastos clasificados
                </p>
              ) : (
                gastosPorImportancia.map((item) => {
                  const porcentaje = (item.monto / totalGastos) * 100
                  const badgeVariant =
                    item.importancia === 'Esencial'
                      ? 'destructive'
                      : item.importancia === 'Importante'
                        ? 'default'
                        : 'secondary'

                  return (
                    <div key={item.importancia}>
                      <div className="flex items-center justify-between mb-2">
                        <Badge variant={badgeVariant}>{item.importancia}</Badge>
                        <span className="text-sm font-semibold">
                          {formatCurrency(item.monto)}
                        </span>
                      </div>
                      <div className="flex items-center gap-2">
                        <div className="flex-1 bg-secondary rounded-full h-2 overflow-hidden">
                          <div
                            className="bg-primary h-full transition-all"
                            style={{ width: `${porcentaje}%` }}
                          />
                        </div>
                        <span className="text-xs text-muted-foreground w-12 text-right">
                          {porcentaje.toFixed(1)}%
                        </span>
                      </div>
                    </div>
                  )
                })
              )}
            </div>
          </CardContent>
        </Card>

        {/* Promedio mensual */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <BarChart3 className="h-5 w-5" />
              Tendencia (últimos 6 meses)
            </CardTitle>
            <CardDescription>
              Promedio mensual: {formatCurrency(promedioMensual.promedio)}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {promedioMensual.data.map((month) => {
                const porcentaje =
                  promedioMensual.promedio > 0
                    ? (month.total / promedioMensual.promedio) * 100
                    : 0
                const esActual = month.mes === format(new Date(), 'MMM yyyy', { locale: es })

                return (
                  <div
                    key={month.mes}
                    className={esActual ? 'bg-primary/5 p-2 rounded-lg' : ''}
                  >
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-sm font-medium capitalize">
                        {month.mes}
                        {esActual && (
                          <Badge variant="outline" className="ml-2 text-xs">
                            Actual
                          </Badge>
                        )}
                      </span>
                      <span className="text-sm font-semibold">
                        {formatCurrency(month.total)}
                      </span>
                    </div>
                    <div className="bg-secondary rounded-full h-2 overflow-hidden">
                      <div
                        className={`h-full transition-all ${
                          month.total > promedioMensual.promedio
                            ? 'bg-red-500'
                            : 'bg-green-500'
                        }`}
                        style={{ width: `${Math.min(porcentaje, 100)}%` }}
                      />
                    </div>
                  </div>
                )
              })}
            </div>
          </CardContent>
        </Card>

        {/* Gastos fijos y compromisos */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <CreditCard className="h-5 w-5" />
              Compromisos Mensuales
            </CardTitle>
            <CardDescription>
              Gastos fijos y obligaciones pendientes
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {/* Gastos recurrentes */}
              <div className="p-3 bg-blue-50 dark:bg-blue-950/30 rounded-lg">
                <div className="flex items-center justify-between mb-1">
                  <div>
                    <p className="text-sm font-medium">Gastos Recurrentes</p>
                    <p className="text-xs text-muted-foreground">
                      {gastosRecurrentes.filter((g) => g.activo).length} activos
                    </p>
                  </div>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">ARS:</span>
                  <span className="font-bold">{formatCurrency(gastosRecurrentesDelMes.ars)}</span>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">USD:</span>
                  <span className="font-bold">{formatUSD(gastosRecurrentesDelMes.usd)}</span>
                </div>
              </div>

              {/* Débitos automáticos */}
              <div className="p-3 bg-purple-50 dark:bg-purple-950/30 rounded-lg">
                <div className="flex items-center justify-between mb-1">
                  <div>
                    <p className="text-sm font-medium">Débitos Automáticos</p>
                    <p className="text-xs text-muted-foreground">
                      {debitos.filter((d) => d.activo).length} activos
                    </p>
                  </div>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">ARS:</span>
                  <span className="font-bold">{formatCurrency(debitosDelMes.ars)}</span>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">USD:</span>
                  <span className="font-bold">{formatUSD(debitosDelMes.usd)}</span>
                </div>
              </div>

              {/* Cuotas pendientes */}
              <div className="p-3 bg-orange-50 dark:bg-orange-950/30 rounded-lg">
                <div className="flex items-center justify-between mb-1">
                  <div>
                    <p className="text-sm font-medium">Cuotas Pendientes</p>
                    <p className="text-xs text-muted-foreground">
                      {compras.filter((c) => c.pendiente_cuotas).length} compras en cuotas
                    </p>
                  </div>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">ARS:</span>
                  <span className="font-bold">{formatCurrency(cuotasPendientes.ars)}</span>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">USD:</span>
                  <span className="font-bold">{formatUSD(cuotasPendientes.usd)}</span>
                </div>
              </div>

              {/* Total compromisos */}
              <div className="pt-3 border-t">
                <div className="space-y-1">
                  <div className="flex items-center justify-between">
                    <p className="font-semibold">Total Compromisos</p>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-muted-foreground">ARS:</span>
                    <p className="text-xl font-bold text-primary">
                      {formatCurrency(
                        gastosRecurrentesDelMes.ars + debitosDelMes.ars + cuotasPendientes.ars
                      )}
                    </p>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-muted-foreground">USD:</span>
                    <p className="text-xl font-bold text-primary">
                      {formatUSD(gastosRecurrentesDelMes.usd + debitosDelMes.usd + cuotasPendientes.usd)}
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Insights */}
      <Card className="border-yellow-200 dark:border-yellow-900 bg-yellow-50/50 dark:bg-yellow-950/20">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <DollarSign className="h-5 w-5 text-yellow-600 dark:text-yellow-500" />
            Análisis e Insights
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-2 text-sm">
            {gastosPorCategoria.length > 0 && (
              <p>
                • Tu categoría con mayor gasto es{' '}
                <span className="font-semibold">{gastosPorCategoria[0].categoria}</span> con{' '}
                {formatCurrency(gastosPorCategoria[0].monto)} (
                {((gastosPorCategoria[0].monto / totalGastos) * 100).toFixed(1)}% del total)
              </p>
            )}
            {comparacionMesAnterior && (
              <p>
                • {comparacionMesAnterior.aumentó ? 'Aumentaste' : 'Redujiste'} tus gastos en{' '}
                {formatCurrency(Math.abs(comparacionMesAnterior.diferencia))} (
                {Math.abs(comparacionMesAnterior.porcentaje).toFixed(1)}%) respecto al mes
                anterior
              </p>
            )}
            {totalGastos > promedioMensual.promedio && (
              <p>
                • Este mes gastaste{' '}
                {formatCurrency(totalGastos - promedioMensual.promedio)} más que tu promedio
                mensual
              </p>
            )}
            {totalGastos < promedioMensual.promedio && (
              <p className="text-green-600 dark:text-green-500">
                • ¡Felicitaciones! Gastaste{' '}
                {formatCurrency(promedioMensual.promedio - totalGastos)} menos que tu
                promedio mensual
              </p>
            )}
            {gastosRecurrentesDelMes.ars + debitosDelMes.ars > 0 && (
              <p>
                • Tus gastos fijos mensuales son de{' '}
                {formatCurrency(gastosRecurrentesDelMes.ars + debitosDelMes.ars)} (
                {(
                  ((gastosRecurrentesDelMes.ars + debitosDelMes.ars) / totalGastos) *
                  100
                ).toFixed(1)}
                % del total)
              </p>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
