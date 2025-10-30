# 💱 Guía de Implementación Multi-Moneda

## 📚 Resumen

Esta guía muestra cómo actualizar cada entidad (GastoUnico, Compra, GastoRecurrente, DebitoAutomatico) para soportar multi-moneda USD/ARS.

---

## 🎯 Ejemplo Completo: Gasto Único

### Cambios Necesarios

#### 1. Schema de Validación (en el formulario)

**ANTES:**
```typescript
const gastoUnicoSchema = z.object({
  descripcion: z.string().min(1, 'La descripción es requerida'),
  monto: z.number().positive('El monto debe ser mayor a 0'),
  fecha: z.string().min(1, 'La fecha es requerida'),
  // ... resto de campos
})
```

**DESPUÉS:**
```typescript
const gastoUnicoSchema = z.object({
  descripcion: z.string().min(1, 'La descripción es requerida'),
  monto: z.number().positive('El monto debe ser mayor a 0'),
  moneda_origen: z.enum(['ARS', 'USD'], { message: 'La moneda es requerida' }), // ✨ NUEVO
  fecha: z.string().min(1, 'La fecha es requerida'),
  // ... resto de campos
})
```

#### 2. Default Values en useForm

**ANTES:**
```typescript
defaultValues: {
  descripcion: initialData?.descripcion || '',
  monto: initialData?.monto || 0,
  fecha: initialData?.fecha ? format(...) : format(new Date(), 'yyyy-MM-dd'),
  // ...
}
```

**DESPUÉS:**
```typescript
defaultValues: {
  descripcion: initialData?.descripcion || '',
  monto: initialData?.monto || 0,
  moneda_origen: initialData?.moneda_origen || 'ARS', // ✨ NUEVO - default ARS
  fecha: initialData?.fecha ? format(...) : format(new Date(), 'yyyy-MM-dd'),
  // ...
}
```

#### 3. Agregar Imports Necesarios

```typescript
import { CurrencySelector } from '@/components/forms/CurrencySelector'
import { useTipoCambioActual } from '@/lib/hooks/useTipoCambio'
import type { GastoUnico, Moneda } from '@/types' // ✨ Agregar Moneda
import { formatCurrency } from '@/lib/utils/formatters'
import { useState, useEffect } from 'react' // Si querés preview de conversión
```

#### 4. Obtener Tipo de Cambio Actual

```typescript
export function GastoUnicoForm({ ... }) {
  // ... hooks existentes
  const { data: tipoCambioResponse } = useTipoCambioActual() // ✨ NUEVO

  const tipoCambio = tipoCambioResponse?.data

  // ...
}
```

#### 5. Campo de Monto + Preview de Conversión

```typescript
{/* Grid con Monto + Moneda */}
<div className="grid grid-cols-1 md:grid-cols-2 gap-4">
  <div className="space-y-4">
    <FormField
      control={form.control}
      name="monto"
      render={({ field }) => (
        <FormItem>
          <FormLabel>Monto</FormLabel>
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

    {/* ✨ Preview de conversión en tiempo real */}
    {tipoCambio && montoActual > 0 && (
      <div className="p-3 bg-muted rounded-lg text-sm">
        <p className="text-muted-foreground mb-1">Conversión estimada:</p>
        <p className="font-semibold">
          {monedaActual === 'ARS' ? (
            <>≈ US$ {montoConvertido.toFixed(2)}</>
          ) : (
            <>≈ {formatCurrency(montoConvertido)}</>
          )}
        </p>
        <p className="text-xs text-muted-foreground mt-1">
          TC: ${tipoCambio.valor_venta.toFixed(2)}
        </p>
      </div>
    )}
  </div>

  {/* ✨ Selector de Moneda */}
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
</div>
```

#### 6. Watch para Calcular Conversión

```typescript
// ✨ Observar cambios en monto y moneda
const montoActual = form.watch('monto')
const monedaActual = form.watch('moneda_origen')

// ✨ Calcular conversión estimada
const montoConvertido = tipoCambio
  ? monedaActual === 'ARS'
    ? montoActual / tipoCambio.valor_venta
    : montoActual * tipoCambio.valor_venta
  : 0
```

---

### Actualizar la Página/Lista

#### 1. Imports Necesarios

```typescript
import { DualCurrencyDisplay } from '@/components/common/DualCurrencyDisplay' // ✨ NUEVO
```

#### 2. Calcular Totales en Ambas Monedas

**ANTES:**
```typescript
const totalGastos = gastos.reduce((sum, gasto) => sum + gasto.monto, 0)
```

**DESPUÉS:**
```typescript
// ✨ Totales separados por moneda
const totalARS = gastos.reduce((sum, gasto) => sum + gasto.monto_ars, 0)
const totalUSD = gastos.reduce((sum, gasto) => sum + gasto.monto_usd, 0)
```

#### 3. Cards de Resumen

