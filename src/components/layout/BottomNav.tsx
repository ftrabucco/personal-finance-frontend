'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { cn } from '@/lib/utils'
import { Home, Receipt, Plus, BarChart3, User } from 'lucide-react'
import { useState } from 'react'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { CreditCard, ShoppingCart, Repeat, Wallet } from 'lucide-react'

const navItems = [
  { name: 'Inicio', href: '/', icon: Home },
  { name: 'Gastos', href: '/gastos', icon: Receipt },
  { name: 'Nuevo', href: '#', icon: Plus, isAction: true },
  { name: 'Reportes', href: '/reportes', icon: BarChart3 },
  { name: 'Perfil', href: '/perfil', icon: User },
]

const quickAddOptions = [
  { name: 'Gasto Único', href: '/gastos-unicos', icon: Wallet, description: 'Un gasto puntual' },
  { name: 'Compra en Cuotas', href: '/compras', icon: ShoppingCart, description: 'Pago en cuotas' },
  { name: 'Gasto Recurrente', href: '/gastos-recurrentes', icon: Repeat, description: 'Se repite cada mes' },
  { name: 'Débito Automático', href: '/debitos-automaticos', icon: CreditCard, description: 'Débito de cuenta' },
]

export function BottomNav() {
  const pathname = usePathname()
  const [quickAddOpen, setQuickAddOpen] = useState(false)

  return (
    <>
      <nav className="fixed bottom-0 left-0 right-0 z-50 border-t bg-background md:hidden">
        <div className="flex h-16 items-center justify-around px-2">
          {navItems.map((item) => {
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
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Nuevo registro</DialogTitle>
          </DialogHeader>
          <div className="grid grid-cols-2 gap-3 py-4">
            {quickAddOptions.map((option) => {
              const Icon = option.icon
              return (
                <Link
                  key={option.name}
                  href={option.href}
                  onClick={() => setQuickAddOpen(false)}
                >
                  <Button
                    variant="outline"
                    className="h-auto w-full flex-col gap-2 p-4 hover:bg-accent"
                  >
                    <Icon className="h-6 w-6" />
                    <div className="text-center">
                      <div className="text-sm font-medium">{option.name}</div>
                      <div className="text-xs text-muted-foreground">{option.description}</div>
                    </div>
                  </Button>
                </Link>
              )
            })}
          </div>
        </DialogContent>
      </Dialog>
    </>
  )
}
