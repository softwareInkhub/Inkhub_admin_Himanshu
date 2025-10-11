'use client'

import { useState, useRef, useEffect } from 'react'
import { Columns, ChevronDown, Settings } from 'lucide-react'
import { VisibleField } from '../utils/jsonColumnUtils'

interface ColumnsQuickToggleProps {
  selectedFields: VisibleField[]
  onToggleField: (field: VisibleField) => void
  onOpenManager: () => void
  className?: string
}

export default function ColumnsQuickToggle({
  selectedFields,
  onToggleField,
  onOpenManager,
  className = ''
}: ColumnsQuickToggleProps) {
  const [isOpen, setIsOpen] = useState(false)
  const dropdownRef = useRef<HTMLDivElement>(null)

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false)
      }
    }

    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        setIsOpen(false)
      }
    }

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside)
      document.addEventListener('keydown', handleEscape)
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside)
      document.removeEventListener('keydown', handleEscape)
    }
  }, [isOpen])

  return (
    <div className={`relative ${className}`} ref={dropdownRef}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="inline-flex items-center space-x-2 px-3 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 transition-colors"
      >
        <Columns className="h-4 w-4" />
        <span className="hidden sm:inline">Columns</span>
        <span className="text-xs text-gray-500">({selectedFields.length})</span>
        <ChevronDown className={`h-3 w-3 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
      </button>

      {isOpen && (
        <div className="absolute right-0 mt-2 w-72 bg-white border border-gray-200 rounded-lg shadow-lg z-50 max-h-[400px] overflow-hidden flex flex-col">
          {/* Header */}
          <div className="p-3 border-b border-gray-200 bg-gray-50">
            <div className="flex items-center justify-between">
              <span className="text-sm font-semibold text-gray-900">Quick Toggle</span>
              <span className="text-xs text-gray-500">{selectedFields.length} selected</span>
            </div>
          </div>

          {/* Scrollable list */}
          <div className="flex-1 overflow-y-auto p-2">
            {selectedFields.length === 0 ? (
              <div className="text-center py-6 text-sm text-gray-500">
                No columns selected
              </div>
            ) : (
              <div className="space-y-1">
                {selectedFields.map((field) => (
                  <label
                    key={field.key}
                    className="flex items-center space-x-2 p-2 rounded hover:bg-gray-50 cursor-pointer group"
                  >
                    <input
                      type="checkbox"
                      checked={true}
                      onChange={() => onToggleField(field)}
                      className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                    />
                    <div className="flex-1 min-w-0">
                      <div className="text-sm font-medium text-gray-900 truncate">
                        {field.label}
                      </div>
                      <div className="text-xs text-gray-500 font-mono truncate">
                        {field.path}
                      </div>
                    </div>
                    <span className={`
                      text-xs px-1.5 py-0.5 rounded
                      ${field.type === 'string' ? 'bg-green-100 text-green-700' : ''}
                      ${field.type === 'number' ? 'bg-blue-100 text-blue-700' : ''}
                      ${field.type === 'boolean' ? 'bg-purple-100 text-purple-700' : ''}
                      ${field.type === 'array' ? 'bg-orange-100 text-orange-700' : ''}
                      ${field.type === 'date' ? 'bg-indigo-100 text-indigo-700' : ''}
                    `}>
                      {field.type}
                    </span>
                  </label>
                ))}
              </div>
            )}
          </div>

          {/* Footer */}
          <div className="p-3 border-t border-gray-200 bg-gray-50">
            <button
              onClick={() => {
                onOpenManager()
                setIsOpen(false)
              }}
              className="w-full inline-flex items-center justify-center space-x-2 px-3 py-2 text-sm font-medium text-blue-700 bg-blue-50 rounded-md hover:bg-blue-100 transition-colors"
            >
              <Settings className="h-4 w-4" />
              <span>Customize All Columns</span>
            </button>
          </div>
        </div>
      )}
    </div>
  )
}

