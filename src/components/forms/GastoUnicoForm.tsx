'use client'

import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { format } from 'date-fns'
import { Form } from '@/components/ui/form'
import {
  DescripcionField,
  MontoConMonedaField,
  CategoriaField,
  ImportanciaField,
  TipoPagoField,
  TarjetaField,
  FechaField,
  FormActions,
} from '@/components/forms/fields'
import { useCatalogosCompletos } from '@/lib/hooks/useCatalogos'
import { useTarjetas } from '@/lib/hooks/useTarjetas'
import { useTipoCambioActual } from '@/lib/hooks/useTipoCambio'
import type { GastoUnico } from '@/types'

const gastoUnicoSchema = z.object({
  descripcion: z.string().min(1, 'La descripción es requerida'),
  monto: z.number().positive('El monto debe ser mayor a 0'),
  moneda_origen: z.enum(['ARS', 'USD'], { message: 'La moneda es requerida' }),
  fecha: z.string().min(1, 'La fecha es requerida'),
  categoria_gasto_id: z.number({ message: 'La categoría es requerida' }),
  importancia_gasto_id: z.number({ message: 'La importancia es requerida' }),
  tipo_pago_id: z.number({ message: 'El tipo de pago es requerido' }),
  tarjeta_id: z.number().nullable(),
})

type GastoUnicoFormValues = z.infer<typeof gastoUnicoSchema>

interface GastoUnicoFormProps {
  initialData?: Partial<GastoUnico>
  onSubmit: (data: GastoUnicoFormValues) => void
  onCancel: () => void
  isSubmitting?: boolean
}

export function GastoUnicoForm({
  initialData,
  onSubmit,
  onCancel,
  isSubmitting,
}: GastoUnicoFormProps) {
  const { categorias, importancias, tiposPago, isLoading: catalogosLoading } =
    useCatalogosCompletos()
  const { data: tarjetasResponse } = useTarjetas()
  const { data: tipoCambioResponse } = useTipoCambioActual()

  const form = useForm<GastoUnicoFormValues>({
    resolver: zodResolver(gastoUnicoSchema),
    defaultValues: {
      descripcion: initialData?.descripcion || '',
      monto: Number(initialData?.monto) || 0,
      moneda_origen: initialData?.moneda_origen || 'ARS',
      fecha: initialData?.fecha
        ? format(new Date(initialData.fecha), 'yyyy-MM-dd')
        : format(new Date(), 'yyyy-MM-dd'),
      categoria_gasto_id: initialData?.categoria_gasto_id,
      importancia_gasto_id: initialData?.importancia_gasto_id,
      tipo_pago_id: initialData?.tipo_pago_id,
      tarjeta_id: initialData?.tarjeta_id || null,
    },
  })

  const tarjetas = tarjetasResponse?.data || []
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
          placeholder="Ej: Compra en supermercado"
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

        <FormActions onCancel={onCancel} isSubmitting={isSubmitting} />
      </form>
    </Form>
  )
}
