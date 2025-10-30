'use client'

import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { format } from 'date-fns'
import { Button } from '@/components/ui/button'
import {
  Form,
  FormControl,
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
import type { GastoUnico, Moneda } from '@/types'
import { formatCurrency } from '@/lib/utils/formatters'

// ✨ Schema: usuario ingresa monto + moneda_origen
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
      monto: initialData?.monto || 0,
      moneda_origen: initialData?.moneda_origen || 'ARS', // ✨ Default ARS
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

  // ✨ Watch para calcular conversión en tiempo real
  const montoActual = form.watch('monto')
  const monedaActual = form.watch('moneda_origen')

  // ✨ Calcular el monto convertido (para preview)
  const montoConvertido = tipoCambio && tipoCambio.valor_venta
    ? monedaActual === 'ARS'
      ? montoActual / Number(tipoCambio.valor_venta)  // ARS → USD
      : montoActual * Number(tipoCambio.valor_venta)  // USD → ARS
    : 0

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
                <Textarea placeholder="Ej: Compra en supermercado" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        {/* ✨ Selector de Moneda PRIMERO */}
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

        {/* ✨ Campo Monto con label dinámico según moneda */}
        <FormField
          control={form.control}
          name="monto"
          render={({ field }) => (
            <FormItem>
              <FormLabel>
                Monto {monedaActual === 'ARS' ? '(ARS)' : '(USD)'}
              </FormLabel>
              <FormControl>
                <Input
                  type="number"
                  step="0.01"
                  placeholder="0.00"
                  {...field}
                  onChange={(e) => field.onChange(parseFloat(e.target.value) || 0)}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        {/* ✨ Preview de conversión */}
        {tipoCambio && tipoCambio.valor_venta && montoActual > 0 && montoConvertido > 0 && (
          <div className="p-3 bg-muted rounded-lg text-sm">
            <p className="text-muted-foreground mb-1">Conversión estimada:</p>
            <p className="font-semibold">
              {monedaActual === 'ARS' ? (
                <>≈ US$ {Number(montoConvertido).toFixed(2)}</>
              ) : (
                <>≈ {formatCurrency(montoConvertido)}</>
              )}
            </p>
            <p className="text-xs text-muted-foreground mt-1">
              Tipo de cambio: ${Number(tipoCambio.valor_venta).toFixed(2)}
            </p>
          </div>
        )}

        <FormField
          control={form.control}
          name="fecha"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Fecha</FormLabel>
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
              <FormLabel>Tarjeta (Opcional)</FormLabel>
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
                  {tarjetas.map((tarjeta) => (
                    <SelectItem key={tarjeta.id} value={tarjeta.id.toString()}>
                      {tarjeta.nombre}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
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
