# Sistema de Procesamiento Automático de Gastos

## Problema Identificado

Los gastos recurrentes, cuotas de compras y débitos automáticos no se están generando automáticamente como gastos en las fechas correspondientes.

## Solución Implementada (Frontend)

### 1. Nuevos Archivos Creados

#### `src/lib/api/endpoints/procesamiento.ts`
Endpoints para llamar al backend y procesar gastos pendientes:
- `procesarTodosPendientes()`: Procesa todos los tipos de gastos pendientes
- `procesarGastosRecurrentes()`: Solo gastos recurrentes
- `procesarCompras()`: Solo cuotas de compras
- `procesarDebitos()`: Solo débitos automáticos

#### `src/lib/hooks/useProcesamiento.ts`
Hooks de React Query para usar el procesamiento con manejo de errores y notificaciones:
- `useProcesarTodosPendientes()`
- `useProcesarGastosRecurrentes()`
- `useProcesarCompras()`
- `useProcesarDebitos()`

### 2. Modificaciones

#### `src/app/(dashboard)/page.tsx`
- Agregado botón "Procesar Pendientes" en el header del dashboard
- El botón muestra animación de carga mientras procesa
- Actualiza automáticamente los datos después del procesamiento

## Implementación Requerida en el Backend

El backend **DEBE** implementar los siguientes endpoints:

### Endpoint Principal
```
POST /api/procesamiento/procesar-pendientes
```

**Lógica requerida:**

1. **Gastos Recurrentes**:
   - Buscar todos los gastos recurrentes con `activo = true`
   - Para cada uno, verificar si `dia_de_pago` corresponde con hoy o fechas anteriores sin procesar
   - Comparar `ultima_fecha_generado` para no duplicar
   - Generar un nuevo gasto en la tabla `gastos` con:
     - `tipo_origen = 'recurrente'`
     - `id_origen = gasto_recurrente.id`
     - Todos los demás campos del gasto recurrente
   - Actualizar `ultima_fecha_generado` del gasto recurrente

2. **Compras en Cuotas**:
   - Buscar todas las compras con `pendiente_cuotas = true`
   - Para cada una, verificar si corresponde generar una cuota este mes
   - Calcular: `monto_cuota = monto_total / cantidad_cuotas`
   - Generar gasto con:
     - `tipo_origen = 'compra'`
     - `id_origen = compra.id`
     - `monto = monto_cuota`
   - Si es la última cuota, marcar `pendiente_cuotas = false`

3. **Débitos Automáticos**:
   - Buscar todos los débitos con `activo = true`
   - Verificar `dia_de_pago` y `ultima_fecha_generado`
   - Generar gasto con:
     - `tipo_origen = 'debito_automatico'`
     - `id_origen = debito.id`
   - Actualizar `ultima_fecha_generado`

**Respuesta esperada:**
```json
{
  "success": true,
  "data": {
    "gastosRecurrentesProcesados": 2,
    "comprasesProcesadas": 3,
    "debitosProcesados": 1,
    "totalGastosGenerados": 6,
    "detalles": {
      "gastosRecurrentes": [
        {
          "id": 1,
          "descripcion": "Netflix",
          "gastoGeneradoId": 123
        }
      ],
      "compras": [...],
      "debitos": [...]
    }
  }
}
```

### Endpoints Opcionales (más granulares)
```
POST /api/procesamiento/gastos-recurrentes
POST /api/procesamiento/compras
POST /api/procesamiento/debitos-automaticos
```

Misma lógica pero solo para cada tipo específico.

## Automatización Ideal (Backend)

### Opción 1: Cron Job (Node.js)
```javascript
// Ejemplo con node-cron
const cron = require('node-cron');

// Ejecutar todos los días a las 00:01
cron.schedule('1 0 * * *', async () => {
  console.log('Ejecutando procesamiento automático de gastos...');
  await procesarTodosPendientes();
});
```

### Opción 2: Scheduled Tasks (Cloud)
- **Heroku Scheduler**: Ejecutar comando diario
- **AWS EventBridge**: Trigger Lambda diario
- **Vercel Cron**: Si el backend está en Vercel

### Opción 3: Database Triggers
- Usar triggers de PostgreSQL/MySQL para eventos temporales
- Menos recomendado, más complejo

## Uso del Sistema

### Procesamiento Manual (Usuario)
1. Usuario abre el dashboard
2. Hace clic en "Procesar Pendientes"
3. El sistema:
   - Llama al endpoint del backend
   - Muestra notificación de éxito/error
   - Actualiza automáticamente los datos en pantalla

### Procesamiento Automático (Recomendado)
1. Backend tiene un cron job que se ejecuta diariamente
2. Procesa automáticamente sin intervención del usuario
3. Logs del resultado para debugging

## Testing

### Verificar que funciona:
1. Crear un gasto recurrente con `dia_de_pago = hoy`
2. Hacer clic en "Procesar Pendientes"
3. Verificar que se generó un nuevo gasto en la tabla gastos
4. Verificar que `ultima_fecha_generado` se actualizó

### Casos Edge:
- Gasto recurrente con frecuencia anual
- Compra con cuotas que se completan
- Días de pago que caen en fin de semana/feriados
- Múltiples procesamiento del mismo día (no duplicar)

## Campos de Base de Datos Importantes

### Tabla: gastos_recurrentes
- `activo`: boolean - Si debe procesarse
- `dia_de_pago`: número - Día del mes (1-31)
- `ultima_fecha_generado`: fecha - Última vez que se generó un gasto
- `frecuencia_gasto_id`: referencia - Mensual, anual, etc.

### Tabla: compras
- `pendiente_cuotas`: boolean - Si aún tiene cuotas por pagar
- `fecha_compra`: fecha - Fecha de la compra original
- `cantidad_cuotas`: número - Total de cuotas
- `monto_total`: número - Monto total de la compra

### Tabla: debitos_automaticos
- `activo`: boolean - Si debe procesarse
- `dia_de_pago`: número - Día del mes
- `ultima_fecha_generado`: fecha - Última generación
- `frecuencia_gasto_id`: referencia - Generalmente mensual

### Tabla: gastos
- `tipo_origen`: enum - 'unico', 'recurrente', 'compra', 'debito_automatico'
- `id_origen`: número - ID del registro original
- Todos los demás campos necesarios para un gasto

## Próximos Pasos

1. ✅ Frontend implementado con botón manual
2. ⏳ Backend: Implementar endpoint `/api/procesamiento/procesar-pendientes`
3. ⏳ Backend: Agregar cron job para ejecución diaria automática
4. ⏳ Testing exhaustivo con diferentes escenarios
5. ⏳ Monitoreo y logs del procesamiento automático

## Notas Adicionales

- El frontend está preparado para manejar errores del backend
- Las notificaciones se muestran automáticamente (toast)
- Los datos se refrescan automáticamente después del procesamiento
- El botón se deshabilita mientras procesa para evitar múltiples ejecuciones
