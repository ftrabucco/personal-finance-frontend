# 🚨 Problema: Generación de Cuotas de Compras

## Problema Identificado

Las compras en cuotas **NO tienen un campo para rastrear la última fecha de generación** de cuota, a diferencia de los gastos recurrentes y débitos automáticos que tienen `ultima_fecha_generado`.

## Comparación de Modelos

### ✅ Gastos Recurrentes (Correcto)
```typescript
interface GastoRecurrente {
  id: number
  activo: boolean
  dia_de_pago: number
  ultima_fecha_generado: string | null  // ✅ Tiene tracking
  frecuencia_gasto_id: number
  // ... otros campos
}
```

### ✅ Débitos Automáticos (Correcto)
```typescript
interface DebitoAutomatico {
  id: number
  activo: boolean
  dia_de_pago: number
  ultima_fecha_generado: string | null  // ✅ Tiene tracking
  frecuencia_gasto_id: number
  // ... otros campos
}
```

### ❌ Compras (Problemático)
```typescript
interface Compra {
  id: number
  monto_pagado: number              // Monto de cada cuota
  cantidad_cuotas: number            // Total de cuotas
  pendiente_cuotas: boolean          // Si aún tiene cuotas
  fecha_compra: string               // Fecha original
  // ❌ NO tiene ultima_fecha_generado
  // ❌ NO tiene cuotas_pagadas
  // ❌ NO tiene forma de saber qué cuota es la siguiente
}
```

## Problema en el Backend

Sin un campo que indique:
1. **Cuántas cuotas ya se generaron**
2. **Cuándo se generó la última cuota**
3. **Cuál es la próxima cuota a generar**

El backend tiene 3 opciones (todas problemáticas):

### Opción 1: Generar cuota cada mes sin tracking ❌
```javascript
// Backend podría estar haciendo esto:
if (compra.pendiente_cuotas) {
  // Genera UNA cuota cada vez que se ejecuta
  // PROBLEMA: Si se ejecuta múltiples veces al mes, genera duplicados
  // PROBLEMA: No sabe qué número de cuota es
}
```

### Opción 2: Contar gastos existentes ❌
```javascript
// Backend podría estar contando gastos ya generados:
const gastosGenerados = await Gasto.count({
  where: { tipo_origen: 'compra', id_origen: compra.id }
})

if (gastosGenerados < compra.cantidad_cuotas) {
  // Genera la siguiente cuota
  // PROBLEMA: Ineficiente (query por cada compra)
  // PROBLEMA: Si un gasto se borra, se pierde el tracking
}
```

### Opción 3: No generar nada ❌
```javascript
// Backend podría estar ignorando las compras:
// PROBLEMA: Las cuotas nunca se generan automáticamente
```

## Solución Recomendada

### 1. Agregar Campos a la Tabla `compras`

```sql
ALTER TABLE compras
ADD COLUMN cuotas_pagadas INTEGER DEFAULT 0,
ADD COLUMN ultima_fecha_generado TIMESTAMP NULL,
ADD COLUMN proxima_fecha_pago DATE NULL;
```

### 2. Actualizar el Modelo TypeScript

```typescript
export interface Compra {
  id: number
  descripcion: string
  monto_total: number
  monto_pagado: number              // Monto de cada cuota
  fecha_compra: string              // Fecha original de la compra
  cantidad_cuotas: number           // Total de cuotas
  cuotas_pagadas: number           // ✅ NUEVO: Cuotas ya generadas
  pendiente_cuotas: boolean        // Si aún tiene cuotas pendientes
  ultima_fecha_generado: string | null  // ✅ NUEVO: Última generación
  proxima_fecha_pago: string | null     // ✅ NUEVO: Próxima cuota
  // ... otros campos
}
```

### 3. Lógica de Generación en Backend

