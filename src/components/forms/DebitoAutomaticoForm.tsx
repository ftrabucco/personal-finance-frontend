'use client'

import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { Form } from '@/components/ui/form'
import {
  DescripcionField,
  MontoConMonedaField,
  CategoriaField,
  ImportanciaField,
  TipoPagoField,
  TarjetaField,
  DiaDePagoField,
  FrecuenciaField,
  ActivoField,
  FormActions,
} from '@/components/forms/fields'
import { useCatalogosCompletos, useFrecuencias } from '@/lib/hooks/useCatalogos'
import { useTarjetas } from '@/lib/hooks/useTarjetas'
import { useTipoCambioActual } from '@/lib/hooks/useTipoCambio'
import type { DebitoAutomatico, Moneda } from '@/types'

const debitoAutomaticoSchema = z.object({
  descripcion: z.string().min(1, 'La descripción es requerida'),
  monto: z.number().positive('El monto debe ser mayor a 0'),
  dia_de_pago: z.number().int().min(1).max(31, 'Debe estar entre 1 y 31'),
  activo: z.boolean(),
  categoria_gasto_id: z.number({ message: 'La categoría es requerida' }),
  importancia_gasto_id: z.number({ message: 'La importancia es requerida' }),
  tipo_pago_id: z.number({ message: 'El tipo de pago es requerido' }),
  tarjeta_id: z.number().nullable(),
  frecuencia_gasto_id: z.number({ message: 'La frecuencia es requerida' }),
  moneda_origen: z.enum(['ARS', 'USD'], { message: 'La moneda es requerida' }),
})

type DebitoAutomaticoFormValues = z.infer<typeof debitoAutomaticoSchema>

interface DebitoAutomaticoFormProps {
  initialData?: Partial<DebitoAutomatico>
  onSubmit: (data: DebitoAutomaticoFormValues) => void
  onCancel: () => void
  isSubmitting?: boolean
}

export function DebitoAutomaticoForm({
  initialData,
  onSubmit,
  onCancel,
  isSubmitting,
}: DebitoAutomaticoFormProps) {
  const { categorias, importancias, tiposPago, isLoading: catalogosLoading } =
    useCatalogosCompletos()
  const { data: frecuenciasResponse } = useFrecuencias()
  const { data: tarjetasResponse } = useTarjetas()
  const { data: tipoCambioResponse } = useTipoCambioActual()

  const form = useForm<DebitoAutomaticoFormValues>({
    resolver: zodResolver(debitoAutomaticoSchema),
    defaultValues: {
      descripcion: initialData?.descripcion || '',
      monto: Number(initialData?.monto) || 0,
      dia_de_pago: Number(initialData?.dia_de_pago) || 1,
      activo: initialData?.activo ?? true,
      categoria_gasto_id: initialData?.categoria_gasto_id,
      importancia_gasto_id: initialData?.importancia_gasto_id,
      tipo_pago_id: initialData?.tipo_pago_id,
      tarjeta_id: initialData?.tarjeta_id || null,
      frecuencia_gasto_id: initialData?.frecuencia_gasto_id,
      moneda_origen: (initialData?.moneda_origen as Moneda) || 'ARS',
    },
  })

  const tarjetas = tarjetasResponse?.data || []
  const frecuencias = frecuenciasResponse?.data || []
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
          placeholder="Ej: Netflix Premium"
        />

        <MontoConMonedaField
          control={form.control}
          montoName="monto"
          monedaName="moneda_origen"
          monedaActual={monedaActual}
          tipoCambio={tipoCambio}
          montoActual={montoActual}
        />

        <DiaDePagoField
          control={form.control}
          name="dia_de_pago"
          label="Día de Débito"
          description="Día del mes en que se debita"
        />

        <FrecuenciaField
          control={form.control}
          name="frecuencia_gasto_id"
          frecuencias={frecuencias}
        />

        <CategoriaField
          control={form.control}
          name="categoria_gasto_id"
          categorias={categorias.data?.data || []}
        />

        <ImportanciaField
          control={form.control}
          name="importancia_gasto_id"
          importancias={importancias.data?.data || []}
        />

        <TipoPagoField
          control={form.control}
          name="tipo_pago_id"
          tiposPago={tiposPago.data?.data || []}
        />

        <TarjetaField
          control={form.control}
          name="tarjeta_id"
          tarjetas={tarjetas}
        />

        <ActivoField
          control={form.control}
          name="activo"
          description="Solo los débitos activos generarán gastos automáticos"
        />

        <FormActions onCancel={onCancel} isSubmitting={isSubmitting} />
      </form>
    </Form>
  )
}
