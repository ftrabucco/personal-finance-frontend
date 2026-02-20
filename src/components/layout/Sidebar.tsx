'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { cn } from '@/lib/utils'
import {
  Home,
  History,
  CreditCard,
  ShoppingCart,
  Repeat,
  PlusCircle,
  TrendingUp,
  Heart,
  User,
  LogOut,
  Moon,
  Sun,
  Zap,
  Wallet,
  CalendarDays,
} from 'lucide-react'
import { useTheme } from 'next-themes'
import { useAuth } from '@/lib/auth/authContext'
import { Button } from '@/components/ui/button'

// Navegación agrupada por secciones
const navigationSections = [
  {
    title: null, // Sin título para el dashboard
    items: [
      { name: 'Dashboard', href: '/', icon: Home },
    ],
  },
  {
    title: 'Registro',
    items: [
      { name: 'Historial', href: '/gastos', icon: History },
      { name: 'Nuevo Gasto', href: '/gastos-unicos', icon: PlusCircle },
      { name: 'Cuotas', href: '/compras', icon: ShoppingCart },
      { name: 'Pagos Fijos', href: '/gastos-recurrentes', icon: Repeat },
      { name: 'Débitos', href: '/debitos-automaticos', icon: Zap },
    ],
  },
  {
    title: 'Ingresos',
    items: [
      { name: 'Ingreso Único', href: '/ingresos-unicos', icon: Wallet },
      { name: 'Ingresos Fijos', href: '/ingresos-recurrentes', icon: CalendarDays },
    ],
  },
  {
    title: 'Finanzas',
    items: [
      { name: 'Tarjetas', href: '/tarjetas', icon: CreditCard },
      { name: 'Proyecciones', href: '/proyecciones', icon: TrendingUp },
      { name: 'Salud Financiera', href: '/salud-financiera', icon: Heart },
    ],
  },
  {
    title: null,
    items: [
      { name: 'Perfil', href: '/perfil', icon: User },
    ],
  },
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
      <nav className="flex-1 p-4 overflow-y-auto">
        {navigationSections.map((section, sectionIndex) => (
          <div key={sectionIndex} className={section.title ? 'mt-4 first:mt-0' : ''}>
            {section.title && (
              <p className="px-3 mb-2 text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                {section.title}
              </p>
            )}
            <div className="space-y-1">
              {section.items.map((item) => {
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
            </div>
          </div>
        ))}
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