```javascript
// Pseudocódigo para el backend
async function generarCuotasDeCompras() {
  const compras = await Compra.findAll({
    where: { pendiente_cuotas: true }
  })

  for (const compra of compras) {
    // Verificar si ya se generó este mes
    if (compra.ultima_fecha_generado) {
      const ultimaGeneracion = new Date(compra.ultima_fecha_generado)
      const ahora = new Date()

      // Si ya se generó este mes, skip
      if (ultimaGeneracion.getMonth() === ahora.getMonth() &&
          ultimaGeneracion.getFullYear() === ahora.getFullYear()) {
        continue
      }
    }

    // Verificar si se completaron todas las cuotas
    if (compra.cuotas_pagadas >= compra.cantidad_cuotas) {
      await compra.update({ pendiente_cuotas: false })
      continue
    }

    // Generar el gasto de la cuota
    const gasto = await Gasto.create({
      descripcion: `${compra.descripcion} - Cuota ${compra.cuotas_pagadas + 1}/${compra.cantidad_cuotas}`,
      monto_ars: compra.monto_pagado,
      fecha: new Date(),
      tipo_origen: 'compra',
      id_origen: compra.id,
      categoria_gasto_id: compra.categoria_gasto_id,
      importancia_gasto_id: compra.importancia_gasto_id,
      tipo_pago_id: compra.tipo_pago_id,
      tarjeta_id: compra.tarjeta_id,
      // ... otros campos
    })

    // Actualizar la compra
    const nuevasCuotasPagadas = compra.cuotas_pagadas + 1
    const todasCuotasPagadas = nuevasCuotasPagadas >= compra.cantidad_cuotas

    await compra.update({
      cuotas_pagadas: nuevasCuotasPagadas,
      ultima_fecha_generado: new Date(),
      pendiente_cuotas: !todasCuotasPagadas,
      proxima_fecha_pago: todasCuotasPagadas
        ? null
        : calcularProximaFechaPago(new Date())
    })
  }
}
```

## Alternativa Sin Modificar Base de Datos

Si no puedes modificar la base de datos ahora, el backend debería:

```javascript
async function generarCuotasDeCompras() {
  const compras = await Compra.findAll({
    where: { pendiente_cuotas: true }
  })

  for (const compra of compras) {
    // Contar cuántas cuotas ya se generaron
    const cuotasGeneradas = await Gasto.count({
      where: {
        tipo_origen: 'compra',
        id_origen: compra.id
      }
    })

    // Si ya se generaron todas, marcar como completa
    if (cuotasGeneradas >= compra.cantidad_cuotas) {
      await compra.update({ pendiente_cuotas: false })
      continue
    }

    // Verificar si ya se generó una cuota este mes
    const primerDiaDelMes = new Date(new Date().getFullYear(), new Date().getMonth(), 1)
    const cuotaEsteMes = await Gasto.findOne({
      where: {
        tipo_origen: 'compra',
        id_origen: compra.id,
        fecha: { [Op.gte]: primerDiaDelMes }
      }
    })

    // Si ya hay una cuota este mes, skip
    if (cuotaEsteMes) continue

    // Generar la cuota
    await Gasto.create({
      descripcion: `${compra.descripcion} - Cuota ${cuotasGeneradas + 1}/${compra.cantidad_cuotas}`,
      monto_ars: compra.monto_pagado,
      fecha: new Date(),
      tipo_origen: 'compra',
      id_origen: compra.id,
      // ... otros campos
    })
  }
}
```

## Impacto en el Frontend

### Cambios Necesarios si se Agregan los Campos

1. **Actualizar modelo** en `src/types/models.ts`
2. **Actualizar formulario** de compras para mostrar progreso de cuotas
3. **Actualizar tabla** de compras para mostrar cuotas pagadas/pendientes

### Sin Cambios en Base de Datos

El frontend puede seguir funcionando igual, solo el backend necesita ajustar su lógica de conteo.

## Recomendación Final

**✅ AGREGAR LOS CAMPOS** es la mejor solución:
- Más eficiente (no queries extras)
- Más confiable (tracking explícito)
- Más escalable
- Mejor para reportes y análisis

**⚠️ ALTERNATIVA SIN CAMPOS** funciona pero:
- Menos eficiente (queries por cada compra)
- Menos confiable (si se borran gastos)
- Más complejo de debuggear

## ¿Cuál es el problema actual?

Basándome en los errores que viste:
```
Transaction cannot be rolled back because it has been finished with state: commit
```

El backend **SÍ está intentando generar las cuotas**, pero:
1. Probablemente está generando duplicados
2. O está teniendo errores de transacción al intentar actualizar
3. O no tiene la lógica de "solo una vez al mes"

**Necesitas revisar el código del backend en la función que maneja las compras** para ver exactamente qué está haciendo.
