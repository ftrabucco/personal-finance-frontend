// src/components/forms/CurrencySelector.tsx
import { DollarSign, Banknote } from 'lucide-react'
import { Label } from '@/components/ui/label'
import { cn } from '@/lib/utils'
import type { Moneda } from '@/types/models'

interface CurrencySelectorProps {
  value: Moneda
  onChange: (value: Moneda) => void
  label?: string
  disabled?: boolean
}

export function CurrencySelector({
  value,
  onChange,
  label = 'Moneda',
  disabled = false,
}: CurrencySelectorProps) {
  return (
    <div className="space-y-2">
      <Label>{label}</Label>
      <div className="grid grid-cols-2 gap-2">
        <button
          type="button"
          disabled={disabled}
          onClick={() => onChange('ARS')}
          className={cn(
            'flex items-center justify-center gap-2 px-4 py-3 rounded-lg border-2 transition-all',
            'hover:border-primary hover:bg-primary/5',
            'disabled:opacity-50 disabled:cursor-not-allowed',
            value === 'ARS'
              ? 'border-primary bg-primary/10 text-primary font-semibold'
              : 'border-gray-200 dark:border-gray-700'
          )}
        >
          <Banknote className="h-5 w-5" />
          <span>ARS</span>
        </button>

        <button
          type="button"
          disabled={disabled}
          onClick={() => onChange('USD')}
          className={cn(
            'flex items-center justify-center gap-2 px-4 py-3 rounded-lg border-2 transition-all',
            'hover:border-primary hover:bg-primary/5',
            'disabled:opacity-50 disabled:cursor-not-allowed',
            value === 'USD'
              ? 'border-primary bg-primary/10 text-primary font-semibold'
              : 'border-gray-200 dark:border-gray-700'
          )}
        >
          <DollarSign className="h-5 w-5" />
          <span>USD</span>
        </button>
      </div>
    </div>
  )
}
