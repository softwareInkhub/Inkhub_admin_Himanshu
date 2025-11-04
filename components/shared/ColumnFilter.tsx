'use client'

import React, { useState } from 'react'
import { X, Filter } from 'lucide-react'
import { cn } from '@/lib/utils'

interface ColumnFilterProps {
  column: string
  values: string[]
  selectedValues: string[]
  onFilterChange: (values: string[]) => void
  onClose: () => void
  className?: string
}

export default function ColumnFilter({
  column,
  values,
  selectedValues,
  onFilterChange,
  onClose,
  className
}: ColumnFilterProps) {
  const [searchTerm, setSearchTerm] = useState('')

  const filteredValues = values.filter(value =>
    value.toLowerCase().includes(searchTerm.toLowerCase())
  )

  const handleToggleValue = (value: string) => {
    const newSelectedValues = selectedValues.includes(value)
      ? selectedValues.filter(v => v !== value)
      : [...selectedValues, value]
    onFilterChange(newSelectedValues)
  }

  const handleSelectAll = () => {
    onFilterChange(filteredValues)
  }

  const handleClearAll = () => {
    onFilterChange([])
  }

  return (
    <div className={cn(
      'absolute top-full left-0 mt-1 w-64 bg-white border border-gray-200 rounded-lg shadow-lg z-50',
      className
    )}>
      {/* Header */}
      <div className="flex items-center justify-between p-3 border-b border-gray-200">
        <div className="flex items-center space-x-2">
          <Filter className="h-4 w-4 text-gray-500" />
          <span className="text-sm font-medium text-gray-900">Filter {column}</span>
        </div>
        <button
          onClick={onClose}
          className="text-gray-400 hover:text-gray-600"
        >
          <X className="h-4 w-4" />
        </button>
      </div>

      {/* Search */}
      <div className="p-3 border-b border-gray-200">
        <input
          type="text"
          placeholder="Search values..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent"
        />
      </div>

      {/* Actions */}
      <div className="flex items-center justify-between p-3 border-b border-gray-200">
        <button
          onClick={handleSelectAll}
          className="text-xs text-blue-600 hover:text-blue-800"
        >
          Select All
        </button>
        <button
          onClick={handleClearAll}
          className="text-xs text-gray-600 hover:text-gray-800"
        >
          Clear All
        </button>
      </div>

      {/* Values */}
      <div className="max-h-48 overflow-y-auto">
        {filteredValues.length === 0 ? (
          <div className="p-3 text-center text-sm text-gray-500">
            No values found
          </div>
        ) : (
          filteredValues.map((value) => (
            <label
              key={value}
              className="flex items-center space-x-3 p-3 hover:bg-gray-50 cursor-pointer"
            >
              <input
                type="checkbox"
                checked={selectedValues.includes(value)}
                onChange={() => handleToggleValue(value)}
                className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
              />
              <span className="text-sm text-gray-900 truncate">{value}</span>
            </label>
          ))
        )}
      </div>

      {/* Footer */}
      <div className="flex items-center justify-between p-3 border-t border-gray-200">
        <span className="text-xs text-gray-500">
          {selectedValues.length} of {values.length} selected
        </span>
        <button
          onClick={onClose}
          className="px-3 py-1 text-sm text-blue-600 hover:text-blue-800"
        >
          Apply
        </button>
      </div>
    </div>
  )
}