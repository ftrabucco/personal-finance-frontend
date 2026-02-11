'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { cn } from '@/lib/utils'
import {
  Home,
  Receipt,
  CreditCard,
  ShoppingCart,
  Repeat,
  Wallet,
  BarChart3,
  User,
  LogOut,
  Moon,
  Sun,
} from 'lucide-react'
import { useTheme } from 'next-themes'
import { useAuth } from '@/lib/auth/authContext'
import { Button } from '@/components/ui/button'

const navigation = [
  { name: 'Dashboard', href: '/', icon: Home },
  { name: 'Gastos', href: '/gastos', icon: Receipt },
  { name: 'Gastos Únicos', href: '/gastos-unicos', icon: Wallet },
  { name: 'Compras', href: '/compras', icon: ShoppingCart },
  { name: 'Gastos Recurrentes', href: '/gastos-recurrentes', icon: Repeat },
  { name: 'Débitos Automáticos', href: '/debitos-automaticos', icon: CreditCard },
  { name: 'Tarjetas', href: '/tarjetas', icon: CreditCard },
  { name: 'Reportes', href: '/reportes', icon: BarChart3 },
  { name: 'Perfil', href: '/perfil', icon: User },
]

interface SidebarProps {
  onNavigate?: () => void
}

export function Sidebar({ onNavigate }: SidebarProps) {
  const pathname = usePathname()
  const { logout, user } = useAuth()
  const { theme, setTheme } = useTheme()
  const [mounted, setMounted] = useState(false)

  // Avoid hydration mismatch by only rendering theme-dependent content after mount
  useEffect(() => {
    setMounted(true)
  }, [])

  return (
    <div className="flex h-full w-64 flex-col border-r bg-card">
      {/* Header */}
      <div className="flex h-16 items-center border-b px-6">
        <h1 className="text-xl font-bold">Finanzas</h1>
      </div>

      {/* User info */}
      <div className="border-b p-4">
        <div className="flex items-center space-x-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary text-primary-foreground">
            {user?.nombre?.charAt(0).toUpperCase()}
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium truncate">{user?.nombre}</p>
            <p className="text-xs text-muted-foreground truncate">{user?.email}</p>
          </div>
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 space-y-1 p-4 overflow-y-auto">
        {navigation.map((item) => {
          const isActive = pathname === item.href
          return (
            <Link
              key={item.name}
              href={item.href}
              onClick={onNavigate}
              className={cn(
                'flex items-center space-x-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors',
                isActive
                  ? 'bg-primary text-primary-foreground'
                  : 'text-muted-foreground hover:bg-accent hover:text-accent-foreground'
              )}
            >
              <item.icon className="h-5 w-5" />
              <span>{item.name}</span>
            </Link>
          )
        })}
      </nav>

      {/* Theme toggle & Logout */}
      <div className="border-t p-4 space-y-1">
        <Button
          variant="ghost"
          className="w-full justify-start text-muted-foreground"
          onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
        >
          {mounted ? (
            theme === 'dark' ? (
              <>
                <Sun className="mr-3 h-5 w-5" />
                Modo Claro
              </>
            ) : (
              <>
                <Moon className="mr-3 h-5 w-5" />
                Modo Oscuro
              </>
            )
          ) : (
            <>
              <Moon className="mr-3 h-5 w-5 opacity-0" />
              <span className="opacity-0">Modo Oscuro</span>
            </>
          )}
        </Button>
        <Button
          variant="ghost"
          className="w-full justify-start text-muted-foreground hover:text-destructive"
          onClick={() => logout()}
        >
          <LogOut className="mr-3 h-5 w-5" />
          Cerrar Sesión
        </Button>
      </div>
    </div>
  )
}
