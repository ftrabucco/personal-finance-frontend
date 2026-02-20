'use client'

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
  TrendingUp,
  TrendingDown,
  Calendar,
  DollarSign,
  RefreshCcw,
  ChevronDown,
  ChevronUp,
  Wallet,
  ArrowUpCircle,
  ArrowDownCircle,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { useProyeccion } from '@/lib/hooks/useAnalisis'
import { useIngresosRecurrentes } from '@/lib/hooks/useIngresosRecurrentes'
import { useFrecuencias } from '@/lib/hooks/useCatalogos'
import { formatCurrency, formatCurrencyCompact } from '@/lib/utils/formatters'
import { format, parseISO, addMonths, startOfMonth, isAfter, isBefore, isEqual } from 'date-fns'
import { es } from 'date-fns/locale'
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  ComposedChart,
  Bar,
  Line,
  ReferenceLine,
} from 'recharts'
import type { ProyeccionMensual, GastoProyectado, IngresoRecurrente, Frecuencia } from '@/types'

// Interfaz para ingreso proyectado
interface IngresoProyectado {
  id: number
  descripcion: string
  monto_ars: number
  monto_usd: number
  fecha_proyectada: string
  fuente: string
}

const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884d8', '#82ca9d']

// Función para proyectar ingresos recurrentes
function proyectarIngresos(
  ingresosRecurrentes: IngresoRecurrente[],
  frecuencias: Frecuencia[],
  meses: number
): Map<string, IngresoProyectado[]> {
  const proyeccion = new Map<string, IngresoProyectado[]>()
  const hoy = new Date()

  // Inicializar meses
  for (let i = 0; i < meses; i++) {
    const mesDate = addMonths(startOfMonth(hoy), i + 1)
    const mesKey = format(mesDate, 'yyyy-MM')
    proyeccion.set(mesKey, [])
  }

  // Para cada ingreso recurrente activo
  ingresosRecurrentes.filter(ing => ing.activo).forEach(ingreso => {
    const frecuencia = frecuencias.find(f => f.id === ingreso.frecuencia_gasto_id)
    const frecNombre = frecuencia?.nombre_frecuencia?.toLowerCase() || 'mensual'

    // Verificar fechas de vigencia
    const fechaInicio = ingreso.fecha_inicio ? parseISO(ingreso.fecha_inicio) : null
    const fechaFin = ingreso.fecha_fin ? parseISO(ingreso.fecha_fin) : null

    for (let i = 0; i < meses; i++) {
      const mesDate = addMonths(startOfMonth(hoy), i + 1)
      const mesKey = format(mesDate, 'yyyy-MM')
      const mesNum = mesDate.getMonth() + 1 // 1-12

      // Verificar si está dentro del rango de fechas
      if (fechaInicio && isBefore(mesDate, startOfMonth(fechaInicio))) continue
      if (fechaFin && isAfter(mesDate, startOfMonth(fechaFin))) continue

      let aplicaEsteMes = false

      switch (frecNombre) {
        case 'mensual':
          aplicaEsteMes = true
          break
        case 'quincenal':
          aplicaEsteMes = true // Simplificado: 2 ingresos por mes
          break
        case 'semanal':
          aplicaEsteMes = true // Simplificado: ~4 ingresos por mes
          break
        case 'anual':
          aplicaEsteMes = ingreso.mes_de_pago === mesNum
          break
        case 'semestral':
          // Asumimos que aplica cada 6 meses desde mes_de_pago
          if (ingreso.mes_de_pago) {
            aplicaEsteMes = (mesNum - ingreso.mes_de_pago) % 6 === 0
          }
          break
        case 'trimestral':
          if (ingreso.mes_de_pago) {
            aplicaEsteMes = (mesNum - ingreso.mes_de_pago) % 3 === 0
          } else {
            aplicaEsteMes = [3, 6, 9, 12].includes(mesNum)
          }
          break
        default:
          aplicaEsteMes = true
      }

      if (aplicaEsteMes) {
        const fechaProyectada = new Date(mesDate.getFullYear(), mesDate.getMonth(), ingreso.dia_de_pago)
        let montoMultiplier = 1

        // Ajustar por frecuencia
        if (frecNombre === 'quincenal') montoMultiplier = 2
        if (frecNombre === 'semanal') montoMultiplier = 4

        const ingresoProyectado: IngresoProyectado = {
          id: ingreso.id,
          descripcion: ingreso.descripcion,
          monto_ars: (ingreso.monto_ars || 0) * montoMultiplier,
          monto_usd: (ingreso.monto_usd || 0) * montoMultiplier,
          fecha_proyectada: format(fechaProyectada, 'yyyy-MM-dd'),
          fuente: ingreso.fuenteIngreso?.nombre || 'Otro'
        }

        const listaActual = proyeccion.get(mesKey) || []
        listaActual.push(ingresoProyectado)
        proyeccion.set(mesKey, listaActual)
      }
    }
  })

  return proyeccion
}

