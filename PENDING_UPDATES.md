# 🔄 Actualizaciones Pendientes Multi-Moneda

## ✅ Completado
1. ✅ GastoUnico - Formulario y página
2. ✅ Compra - Formulario actualizado
3. 🔄 Compra - Página (parcialmente, falta tabla)

## ⏳ Pendiente

### 1. Terminar Compras/page.tsx

En línea ~100, reemplazar las cards de resumen:

```typescript
<div className="grid gap-4 md:grid-cols-4">
  <Card>
    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
      <CardTitle className="text-sm font-medium">Total ARS</CardTitle>
      <ShoppingCart className="h-4 w-4 text-muted-foreground" />
    </CardHeader>
    <CardContent>
      <div className="text-2xl font-bold">{formatCurrency(totalARS)}</div>
      <p className="text-xs text-muted-foreground">Compras en pesos</p>
    </CardContent>
  </Card>

  <Card>
    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
      <CardTitle className="text-sm font-medium">Total USD</CardTitle>
      <ShoppingCart className="h-4 w-4 text-muted-foreground" />
    </CardHeader>
    <CardContent>
      <div className="text-2xl font-bold">US$ {totalUSD.toFixed(2)}</div>
      <p className="text-xs text-muted-foreground">Compras en dólares</p>
    </CardContent>
  </Card>

  <Card>
    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
      <CardTitle className="text-sm font-medium">Pendientes</CardTitle>
      <ShoppingCart className="h-4 w-4 text-muted-foreground" />
    </CardHeader>
    <CardContent>
      <div className="text-2xl font-bold">{comprasPendientes}</div>
      <p className="text-xs text-muted-foreground">Con cuotas pendientes</p>
    </CardContent>
  </Card>

  <Card>
    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
      <CardTitle className="text-sm font-medium">Total Compras</CardTitle>
      <ShoppingCart className="h-4 w-4 text-muted-foreground" />
    </CardHeader>
    <CardContent>
      <div className="text-2xl font-bold">{compras.length}</div>
      <p className="text-xs text-muted-foreground">Compras registradas</p>
    </CardContent>
  </Card>
</div>
```

En la tabla (línea ~150), reemplazar la celda de Monto Total:

```typescript
<TableCell>
  <DualCurrencyDisplay
    montoArs={compra.monto_total_ars}
    montoUsd={compra.monto_total_usd}
    monedaOrigen={compra.moneda_origen}
    tipoCambio={compra.tipo_cambio_usado}
  />
</TableCell>
```

---

### 2. GastoRecurrente Form

Archivo: `src/components/forms/GastoRecurrenteForm.tsx`

**Imports a agregar:**
```typescript
import { CurrencySelector } from '@/components/forms/CurrencySelector'
import { useTipoCambioActual } from '@/lib/hooks/useTipoCambio'
import { formatCurrency } from '@/lib/utils/formatters'
import type { Moneda } from '@/types'
```

**Schema actualizado:**
```typescript
const gastoRecurrenteSchema = z.object({
  descripcion: z.string().min(1, 'La descripción es requerida'),
  monto: z.number().positive('El monto debe ser mayor a 0'),
  moneda_origen: z.enum(['ARS', 'USD'], { message: 'La moneda es requerida' }),
  // ... resto igual
})
```

**defaultValues:**
```typescript
moneda_origen: initialData?.moneda_origen || 'ARS',
```

**Agregar hooks:**
```typescript
const { data: tipoCambioResponse } = useTipoCambioActual()
const tipoCambio = tipoCambioResponse?.data

const montoActual = form.watch('monto')
const monedaActual = form.watch('moneda_origen')

const montoConvertido = tipoCambio
  ? monedaActual === 'ARS'
    ? montoActual / tipoCambio.valor_venta
    : montoActual * tipoCambio.valor_venta
  : 0
```

**En el formulario, agregar CurrencySelector ANTES del campo monto:**
```typescript
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
```

**Actualizar label de monto:**
```typescript
<FormLabel>
  Monto {monedaActual === 'ARS' ? '(ARS)' : '(USD)'}
</FormLabel>
```

