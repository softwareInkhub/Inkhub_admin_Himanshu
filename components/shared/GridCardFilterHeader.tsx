'use client'

import React from 'react'

type GridFilterColumn = {
  key: string
  label: string
  filterType: 'text' | 'select' | 'multi-select' | 'numeric' | 'date'
  options?: string[]
}

interface GridCardFilterHeaderProps<T = any> {
  selectedItems: string[]
  currentItems: T[]
  onSelectAll: () => void
  activeColumnFilter?: string | null
  columnFilters?: Record<string, any>
  onFilterClick?: (column: string) => void
  onColumnFilterChange?: (column: string, value: any) => void
  getUniqueValues?: (field: string) => string[]
  cardsPerRow?: number
  onCardsPerRowChange?: (n: number) => void
  columns?: GridFilterColumn[]
  itemType?: string
}

export default function GridCardFilterHeader<T = any>({
  selectedItems,
  currentItems,
  onSelectAll,
  itemType,
}: GridCardFilterHeaderProps<T>) {
  return (
    <div className="flex items-center justify-between px-4 py-3 bg-white border-b border-gray-200">
      <div className="flex items-center gap-3">
        <span className="text-sm text-gray-700 font-medium">
        {selectedItems.length}/{currentItems.length} selected
        </span>
        <button 
          onClick={onSelectAll} 
          className="px-3 py-1 text-xs font-medium text-blue-600 hover:text-blue-700 border border-blue-300 hover:border-blue-400 rounded-md hover:bg-blue-50 transition-colors"
        >
          Select all
        </button>
        {itemType && (
          <span className="text-xs text-gray-500 capitalize">{itemType}</span>
        )}
      </div>
      {/* Right side intentionally empty - actions are in the main action bar */}
      <div className="flex items-center gap-2" />
    </div>
  )
}

export type { GridFilterColumn }





