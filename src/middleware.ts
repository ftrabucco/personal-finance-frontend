// src/middleware.ts
import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import { PUBLIC_ROUTES } from '@/constants/routes'

export function middleware(request: NextRequest) {
  const token = request.cookies.get('token')?.value
  const pathname = request.nextUrl.pathname

  // Verificar si la ruta es pública
  const isPublicRoute = PUBLIC_ROUTES.some(route => pathname.startsWith(route))

  // Si es ruta pública y está autenticado, redirigir al dashboard
  if (isPublicRoute && token) {
    return NextResponse.redirect(new URL('/', request.url))
  }

  // Si es ruta privada y NO está autenticado, redirigir al login
  if (!isPublicRoute && !token) {
    return NextResponse.redirect(new URL('/login', request.url))
  }

  return NextResponse.next()
}

export const config = {
  matcher: ['/((?!api|_next/static|_next/image|favicon.ico|icons|manifest.json|sw.js|workbox).*)'],
}
