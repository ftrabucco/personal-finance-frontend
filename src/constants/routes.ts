// src/constants/routes.ts

export const ROUTES = {
  // Auth routes
  LOGIN: '/login',
  REGISTER: '/register',

  // Dashboard routes
  DASHBOARD: '/',
  GASTOS: '/gastos',
  GASTOS_UNICOS: '/gastos-unicos',
  COMPRAS: '/compras',
  GASTOS_RECURRENTES: '/gastos-recurrentes',
  DEBITOS_AUTOMATICOS: '/debitos-automaticos',
  TARJETAS: '/tarjetas',
  REPORTES: '/reportes',
  PROYECCIONES: '/proyecciones',
  SALUD_FINANCIERA: '/salud-financiera',
  PERFIL: '/perfil',
} as const

export const PUBLIC_ROUTES = [ROUTES.LOGIN, ROUTES.REGISTER]
