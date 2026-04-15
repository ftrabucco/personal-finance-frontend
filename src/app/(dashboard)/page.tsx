'use client'

import { useMemo, useState } from 'react'
import { useAuth } from '@/lib/auth/authContext'
import { useModulosContext } from '@/lib/context/ModulosContext'
import { ModulosDiscoveryBanner } from '@/components/ModulosDiscoveryBanner'
import { useRouter } from 'next/navigation'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import {
  Sheet,
  SheetContent,
  SheetTrigger,
} from '@/components/ui/sheet'
import { Switch } from '@/components/ui/switch'
import { Label } from '@/components/ui/label'
import {
  Repeat,
  Receipt,
  RefreshCw,
  DollarSign,
  TrendingUp,
  TrendingDown,
  Minus,
  Heart,
  Calendar,
  Zap,
  ShoppingCart,
  Wallet,
  SlidersHorizontal,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { useAllGastos } from '@/lib/hooks/useGastos'
import { useBalanceEvolucion } from '@/lib/hooks/useBalance'
import { useTipoCambioActual } from '@/lib/hooks/useTipoCambio'
import { useCategorias } from '@/lib/hooks/useCatalogos'
import { useProcesarTodosPendientes } from '@/lib/hooks/useProcesamiento'
import { useSaludFinanciera, useProyeccion } from '@/lib/hooks/useAnalisis'
import { useIngresosUnicos } from '@/lib/hooks/useIngresosUnicos'
import { useIngresosRecurrentes } from '@/lib/hooks/useIngresosRecurrentes'
import { usePreferencias, useUpdatePreferencias } from '@/lib/hooks/usePreferencias'
import { formatCurrency, formatCurrencyCompact, formatDate } from '@/lib/utils/formatters'
import { cn } from '@/lib/utils'
import { format, startOfMonth, endOfMonth, subMonths } from 'date-fns'
import { es } from 'date-fns/locale'
import {
  PieChart,
  Pie,
  Cell,
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
} from 'recharts'
import type { DashboardSection } from '@/types'
import { DASHBOARD_SECTIONS_DEFAULT, DASHBOARD_SECTION_LABELS } from '@/types'

const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884D8', '#82ca9d', '#ffc658', '#ff7300']

export default function DashboardPage() {
  const { user } = useAuth()
  const router = useRouter()
  const { isModuloActivo } = useModulosContext()

  const { data: gastosResponse } = useAllGastos()
  const procesarPendientes = useProcesarTodosPendientes()
  const { data: saludResponse } = useSaludFinanciera('mes')
  const { data: proyeccionResponse } = useProyeccion(1)
  const { data: ingresosUnicosResponse } = useIngresosUnicos()
  const { data: ingresosRecurrentesResponse } = useIngresosRecurrentes()
  const { data: categoriasResponse } = useCategorias()

  // Dashboard personalization
  const { data: preferencias } = usePreferencias()
  const updatePreferencias = useUpdatePreferencias()
  const activeSections: DashboardSection[] = preferencias?.dashboard_sections ?? DASHBOARD_SECTIONS_DEFAULT
  const isSectionVisible = (section: DashboardSection) => activeSections.includes(section)
  const toggleSection = (section: DashboardSection) => {
    const next = activeSections.includes(section)
      ? activeSections.filter(s => s !== section)
      : [...activeSections, section]
    updatePreferencias.mutate({ dashboard_sections: next })
  }

  // Balance acumulado - últimos 6 meses
  const balanceDesde = format(subMonths(new Date(), 5), 'yyyy-MM')
  const balanceHasta = format(new Date(), 'yyyy-MM')
  const { data: balanceResponse } = useBalanceEvolucion(balanceDesde, balanceHasta)
  const balanceData = balanceResponse?.data
  const { data: tipoCambioResponse } = useTipoCambioActual()
  const tcVenta = tipoCambioResponse?.data?.valor_venta_usd_ars ?? null

  const categorias = categoriasResponse?.data || []

  const ingresosUnicos = ingresosUnicosResponse?.data || []
  const ingresosRecurrentes = ingresosRecurrentesResponse?.data || []
  const gastos = gastosResponse?.data || []

  const handleProcesarPendientes = () => {
    procesarPendientes.mutate()
  }

  // Calcular gastos del mes actual y anterior
  const now = new Date()
  const startOfCurrentMonth = startOfMonth(now)
  const endOfCurrentMonth = endOfMonth(now)
  const startOfLastMonth = startOfMonth(subMonths(now, 1))
  const endOfLastMonth = endOfMonth(subMonths(now, 1))

  const startCurrentStr = format(startOfCurrentMonth, 'yyyy-MM-dd')
  const endCurrentStr = format(endOfCurrentMonth, 'yyyy-MM-dd')
  const startLastStr = format(startOfLastMonth, 'yyyy-MM-dd')
  const endLastStr = format(endOfLastMonth, 'yyyy-MM-dd')

  const gastosDelMes = useMemo(() =>
    gastos.filter((gasto) => {
      const fechaStr = gasto.fecha.slice(0, 10)
      return fechaStr >= startCurrentStr && fechaStr <= endCurrentStr
    }),
    [gastos, startCurrentStr, endCurrentStr]
  )

  const gastosDelMesAnterior = useMemo(() =>
    gastos.filter((gasto) => {
      const fechaStr = gasto.fecha.slice(0, 10)
      return fechaStr >= startLastStr && fechaStr <= endLastStr
    }),
    [gastos, startLastStr, endLastStr]
  )

  const totalGastosDelMes = gastosDelMes.reduce(
    (sum, gasto) => sum + parseFloat(gasto.monto_ars),
    0
  )

  const totalGastosDelMesUSD = gastosDelMes.reduce(
    (sum, gasto) => sum + parseFloat(gasto.monto_usd || '0'),
    0
  )

  const totalGastosDelMesAnterior = gastosDelMesAnterior.reduce(
    (sum, gasto) => sum + parseFloat(gasto.monto_ars),
    0
  )

  // Calcular diferencia porcentual
  const diferenciaPorcentual = totalGastosDelMesAnterior > 0
    ? ((totalGastosDelMes - totalGastosDelMesAnterior) / totalGastosDelMesAnterior) * 100
    : 0

  // Calcular ingresos del mes actual
  const ingresosUnicosDelMes = useMemo(() =>
    ingresosUnicos.filter((ingreso) => {
      const fechaStr = ingreso.fecha.slice(0, 10)
      return fechaStr >= startCurrentStr && fechaStr <= endCurrentStr
    }),
    [ingresosUnicos, startCurrentStr, endCurrentStr]
  )

  const totalIngresosUnicosDelMes = ingresosUnicosDelMes.reduce(
    (sum, ingreso) => sum + parseFloat(String(ingreso.monto_ars || 0)),
    0
  )

  const totalIngresosUnicosDelMesUSD = ingresosUnicosDelMes.reduce(
    (sum, ingreso) => sum + parseFloat(String(ingreso.monto_usd || 0)),
    0
  )

  // Ingresos recurrentes activos del mes actual (verifica fecha_inicio y fecha_fin)
  const ingresosRecurrentesActivos = useMemo(() =>
    ingresosRecurrentes.filter((i) => {
      if (!i.activo) return false
      if (i.fecha_inicio) {
        const fechaInicioStr = i.fecha_inicio.slice(0, 10)
        if (fechaInicioStr > endCurrentStr) return false
      }
      if (i.fecha_fin) {
        const fechaFinStr = i.fecha_fin.slice(0, 10)
        if (fechaFinStr < startCurrentStr) return false
      }
      return true
    }),
    [ingresosRecurrentes, startCurrentStr, endCurrentStr]
  )

  const totalIngresosRecurrentesMensual = ingresosRecurrentesActivos.reduce(
    (sum, i) => sum + parseFloat(String(i.monto_ars || 0)), 0
  )

  const totalIngresosRecurrentesMensualUSD = ingresosRecurrentesActivos.reduce(
    (sum, i) => sum + parseFloat(String(i.monto_usd || 0)), 0
  )

  // Total ingresos del mes (únicos + recurrentes activos)
  const totalIngresosDelMes = totalIngresosUnicosDelMes + totalIngresosRecurrentesMensual
  const totalIngresosDelMesUSD = totalIngresosUnicosDelMesUSD + totalIngresosRecurrentesMensualUSD

  // Balance neto
  const balanceNeto = totalIngresosDelMes - totalGastosDelMes
  const balanceNetoUSD = totalIngresosDelMesUSD - totalGastosDelMesUSD

  // Tasa de ahorro
  const tasaAhorro = totalIngresosDelMes > 0
    ? (balanceNeto / totalIngresosDelMes) * 100
    : 0

  // Gastos por categoría del mes actual
  const gastosPorCategoria = useMemo(() => {
    const categoriaMap = new Map<string, number>()

    gastosDelMes.forEach((gasto) => {
      const categoria = gasto.categoria?.nombre_categoria || 'Sin categoría'
      const actual = categoriaMap.get(categoria) || 0
      categoriaMap.set(categoria, actual + parseFloat(gasto.monto_ars))
    })

    return Array.from(categoriaMap.entries())
      .map(([name, value]) => ({ name, value }))
      .sort((a, b) => b.value - a.value)
  }, [gastosDelMes])

  // Top 5 categorías para el pie chart
  const topCategorias = useMemo(() => {
    const top5 = gastosPorCategoria.slice(0, 5)
    const otros = gastosPorCategoria.slice(5).reduce((sum, cat) => sum + cat.value, 0)

    if (otros > 0) {
      return [...top5, { name: 'Otros', value: otros }]
    }
    return top5
  }, [gastosPorCategoria])

  // Datos para el gráfico de barras (últimos 4 meses) - Gastos vs Ingresos
  const balancePorMes = useMemo(() => {
    const meses = []
    for (let monthsAgo = 3; monthsAgo >= 0; monthsAgo--) {
      const mesDate = subMonths(now, monthsAgo)
      const inicioStr = format(startOfMonth(mesDate), 'yyyy-MM-dd')
      const finStr = format(endOfMonth(mesDate), 'yyyy-MM-dd')

      const totalGastos = gastos
        .filter((g) => {
          const fechaStr = g.fecha.slice(0, 10)
          return fechaStr >= inicioStr && fechaStr <= finStr
        })
        .reduce((sum, g) => sum + parseFloat(g.monto_ars), 0)

      const totalIngresosU = ingresosUnicos
        .filter((ingreso) => {
          const fechaStr = ingreso.fecha.slice(0, 10)
          return fechaStr >= inicioStr && fechaStr <= finStr
        })
        .reduce((sum, ingreso) => sum + parseFloat(String(ingreso.monto_ars || 0)), 0)

      const totalIngresosR = ingresosRecurrentes
        .filter((rec) => {
          if (!rec.activo) return false
          if (rec.fecha_inicio && rec.fecha_inicio.slice(0, 10) > finStr) return false
          if (rec.fecha_fin && rec.fecha_fin.slice(0, 10) < inicioStr) return false
          return true
        })
        .reduce((sum, rec) => sum + parseFloat(String(rec.monto_ars || 0)), 0)

      meses.push({
        mes: format(mesDate, 'MMM', { locale: es }),
        gastos: totalGastos,
        ingresos: totalIngresosU + totalIngresosR,
        dateFrom: inicioStr,
        dateTo: finStr,
      })
    }
    return meses
  }, [gastos, ingresosUnicos, ingresosRecurrentes, startCurrentStr])

  // Desglose de gastos del mes por tipo_origen (datos reales procesados)
  const gastosPorTipo = useMemo(() => {
    const tipos = {
      unico: { ars: 0, count: 0 },
      recurrente: { ars: 0, count: 0 },
      debito_automatico: { ars: 0, count: 0 },
      compra: { ars: 0, count: 0 },
      otro: { ars: 0, count: 0 },
    }

    gastosDelMes.forEach((g) => {
      const monto = parseFloat(g.monto_ars)
      const tipo = g.tipo_origen as keyof typeof tipos
      if (tipos[tipo]) {
        tipos[tipo].ars += monto
        tipos[tipo].count += 1
      } else {
        tipos.otro.ars += monto
        tipos.otro.count += 1
      }
    })

    return tipos
  }, [gastosDelMes])

  return (
    <div className="space-y-4 md:space-y-6">
      {/* 1. Welcome + Process Pending */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold md:text-3xl">Hola, {user?.nombre}!</h1>
          <p className="text-sm text-muted-foreground md:text-base">
            Aquí está el resumen de tus finanzas personales
          </p>
        </div>
        <div className="flex gap-2 w-full sm:w-auto">
          <Sheet>
            <SheetTrigger asChild>
              <Button variant="outline" size="sm" className="gap-2 flex-1 sm:flex-none">
                <SlidersHorizontal className="h-4 w-4" />
                Personalizar
              </Button>
            </SheetTrigger>
            <SheetContent>
              <div className="space-y-4 pt-2">
                <div>
                  <h2 className="text-lg font-semibold">Personalizar Dashboard</h2>
                  <p className="text-sm text-muted-foreground mt-1">
                    Elegí qué secciones querés ver en tu dashboard.
                  </p>
                </div>
                <div className="space-y-4 pt-2">
                  {(Object.entries(DASHBOARD_SECTION_LABELS) as [DashboardSection, string][]).map(([key, label]) => (
                    <div key={key} className="flex items-center justify-between">
                      <Label htmlFor={`section-${key}`} className="cursor-pointer">{label}</Label>
                      <Switch
                        id={`section-${key}`}
                        checked={isSectionVisible(key)}
                        onCheckedChange={() => toggleSection(key)}
                        disabled={updatePreferencias.isPending}
                      />
                    </div>
                  ))}
                </div>
              </div>
            </SheetContent>
          </Sheet>
          <Button
            onClick={handleProcesarPendientes}
            disabled={procesarPendientes.isPending}
            variant="outline"
            size="sm"
            className="gap-2 flex-1 sm:flex-none"
          >
            <RefreshCw className={`h-4 w-4 ${procesarPendientes.isPending ? 'animate-spin' : ''}`} />
            {procesarPendientes.isPending ? 'Procesando...' : 'Procesar Pendientes'}
          </Button>
        </div>
      </div>

      {/* 2. Discovery Banner */}
      <ModulosDiscoveryBanner />

      {/* 3. Main Stats Row - 4 cards */}
      <div className="grid grid-cols-2 gap-3 md:grid-cols-4 md:gap-4">
        {/* Gastos del Mes */}
        <Card className="overflow-hidden border-l-4 border-l-red-500">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Gastos del Mes
            </CardTitle>
            <Receipt className="h-4 w-4 text-muted-foreground shrink-0" />
          </CardHeader>
          <CardContent>
            <div className="space-y-1">
              <div className="text-lg sm:text-xl md:text-2xl font-bold truncate" title={formatCurrency(totalGastosDelMes)}>
                {formatCurrencyCompact(totalGastosDelMes)}
              </div>
              <div className="text-sm text-muted-foreground">
                {formatCurrencyCompact(totalGastosDelMesUSD, 'USD')}
              </div>
            </div>
            <div className="flex items-center gap-1 text-xs text-muted-foreground mt-1">
              {diferenciaPorcentual > 0 ? (
                <TrendingUp className="h-3 w-3 text-red-500" />
              ) : diferenciaPorcentual < 0 ? (
                <TrendingDown className="h-3 w-3 text-green-500" />
              ) : (
                <Minus className="h-3 w-3" />
              )}
              <span className={diferenciaPorcentual > 0 ? 'text-red-500' : diferenciaPorcentual < 0 ? 'text-green-500' : ''}>
                {diferenciaPorcentual !== 0 ? `${Math.abs(diferenciaPorcentual).toFixed(1)}%` : '0%'}
              </span>
              <span>vs mes anterior</span>
            </div>
          </CardContent>
        </Card>

        {/* Ingresos del Mes */}
        <Card className="overflow-hidden">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Ingresos del Mes
            </CardTitle>
            <TrendingUp className="h-4 w-4 text-green-500 shrink-0" />
          </CardHeader>
          <CardContent>
            <div className="space-y-1">
              <div className="text-lg sm:text-xl md:text-2xl font-bold truncate text-green-600" title={formatCurrency(totalIngresosDelMes)}>
                {formatCurrencyCompact(totalIngresosDelMes)}
              </div>
              <div className="text-sm text-muted-foreground">
                {formatCurrencyCompact(totalIngresosDelMesUSD, 'USD')}
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Balance Neto */}
        <Card className="overflow-hidden">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Balance Neto
            </CardTitle>
            {balanceNeto >= 0 ? (
              <TrendingUp className="h-4 w-4 text-green-500 shrink-0" />
            ) : (
              <TrendingDown className="h-4 w-4 text-red-500 shrink-0" />
            )}
          </CardHeader>
          <CardContent>
            <div className="space-y-1">
              <div
                className={`text-lg sm:text-xl md:text-2xl font-bold truncate ${balanceNeto >= 0 ? 'text-green-600' : 'text-red-600'}`}
                title={formatCurrency(Math.abs(balanceNeto))}
              >
                {balanceNeto >= 0 ? '+' : '-'}{formatCurrencyCompact(Math.abs(balanceNeto))}
              </div>
              <div className={`text-sm ${balanceNetoUSD >= 0 ? 'text-green-600/70' : 'text-red-600/70'}`}>
                {balanceNetoUSD >= 0 ? '+' : '-'}{formatCurrencyCompact(Math.abs(balanceNetoUSD), 'USD')}
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Tasa de Ahorro */}
        {isSectionVisible('tasa_ahorro') && (
          <Card className="overflow-hidden">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                Tasa de Ahorro
              </CardTitle>
              <DollarSign className="h-4 w-4 text-muted-foreground shrink-0" />
            </CardHeader>
            <CardContent>
              <div
                className={`text-lg sm:text-xl md:text-2xl font-bold ${tasaAhorro >= 20 ? 'text-green-600' : tasaAhorro >= 0 ? 'text-yellow-600' : 'text-red-600'}`}
              >
                {tasaAhorro.toFixed(1)}%
              </div>
              <p className="text-xs text-muted-foreground">
                {tasaAhorro >= 20 ? 'Excelente' : tasaAhorro >= 10 ? 'Bueno' : tasaAhorro >= 0 ? 'Ajustado' : 'Déficit'}
              </p>
            </CardContent>
          </Card>
        )}
      </div>

      {/* 3b. Balance Acumulado Card */}
      {balanceData && isSectionVisible('balance_acumulado') && (
        <Card className="overflow-hidden border-l-4 border-l-blue-500">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Balance Acumulado
            </CardTitle>
            <Wallet className="h-4 w-4 text-blue-500 shrink-0" />
          </CardHeader>
          <CardContent>
            <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-2">
              <div className="space-y-1">
                <div
                  className={`text-2xl md:text-3xl font-bold ${balanceData.balance_actual_ars >= 0 ? 'text-blue-600' : 'text-red-600'}`}
                  title={formatCurrency(Math.abs(balanceData.balance_actual_ars))}
                >
                  {balanceData.balance_actual_ars >= 0 ? '' : '-'}{formatCurrencyCompact(Math.abs(balanceData.balance_actual_ars))}
                </div>
                {tcVenta && (
                  <div className="text-sm text-muted-foreground">
                    {formatCurrencyCompact(balanceData.balance_actual_ars / tcVenta, 'USD')}
                  </div>
                )}
              </div>
              {balanceData.meses.length > 0 && (
                <div className="text-xs text-muted-foreground">
                  {(() => {
                    const lastMonth = balanceData.meses[balanceData.meses.length - 1]
                    return (
                      <span className={lastMonth.saldo_ars >= 0 ? 'text-green-600' : 'text-red-600'}>
                        {lastMonth.saldo_ars >= 0 ? '+' : ''}{formatCurrencyCompact(lastMonth.saldo_ars)} este mes
                      </span>
                    )
                  })()}
                </div>
              )}
            </div>
            {balanceData.balance_inicial > 0 && (
              <p className="text-xs text-muted-foreground mt-2">
                Balance inicial: {formatCurrencyCompact(balanceData.balance_inicial)}
              </p>
            )}
          </CardContent>
        </Card>
      )}

      {/* 4. Desglose de Gastos del Mes */}
      {gastosDelMes.length > 0 && isSectionVisible('desglose_mes') && (
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-lg">Desglose del Mes</CardTitle>
          <CardDescription>
            De dónde vienen tus gastos de {format(now, 'MMMM', { locale: es })}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {gastosPorTipo.recurrente.count > 0 && (
              <div className="flex items-center justify-between text-sm">
                <div className="flex items-center gap-3">
                  <Repeat className="h-4 w-4 text-blue-500 shrink-0" />
                  <span>Recurrentes</span>
                  <span className="text-xs text-muted-foreground">({gastosPorTipo.recurrente.count})</span>
                </div>
                <span className="font-medium">{formatCurrencyCompact(gastosPorTipo.recurrente.ars)}</span>
              </div>
            )}

            {gastosPorTipo.debito_automatico.count > 0 && (
              <div className="flex items-center justify-between text-sm">
                <div className="flex items-center gap-3">
                  <Zap className="h-4 w-4 text-yellow-500 shrink-0" />
                  <span>Débitos Auto</span>
                  <span className="text-xs text-muted-foreground">({gastosPorTipo.debito_automatico.count})</span>
                </div>
                <span className="font-medium">{formatCurrencyCompact(gastosPorTipo.debito_automatico.ars)}</span>
              </div>
            )}

            {gastosPorTipo.compra.count > 0 && (
              <div className="flex items-center justify-between text-sm">
                <div className="flex items-center gap-3">
                  <ShoppingCart className="h-4 w-4 text-purple-500 shrink-0" />
                  <span>Cuotas</span>
                  <span className="text-xs text-muted-foreground">({gastosPorTipo.compra.count})</span>
                </div>
                <span className="font-medium">{formatCurrencyCompact(gastosPorTipo.compra.ars)}</span>
              </div>
            )}

            {gastosPorTipo.unico.count > 0 && (
              <div className="flex items-center justify-between text-sm">
                <div className="flex items-center gap-3">
                  <Receipt className="h-4 w-4 text-red-500 shrink-0" />
                  <span>Gastos Únicos</span>
                  <span className="text-xs text-muted-foreground">({gastosPorTipo.unico.count})</span>
                </div>
                <span className="font-medium">{formatCurrencyCompact(gastosPorTipo.unico.ars)}</span>
              </div>
            )}

            {gastosPorTipo.otro.count > 0 && (
              <div className="flex items-center justify-between text-sm">
                <div className="flex items-center gap-3">
                  <Receipt className="h-4 w-4 text-muted-foreground shrink-0" />
                  <span>Otros</span>
                  <span className="text-xs text-muted-foreground">({gastosPorTipo.otro.count})</span>
                </div>
                <span className="font-medium">{formatCurrencyCompact(gastosPorTipo.otro.ars)}</span>
              </div>
            )}

            {/* Total - debe coincidir exactamente con "Gastos del Mes" */}
            <div className="border-t pt-3 flex items-center justify-between text-sm font-semibold">
              <span>Total</span>
              <span>{formatCurrencyCompact(totalGastosDelMes)}</span>
            </div>
          </div>
        </CardContent>
      </Card>
      )}

      {/* 5. Quick Insights - Salud Financiera y Proyecciones */}
      {(isModuloActivo('salud_financiera') || isModuloActivo('proyecciones')) && (
      <div className="grid gap-3 md:gap-4 md:grid-cols-2">
        {/* Salud Financiera Widget */}
        {isModuloActivo('salud_financiera') && (
        <Card
          className="cursor-pointer hover:bg-accent/50 transition-colors"
          onClick={() => router.push('/salud-financiera')}
        >
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-2">
                  <Heart className="h-5 w-5 text-rose-500" />
                  <span className="text-sm text-muted-foreground">Salud Financiera</span>
                </div>
                <div className="flex items-center gap-3">
                  <span className="text-3xl font-bold">
                    {saludResponse?.data?.score ?? '--'}
                  </span>
                  {saludResponse?.data?.calificacion && (
                    <Badge
                      variant={
                        saludResponse.data.score >= 75
                          ? 'default'
                          : saludResponse.data.score >= 50
                            ? 'secondary'
                            : 'destructive'
                      }
                    >
                      {saludResponse.data.calificacion}
                    </Badge>
                  )}
                </div>
                <p className="text-xs text-muted-foreground mt-1">
                  Ver análisis completo →
                </p>
              </div>
              <div className="relative h-16 w-16">
                <svg className="h-16 w-16 -rotate-90" viewBox="0 0 36 36">
                  <circle
                    cx="18"
                    cy="18"
                    r="15.5"
                    fill="none"
                    className="stroke-muted"
                    strokeWidth="3"
                  />
                  <circle
                    cx="18"
                    cy="18"
                    r="15.5"
                    fill="none"
                    className={
                      (saludResponse?.data?.score ?? 0) >= 75
                        ? 'stroke-green-500'
                        : (saludResponse?.data?.score ?? 0) >= 50
                          ? 'stroke-yellow-500'
                          : 'stroke-red-500'
                    }
                    strokeWidth="3"
                    strokeDasharray={`${((saludResponse?.data?.score ?? 0) / 100) * 97.5} 97.5`}
                    strokeLinecap="round"
                  />
                </svg>
              </div>
            </div>
          </CardContent>
        </Card>
        )}

        {/* Proyección Widget */}
        {isModuloActivo('proyecciones') && isSectionVisible('proyeccion') && (
        <Card
          className="cursor-pointer hover:bg-accent/50 transition-colors"
          onClick={() => router.push('/proyecciones')}
        >
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-2">
                  <Calendar className="h-5 w-5 text-blue-500" />
                  <span className="text-sm text-muted-foreground">Próximo Mes</span>
                </div>
                <p className="text-2xl font-bold truncate" title={proyeccionResponse?.data?.proyeccion?.[0] ? formatCurrency(proyeccionResponse.data.proyeccion[0].total_ars) : undefined}>
                  {proyeccionResponse?.data?.proyeccion?.[0]
                    ? formatCurrencyCompact(proyeccionResponse.data.proyeccion[0].total_ars)
                    : '--'}
                </p>
                <p className="text-xs text-muted-foreground mt-1">
                  {proyeccionResponse?.data?.proyeccion?.[0]?.cantidad_gastos ?? 0} gastos proyectados →
                </p>
              </div>
              <TrendingUp className="h-10 w-10 text-muted-foreground" />
            </div>
          </CardContent>
        </Card>
        )}
      </div>
      )}

      {/* 6. Charts Row */}
      {(isSectionVisible('gastos_categoria') || isSectionVisible('ingresos_vs_gastos')) && (
      <div className="grid gap-3 md:gap-4 md:grid-cols-2">
        {/* Gastos por Categoría - Pie Chart */}
        {isSectionVisible('gastos_categoria') && <Card>
          <CardHeader>
            <CardTitle className="text-lg">Gastos por Categoría</CardTitle>
            <CardDescription>
              Distribución del mes de {format(now, 'MMMM', { locale: es })}
            </CardDescription>
          </CardHeader>
          <CardContent>
            {topCategorias.length > 0 ? (
              <div className="flex flex-col lg:flex-row items-center gap-4">
                <div className="h-[200px] w-full lg:w-1/2">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={topCategorias}
                        cx="50%"
                        cy="50%"
                        innerRadius={40}
                        outerRadius={80}
                        paddingAngle={2}
                        dataKey="value"
                        className="cursor-pointer"
                        onClick={(data) => {
                          if (data?.name && data.name !== 'Otros') {
                            const cat = categorias.find((c: { id: number; nombre_categoria: string }) => c.nombre_categoria === data.name)
                            if (cat) router.push(`/gastos?categoria=${cat.id}`)
                          }
                        }}
                      >
                        {topCategorias.map((_, index) => (
                          <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} className="cursor-pointer" />
                        ))}
                      </Pie>
                      <Tooltip
                        content={({ active, payload }) => {
                          if (!active || !payload?.length) return null
                          const data = payload[0].payload
                          return (
                            <div className="bg-card border rounded-lg p-2 shadow-lg">
                              <p className="font-medium">{data.name}</p>
                              <p className="text-sm text-muted-foreground">
                                {formatCurrency(data.value)}
                              </p>
                            </div>
                          )
                        }}
                      />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
                <div className="w-full lg:w-1/2 space-y-2 min-w-0">
                  {topCategorias.slice(0, 5).map((cat, index) => {
                    const catObj = categorias.find((c: { id: number; nombre_categoria: string }) => c.nombre_categoria === cat.name)
                    return (
                      <div
                        key={cat.name}
                        className={cn("flex items-center justify-between gap-2 text-sm min-w-0", catObj && "cursor-pointer hover:bg-accent/50 rounded px-1 -mx-1 py-0.5")}
                        onClick={() => catObj && router.push(`/gastos?categoria=${catObj.id}`)}
                      >
                        <div className="flex items-center gap-2 min-w-0">
                          <div
                            className="w-3 h-3 rounded-full shrink-0"
                            style={{ backgroundColor: COLORS[index % COLORS.length] }}
                          />
                          <span className="truncate">{cat.name}</span>
                        </div>
                        <span className="font-medium shrink-0">{formatCurrencyCompact(cat.value)}</span>
                      </div>
                    )
                  })}
                </div>
              </div>
            ) : (
              <p className="text-sm text-muted-foreground text-center py-8">
                No hay gastos este mes
              </p>
            )}
          </CardContent>
        </Card>}

        {/* Evolución Mensual - Bar Chart Ingresos vs Gastos */}
        {isSectionVisible('ingresos_vs_gastos') && <Card>
          <CardHeader>
            <CardTitle className="text-lg">Ingresos vs Gastos</CardTitle>
            <CardDescription>
              Comparación de los últimos 4 meses
            </CardDescription>
          </CardHeader>
          <CardContent>
            {balancePorMes.some(m => m.gastos > 0 || m.ingresos > 0) ? (
              <div className="h-[200px] w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={balancePorMes} className="cursor-pointer" onClick={(state: any) => {
                    if (state?.activePayload?.[0]?.payload) {
                      const d = state.activePayload[0].payload
                      router.push(`/gastos?dateFrom=${d.dateFrom}&dateTo=${d.dateTo}`)
                    }
                  }}>
                    <XAxis
                      dataKey="mes"
                      tick={{ fontSize: 12 }}
                      tickLine={false}
                      axisLine={false}
                    />
                    <YAxis
                      tick={{ fontSize: 12 }}
                      tickLine={false}
                      axisLine={false}
                      tickFormatter={(value) => `${(value / 1000).toFixed(0)}k`}
                    />
                    <Tooltip
                      formatter={(value: number, name: string) => [
                        formatCurrency(value),
                        name === 'ingresos' ? 'Ingresos' : 'Gastos'
                      ]}
                      contentStyle={{
                        backgroundColor: 'hsl(var(--card))',
                        border: '1px solid hsl(var(--border))',
                        borderRadius: '8px'
                      }}
                    />
                    <Bar
                      dataKey="ingresos"
                      fill="#22c55e"
                      radius={[4, 4, 0, 0]}
                      name="ingresos"
                    />
                    <Bar
                      dataKey="gastos"
                      fill="#ef4444"
                      radius={[4, 4, 0, 0]}
                      name="gastos"
                    />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            ) : (
              <p className="text-sm text-muted-foreground text-center py-8">
                No hay datos suficientes
              </p>
            )}
          </CardContent>
        </Card>}
      </div>
      )}

      {/* 7. Evolución Mensual - Tabla detallada */}
      {balanceData && balanceData.meses.length > 0 && isSectionVisible('evolucion_tabla') && (
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Evolución Mensual</CardTitle>
            <CardDescription>
              Detalle de ingresos, gastos y balance mes a mes
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b text-muted-foreground">
                    <th className="text-left py-2 pr-4 font-medium">Mes</th>
                    <th className="text-right py-2 px-4 font-medium">Ingresos</th>
                    <th className="text-right py-2 px-4 font-medium">Gastos</th>
                    <th className="text-right py-2 px-4 font-medium">Saldo</th>
                    <th className="text-right py-2 pl-4 font-medium">Acumulado</th>
                  </tr>
                </thead>
                <tbody>
                  {[...balanceData.meses].reverse().map((mes) => (
                    <tr key={mes.mes} className="border-b last:border-0">
                      <td className="py-2 pr-4 font-medium capitalize">
                        {format(new Date(`${mes.mes}-01`), 'MMM yyyy', { locale: es })}
                      </td>
                      <td className="text-right py-2 px-4">
                        <div className="text-green-600">{formatCurrencyCompact(mes.ingresos_ars)}</div>
                        {tcVenta && <div className="text-xs text-muted-foreground">{formatCurrencyCompact(mes.ingresos_ars / tcVenta, 'USD')}</div>}
                      </td>
                      <td className="text-right py-2 px-4">
                        <div className="text-red-600">{formatCurrencyCompact(mes.gastos_ars)}</div>
                        {tcVenta && <div className="text-xs text-muted-foreground">{formatCurrencyCompact(mes.gastos_ars / tcVenta, 'USD')}</div>}
                      </td>
                      <td className="text-right py-2 px-4 font-medium">
                        <div className={mes.saldo_ars >= 0 ? 'text-green-600' : 'text-red-600'}>
                          {mes.saldo_ars >= 0 ? '+' : ''}{formatCurrencyCompact(mes.saldo_ars)}
                        </div>
                        {tcVenta && <div className="text-xs text-muted-foreground">{mes.saldo_ars >= 0 ? '+' : ''}{formatCurrencyCompact(mes.saldo_ars / tcVenta, 'USD')}</div>}
                      </td>
                      <td className="text-right py-2 pl-4 font-semibold">
                        <div className={mes.acumulado_ars >= 0 ? 'text-blue-600' : 'text-red-600'}>
                          {formatCurrencyCompact(mes.acumulado_ars)}
                        </div>
                        {tcVenta && <div className="text-xs text-muted-foreground">{formatCurrencyCompact(mes.acumulado_ars / tcVenta, 'USD')}</div>}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      )}

      {/* 8. Recent Activity - Gastos Recientes (full width) */}
      {isSectionVisible('gastos_recientes') && <Card>
        <CardHeader>
          <CardTitle className="text-lg">Gastos Recientes</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {gastos.slice(0, 5).map((gasto) => (
              <div
                key={gasto.id}
                className="flex items-center justify-between cursor-pointer hover:bg-accent/50 rounded-lg px-2 -mx-2 py-1 transition-colors"
                onClick={() => router.push('/gastos')}
              >
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium truncate">
                    {gasto.descripcion}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {formatDate(gasto.fecha)}
                  </p>
                </div>
                <div className="text-sm font-semibold">
                  {formatCurrency(parseFloat(gasto.monto_ars))}
                </div>
              </div>
            ))}
            {gastos.length === 0 && (
              <p className="text-sm text-muted-foreground text-center py-4">
                No hay gastos registrados
              </p>
            )}
          </div>
        </CardContent>
      </Card>}
    </div>
  )
}
