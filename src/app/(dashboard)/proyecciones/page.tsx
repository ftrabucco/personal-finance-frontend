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
  Calendar,
  DollarSign,
  RefreshCcw,
  ChevronDown,
  ChevronUp,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { useProyeccion } from '@/lib/hooks/useAnalisis'
import { formatCurrency, formatCurrencyCompact } from '@/lib/utils/formatters'
import { format, parseISO } from 'date-fns'
import { es } from 'date-fns/locale'
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  BarChart,
  Bar,
  Cell,
} from 'recharts'
import type { ProyeccionMensual, GastoProyectado } from '@/types'

const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884d8', '#82ca9d']

export default function ProyeccionesPage() {
  const [mesesProyeccion, setMesesProyeccion] = useState('6')
  const [expandedMonths, setExpandedMonths] = useState<string[]>([])

  const { data: proyeccionResponse, isLoading, refetch, isFetching } = useProyeccion(
    parseInt(mesesProyeccion)
  )

  const proyeccion = proyeccionResponse?.data

  // Format month name
  const formatMes = (mesString: string) => {
    const [year, month] = mesString.split('-')
    const date = new Date(parseInt(year), parseInt(month) - 1, 1)
    return format(date, 'MMMM yyyy', { locale: es })
  }

  // Prepare chart data
  const chartData = useMemo(() => {
    if (!proyeccion?.proyeccion) return []
    return proyeccion.proyeccion.map((mes) => ({
      mes: formatMes(mes.mes),
      mesKey: mes.mes,
      total: mes.total_ars,
      cantidad: mes.cantidad_gastos,
    }))
  }, [proyeccion])

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
          <h1 className="text-2xl font-bold md:text-3xl">Proyección de Gastos</h1>
          <p className="text-sm text-muted-foreground md:text-base">
            Visualiza tus gastos futuros basado en tus compromisos actuales
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
        <div className="grid gap-4 grid-cols-1 sm:grid-cols-3">
          <Card className="bg-primary/5 border-primary/20">
            <CardContent className="pt-6">
              <div className="flex items-center gap-2 mb-2">
                <DollarSign className="h-5 w-5 text-primary flex-shrink-0" />
                <span className="text-sm text-muted-foreground">Total Proyectado</span>
              </div>
              <p className="text-xl sm:text-2xl font-bold truncate" title={formatCurrency(proyeccion.resumen.total_ars)}>
                {formatCurrencyCompact(proyeccion.resumen.total_ars)}
              </p>
              <p className="text-xs text-muted-foreground mt-1">
                En los próximos {proyeccion.resumen.meses_proyectados} meses
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center gap-2 mb-2">
                <Calendar className="h-5 w-5 text-muted-foreground flex-shrink-0" />
                <span className="text-sm text-muted-foreground">Promedio Mensual</span>
              </div>
              <p className="text-xl sm:text-2xl font-bold truncate" title={formatCurrency(proyeccion.resumen.promedio_mensual_ars)}>
                {formatCurrencyCompact(proyeccion.resumen.promedio_mensual_ars)}
              </p>
              <p className="text-xs text-muted-foreground mt-1">
                Basado en tus compromisos actuales
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center gap-2 mb-2">
                <TrendingUp className="h-5 w-5 text-muted-foreground flex-shrink-0" />
                <span className="text-sm text-muted-foreground">Meses Analizados</span>
              </div>
              <p className="text-xl sm:text-2xl font-bold">{proyeccion.resumen.meses_proyectados}</p>
              <p className="text-xs text-muted-foreground mt-1">
                Proyección a futuro
              </p>
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
              Gastos estimados mes a mes
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-[300px]">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={chartData}>
                  <defs>
                    <linearGradient id="colorTotal" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="hsl(var(--primary))" stopOpacity={0.3} />
                      <stop offset="95%" stopColor="hsl(var(--primary))" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                  <XAxis
                    dataKey="mes"
                    tick={{ fontSize: 12 }}
                    tickLine={false}
                    axisLine={false}
                  />
                  <YAxis
                    tickFormatter={(value) => `$${(value / 1000).toFixed(0)}k`}
                    tick={{ fontSize: 12 }}
                    tickLine={false}
                    axisLine={false}
                  />
                  <Tooltip
                    content={({ active, payload }) => {
                      if (!active || !payload?.length) return null
                      const data = payload[0].payload
                      return (
                        <div className="bg-background border rounded-lg p-3 shadow-lg">
                          <p className="font-semibold capitalize">{data.mes}</p>
                          <p className="text-primary">{formatCurrency(data.total)}</p>
                          <p className="text-xs text-muted-foreground">
                            {data.cantidad} gastos proyectados
                          </p>
                        </div>
                      )
                    }}
                  />
                  <Area
                    type="monotone"
                    dataKey="total"
                    stroke="hsl(var(--primary))"
                    strokeWidth={2}
                    fill="url(#colorTotal)"
                  />
                </AreaChart>
              </ResponsiveContainer>
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
                      {mes.cantidad_gastos} gastos proyectados
                    </CardDescription>
                  </div>
                  <div className="flex items-center gap-4">
                    <div className="text-right">
                      <p className="text-xl font-bold">{formatCurrency(mes.total_ars)}</p>
                      {mes.total_usd > 0 && (
                        <p className="text-sm text-muted-foreground">
                          US$ {mes.total_usd.toFixed(2)}
                        </p>
                      )}
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
                  {/* Summary by type */}
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
                          <p className="font-semibold">{formatCurrency(gasto.monto_ars)}</p>
                          {gasto.monto_usd > 0 && (
                            <p className="text-xs text-muted-foreground">
                              US$ {gasto.monto_usd.toFixed(2)}
                            </p>
                          )}
                        </div>
                      </div>
                    ))}
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
