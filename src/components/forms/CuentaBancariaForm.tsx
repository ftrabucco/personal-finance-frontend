'use client'

import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Switch } from '@/components/ui/switch'
import type { CuentaBancaria } from '@/types'

const cuentaBancariaSchema = z.object({
  nombre: z.string().min(1, 'El nombre es requerido'),
  banco: z.string().min(1, 'El banco es requerido'),
  tipo: z.enum(['ahorro', 'corriente'], {
    message: 'El tipo es requerido',
  }),
  moneda: z.enum(['ARS', 'USD'], {
    message: 'La moneda es requerida',
  }),
  ultimos_4_digitos: z.string()
    .length(4, 'Debe tener exactamente 4 digitos')
    .regex(/^\d{4}$/, 'Solo se permiten numeros')
    .nullable()
    .optional()
    .or(z.literal('')),
  activa: z.boolean(),
})

type CuentaBancariaFormValues = z.infer<typeof cuentaBancariaSchema>

interface CuentaBancariaFormProps {
  initialData?: Partial<CuentaBancaria>
  onSubmit: (data: CuentaBancariaFormValues) => void
  onCancel: () => void
  isSubmitting?: boolean
}

export function CuentaBancariaForm({
  initialData,
  onSubmit,
  onCancel,
  isSubmitting,
}: CuentaBancariaFormProps) {
  const form = useForm<CuentaBancariaFormValues>({
    resolver: zodResolver(cuentaBancariaSchema),
    defaultValues: {
      nombre: initialData?.nombre || '',
      banco: initialData?.banco || '',
      tipo: initialData?.tipo || 'ahorro',
      moneda: initialData?.moneda || 'ARS',
      ultimos_4_digitos: initialData?.ultimos_4_digitos || '',
      activa: initialData?.activa ?? true,
    },
  })

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
                <Input placeholder="Ej: Cuenta Sueldo BBVA" {...field} />
              </FormControl>
              <FormDescription>
                Un nombre descriptivo para identificar esta cuenta
              </FormDescription>
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
                <Input placeholder="Ej: BBVA" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <div className="grid grid-cols-2 gap-4">
          <FormField
            control={form.control}
            name="tipo"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Tipo de Cuenta</FormLabel>
                <Select onValueChange={field.onChange} defaultValue={field.value}>
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder="Seleccionar tipo" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    <SelectItem value="ahorro">Caja de Ahorro</SelectItem>
                    <SelectItem value="corriente">Cuenta Corriente</SelectItem>
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="moneda"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Moneda</FormLabel>
                <Select onValueChange={field.onChange} defaultValue={field.value}>
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder="Seleccionar moneda" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    <SelectItem value="ARS">Pesos (ARS)</SelectItem>
                    <SelectItem value="USD">Dolares (USD)</SelectItem>
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        <FormField
          control={form.control}
          name="ultimos_4_digitos"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Ultimos 4 digitos (opcional)</FormLabel>
              <FormControl>
                <Input
                  placeholder="1234"
                  maxLength={4}
                  {...field}
                  value={field.value || ''}
                  onChange={(e) => {
                    const value = e.target.value.replace(/\D/g, '').slice(0, 4)
                    field.onChange(value)
                  }}
                />
              </FormControl>
              <FormDescription>
                Para identificar facilmente la cuenta
              </FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="activa"
          render={({ field }) => (
            <FormItem className="flex flex-row items-center justify-between rounded-lg border p-3 shadow-sm">
              <div className="space-y-0.5">
                <FormLabel>Cuenta Activa</FormLabel>
                <FormDescription>
                  Las cuentas inactivas no apareceran como opcion en los formularios
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
