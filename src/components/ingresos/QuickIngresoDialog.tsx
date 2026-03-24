'use client'

import { useState } from 'react'
import { Banknote, CalendarDays, ArrowLeft } from 'lucide-react'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { IngresoUnicoForm } from '@/components/forms/IngresoUnicoForm'
import { IngresoRecurrenteForm } from '@/components/forms/IngresoRecurrenteForm'
import { useCreateIngresoUnico } from '@/lib/hooks/useIngresosUnicos'
import { useCreateIngresoRecurrente } from '@/lib/hooks/useIngresosRecurrentes'
import { useModulosContext } from '@/lib/context/ModulosContext'
import { cleanFormData } from '@/lib/utils/cleanFormData'
import { showErrorToast } from '@/lib/utils/errorHandler'

type IngresoType = 'unico' | 'recurrente' | null

const INGRESO_TYPES = [
  { type: 'unico' as const, label: 'Ingreso Único', description: 'Un ingreso puntual', icon: Banknote, module: 'ingresos_unicos' },
  { type: 'recurrente' as const, label: 'Ingreso Recurrente', description: 'Sueldo, renta, etc.', icon: CalendarDays, module: 'ingresos_recurrentes' },
]

interface QuickIngresoDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function QuickIngresoDialog({ open, onOpenChange }: QuickIngresoDialogProps) {
  const [selectedType, setSelectedType] = useState<IngresoType>(null)
  const { isModuloActivo } = useModulosContext()

  const createIngresoUnico = useCreateIngresoUnico()
  const createIngresoRecurrente = useCreateIngresoRecurrente()

  const handleClose = () => {
    setSelectedType(null)
    onOpenChange(false)
  }

  const handleBack = () => {
    setSelectedType(null)
  }

  const handleSubmitUnico = async (data: Record<string, unknown>) => {
    try {
      await createIngresoUnico.mutateAsync(cleanFormData(data))
      handleClose()
    } catch (error) {
      showErrorToast(error)
    }
  }

  const handleSubmitRecurrente = async (data: Record<string, unknown>) => {
    try {
      await createIngresoRecurrente.mutateAsync(cleanFormData(data))
      handleClose()
    } catch (error) {
      showErrorToast(error)
    }
  }

  const availableTypes = INGRESO_TYPES.filter(t => isModuloActivo(t.module))

  // If only one type is available, skip the selector
  const singleType = availableTypes.length === 1 ? availableTypes[0].type : null

  const effectiveType = selectedType || singleType

  const getTitle = () => {
    if (!effectiveType) return 'Nuevo Ingreso'
    const found = INGRESO_TYPES.find(t => t.type === effectiveType)
    return found ? `Nuevo ${found.label}` : 'Nuevo Ingreso'
  }

  return (
    <Dialog open={open} onOpenChange={(v) => { if (!v) handleClose(); else onOpenChange(v) }}>
      <DialogContent className="sm:max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <div className="flex items-center gap-2">
            {selectedType && !singleType && (
              <Button variant="ghost" size="icon" className="h-8 w-8 shrink-0" onClick={handleBack}>
                <ArrowLeft className="h-4 w-4" />
              </Button>
            )}
            <div>
              <DialogTitle>{getTitle()}</DialogTitle>
              {!effectiveType && (
                <DialogDescription>Elegí el tipo de ingreso a registrar</DialogDescription>
              )}
            </div>
          </div>
        </DialogHeader>

        {!effectiveType ? (
          <div className="grid grid-cols-2 gap-3">
            {availableTypes.map((item) => {
              const Icon = item.icon
              return (
                <Button
                  key={item.type}
                  variant="outline"
                  className="h-auto flex-col gap-2 p-4 hover:bg-accent"
                  onClick={() => setSelectedType(item.type)}
                >
                  <Icon className="h-6 w-6 text-muted-foreground" />
                  <div className="text-center">
                    <div className="text-sm font-medium">{item.label}</div>
                    <div className="text-xs text-muted-foreground">{item.description}</div>
                  </div>
                </Button>
              )
            })}
          </div>
        ) : effectiveType === 'unico' ? (
          <IngresoUnicoForm
            onSubmit={handleSubmitUnico}
            onCancel={handleClose}
            isSubmitting={createIngresoUnico.isPending}
          />
        ) : effectiveType === 'recurrente' ? (
          <IngresoRecurrenteForm
            onSubmit={handleSubmitRecurrente}
            onCancel={handleClose}
            isSubmitting={createIngresoRecurrente.isPending}
          />
        ) : null}
      </DialogContent>
    </Dialog>
  )
}
