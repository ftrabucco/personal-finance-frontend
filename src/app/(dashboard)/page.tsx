'use client'

import { useAuth } from '@/lib/auth/authContext'
import Link from 'next/link'
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
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { useTarjetas } from '@/lib/hooks/useTarjetas'
import { useAllGastos } from '@/lib/hooks/useGastos'
import { useCompras } from '@/lib/hooks/useCompras'
import { useGastosRecurrentes } from '@/lib/hooks/useGastosRecurrentes'
import { useDebitosAutomaticos } from '@/lib/hooks/useDebitosAutomaticos'
import { useProcesarTodosPendientes } from '@/lib/hooks/useProcesamiento'
import { useTipoCambioActual, useActualizarTipoCambio } from '@/lib/hooks/useTipoCambio'
import { formatCurrency } from '@/lib/utils/formatters'
import { format, startOfMonth, endOfMonth } from 'date-fns'

export default function DashboardPage() {
  const { user } = useAuth()

  const { data: tarjetasResponse } = useTarjetas()
  const { data: gastosResponse } = useAllGastos()
  const { data: comprasResponse } = useCompras()
  const { data: gastosRecurrentesResponse } = useGastosRecurrentes()
  const { data: debitosResponse } = useDebitosAutomaticos()
  const procesarPendientes = useProcesarTodosPendientes()
  const { data: tipoCambioResponse, isError: tipoCambioError } = useTipoCambioActual()
  const actualizarTipoCambio = useActualizarTipoCambio()

  const tarjetas = tarjetasResponse?.data || []
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

  // Calcular gastos del mes actual
  const now = new Date()
  const startOfCurrentMonth = startOfMonth(now)
  const endOfCurrentMonth = endOfMonth(now)

  const gastosDelMes = gastos.filter((gasto) => {
    const fecha = new Date(gasto.fecha)
    return fecha >= startOfCurrentMonth && fecha <= endOfCurrentMonth
  })

  const totalGastosDelMes = gastosDelMes.reduce(
    (sum, gasto) => sum + parseFloat(gasto.monto_ars),
    0
  )

  const comprasPendientes = compras.filter((c) => c.pendiente_cuotas).length
  const gastosRecurrentesActivos = gastosRecurrentes.filter((g) => g.activo).length
  const debitosActivos = debitos.filter((d) => d.activo).length

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
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Gastos del Mes
            </CardTitle>
            <Receipt className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {formatCurrency(totalGastosDelMes)}
            </div>
            <p className="text-xs text-muted-foreground">
              {gastosDelMes.length} gastos en{' '}
              {format(now, 'MMMM yyyy')}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Tarjetas</CardTitle>
            <CreditCard className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{tarjetas.length}</div>
            <p className="text-xs text-muted-foreground">
              {tarjetas.filter((t) => t.tipo === 'credito').length} de crédito,{' '}
              {tarjetas.filter((t) => t.tipo === 'debito').length} de débito
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Compras en Cuotas
            </CardTitle>
            <ShoppingCart className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{comprasPendientes}</div>
            <p className="text-xs text-muted-foreground">
              Compras con cuotas pendientes
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Gastos Automáticos
            </CardTitle>
            <Repeat className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {gastosRecurrentesActivos + debitosActivos}
            </div>
            <p className="text-xs text-muted-foreground">
              {gastosRecurrentesActivos} recurrentes, {debitosActivos} débitos
            </p>
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
