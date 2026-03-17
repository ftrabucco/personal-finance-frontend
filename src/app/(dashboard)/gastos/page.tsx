'use client'

import { Suspense, useMemo } from 'react'
import { useSearchParams, useRouter } from 'next/navigation'
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs'
import { useModulosContext } from '@/lib/context/ModulosContext'
import { GastosHistorial } from '@/components/gastos/GastosHistorial'
import { GastosUnicosTab } from '@/components/gastos/GastosUnicosTab'
import { ComprasTab } from '@/components/gastos/ComprasTab'
import { GastosRecurrentesTab } from '@/components/gastos/GastosRecurrentesTab'
import { DebitosAutomaticosTab } from '@/components/gastos/DebitosAutomaticosTab'

function GastosPageContent() {
  const searchParams = useSearchParams()
  const router = useRouter()
  const { isModuloActivo } = useModulosContext()

  const currentTab = searchParams.get('tab') || 'historial'

  const handleTabChange = (value: string) => {
    const params = new URLSearchParams(searchParams.toString())
    params.set('tab', value)
    // Remove 'new' param when switching tabs (it's tab-specific)
    params.delete('new')
    router.replace(`/gastos?${params.toString()}`, { scroll: false })
  }

  // Build visible tabs
  const visibleTabs = useMemo(() => {
    const tabs = [
      { value: 'historial', label: 'Historial' },
      { value: 'unicos', label: 'Unicos' },
    ]

    if (isModuloActivo('compras')) {
      tabs.push({ value: 'cuotas', label: 'Cuotas' })
    }
    if (isModuloActivo('gastos_recurrentes')) {
      tabs.push({ value: 'recurrentes', label: 'Recurrentes' })
    }
    if (isModuloActivo('debitos_automaticos')) {
      tabs.push({ value: 'debitos', label: 'Debitos' })
    }

    return tabs
  }, [isModuloActivo])

  // If current tab is not in visible tabs, default to historial
  const activeTab = visibleTabs.some(t => t.value === currentTab) ? currentTab : 'historial'

  return (
    <div className="space-y-4 md:space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight md:text-3xl">Gastos</h1>
        <p className="text-sm text-muted-foreground md:text-base">
          Gestiona todos tus gastos desde un solo lugar
        </p>
      </div>

      <Tabs value={activeTab} onValueChange={handleTabChange}>
        <TabsList className="w-full justify-start overflow-x-auto">
          {visibleTabs.map((tab) => (
            <TabsTrigger key={tab.value} value={tab.value}>
              {tab.label}
            </TabsTrigger>
          ))}
        </TabsList>

        <TabsContent value="historial">
          <Suspense fallback={<div className="text-center py-8">Cargando...</div>}>
            <GastosHistorial />
          </Suspense>
        </TabsContent>

        <TabsContent value="unicos">
          <Suspense fallback={<div className="text-center py-8">Cargando...</div>}>
            <GastosUnicosTab />
          </Suspense>
        </TabsContent>

        {isModuloActivo('compras') && (
          <TabsContent value="cuotas">
            <Suspense fallback={<div className="text-center py-8">Cargando...</div>}>
              <ComprasTab />
            </Suspense>
          </TabsContent>
        )}

        {isModuloActivo('gastos_recurrentes') && (
          <TabsContent value="recurrentes">
            <Suspense fallback={<div className="text-center py-8">Cargando...</div>}>
              <GastosRecurrentesTab />
            </Suspense>
          </TabsContent>
        )}

        {isModuloActivo('debitos_automaticos') && (
          <TabsContent value="debitos">
            <Suspense fallback={<div className="text-center py-8">Cargando...</div>}>
              <DebitosAutomaticosTab />
            </Suspense>
          </TabsContent>
        )}
      </Tabs>
    </div>
  )
}

export default function GastosPage() {
  return (
    <Suspense fallback={<div className="text-center py-8">Cargando...</div>}>
      <GastosPageContent />
    </Suspense>
  )
}
