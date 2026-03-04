// src/lib/hooks/useCuentasBancarias.ts
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { cuentasBancariasApi } from '@/lib/api/endpoints/cuentasBancarias'
import type { CuentaBancaria } from '@/types'

const QUERY_KEY = 'cuentas-bancarias'

export function useCuentasBancarias(filters?: {
  tipo?: 'ahorro' | 'corriente'
  moneda?: 'ARS' | 'USD'
  activa?: boolean
  banco?: string
}) {
  return useQuery({
    queryKey: [QUERY_KEY, filters],
    queryFn: () => cuentasBancariasApi.getCuentasBancarias(filters),
  })
}

export function useCuentaBancaria(id: number) {
  return useQuery({
    queryKey: [QUERY_KEY, id],
    queryFn: () => cuentasBancariasApi.getCuentaBancariaById(id),
    enabled: !!id,
  })
}

export function useCreateCuentaBancaria() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (cuenta: Partial<CuentaBancaria>) =>
      cuentasBancariasApi.createCuentaBancaria(cuenta),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [QUERY_KEY] })
    },
  })
}

export function useUpdateCuentaBancaria() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ id, data }: { id: number; data: Partial<CuentaBancaria> }) =>
      cuentasBancariasApi.updateCuentaBancaria(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [QUERY_KEY] })
    },
  })
}

export function useDeleteCuentaBancaria() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (id: number) => cuentasBancariasApi.deleteCuentaBancaria(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [QUERY_KEY] })
    },
  })
}

export function useCheckCuentaBancariaUsage(id: number) {
  return useQuery({
    queryKey: [QUERY_KEY, id, 'usage'],
    queryFn: () => cuentasBancariasApi.checkUsage(id),
    enabled: !!id,
  })
}

export function useCuentasBancariasStats() {
  return useQuery({
    queryKey: [QUERY_KEY, 'stats'],
    queryFn: () => cuentasBancariasApi.getStats(),
  })
}
