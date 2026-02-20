'use client'

import { useMemo } from 'react'
import { useAuth } from '@/lib/auth/authContext'
import Link from 'next/link'
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
  CreditCard,
  ShoppingCart,
  Repeat,
  Receipt,
  Plus,
  RefreshCw,
  DollarSign,
  TrendingUp,
  TrendingDown,
  Minus,
  Heart,
  Calendar,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { useTarjetas } from '@/lib/hooks/useTarjetas'
import { useAllGastos } from '@/lib/hooks/useGastos'
import { useCompras } from '@/lib/hooks/useCompras'
import { useGastosRecurrentes } from '@/lib/hooks/useGastosRecurrentes'
import { useDebitosAutomaticos } from '@/lib/hooks/useDebitosAutomaticos'
import { useProcesarTodosPendientes } from '@/lib/hooks/useProcesamiento'
import { useTipoCambioActual, useActualizarTipoCambio } from '@/lib/hooks/useTipoCambio'
import { useSaludFinanciera, useProyeccion } from '@/lib/hooks/useAnalisis'
import { useIngresosUnicos } from '@/lib/hooks/useIngresosUnicos'
import { useIngresosRecurrentes } from '@/lib/hooks/useIngresosRecurrentes'
import { formatCurrency, formatCurrencyCompact } from '@/lib/utils/formatters'
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

const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884D8', '#82ca9d', '#ffc658', '#ff7300']

