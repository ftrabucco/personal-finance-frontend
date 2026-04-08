# Plan de Pruebas E2E - Finanzas Personales

## Configuracion

- **Framework**: Playwright con Chromium
- **Ejecucion**: Paralela (`fullyParallel: true`, 6 workers)
- **Base URL**: `http://localhost:3001`
- **Backend requerido**: `http://localhost:3030/api`
- **Screenshots**: Automaticas en fallos (`test-results/`)
- **Reporte HTML**: `playwright-report/` → `npm run test:e2e:report`

## Comandos

| Comando | Descripcion |
|---|---|
| `npm run test:e2e` | Todos los tests, headless |
| `npm run test:e2e:headed` | Todos los tests, con browsers visibles |
| `npm run test:e2e:ui` | Dashboard web interactivo con trace viewer |
| `npm run test:e2e:report` | Abre el ultimo reporte HTML |
| `npm run test:e2e:auth` | Solo tests de autenticacion |
| `npm run test:e2e:gastos` | Solo tests de gastos y dashboard |

---

## Matriz de Casos de Prueba

### 1. Autenticacion (`e2e/auth.spec.ts`)

| # | Caso de Prueba | Tipo | Linea | Descripcion | Criterio de Aceptacion |
|---|---|---|---|---|---|
| AUTH-01 | Login page renders correctly | Smoke | [L14](auth.spec.ts#L14) | Verifica que la pagina de login muestra todos los elementos | Titulo, campos email/password, boton "Iniciar Sesion", link a registro visibles |
| AUTH-02 | Shows validation errors for empty fields | Validacion | [L30](auth.spec.ts#L30) | Submit del form sin completar campos | Muestra "El email es requerido" |
| AUTH-03 | Shows error for invalid credentials | Negativo | [L40](auth.spec.ts#L40) | Login con credenciales incorrectas | Muestra mensaje de error del backend (bg-destructive) |
| AUTH-04 | Successful login redirects to dashboard | Happy path | [L51](auth.spec.ts#L51) | Login con credenciales validas | Redirige a `/`, muestra "Hola, {nombre}" |
| AUTH-05 | Unauthenticated user is redirected to login | Seguridad | [L66](auth.spec.ts#L66) | Acceder a `/` sin token | Middleware redirige a `/login` |
| AUTH-06 | Navigate to register page | Navegacion | [L76](auth.spec.ts#L76) | Click en "Registrate aqui" | Navega a `/register` |

### 2. Dashboard (`e2e/gastos.spec.ts`)

| # | Caso de Prueba | Tipo | Linea | Descripcion | Criterio de Aceptacion |
|---|---|---|---|---|---|
| DASH-01 | Loads and shows main sections | Smoke | [L17](gastos.spec.ts#L17) | Verifica que el dashboard carga correctamente | Saludo visible, 4 cards de stats (Gastos del Mes, Ingresos, Balance, Tasa de Ahorro), seccion Gastos Recientes |
| DASH-02 | Process pending button works | Funcional | [L33](gastos.spec.ts#L33) | Click en "Procesar Pendientes" | Boton se deshabilita durante procesamiento, vuelve a habilitarse al terminar |

### 3. Gastos - CRUD (`e2e/gastos.spec.ts`)

| # | Caso de Prueba | Tipo | Linea | Descripcion | Criterio de Aceptacion |
|---|---|---|---|---|---|
| GAST-01 | Navigate to gastos page and see tabs | Smoke | [L46](gastos.spec.ts#L46) | Navegar a `/gastos` | Titulo "Gastos" visible, tabs Historial y Unicos presentes |
| GAST-02 | Create gasto unico via QuickGastoDialog | CRUD - Create | [L57](gastos.spec.ts#L57) | Crear un gasto unico completo desde el dialog | Dialog abre, selecciona tipo, completa form (descripcion, monto, categoria, importancia, tipo pago), submit cierra dialog, gasto aparece en lista |
| GAST-03 | Search in gastos historial | Funcional | [L116](gastos.spec.ts#L116) | Buscar gastos por texto en historial | Input de busqueda visible, filtra sin errores |
| GAST-04 | Delete gasto unico with confirm dialog | CRUD - Delete | [L136](gastos.spec.ts#L136) | Eliminar un gasto E2E existente | Click en eliminar abre ConfirmDialog, confirmar cierra el dialog y elimina el gasto |
| GAST-05 | Gastos historial tab loads with data | Smoke | [L165](gastos.spec.ts#L165) | Verifica que el historial carga contenido | Muestra datos ($), barra de busqueda, o estado vacio |

---

### 4. Dashboard vs Gastos Historial - Consistencia (`e2e/dashboard-gastos-consistency.spec.ts`)

| # | Caso de Prueba | Tipo | Descripcion | Criterio de Aceptacion |
|---|---|---|---|---|
| CONS-01 | Monthly total matches between dashboard and historial | Consistencia | Compara el total de "Gastos del Mes" del dashboard con el total del historial (default "Este mes") | Ambos montos son idénticos |
| CONS-02 | Dashboard shows correct date-filtered total | Validacion | Verifica formato del monto en la card "Gastos del Mes" | Formato válido de moneda ($ X.XXX,XX) |
| CONS-03 | Historial "Este mes" preset shows same period | Smoke | Verifica que el historial con preset "Este mes" carga datos | Muestra datos o estado vacío |
| CONS-04 | Changing date range shows different total | Funcional | Cambia a "Últimos 3 meses" y verifica que el total cambia | Total válido en formato moneda |

---

## Cobertura por Modulo

| Modulo | Tests | Flujos cubiertos | Pendientes |
|---|---|---|---|
| **Auth** | 6 | Login, validacion, credenciales invalidas, redirect, registro | Logout, cambio de password, sesion expirada |
| **Dashboard** | 2 + 4 | Carga, procesar pendientes, consistencia con historial | Click en charts, navegacion a secciones |
| **Gastos** | 5 | Navegacion, CRUD (crear/eliminar), busqueda, carga historial | Editar gasto, filtros por categoria/importancia, tabs recurrentes/debitos/cuotas, paginacion |
| **Ingresos** | 0 | - | CRUD unicos, CRUD recurrentes, busqueda |
| **Tarjetas** | 0 | - | CRUD tarjetas, asociar gastos |
| **Cuentas Bancarias** | 0 | - | CRUD cuentas |
| **Configuracion** | 0 | - | CRUD categorias, CRUD fuentes de ingreso |

## Notas

- Los tests corren en **paralelo** por defecto. Cada test hace su propio login (es autosuficiente).
- El test GAST-04 (delete) se **skipea** si no encuentra gastos E2E para borrar.
- Las credenciales se configuran via env vars: `E2E_USER_EMAIL` y `E2E_USER_PASSWORD`.
- El backend debe estar corriendo en `localhost:3030` antes de ejecutar los tests.
