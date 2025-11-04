'use client'

import { useEffect, useRef, useState } from 'react'
import { cn } from '@/lib/utils'

interface OrderFilterDropdownProps {
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

export default function OrderFilterDropdown({
  column,
  title,
  filterType,
  options = [],
  value,
  onChange,
  onClose,
  position,
  getUniqueValues
}: OrderFilterDropdownProps) {
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
    <div className="space-y-4">
      <div className="text-sm font-semibold text-black mb-2">FILTER OPTIONS:</div>
      <div className="grid grid-cols-2 gap-2">
        <button
          onClick={() => onChange('>1000')}
          className="text-sm px-3 py-2 bg-gradient-to-r from-gray-50 to-gray-100 hover:from-blue-50 hover:to-indigo-50 rounded-lg border border-gray-200 hover:border-blue-300 transition-all duration-200 hover:shadow-sm text-black"
        >
          &gt;1000
        </button>
        <button
          onClick={() => onChange('>5000')}
          className="text-sm px-3 py-2 bg-gradient-to-r from-gray-50 to-gray-100 hover:from-blue-50 hover:to-indigo-50 rounded-lg border border-gray-200 hover:border-blue-300 transition-all duration-200 hover:shadow-sm text-black"
        >
          &gt;5000
        </button>
        <button
          onClick={() => onChange('<1000')}
          className="text-sm px-3 py-2 bg-gradient-to-r from-gray-50 to-gray-100 hover:from-blue-50 hover:to-indigo-50 rounded-lg border border-gray-200 hover:border-blue-300 transition-all duration-200 hover:shadow-sm text-black"
        >
          &lt;1000
        </button>
        <button
          onClick={() => onChange('<5000')}
          className="text-sm px-3 py-2 bg-gradient-to-r from-gray-50 to-gray-100 hover:from-blue-50 hover:to-indigo-50 rounded-lg border border-gray-200 hover:border-blue-300 transition-all duration-200 hover:shadow-sm text-black"
        >
          &lt;5000
        </button>
      </div>
      <input
        type="text"
        placeholder={`Custom filter (e.g., >1000, <5000, =2000)`}
        value={value || ''}
        onChange={(e) => onChange(e.target.value)}
        className="w-full text-sm border border-gray-200 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200 bg-gray-50 hover:bg-white focus:bg-white text-black"
      />
    </div>
  )

  const renderDateFilter = () => (
    <div className="space-y-4">
      <div className="text-sm font-semibold text-black mb-2">FILTER OPTIONS:</div>
      <div className="grid grid-cols-2 gap-2">
        <button
          onClick={() => {
            const today = new Date().toISOString().split('T')[0]
            onChange(today)
          }}
          className="text-sm px-3 py-2 bg-gradient-to-r from-gray-50 to-gray-100 hover:from-blue-50 hover:to-indigo-50 rounded-lg border border-gray-200 hover:border-blue-300 transition-all duration-200 hover:shadow-sm text-black"
        >
          Today
        </button>
        <button
          onClick={() => {
            const yesterday = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString().split('T')[0]
            onChange(yesterday)
          }}
          className="text-sm px-3 py-2 bg-gradient-to-r from-gray-50 to-gray-100 hover:from-blue-50 hover:to-indigo-50 rounded-lg border border-gray-200 hover:border-blue-300 transition-all duration-200 hover:shadow-sm text-black"
        >
          Yesterday
        </button>
        <button
          onClick={() => {
            const lastWeek = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]
            onChange(lastWeek)
          }}
          className="text-sm px-3 py-2 bg-gradient-to-r from-gray-50 to-gray-100 hover:from-blue-50 hover:to-indigo-50 rounded-lg border border-gray-200 hover:border-blue-300 transition-all duration-200 hover:shadow-sm text-black"
        >
          Last Week
        </button>
        <button
          onClick={() => {
            const lastMonth = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]
            onChange(lastMonth)
          }}
          className="text-sm px-3 py-2 bg-gradient-to-r from-gray-50 to-gray-100 hover:from-blue-50 hover:to-indigo-50 rounded-lg border border-gray-200 hover:border-blue-300 transition-all duration-200 hover:shadow-sm text-black"
        >
          Last Month
        </button>
        <button
          onClick={() => {
            const thisYear = new Date().getFullYear().toString() + '-01-01'
            onChange(thisYear)
          }}
          className="text-sm px-3 py-2 bg-gradient-to-r from-gray-50 to-gray-100 hover:from-blue-50 hover:to-indigo-50 rounded-lg border border-gray-200 hover:border-blue-300 transition-all duration-200 hover:shadow-sm text-black"
        >
          This Year
        </button>
        <button
          onClick={() => {
            const lastYear = (new Date().getFullYear() - 1).toString() + '-01-01'
            onChange(lastYear)
          }}
          className="text-sm px-3 py-2 bg-gradient-to-r from-gray-50 to-gray-100 hover:from-blue-50 hover:to-indigo-50 rounded-lg border border-gray-200 hover:border-blue-300 transition-all duration-200 hover:shadow-sm text-black"
        >
          Last Year
        </button>
      </div>
      <input
        type="date"
        value={value || ''}
        onChange={(e) => onChange(e.target.value)}
        className="w-full text-sm border border-gray-200 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200 bg-gray-50 hover:bg-white focus:bg-white text-black"
      />
      <div className="text-xs text-gray-500 mt-1">
        Format: YYYY-MM-DD (e.g., 2024-06-11)
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

  return (
    <div
      ref={dropdownRef}
      className="fixed bg-white border border-gray-200 rounded-xl shadow-xl backdrop-blur-sm z-[999999]"
      style={{
        left: position.x,
        top: position.y,
        minWidth: '220px',
        maxWidth: '320px',
        maxHeight: '320px',
        overflowY: 'auto',
        transform: 'translateZ(0)',
        boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.08), 0 10px 10px -5px rgba(0, 0, 0, 0.04), 0 0 0 1px rgba(255, 255, 255, 0.05)'
      }}
    >
      <div className="p-4">
        {renderFilterContent()}
        
        <div className="mt-4 pt-3 border-t border-gray-100">
          <button
            onClick={handleClear}
            className="text-sm text-black hover:text-gray-700 hover:bg-gray-50 px-2 py-1 rounded-md transition-all duration-200"
          >
            Clear
          </button>
        </div>
      </div>
    </div>
  )
}