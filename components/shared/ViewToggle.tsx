'use client'

import React from 'react'
import { Grid, List, Layout } from 'lucide-react'
import { cn } from '@/lib/utils'
import { ViewMode } from './types/unified-table'

interface ViewToggleProps {
  viewMode: ViewMode
  onViewModeChange: (mode: ViewMode) => void
  className?: string
}

export default function ViewToggle({
  viewMode,
  onViewModeChange,
  className
}: ViewToggleProps) {
  const viewOptions = [
    { mode: 'table' as ViewMode, icon: List, label: 'Table' },
    { mode: 'grid' as ViewMode, icon: Grid, label: 'Grid' },
    { mode: 'card' as ViewMode, icon: Layout, label: 'Card' }
  ]

  return (
    <div className={cn('flex items-center space-x-1', className)}>
      {viewOptions.map((option) => {
        const Icon = option.icon
        return (
          <button
            key={option.mode}
            onClick={() => onViewModeChange(option.mode)}
            className={cn(
              'flex items-center space-x-2 px-3 py-2 rounded-lg border transition-colors',
              viewMode === option.mode
                ? 'border-blue-500 bg-blue-50 text-blue-700'
                : 'border-gray-300 text-gray-700 hover:border-gray-400 hover:bg-gray-50'
            )}
          >
            <Icon className="h-4 w-4" />
            <span className="text-sm font-medium">{option.label}</span>
          </button>
        )
      })}
    </div>
  )
}