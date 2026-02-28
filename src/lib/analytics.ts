/**
 * Google Analytics 4 Helper
 * Centraliza el tracking de eventos custom
 */

type GTagEvent = {
  action: string;
  category: string;
  label?: string;
  value?: number;
};

// Declarar gtag como función global
declare global {
  interface Window {
    gtag?: (
      command: "event" | "config" | "js",
      targetId: string,
      config?: Record<string, unknown>
    ) => void;
  }
}

/**
 * Envía un evento a Google Analytics
 */
export function trackEvent({ action, category, label, value }: GTagEvent) {
  if (typeof window !== "undefined" && window.gtag) {
    window.gtag("event", action, {
      event_category: category,
      event_label: label,
      value: value,
    });
  }
}

// ============================================
// Eventos de Gastos
// ============================================

export const analytics = {
  // Gastos Únicos
  gastoCreado: (categoria?: string, monto?: number) => {
    trackEvent({
      action: "crear_gasto",
      category: "gastos",
      label: categoria,
      value: monto,
    });
  },

  gastoEditado: () => {
    trackEvent({
      action: "editar_gasto",
      category: "gastos",
    });
  },

  gastoEliminado: () => {
    trackEvent({
      action: "eliminar_gasto",
      category: "gastos",
    });
  },

  // Gastos Recurrentes
  gastoRecurrenteCreado: (frecuencia?: string) => {
    trackEvent({
      action: "crear_gasto_recurrente",
      category: "gastos_recurrentes",
      label: frecuencia,
    });
  },

  // Débitos Automáticos
  debitoCreado: () => {
    trackEvent({
      action: "crear_debito",
      category: "debitos_automaticos",
    });
  },

  // Compras en cuotas
  compraCreada: (cuotas?: number) => {
    trackEvent({
      action: "crear_compra",
      category: "compras",
      value: cuotas,
    });
  },

  // Tarjetas
  tarjetaCreada: (tipo?: string) => {
    trackEvent({
      action: "crear_tarjeta",
      category: "tarjetas",
      label: tipo,
    });
  },

  // Ingresos
  ingresoCreado: () => {
    trackEvent({
      action: "crear_ingreso",
      category: "ingresos",
    });
  },

  // Navegación/Features
  filtrosUsados: (seccion: string) => {
    trackEvent({
      action: "usar_filtros",
      category: "navegacion",
      label: seccion,
    });
  },

  exportarDatos: (formato: string) => {
    trackEvent({
      action: "exportar",
      category: "acciones",
      label: formato,
    });
  },

  // Auth
  login: () => {
    trackEvent({
      action: "login",
      category: "auth",
    });
  },

  logout: () => {
    trackEvent({
      action: "logout",
      category: "auth",
    });
  },
};
