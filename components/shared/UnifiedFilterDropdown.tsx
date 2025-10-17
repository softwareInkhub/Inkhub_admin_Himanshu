'use client'

import { useEffect, useRef, useState } from 'react'
import { cn } from '@/lib/utils'

interface UnifiedFilterDropdownProps {
  column: string
  title: string
  filterType: 'text' | 'select' | 'multi-select' | 'date' | 'numeric'
  options?: string[]
  value: any
  onChange: (value: any) => void
  onClose: () => void
  position: { x: number; y: number }
  getUniqueValues?: (field: string) => string[]
}

export default function UnifiedFilterDropdown({
  column,
  title,
  filterType,
  options = [],
  value,
  onChange,
  onClose,
  position,
  getUniqueValues
}: UnifiedFilterDropdownProps) {
  const dropdownRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLInputElement>(null)

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        onClose()
      }
    }

    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [onClose])

  // Focus input when dropdown opens
  useEffect(() => {
    if (inputRef.current && filterType === 'text') {
      inputRef.current.focus()
    }
  }, [filterType])

  const handleClear = () => {
    if (filterType === 'multi-select') {
      onChange([])
    } else {
      onChange('')
    }
    onClose()
  }

  const renderTextFilter = () => (
    <div className="space-y-3">
      <input
        ref={inputRef}
        type="text"
        placeholder={`Filter ${title.toLowerCase()}...`}
        value={value || ''}
        onChange={(e) => onChange(e.target.value)}
        className="w-full text-sm border border-gray-200 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200 bg-gray-50 hover:bg-white focus:bg-white text-black"
      />
    </div>
  )

  const renderSelectFilter = () => (
    <div className="space-y-3">
      <select
        value={value || ''}
        onChange={(e) => onChange(e.target.value)}
        className="w-full text-sm border border-gray-200 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200 bg-gray-50 hover:bg-white focus:bg-white text-black"
      >
        <option value="">All {title}</option>
        {options.map(option => (
          <option key={option} value={option}>{option}</option>
        ))}
      </select>
    </div>
  )

  const renderMultiSelectFilter = () => (
    <div className="space-y-3">
      <select
        multiple
        value={Array.isArray(value) ? value : []}
        onChange={(e) => {
          const selected = Array.from(e.target.selectedOptions, option => option.value)
          onChange(selected)
        }}
        className="w-full text-sm border border-gray-200 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200 bg-gray-50 hover:bg-white focus:bg-white min-h-[80px] text-black"
      >
        {options.map(option => (
          <option key={option} value={option}>{option}</option>
        ))}
      </select>
    </div>
  )

  const renderNumericFilter = () => (
    <div className="space-y-3">
      <div className="grid grid-cols-2 gap-2">
        <input
          type="number"
          placeholder="Min"
          value={value?.min || ''}
          onChange={(e) => onChange({ ...value, min: e.target.value })}
          className="text-sm border border-gray-200 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200 bg-gray-50 hover:bg-white focus:bg-white text-black"
        />
        <input
          type="number"
          placeholder="Max"
          value={value?.max || ''}
          onChange={(e) => onChange({ ...value, max: e.target.value })}
          className="text-sm border border-gray-200 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200 bg-gray-50 hover:bg-white focus:bg-white text-black"
        />
      </div>
    </div>
  )

  const renderDateFilter = () => (
    <div className="space-y-3">
      <div className="grid grid-cols-2 gap-2">
        <input
          type="date"
          value={value?.start || ''}
          onChange={(e) => onChange({ ...value, start: e.target.value })}
          className="text-sm border border-gray-200 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200 bg-gray-50 hover:bg-white focus:bg-white text-black"
        />
        <input
          type="date"
          value={value?.end || ''}
          onChange={(e) => onChange({ ...value, end: e.target.value })}
          className="text-sm border border-gray-200 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200 bg-gray-50 hover:bg-white focus:bg-white text-black"
        />
      </div>
    </div>
  )

  const renderFilterContent = () => {
    switch (filterType) {
      case 'text':
        return renderTextFilter()
      case 'select':
        return renderSelectFilter()
      case 'multi-select':
        return renderMultiSelectFilter()
      case 'numeric':
        return renderNumericFilter()
      case 'date':
        return renderDateFilter()
      default:
        return renderTextFilter()
    }
  }

  const hasValue = () => {
    if (filterType === 'multi-select') {
      return Array.isArray(value) && value.length > 0
    } else if (filterType === 'numeric' || filterType === 'date') {
      return value && (value.min || value.max)
    } else {
      return value && value !== ''
    }
  }

  return (
    <div
      ref={dropdownRef}
      className="fixed z-50 bg-white border border-gray-200 rounded-lg shadow-lg p-4 min-w-[250px] max-w-[320px]"
      style={{
        left: position.x,
        top: position.y,
        zIndex: 9999
      }}
    >
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-sm font-medium text-gray-900">Filter {title}</h3>
        <button
          onClick={onClose}
          className="text-gray-400 hover:text-gray-600 transition-colors"
        >
          <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      </div>

      {renderFilterContent()}

      <div className="flex items-center justify-between mt-4 pt-3 border-t border-gray-200">
        <button
          onClick={handleClear}
          className={cn(
            "text-xs px-3 py-1.5 rounded-md transition-colors",
            hasValue()
              ? "text-red-600 hover:text-red-700 hover:bg-red-50"
              : "text-gray-400 cursor-not-allowed"
          )}
          disabled={!hasValue()}
        >
          Clear
        </button>
        <button
          onClick={onClose}
          className="text-xs px-3 py-1.5 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
        >
          Apply
        </button>
      </div>
    </div>
  )
}