**Agregar preview después del campo monto:**
```typescript
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
    <p className="text-xs text-yellow-600 dark:text-yellow-500 mt-2">
      ⚠️ El monto en ARS se actualizará diariamente con el TC actual
    </p>
  </div>
)}
```

---

### 3. GastoRecurrente Page

Archivo: `src/app/(dashboard)/gastos-recurrentes/page.tsx`

**Imports:**
```typescript
import { DualCurrencyDisplay } from '@/components/common/DualCurrencyDisplay'
```

**Totales:**
```typescript
const totalARS = gastosRecurrentes
  .filter((g) => g.activo)
  .reduce((sum, gasto) => sum + gasto.monto_ars, 0)

const totalUSD = gastosRecurrentes
  .filter((g) => g.activo)
  .reduce((sum, gasto) => sum + gasto.monto_usd, 0)
```

**Cards (3 cards: ARS, USD, Activos):**
```typescript
<div className="grid gap-4 md:grid-cols-3">
  <Card>
    <CardHeader>
      <CardTitle>Total ARS (Activos)</CardTitle>
    </CardHeader>
    <CardContent>
      <div className="text-2xl font-bold">{formatCurrency(totalARS)}</div>
      <p className="text-xs text-muted-foreground">Por mes</p>
    </CardContent>
  </Card>

  <Card>
    <CardHeader>
      <CardTitle>Total USD (Activos)</CardTitle>
    </CardHeader>
    <CardContent>
      <div className="text-2xl font-bold">US$ {totalUSD.toFixed(2)}</div>
      <p className="text-xs text-muted-foreground">Por mes</p>
    </CardContent>
  </Card>

  <Card>
    <CardHeader>
      <CardTitle>Gastos Activos</CardTitle>
    </CardHeader>
    <CardContent>
      <div className="text-2xl font-bold">{gastosActivos}</div>
      <p className="text-xs text-muted-foreground">
        {gastosRecurrentes.length} totales
      </p>
    </CardContent>
  </Card>
</div>
```

**Tabla - columna Monto:**
```typescript
<TableCell>
  <DualCurrencyDisplay
    montoArs={gasto.monto_ars}
    montoUsd={gasto.monto_usd}
    monedaOrigen={gasto.moneda_origen}
    tipoCambio={gasto.tipo_cambio_referencia}
    showBothAlways={true}  // Mostrar ambos siempre
  />
</TableCell>
```

---

### 4. DebitoAutomatico Form

**Exactamente igual que GastoRecurrente**, solo cambiar referencias de nombres.

Archivo: `src/components/forms/DebitoAutomaticoForm.tsx`

- Mismo schema con `moneda_origen`
- Mismo CurrencySelector
- Mismo preview
- Misma advertencia: "⚠️ El monto en ARS se actualizará diariamente"

---

### 5. DebitoAutomatico Page

Archivo: `src/app/(dashboard)/debitos-automaticos/page.tsx`

**Exactamente igual que GastoRecurrente Page:**
- Totales en ARS y USD (filtrados por activo)
- 3 cards (ARS, USD, Activos)
- DualCurrencyDisplay en tabla

---

### 6. Dashboard

Archivo: `src/app/(dashboard)/page.tsx`

**Import:**
```typescript
import { DualCurrencyDisplay } from '@/components/common/DualCurrencyDisplay'
```

**Actualizar cálculo de totales (línea ~54):**
```typescript
const totalGastosDelMesARS = gastosDelMes.reduce(
  (sum, gasto) => sum + parseFloat(gasto.monto_ars),
  0
)

const totalGastosDelMesUSD = gastosDelMes.reduce(
  (sum, gasto) => sum + parseFloat(gasto.monto_usd),
  0
)
```

**Actualizar card "Gastos del Mes" (línea ~75):**
```typescript
<Card>
  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
    <CardTitle className="text-sm font-medium">
      Gastos del Mes
    </CardTitle>
    <Receipt className="h-4 w-4 text-muted-foreground" />
  </CardHeader>
  <CardContent>
    <div className="text-2xl font-bold">
      {formatCurrency(totalGastosDelMesARS)}
    </div>
    <p className="text-xs text-muted-foreground">
      {gastosDelMes.length} gastos · ≈ US$ {totalGastosDelMesUSD.toFixed(2)}
    </p>
  </CardContent>
</Card>
```

