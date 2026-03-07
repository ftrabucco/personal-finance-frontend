// src/lib/api/endpoints/cuentasBancarias.ts
import { apiClient } from '../client'
import type { StandardResponse, CuentaBancaria } from '@/types'

interface CuentaBancariaFilters {
  tipo?: 'ahorro' | 'corriente'
  moneda?: 'ARS' | 'USD'
  activa?: boolean
  banco?: string
}

interface CuentaBancariaUsage {
  cuenta: {
    id: number
    nombre: string
    tipo: string
  }
  inUse: boolean
  usage: {
    debitosAutomaticos: number
    total: number
  }
}

interface CuentaBancariaStats {
  estadisticas: {
    total: number
    activas: number
    inactivas: number
    porTipo: Record<string, number>
    porMoneda: Record<string, number>
    porBanco: Record<string, number>
  }
  usuario_id: number
}

export const cuentasBancariasApi = {
  getCuentasBancarias: async (params?: CuentaBancariaFilters) => {
    const { data } = await apiClient.get<StandardResponse<CuentaBancaria[]>>(
      '/cuentas-bancarias',
      { params }
    )
    return data
  },

  getCuentaBancariaById: async (id: number) => {
    const { data } = await apiClient.get<StandardResponse<CuentaBancaria>>(
      `/cuentas-bancarias/${id}`
    )
    return data
  },

  createCuentaBancaria: async (cuenta: Partial<CuentaBancaria>) => {
    const { data } = await apiClient.post<StandardResponse<CuentaBancaria>>(
      '/cuentas-bancarias',
      cuenta
    )
    return data
  },

  updateCuentaBancaria: async (id: number, cuenta: Partial<CuentaBancaria>) => {
    const { data } = await apiClient.put<StandardResponse<CuentaBancaria>>(
      `/cuentas-bancarias/${id}`,
      cuenta
    )
    return data
  },

  deleteCuentaBancaria: async (id: number) => {
    const { data } = await apiClient.delete<StandardResponse<{ message: string }>>(
      `/cuentas-bancarias/${id}`
    )
    return data
  },

  checkUsage: async (id: number) => {
    const { data } = await apiClient.get<StandardResponse<CuentaBancariaUsage>>(
      `/cuentas-bancarias/${id}/usage`
    )
    return data
  },

  getStats: async () => {
    const { data } = await apiClient.get<StandardResponse<CuentaBancariaStats>>(
      '/cuentas-bancarias/stats'
    )
    return data
  },
}
