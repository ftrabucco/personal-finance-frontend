// src/components/common/DualCurrencyDisplay.tsx
import { formatCurrency } from '@/lib/utils/formatters'
import type { Moneda } from '@/types/models'
import { Badge } from '@/components/ui/badge'
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip'

interface DualCurrencyDisplayProps {
  montoArs: number
  montoUsd: number
  monedaOrigen: Moneda
  tipoCambio?: number
  className?: string
  showBothAlways?: boolean
}

export function DualCurrencyDisplay({
  montoArs,
  montoUsd,
  monedaOrigen,
  tipoCambio,
  className = '',
  showBothAlways = false,
}: DualCurrencyDisplayProps) {
  // Asegurar que los montos sean números válidos
  const arsValue = Number(montoArs) || 0
  const usdValue = Number(montoUsd) || 0
  const tcValue = Number(tipoCambio) || 0

  const montoOriginFormateado =
    monedaOrigen === 'ARS' ? formatCurrency(arsValue) : `US$ ${usdValue.toFixed(2)}`

  const montoConvertidoFormateado =
    monedaOrigen === 'ARS' ? `US$ ${usdValue.toFixed(2)}` : formatCurrency(arsValue)

  if (showBothAlways) {
    return (
      <div className={`flex flex-col ${className}`}>
        <div className="flex items-center gap-2">
          <span className="font-semibold">{montoOriginFormateado}</span>
          <Badge variant="outline" className="text-xs">
            {monedaOrigen}
          </Badge>
        </div>
        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger asChild>
              <span className="text-xs text-muted-foreground cursor-help">
                ≈ {montoConvertidoFormateado}
              </span>
            </TooltipTrigger>
            {tcValue > 0 && (
              <TooltipContent>
                <p className="text-xs">
                  TC usado: ${tcValue.toFixed(2)}
                </p>
              </TooltipContent>
            )}
          </Tooltip>
        </TooltipProvider>
      </div>
    )
  }

  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <div className={`flex items-center gap-2 ${className}`}>
            <span className="font-semibold">{montoOriginFormateado}</span>
            <Badge variant="outline" className="text-xs">
              {monedaOrigen}
            </Badge>
          </div>
        </TooltipTrigger>
        <TooltipContent>
          <div className="space-y-1">
            <p className="text-xs">≈ {montoConvertidoFormateado}</p>
            {tcValue > 0 && (
              <p className="text-xs text-muted-foreground">TC: ${tcValue.toFixed(2)}</p>
            )}
          </div>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  )
}
