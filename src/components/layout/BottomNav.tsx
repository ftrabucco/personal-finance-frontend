'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { cn } from '@/lib/utils'
import { Home, Receipt, Plus, BarChart3, User, TrendingDown, TrendingUp } from 'lucide-react'
import { useState, useMemo } from 'react'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { CreditCard, ShoppingCart, Repeat, Wallet, Banknote, CalendarDays } from 'lucide-react'
import { useModulosContext } from '@/lib/context/ModulosContext'

const navItems = [
  { name: 'Inicio', href: '/', icon: Home },
  { name: 'Gastos', href: '/gastos', icon: Receipt },
  { name: 'Nuevo', href: '#', icon: Plus, isAction: true },
  { name: 'Proyecciones', href: '/proyecciones', icon: BarChart3 },
  { name: 'Perfil', href: '/perfil', icon: User },
]

const gastoOptions = [
  { name: 'Gasto Único', href: '/gastos?tab=unicos&new=true', basePath: '/gastos-unicos', icon: Wallet, description: 'Un gasto puntual' },
  { name: 'Nueva Cuota', href: '/gastos?tab=cuotas&new=true', basePath: '/compras', icon: ShoppingCart, description: 'Compra en cuotas' },
  { name: 'Gasto Recurrente', href: '/gastos?tab=recurrentes&new=true', basePath: '/gastos-recurrentes', icon: Repeat, description: 'Se repite cada mes' },
  { name: 'Débito Automático', href: '/gastos?tab=debitos&new=true', basePath: '/debitos-automaticos', icon: CreditCard, description: 'Débito de cuenta' },
]

const ingresoOptions = [
  { name: 'Ingreso Único', href: '/ingresos?tab=unicos&new=true', basePath: '/ingresos-unicos', icon: Banknote, description: 'Un ingreso puntual' },
  { name: 'Ingreso Recurrente', href: '/ingresos?tab=recurrentes&new=true', basePath: '/ingresos-recurrentes', icon: CalendarDays, description: 'Sueldo, renta, etc.' },
]

export function BottomNav() {
  const pathname = usePathname()
  const [quickAddOpen, setQuickAddOpen] = useState(false)
  const { isRutaVisible } = useModulosContext()

  // Filter nav items based on module visibility
  const filteredNavItems = useMemo(() => {
    return navItems.filter(item => {
      if (item.isAction) return true // Always show the + button
      return isRutaVisible(item.href)
    })
  }, [isRutaVisible])

  // Filter quick add options based on module visibility
  const filteredGastoOptions = useMemo(() => {
    return gastoOptions.filter(option => isRutaVisible(option.basePath))
  }, [isRutaVisible])

  const filteredIngresoOptions = useMemo(() => {
    return ingresoOptions.filter(option => isRutaVisible(option.basePath))
  }, [isRutaVisible])

  return (
    <>
      <nav className="fixed bottom-0 left-0 right-0 z-50 border-t bg-background md:hidden">
        <div className="flex h-16 items-center justify-around px-2">
          {filteredNavItems.map((item) => {
            const isActive = pathname === item.href
            const Icon = item.icon

            if (item.isAction) {
              return (
                <button
                  key={item.name}
                  onClick={() => setQuickAddOpen(true)}
                  className="flex flex-col items-center justify-center -mt-4"
                >
                  <div className="flex h-12 w-12 items-center justify-center rounded-full bg-primary text-primary-foreground shadow-lg">
                    <Icon className="h-6 w-6" />
                  </div>
                </button>
              )
            }

            return (
              <Link
                key={item.name}
                href={item.href}
                className={cn(
                  'flex flex-col items-center justify-center gap-1 px-3 py-2 min-w-[64px]',
                  isActive
                    ? 'text-primary'
                    : 'text-muted-foreground'
                )}
              >
                <Icon className="h-5 w-5" />
                <span className="text-xs font-medium">{item.name}</span>
              </Link>
            )
          })}
        </div>
      </nav>

      {/* Quick Add Dialog */}
      <Dialog open={quickAddOpen} onOpenChange={setQuickAddOpen}>
        <DialogContent className="sm:max-w-md max-h-[85vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Nuevo registro</DialogTitle>
          </DialogHeader>

          {/* Gastos Section */}
          {filteredGastoOptions.length > 0 && (
          <div className="space-y-3">
            <div className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
              <TrendingDown className="h-4 w-4 text-destructive" />
              <span>Gastos</span>
            </div>
            <div className="grid grid-cols-2 gap-2">
              {filteredGastoOptions.map((option) => {
                const Icon = option.icon
                return (
                  <Link
                    key={option.name}
                    href={option.href}
                    onClick={() => setQuickAddOpen(false)}
                  >
                    <Button
                      variant="outline"
                      className="h-auto w-full flex-col gap-1.5 p-3 hover:bg-destructive/5 hover:border-destructive/30"
                    >
                      <Icon className="h-5 w-5 text-destructive" />
                      <div className="text-center">
                        <div className="text-xs font-medium">{option.name}</div>
                        <div className="text-[10px] text-muted-foreground leading-tight">{option.description}</div>
                      </div>
                    </Button>
                  </Link>
                )
              })}
            </div>
          </div>
          )}

          {/* Divider */}
          {filteredGastoOptions.length > 0 && filteredIngresoOptions.length > 0 && (
            <div className="border-t my-2" />
          )}

          {/* Ingresos Section */}
          {filteredIngresoOptions.length > 0 && (
          <div className="space-y-3">
            <div className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
              <TrendingUp className="h-4 w-4 text-green-600" />
              <span>Ingresos</span>
            </div>
            <div className="grid grid-cols-2 gap-2">
              {filteredIngresoOptions.map((option) => {
                const Icon = option.icon
                return (
                  <Link
                    key={option.name}
                    href={option.href}
                    onClick={() => setQuickAddOpen(false)}
                  >
                    <Button
                      variant="outline"
                      className="h-auto w-full flex-col gap-1.5 p-3 hover:bg-green-500/5 hover:border-green-500/30"
                    >
                      <Icon className="h-5 w-5 text-green-600" />
                      <div className="text-center">
                        <div className="text-xs font-medium">{option.name}</div>
                        <div className="text-[10px] text-muted-foreground leading-tight">{option.description}</div>
                      </div>
                    </Button>
                  </Link>
                )
              })}
            </div>
          </div>
          )}
        </DialogContent>
      </Dialog>
    </>
  )
}
