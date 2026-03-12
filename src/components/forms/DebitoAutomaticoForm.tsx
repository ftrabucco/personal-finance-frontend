'use client'

import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { useEffect } from 'react'
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel } from '@/components/ui/form'
import { Switch } from '@/components/ui/switch'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { CreditCard, Info, Building2 } from 'lucide-react'
import { SearchableSelect } from '@/components/ui/searchable-select'
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
import { useCuentasBancarias } from '@/lib/hooks/useCuentasBancarias'
import { useTipoCambioActual } from '@/lib/hooks/useTipoCambio'
import type { DebitoAutomatico, Moneda } from '@/types'

const debitoAutomaticoSchema = z.object({
  descripcion: z.string().min(1, 'La descripcion es requerida'),
  monto: z.number().positive('El monto debe ser mayor a 0'),
  dia_de_pago: z.number().int().min(1).max(31, 'Debe estar entre 1 y 31').nullable(),
  usa_vencimiento_tarjeta: z.boolean(),
  activo: z.boolean(),
  categoria_gasto_id: z.number({ message: 'La categoria es requerida' }),
  importancia_gasto_id: z.number({ message: 'La importancia es requerida' }),
  tipo_pago_id: z.number({ message: 'El tipo de pago es requerido' }),
  tarjeta_id: z.number().nullable(),
  cuenta_bancaria_id: z.number().nullable(),
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
  const { data: cuentasBancariasResponse } = useCuentasBancarias({ activa: true })
  const { data: tipoCambioResponse } = useTipoCambioActual()

  const form = useForm<DebitoAutomaticoFormValues>({
    resolver: zodResolver(debitoAutomaticoSchema),
    defaultValues: {
      descripcion: initialData?.descripcion || '',
      monto: Number(initialData?.monto) || 0,
      dia_de_pago: initialData?.dia_de_pago ?? 1,
      usa_vencimiento_tarjeta: initialData?.usa_vencimiento_tarjeta ?? false,
      activo: initialData?.activo ?? true,
      categoria_gasto_id: initialData?.categoria_gasto_id,
      importancia_gasto_id: initialData?.importancia_gasto_id,
      tipo_pago_id: initialData?.tipo_pago_id,
      tarjeta_id: initialData?.tarjeta_id || null,
      cuenta_bancaria_id: initialData?.cuenta_bancaria_id || null,
      frecuencia_gasto_id: initialData?.frecuencia_gasto_id,
      moneda_origen: (initialData?.moneda_origen as Moneda) || 'ARS',
    },
  })

  const tarjetas = tarjetasResponse?.data || []
  const cuentasBancarias = cuentasBancariasResponse?.data || []
  const frecuencias = frecuenciasResponse?.data || []
  const tipoCambio = tipoCambioResponse?.data

  const montoActual = form.watch('monto')
  const monedaActual = form.watch('moneda_origen')
  const tarjetaIdActual = form.watch('tarjeta_id')
  const cuentaBancariaIdActual = form.watch('cuenta_bancaria_id')
  const usaVencimientoTarjeta = form.watch('usa_vencimiento_tarjeta')

  // Find selected card and bank account details
  const tarjetaSeleccionada = tarjetas.find(t => t.id === tarjetaIdActual)
  const cuentaBancariaSeleccionada = cuentasBancarias.find(c => c.id === cuentaBancariaIdActual)
  const esTarjetaCredito = tarjetaSeleccionada?.tipo === 'credito'

  // Clear cuenta_bancaria_id when tarjeta is selected and vice versa
  useEffect(() => {
    if (tarjetaIdActual && cuentaBancariaIdActual) {
      form.setValue('cuenta_bancaria_id', null)
    }
  }, [tarjetaIdActual, form, cuentaBancariaIdActual])

  useEffect(() => {
    if (cuentaBancariaIdActual && tarjetaIdActual) {
      form.setValue('tarjeta_id', null)
      form.setValue('usa_vencimiento_tarjeta', false)
    }
  }, [cuentaBancariaIdActual, form, tarjetaIdActual])

  // Auto-enable usa_vencimiento_tarjeta when selecting a credit card
  useEffect(() => {
    if (esTarjetaCredito && !usaVencimientoTarjeta) {
      // Suggest but don't force
    }
    // If not credit card, disable usa_vencimiento_tarjeta
    if (!esTarjetaCredito && usaVencimientoTarjeta) {
      form.setValue('usa_vencimiento_tarjeta', false)
    }
  }, [esTarjetaCredito, usaVencimientoTarjeta, form])

  // Set dia_de_pago to null when using card due date
  useEffect(() => {
    if (usaVencimientoTarjeta) {
      form.setValue('dia_de_pago', null)
    } else if (form.getValues('dia_de_pago') === null) {
      form.setValue('dia_de_pago', 1)
    }
  }, [usaVencimientoTarjeta, form])

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

        <TarjetaField
          control={form.control}
          name="tarjeta_id"
          tarjetas={tarjetas}
          disabled={!!cuentaBancariaIdActual}
        />

        {/* Bank Account Field */}
        <FormField
          control={form.control}
          name="cuenta_bancaria_id"
          render={({ field }) => (
            <FormItem>
              <FormLabel className="flex items-center gap-2">
                <Building2 className="h-4 w-4" />
                Cuenta Bancaria (opcional)
              </FormLabel>
              <FormControl>
                <SearchableSelect
                  options={[
                    { value: 'none', label: 'Sin cuenta bancaria' },
                    ...cuentasBancarias.map((cuenta) => ({
                      value: cuenta.id.toString(),
                      label: `${cuenta.nombre} - ${cuenta.banco}${cuenta.ultimos_4_digitos ? ` (****${cuenta.ultimos_4_digitos})` : ''} [${cuenta.moneda}]`,
                    })),
                  ]}
                  value={field.value?.toString() || 'none'}
                  onValueChange={(value) => field.onChange(value === 'none' ? null : Number(value))}
                  placeholder="Seleccionar cuenta bancaria"
                  searchPlaceholder="Buscar cuenta..."
                  disabled={!!tarjetaIdActual}
                />
              </FormControl>
              <FormDescription>
                La cuenta bancaria desde donde se debita el gasto
              </FormDescription>
            </FormItem>
          )}
        />

        {/* Show usa_vencimiento_tarjeta option only for credit cards */}
        {esTarjetaCredito && (
          <FormField
            control={form.control}
            name="usa_vencimiento_tarjeta"
            render={({ field }) => (
              <FormItem className="flex flex-row items-center justify-between rounded-lg border p-3 shadow-sm">
                <div className="space-y-0.5">
                  <FormLabel>Usar fecha de vencimiento de la tarjeta</FormLabel>
                  <FormDescription>
                    El cargo se registrara el dia {tarjetaSeleccionada?.dia_mes_vencimiento} de cada mes
                  </FormDescription>
                </div>
                <FormControl>
                  <Switch
                    checked={field.value}
                    onCheckedChange={field.onChange}
                  />
                </FormControl>
              </FormItem>
            )}
          />
        )}

        {/* Info alert about when the debit impacts */}
        {(tarjetaIdActual || cuentaBancariaIdActual) && (
          <Alert>
            <Info className="h-4 w-4" />
            <AlertDescription>
              {tarjetaIdActual ? (
                esTarjetaCredito ? (
                  usaVencimientoTarjeta ? (
                    <>
                      <strong>Tarjeta de credito:</strong> El cargo se cobrara el dia{' '}
                      <strong>{tarjetaSeleccionada?.dia_mes_vencimiento}</strong> de cada mes
                      (fecha de vencimiento de la tarjeta).
                    </>
                  ) : (
                    <>
                      <strong>Tarjeta de credito:</strong> El cargo se registra el dia indicado,
                      pero el pago real sale de tu bolsillo el dia{' '}
                      <strong>{tarjetaSeleccionada?.dia_mes_vencimiento}</strong> (vencimiento de la tarjeta).
                    </>
                  )
                ) : (
                  <>
                    <strong>Tarjeta de debito:</strong> El cargo se debita directamente de tu cuenta
                    el dia indicado.
                  </>
                )
              ) : (
                <>
                  <strong>Cuenta bancaria:</strong> El cargo se debita de{' '}
                  <strong>{cuentaBancariaSeleccionada?.nombre}</strong> ({cuentaBancariaSeleccionada?.banco})
                  el dia indicado.
                </>
              )}
            </AlertDescription>
          </Alert>
        )}

        {/* Show dia_de_pago only if not using card due date */}
        {!usaVencimientoTarjeta && (
          <DiaDePagoField
            control={form.control}
            name="dia_de_pago"
            label="Dia de Debito"
            description={esTarjetaCredito
              ? 'Dia del mes en que se carga a la tarjeta'
              : 'Dia del mes en que se debita de tu cuenta'
            }
          />
        )}

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

        <ActivoField
          control={form.control}
          name="activo"
          description="Solo los debitos activos generaran gastos automaticos"
        />

        <FormActions onCancel={onCancel} isSubmitting={isSubmitting} />
      </form>
    </Form>
  )
}
