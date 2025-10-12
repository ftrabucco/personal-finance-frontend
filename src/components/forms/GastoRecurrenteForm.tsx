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
import { useCatalogosCompletos, useFrecuencias } from '@/lib/hooks/useCatalogos'
import { useTarjetas } from '@/lib/hooks/useTarjetas'
import type { GastoRecurrente } from '@/types'

const gastoRecurrenteSchema = z.object({
  descripcion: z.string().min(1, 'La descripción es requerida'),
  monto: z.number().positive('El monto debe ser mayor a 0'),
  dia_de_pago: z.number().int().min(1).max(31, 'Debe estar entre 1 y 31'),
  mes_de_pago: z.number().int().min(1).max(12).nullable(),
  activo: z.boolean(),
  fecha_inicio: z.string().nullable(),
  categoria_gasto_id: z.number({ message: 'La categoría es requerida' }),
  importancia_gasto_id: z.number({ message: 'La importancia es requerida' }),
  tipo_pago_id: z.number({ message: 'El tipo de pago es requerido' }),
  tarjeta_id: z.number().nullable(),
  frecuencia_gasto_id: z.number({ message: 'La frecuencia es requerida' }),
})

type GastoRecurrenteFormValues = z.infer<typeof gastoRecurrenteSchema>

interface GastoRecurrenteFormProps {
  initialData?: Partial<GastoRecurrente>
  onSubmit: (data: GastoRecurrenteFormValues) => void
  onCancel: () => void
  isSubmitting?: boolean
}

export function GastoRecurrenteForm({
  initialData,
  onSubmit,
  onCancel,
  isSubmitting,
}: GastoRecurrenteFormProps) {
  const { categorias, importancias, tiposPago, isLoading: catalogosLoading } =
    useCatalogosCompletos()
  const { data: frecuenciasResponse } = useFrecuencias()
  const { data: tarjetasResponse } = useTarjetas()

  const form = useForm<GastoRecurrenteFormValues>({
    resolver: zodResolver(gastoRecurrenteSchema),
    defaultValues: {
      descripcion: initialData?.descripcion || '',
      monto: initialData?.monto || 0,
      dia_de_pago: initialData?.dia_de_pago || 1,
      mes_de_pago: initialData?.mes_de_pago || null,
      activo: initialData?.activo ?? true,
      fecha_inicio: initialData?.fecha_inicio
        ? format(new Date(initialData.fecha_inicio), 'yyyy-MM-dd')
        : format(new Date(), 'yyyy-MM-dd'),
      categoria_gasto_id: initialData?.categoria_gasto_id,
      importancia_gasto_id: initialData?.importancia_gasto_id,
      tipo_pago_id: initialData?.tipo_pago_id,
      tarjeta_id: initialData?.tarjeta_id || null,
      frecuencia_gasto_id: initialData?.frecuencia_gasto_id,
    },
  })

  const tarjetas = tarjetasResponse?.data || []
  const frecuencias = frecuenciasResponse?.data || []

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
                <Textarea placeholder="Ej: Alquiler mensual" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <div className="grid grid-cols-2 gap-4">
          <FormField
            control={form.control}
            name="monto"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Monto (ARS)</FormLabel>
                <FormControl>
                  <Input
                    type="number"
                    step="0.01"
                    placeholder="0.00"
                    {...field}
                    onChange={(e) =>
                      field.onChange(parseFloat(e.target.value) || 0)
                    }
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="dia_de_pago"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Día de Pago</FormLabel>
                <FormControl>
                  <Input
                    type="number"
                    min="1"
                    max="31"
                    placeholder="1-31"
                    {...field}
                    onChange={(e) =>
                      field.onChange(parseInt(e.target.value) || 1)
                    }
                  />
                </FormControl>
                <FormDescription>Día del mes en que se paga</FormDescription>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <FormField
            control={form.control}
            name="fecha_inicio"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Fecha de Inicio</FormLabel>
                <FormControl>
                  <Input type="date" {...field} value={field.value || ''} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="mes_de_pago"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Mes de Pago (Opcional)</FormLabel>
                <Select
                  onValueChange={(value) =>
                    field.onChange(value === 'null' ? null : parseInt(value))
                  }
                  value={field.value?.toString() || 'null'}
                >
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder="Todos los meses" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    <SelectItem value="null">Todos los meses</SelectItem>
                    <SelectItem value="1">Enero</SelectItem>
                    <SelectItem value="2">Febrero</SelectItem>
                    <SelectItem value="3">Marzo</SelectItem>
                    <SelectItem value="4">Abril</SelectItem>
                    <SelectItem value="5">Mayo</SelectItem>
                    <SelectItem value="6">Junio</SelectItem>
                    <SelectItem value="7">Julio</SelectItem>
                    <SelectItem value="8">Agosto</SelectItem>
                    <SelectItem value="9">Septiembre</SelectItem>
                    <SelectItem value="10">Octubre</SelectItem>
                    <SelectItem value="11">Noviembre</SelectItem>
                    <SelectItem value="12">Diciembre</SelectItem>
                  </SelectContent>
                </Select>
                <FormDescription>
                  Para gastos anuales, especifica el mes
                </FormDescription>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        <FormField
          control={form.control}
          name="frecuencia_gasto_id"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Frecuencia</FormLabel>
              <Select
                onValueChange={(value) => field.onChange(parseInt(value))}
                value={field.value?.toString()}
              >
                <FormControl>
                  <SelectTrigger>
                    <SelectValue placeholder="Seleccionar frecuencia" />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  {frecuencias.map((frec) => (
                    <SelectItem key={frec.id} value={frec.id.toString()}>
                      {frec.nombre_frecuencia}
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

        <FormField
          control={form.control}
          name="activo"
          render={({ field }) => (
            <FormItem className="flex items-center gap-2">
              <FormControl>
                <input
                  type="checkbox"
                  checked={field.value}
                  onChange={field.onChange}
                  className="h-4 w-4"
                />
              </FormControl>
              <FormLabel className="!mt-0">Activo</FormLabel>
              <FormDescription className="!mt-0 ml-auto">
                Solo los gastos activos generarán registros automáticos
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
