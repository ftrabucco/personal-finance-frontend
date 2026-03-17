'use client'

import { useState } from 'react'
import { Wallet, ShoppingCart, Repeat, CreditCard, ArrowLeft } from 'lucide-react'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { GastoUnicoForm } from '@/components/forms/GastoUnicoForm'
import { CompraForm } from '@/components/forms/CompraForm'
import { GastoRecurrenteForm } from '@/components/forms/GastoRecurrenteForm'
import { DebitoAutomaticoForm } from '@/components/forms/DebitoAutomaticoForm'
import { useCreateGastoUnico } from '@/lib/hooks/useGastosUnicos'
import { useCreateCompra } from '@/lib/hooks/useCompras'
import { useCreateGastoRecurrente } from '@/lib/hooks/useGastosRecurrentes'
import { useCreateDebitoAutomatico } from '@/lib/hooks/useDebitosAutomaticos'
import { useModulosContext } from '@/lib/context/ModulosContext'
import { cleanFormData } from '@/lib/utils/cleanFormData'

type GastoType = 'unico' | 'compra' | 'recurrente' | 'debito' | null

const GASTO_TYPES = [
  { type: 'unico' as const, label: 'Gasto Único', description: 'Un gasto puntual', icon: Wallet, module: 'gastos_unicos' },
  { type: 'compra' as const, label: 'Compra en Cuotas', description: 'Pago en cuotas', icon: ShoppingCart, module: 'compras' },
  { type: 'recurrente' as const, label: 'Gasto Recurrente', description: 'Se repite cada mes', icon: Repeat, module: 'gastos_recurrentes' },
  { type: 'debito' as const, label: 'Débito Automático', description: 'Débito de cuenta', icon: CreditCard, module: 'debitos_automaticos' },
]

interface QuickGastoDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function QuickGastoDialog({ open, onOpenChange }: QuickGastoDialogProps) {
  const [selectedType, setSelectedType] = useState<GastoType>(null)
  const { isModuloActivo } = useModulosContext()

  const createGastoUnico = useCreateGastoUnico()
  const createCompra = useCreateCompra()
  const createRecurrente = useCreateGastoRecurrente()
  const createDebito = useCreateDebitoAutomatico()

  const handleClose = () => {
    setSelectedType(null)
    onOpenChange(false)
  }

  const handleBack = () => {
    setSelectedType(null)
  }

  const handleSubmitUnico = async (data: Record<string, unknown>) => {
    try {
      await createGastoUnico.mutateAsync(cleanFormData(data))
      handleClose()
    } catch (error) {
      console.error('Error al crear gasto único:', error)
    }
  }

  const handleSubmitCompra = async (data: Record<string, unknown>) => {
    try {
      await createCompra.mutateAsync(cleanFormData(data))
      handleClose()
    } catch (error) {
      console.error('Error al crear compra:', error)
    }
  }

  const handleSubmitRecurrente = async (data: Record<string, unknown>) => {
    try {
      await createRecurrente.mutateAsync(cleanFormData(data))
      handleClose()
    } catch (error) {
      console.error('Error al crear gasto recurrente:', error)
    }
  }

  const handleSubmitDebito = async (data: Record<string, unknown>) => {
    try {
      await createDebito.mutateAsync(cleanFormData(data))
      handleClose()
    } catch (error) {
      console.error('Error al crear débito automático:', error)
    }
  }

  const availableTypes = GASTO_TYPES.filter(t => isModuloActivo(t.module))

  const getTitle = () => {
    if (!selectedType) return 'Nuevo Gasto'
    const found = GASTO_TYPES.find(t => t.type === selectedType)
    return found ? `Nuevo ${found.label}` : 'Nuevo Gasto'
  }

  return (
    <Dialog open={open} onOpenChange={(v) => { if (!v) handleClose(); else onOpenChange(v) }}>
      <DialogContent className="sm:max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <div className="flex items-center gap-2">
            {selectedType && (
              <Button variant="ghost" size="icon" className="h-8 w-8 shrink-0" onClick={handleBack}>
                <ArrowLeft className="h-4 w-4" />
              </Button>
            )}
            <div>
              <DialogTitle>{getTitle()}</DialogTitle>
              {!selectedType && (
                <DialogDescription>Elegí el tipo de gasto a registrar</DialogDescription>
              )}
            </div>
          </div>
        </DialogHeader>

        {!selectedType ? (
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
        ) : selectedType === 'unico' ? (
          <GastoUnicoForm
            onSubmit={handleSubmitUnico}
            onCancel={handleClose}
            isSubmitting={createGastoUnico.isPending}
          />
        ) : selectedType === 'compra' ? (
          <CompraForm
            onSubmit={handleSubmitCompra}
            onCancel={handleClose}
            isSubmitting={createCompra.isPending}
          />
        ) : selectedType === 'recurrente' ? (
          <GastoRecurrenteForm
            onSubmit={handleSubmitRecurrente}
            onCancel={handleClose}
            isSubmitting={createRecurrente.isPending}
          />
        ) : selectedType === 'debito' ? (
          <DebitoAutomaticoForm
            onSubmit={handleSubmitDebito}
            onCancel={handleClose}
            isSubmitting={createDebito.isPending}
          />
        ) : null}
      </DialogContent>
    </Dialog>
  )
}
