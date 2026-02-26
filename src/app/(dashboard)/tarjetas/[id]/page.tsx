'use client'

// Tarjeta detail page - shows all expenses associated with a card
import { use } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import {
  ArrowLeft,
  CreditCard,
  ShoppingCart,
  Repeat,
  Wallet,
  Calendar,
  DollarSign,
} from 'lucide-react'
import { useTarjetaDetalle } from '@/lib/hooks/useTarjetaDetalle'
import { formatCurrency, formatCurrencyCompact } from '@/lib/utils/formatters'
import { format } from 'date-fns'
import { es } from 'date-fns/locale'

interface PageProps {
  params: Promise<{ id: string }>
}

export default function TarjetaDetallePage({ params }: PageProps) {
  const { id } = use(params)
  const tarjetaId = parseInt(id)
  const router = useRouter()

  const { tarjeta, compras, debitos, recurrentes, gastosUnicos, isLoading } =
    useTarjetaDetalle(tarjetaId)

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <CreditCard className="h-12 w-12 text-muted-foreground animate-pulse mx-auto mb-4" />
          <p className="text-muted-foreground">Cargando tarjeta...</p>
        </div>
      </div>
    )
  }

  if (!tarjeta) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <CreditCard className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
          <p className="text-muted-foreground">Tarjeta no encontrada</p>
          <Button variant="outline" className="mt-4" onClick={() => router.push('/tarjetas')}>
            Volver a tarjetas
          </Button>
        </div>
      </div>
    )
  }

  // Calcular totales
  const comprasConCuotas = compras.filter((c) => c.pendiente_cuotas)

  // Monto mensual de cuotas (lo que se paga cada mes)
  const totalCuotasMensualesARS = comprasConCuotas.reduce((sum, c) => {
    const montoTotal = Number(c.monto_total_ars) || 0
    const cuotas = Number(c.cantidad_cuotas) || 1
    return sum + montoTotal / cuotas
  }, 0)
  const totalCuotasMensualesUSD = comprasConCuotas.reduce((sum, c) => {
    const montoTotal = Number(c.monto_total_usd) || 0
    const cuotas = Number(c.cantidad_cuotas) || 1
    return sum + montoTotal / cuotas
  }, 0)

  // Total pendiente de todas las compras en cuotas
  // Nota: El monto total representa lo que falta por pagar de compras con pendiente_cuotas=true
  const totalCuotasPendientesARS = comprasConCuotas.reduce((sum, c) => {
    return sum + (Number(c.monto_total_ars) || 0)
  }, 0)

  const debitosActivos = debitos.filter((d) => d.activo)
  const totalDebitosARS = debitosActivos.reduce((sum, d) => sum + (Number(d.monto_ars) || 0), 0)
  const totalDebitosUSD = debitosActivos.reduce((sum, d) => sum + (Number(d.monto_usd) || 0), 0)

  const recurrentesActivos = recurrentes.filter((r) => r.activo)
  const totalRecurrentesARS = recurrentesActivos.reduce((sum, r) => sum + (Number(r.monto_ars) || 0), 0)
  const totalRecurrentesUSD = recurrentesActivos.reduce((sum, r) => sum + (Number(r.monto_usd) || 0), 0)

  const totalGastosUnicosARS = gastosUnicos.reduce((sum, g) => sum + (Number(g.monto_ars) || 0), 0)
  const totalGastosUnicosUSD = gastosUnicos.reduce((sum, g) => sum + (Number(g.monto_usd) || 0), 0)

  const totalCompromisosMensualesARS = totalDebitosARS + totalRecurrentesARS + totalCuotasMensualesARS
  const totalCompromisosMensualesUSD = totalDebitosUSD + totalRecurrentesUSD + totalCuotasMensualesUSD

  const getBadgeVariant = (tipo: string) => {
    switch (tipo) {
      case 'credito':
        return 'default'
      case 'debito':
        return 'secondary'
      default:
        return 'outline'
    }
  }

  const getTipoLabel = (tipo: string) => {
    switch (tipo) {
      case 'credito':
        return 'Crédito'
      case 'debito':
        return 'Débito'
      case 'virtual':
        return 'Virtual'
      default:
        return tipo
    }
  }

  return (
    <div className="space-y-4 md:space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" onClick={() => router.push('/tarjetas')}>
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <div>
            <div className="flex items-center gap-3">
              <h1 className="text-2xl font-bold md:text-3xl">{tarjeta.nombre}</h1>
              <Badge variant={getBadgeVariant(tarjeta.tipo)}>
                {getTipoLabel(tarjeta.tipo)}
              </Badge>
            </div>
            <p className="text-sm text-muted-foreground">
              {tarjeta.banco}
              {tarjeta.ultimos_4_digitos && ` • **** ${tarjeta.ultimos_4_digitos}`}
            </p>
          </div>
        </div>
        {tarjeta.tipo === 'credito' && (
          <div className="text-sm text-muted-foreground">
            <p>Cierre: día {tarjeta.dia_mes_cierre}</p>
            <p>Vencimiento: día {tarjeta.dia_mes_vencimiento}</p>
          </div>
        )}
      </div>

      {/* Resumen Cards */}
      <div className="grid gap-3 grid-cols-2 md:grid-cols-4 md:gap-4">
        <Card className="bg-primary/5 border-primary/20">
          <CardContent className="pt-6">
            <div className="flex items-center gap-2 mb-2">
              <DollarSign className="h-4 w-4 text-primary" />
              <span className="text-xs text-muted-foreground">Compromisos Mensuales</span>
            </div>
            <p className="text-lg font-bold truncate" title={formatCurrency(totalCompromisosMensualesARS)}>{formatCurrencyCompact(totalCompromisosMensualesARS)}</p>
            {totalCompromisosMensualesUSD > 0 && (
              <p className="text-xs text-muted-foreground">US$ {totalCompromisosMensualesUSD.toFixed(2)}</p>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-2 mb-2">
              <ShoppingCart className="h-4 w-4 text-muted-foreground" />
              <span className="text-xs text-muted-foreground">Cuotas Pendientes</span>
            </div>
            <p className="text-lg font-bold truncate" title={formatCurrency(totalCuotasPendientesARS)}>{formatCurrencyCompact(totalCuotasPendientesARS)}</p>
            <p className="text-xs text-muted-foreground">{comprasConCuotas.length} compras • {formatCurrencyCompact(totalCuotasMensualesARS)}/mes</p>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-2 mb-2">
              <CreditCard className="h-4 w-4 text-muted-foreground" />
              <span className="text-xs text-muted-foreground">Débitos Automáticos</span>
            </div>
            <p className="text-lg font-bold truncate" title={formatCurrency(totalDebitosARS)}>{formatCurrencyCompact(totalDebitosARS)}</p>
            {totalDebitosUSD > 0 && (
              <p className="text-xs text-muted-foreground">US$ {totalDebitosUSD.toFixed(2)}</p>
            )}
            <p className="text-xs text-muted-foreground">{debitosActivos.length} activos</p>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-2 mb-2">
              <Wallet className="h-4 w-4 text-muted-foreground" />
              <span className="text-xs text-muted-foreground">Gastos Únicos</span>
            </div>
            <p className="text-lg font-bold truncate" title={formatCurrency(totalGastosUnicosARS)}>{formatCurrencyCompact(totalGastosUnicosARS)}</p>
            <p className="text-xs text-muted-foreground">{gastosUnicos.length} gastos</p>
          </CardContent>
        </Card>
      </div>

      {/* Compras en Cuotas */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <ShoppingCart className="h-5 w-5" />
            Compras en Cuotas
          </CardTitle>
          <CardDescription>
            {comprasConCuotas.length} compras con cuotas pendientes
          </CardDescription>
        </CardHeader>
        <CardContent>
          {comprasConCuotas.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-4">
              No hay compras en cuotas con esta tarjeta
            </p>
          ) : (
            <div className="space-y-3">
              {comprasConCuotas.map((compra) => {
                const montoTotal = Number(compra.monto_total_ars) || 0
                const cuotas = Number(compra.cantidad_cuotas) || 1
                const cuotaMensual = montoTotal / cuotas
                return (
                  <div
                    key={compra.id}
                    className="flex items-center justify-between p-3 bg-muted/50 rounded-lg"
                  >
                    <div className="flex-1 min-w-0">
                      <p className="font-medium truncate">{compra.descripcion}</p>
                      <div className="flex items-center gap-2 text-xs text-muted-foreground">
                        <span>{format(new Date(compra.fecha_compra), 'dd/MM/yyyy')}</span>
                        <span>•</span>
                        <span>{cuotas} cuotas</span>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="font-semibold">{formatCurrency(cuotaMensual)}/mes</p>
                      <p className="text-xs text-muted-foreground">
                        Total: {formatCurrency(montoTotal)}
                      </p>
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Débitos Automáticos */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <CreditCard className="h-5 w-5" />
            Débitos Automáticos
          </CardTitle>
          <CardDescription>
            {debitosActivos.length} débitos activos
          </CardDescription>
        </CardHeader>
        <CardContent>
          {debitos.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-4">
              No hay débitos automáticos con esta tarjeta
            </p>
          ) : (
            <div className="space-y-3">
              {debitos.map((debito) => (
                <div
                  key={debito.id}
                  className={`flex items-center justify-between p-3 rounded-lg ${
                    debito.activo ? 'bg-muted/50' : 'bg-muted/20 opacity-60'
                  }`}
                >
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <p className="font-medium truncate">{debito.descripcion}</p>
                      {!debito.activo && (
                        <Badge variant="outline" className="text-xs">Inactivo</Badge>
                      )}
                    </div>
                    <p className="text-xs text-muted-foreground">
                      Día {debito.dia_de_pago} de cada mes
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="font-semibold">{formatCurrency(debito.monto_ars)}</p>
                    {Number(debito.monto_usd) > 0 && (
                      <p className="text-xs text-muted-foreground">
                        US$ {Number(debito.monto_usd).toFixed(2)}
                      </p>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Gastos Recurrentes */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Repeat className="h-5 w-5" />
            Gastos Recurrentes
          </CardTitle>
          <CardDescription>
            {recurrentesActivos.length} gastos recurrentes activos
          </CardDescription>
        </CardHeader>
        <CardContent>
          {recurrentes.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-4">
              No hay gastos recurrentes con esta tarjeta
            </p>
          ) : (
            <div className="space-y-3">
              {recurrentes.map((recurrente) => (
                <div
                  key={recurrente.id}
                  className={`flex items-center justify-between p-3 rounded-lg ${
                    recurrente.activo ? 'bg-muted/50' : 'bg-muted/20 opacity-60'
                  }`}
                >
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <p className="font-medium truncate">{recurrente.descripcion}</p>
                      {!recurrente.activo && (
                        <Badge variant="outline" className="text-xs">Inactivo</Badge>
                      )}
                    </div>
                    <p className="text-xs text-muted-foreground">
                      Día {recurrente.dia_de_pago} • {recurrente.frecuencia?.nombre_frecuencia || 'Mensual'}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="font-semibold">{formatCurrency(recurrente.monto_ars)}</p>
                    {Number(recurrente.monto_usd) > 0 && (
                      <p className="text-xs text-muted-foreground">
                        US$ {Number(recurrente.monto_usd).toFixed(2)}
                      </p>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Gastos Únicos */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Wallet className="h-5 w-5" />
            Gastos Únicos
          </CardTitle>
          <CardDescription>
            {gastosUnicos.length} gastos únicos registrados
            {tarjeta.tipo === 'credito' && (
              <span className="ml-2 text-xs">(se cobran en fecha de vencimiento)</span>
            )}
            {tarjeta.tipo === 'debito' && (
              <span className="ml-2 text-xs">(se cobran al momento)</span>
            )}
          </CardDescription>
        </CardHeader>
        <CardContent>
          {gastosUnicos.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-4">
              No hay gastos únicos con esta tarjeta
            </p>
          ) : (
            <div className="space-y-3">
              {gastosUnicos.slice(0, 10).map((gasto) => (
                <div
                  key={gasto.id}
                  className="flex items-center justify-between p-3 bg-muted/50 rounded-lg"
                >
                  <div className="flex-1 min-w-0">
                    <p className="font-medium truncate">{gasto.descripcion}</p>
                    <p className="text-xs text-muted-foreground">
                      {format(new Date(gasto.fecha), 'dd/MM/yyyy', { locale: es })}
                      {gasto.categoria && ` • ${gasto.categoria.nombre_categoria}`}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="font-semibold">{formatCurrency(gasto.monto_ars)}</p>
                    {Number(gasto.monto_usd) > 0 && (
                      <p className="text-xs text-muted-foreground">
                        US$ {Number(gasto.monto_usd).toFixed(2)}
                      </p>
                    )}
                  </div>
                </div>
              ))}
              {gastosUnicos.length > 10 && (
                <p className="text-sm text-muted-foreground text-center py-2">
                  ... y {gastosUnicos.length - 10} más
                </p>
              )}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
