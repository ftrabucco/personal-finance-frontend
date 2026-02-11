'use client'

import { Control, FieldPath, FieldValues } from 'react-hook-form'
import {
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
import { formatCurrency } from '@/lib/utils/formatters'
import type { Categoria, Importancia, TipoPago, Tarjeta, Frecuencia, Moneda } from '@/types'

// ============================================
// Descripcion Field
// ============================================
interface DescripcionFieldProps<T extends FieldValues> {
  control: Control<T>
  name: FieldPath<T>
  placeholder?: string
}

export function DescripcionField<T extends FieldValues>({
  control,
  name,
  placeholder = 'Ej: Descripción del gasto',
}: DescripcionFieldProps<T>) {
  return (
    <FormField
      control={control}
      name={name}
      render={({ field }) => (
        <FormItem>
          <FormLabel>Descripción</FormLabel>
          <FormControl>
            <Textarea placeholder={placeholder} {...field} />
          </FormControl>
          <FormMessage />
        </FormItem>
      )}
    />
  )
}

// ============================================
// Monto con Moneda Field (Currency Aware)
// ============================================
interface MontoConMonedaFieldProps<T extends FieldValues> {
  control: Control<T>
  montoName: FieldPath<T>
  monedaName: FieldPath<T>
  monedaActual: Moneda
  tipoCambio?: { valor_venta_usd_ars: string | number } | null
  montoActual: number
  label?: string
}

export function MontoConMonedaField<T extends FieldValues>({
  control,
  montoName,
  monedaName,
  monedaActual,
  tipoCambio,
  montoActual,
  label = 'Monto',
}: MontoConMonedaFieldProps<T>) {
  const montoConvertido = tipoCambio && tipoCambio.valor_venta_usd_ars
    ? monedaActual === 'ARS'
      ? montoActual / Number(tipoCambio.valor_venta_usd_ars)
      : montoActual * Number(tipoCambio.valor_venta_usd_ars)
    : 0

  return (
    <>
      <FormField
        control={control}
        name={monedaName}
        render={({ field }) => (
          <FormItem>
            <CurrencySelector
              value={field.value as Moneda}
              onChange={field.onChange}
              label="Moneda"
            />
            <FormMessage />
          </FormItem>
        )}
      />

      <FormField
        control={control}
        name={montoName}
        render={({ field }) => (
          <FormItem>
            <FormLabel>
              {label} ({monedaActual})
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

      {tipoCambio && tipoCambio.valor_venta_usd_ars && montoActual > 0 && montoConvertido > 0 && (
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
            Tipo de cambio: ${Number(tipoCambio.valor_venta_usd_ars).toFixed(2)}
          </p>
        </div>
      )}
    </>
  )
}

// ============================================
// Categoria Select Field
// ============================================
interface CategoriaFieldProps<T extends FieldValues> {
  control: Control<T>
  name: FieldPath<T>
  categorias: Categoria[]
}

export function CategoriaField<T extends FieldValues>({
  control,
  name,
  categorias,
}: CategoriaFieldProps<T>) {
  return (
    <FormField
      control={control}
      name={name}
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
              {categorias.map((cat) => (
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
  )
}

// ============================================
// Importancia Select Field
// ============================================
interface ImportanciaFieldProps<T extends FieldValues> {
  control: Control<T>
  name: FieldPath<T>
  importancias: Importancia[]
}

export function ImportanciaField<T extends FieldValues>({
  control,
  name,
  importancias,
}: ImportanciaFieldProps<T>) {
  return (
    <FormField
      control={control}
      name={name}
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
              {importancias.map((imp) => (
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
  )
}

// ============================================
// Tipo de Pago Select Field
// ============================================
interface TipoPagoFieldProps<T extends FieldValues> {
  control: Control<T>
  name: FieldPath<T>
  tiposPago: TipoPago[]
}

export function TipoPagoField<T extends FieldValues>({
  control,
  name,
  tiposPago,
}: TipoPagoFieldProps<T>) {
  return (
    <FormField
      control={control}
      name={name}
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
              {tiposPago.map((tipo) => (
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
  )
}

// ============================================
// Tarjeta Select Field (Optional)
// ============================================
interface TarjetaFieldProps<T extends FieldValues> {
  control: Control<T>
  name: FieldPath<T>
  tarjetas: Tarjeta[]
  label?: string
  description?: string
  filterCuotas?: boolean
}

export function TarjetaField<T extends FieldValues>({
  control,
  name,
  tarjetas,
  label = 'Tarjeta (Opcional)',
  description,
  filterCuotas = false,
}: TarjetaFieldProps<T>) {
  const filteredTarjetas = filterCuotas
    ? tarjetas.filter((t) => t.permite_cuotas)
    : tarjetas

  return (
    <FormField
      control={control}
      name={name}
      render={({ field }) => (
        <FormItem>
          <FormLabel>{label}</FormLabel>
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
              {filteredTarjetas.map((tarjeta) => (
                <SelectItem key={tarjeta.id} value={tarjeta.id.toString()}>
                  {tarjeta.nombre}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          {description && <FormDescription>{description}</FormDescription>}
          <FormMessage />
        </FormItem>
      )}
    />
  )
}

// ============================================
// Frecuencia Select Field
// ============================================
interface FrecuenciaFieldProps<T extends FieldValues> {
  control: Control<T>
  name: FieldPath<T>
  frecuencias: Frecuencia[]
}

export function FrecuenciaField<T extends FieldValues>({
  control,
  name,
  frecuencias,
}: FrecuenciaFieldProps<T>) {
  return (
    <FormField
      control={control}
      name={name}
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
  )
}

// ============================================
// Fecha Field
// ============================================
interface FechaFieldProps<T extends FieldValues> {
  control: Control<T>
  name: FieldPath<T>
  label?: string
}

export function FechaField<T extends FieldValues>({
  control,
  name,
  label = 'Fecha',
}: FechaFieldProps<T>) {
  return (
    <FormField
      control={control}
      name={name}
      render={({ field }) => (
        <FormItem>
          <FormLabel>{label}</FormLabel>
          <FormControl>
            <Input type="date" {...field} value={field.value || ''} />
          </FormControl>
          <FormMessage />
        </FormItem>
      )}
    />
  )
}

// ============================================
// Dia de Pago Field
// ============================================
interface DiaDePagoFieldProps<T extends FieldValues> {
  control: Control<T>
  name: FieldPath<T>
  label?: string
  description?: string
}

export function DiaDePagoField<T extends FieldValues>({
  control,
  name,
  label = 'Día de Pago',
  description = 'Día del mes (1-31)',
}: DiaDePagoFieldProps<T>) {
  return (
    <FormField
      control={control}
      name={name}
      render={({ field }) => (
        <FormItem>
          <FormLabel>{label}</FormLabel>
          <FormControl>
            <Input
              type="number"
              min="1"
              max="31"
              placeholder="1-31"
              {...field}
              onChange={(e) => field.onChange(parseInt(e.target.value) || 1)}
            />
          </FormControl>
          <FormDescription>{description}</FormDescription>
          <FormMessage />
        </FormItem>
      )}
    />
  )
}

// ============================================
// Activo Checkbox Field
// ============================================
interface ActivoFieldProps<T extends FieldValues> {
  control: Control<T>
  name: FieldPath<T>
  description?: string
}

export function ActivoField<T extends FieldValues>({
  control,
  name,
  description = 'Solo los registros activos generarán gastos automáticos',
}: ActivoFieldProps<T>) {
  return (
    <FormField
      control={control}
      name={name}
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
            {description}
          </FormDescription>
          <FormMessage />
        </FormItem>
      )}
    />
  )
}

// ============================================
// Cantidad de Cuotas Field (for Compras)
// ============================================
interface CantidadCuotasFieldProps<T extends FieldValues> {
  control: Control<T>
  name: FieldPath<T>
  montoPorCuota: number
  cuotaConvertida: number
  monedaActual: Moneda
}

export function CantidadCuotasField<T extends FieldValues>({
  control,
  name,
  montoPorCuota,
  cuotaConvertida,
  monedaActual,
}: CantidadCuotasFieldProps<T>) {
  return (
    <FormField
      control={control}
      name={name}
      render={({ field }) => (
        <FormItem>
          <FormLabel>Cantidad de Cuotas</FormLabel>
          <FormControl>
            <Input
              type="number"
              min="1"
              placeholder="1"
              {...field}
              onChange={(e) => field.onChange(parseInt(e.target.value) || 1)}
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
  )
}

// ============================================
// Form Actions (Cancel/Submit buttons)
// ============================================
import { Button } from '@/components/ui/button'

interface FormActionsProps {
  onCancel: () => void
  isSubmitting?: boolean
  submitLabel?: string
  submittingLabel?: string
}

export function FormActions({
  onCancel,
  isSubmitting,
  submitLabel = 'Guardar',
  submittingLabel = 'Guardando...',
}: FormActionsProps) {
  return (
    <div className="flex justify-end gap-2 pt-4">
      <Button type="button" variant="outline" onClick={onCancel}>
        Cancelar
      </Button>
      <Button type="submit" disabled={isSubmitting}>
        {isSubmitting ? submittingLabel : submitLabel}
      </Button>
    </div>
  )
}
