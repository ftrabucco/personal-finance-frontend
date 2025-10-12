# 💰 Finanzas Personales - Frontend

Aplicación web moderna para gestión de finanzas personales desarrollada con Next.js 15, TypeScript y TailwindCSS.

## 🚀 Inicio Rápido

### Requisitos Previos
- Node.js 18+
- Backend corriendo en `http://localhost:3030`

### Instalación

```bash
# Instalar dependencias
npm install

# Iniciar servidor de desarrollo
npm run dev
```

La aplicación estará disponible en [http://localhost:3000](http://localhost:3000)

## 📱 Funcionalidades Implementadas

### ✅ Autenticación
- Login con validación de formularios
- Registro de nuevos usuarios
- Protección automática de rutas
- Manejo de sesiones con JWT

### ✅ Dashboard
- Vista principal con estadísticas
- Sidebar con navegación completa
- Header responsive
- Cards de resumen

## 🛠️ Stack Tecnológico

- **Framework:** Next.js 15.5.4 (App Router)
- **Lenguaje:** TypeScript 5.9.3
- **Estilos:** TailwindCSS 3.4.18
- **UI Components:** shadcn/ui + Radix UI
- **State Management:** React Query (TanStack Query)
- **HTTP Client:** Axios
- **Forms:** React Hook Form + Zod
- **Date Handling:** date-fns
- **Charts:** Recharts
- **Icons:** lucide-react

## 📁 Estructura del Proyecto

```
src/
├── app/                      # Next.js App Router
│   ├── (auth)/              # Rutas públicas (login, register)
│   ├── (dashboard)/         # Rutas protegidas (dashboard, gastos, etc.)
│   ├── layout.tsx           # Root layout
│   └── providers.tsx        # React Query + Auth providers
├── components/
│   ├── ui/                  # shadcn/ui components
│   ├── layout/              # Sidebar, Header
│   ├── forms/               # Formularios
│   ├── charts/              # Gráficos
│   └── tables/              # Tablas
├── lib/
│   ├── api/                 # Configuración API
│   │   ├── client.ts        # Axios instance
│   │   ├── queryClient.ts   # React Query config
│   │   └── endpoints/       # API endpoints
│   ├── auth/                # Autenticación
│   │   └── authContext.tsx  # AuthProvider + useAuth
│   ├── utils/               # Utilidades
│   │   ├── formatters.ts    # Formateo de datos
│   │   └── errorHandler.ts  # Manejo de errores
│   └── validations/         # Schemas Zod
├── types/                   # TypeScript types
│   ├── models.ts            # Modelos de datos
│   └── api.ts               # Response types
├── constants/               # Constantes
│   └── routes.ts            # Rutas de la app
└── middleware.ts            # Protección de rutas
```

## 🔐 Sistema de Autenticación

El sistema usa JWT tokens almacenados en localStorage:

```typescript
// Hook de autenticación
const { user, login, logout, isAuthenticated } = useAuth()

// Login
await login(email, password)

// Logout
await logout()
```

### Rutas Protegidas
El middleware protege automáticamente todas las rutas excepto `/login` y `/register`.

## 🎨 Componentes UI Disponibles

- Button
- Card
- Input
- Label
- Form (con validación)
- Dialog (próximamente)
- Select (próximamente)
- Table (próximamente)

## 📝 Scripts Disponibles

```bash
# Desarrollo
npm run dev

# Build de producción
npm run build

# Iniciar producción
npm start

# Linting
npm run lint

# Type checking
npm run type-check
```

## 🌐 Variables de Entorno

Copia `.env.example` a `.env.local` y configura:

```env
NEXT_PUBLIC_API_URL=http://localhost:3030/api
NEXT_PUBLIC_APP_NAME=Finanzas Personales
NEXT_PUBLIC_DEFAULT_LOCALE=es-AR
```

## 🔗 API Backend

El frontend se conecta al backend en `http://localhost:3030/api`

Endpoints principales:
- `POST /auth/login` - Iniciar sesión
- `POST /auth/register` - Registrar usuario
- `GET /gastos` - Obtener gastos
- `GET /tarjetas` - Obtener tarjetas
- Ver [CLAUDE.md](CLAUDE.md) para documentación completa

## 📚 Documentación Adicional

- [CLAUDE.md](CLAUDE.md) - Documentación completa del proyecto
- [Next.js Docs](https://nextjs.org/docs)
- [shadcn/ui](https://ui.shadcn.com)
- [TailwindCSS](https://tailwindcss.com)

## 🚧 Próximos Pasos

- [ ] Implementar gestión de gastos
- [ ] Implementar gestión de tarjetas
- [ ] Implementar compras en cuotas
- [ ] Agregar gráficos y reportes
- [ ] Implementar filtros avanzados
- [ ] Agregar tests E2E

## 📄 Licencia

ISC
