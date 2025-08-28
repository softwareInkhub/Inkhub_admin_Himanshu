'use client'

import { useState } from 'react'
import { X, Download, FileText, FileJson, FileType } from 'lucide-react'
import { Product } from '../types'
import { exportProducts, EXPORT_FIELDS, ExportFormat } from '../utils/exportUtils'

interface ExportModalProps {
  isOpen: boolean
  onClose: () => void
  products: Product[]
  selectedProducts: string[]
}

export default function ExportModal({ isOpen, onClose, products, selectedProducts }: ExportModalProps) {
  const [exportFormat, setExportFormat] = useState<ExportFormat>('csv')
  const [selectedFields, setSelectedFields] = useState<string[]>([
    'id', 'title', 'images', 'vendor', 'price', 'status', 'inventoryQuantity', 'tags', 'createdAt'
  ])
  const [isExporting, setIsExporting] = useState(false)

  if (!isOpen) return null

  // Determine which products to export
  const productsToExport = selectedProducts.length > 0 
    ? products.filter(p => selectedProducts.includes(p.id))
    : products

  const handleFieldToggle = (fieldKey: string) => {
    setSelectedFields(prev => 
      prev.includes(fieldKey)
        ? prev.filter(f => f !== fieldKey)
        : [...prev, fieldKey]
    )
  }

  const handleSelectAllFields = () => {
    setSelectedFields(EXPORT_FIELDS.map(f => f.key))
  }

  const handleDeselectAllFields = () => {
    setSelectedFields([])
  }

  const handleExport = async () => {
    if (selectedFields.length === 0) {
      alert('Please select at least one field to export.')
      return
    }

    setIsExporting(true)
    try {
      await exportProducts(productsToExport, exportFormat, selectedFields)
      onClose()
    } catch (error) {
      console.error('Export failed:', error)
    } finally {
      setIsExporting(false)
    }
  }

  const formatOptions = [
    { value: 'csv' as ExportFormat, label: 'CSV', icon: FileText, description: 'Comma-separated values file' },
    { value: 'json' as ExportFormat, label: 'JSON', icon: FileJson, description: 'JavaScript Object Notation' },
    { value: 'pdf' as ExportFormat, label: 'PDF', icon: FileType, description: 'Portable Document Format with images & layout' }
  ]

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full mx-4 max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <div className="flex items-center space-x-3">
            <div className="p-2 bg-blue-100 rounded-lg">
              <Download className="h-5 w-5 text-blue-600" />
            </div>
            <div>
              <h2 className="text-lg font-semibold text-gray-900">Export Products</h2>
              <p className="text-sm text-gray-500">
                Export {selectedProducts.length > 0 ? `${selectedProducts.length} selected` : 'all'} products
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="p-6 space-y-6">
          {/* Format Selection */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-3">
              Export Format
            </label>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              {formatOptions.map((option) => {
                const Icon = option.icon
                return (
                  <button
                    key={option.value}
                    onClick={() => setExportFormat(option.value)}
                    className={`p-4 border rounded-lg text-left transition-all duration-200 ${
                      exportFormat === option.value
                        ? 'border-blue-500 bg-blue-50 text-blue-700'
                        : 'border-gray-200 hover:border-gray-300 hover:bg-gray-50'
                    }`}
                  >
                    <div className="flex items-center space-x-3">
                      {Icon && <Icon className="h-5 w-5" />}
                      <div>
                        <div className="font-medium">{option.label}</div>
                        <div className="text-xs text-gray-500">{option.description}</div>
                      </div>
                    </div>
                  </button>
                )
              })}
            </div>
          </div>

          {/* Field Selection */}
          <div>
            <div className="flex items-center justify-between mb-3">
              <label className="block text-sm font-medium text-gray-700">
                Data Fields ({selectedFields.length}/{EXPORT_FIELDS.length} selected)
              </label>
              <div className="flex space-x-2">
                <button
                  onClick={handleSelectAllFields}
                  className="text-xs px-2 py-1 bg-blue-100 text-blue-700 rounded hover:bg-blue-200"
                >
                  Select All
                </button>
                <button
                  onClick={handleDeselectAllFields}
                  className="text-xs px-2 py-1 bg-gray-100 text-gray-700 rounded hover:bg-gray-200"
                >
                  Deselect All
                </button>
              </div>
            </div>
            
            <div className="border border-gray-200 rounded-lg max-h-64 overflow-y-auto">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-2 p-3">
                {EXPORT_FIELDS.map((field) => (
                  <label
                    key={field.key}
                    className="flex items-center space-x-2 p-2 hover:bg-gray-50 rounded cursor-pointer"
                  >
                    <input
                      type="checkbox"
                      checked={selectedFields.includes(field.key)}
                      onChange={() => handleFieldToggle(field.key)}
                      className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                    />
                    <div className="flex-1 min-w-0">
                      <div className="text-sm font-medium text-gray-900 truncate">
                        {field.label}
                      </div>
                      <div className="text-xs text-gray-500 capitalize">
                        {field.type}
                      </div>
                    </div>
                  </label>
                ))}
              </div>
            </div>
          </div>

          {/* Export Summary */}
          <div className="bg-gray-50 rounded-lg p-4">
            <h3 className="text-sm font-medium text-gray-900 mb-2">Export Summary</h3>
            <div className="space-y-1 text-sm text-gray-600">
              <div>• Products to export: {productsToExport.length}</div>
              <div>• Format: {formatOptions.find(f => f.value === exportFormat)?.label}</div>
              <div>• Fields: {selectedFields.length} selected</div>
              <div>• File name: products_export_{new Date().toISOString().split('T')[0]}.{exportFormat}</div>
              {exportFormat === 'pdf' && selectedFields.includes('images') && (
                <div className="mt-2 p-2 bg-blue-50 border border-blue-200 rounded text-xs text-blue-700">
                  📸 PDF will include product images with optimized layout for better readability
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-end space-x-3 p-6 border-t border-gray-200">
          <button
            onClick={onClose}
            className="px-4 py-2 text-gray-700 bg-gray-100 rounded-md hover:bg-gray-200 transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={handleExport}
            disabled={isExporting || selectedFields.length === 0}
            className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center space-x-2"
          >
            {isExporting ? (
              <>
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                <span>Exporting...</span>
              </>
            ) : (
              <>
                <Download className="h-4 w-4" />
                <span>Export</span>
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  )
}
