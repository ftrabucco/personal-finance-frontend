'use client'

import { useState } from 'react'
import { Sidebar } from '@/components/layout/Sidebar'
import { Header } from '@/components/layout/Header'
import { ErrorBoundary } from '@/components/error/ErrorBoundary'
import { Sheet, SheetContent } from '@/components/ui/sheet'

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)

  return (
    <div className="flex h-screen overflow-hidden">
      {/* Sidebar - Desktop */}
      <aside className="hidden md:block">
        <Sidebar />
      </aside>

      {/* Sidebar - Mobile drawer */}
      <Sheet open={mobileMenuOpen} onOpenChange={setMobileMenuOpen}>
        <SheetContent>
          <Sidebar onNavigate={() => setMobileMenuOpen(false)} />
        </SheetContent>
      </Sheet>

      {/* Main content */}
      <div className="flex flex-1 flex-col overflow-hidden">
        <Header onMenuClick={() => setMobileMenuOpen(true)} />
        <ErrorBoundary showDetails={process.env.NODE_ENV === 'development'}>
          <main className="flex-1 overflow-y-auto bg-background p-6">
            {children}
          </main>
        </ErrorBoundary>
      </div>
    </div>
  )
}
