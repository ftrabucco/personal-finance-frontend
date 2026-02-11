'use client'

import { useState } from 'react'
import { Sidebar } from '@/components/layout/Sidebar'
import { Header } from '@/components/layout/Header'
import { ErrorBoundary } from '@/components/error/ErrorBoundary'
import { Sheet, SheetContent } from '@/components/ui/sheet'
import { BottomNav } from '@/components/layout/BottomNav'

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
        <SheetContent className="w-64 p-0">
          <Sidebar onNavigate={() => setMobileMenuOpen(false)} />
        </SheetContent>
      </Sheet>

      {/* Main content */}
      <div className="flex flex-1 flex-col overflow-hidden">
        <Header onMenuClick={() => setMobileMenuOpen(true)} />
        <ErrorBoundary showDetails={process.env.NODE_ENV === 'development'}>
          <main className="flex-1 overflow-y-auto bg-background p-4 pb-20 md:p-6 md:pb-6">
            {children}
          </main>
        </ErrorBoundary>
      </div>

      {/* Bottom Navigation - Mobile */}
      <BottomNav />
    </div>
  )
}
