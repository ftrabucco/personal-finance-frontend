'use client'

import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import type { Tarjeta } from '@/types'

const tarjetaSchema = z.object({
  nombre: z.string().min(1, 'El nombre es requerido'),
  tipo: z.enum(['debito', 'credito', 'virtual'], {
    message: 'El tipo es requerido',
  }),
  banco: z.string().min(1, 'El banco es requerido'),
  dia_mes_cierre: z.number().min(1).max(31).nullable(),
  dia_mes_vencimiento: z.number().min(1).max(31).nullable(),
  permite_cuotas: z.boolean(),
})

type TarjetaFormValues = z.infer<typeof tarjetaSchema>

interface TarjetaFormProps {
  initialData?: Partial<Tarjeta>
  onSubmit: (data: TarjetaFormValues) => void
  onCancel: () => void
  isSubmitting?: boolean
}

export function TarjetaForm({
  initialData,
  onSubmit,
  onCancel,
  isSubmitting,
}: TarjetaFormProps) {
  const form = useForm<TarjetaFormValues>({
    resolver: zodResolver(tarjetaSchema),
    defaultValues: {
      nombre: initialData?.nombre || '',
      tipo: initialData?.tipo || 'debito',
      banco: initialData?.banco || '',
      dia_mes_cierre: initialData?.dia_mes_cierre || null,
      dia_mes_vencimiento: initialData?.dia_mes_vencimiento || null,
      permite_cuotas: initialData?.permite_cuotas || false,
    },
  })

  const tipo = form.watch('tipo')

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
        <FormField
          control={form.control}
          name="nombre"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Nombre</FormLabel>
              <FormControl>
                <Input placeholder="Ej: Visa Santander" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="tipo"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Tipo</FormLabel>
              <Select onValueChange={field.onChange} defaultValue={field.value}>
                <FormControl>
                  <SelectTrigger>
                    <SelectValue placeholder="Seleccionar tipo" />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  <SelectItem value="debito">Débito</SelectItem>
                  <SelectItem value="credito">Crédito</SelectItem>
                  <SelectItem value="virtual">Virtual</SelectItem>
                </SelectContent>
              </Select>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="banco"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Banco</FormLabel>
              <FormControl>
                <Input placeholder="Ej: Santander" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        {tipo === 'credito' && (
          <>
            <FormField
              control={form.control}
              name="dia_mes_cierre"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Día de Cierre</FormLabel>
                  <FormControl>
                    <Input
                      type="number"
                      min="1"
                      max="31"
                      placeholder="1-31"
                      {...field}
                      onChange={(e) =>
                        field.onChange(
                          e.target.value ? parseInt(e.target.value) : null
                        )
                      }
                      value={field.value || ''}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="dia_mes_vencimiento"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Día de Vencimiento</FormLabel>
                  <FormControl>
                    <Input
                      type="number"
                      min="1"
                      max="31"
                      placeholder="1-31"
                      {...field}
                      onChange={(e) =>
                        field.onChange(
                          e.target.value ? parseInt(e.target.value) : null
                        )
                      }
                      value={field.value || ''}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="permite_cuotas"
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
                  <FormLabel className="!mt-0">Permite Cuotas</FormLabel>
                  <FormMessage />
                </FormItem>
              )}
            />
          </>
        )}

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
