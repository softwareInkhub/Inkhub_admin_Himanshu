'use client'

import { useState } from 'react'
import { ContentItem } from '../types'

interface ContentGridCardFilterHeaderProps {
  selectedProducts: string[]
  currentProducts: ContentItem[]
  onSelectAll: () => void
  activeColumnFilter: string | null
  columnFilters: Record<string, any>
  onFilterClick: (column: string) => void
  onColumnFilterChange: (column: string, value: any) => void
  getUniqueValues: (column: string) => any[]
  cardsPerRow?: number
  onCardsPerRowChange?: (value: number) => void
}

export default function ContentGridCardFilterHeader({
  selectedProducts,
  currentProducts,
  onSelectAll,
  activeColumnFilter,
  columnFilters,
  onFilterClick,
  onColumnFilterChange,
  getUniqueValues,
  cardsPerRow,
  onCardsPerRowChange
}: ContentGridCardFilterHeaderProps) {
  const [showFilters, setShowFilters] = useState(false)

  const isAllSelected = selectedProducts.length === currentProducts.length && currentProducts.length > 0
  const isPartiallySelected = selectedProducts.length > 0 && selectedProducts.length < currentProducts.length

  return (
    <div className="bg-white border-b border-gray-200 px-4 py-3">
      <div className="flex items-center justify-between">
        {/* Left side - Selection and count */}
        <div className="flex items-center space-x-4">
          <div className="flex items-center space-x-2">
            <input
              type="checkbox"
              checked={isAllSelected}
              ref={(input) => {
                if (input) input.indeterminate = isPartiallySelected
              }}
              onChange={onSelectAll}
              className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
            />
            <span className="text-sm text-gray-700">
              {selectedProducts.length > 0 
                ? `${selectedProducts.length} of ${currentProducts.length} selected`
                : `${currentProducts.length} content items`
              }
            </span>
          </div>
        </div>

        {/* Right side - View controls and filters */}
        <div className="flex items-center space-x-4">
          {/* Cards per row selector */}
          {cardsPerRow !== undefined && onCardsPerRowChange && (
            <div className="flex items-center space-x-2">
              <span className="text-sm text-gray-700">Cards per row:</span>
              <select
                value={cardsPerRow}
                onChange={(e) => onCardsPerRowChange(Number(e.target.value))}
                className="text-sm border border-gray-300 rounded-md px-2 py-1 focus:ring-blue-500 focus:border-blue-500"
              >
                <option value={2}>2</option>
                <option value={3}>3</option>
                <option value={4}>4</option>
                <option value={5}>5</option>
                <option value={6}>6</option>
              </select>
            </div>
          )}

          {/* Filter toggle */}
          <button
            onClick={() => setShowFilters(!showFilters)}
            className={`px-3 py-1 text-sm rounded-md transition-colors ${
              showFilters || Object.keys(columnFilters).length > 0
                ? 'bg-blue-100 text-blue-700 border border-blue-300'
                : 'bg-gray-100 text-gray-700 border border-gray-300 hover:bg-gray-200'
            }`}
          >
            Filters {Object.keys(columnFilters).length > 0 && `(${Object.keys(columnFilters).length})`}
          </button>
        </div>
      </div>

      {/* Filter panel */}
      {showFilters && (
        <div className="mt-4 pt-4 border-t border-gray-200">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {/* Type filter */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Type</label>
              <select
                value={columnFilters.type || ''}
                onChange={(e) => onColumnFilterChange('type', e.target.value || null)}
                className="w-full text-sm border border-gray-300 rounded-md px-2 py-1 focus:ring-blue-500 focus:border-blue-500"
              >
                <option value="">All Types</option>
                <option value="text">Text</option>
                <option value="image">Image</option>
                <option value="video">Video</option>
                <option value="audio">Audio</option>
                <option value="file">File</option>
                <option value="json">JSON</option>
                <option value="richtext">Rich Text</option>
                <option value="html">HTML</option>
              </select>
            </div>

            {/* Status filter */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Status</label>
              <select
                value={columnFilters.status || ''}
                onChange={(e) => onColumnFilterChange('status', e.target.value || null)}
                className="w-full text-sm border border-gray-300 rounded-md px-2 py-1 focus:ring-blue-500 focus:border-blue-500"
              >
                <option value="">All Statuses</option>
                <option value="published">Published</option>
                <option value="draft">Draft</option>
                <option value="archived">Archived</option>
              </select>
            </div>

            {/* Locale filter */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Locale</label>
              <select
                value={columnFilters.locale || ''}
                onChange={(e) => onColumnFilterChange('locale', e.target.value || null)}
                className="w-full text-sm border border-gray-300 rounded-md px-2 py-1 focus:ring-blue-500 focus:border-blue-500"
              >
                <option value="">All Locales</option>
                <option value="en-US">English (US)</option>
                <option value="en-IN">English (India)</option>
                <option value="es-ES">Spanish (Spain)</option>
                <option value="fr-FR">French (France)</option>
                <option value="de-DE">German (Germany)</option>
              </select>
            </div>

            {/* Clear filters */}
            <div className="flex items-end">
              <button
                onClick={() => {
                  Object.keys(columnFilters).forEach(key => {
                    onColumnFilterChange(key, null)
                  })
                }}
                className="px-3 py-1 text-sm text-gray-600 hover:text-gray-800 border border-gray-300 rounded-md hover:bg-gray-50"
              >
                Clear Filters
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
