// src/lib/hooks/useTarjetaDetalle.ts
import { useTarjeta } from './useTarjetas'
import { useComprasByTarjeta } from './useCompras'
import { useDebitosByTarjeta } from './useDebitosAutomaticos'
import { useRecurrentesByTarjeta } from './useGastosRecurrentes'
import { useGastosUnicosByTarjeta } from './useGastosUnicos'

export function useTarjetaDetalle(tarjetaId: number) {
  const { data: tarjetaResponse, isLoading: loadingTarjeta } = useTarjeta(tarjetaId)
  const { data: comprasResponse, isLoading: loadingCompras } = useComprasByTarjeta(tarjetaId)
  const { data: debitosResponse, isLoading: loadingDebitos } = useDebitosByTarjeta(tarjetaId)
  const { data: recurrentesResponse, isLoading: loadingRecurrentes } = useRecurrentesByTarjeta(tarjetaId)
  const { data: gastosUnicosResponse, isLoading: loadingGastosUnicos } = useGastosUnicosByTarjeta(tarjetaId)

  const isLoading = loadingTarjeta || loadingCompras || loadingDebitos || loadingRecurrentes || loadingGastosUnicos

  return {
    tarjeta: tarjetaResponse?.data,
    compras: comprasResponse?.data || [],
    debitos: debitosResponse?.data || [],
    recurrentes: recurrentesResponse?.data || [],
    gastosUnicos: gastosUnicosResponse?.data || [],
    isLoading,
  }
}
