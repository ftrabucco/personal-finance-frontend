// src/lib/api/endpoints/auth.ts
import { apiClient } from '../client'
import type { StandardResponse, LoginResponse, User } from '@/types'

export const authApi = {
  login: async (email: string, password: string) => {
    const { data } = await apiClient.post<StandardResponse<LoginResponse>>(
      '/auth/login',
      { email, password }
    )
    return data
  },

  register: async (nombre: string, email: string, password: string) => {
    const { data } = await apiClient.post<StandardResponse<LoginResponse>>(
      '/auth/register',
      { nombre, email, password }
    )
    return data
  },

  getProfile: async () => {
    const { data } = await apiClient.get<StandardResponse<User>>('/auth/profile')
    return data
  },

  updateProfile: async (updates: Partial<User>) => {
    const { data } = await apiClient.put<StandardResponse<User>>('/auth/profile', updates)
    return data
  },

  changePassword: async (currentPassword: string, newPassword: string) => {
    const { data } = await apiClient.post<StandardResponse<{ message: string }>>(
      '/auth/change-password',
      { currentPassword, newPassword }
    )
    return data
  },

  logout: async () => {
    const { data } = await apiClient.post<StandardResponse<{ message: string }>>(
      '/auth/logout'
    )
    return data
  },
}
