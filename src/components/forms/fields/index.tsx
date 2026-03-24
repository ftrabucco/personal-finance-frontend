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
import { SearchableSelect } from '@/components/ui/searchable-select'
import { CurrencySelector } from '@/components/forms/CurrencySelector'
import { formatCurrency } from '@/lib/utils/formatters'
import type { Categoria, Importancia, TipoPago, Tarjeta, Frecuencia, Moneda, FuenteIngreso } from '@/types'

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
          <FormControl>
            <SearchableSelect
              options={categorias.map((cat) => ({
                value: cat.id.toString(),
                label: cat.nombre_categoria,
              }))}
              value={field.value?.toString()}
              onValueChange={(value) => field.onChange(parseInt(value))}
              placeholder="Seleccionar categoría"
              searchPlaceholder="Buscar categoría..."
            />
          </FormControl>
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
          <FormControl>
            <SearchableSelect
              options={importancias.map((imp) => ({
                value: imp.id.toString(),
                label: imp.nombre_importancia,
              }))}
              value={field.value?.toString()}
              onValueChange={(value) => field.onChange(parseInt(value))}
              placeholder="Seleccionar importancia"
              searchPlaceholder="Buscar importancia..."
            />
          </FormControl>
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
          <FormControl>
            <SearchableSelect
              options={tiposPago.map((tipo) => ({
                value: tipo.id.toString(),
                label: tipo.nombre,
              }))}
              value={field.value?.toString()}
              onValueChange={(value) => field.onChange(parseInt(value))}
              placeholder="Seleccionar tipo de pago"
              searchPlaceholder="Buscar tipo de pago..."
            />
          </FormControl>
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
  disabled?: boolean
}

export function TarjetaField<T extends FieldValues>({
  control,
  name,
  tarjetas,
  label = 'Tarjeta (Opcional)',
  description,
  filterCuotas = false,
  disabled = false,
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
          <FormControl>
            <SearchableSelect
              options={[
                { value: 'null', label: 'Sin tarjeta' },
                ...filteredTarjetas.map((tarjeta) => ({
                  value: tarjeta.id.toString(),
                  label: tarjeta.nombre,
                })),
              ]}
              value={field.value?.toString() || 'null'}
              onValueChange={(value) =>
                field.onChange(value === 'null' ? null : parseInt(value))
              }
              placeholder="Sin tarjeta"
              searchPlaceholder="Buscar tarjeta..."
              disabled={disabled}
            />
          </FormControl>
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
          <FormControl>
            <SearchableSelect
              options={frecuencias.map((frec) => ({
                value: frec.id.toString(),
                label: frec.nombre_frecuencia,
              }))}
              value={field.value?.toString()}
              onValueChange={(value) => field.onChange(parseInt(value))}
              placeholder="Seleccionar frecuencia"
              searchPlaceholder="Buscar frecuencia..."
            />
          </FormControl>
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
              value={field.value || ''}
              onChange={(e) => {
                const value = e.target.value
                field.onChange(value === '' ? '' : parseInt(value))
              }}
              onBlur={(e) => {
                // On blur, ensure a valid value (default to 1 if empty or invalid)
                const value = parseInt(e.target.value)
                if (!value || value < 1 || value > 31) {
                  field.onChange(1)
                }
              }}
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
// Cuotas Pagadas Field (for Compras with pre-paid installments)
// ============================================
interface CuotasPagadasFieldProps<T extends FieldValues> {
  control: Control<T>
  name: FieldPath<T>
  cantidadCuotas: number
}

export function CuotasPagadasField<T extends FieldValues>({
  control,
  name,
  cantidadCuotas,
}: CuotasPagadasFieldProps<T>) {
  return (
    <FormField
      control={control}
      name={name}
      render={({ field }) => (
        <FormItem>
          <FormLabel>Cuotas ya pagadas</FormLabel>
          <FormControl>
            <Input
              type="number"
              min="0"
              max={cantidadCuotas}
              placeholder="0"
              {...field}
              onChange={(e) => field.onChange(parseInt(e.target.value) || 0)}
            />
          </FormControl>
          <FormDescription>
            Si la compra ya tiene cuotas pagadas, indica cuantas.
            {field.value > 0 && cantidadCuotas > 0 && (
              <> Quedan {cantidadCuotas - field.value} cuota{cantidadCuotas - field.value !== 1 ? 's' : ''} por pagar.</>
            )}
          </FormDescription>
          <FormMessage />
        </FormItem>
      )}
    />
  )
}

// ============================================
// Fuente de Ingreso Select Field
// ============================================
interface FuenteIngresoFieldProps<T extends FieldValues> {
  control: Control<T>
  name: FieldPath<T>
  fuentesIngreso: FuenteIngreso[]
}

export function FuenteIngresoField<T extends FieldValues>({
  control,
  name,
  fuentesIngreso,
}: FuenteIngresoFieldProps<T>) {
  return (
    <FormField
      control={control}
      name={name}
      render={({ field }) => (
        <FormItem>
          <FormLabel>Fuente de Ingreso</FormLabel>
          <FormControl>
            <SearchableSelect
              options={fuentesIngreso.map((fuente) => ({
                value: fuente.id.toString(),
                label: fuente.nombre,
              }))}
              value={field.value?.toString()}
              onValueChange={(value) => field.onChange(parseInt(value))}
              placeholder="Seleccionar fuente"
              searchPlaceholder="Buscar fuente de ingreso..."
            />
          </FormControl>
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
