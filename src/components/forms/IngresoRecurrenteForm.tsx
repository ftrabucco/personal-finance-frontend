'use client'

import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { format } from 'date-fns'
import { formatDateForInput } from '@/lib/utils/formatters'
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form'
import { SearchableSelect } from '@/components/ui/searchable-select'
import {
  DescripcionField,
  MontoConMonedaField,
  FuenteIngresoField,
  FechaField,
  DiaDePagoField,
  FrecuenciaField,
  ActivoField,
  FormActions,
} from '@/components/forms/fields'
import { useCatalogosCompletos, useFrecuencias } from '@/lib/hooks/useCatalogos'
import { useTipoCambioActual } from '@/lib/hooks/useTipoCambio'
import type { IngresoRecurrente } from '@/types'

const ingresoRecurrenteSchema = z.object({
  descripcion: z.string().min(1, 'La descripción es requerida'),
  monto: z.number().positive('El monto debe ser mayor a 0'),
  moneda_origen: z.enum(['ARS', 'USD'], { message: 'La moneda es requerida' }),
  dia_de_pago: z.number().int().min(1).max(31, 'Debe estar entre 1 y 31'),
  mes_de_pago: z.number().int().min(1).max(12).nullable(),
  activo: z.boolean(),
  fecha_inicio: z.string().nullable(),
  fecha_fin: z.string().nullable(),
  fuente_ingreso_id: z.number({ message: 'La fuente de ingreso es requerida' }),
  frecuencia_gasto_id: z.number({ message: 'La frecuencia es requerida' }),
})

type IngresoRecurrenteFormValues = z.infer<typeof ingresoRecurrenteSchema>

interface IngresoRecurrenteFormProps {
  initialData?: Partial<IngresoRecurrente>
  onSubmit: (data: IngresoRecurrenteFormValues) => void
  onCancel: () => void
  isSubmitting?: boolean
}

export function IngresoRecurrenteForm({
  initialData,
  onSubmit,
  onCancel,
  isSubmitting,
}: IngresoRecurrenteFormProps) {
  const { fuentesIngreso, frecuencias: frecuenciasFromCatalogos, isLoading: catalogosLoading } =
    useCatalogosCompletos()
  const { data: frecuenciasResponse } = useFrecuencias()
  const { data: tipoCambioResponse } = useTipoCambioActual()

  const form = useForm<IngresoRecurrenteFormValues>({
    resolver: zodResolver(ingresoRecurrenteSchema),
    defaultValues: {
      descripcion: initialData?.descripcion || '',
      monto: Number(initialData?.monto) || 0,
      moneda_origen: initialData?.moneda_origen || 'ARS',
      dia_de_pago: Number(initialData?.dia_de_pago) || 1,
      mes_de_pago: initialData?.mes_de_pago || null,
      activo: initialData?.activo ?? true,
      fecha_inicio: initialData?.fecha_inicio
        ? formatDateForInput(initialData.fecha_inicio)
        : format(new Date(), 'yyyy-MM-dd'),
      fecha_fin: initialData?.fecha_fin
        ? formatDateForInput(initialData.fecha_fin)
        : null,
      fuente_ingreso_id: initialData?.fuente_ingreso_id,
      frecuencia_gasto_id: initialData?.frecuencia_gasto_id,
    },
  })

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
          placeholder="Ej: Sueldo mensual"
        />

        <MontoConMonedaField
          control={form.control}
          montoName="monto"
          monedaName="moneda_origen"
          monedaActual={monedaActual}
          tipoCambio={tipoCambio}
          montoActual={montoActual}
        />

        <div className="grid grid-cols-2 gap-4">
          <DiaDePagoField
            control={form.control}
            name="dia_de_pago"
            label="Día de Cobro"
            description="Día del mes en que se recibe"
          />

          <FechaField
            control={form.control}
            name="fecha_inicio"
            label="Fecha de Inicio"
          />
        </div>

        <FechaField
          control={form.control}
          name="fecha_fin"
          label="Fecha de Fin (Opcional)"
        />

        <FormField
          control={form.control}
          name="mes_de_pago"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Mes de Cobro (Opcional)</FormLabel>
              <FormControl>
                <SearchableSelect
                  options={[
                    { value: 'null', label: 'Todos los meses' },
                    { value: '1', label: 'Enero' },
                    { value: '2', label: 'Febrero' },
                    { value: '3', label: 'Marzo' },
                    { value: '4', label: 'Abril' },
                    { value: '5', label: 'Mayo' },
                    { value: '6', label: 'Junio' },
                    { value: '7', label: 'Julio' },
                    { value: '8', label: 'Agosto' },
                    { value: '9', label: 'Septiembre' },
                    { value: '10', label: 'Octubre' },
                    { value: '11', label: 'Noviembre' },
                    { value: '12', label: 'Diciembre' },
                  ]}
                  value={field.value?.toString() || 'null'}
                  onValueChange={(value) =>
                    field.onChange(value === 'null' ? null : parseInt(value))
                  }
                  placeholder="Todos los meses"
                  searchPlaceholder="Buscar mes..."
                />
              </FormControl>
              <FormDescription>
                Para ingresos anuales como aguinaldo, especifica el mes
              </FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />

        <FrecuenciaField
          control={form.control}
          name="frecuencia_gasto_id"
          frecuencias={frecuencias}
        />

        <FuenteIngresoField
          control={form.control}
          name="fuente_ingreso_id"
          fuentesIngreso={fuentesIngreso.data?.data || []}
        />

        <ActivoField
          control={form.control}
          name="activo"
          description="Solo los ingresos activos se consideran en proyecciones"
        />

        <FormActions onCancel={onCancel} isSubmitting={isSubmitting} />
      </form>
    </Form>
  )
}