**ANTES (1 card):**
```typescript
<Card>
  <CardHeader>
    <CardTitle>Total de Gastos</CardTitle>
  </CardHeader>
  <CardContent>
    <div className="text-2xl font-bold">
      {formatCurrency(totalGastos)}
    </div>
  </CardContent>
</Card>
```

**DESPUÉS (2-3 cards):**
```typescript
<div className="grid gap-4 md:grid-cols-3">
  <Card>
    <CardHeader>
      <CardTitle>Total ARS</CardTitle>
    </CardHeader>
    <CardContent>
      <div className="text-2xl font-bold">{formatCurrency(totalARS)}</div>
      <p className="text-xs text-muted-foreground">Gastos en pesos</p>
    </CardContent>
  </Card>

  <Card>
    <CardHeader>
      <CardTitle>Total USD</CardTitle>
    </CardHeader>
    <CardContent>
      <div className="text-2xl font-bold">US$ {totalUSD.toFixed(2)}</div>
      <p className="text-xs text-muted-foreground">Gastos en dólares</p>
    </CardContent>
  </Card>

  <Card>
    <CardHeader>
      <CardTitle>Cantidad</CardTitle>
    </CardHeader>
    <CardContent>
      <div className="text-2xl font-bold">{gastos.length}</div>
      <p className="text-xs text-muted-foreground">
        {gastos.length === 1 ? 'gasto' : 'gastos'} registrados
      </p>
    </CardContent>
  </Card>
</div>
```

#### 4. Columna de Monto en Tabla

**ANTES:**
```typescript
<TableCell>
  <span className="font-semibold">{formatCurrency(gasto.monto)}</span>
</TableCell>
```

**DESPUÉS:**
```typescript
<TableCell>
  <DualCurrencyDisplay
    montoArs={gasto.monto_ars}
    montoUsd={gasto.monto_usd}
    monedaOrigen={gasto.moneda_origen}
    tipoCambio={gasto.tipo_cambio_usado}
  />
</TableCell>
```

---

## 📝 Checklist de Actualización por Entidad

### ✅ Para CADA Formulario:

1. [ ] Agregar `moneda_origen` al schema de Zod
2. [ ] Agregar `moneda_origen: 'ARS'` a defaultValues
3. [ ] Import de `CurrencySelector` y `useTipoCambioActual`
4. [ ] Obtener tipo de cambio: `const { data: tipoCambioResponse } = useTipoCambioActual()`
5. [ ] Agregar campo `<CurrencySelector />` en el formulario
6. [ ] (Opcional) Agregar preview de conversión en tiempo real
7. [ ] Reemplazar el label "Monto (ARS)" por solo "Monto"

### ✅ Para CADA Página/Lista:

1. [ ] Import de `DualCurrencyDisplay`
2. [ ] Cambiar cálculo de totales: usar `monto_ars` y `monto_usd` en lugar de `monto`
3. [ ] Actualizar cards de resumen (split ARS/USD)
4. [ ] Reemplazar `formatCurrency(gasto.monto)` por `<DualCurrencyDisplay />`

---

## 🔄 Entidades a Actualizar

### 1. ✅ GastoUnico (EJEMPLO COMPLETO)
- Archivo formulario: `src/components/forms/GastoUnicoForm.tsx`
- Archivo página: `src/app/(dashboard)/gastos-unicos/page.tsx`
- **Nota especial**: Campo `monto` (singular), no `monto_total`

### 2. ⏳ Compra
- Archivo formulario: `src/components/forms/CompraForm.tsx`
- Archivo página: `src/app/(dashboard)/compras/page.tsx`
- **Nota especial**: Campo `monto_total` (no `monto`), usar `monto_total_ars` y `monto_total_usd`

### 3. ⏳ GastoRecurrente
- Archivo formulario: `src/components/forms/GastoRecurrenteForm.tsx`
- Archivo página: `src/app/(dashboard)/gastos-recurrentes/page.tsx`
- **Nota especial**: Campo `monto`, usa `tipo_cambio_referencia` (no `tipo_cambio_usado`)

### 4. ⏳ DebitoAutomatico
- Archivo formulario: `src/components/forms/DebitoAutomaticoForm.tsx`
- Archivo página: `src/app/(dashboard)/debitos-automaticos/page.tsx`
- **Nota especial**: Campo `monto`, usa `tipo_cambio_referencia` (no `tipo_cambio_usado`)

---

## 🎨 Componentes Disponibles

### `<CurrencySelector />`
Selector visual ARS/USD con botones grandes e iconos.

**Props:**
```typescript
interface CurrencySelectorProps {
  value: Moneda              // 'ARS' | 'USD'
  onChange: (value: Moneda) => void
  label?: string             // Default: 'Moneda'
  disabled?: boolean         // Default: false
}
```

**Uso:**
```typescript
<CurrencySelector
  value={field.value}
  onChange={field.onChange}
  label="Moneda"
/>
```

### `<DualCurrencyDisplay />`
Muestra monto en moneda origen + conversión en tooltip.

