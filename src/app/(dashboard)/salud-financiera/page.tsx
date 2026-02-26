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
import { Progress } from '@/components/ui/progress'
import {
  Heart,
  TrendingUp,
  TrendingDown,
  AlertTriangle,
  CheckCircle2,
  Info,
  RefreshCcw,
  PieChart,
  Lightbulb,
  Wallet,
  ArrowUpCircle,
  ArrowDownCircle,
  PiggyBank,
  Shield,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { useSaludFinanciera } from '@/lib/hooks/useAnalisis'
import { useIngresosUnicos } from '@/lib/hooks/useIngresosUnicos'
import { useIngresosRecurrentes } from '@/lib/hooks/useIngresosRecurrentes'
import { useFrecuencias } from '@/lib/hooks/useCatalogos'
import type { PeriodoSaludFinanciera } from '@/lib/api/endpoints/analisis'
import { formatCurrency, formatCurrencyCompact, formatDate } from '@/lib/utils/formatters'
import { startOfWeek, endOfWeek, startOfMonth, endOfMonth, startOfQuarter, endOfQuarter, startOfYear, endOfYear, parseISO, isWithinInterval } from 'date-fns'

// Score color based on value
const getScoreColor = (score: number) => {
  if (score >= 75) return 'text-green-500'
  if (score >= 50) return 'text-yellow-500'
  if (score >= 30) return 'text-orange-500'
  return 'text-red-500'
}

// Score background color
const getScoreBgColor = (score: number) => {
  if (score >= 75) return 'bg-green-500'
  if (score >= 50) return 'bg-yellow-500'
  if (score >= 30) return 'bg-orange-500'
  return 'bg-red-500'
}

// Badge variant based on calificacion
const getCalificacionVariant = (calificacion: string) => {
  switch (calificacion) {
    case 'Excelente':
    case 'Muy Buena':
      return 'default'
    case 'Buena':
      return 'secondary'
    case 'Regular':
      return 'outline'
    case 'Mejorable':
    case 'Crítica':
      return 'destructive'
    default:
      return 'default'
  }
}

// Period labels
const periodLabels: Record<PeriodoSaludFinanciera, string> = {
  semana: 'Esta semana',
  mes: 'Este mes',
  trimestre: 'Este trimestre',
  anio: 'Este año',
}

// Helper para obtener rango de fechas según período
function getPeriodoRange(periodo: PeriodoSaludFinanciera): { start: Date; end: Date } {
  const now = new Date()
  switch (periodo) {
    case 'semana':
      return { start: startOfWeek(now, { weekStartsOn: 1 }), end: endOfWeek(now, { weekStartsOn: 1 }) }
    case 'mes':
      return { start: startOfMonth(now), end: endOfMonth(now) }
    case 'trimestre':
      return { start: startOfQuarter(now), end: endOfQuarter(now) }
    case 'anio':
      return { start: startOfYear(now), end: endOfYear(now) }
  }
}

// Helper para calcular ingresos recurrentes en un período
function calcularIngresosRecurrentesPeriodo(
  ingresosRecurrentes: any[],
  frecuencias: any[],
  periodo: PeriodoSaludFinanciera
): number {
  let total = 0
  const { start, end } = getPeriodoRange(periodo)

  ingresosRecurrentes.filter(ing => ing.activo).forEach(ingreso => {
    const frecuencia = frecuencias.find(f => f.id === ingreso.frecuencia_gasto_id)
    const frecNombre = frecuencia?.nombre_frecuencia?.toLowerCase() || 'mensual'

    // Verificar fechas de vigencia
    const fechaInicio = ingreso.fecha_inicio ? parseISO(ingreso.fecha_inicio) : null
    const fechaFin = ingreso.fecha_fin ? parseISO(ingreso.fecha_fin) : null

    if (fechaInicio && fechaInicio > end) return
    if (fechaFin && fechaFin < start) return

    const montoArs = Number(ingreso.monto_ars) || 0

    // Calcular según frecuencia y período
    switch (frecNombre) {
      case 'mensual':
        if (periodo === 'semana') total += montoArs * 0.25 // Aproximación semanal
        else if (periodo === 'mes') total += montoArs
        else if (periodo === 'trimestre') total += montoArs * 3
        else if (periodo === 'anio') total += montoArs * 12
        break
      case 'quincenal':
        if (periodo === 'semana') total += montoArs * 0.5
        else if (periodo === 'mes') total += montoArs * 2
        else if (periodo === 'trimestre') total += montoArs * 6
        else if (periodo === 'anio') total += montoArs * 24
        break
      case 'semanal':
        if (periodo === 'semana') total += montoArs
        else if (periodo === 'mes') total += montoArs * 4
        else if (periodo === 'trimestre') total += montoArs * 13
        else if (periodo === 'anio') total += montoArs * 52
        break
      case 'anual':
        if (periodo === 'anio') total += montoArs
        break
      case 'semestral':
        if (periodo === 'anio') total += montoArs * 2
        else if (periodo === 'trimestre') total += montoArs * 0.5
        break
      case 'trimestral':
        if (periodo === 'trimestre') total += montoArs
        else if (periodo === 'anio') total += montoArs * 4
        break
    }
  })

  return total
}

export default function SaludFinancieraPage() {
  const [periodo, setPeriodo] = useState<PeriodoSaludFinanciera>('mes')

  const { data: saludResponse, isLoading: isLoadingSalud, refetch, isFetching } = useSaludFinanciera(periodo)
  const { data: ingresosUnicosResponse, isLoading: isLoadingIngresos } = useIngresosUnicos()
  const { data: ingresosRecurrentesResponse } = useIngresosRecurrentes()
  const { data: frecuenciasResponse } = useFrecuencias()

  const salud = saludResponse?.data
  const ingresosUnicos = ingresosUnicosResponse?.data || []
  const ingresosRecurrentes = ingresosRecurrentesResponse?.data || []
  const frecuencias = frecuenciasResponse?.data || []

  const isLoading = isLoadingSalud || isLoadingIngresos

  // Calcular ingresos del período
  const ingresosPeriodo = useMemo(() => {
    const { start, end } = getPeriodoRange(periodo)

    // Ingresos únicos en el período
    const ingresosUnicosEnPeriodo = ingresosUnicos
      .filter(ing => {
        const fecha = parseISO(ing.fecha)
        return isWithinInterval(fecha, { start, end })
      })
      .reduce((sum, ing) => sum + (Number(ing.monto_ars) || 0), 0)

    // Ingresos recurrentes calculados
    const ingresosRecurrentesEnPeriodo = calcularIngresosRecurrentesPeriodo(
      ingresosRecurrentes,
      frecuencias,
      periodo
    )

    return ingresosUnicosEnPeriodo + ingresosRecurrentesEnPeriodo
  }, [ingresosUnicos, ingresosRecurrentes, frecuencias, periodo])

  // Calcular métricas financieras
  const metricas = useMemo(() => {
    const gastos = Number(salud?.totales?.total_ars) || 0
    const ingresos = Number(ingresosPeriodo) || 0
    const balance = ingresos - gastos
    const tasaAhorro = ingresos > 0 ? (balance / ingresos) * 100 : 0
    const ratioCobertura = gastos > 0 ? ingresos / gastos : (ingresos > 0 ? Infinity : 1)

    return {
      ingresos: isNaN(ingresos) ? 0 : ingresos,
      gastos: isNaN(gastos) ? 0 : gastos,
      balance: isNaN(balance) ? 0 : balance,
      tasaAhorro: isNaN(tasaAhorro) ? 0 : tasaAhorro,
      ratioCobertura: isNaN(ratioCobertura) ? 1 : ratioCobertura,
    }
  }, [salud, ingresosPeriodo])

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <Heart className="h-12 w-12 text-muted-foreground animate-pulse mx-auto mb-4" />
          <p className="text-muted-foreground">Analizando tu salud financiera...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-4 md:space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold md:text-3xl">Salud Financiera</h1>
          <p className="text-sm text-muted-foreground md:text-base">
            Análisis de tus patrones de gasto y recomendaciones
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Select value={periodo} onValueChange={(v) => setPeriodo(v as PeriodoSaludFinanciera)}>
            <SelectTrigger className="w-[160px]">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="semana">Esta semana</SelectItem>
              <SelectItem value="mes">Este mes</SelectItem>
              <SelectItem value="trimestre">Este trimestre</SelectItem>
              <SelectItem value="anio">Este año</SelectItem>
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

      {salud && (
        <>
          {/* Score Card */}
          <Card className="overflow-hidden">
            <div className={`h-2 ${getScoreBgColor(salud.score)}`} />
            <CardContent className="pt-6">
              <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-6">
                {/* Score Circle */}
                <div className="flex items-center gap-6">
                  <div className="relative">
                    <svg className="w-32 h-32 transform -rotate-90">
                      <circle
                        cx="64"
                        cy="64"
                        r="56"
                        stroke="currentColor"
                        strokeWidth="12"
                        fill="none"
                        className="text-muted"
                      />
                      <circle
                        cx="64"
                        cy="64"
                        r="56"
                        stroke="currentColor"
                        strokeWidth="12"
                        fill="none"
                        strokeDasharray={`${(salud.score / 100) * 352} 352`}
                        strokeLinecap="round"
                        className={getScoreColor(salud.score)}
                      />
                    </svg>
                    <div className="absolute inset-0 flex items-center justify-center">
                      <span className={`text-4xl font-bold ${getScoreColor(salud.score)}`}>
                        {salud.score}
                      </span>
                    </div>
                  </div>

                  <div>
                    <Badge variant={getCalificacionVariant(salud.calificacion)} className="mb-2">
                      {salud.calificacion}
                    </Badge>
                    <p className="text-lg font-semibold">{periodLabels[periodo]}</p>
                    <p className="text-sm text-muted-foreground">
                      {formatDate(salud.periodo.desde)} - {formatDate(salud.periodo.hasta)}
                    </p>
                  </div>
                </div>

                {/* Totals */}
                <div className="grid grid-cols-2 gap-4 md:text-right">
                  <div>
                    <p className="text-sm text-muted-foreground">Total Gastado</p>
                    <p className="text-xl font-bold" title={formatCurrency(salud.totales.total_ars)}>{formatCurrencyCompact(salud.totales.total_ars)}</p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Gastos Registrados</p>
                    <p className="text-xl font-bold">{salud.totales.cantidad_gastos}</p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Income & Balance Metrics */}
          <div className="grid gap-4 grid-cols-2 lg:grid-cols-4">
            {/* Ingresos */}
            <Card className="bg-green-500/5 border-green-500/20">
              <CardContent className="pt-6">
                <div className="flex items-center gap-2 mb-2">
                  <ArrowUpCircle className="h-5 w-5 text-green-500 flex-shrink-0" />
                  <span className="text-sm text-muted-foreground">Ingresos</span>
                </div>
                <p className="text-xl font-bold text-green-600 truncate" title={formatCurrency(metricas.ingresos)}>
                  {formatCurrencyCompact(metricas.ingresos)}
                </p>
                <p className="text-xs text-muted-foreground mt-1">
                  {periodLabels[periodo]}
                </p>
              </CardContent>
            </Card>

            {/* Gastos */}
            <Card className="bg-red-500/5 border-red-500/20">
              <CardContent className="pt-6">
                <div className="flex items-center gap-2 mb-2">
                  <ArrowDownCircle className="h-5 w-5 text-red-500 flex-shrink-0" />
                  <span className="text-sm text-muted-foreground">Gastos</span>
                </div>
                <p className="text-xl font-bold text-red-600 truncate" title={formatCurrency(metricas.gastos)}>
                  {formatCurrencyCompact(metricas.gastos)}
                </p>
                <p className="text-xs text-muted-foreground mt-1">
                  {periodLabels[periodo]}
                </p>
              </CardContent>
            </Card>

            {/* Balance */}
            <Card className={metricas.balance >= 0 ? "bg-primary/5 border-primary/20" : "bg-orange-500/5 border-orange-500/20"}>
              <CardContent className="pt-6">
                <div className="flex items-center gap-2 mb-2">
                  <Wallet className="h-5 w-5 flex-shrink-0" />
                  <span className="text-sm text-muted-foreground">Balance</span>
                </div>
                <p className={`text-xl font-bold truncate ${metricas.balance >= 0 ? 'text-primary' : 'text-orange-600'}`} title={formatCurrency(metricas.balance)}>
                  {metricas.balance >= 0 ? '+' : ''}{formatCurrencyCompact(metricas.balance)}
                </p>
                <p className="text-xs text-muted-foreground mt-1">
                  {metricas.balance >= 0 ? 'Superávit' : 'Déficit'}
                </p>
              </CardContent>
            </Card>

            {/* Tasa de Ahorro */}
            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center gap-2 mb-2">
                  <PiggyBank className="h-5 w-5 text-muted-foreground flex-shrink-0" />
                  <span className="text-sm text-muted-foreground">Tasa de Ahorro</span>
                </div>
                <p className={`text-xl font-bold ${metricas.tasaAhorro >= 20 ? 'text-green-600' : metricas.tasaAhorro >= 10 ? 'text-yellow-600' : metricas.tasaAhorro >= 0 ? 'text-orange-600' : 'text-red-600'}`}>
                  {metricas.tasaAhorro.toFixed(1)}%
                </p>
                <p className="text-xs text-muted-foreground mt-1">
                  {metricas.tasaAhorro >= 20 ? 'Excelente' : metricas.tasaAhorro >= 10 ? 'Bueno' : metricas.tasaAhorro >= 0 ? 'Mejorable' : 'Negativo'}
                </p>
              </CardContent>
            </Card>
          </div>

          {/* Ratio de Cobertura */}
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-base flex items-center gap-2">
                <Shield className="h-4 w-4 text-primary" />
                Ratio de Cobertura
              </CardTitle>
              <CardDescription>
                Cuántas veces tus ingresos cubren tus gastos
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex items-center gap-4">
                <div className="flex-1">
                  <div className="flex items-center justify-between mb-2">
                    <span className={`text-3xl font-bold ${
                      metricas.ratioCobertura >= 1.5 ? 'text-green-600' :
                      metricas.ratioCobertura >= 1 ? 'text-yellow-600' :
                      'text-red-600'
                    }`}>
                      {metricas.ratioCobertura === Infinity ? '∞' : metricas.ratioCobertura.toFixed(2)}x
                    </span>
                    <Badge variant={
                      metricas.ratioCobertura >= 1.5 ? 'default' :
                      metricas.ratioCobertura >= 1 ? 'secondary' :
                      'destructive'
                    }>
                      {metricas.ratioCobertura >= 1.5 ? 'Saludable' :
                       metricas.ratioCobertura >= 1 ? 'Ajustado' :
                       'En riesgo'}
                    </Badge>
                  </div>
                  <Progress
                    value={Math.min(metricas.ratioCobertura * 50, 100)}
                    className="h-3"
                  />
                  <div className="flex justify-between mt-1 text-xs text-muted-foreground">
                    <span>0x</span>
                    <span>1x (equilibrio)</span>
                    <span>2x+</span>
                  </div>
                </div>
              </div>
              <p className="text-sm text-muted-foreground mt-3">
                {metricas.ratioCobertura >= 1.5
                  ? 'Tus ingresos cubren cómodamente tus gastos. Tenés margen para ahorrar o invertir.'
                  : metricas.ratioCobertura >= 1
                  ? 'Tus ingresos cubren tus gastos pero con poco margen. Considerá reducir gastos no esenciales.'
                  : 'Tus gastos superan tus ingresos. Es importante revisar tu presupuesto urgentemente.'}
              </p>
            </CardContent>
          </Card>

          {/* Desglose Grid */}
          {salud.desglose && (
            <div className="grid gap-4 md:grid-cols-2">
              {/* Ratio Necesarios */}
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-base flex items-center gap-2">
                    <CheckCircle2 className="h-4 w-4 text-green-500" />
                    Gastos Necesarios
                  </CardTitle>
                  <CardDescription>
                    {salud.desglose.ratio_esenciales.descripcion}
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-2xl font-bold">
                      {salud.desglose.ratio_esenciales.valor.toFixed(1)}%
                    </span>
                    <Badge variant="outline">
                      {salud.desglose.ratio_esenciales.puntos.toFixed(1)} / {salud.desglose.ratio_esenciales.peso} pts
                    </Badge>
                  </div>
                  <Progress
                    value={salud.desglose.ratio_esenciales.puntos / salud.desglose.ratio_esenciales.peso * 100}
                    className="h-2"
                  />
                </CardContent>
              </Card>

              {/* Gastos Evitables */}
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-base flex items-center gap-2">
                    <AlertTriangle className="h-4 w-4 text-orange-500" />
                    Gastos Evitables
                  </CardTitle>
                  <CardDescription>
                    {salud.desglose.gastos_evitables.descripcion}
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-2xl font-bold">
                      {salud.desglose.gastos_evitables.valor.toFixed(1)}%
                    </span>
                    <Badge variant="outline">
                      {salud.desglose.gastos_evitables.puntos.toFixed(1)} / {salud.desglose.gastos_evitables.peso} pts
                    </Badge>
                  </div>
                  <Progress
                    value={salud.desglose.gastos_evitables.puntos / salud.desglose.gastos_evitables.peso * 100}
                    className="h-2"
                  />
                </CardContent>
              </Card>

              {/* Tendencia */}
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-base flex items-center gap-2">
                    {salud.desglose.tendencia.valor <= 0 ? (
                      <TrendingDown className="h-4 w-4 text-green-500" />
                    ) : (
                      <TrendingUp className="h-4 w-4 text-red-500" />
                    )}
                    Tendencia
                  </CardTitle>
                  <CardDescription>
                    {salud.desglose.tendencia.descripcion}
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="flex items-center justify-between mb-2">
                    <span className={`text-2xl font-bold ${
                      salud.desglose.tendencia.valor <= 0 ? 'text-green-500' : 'text-red-500'
                    }`}>
                      {salud.desglose.tendencia.valor > 0 ? '+' : ''}
                      {salud.desglose.tendencia.valor.toFixed(1)}%
                    </span>
                    <Badge variant="outline">
                      {salud.desglose.tendencia.puntos.toFixed(1)} / {salud.desglose.tendencia.peso} pts
                    </Badge>
                  </div>
                  <Progress
                    value={salud.desglose.tendencia.puntos / salud.desglose.tendencia.peso * 100}
                    className="h-2"
                  />
                </CardContent>
              </Card>

              {/* Diversificación */}
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-base flex items-center gap-2">
                    <PieChart className="h-4 w-4 text-blue-500" />
                    Diversificación
                  </CardTitle>
                  <CardDescription>
                    {salud.desglose.diversificacion.descripcion}
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-2xl font-bold">
                      {salud.desglose.diversificacion.cantidad_categorias || 0} categorías
                    </span>
                    <Badge variant="outline">
                      {salud.desglose.diversificacion.puntos.toFixed(1)} / {salud.desglose.diversificacion.peso} pts
                    </Badge>
                  </div>
                  <Progress
                    value={salud.desglose.diversificacion.puntos / salud.desglose.diversificacion.peso * 100}
                    className="h-2"
                  />
                </CardContent>
              </Card>
            </div>
          )}

          {/* Distribution */}
          {salud.distribucion && (
            <div className="grid gap-4 md:grid-cols-2">
              {/* Por Importancia */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-base">Distribución por Importancia</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {Object.entries(salud.distribucion.por_importancia)
                      .sort((a, b) => b[1].total_ars - a[1].total_ars)
                      .map(([importancia, data]) => {
                        const porcentaje = (data.total_ars / salud.totales.total_ars) * 100
                        return (
                          <div key={importancia}>
                            <div className="flex items-center justify-between mb-1">
                              <span className="text-sm font-medium">{importancia}</span>
                              <span className="text-sm font-semibold">
                                {formatCurrency(data.total_ars)}
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
                      })}
                  </div>
                </CardContent>
              </Card>

              {/* Por Categoría (Top 5) */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-base">Top 5 Categorías</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {Object.entries(salud.distribucion.por_categoria)
                      .sort((a, b) => b[1].total_ars - a[1].total_ars)
                      .slice(0, 5)
                      .map(([categoria, data], index) => {
                        const porcentaje = (data.total_ars / salud.totales.total_ars) * 100
                        return (
                          <div key={categoria}>
                            <div className="flex items-center justify-between mb-1">
                              <span className="text-sm font-medium">
                                {index + 1}. {categoria}
                              </span>
                              <span className="text-sm font-semibold">
                                {formatCurrency(data.total_ars)}
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
                      })}
                  </div>
                </CardContent>
              </Card>
            </div>
          )}

          {/* Recommendations */}
          <Card className="border-yellow-200 dark:border-yellow-900 bg-yellow-50/50 dark:bg-yellow-950/20">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Lightbulb className="h-5 w-5 text-yellow-600 dark:text-yellow-500" />
                Recomendaciones
              </CardTitle>
              <CardDescription>
                Sugerencias para mejorar tu salud financiera
              </CardDescription>
            </CardHeader>
            <CardContent>
              <ul className="space-y-3">
                {salud.recomendaciones.map((recomendacion, index) => (
                  <li key={index} className="flex items-start gap-3">
                    <Info className="h-5 w-5 text-yellow-600 dark:text-yellow-500 mt-0.5 flex-shrink-0" />
                    <span className="text-sm">{recomendacion}</span>
                  </li>
                ))}
              </ul>
            </CardContent>
          </Card>

          {/* Score explanation */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Cómo se calculan las métricas</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3 text-sm">
                <div className="p-3 bg-muted/50 rounded-lg">
                  <p className="font-semibold mb-1">Puntaje de Salud</p>
                  <p className="text-muted-foreground">
                    Combina: gastos necesarios (40%), evitables (30%), tendencia (20%) y diversificación (10%)
                  </p>
                </div>
                <div className="p-3 bg-muted/50 rounded-lg">
                  <p className="font-semibold mb-1">Tasa de Ahorro</p>
                  <p className="text-muted-foreground">
                    (Ingresos - Gastos) / Ingresos × 100. Meta: 20%+ es excelente, 10%+ es bueno
                  </p>
                </div>
                <div className="p-3 bg-muted/50 rounded-lg">
                  <p className="font-semibold mb-1">Ratio de Cobertura</p>
                  <p className="text-muted-foreground">
                    Ingresos / Gastos. Meta: 1.5x+ es saludable, 1x es equilibrio, &lt;1x es déficit
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </>
      )}

      {/* Empty state */}
      {salud && salud.desglose === null && (
        <Card className="border-dashed">
          <CardContent className="py-12 text-center">
            <Heart className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <h3 className="text-lg font-semibold mb-2">{salud.mensaje || 'Sin datos suficientes'}</h3>
            <p className="text-muted-foreground max-w-md mx-auto">
              Registrá gastos en este período para obtener un análisis completo de tu salud financiera.
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
