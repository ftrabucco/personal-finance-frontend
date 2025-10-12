'use client'

// src/lib/auth/authContext.tsx
import { createContext, useContext, useState, useEffect, ReactNode } from 'react'
import { useRouter } from 'next/navigation'
import { authApi } from '@/lib/api/endpoints/auth'
import type { User } from '@/types'

interface AuthContextType {
  user: User | null
  token: string | null
  isLoading: boolean
  login: (email: string, password: string) => Promise<void>
  register: (nombre: string, email: string, password: string) => Promise<void>
  logout: () => Promise<void>
  isAuthenticated: boolean
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [token, setToken] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const router = useRouter()

  // Cargar usuario desde localStorage al montar
  useEffect(() => {
    const storedToken = localStorage.getItem('token')
    const storedUser = localStorage.getItem('user')

    if (storedToken && storedUser) {
      setToken(storedToken)
      setUser(JSON.parse(storedUser))
    }

    setIsLoading(false)
  }, [])

  const login = async (email: string, password: string) => {
    try {
      console.log('🔐 Intentando login con:', email)
      const response = await authApi.login(email, password)
      console.log('✅ Respuesta del servidor:', response)

      const { token, user } = response.data
      console.log('📦 Token recibido:', token ? 'Sí' : 'No')
      console.log('👤 Usuario recibido:', user)

      // Guardar en localStorage
      localStorage.setItem('token', token)
      localStorage.setItem('user', JSON.stringify(user))

      // Guardar token en cookie para el middleware
      document.cookie = `token=${token}; path=/; max-age=${60 * 60 * 24 * 7}; SameSite=Lax`

      setToken(token)
      setUser(user)

      console.log('🚀 Redirigiendo a /')
      router.push('/')
    } catch (error) {
      console.error('❌ Error en login:', error)
      throw error
    }
  }

  const register = async (nombre: string, email: string, password: string) => {
    try {
      const response = await authApi.register(nombre, email, password)
      const { token, user } = response.data

      // Guardar en localStorage
      localStorage.setItem('token', token)
      localStorage.setItem('user', JSON.stringify(user))

      // Guardar token en cookie para el middleware
      document.cookie = `token=${token}; path=/; max-age=${60 * 60 * 24 * 7}; SameSite=Lax`

      setToken(token)
      setUser(user)

      router.push('/')
    } catch (error) {
      throw error
    }
  }

  const logout = async () => {
    try {
      await authApi.logout()
    } catch (error) {
      console.error('Error al cerrar sesión:', error)
    } finally {
      // Limpiar localStorage
      localStorage.removeItem('token')
      localStorage.removeItem('user')

      // Limpiar cookie
      document.cookie = 'token=; path=/; max-age=0'

      setToken(null)
      setUser(null)
      router.push('/login')
    }
  }

  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        isLoading,
        login,
        register,
        logout,
        isAuthenticated: !!token && !!user,
      }}
    >
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return context
}