**Props:**
```typescript
interface DualCurrencyDisplayProps {
  montoArs: number
  montoUsd: number
  monedaOrigen: Moneda
  tipoCambio?: number        // Opcional - se muestra en tooltip
  className?: string
  showBothAlways?: boolean   // Si es true, muestra ambas monedas sin tooltip
}
```

**Uso:**
```typescript
<DualCurrencyDisplay
  montoArs={gasto.monto_ars}
  montoUsd={gasto.monto_usd}
  monedaOrigen={gasto.moneda_origen}
  tipoCambio={gasto.tipo_cambio_usado}
/>
```

---

## 🔧 Hooks Disponibles

### `useTipoCambioActual()`
Obtiene el tipo de cambio más reciente.

```typescript
const { data, isLoading, error } = useTipoCambioActual()

// data.data contiene:
{
  id: number
  fecha: string
  valor_compra: number
  valor_venta: number
  fuente: 'BCRA' | 'DolarAPI' | 'manual'
}
```

### `useTipoCambioPorFecha(fecha: string)`
Obtiene tipo de cambio de una fecha específica (con fallback).

```typescript
const { data } = useTipoCambioPorFecha('2024-01-15')
```

### `useActualizarTipoCambio()`
Fuerza actualización desde APIs externas.

```typescript
const mutation = useActualizarTipoCambio()

// Usar en botón:
<Button onClick={() => mutation.mutate()}>
  Actualizar TC
</Button>
```

---

## ⚠️ Notas Importantes

### 1. Campos Prohibidos en Requests
El backend rechaza estos campos si se envían desde el frontend (Joi.forbidden):
- `monto_ars` / `monto_total_ars`
- `monto_usd` / `monto_total_usd`
- `tipo_cambio_usado` / `tipo_cambio_referencia`

**Solo enviar:**
- `monto` (o `monto_total` para compras)
- `moneda_origen` (opcional, default: 'ARS')

El backend calculará automáticamente los campos prohibidos.

### 2. Diferencias por Entidad

| Entidad | Campo Monto | Campo TC | Actualización TC |
|---------|-------------|----------|------------------|
| GastoUnico | `monto` | `tipo_cambio_usado` | Snapshot fijo |
| Compra | `monto_total` | `tipo_cambio_usado` | Snapshot fijo |
| GastoRecurrente | `monto` | `tipo_cambio_referencia` | Actualiza diariamente |
| DebitoAutomatico | `monto` | `tipo_cambio_referencia` | Actualiza diariamente |

### 3. Conversión de Monedas

**ARS → USD:**
```typescript
monto_usd = monto_ars / tipo_cambio_venta
```

**USD → ARS:**
```typescript
monto_ars = monto_usd * tipo_cambio_venta
```

---

## 🧪 Testing

### Casos de Prueba Esenciales

1. ✅ Crear gasto en ARS → Verificar conversión automática a USD
2. ✅ Crear gasto en USD → Verificar conversión automática a ARS
3. ✅ Editar gasto existente → Mantener moneda original
4. ✅ Preview de conversión actualiza en tiempo real
5. ✅ Tabla muestra tooltip con conversión
6. ✅ Totales calculan correctamente en ambas monedas
7. ❌ Intentar enviar `monto_ars` explícito → Debe rechazar (400)

---

## 📦 Archivos Creados

### Componentes
- `src/components/forms/CurrencySelector.tsx` - Selector ARS/USD
- `src/components/common/DualCurrencyDisplay.tsx` - Display dual moneda
- `src/components/ui/tooltip.tsx` - Tooltip de shadcn

### API & Hooks
- `src/lib/api/endpoints/tipoCambio.ts` - Endpoints de tipo de cambio
- `src/lib/hooks/useTipoCambio.ts` - Hooks de React Query

### Types
- `src/types/models.ts` - Actualizado con campos multi-moneda

### Ejemplos
- `src/components/forms/GastoUnicoForm.UPDATED.tsx` - Ejemplo completo
- `src/app/(dashboard)/gastos-unicos/page.UPDATED.tsx` - Ejemplo completo

---

## 🚀 Próximos Pasos

1. Revisar ejemplo completo de GastoUnico
2. Decidir si continuar con las demás entidades
3. Aplicar mismo patrón a Compra, GastoRecurrente, DebitoAutomatico
4. Actualizar Dashboard y Reportes para multi-moneda
5. Testing de integración
6. Commit y push

---

## 💡 Tips

- El componente `CurrencySelector` es reutilizable en todos los formularios
- El `DualCurrencyDisplay` funciona automáticamente con tooltip
- El preview de conversión es opcional pero mejora UX
- Siempre usar `tipo_cambio_venta` para conversiones
- El backend maneja todo el cálculo, frontend solo muestra

---

¿Preguntas? Revisá el código de ejemplo en:
- `GastoUnicoForm.UPDATED.tsx`
- `gastos-unicos/page.UPDATED.tsx`
