# Testing Guide

## 🧪 Configuración de Tests

Este proyecto usa **Vitest** junto con **Testing Library** para testing de React.

### Comandos Disponibles

```bash
# Ejecutar todos los tests una vez
npm test

# Modo watch (re-ejecuta automáticamente cuando cambias archivos)
npm run test:watch

# Interfaz visual para tests
npm run test:ui

# Generar reporte de cobertura
npm run test:coverage
```

## 📁 Estructura de Tests

```
src/
├── __tests__/
│   ├── unit/                    # Tests unitarios
│   │   ├── schemas/             # Validaciones de Zod
│   │   ├── hooks/               # Custom hooks
│   │   └── utils/               # Funciones utilitarias
│   ├── integration/             # Tests de integración (próximamente)
│   │   ├── api/                 # Endpoints
│   │   ├── forms/               # Formularios completos
│   │   └── hooks/               # Hooks con React Query
│   └── e2e/                     # Tests End-to-End (próximamente)
└── test/
    └── setup.ts                 # Configuración global de tests
```

## 📝 Ejemplos de Tests

### 1. Test de Schema de Zod

```typescript
import { describe, it, expect } from 'vitest'
import { z } from 'zod'

const mySchema = z.object({
  nombre: z.string().min(1, 'El nombre es requerido'),
  edad: z.number().min(18, 'Debe ser mayor de edad'),
})

describe('My Schema', () => {
  it('should validate correct data', () => {
    const valid = { nombre: 'Juan', edad: 25 }
    const result = mySchema.safeParse(valid)
    expect(result.success).toBe(true)
  })

  it('should reject invalid data', () => {
    const invalid = { nombre: '', edad: 15 }
    const result = mySchema.safeParse(invalid)
    expect(result.success).toBe(false)
  })
})
```

### 2. Test de Custom Hook con React Query

```typescript
import { renderHook, waitFor } from '@testing-library/react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { useMyData } from '@/lib/hooks/useMyData'

const createWrapper = () => {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false } }
  })
  return ({ children }) => (
    <QueryClientProvider client={queryClient}>
      {children}
    </QueryClientProvider>
  )
}

describe('useMyData', () => {
  it('should fetch data successfully', async () => {
    const { result } = renderHook(() => useMyData(), {
      wrapper: createWrapper()
    })

    await waitFor(() => expect(result.current.isSuccess).toBe(true))
    expect(result.current.data).toBeDefined()
  })
})
```

### 3. Test de Componente de React

```typescript
import { render, screen, fireEvent } from '@testing-library/react'
import { describe, it, expect, vi } from 'vitest'
import { MyButton } from './MyButton'

describe('MyButton', () => {
  it('should call onClick when clicked', () => {
    const handleClick = vi.fn()
    render(<MyButton onClick={handleClick}>Click me</MyButton>)

    const button = screen.getByText('Click me')
    fireEvent.click(button)

    expect(handleClick).toHaveBeenCalledTimes(1)
  })
})
```

## ✅ Tests Actuales

### Unit Tests

#### Schemas (47 tests)
- ✅ `tarjeta.test.ts` - Validaciones del schema de tarjetas
  - Casos válidos (débito, crédito, virtual)
  - Validaciones de campos requeridos
  - Validaciones de rangos (días 1-31)
  - Edge cases
- ✅ `gastoUnico.test.ts` - Validaciones del schema de gastos únicos
- ✅ `compra.test.ts` - Validaciones del schema de compras

#### Components (16 tests)
- ✅ `ThemeToggle.test.tsx` - Toggle de tema claro/oscuro
- ✅ `ConfirmDialog.test.tsx` - Dialog de confirmación reutilizable
  - Renderizado de título, descripción y botones
  - Labels personalizables
  - Callbacks de confirmar/cancelar
  - Estado de loading

#### Hooks (20 tests)
- ✅ `useCatalogos.test.tsx` - Hooks de catálogos hardcodeados
  - useCategorias - 35 categorías
  - useImportancias - 5 importancias
  - useTiposPago - 6 tipos de pago
  - useFrecuencias - 8 frecuencias
- ✅ `useConfirmDialog.test.ts` - Hook de gestión de estado para confirm dialogs
  - Estado inicial, requestConfirm, confirm, cancel
  - Requests secuenciales

#### Utils (25 tests)
- ✅ `filtering.test.ts` - Funciones de filtrado

**Total: 108 tests pasando ✓**

## 📊 Próximos Tests a Implementar

### Unit Tests Pendientes
- [ ] Schema de GastoUnicoForm
- [ ] Schema de CompraForm
- [ ] Schema de GastoRecurrenteForm
- [ ] Schema de DebitoAutomaticoForm

### Integration Tests
- [ ] API endpoints (con MSW para mockear)
- [ ] Custom hooks con React Query (mutations, invalidaciones)
- [ ] Formularios completos (render + submit)

### E2E Tests (con Playwright)
- [ ] Flujo de autenticación
- [ ] CRUD de tarjetas
- [ ] CRUD de gastos
- [ ] Dashboard

## 🎯 Objetivos de Cobertura

- **Schemas de validación**: 100%
- **Custom hooks**: 80%+
- **Componentes**: 70%+
- **Utils**: 80%+

## 🔧 Configuración

### vitest.config.ts
- Configurado para usar jsdom (simula el DOM del navegador)
- Alias `@/` apunta a `src/`
- Setup automático con `src/test/setup.ts`
- Cobertura con provider v8

### src/test/setup.ts
- Importa matchers de jest-dom (`toBeInTheDocument`, etc.)
- Limpieza automática después de cada test
- Mocks de `window.matchMedia` e `IntersectionObserver`

## 📚 Recursos

- [Vitest Documentation](https://vitest.dev/)
- [Testing Library](https://testing-library.com/docs/react-testing-library/intro/)
- [Zod Testing Guide](https://zod.dev/)
- [MSW for API Mocking](https://mswjs.io/)
