'use client'

import { Bell, Menu, DollarSign, RefreshCw } from 'lucide-react'
import { usePathname } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { ThemeToggle } from '@/components/common/ThemeToggle'
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip'
import {
  useTipoCambioActual,
  useActualizarTipoCambio,
} from '@/lib/hooks/useTipoCambio'

const ROUTE_TITLES: Record<string, string> = {
  '/': 'Dashboard',
  '/gastos': 'Gastos',
  '/gastos-unicos': 'Gastos Únicos',
  '/compras': 'Cuotas',
  '/gastos-recurrentes': 'Gastos Recurrentes',
  '/debitos-automaticos': 'Débitos Automáticos',
  '/ingresos': 'Ingresos',
  '/ingresos-unicos': 'Ingresos Únicos',
  '/ingresos-recurrentes': 'Ingresos Recurrentes',
  '/tarjetas': 'Tarjetas',
  '/cuentas-bancarias': 'Cuentas Bancarias',
  '/proyecciones': 'Proyecciones',
  '/salud-financiera': 'Salud Financiera',
  '/configuracion': 'Configuración',
  '/perfil': 'Perfil',
}

interface HeaderProps {
  onMenuClick?: () => void
}

function formatCompactRate(value: number): string {
  if (value >= 1000) {
    const rounded = Math.round(value)
    return `$${rounded.toLocaleString('es-AR')}`
  }
  return `$${value.toLocaleString('es-AR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
}

function formatFullRate(value: number): string {
  return `$${value.toLocaleString('es-AR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
}

export function Header({ onMenuClick }: HeaderProps) {
  const pathname = usePathname()
  const pageTitle = ROUTE_TITLES[pathname] ?? 'Dashboard'

  const { data: tipoCambioResponse, isLoading, isError } = useTipoCambioActual()
  const actualizarTipoCambio = useActualizarTipoCambio()

  const tipoCambio = tipoCambioResponse?.data
  const isUpdating = actualizarTipoCambio.isPending

  const handleRefresh = () => {
    if (!isUpdating) {
      actualizarTipoCambio.mutate()
    }
  }

  const tooltipText = tipoCambio
    ? `Tipo de cambio: ${formatFullRate(tipoCambio.valor_venta_usd_ars)} ARS/USD - Fuente: ${tipoCambio.fuente} - Actualizado: ${tipoCambio.fecha}`
    : 'Tipo de cambio no disponible. Click para actualizar.'

  return (
    <header className="flex h-16 items-center justify-between border-b bg-card px-4 md:px-6">
      <div className="flex items-center space-x-4">
        <Button
          variant="ghost"
          size="icon"
          className="md:hidden"
          onClick={onMenuClick}
        >
          <Menu className="h-6 w-6" />
        </Button>
        <h2 className="text-lg font-semibold">{pageTitle}</h2>
      </div>

      <div className="flex items-center space-x-2">
        <ThemeToggle />

        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger asChild>
              <button
                onClick={handleRefresh}
                disabled={isUpdating}
                className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-xs font-medium transition-colors hover:bg-accent focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-1 disabled:pointer-events-none ${
                  tipoCambio
                    ? 'border-border bg-muted/50 text-muted-foreground'
                    : 'border-orange-300 bg-orange-50 text-orange-700 dark:border-orange-700 dark:bg-orange-950/50 dark:text-orange-400'
                }`}
              >
                {isLoading || isUpdating ? (
                  <RefreshCw className="h-3 w-3 animate-spin" />
                ) : (
                  <DollarSign className="h-3 w-3" />
                )}
                <span className="hidden sm:inline">
                  {tipoCambio
                    ? `USD ${formatCompactRate(tipoCambio.valor_venta_usd_ars)}`
                    : 'USD --'}
                </span>
              </button>
            </TooltipTrigger>
            <TooltipContent side="bottom">
              <p className="max-w-xs text-xs">{tooltipText}</p>
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>

        <Button variant="ghost" size="icon">
          <Bell className="h-5 w-5" />
        </Button>
      </div>
    </header>
  )
}