export default function ProyeccionesPage() {
  const [mesesProyeccion, setMesesProyeccion] = useState('6')
  const [expandedMonths, setExpandedMonths] = useState<string[]>([])

  const { data: proyeccionResponse, isLoading: isLoadingProyeccion, refetch, isFetching } = useProyeccion(
    parseInt(mesesProyeccion)
  )
  const { data: ingresosRecurrentesResponse, isLoading: isLoadingIngresos } = useIngresosRecurrentes()
  const { data: frecuenciasResponse, isLoading: isLoadingFrecuencias } = useFrecuencias()

  const proyeccion = proyeccionResponse?.data
  const ingresosRecurrentes = ingresosRecurrentesResponse?.data || []
  const frecuencias = frecuenciasResponse?.data || []

  const isLoading = isLoadingProyeccion || isLoadingIngresos || isLoadingFrecuencias

  // Proyectar ingresos
  const ingresosProyectados = useMemo(() => {
    if (!frecuencias.length) return new Map<string, IngresoProyectado[]>()
    return proyectarIngresos(ingresosRecurrentes, frecuencias, parseInt(mesesProyeccion))
  }, [ingresosRecurrentes, frecuencias, mesesProyeccion])

  // Format month name
  const formatMes = (mesString: string) => {
    const [year, month] = mesString.split('-')
    const date = new Date(parseInt(year), parseInt(month) - 1, 1)
    return format(date, 'MMMM yyyy', { locale: es })
  }

  // Calcular totales de ingresos proyectados
  const resumenIngresos = useMemo(() => {
    let totalArs = 0
    let totalUsd = 0
    let cantidadIngresos = 0

    ingresosProyectados.forEach((ingresos) => {
      ingresos.forEach(ing => {
        totalArs += ing.monto_ars
        totalUsd += ing.monto_usd
        cantidadIngresos++
      })
    })

    return {
      total_ars: totalArs,
      total_usd: totalUsd,
      cantidad: cantidadIngresos,
      promedio_mensual: totalArs / parseInt(mesesProyeccion)
    }
  }, [ingresosProyectados, mesesProyeccion])

  // Prepare chart data con ingresos y balance
  const chartData = useMemo(() => {
    if (!proyeccion?.proyeccion) return []
    return proyeccion.proyeccion.map((mes) => {
      const ingresosDelMes = ingresosProyectados.get(mes.mes) || []
      const totalIngresosArs = ingresosDelMes.reduce((sum, ing) => sum + ing.monto_ars, 0)
      const balance = totalIngresosArs - mes.total_ars

      return {
        mes: formatMes(mes.mes),
        mesKey: mes.mes,
        gastos: mes.total_ars,
        ingresos: totalIngresosArs,
        balance: balance,
        cantidadGastos: mes.cantidad_gastos,
        cantidadIngresos: ingresosDelMes.length,
      }
    })
  }, [proyeccion, ingresosProyectados])

  // Calcular balance total proyectado
  const balanceProyectado = useMemo(() => {
    return resumenIngresos.total_ars - (proyeccion?.resumen?.total_ars || 0)
  }, [resumenIngresos, proyeccion])

  // Group expenses by type for each month
  const getExpensesByType = (gastos: GastoProyectado[]) => {
    const grouped = gastos.reduce(
      (acc, gasto) => {
        if (!acc[gasto.tipo]) {
          acc[gasto.tipo] = { total: 0, cantidad: 0 }
        }
        acc[gasto.tipo].total += gasto.monto_ars
        acc[gasto.tipo].cantidad++
        return acc
      },
      {} as Record<string, { total: number; cantidad: number }>
    )
    return grouped
  }

  // Toggle month expansion
  const toggleMonth = (mes: string) => {
    setExpandedMonths((prev) =>
      prev.includes(mes) ? prev.filter((m) => m !== mes) : [...prev, mes]
    )
  }

  // Get type label in Spanish
  const getTipoLabel = (tipo: string) => {
    switch (tipo) {
      case 'recurrente':
        return 'Gastos Recurrentes'
      case 'debito_automatico':
        return 'Débitos Automáticos'
      case 'compra':
        return 'Cuotas de Compras'
      default:
        return tipo
    }
  }

  // Get badge variant for expense type
  const getTipoBadgeVariant = (tipo: string) => {
    switch (tipo) {
      case 'recurrente':
        return 'default'
      case 'debito_automatico':
        return 'secondary'
      case 'compra':
        return 'outline'
      default:
        return 'default'
    }
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <TrendingUp className="h-12 w-12 text-muted-foreground animate-pulse mx-auto mb-4" />
          <p className="text-muted-foreground">Calculando proyecciones...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-4 md:space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold md:text-3xl">Proyección Financiera</h1>
          <p className="text-sm text-muted-foreground md:text-base">
            Visualiza tu balance futuro basado en ingresos y gastos comprometidos
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Select value={mesesProyeccion} onValueChange={setMesesProyeccion}>
            <SelectTrigger className="w-[140px]">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="3">3 meses</SelectItem>
              <SelectItem value="6">6 meses</SelectItem>
              <SelectItem value="9">9 meses</SelectItem>
              <SelectItem value="12">12 meses</SelectItem>
            </SelectContent>
          </Select>

          <Button
            variant="outline"
            size="icon"
            onClick={() => refetch()}
            disabled={isFetching}
          >
            <RefreshCcw className={`h-4 w-4 ${isFetching ? 'animate-spin' : ''}`} />
          </Button>
        </div>
      </div>

      {/* Summary Cards */}
      {proyeccion && (
        <div className="grid gap-4 grid-cols-2 lg:grid-cols-4">
          {/* Gastos Proyectados */}
          <Card className="bg-red-500/5 border-red-500/20">
            <CardContent className="pt-6">
              <div className="flex items-center gap-2 mb-2">
                <ArrowDownCircle className="h-5 w-5 text-red-500 flex-shrink-0" />
                <span className="text-sm text-muted-foreground">Gastos Proyectados</span>
              </div>
              <p className="text-xl sm:text-2xl font-bold text-red-600 truncate" title={formatCurrency(proyeccion.resumen.total_ars)}>
                {formatCurrencyCompact(proyeccion.resumen.total_ars)}
              </p>
              <p className="text-xs text-muted-foreground mt-1">
                {proyeccion.proyeccion.reduce((sum, m) => sum + m.cantidad_gastos, 0)} gastos en {proyeccion.resumen.meses_proyectados} meses
              </p>
            </CardContent>
          </Card>

          {/* Ingresos Proyectados */}
          <Card className="bg-green-500/5 border-green-500/20">
            <CardContent className="pt-6">
              <div className="flex items-center gap-2 mb-2">
                <ArrowUpCircle className="h-5 w-5 text-green-500 flex-shrink-0" />
                <span className="text-sm text-muted-foreground">Ingresos Proyectados</span>
              </div>
              <p className="text-xl sm:text-2xl font-bold text-green-600 truncate" title={formatCurrency(resumenIngresos.total_ars)}>
                {formatCurrencyCompact(resumenIngresos.total_ars)}
              </p>
              <p className="text-xs text-muted-foreground mt-1">
                {resumenIngresos.cantidad} ingresos recurrentes
              </p>
            </CardContent>
          </Card>

          {/* Balance Proyectado */}
          <Card className={balanceProyectado >= 0 ? "bg-primary/5 border-primary/20" : "bg-orange-500/5 border-orange-500/20"}>
            <CardContent className="pt-6">
              <div className="flex items-center gap-2 mb-2">
                <Wallet className="h-5 w-5 flex-shrink-0" />
                <span className="text-sm text-muted-foreground">Balance Proyectado</span>
              </div>
              <p className={`text-xl sm:text-2xl font-bold truncate ${balanceProyectado >= 0 ? 'text-primary' : 'text-orange-600'}`} title={formatCurrency(balanceProyectado)}>
                {balanceProyectado >= 0 ? '+' : ''}{formatCurrencyCompact(balanceProyectado)}
              </p>
              <p className="text-xs text-muted-foreground mt-1">
                {balanceProyectado >= 0 ? 'Capacidad de ahorro' : 'Déficit proyectado'}
              </p>
            </CardContent>
          </Card>

          {/* Promedio Mensual */}
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center gap-2 mb-2">
                <Calendar className="h-5 w-5 text-muted-foreground flex-shrink-0" />
                <span className="text-sm text-muted-foreground">Promedio Mensual</span>
              </div>
              <div className="space-y-1">
                <p className="text-sm">
                  <span className="text-red-600 font-semibold">{formatCurrencyCompact(proyeccion.resumen.promedio_mensual_ars)}</span>
                  <span className="text-muted-foreground"> gastos</span>
                </p>
                <p className="text-sm">
                  <span className="text-green-600 font-semibold">{formatCurrencyCompact(resumenIngresos.promedio_mensual)}</span>
                  <span className="text-muted-foreground"> ingresos</span>
                </p>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Chart */}
      {chartData.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Evolución Proyectada</CardTitle>
            <CardDescription>
              Comparativa de ingresos, gastos y balance mes a mes
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-[350px]">
              <ResponsiveContainer width="100%" height="100%">
                <ComposedChart data={chartData}>
                  <defs>
                    <linearGradient id="colorIngresos" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#22c55e" stopOpacity={0.3} />
                      <stop offset="95%" stopColor="#22c55e" stopOpacity={0} />
                    </linearGradient>
                    <linearGradient id="colorGastos" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#ef4444" stopOpacity={0.3} />
                      <stop offset="95%" stopColor="#ef4444" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                  <XAxis
                    dataKey="mes"
                    tick={{ fontSize: 11 }}
                    tickLine={false}
                    axisLine={false}
                    angle={-15}
                    textAnchor="end"
                    height={60}
                  />
                  <YAxis
                    tickFormatter={(value) => `$${(value / 1000).toFixed(0)}k`}
                    tick={{ fontSize: 12 }}
                    tickLine={false}
                    axisLine={false}
                  />
                  <ReferenceLine y={0} stroke="#888" strokeDasharray="3 3" />
                  <Tooltip
                    content={({ active, payload }) => {
                      if (!active || !payload?.length) return null
                      const data = payload[0].payload
                      return (
                        <div className="bg-background border rounded-lg p-3 shadow-lg min-w-[180px]">
                          <p className="font-semibold capitalize mb-2">{data.mes}</p>
                          <div className="space-y-1">
                            <p className="flex justify-between">
                              <span className="text-green-600">Ingresos:</span>
                              <span className="font-medium">{formatCurrency(data.ingresos)}</span>
                            </p>
                            <p className="flex justify-between">
                              <span className="text-red-600">Gastos:</span>
                              <span className="font-medium">{formatCurrency(data.gastos)}</span>
                            </p>
                            <hr className="my-1" />
                            <p className="flex justify-between">
                              <span className={data.balance >= 0 ? 'text-primary' : 'text-orange-600'}>Balance:</span>
                              <span className={`font-bold ${data.balance >= 0 ? 'text-primary' : 'text-orange-600'}`}>
                                {data.balance >= 0 ? '+' : ''}{formatCurrency(data.balance)}
                              </span>
                            </p>
                          </div>
                          <p className="text-xs text-muted-foreground mt-2">
                            {data.cantidadIngresos} ingresos • {data.cantidadGastos} gastos
                          </p>
                        </div>
                      )
                    }}
                  />
                  <Bar
                    dataKey="ingresos"
                    fill="#22c55e"
                    fillOpacity={0.8}
                    radius={[4, 4, 0, 0]}
                    name="Ingresos"
                  />
                  <Bar
                    dataKey="gastos"
                    fill="#ef4444"
                    fillOpacity={0.8}
                    radius={[4, 4, 0, 0]}
                    name="Gastos"
                  />
                  <Line
                    type="monotone"
                    dataKey="balance"
                    stroke="hsl(var(--primary))"
                    strokeWidth={3}
                    dot={{ fill: 'hsl(var(--primary))', strokeWidth: 2, r: 4 }}
                    name="Balance"
                  />
                </ComposedChart>
              </ResponsiveContainer>
            </div>
            <div className="flex justify-center gap-6 mt-4 text-sm">
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded bg-green-500" />
                <span className="text-muted-foreground">Ingresos</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded bg-red-500" />
                <span className="text-muted-foreground">Gastos</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-full bg-primary" />
                <span className="text-muted-foreground">Balance</span>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Monthly breakdown */}
      <div className="space-y-4">
        <h2 className="text-xl font-semibold">Detalle por Mes</h2>

        {proyeccion?.proyeccion.map((mes: ProyeccionMensual) => {
          const isExpanded = expandedMonths.includes(mes.mes)
          const expensesByType = getExpensesByType(mes.gastos)
          const ingresosDelMes = ingresosProyectados.get(mes.mes) || []
          const totalIngresosDelMes = ingresosDelMes.reduce((sum, ing) => sum + ing.monto_ars, 0)
          const balanceDelMes = totalIngresosDelMes - mes.total_ars

          return (
            <Card key={mes.mes}>
              <CardHeader
                className="cursor-pointer hover:bg-muted/50 transition-colors"
                onClick={() => toggleMonth(mes.mes)}
              >
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle className="capitalize">{formatMes(mes.mes)}</CardTitle>
                    <CardDescription>
                      {ingresosDelMes.length} ingresos • {mes.cantidad_gastos} gastos
                    </CardDescription>
                  </div>
                  <div className="flex items-center gap-4">
                    <div className="text-right space-y-1">
                      <div className="flex items-center gap-2 justify-end">
                        <span className="text-sm text-green-600">+{formatCurrencyCompact(totalIngresosDelMes)}</span>
                        <span className="text-sm text-red-600">-{formatCurrencyCompact(mes.total_ars)}</span>
                      </div>
                      <p className={`text-lg font-bold ${balanceDelMes >= 0 ? 'text-primary' : 'text-orange-600'}`}>
                        {balanceDelMes >= 0 ? '+' : ''}{formatCurrency(balanceDelMes)}
                      </p>
                    </div>
                    {isExpanded ? (
                      <ChevronUp className="h-5 w-5 text-muted-foreground" />
                    ) : (
                      <ChevronDown className="h-5 w-5 text-muted-foreground" />
                    )}
                  </div>
                </div>
              </CardHeader>

              {isExpanded && (
                <CardContent className="pt-0">
                  {/* Ingresos del mes */}
                  {ingresosDelMes.length > 0 && (
                    <div className="mb-4">
                      <h4 className="text-sm font-medium text-green-600 mb-2 flex items-center gap-2">
                        <ArrowUpCircle className="h-4 w-4" />
                        Ingresos Proyectados
                      </h4>
                      <div className="space-y-2">
                        {ingresosDelMes.map((ingreso, index) => (
                          <div
                            key={`ingreso-${ingreso.id}-${index}`}
                            className="flex items-center justify-between p-3 bg-green-500/5 border border-green-500/20 rounded-lg"
                          >
                            <div className="flex-1">
                              <div className="flex items-center gap-2 mb-1">
                                <span className="font-medium">{ingreso.descripcion}</span>
                                <Badge variant="outline" className="text-xs text-green-600 border-green-600">
                                  {ingreso.fuente}
                                </Badge>
                              </div>
                              <p className="text-xs text-muted-foreground">
                                {format(parseISO(ingreso.fecha_proyectada), 'd MMM', { locale: es })}
                              </p>
                            </div>
                            <div className="text-right">
                              <p className="font-semibold text-green-600">+{formatCurrency(ingreso.monto_ars)}</p>
                              {ingreso.monto_usd > 0 && (
                                <p className="text-xs text-muted-foreground">
                                  US$ {ingreso.monto_usd.toFixed(2)}
                                </p>
                              )}
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Summary by type (gastos) */}
                  <h4 className="text-sm font-medium text-red-600 mb-2 flex items-center gap-2">
                    <ArrowDownCircle className="h-4 w-4" />
                    Gastos Proyectados
                  </h4>
                  <div className="grid gap-3 mb-4 md:grid-cols-3">
                    {Object.entries(expensesByType).map(([tipo, data]) => (
                      <div
                        key={tipo}
                        className="p-3 bg-muted/50 rounded-lg"
                      >
                        <Badge variant={getTipoBadgeVariant(tipo)} className="mb-2">
                          {getTipoLabel(tipo)}
                        </Badge>
                        <p className="text-lg font-semibold">{formatCurrency(data.total)}</p>
                        <p className="text-xs text-muted-foreground">
                          {data.cantidad} {data.cantidad === 1 ? 'gasto' : 'gastos'}
                        </p>
                      </div>
                    ))}
                  </div>

                  {/* Expense list */}
                  <div className="space-y-2">
                    {mes.gastos.map((gasto, index) => (
                      <div
                        key={`${gasto.tipo}-${gasto.id_origen}-${index}`}
                        className="flex items-center justify-between p-3 bg-background border rounded-lg"
                      >
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-1">
                            <span className="font-medium">{gasto.descripcion}</span>
                            <Badge variant="outline" className="text-xs">
                              {gasto.categoria}
                            </Badge>
                          </div>
                          <div className="flex items-center gap-2 text-xs text-muted-foreground">
                            <Badge variant={getTipoBadgeVariant(gasto.tipo)} className="text-xs">
                              {getTipoLabel(gasto.tipo)}
                            </Badge>
                            <span>•</span>
                            <span>
                              {format(parseISO(gasto.fecha_proyectada), 'd MMM', { locale: es })}
                            </span>
                            {gasto.cuota_numero && gasto.cuotas_totales && (
                              <>
                                <span>•</span>
                                <span>
                                  Cuota {gasto.cuota_numero}/{gasto.cuotas_totales}
                                </span>
                              </>
                            )}
                          </div>
                        </div>
                        <div className="text-right">
                          <p className="font-semibold text-red-600">-{formatCurrency(gasto.monto_ars)}</p>
                          {gasto.monto_usd > 0 && (
                            <p className="text-xs text-muted-foreground">
                              US$ {gasto.monto_usd.toFixed(2)}
                            </p>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>

                  {/* Balance del mes */}
                  <div className={`mt-4 p-3 rounded-lg ${balanceDelMes >= 0 ? 'bg-primary/5 border border-primary/20' : 'bg-orange-500/5 border border-orange-500/20'}`}>
                    <div className="flex items-center justify-between">
                      <span className="font-medium">Balance del mes</span>
                      <span className={`text-lg font-bold ${balanceDelMes >= 0 ? 'text-primary' : 'text-orange-600'}`}>
                        {balanceDelMes >= 0 ? '+' : ''}{formatCurrency(balanceDelMes)}
                      </span>
                    </div>
                  </div>
                </CardContent>
              )}
            </Card>
          )
        })}
      </div>

      {/* Empty state */}
      {proyeccion?.proyeccion.length === 0 && (
        <Card className="border-dashed">
          <CardContent className="py-12 text-center">
            <Calendar className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <h3 className="text-lg font-semibold mb-2">Sin gastos proyectados</h3>
            <p className="text-muted-foreground max-w-md mx-auto">
              No tenés gastos recurrentes, débitos automáticos o cuotas pendientes para proyectar.
              Agregá compromisos financieros para ver la proyección.
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
