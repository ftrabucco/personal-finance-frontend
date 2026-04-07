'use client'

import { useState } from 'react'
import { SlidersHorizontal } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent } from '@/components/ui/card'

export interface DatePreset {
  label: string
  getRange: () => { from: string; to: string }
}

interface CollapsibleFiltersProps {
  children: React.ReactNode
  activeFilterCount: number
  defaultOpen?: boolean
  datePresets?: DatePreset[]
  onPresetSelect?: (from: string, to: string) => void
  currentDateFrom?: string
  currentDateTo?: string
}

export function CollapsibleFilters({
  children,
  activeFilterCount,
  defaultOpen = false,
  datePresets,
  onPresetSelect,
  currentDateFrom,
  currentDateTo,
}: CollapsibleFiltersProps) {
  const [open, setOpen] = useState(defaultOpen)

  const isPresetActive = (preset: DatePreset) => {
    if (!currentDateFrom && !currentDateTo) return false
    const range = preset.getRange()
    return range.from === currentDateFrom && range.to === currentDateTo
  }

  return (
    <div className="space-y-2">
      <div className="flex items-center gap-2 flex-wrap">
        <Button
          variant={activeFilterCount > 0 ? 'default' : 'outline'}
          size="sm"
          onClick={() => setOpen(!open)}
          className="gap-1.5 shrink-0"
        >
          <SlidersHorizontal className="h-4 w-4" />
          <span>Filtros</span>
          {activeFilterCount > 0 && (
            <Badge variant="secondary" className="h-5 w-5 p-0 flex items-center justify-center text-[10px] rounded-full">
              {activeFilterCount}
            </Badge>
          )}
        </Button>
        {datePresets && onPresetSelect && (
          <div className="flex gap-1.5 flex-wrap">
            {datePresets.map((preset) => {
              const active = isPresetActive(preset)
              return (
                <Button
                  key={preset.label}
                  variant={active ? 'default' : 'outline'}
                  size="sm"
                  className="h-7 text-xs"
                  onClick={() => {
                    const { from, to } = preset.getRange()
                    onPresetSelect(from, to)
                  }}
                >
                  {preset.label}
                </Button>
              )
            })}
          </div>
        )}
      </div>
      {open && (
        <Card>
          <CardContent className="pt-4 pb-4">
            {children}
          </CardContent>
        </Card>
      )}
    </div>
  )
}
