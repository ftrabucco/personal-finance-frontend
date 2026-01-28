'use client'

import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { format } from 'date-fns'
import { Button } from '@/components/ui/button'
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { CurrencySelector } from '@/components/forms/CurrencySelector'
import { useCatalogosCompletos } from '@/lib/hooks/useCatalogos'
import { useTarjetas } from '@/lib/hooks/useTarjetas'
import { useTipoCambioActual } from '@/lib/hooks/useTipoCambio'
import { formatCurrency } from '@/lib/utils/formatters'
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
      moneda_origen: initialData?.moneda_origen || 'ARS',
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
        <FormField
          control={form.control}
          name="descripcion"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Descripción</FormLabel>
              <FormControl>
                <Textarea
                  placeholder="Ej: Notebook Lenovo"
                  {...field}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        {/* Selector de Moneda */}
        <FormField
          control={form.control}
          name="moneda_origen"
          render={({ field }) => (
            <FormItem>
              <CurrencySelector
                value={field.value}
                onChange={field.onChange}
                label="Moneda"
              />
              <FormMessage />
            </FormItem>
          )}
        />

        {/* Monto Total */}
        <FormField
          control={form.control}
          name="monto_total"
          render={({ field }) => (
            <FormItem>
              <FormLabel>
                Monto Total {monedaActual === 'ARS' ? '(ARS)' : '(USD)'}
              </FormLabel>
              <FormControl>
                <Input
                  type="number"
                  step="0.01"
                  min="0"
                  placeholder="0.00"
                  value={field.value || ''}
                  onChange={(e) => {
                    const value = e.target.value
                    field.onChange(value === '' ? 0 : parseFloat(value))
                  }}
                  onFocus={(e) => {
                    if (field.value === 0) {
                      e.target.value = ''
                    }
                  }}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        {/* Preview de conversión */}
        {tipoCambio && tipoCambio.valor_venta_usd_ars && montoTotal > 0 && montoConvertido > 0 && (
          <div className="p-3 bg-muted rounded-lg text-sm">
            <p className="text-muted-foreground mb-1">Conversión estimada:</p>
            <p className="font-semibold">
              {monedaActual === 'ARS' ? (
                <>Total: ≈ US$ {Number(montoConvertido).toFixed(2)}</>
              ) : (
                <>Total: ≈ {formatCurrency(montoConvertido)}</>
              )}
            </p>
            <p className="text-xs text-muted-foreground mt-1">
              TC: ${Number(tipoCambio.valor_venta_usd_ars).toFixed(2)}
            </p>
          </div>
        )}

        {/* Cantidad de Cuotas */}
        <FormField
          control={form.control}
          name="cantidad_cuotas"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Cantidad de Cuotas</FormLabel>
              <FormControl>
                <Input
                  type="number"
                  min="1"
                  placeholder="1"
                  {...field}
                  onChange={(e) =>
                    field.onChange(parseInt(e.target.value) || 1)
                  }
                />
              </FormControl>
              <FormDescription>
                Cuota mensual:{' '}
                {monedaActual === 'ARS'
                  ? `${formatCurrency(montoPorCuota)} (≈ US$ ${cuotaConvertida.toFixed(2)})`
                  : `US$ ${montoPorCuota.toFixed(2)} (≈ ${formatCurrency(cuotaConvertida)})`}
              </FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="fecha_compra"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Fecha de Compra</FormLabel>
              <FormControl>
                <Input type="date" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="categoria_gasto_id"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Categoría</FormLabel>
              <Select
                onValueChange={(value) => field.onChange(parseInt(value))}
                value={field.value?.toString()}
              >
                <FormControl>
                  <SelectTrigger>
                    <SelectValue placeholder="Seleccionar categoría" />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  {categorias.data?.data.map((cat) => (
                    <SelectItem key={cat.id} value={cat.id.toString()}>
                      {cat.nombre_categoria}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="importancia_gasto_id"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Importancia</FormLabel>
              <Select
                onValueChange={(value) => field.onChange(parseInt(value))}
                value={field.value?.toString()}
              >
                <FormControl>
                  <SelectTrigger>
                    <SelectValue placeholder="Seleccionar importancia" />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  {importancias.data?.data.map((imp) => (
                    <SelectItem key={imp.id} value={imp.id.toString()}>
                      {imp.nombre_importancia}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="tipo_pago_id"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Tipo de Pago</FormLabel>
              <Select
                onValueChange={(value) => field.onChange(parseInt(value))}
                value={field.value?.toString()}
              >
                <FormControl>
                  <SelectTrigger>
                    <SelectValue placeholder="Seleccionar tipo de pago" />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  {tiposPago.data?.data.map((tipo) => (
                    <SelectItem key={tipo.id} value={tipo.id.toString()}>
                      {tipo.nombre}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="tarjeta_id"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Tarjeta</FormLabel>
              <Select
                onValueChange={(value) =>
                  field.onChange(value === 'null' ? null : parseInt(value))
                }
                value={field.value?.toString() || 'null'}
              >
                <FormControl>
                  <SelectTrigger>
                    <SelectValue placeholder="Sin tarjeta" />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  <SelectItem value="null">Sin tarjeta</SelectItem>
                  {tarjetas
                    .filter((t) => t.permite_cuotas)
                    .map((tarjeta) => (
                      <SelectItem key={tarjeta.id} value={tarjeta.id.toString()}>
                        {tarjeta.nombre}
                      </SelectItem>
                    ))}
                </SelectContent>
              </Select>
              <FormDescription>
                Solo se muestran tarjetas que permiten cuotas
              </FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />

        <div className="flex justify-end gap-2 pt-4">
          <Button type="button" variant="outline" onClick={onCancel}>
            Cancelar
          </Button>
          <Button type="submit" disabled={isSubmitting}>
            {isSubmitting ? 'Guardando...' : 'Guardar'}
          </Button>
        </div>
      </form>
    </Form>
  )
}
