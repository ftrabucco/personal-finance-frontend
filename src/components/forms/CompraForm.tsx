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
  CantidadCuotasField,
  FormActions,
} from '@/components/forms/fields'
import { useCatalogosCompletos } from '@/lib/hooks/useCatalogos'
import { useTarjetas } from '@/lib/hooks/useTarjetas'
import { useTipoCambioActual } from '@/lib/hooks/useTipoCambio'
import type { Compra, Moneda } from '@/types'

const compraSchema = z.object({
  descripcion: z.string().min(1, 'La descripción es requerida'),
  monto_total: z.number().positive('El monto debe ser mayor a 0'),
  moneda_origen: z.enum(['ARS', 'USD'], { message: 'La moneda es requerida' }),
  fecha_compra: z.string().min(1, 'La fecha es requerida'),
  cantidad_cuotas: z.number().int().min(1, 'Debe tener al menos 1 cuota'),
  categoria_gasto_id: z.number({ message: 'La categoría es requerida' }),
  importancia_gasto_id: z.number({ message: 'La importancia es requerida' }),
  tipo_pago_id: z.number({ message: 'El tipo de pago es requerido' }),
  tarjeta_id: z.number().nullable(),
})

type CompraFormValues = z.infer<typeof compraSchema>

interface CompraFormProps {
  initialData?: Partial<Compra>
  onSubmit: (data: CompraFormValues) => void
  onCancel: () => void
  isSubmitting?: boolean
}

export function CompraForm({
  initialData,
  onSubmit,
  onCancel,
  isSubmitting,
}: CompraFormProps) {
  const { categorias, importancias, tiposPago, isLoading: catalogosLoading } =
    useCatalogosCompletos()
  const { data: tarjetasResponse } = useTarjetas()
  const { data: tipoCambioResponse } = useTipoCambioActual()

  const form = useForm<CompraFormValues>({
    resolver: zodResolver(compraSchema),
    defaultValues: {
      descripcion: initialData?.descripcion || '',
      monto_total: initialData?.monto_total || 0,
      moneda_origen: (initialData?.moneda_origen as Moneda) || 'ARS',
      fecha_compra: initialData?.fecha_compra
        ? format(new Date(initialData.fecha_compra), 'yyyy-MM-dd')
        : format(new Date(), 'yyyy-MM-dd'),
      cantidad_cuotas: initialData?.cantidad_cuotas || 1,
      categoria_gasto_id: initialData?.categoria_gasto_id,
      importancia_gasto_id: initialData?.importancia_gasto_id,
      tipo_pago_id: initialData?.tipo_pago_id,
      tarjeta_id: initialData?.tarjeta_id || null,
    },
  })

  const tarjetas = tarjetasResponse?.data || []
  const tipoCambio = tipoCambioResponse?.data

  const montoTotal = form.watch('monto_total')
  const monedaActual = form.watch('moneda_origen')
  const cantidadCuotas = form.watch('cantidad_cuotas')

  const montoPorCuota = cantidadCuotas > 0 ? montoTotal / cantidadCuotas : 0

  const montoConvertido = tipoCambio && tipoCambio.valor_venta_usd_ars
    ? monedaActual === 'ARS'
      ? montoTotal / Number(tipoCambio.valor_venta_usd_ars)
      : montoTotal * Number(tipoCambio.valor_venta_usd_ars)
    : 0

  const cuotaConvertida = cantidadCuotas > 0 ? montoConvertido / cantidadCuotas : 0

  if (catalogosLoading) {
    return <div className="text-center py-4">Cargando formulario...</div>
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
        <DescripcionField
          control={form.control}
          name="descripcion"
          placeholder="Ej: Notebook Lenovo"
        />

        <MontoConMonedaField
          control={form.control}
          montoName="monto_total"
          monedaName="moneda_origen"
          monedaActual={monedaActual}
          tipoCambio={tipoCambio}
          montoActual={montoTotal}
          label="Monto Total"
        />

        <CantidadCuotasField
          control={form.control}
          name="cantidad_cuotas"
          montoPorCuota={montoPorCuota}
          cuotaConvertida={cuotaConvertida}
          monedaActual={monedaActual}
        />

        <FechaField
          control={form.control}
          name="fecha_compra"
          label="Fecha de Compra"
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
          label="Tarjeta"
          description="Solo se muestran tarjetas que permiten cuotas"
          filterCuotas={true}
        />

        <FormActions onCancel={onCancel} isSubmitting={isSubmitting} />
      </form>
    </Form>
  )
}