export default function DashboardPage() {
  const { user } = useAuth()
  const router = useRouter()

  const { data: tarjetasResponse } = useTarjetas()
  const { data: gastosResponse } = useAllGastos()
  const { data: comprasResponse } = useCompras()
  const { data: gastosRecurrentesResponse } = useGastosRecurrentes()
  const { data: debitosResponse } = useDebitosAutomaticos()
  const procesarPendientes = useProcesarTodosPendientes()
  const { data: tipoCambioResponse, isError: tipoCambioError } = useTipoCambioActual()
  const actualizarTipoCambio = useActualizarTipoCambio()
  const { data: saludResponse } = useSaludFinanciera('mes')
  const { data: proyeccionResponse } = useProyeccion(1)
  const { data: ingresosUnicosResponse } = useIngresosUnicos()
  const { data: ingresosRecurrentesResponse } = useIngresosRecurrentes()

  const tarjetas = tarjetasResponse?.data || []
  const ingresosUnicos = ingresosUnicosResponse?.data || []
  const ingresosRecurrentes = ingresosRecurrentesResponse?.data || []
  const gastos = gastosResponse?.data || []
  const compras = comprasResponse?.data || []
  const gastosRecurrentes = gastosRecurrentesResponse?.data || []
  const debitos = debitosResponse?.data || []

  const handleProcesarPendientes = () => {
    procesarPendientes.mutate()
  }

  const handleActualizarTipoCambio = () => {
    actualizarTipoCambio.mutate()
  }

  const tipoCambio = tipoCambioResponse?.data

  // Calcular gastos del mes actual y anterior
  const now = new Date()
  const startOfCurrentMonth = startOfMonth(now)
  const endOfCurrentMonth = endOfMonth(now)
  const startOfLastMonth = startOfMonth(subMonths(now, 1))
  const endOfLastMonth = endOfMonth(subMonths(now, 1))

  const gastosDelMes = useMemo(() =>
    gastos.filter((gasto) => {
      const fecha = new Date(gasto.fecha)
      return fecha >= startOfCurrentMonth && fecha <= endOfCurrentMonth
    }),
    [gastos, startOfCurrentMonth, endOfCurrentMonth]
  )

  const gastosDelMesAnterior = useMemo(() =>
    gastos.filter((gasto) => {
      const fecha = new Date(gasto.fecha)
      return fecha >= startOfLastMonth && fecha <= endOfLastMonth
    }),
    [gastos, startOfLastMonth, endOfLastMonth]
  )

  const totalGastosDelMes = gastosDelMes.reduce(
    (sum, gasto) => sum + parseFloat(gasto.monto_ars),
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
      const fecha = new Date(ingreso.fecha)
      return fecha >= startOfCurrentMonth && fecha <= endOfCurrentMonth
    }),
    [ingresosUnicos, startOfCurrentMonth, endOfCurrentMonth]
  )

  const totalIngresosUnicosDelMes = ingresosUnicosDelMes.reduce(
    (sum, ingreso) => sum + parseFloat(String(ingreso.monto_ars || 0)),
    0
  )

  // Ingresos recurrentes activos (estimado mensual)
  const totalIngresosRecurrentesMensual = useMemo(() =>
    ingresosRecurrentes
      .filter((i) => i.activo)
      .reduce((sum, i) => sum + parseFloat(String(i.monto_ars || 0)), 0),
    [ingresosRecurrentes]
  )

  // Total ingresos del mes (únicos + recurrentes activos)
  const totalIngresosDelMes = totalIngresosUnicosDelMes + totalIngresosRecurrentesMensual

  // Balance neto
  const balanceNeto = totalIngresosDelMes - totalGastosDelMes

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
    for (let i = 3; i >= 0; i--) {
      const mesDate = subMonths(now, i)
      const inicio = startOfMonth(mesDate)
      const fin = endOfMonth(mesDate)

      const totalGastos = gastos
        .filter((g) => {
          const fecha = new Date(g.fecha)
          return fecha >= inicio && fecha <= fin
        })
        .reduce((sum, g) => sum + parseFloat(g.monto_ars), 0)

      const totalIngresosU = ingresosUnicos
        .filter((i) => {
          const fecha = new Date(i.fecha)
          return fecha >= inicio && fecha <= fin
        })
        .reduce((sum, i) => sum + parseFloat(String(i.monto_ars || 0)), 0)

      // Para ingresos recurrentes, asumimos que aplican a todos los meses si están activos
      const totalIngresosR = ingresosRecurrentes
        .filter((i) => i.activo)
        .reduce((sum, i) => sum + parseFloat(String(i.monto_ars || 0)), 0)

      meses.push({
        mes: format(mesDate, 'MMM', { locale: es }),
        gastos: totalGastos,
        ingresos: totalIngresosU + totalIngresosR,
      })
    }
    return meses
  }, [gastos, ingresosUnicos, ingresosRecurrentes, now])

  const comprasPendientes = compras.filter((c) => c.pendiente_cuotas).length
  const gastosRecurrentesActivos = gastosRecurrentes.filter((g) => g.activo).length
  const debitosActivos = debitos.filter((d) => d.activo).length

  // Promedio mensual proyectado (gastos fijos)
  const gastosFijosProyectados = useMemo(() => {
    const recurrentes = gastosRecurrentes
      .filter((g) => g.activo)
      .reduce((sum, g) => sum + g.monto, 0)

    const debitosSum = debitos
      .filter((d) => d.activo)
      .reduce((sum, d) => sum + d.monto, 0)

    return recurrentes + debitosSum
  }, [gastosRecurrentes, debitos])

  return (
    <div className="space-y-4 md:space-y-6">
      {/* Exchange Rate Alert */}
      {(tipoCambioError || !tipoCambio) && (
        <Card className="border-orange-500 bg-orange-50 dark:bg-orange-950">
          <CardContent className="flex flex-col gap-3 py-4 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex items-center gap-3">
              <DollarSign className="h-5 w-5 text-orange-600 shrink-0" />
              <div>
                <p className="font-medium text-orange-800 dark:text-orange-200">
                  Tipo de cambio no configurado
                </p>
                <p className="text-sm text-orange-600 dark:text-orange-300">
                  Para registrar gastos en USD necesitas cargar el tipo de cambio
                </p>
              </div>
            </div>
            <Button
              onClick={handleActualizarTipoCambio}
              disabled={actualizarTipoCambio.isPending}
              variant="outline"
              size="sm"
              className="gap-2 border-orange-500 text-orange-700 hover:bg-orange-100 w-full sm:w-auto"
            >
              <RefreshCw className={`h-4 w-4 ${actualizarTipoCambio.isPending ? 'animate-spin' : ''}`} />
              {actualizarTipoCambio.isPending ? 'Actualizando...' : 'Cargar Tipo de Cambio'}
            </Button>
          </CardContent>
        </Card>
      )}

      {/* Exchange Rate Info (when available) */}
      {tipoCambio && !tipoCambioError && (
        <Card className="border-green-500 bg-green-50 dark:bg-green-950">
          <CardContent className="flex flex-col gap-3 py-4 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex items-center gap-3">
              <DollarSign className="h-5 w-5 text-green-600 shrink-0" />
              <div>
                <p className="font-medium text-green-800 dark:text-green-200">
                  Tipo de cambio: ${tipoCambio.valor_venta_usd_ars?.toLocaleString('es-AR')} ARS/USD
                </p>
                <p className="text-sm text-green-600 dark:text-green-300">
                  Fuente: {tipoCambio.fuente} - Actualizado: {tipoCambio.fecha}
                </p>
              </div>
            </div>
            <Button
              onClick={handleActualizarTipoCambio}
              disabled={actualizarTipoCambio.isPending}
              variant="ghost"
              size="sm"
              className="gap-2 w-full sm:w-auto"
            >
              <RefreshCw className={`h-4 w-4 ${actualizarTipoCambio.isPending ? 'animate-spin' : ''}`} />
              Actualizar
            </Button>
          </CardContent>
        </Card>
      )}

      {/* Welcome */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold md:text-3xl">Hola, {user?.nombre}!</h1>
          <p className="text-sm text-muted-foreground md:text-base">
            Aquí está el resumen de tus finanzas personales
          </p>
        </div>
        <Button
          onClick={handleProcesarPendientes}
          disabled={procesarPendientes.isPending}
          variant="outline"
          size="sm"
          className="gap-2 w-full sm:w-auto"
        >
          <RefreshCw className={`h-4 w-4 ${procesarPendientes.isPending ? 'animate-spin' : ''}`} />
          {procesarPendientes.isPending ? 'Procesando...' : 'Procesar Pendientes'}
        </Button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 gap-3 md:grid-cols-2 lg:grid-cols-4 md:gap-4">
        <Card className="overflow-hidden">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Gastos del Mes
            </CardTitle>
            <Receipt className="h-4 w-4 text-muted-foreground shrink-0" />
          </CardHeader>
          <CardContent>
            <div className="text-lg sm:text-xl md:text-2xl font-bold truncate" title={formatCurrency(totalGastosDelMes)}>
              {formatCurrencyCompact(totalGastosDelMes)}
            </div>
            <div className="flex items-center gap-1 text-xs text-muted-foreground">
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

        <Card className="overflow-hidden">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Tarjetas</CardTitle>
            <CreditCard className="h-4 w-4 text-muted-foreground shrink-0" />
          </CardHeader>
          <CardContent>
            <div className="text-lg sm:text-xl md:text-2xl font-bold">{tarjetas.length}</div>
            <p className="text-xs text-muted-foreground">
              {tarjetas.filter((t) => t.tipo === 'credito').length} crédito,{' '}
              {tarjetas.filter((t) => t.tipo === 'debito').length} débito
            </p>
          </CardContent>
        </Card>

        <Card className="overflow-hidden">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Compras en Cuotas
            </CardTitle>
            <ShoppingCart className="h-4 w-4 text-muted-foreground shrink-0" />
          </CardHeader>
          <CardContent>
            <div className="text-lg sm:text-xl md:text-2xl font-bold">{comprasPendientes}</div>
            <p className="text-xs text-muted-foreground">
              Con cuotas pendientes
            </p>
          </CardContent>
        </Card>

        <Card className="overflow-hidden">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Gastos Fijos
            </CardTitle>
            <Repeat className="h-4 w-4 text-muted-foreground shrink-0" />
          </CardHeader>
          <CardContent>
            <div className="text-lg sm:text-xl md:text-2xl font-bold truncate" title={formatCurrency(gastosFijosProyectados)}>
              {formatCurrencyCompact(gastosFijosProyectados)}
            </div>
            <p className="text-xs text-muted-foreground">
              {gastosRecurrentesActivos} recurrentes, {debitosActivos} débitos
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Income & Balance Cards */}
      <div className="grid grid-cols-2 gap-3 md:grid-cols-3 md:gap-4">
        <Card className="overflow-hidden">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Ingresos del Mes
            </CardTitle>
            <TrendingUp className="h-4 w-4 text-green-500 shrink-0" />
          </CardHeader>
          <CardContent>
            <div className="text-lg sm:text-xl md:text-2xl font-bold truncate text-green-600" title={formatCurrency(totalIngresosDelMes)}>
              {formatCurrencyCompact(totalIngresosDelMes)}
            </div>
            <p className="text-xs text-muted-foreground">
              {ingresosRecurrentes.filter(i => i.activo).length} fijos + {ingresosUnicosDelMes.length} únicos
            </p>
          </CardContent>
        </Card>

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
            <div
              className={`text-lg sm:text-xl md:text-2xl font-bold truncate ${balanceNeto >= 0 ? 'text-green-600' : 'text-red-600'}`}
              title={formatCurrency(Math.abs(balanceNeto))}
            >
              {balanceNeto >= 0 ? '+' : '-'}{formatCurrencyCompact(Math.abs(balanceNeto))}
            </div>
            <p className="text-xs text-muted-foreground">
              Ingresos - Gastos
            </p>
          </CardContent>
        </Card>

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
      </div>

      {/* Quick Insights - Salud Financiera y Proyecciones */}
      <div className="grid gap-3 md:gap-4 md:grid-cols-2">
        {/* Salud Financiera Widget */}
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

        {/* Proyección Widget */}
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
      </div>

      {/* Charts Row */}
      <div className="grid gap-3 md:gap-4 md:grid-cols-2">
        {/* Gastos por Categoría - Pie Chart */}
        <Card>
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
                      >
                        {topCategorias.map((_, index) => (
                          <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                        ))}
                      </Pie>
                      <Tooltip
                        formatter={(value: number) => formatCurrency(value)}
                        contentStyle={{
                          backgroundColor: 'hsl(var(--card))',
                          border: '1px solid hsl(var(--border))',
                          borderRadius: '8px'
                        }}
                      />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
                <div className="w-full lg:w-1/2 space-y-2">
                  {topCategorias.slice(0, 5).map((cat, index) => (
                    <div key={cat.name} className="flex items-center justify-between text-sm">
                      <div className="flex items-center gap-2">
                        <div
                          className="w-3 h-3 rounded-full"
                          style={{ backgroundColor: COLORS[index % COLORS.length] }}
                        />
                        <span className="truncate max-w-[120px]">{cat.name}</span>
                      </div>
                      <span className="font-medium">{formatCurrency(cat.value)}</span>
                    </div>
                  ))}
                </div>
              </div>
            ) : (
              <p className="text-sm text-muted-foreground text-center py-8">
                No hay gastos este mes
              </p>
            )}
          </CardContent>
        </Card>

        {/* Evolución Mensual - Bar Chart Ingresos vs Gastos */}
        <Card>
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
                  <BarChart data={balancePorMes}>
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
        </Card>
      </div>

      {/* Quick Actions - Hidden on mobile (using BottomNav instead) */}
      <Card className="hidden md:block">
        <CardHeader>
          <CardTitle>Acciones Rápidas</CardTitle>
          <CardDescription>
            Gestiona tus finanzas rápidamente
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-3">
            <Link href="/gastos-unicos">
              <Card className="cursor-pointer hover:bg-accent transition-colors">
                <CardHeader>
                  <CardTitle className="text-lg flex items-center gap-2">
                    <Plus className="h-5 w-5" />
                    Nuevo Gasto
                  </CardTitle>
                  <CardDescription>Registra un gasto único</CardDescription>
                </CardHeader>
              </Card>
            </Link>

            <Link href="/compras">
              <Card className="cursor-pointer hover:bg-accent transition-colors">
                <CardHeader>
                  <CardTitle className="text-lg flex items-center gap-2">
                    <Plus className="h-5 w-5" />
                    Nueva Compra
                  </CardTitle>
                  <CardDescription>
                    Registra una compra en cuotas
                  </CardDescription>
                </CardHeader>
              </Card>
            </Link>

            <Link href="/tarjetas">
              <Card className="cursor-pointer hover:bg-accent transition-colors">
                <CardHeader>
                  <CardTitle className="text-lg flex items-center gap-2">
                    <Plus className="h-5 w-5" />
                    Nueva Tarjeta
                  </CardTitle>
                  <CardDescription>Agrega una tarjeta nueva</CardDescription>
                </CardHeader>
              </Card>
            </Link>
          </div>
        </CardContent>
      </Card>

      {/* Recent Activity */}
      <div className="grid gap-3 md:gap-4 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Gastos Recientes</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {gastos.slice(0, 5).map((gasto) => (
                <div
                  key={gasto.id}
                  className="flex items-center justify-between"
                >
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium truncate">
                      {gasto.descripcion}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {format(new Date(gasto.fecha), 'dd/MM/yyyy')}
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
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Mis Tarjetas</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {tarjetas.slice(0, 5).map((tarjeta) => (
                <div
                  key={tarjeta.id}
                  className="flex items-center justify-between"
                >
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium truncate">
                      {tarjeta.nombre}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {tarjeta.banco}
                    </p>
                  </div>
                  <Badge
                    variant={
                      tarjeta.tipo === 'credito'
                        ? 'default'
                        : tarjeta.tipo === 'debito'
                          ? 'secondary'
                          : 'outline'
                    }
                  >
                    {tarjeta.tipo}
                  </Badge>
                </div>
              ))}
              {tarjetas.length === 0 && (
                <p className="text-sm text-muted-foreground text-center py-4">
                  No hay tarjetas registradas
                </p>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
