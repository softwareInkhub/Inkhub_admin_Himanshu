'use client'

import { useState, useMemo, useCallback, useRef } from 'react'
import { X, Search, Download, Upload, Copy, Check, ChevronDown, ChevronRight } from 'lucide-react'
import {
  ALL_JSON_FIELDS,
  VisibleField,
  ColumnConfig,
  filterFields,
  copyToClipboard,
  exportColumnConfig,
  importColumnConfig,
  DEFAULT_COLUMNS
} from '@/components/shared/utils/jsonColumnUtils'

interface ColumnManagerProps {
  isOpen: boolean
  onClose: () => void
  selectedFields: VisibleField[]
  showJsonKeys: boolean
  customLabels: Record<string, string>
  onSave: (config: ColumnConfig) => void
  onReset: () => void
}

export default function ColumnManager({
  isOpen,
  onClose,
  selectedFields,
  showJsonKeys,
  customLabels,
  onSave,
  onReset
}: ColumnManagerProps) {
  const [searchQuery, setSearchQuery] = useState('')
  const [tempSelectedFields, setTempSelectedFields] = useState<VisibleField[]>(selectedFields)
  const [tempShowJsonKeys, setTempShowJsonKeys] = useState(showJsonKeys)
  const [tempCustomLabels, setTempCustomLabels] = useState<Record<string, string>>(customLabels)
  const [copiedKey, setCopiedKey] = useState<string | null>(null)
  const [expandedCategories, setExpandedCategories] = useState<Set<string>>(new Set(['core', 'financial', 'status']))
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [importError, setImportError] = useState<string | null>(null)

  // Group fields by category
  const fieldsByCategory = useMemo(() => {
    const categories: Record<string, VisibleField[]> = {
      core: [],
      financial: [],
      status: [],
      dates: [],
      customer: [],
      shipping: [],
      billing: [],
      items: [],
      other: []
    }

    ALL_JSON_FIELDS.forEach((field: VisibleField) => {
      if (field.key.includes('customer') || field.key.includes('Customer')) {
        categories.customer.push(field)
      } else if (field.key.includes('shipping') || field.key.includes('Shipping')) {
        categories.shipping.push(field)
      } else if (field.key.includes('billing') || field.key.includes('Billing')) {
        categories.billing.push(field)
      } else if (field.key.includes('items') || field.key.includes('line_items') || field.key.includes('shipping_lines')) {
        categories.items.push(field)
      } else if (field.type === 'date' || field.key.includes('At') || field.key.includes('at')) {
        categories.dates.push(field)
      } else if (field.key.includes('Status') || field.key === 'status') {
        categories.status.push(field)
      } else if (['total', 'currency', 'totalPrice', 'price', 'amount', 'current_total_price_set'].some(k => field.key.includes(k))) {
        categories.financial.push(field)
      } else if (['orderNumber', 'id', 'phone', 'channel', 'deliveryMethod'].includes(field.key)) {
        categories.core.push(field)
      } else {
        categories.other.push(field)
      }
    })

    return categories
  }, [])

  // Filter all fields by search query
  const filteredFields = useMemo(() => {
    if (!searchQuery.trim()) return fieldsByCategory

    const filtered: Record<string, VisibleField[]> = {}
    Object.entries(fieldsByCategory).forEach(([category, fields]) => {
      const categoryFiltered = filterFields(fields, searchQuery)
      if (categoryFiltered.length > 0) {
        filtered[category] = categoryFiltered
      }
    })
    return filtered
  }, [fieldsByCategory, searchQuery])

  const selectedFieldKeys = useMemo(() => 
    new Set(tempSelectedFields.map(f => f.key)), 
    [tempSelectedFields]
  )

  const handleToggleField = useCallback((field: VisibleField) => {
    setTempSelectedFields(prev => {
      const isSelected = prev.some(f => f.key === field.key)
      if (isSelected) {
        return prev.filter(f => f.key !== field.key)
      } else {
        const next = [...prev, field]
        // ensure uniqueness by key
        const seen = new Set<string>()
        return next.filter(f => {
          if (seen.has(f.key)) return false
          seen.add(f.key)
          return true
        })
      }
    })
  }, [])

  const handleSelectAll = useCallback(() => {
    // Select all without duplicates
    const seen = new Set<string>()
    setTempSelectedFields(ALL_JSON_FIELDS.filter((f: VisibleField) => {
      if (seen.has(f.key)) return false
      seen.add(f.key)
      return true
    }))
  }, [])

  const handleDeselectAll = useCallback(() => {
    setTempSelectedFields([])
  }, [])

  const handleResetToDefault = useCallback(() => {
    const defaultFields = ALL_JSON_FIELDS.filter(field => 
      DEFAULT_COLUMNS.includes(field.key)
    )
    setTempSelectedFields(defaultFields)
    setTempShowJsonKeys(false)
    setTempCustomLabels({})
  }, [])

  const handleCopyPath = useCallback(async (path: string) => {
    const success = await copyToClipboard(path)
    if (success) {
      setCopiedKey(path)
      setTimeout(() => setCopiedKey(null), 2000)
    }
  }, [])

  const handleLabelChange = useCallback((key: string, newLabel: string) => {
    setTempCustomLabels(prev => ({
      ...prev,
      [key]: newLabel
    }))
  }, [])

  const handleSave = useCallback(() => {
    onSave({
      selectedFields: tempSelectedFields,
      showJsonKeys: tempShowJsonKeys,
      customLabels: tempCustomLabels,
      columnWidths: {}
    })
    onClose()
  }, [tempSelectedFields, tempShowJsonKeys, tempCustomLabels, onSave, onClose])

  const handleExport = useCallback(() => {
    exportColumnConfig({
      selectedFields: tempSelectedFields,
      showJsonKeys: tempShowJsonKeys,
      customLabels: tempCustomLabels,
      columnWidths: {}
    })
  }, [tempSelectedFields, tempShowJsonKeys, tempCustomLabels])

  const handleImport = useCallback(async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    setImportError(null)
    try {
      const config = await importColumnConfig(file)
      setTempSelectedFields(config.selectedFields)
      setTempShowJsonKeys(config.showJsonKeys)
      setTempCustomLabels(config.customLabels || {})
    } catch (error) {
      setImportError(error instanceof Error ? error.message : 'Failed to import configuration')
    }

    // Reset file input
    if (fileInputRef.current) {
      fileInputRef.current.value = ''
    }
  }, [])

  const toggleCategory = useCallback((category: string) => {
    setExpandedCategories(prev => {
      const next = new Set(prev)
      if (next.has(category)) {
        next.delete(category)
      } else {
        next.add(category)
      }
      return next
    })
  }, [])

  const categoryLabels: Record<string, string> = {
    core: 'Core Fields',
    financial: 'Financial Fields',
    status: 'Status Fields',
    dates: 'Date Fields',
    customer: 'Customer Fields',
    shipping: 'Shipping Address',
    billing: 'Billing Address',
    items: 'Items & Line Items',
    other: 'Other Fields'
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-2xl max-w-5xl w-full max-h-[90vh] overflow-hidden flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200 bg-gradient-to-r from-blue-50 to-indigo-50">
          <div className="flex items-center space-x-3">
            <div className="p-2 bg-blue-600 rounded-lg">
              <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 17V7m0 10a2 2 0 01-2 2H5a2 2 0 01-2-2V7a2 2 0 012-2h2a2 2 0 012 2m0 10a2 2 0 002 2h2a2 2 0 002-2M9 7a2 2 0 012-2h2a2 2 0 012 2m0 10V7m0 10a2 2 0 002 2h2a2 2 0 002-2V7a2 2 0 00-2-2h-2a2 2 0 00-2 2" />
              </svg>
            </div>
            <div>
              <h2 className="text-xl font-bold text-gray-900">Customize Columns</h2>
              <p className="text-sm text-gray-600">{tempSelectedFields.length} of {ALL_JSON_FIELDS.length} fields selected</p>
            </div>
          </div>
          <button 
            onClick={onClose}
            className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Search and Controls */}
        <div className="p-4 border-b border-gray-200 bg-gray-50 space-y-3">
          {/* Search */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
            <input
              type="text"
              placeholder="Search fields by name or JSON path..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>

          {/* Quick Actions */}
          <div className="flex flex-wrap items-center gap-2">
            <button
              onClick={handleSelectAll}
              className="px-3 py-1.5 text-xs font-medium text-blue-700 bg-blue-100 rounded-md hover:bg-blue-200 transition-colors"
            >
              Select All
            </button>
            <button
              onClick={handleDeselectAll}
              className="px-3 py-1.5 text-xs font-medium text-gray-700 bg-gray-200 rounded-md hover:bg-gray-300 transition-colors"
            >
              Deselect All
            </button>
            <button
              onClick={handleResetToDefault}
              className="px-3 py-1.5 text-xs font-medium text-purple-700 bg-purple-100 rounded-md hover:bg-purple-200 transition-colors"
            >
              Reset to Default
            </button>
            
            <div className="ml-auto flex items-center gap-2">
              <label className="flex items-center space-x-2 text-sm text-gray-700 cursor-pointer">
                <input
                  type="checkbox"
                  checked={tempShowJsonKeys}
                  onChange={(e) => setTempShowJsonKeys(e.target.checked)}
                  className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                />
                <span className="text-xs font-medium">Show JSON paths</span>
              </label>
            </div>
          </div>

          {/* Import Error */}
          {importError && (
            <div className="p-2 bg-red-50 border border-red-200 rounded-md text-xs text-red-700">
              {importError}
            </div>
          )}
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-4">
          {Object.entries(filteredFields).map(([category, fields]) => {
            const isExpanded = expandedCategories.has(category)
            const categorySelectedCount = fields.filter(f => selectedFieldKeys.has(f.key)).length

            return (
              <div key={category} className="mb-4">
                <button
                  onClick={() => toggleCategory(category)}
                  className="w-full flex items-center justify-between p-3 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors"
                >
                  <div className="flex items-center space-x-2">
                    {isExpanded ? (
                      <ChevronDown className="h-4 w-4 text-gray-600" />
                    ) : (
                      <ChevronRight className="h-4 w-4 text-gray-600" />
                    )}
                    <span className="font-semibold text-gray-900">{categoryLabels[category]}</span>
                    <span className="text-xs text-gray-600">
                      ({categorySelectedCount}/{fields.length})
                    </span>
                  </div>
                </button>

                {isExpanded && (
                  <div className="mt-2 space-y-1 pl-4">
                    {fields.map((field) => {
                      const isSelected = selectedFieldKeys.has(field.key)
                      const customLabel = tempCustomLabels[field.key]

                      return (
                        <div
                          key={field.key}
                          className={`
                            p-3 rounded-lg border transition-all
                            ${isSelected 
                              ? 'border-blue-300 bg-blue-50' 
                              : 'border-gray-200 bg-white hover:border-gray-300'
                            }
                          `}
                        >
                          <div className="flex items-start space-x-3">
                            {/* Checkbox */}
                            <input
                              type="checkbox"
                              checked={isSelected}
                              onChange={() => handleToggleField(field)}
                              className="mt-1 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                            />

                            {/* Field Info */}
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center space-x-2">
                                <span className="text-sm font-medium text-gray-900">
                                  {customLabel || field.label}
                                </span>
                                <span className={`
                                  inline-flex items-center px-2 py-0.5 rounded text-xs font-medium
                                  ${field.type === 'string' ? 'bg-green-100 text-green-800' : ''}
                                  ${field.type === 'number' ? 'bg-blue-100 text-blue-800' : ''}
                                  ${field.type === 'boolean' ? 'bg-purple-100 text-purple-800' : ''}
                                  ${field.type === 'array' ? 'bg-orange-100 text-orange-800' : ''}
                                  ${field.type === 'object' ? 'bg-gray-100 text-gray-800' : ''}
                                  ${field.type === 'date' ? 'bg-indigo-100 text-indigo-800' : ''}
                                `}>
                                  {field.type}
                                </span>
                                {field.sortable && (
                                  <span className="text-xs text-gray-500">sortable</span>
                                )}
                              </div>
                              
                              <div className="mt-1 flex items-center space-x-2">
                                <code className="text-xs font-mono text-gray-600 bg-gray-100 px-2 py-0.5 rounded">
                                  {field.path}
                                </code>
                                <button
                                  onClick={() => handleCopyPath(field.path)}
                                  className="p-1 text-gray-400 hover:text-gray-600 transition-colors"
                                  title="Copy JSON path"
                                >
                                  {copiedKey === field.path ? (
                                    <Check className="h-3 w-3 text-green-600" />
                                  ) : (
                                    <Copy className="h-3 w-3" />
                                  )}
                                </button>
                              </div>

                              {/* Custom Label Input */}
                              {isSelected && (
                                <input
                                  type="text"
                                  placeholder="Custom label (optional)"
                                  value={customLabel || ''}
                                  onChange={(e) => handleLabelChange(field.key, e.target.value)}
                                  className="mt-2 w-full px-2 py-1 text-xs border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-blue-500"
                                />
                              )}
                            </div>
                          </div>
                        </div>
                      )
                    })}
                  </div>
                )}
              </div>
            )
          })}

          {Object.keys(filteredFields).length === 0 && (
            <div className="text-center py-12">
              <Search className="h-12 w-12 text-gray-400 mx-auto mb-3" />
              <p className="text-gray-600">No fields match your search</p>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between p-4 border-t border-gray-200 bg-gray-50">
          <div className="flex items-center space-x-2">
            <button
              onClick={handleExport}
              className="inline-flex items-center space-x-1 px-3 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 transition-colors"
            >
              <Download className="h-4 w-4" />
              <span>Export</span>
            </button>
            
            <input
              ref={fileInputRef}
              type="file"
              accept=".json"
              onChange={handleImport}
              className="hidden"
            />
            <button
              onClick={() => fileInputRef.current?.click()}
              className="inline-flex items-center space-x-1 px-3 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 transition-colors"
            >
              <Upload className="h-4 w-4" />
              <span>Import</span>
            </button>
          </div>

          <div className="flex items-center space-x-2">
            <button
              onClick={onClose}
              className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 transition-colors"
            >
              Cancel
            </button>
            <button
              onClick={handleSave}
              disabled={tempSelectedFields.length === 0}
              className="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              Save Changes
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
