// src/lib/hooks/useCatalogos.ts
import { useQuery } from '@tanstack/react-query'
import type { Categoria, Importancia, TipoPago, Frecuencia } from '@/types'

// Catálogos hardcodeados (el backend no tiene endpoints para estos)
// Los valores están tomados directamente de la base de datos
const CATEGORIAS: Categoria[] = [
  { id: 1, nombre_categoria: 'Alquiler' },
  { id: 2, nombre_categoria: 'Expensas' },
  { id: 3, nombre_categoria: 'Servicios (luz, gas, agua)' },
  { id: 4, nombre_categoria: 'Internet / Cable' },
  { id: 5, nombre_categoria: 'Hogar / Mantenimiento' },
  { id: 6, nombre_categoria: 'Supermercado' },
  { id: 7, nombre_categoria: 'Almacén / Verdulería' },
  { id: 8, nombre_categoria: 'Delivery / Comida' },
  { id: 9, nombre_categoria: 'Restaurantes' },
  { id: 10, nombre_categoria: 'Transporte público' },
  { id: 11, nombre_categoria: 'Combustible' },
  { id: 12, nombre_categoria: 'Uber / Taxi' },
  { id: 13, nombre_categoria: 'Mantenimiento vehículo' },
  { id: 14, nombre_categoria: 'Farmacia' },
  { id: 15, nombre_categoria: 'Médicos / Consultas' },
  { id: 16, nombre_categoria: 'Obra social / Prepaga' },
  { id: 17, nombre_categoria: 'Peluquería / Estética' },
  { id: 18, nombre_categoria: 'Ropa / Calzado' },
  { id: 19, nombre_categoria: 'Gimnasio / Deportes' },
  { id: 20, nombre_categoria: 'Streaming / Suscripciones' },
  { id: 21, nombre_categoria: 'Cine / Teatro' },
  { id: 22, nombre_categoria: 'Libros / Cursos' },
  { id: 23, nombre_categoria: 'Hobbies' },
  { id: 24, nombre_categoria: 'Tarjetas de crédito' },
  { id: 25, nombre_categoria: 'Préstamos' },
  { id: 26, nombre_categoria: 'Seguros' },
  { id: 27, nombre_categoria: 'Impuestos' },
  { id: 28, nombre_categoria: 'Regalos' },
  { id: 29, nombre_categoria: 'Salidas con amigos' },
  { id: 30, nombre_categoria: 'Familia' },
  { id: 31, nombre_categoria: 'Veterinario' },
  { id: 32, nombre_categoria: 'Comida mascotas' },
  { id: 33, nombre_categoria: 'Ahorro / Inversión' },
  { id: 34, nombre_categoria: 'Emergencias' },
  { id: 35, nombre_categoria: 'Otros' },
]

const IMPORTANCIAS: Importancia[] = [
  { id: 1, nombre_importancia: 'Esencial' },
  { id: 2, nombre_importancia: 'Importante' },
  { id: 3, nombre_importancia: 'Nice to have' },
  { id: 4, nombre_importancia: 'Prescindible' },
  { id: 5, nombre_importancia: 'No debería' },
]

const TIPOS_PAGO: TipoPago[] = [
  { id: 1, nombre: 'Efectivo', permite_cuotas: false },
  { id: 2, nombre: 'Débito', permite_cuotas: false },
  { id: 3, nombre: 'Crédito', permite_cuotas: true },
  { id: 4, nombre: 'Transferencia', permite_cuotas: false },
  { id: 5, nombre: 'MercadoPago', permite_cuotas: false },
  { id: 6, nombre: 'Cheque', permite_cuotas: false },
]

const FRECUENCIAS: Frecuencia[] = [
  { id: 1, nombre_frecuencia: 'Único' },
  { id: 2, nombre_frecuencia: 'Diario' },
  { id: 3, nombre_frecuencia: 'Semanal' },
  { id: 4, nombre_frecuencia: 'Mensual' },
  { id: 5, nombre_frecuencia: 'Bimestral' },
  { id: 6, nombre_frecuencia: 'Trimestral' },
  { id: 7, nombre_frecuencia: 'Semestral' },
  { id: 8, nombre_frecuencia: 'Anual' },
]

export function useCategorias() {
  return useQuery({
    queryKey: ['categorias'],
    queryFn: async () => ({ data: CATEGORIAS }),
    staleTime: Infinity, // No cambiarán nunca
  })
}

export function useImportancias() {
  return useQuery({
    queryKey: ['importancias'],
    queryFn: async () => ({ data: IMPORTANCIAS }),
    staleTime: Infinity,
  })
}

export function useTiposPago() {
  return useQuery({
    queryKey: ['tipos-pago'],
    queryFn: async () => ({ data: TIPOS_PAGO }),
    staleTime: Infinity,
  })
}

export function useFrecuencias() {
  return useQuery({
    queryKey: ['frecuencias'],
    queryFn: async () => ({ data: FRECUENCIAS }),
    staleTime: Infinity,
  })
}

// Hook combinado para cargar todos los catálogos de una vez
export function useCatalogosCompletos() {
  const categorias = useCategorias()
  const importancias = useImportancias()
  const tiposPago = useTiposPago()
  const frecuencias = useFrecuencias()

  return {
    categorias,
    importancias,
    tiposPago,
    frecuencias,
    isLoading:
      categorias.isLoading ||
      importancias.isLoading ||
      tiposPago.isLoading ||
      frecuencias.isLoading,
    isError:
      categorias.isError ||
      importancias.isError ||
      tiposPago.isError ||
      frecuencias.isError,
  }
}
