'use client'

import { Suspense, useState } from 'react'
import { useSearchParams } from 'next/navigation'
import { Plus } from 'lucide-react'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Button } from '@/components/ui/button'
import { useModulosContext } from '@/lib/context/ModulosContext'
import { IngresosUnicosTab } from '@/components/ingresos/IngresosUnicosTab'
import { IngresosRecurrentesTab } from '@/components/ingresos/IngresosRecurrentesTab'
import { QuickIngresoDialog } from '@/components/ingresos/QuickIngresoDialog'

function IngresosPageContent() {
  const searchParams = useSearchParams()
  const { isModuloActivo } = useModulosContext()
  const [quickAddOpen, setQuickAddOpen] = useState(false)

  const tabFromUrl = searchParams.get('tab')
  const defaultTab = tabFromUrl === 'recurrentes' ? 'recurrentes' : 'unicos'

  return (
    <div className="space-y-4 md:space-y-6">
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight md:text-3xl">Ingresos</h1>
          <p className="text-sm text-muted-foreground md:text-base">
            Gestiona todos tus ingresos
          </p>
        </div>
        <Button onClick={() => setQuickAddOpen(true)} className="gap-2">
          <Plus className="h-4 w-4" />
          <span className="hidden sm:inline">Nuevo Ingreso</span>
          <span className="sm:hidden">Nuevo</span>
        </Button>
      </div>

      <QuickIngresoDialog open={quickAddOpen} onOpenChange={setQuickAddOpen} />

      <Tabs defaultValue={defaultTab} className="w-full">
        <TabsList>
          <TabsTrigger value="unicos">Únicos</TabsTrigger>
          {isModuloActivo('ingresos_recurrentes') && (
            <TabsTrigger value="recurrentes">Recurrentes</TabsTrigger>
          )}
        </TabsList>

        <TabsContent value="unicos">
          <Suspense fallback={<div className="text-center py-8">Cargando...</div>}>
            <IngresosUnicosTab />
          </Suspense>
        </TabsContent>

        {isModuloActivo('ingresos_recurrentes') && (
          <TabsContent value="recurrentes">
            <Suspense fallback={<div className="text-center py-8">Cargando...</div>}>
              <IngresosRecurrentesTab />
            </Suspense>
          </TabsContent>
        )}
      </Tabs>
    </div>
  )
}

export default function IngresosPage() {
  return (
    <Suspense fallback={<div className="text-center py-8">Cargando...</div>}>
      <IngresosPageContent />
    </Suspense>
  )
}