**Actualizar tabla "Últimos Gastos" - columna monto:**
```typescript
<TableCell>
  <DualCurrencyDisplay
    montoArs={parseFloat(gasto.monto_ars)}
    montoUsd={parseFloat(gasto.monto_usd)}
    monedaOrigen={gasto.moneda_origen}
    tipoCambio={parseFloat(gasto.tipo_cambio_usado)}
  />
</TableCell>
```

---

### 7. Reportes

Archivo: `src/app/(dashboard)/reportes/page.tsx`

Este es más complejo. Necesitás actualizar:

**Línea ~82 - totalGastos:**
```typescript
const totalGastosARS = useMemo(() => {
  return gastosDelPeriodo.reduce((sum, gasto) => sum + parseFloat(gasto.monto_ars), 0)
}, [gastosDelPeriodo])

const totalGastosUSD = useMemo(() => {
  return gastosDelPeriodo.reduce((sum, gasto) => sum + parseFloat(gasto.monto_usd), 0)
}, [gastosDelPeriodo])
```

**Línea ~240 - Card de período:**
```typescript
<div className="text-right">
  <p className="text-sm text-muted-foreground mb-1">Total gastado</p>
  <div>
    <p className="text-3xl font-bold">{formatCurrency(totalGastosARS)}</p>
    <p className="text-sm text-muted-foreground">≈ US$ {totalGastosUSD.toFixed(2)}</p>
  </div>
  <p className="text-xs text-muted-foreground mt-1">
    {gastosDelPeriodo.length} gastos registrados
  </p>
</div>
```

**Todos los cálculos de porcentajes deben usar `totalGastosARS`**

---

## 📝 Resumen de Cambios por Archivo

| Archivo | Cambios | Estado |
|---------|---------|--------|
| GastoUnicoForm.tsx | ✅ Completo | ✅ |
| gastos-unicos/page.tsx | ✅ Completo | ✅ |
| CompraForm.tsx | ✅ Completo | ✅ |
| compras/page.tsx | Cards + Tabla | 🔄 50% |
| GastoRecurrenteForm.tsx | Schema + Selector + Preview | ⏳ |
| gastos-recurrentes/page.tsx | Totales + Cards + Tabla | ⏳ |
| DebitoAutomaticoForm.tsx | Schema + Selector + Preview | ⏳ |
| debitos-automaticos/page.tsx | Totales + Cards + Tabla | ⏳ |
| dashboard/page.tsx | Totales + Cards + Tabla | ⏳ |
| reportes/page.tsx | Totales + Cálculos | ⏳ |

---

## 🚀 Orden Sugerido

1. ✅ GastoUnico (Completado)
2. 🔄 Compra (Terminar página)
3. ⏳ GastoRecurrente (Form + Page)
4. ⏳ DebitoAutomatico (Form + Page)
5. ⏳ Dashboard
6. ⏳ Reportes

---

## 💡 Tip: Búsqueda y Reemplazo

Para acelerar, podés buscar y reemplazar en VSCode:

### Buscar:
```
formatCurrency(gasto.monto)
```

### Reemplazar con:
```typescript
<DualCurrencyDisplay
  montoArs={gasto.monto_ars}
  montoUsd={gasto.monto_usd}
  monedaOrigen={gasto.moneda_origen}
  tipoCambio={gasto.tipo_cambio_usado}
/>
```

### Para Compra:
```
formatCurrency(compra.monto_total)
```

Reemplazar con:
```typescript
<DualCurrencyDisplay
  montoArs={compra.monto_total_ars}
  montoUsd={compra.monto_total_usd}
  monedaOrigen={compra.moneda_origen}
  tipoCambio={compra.tipo_cambio_usado}
/>
```

---

¿Querés que continue yo o preferís seguir vos con esta guía?
