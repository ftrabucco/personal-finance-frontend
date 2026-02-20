'use client'

import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { format } from 'date-fns'
import { Form } from '@/components/ui/form'
import {
  DescripcionField,
  MontoConMonedaField,
  FuenteIngresoField,
  FechaField,
  FormActions,
} from '@/components/forms/fields'
import { useCatalogosCompletos } from '@/lib/hooks/useCatalogos'
import { useTipoCambioActual } from '@/lib/hooks/useTipoCambio'
import type { IngresoUnico } from '@/types'

const ingresoUnicoSchema = z.object({
  descripcion: z.string().min(1, 'La descripción es requerida'),
  monto: z.number().positive('El monto debe ser mayor a 0'),
  moneda_origen: z.enum(['ARS', 'USD'], { message: 'La moneda es requerida' }),
  fecha: z.string().min(1, 'La fecha es requerida'),
  fuente_ingreso_id: z.number({ message: 'La fuente de ingreso es requerida' }),
})

type IngresoUnicoFormValues = z.infer<typeof ingresoUnicoSchema>

interface IngresoUnicoFormProps {
  initialData?: Partial<IngresoUnico>
  onSubmit: (data: IngresoUnicoFormValues) => void
  onCancel: () => void
  isSubmitting?: boolean
}

export function IngresoUnicoForm({
  initialData,
  onSubmit,
  onCancel,
  isSubmitting,
}: IngresoUnicoFormProps) {
  const { fuentesIngreso, isLoading: catalogosLoading } = useCatalogosCompletos()
  const { data: tipoCambioResponse } = useTipoCambioActual()

  const form = useForm<IngresoUnicoFormValues>({
    resolver: zodResolver(ingresoUnicoSchema),
    defaultValues: {
      descripcion: initialData?.descripcion || '',
      monto: Number(initialData?.monto) || 0,
      moneda_origen: initialData?.moneda_origen || 'ARS',
      fecha: initialData?.fecha
        ? format(new Date(initialData.fecha), 'yyyy-MM-dd')
        : format(new Date(), 'yyyy-MM-dd'),
      fuente_ingreso_id: initialData?.fuente_ingreso_id,
    },
  })

  const tipoCambio = tipoCambioResponse?.data

  const montoActual = form.watch('monto')
  const monedaActual = form.watch('moneda_origen')

  if (catalogosLoading) {
    return <div className="text-center py-4">Cargando formulario...</div>
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
        <DescripcionField
          control={form.control}
          name="descripcion"
          placeholder="Ej: Sueldo de febrero"
        />

        <MontoConMonedaField
          control={form.control}
          montoName="monto"
          monedaName="moneda_origen"
          monedaActual={monedaActual}
          tipoCambio={tipoCambio}
          montoActual={montoActual}
        />

        <FechaField control={form.control} name="fecha" />

        <FuenteIngresoField
          control={form.control}
          name="fuente_ingreso_id"
          fuentesIngreso={fuentesIngreso.data?.data || []}
        />

        <FormActions onCancel={onCancel} isSubmitting={isSubmitting} />
      </form>
    </Form>
  )
}
