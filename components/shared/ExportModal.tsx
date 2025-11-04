'use client'

import { X, Download, FileText, FileSpreadsheet, FileJson } from 'lucide-react'
import { useState } from 'react'

type GenericItem = { id: string; [key: string]: any }

interface ExportModalProps {
  isOpen: boolean
  onClose: () => void
  // Generic usage
  data?: GenericItem[]
  selectedItems?: string[]
  title?: string
  // Orders-specific legacy usage
  orders?: GenericItem[]
  selectedOrders?: string[]
  onExport?: (config: { format: 'csv' | 'json' | 'pdf'; columns: string[]; selectedOnly: boolean; includeImages: boolean }) => void
}

export default function ExportModal({ isOpen, onClose, data, selectedItems, title = 'Export', orders, selectedOrders, onExport }: ExportModalProps) {
  const [exportFormat, setExportFormat] = useState<'csv' | 'json' | 'pdf'>('csv')
  const [selectedFields, setSelectedFields] = useState<string[]>([
    'orderNumber', 'customerName', 'total', 'status', 'fulfillmentStatus', 'createdAt'
  ])
  const [isExporting, setIsExporting] = useState(false)

  const exportFields = [
    { key: 'orderNumber', label: 'Order Number', type: 'string' },
    { key: 'customerName', label: 'Customer Name', type: 'string' },
    { key: 'customerEmail', label: 'Customer Email', type: 'string' },
    { key: 'phone', label: 'Phone', type: 'string' },
    { key: 'total', label: 'Total', type: 'number' },
    { key: 'status', label: 'Status', type: 'string' },
    { key: 'fulfillmentStatus', label: 'Fulfillment Status', type: 'string' },
    { key: 'financialStatus', label: 'Financial Status', type: 'string' },
    { key: 'channel', label: 'Channel', type: 'string' },
    { key: 'deliveryMethod', label: 'Delivery Method', type: 'string' },
    { key: 'deliveryStatus', label: 'Delivery Status', type: 'string' },
    { key: 'tags', label: 'Tags', type: 'array' },
    { key: 'createdAt', label: 'Created Date', type: 'date' },
    { key: 'updatedAt', label: 'Updated Date', type: 'date' }
  ]

  const handleFieldToggle = (fieldKey: string) => {
    setSelectedFields(prev => 
      prev.includes(fieldKey) 
        ? prev.filter(f => f !== fieldKey)
        : [...prev, fieldKey]
    )
  }

  const baseItems: GenericItem[] = (orders || data || []) as GenericItem[]
  const baseSelected: string[] = (selectedOrders || selectedItems || []) as string[]

  const handleExport = async () => {
    setIsExporting(true)
    
    try {
      const dataToExport = baseSelected.length > 0 
        ? baseItems.filter(item => baseSelected.includes(String(item.id)))
        : baseItems

      if (onExport) {
        onExport({ format: exportFormat, columns: selectedFields, selectedOnly: baseSelected.length > 0, includeImages: false })
        onClose()
        return
      }

      switch (exportFormat) {
        case 'csv':
          exportToCSV(dataToExport, selectedFields)
          break
        case 'json':
          exportToJSON(dataToExport, selectedFields)
          break
        case 'pdf':
          await exportToPDF(dataToExport, selectedFields)
          break
      }
      
      onClose()
    } catch (error) {
      console.error('Export failed:', error)
    } finally {
      setIsExporting(false)
    }
  }

  const exportToCSV = (orders: GenericItem[], fields: string[]) => {
    const fieldConfigs = exportFields.filter(f => fields.includes(f.key))
    const headers = fieldConfigs.map(f => f.label)
    const csvHeader = headers.join(',')
    
    const csvRows = orders.map(order => {
      const row = fieldConfigs.map(field => {
        const value = order[field.key]
        const formattedValue = formatValue(value, field.type)
        return `"${formattedValue.replace(/"/g, '""')}"`
      })
      return row.join(',')
    })
    
    const csvContent = [csvHeader, ...csvRows].join('\n')
    downloadFile(csvContent, 'orders_export.csv', 'text/csv')
  }

  const exportToJSON = (orders: GenericItem[], fields: string[]) => {
    const fieldConfigs = exportFields.filter(f => fields.includes(f.key))
    const jsonData = orders.map(order => {
      const exportOrder: any = {}
      fieldConfigs.forEach(field => {
        exportOrder[field.label] = order[field.key]
      })
      return exportOrder
    })
    
    const jsonContent = JSON.stringify(jsonData, null, 2)
    downloadFile(jsonContent, `${String(title).toLowerCase().replace(/\s+/g,'-')}_export.json`, 'application/json')
  }

  const exportToPDF = async (_orders: GenericItem[], _fields: string[]) => {
    // PDF export implementation would go here
    // For now, just show a message
    alert('PDF export functionality will be implemented soon!')
  }

  const formatValue = (value: any, type: string): string => {
    if (value === null || value === undefined) return ''
    
    switch (type) {
      case 'date':
        return value ? new Date(value).toLocaleDateString() : ''
      case 'array':
        return Array.isArray(value) ? value.join(', ') : String(value)
      case 'number':
        return typeof value === 'number' ? value.toString() : String(value)
      default:
        return String(value)
    }
  }

  const downloadFile = (content: string, filename: string, mimeType: string) => {
    const blob = new Blob([content], { type: mimeType })
    const url = URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    link.download = filename
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
    URL.revokeObjectURL(url)
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-[9999]">
      <div className="bg-white rounded-lg shadow-xl max-w-md w-full mx-4">
        <div className="flex items-center justify-between p-6 border-b">
          <h2 className="text-lg font-semibold text-gray-900">{title}</h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600"
          >
            <X className="h-6 w-6" />
          </button>
        </div>
        
        <div className="p-6 space-y-6">
          {/* Export Format */}
          <div>
            <h3 className="text-sm font-medium text-gray-900 mb-3">Export Format</h3>
            <div className="space-y-2">
              {[
                { value: 'csv', label: 'CSV', icon: FileSpreadsheet },
                { value: 'json', label: 'JSON', icon: FileJson },
                { value: 'pdf', label: 'PDF', icon: FileText }
              ].map(({ value, label, icon: Icon }) => (
                <label key={value} className="flex items-center space-x-3 cursor-pointer">
                  <input
                    type="radio"
                    value={value}
                    checked={exportFormat === value}
                    onChange={(e) => setExportFormat(e.target.value as 'csv' | 'json' | 'pdf')}
                    className="text-blue-600 focus:ring-blue-500"
                  />
                  <Icon className="h-5 w-5 text-gray-400" />
                  <span className="text-sm text-gray-700">{label}</span>
                </label>
              ))}
            </div>
          </div>

          {/* Fields Selection */}
          <div>
            <h3 className="text-sm font-medium text-gray-900 mb-3">Fields to Export</h3>
            <div className="space-y-2 max-h-48 overflow-y-auto">
              {exportFields.map(field => (
                <label key={field.key} className="flex items-center space-x-3 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={selectedFields.includes(field.key)}
                    onChange={() => handleFieldToggle(field.key)}
                    className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                  />
                  <span className="text-sm text-gray-700">{field.label}</span>
                </label>
              ))}
            </div>
          </div>

          {/* Export Info */}
          <div className="bg-gray-50 rounded-lg p-4">
            <div className="text-sm text-gray-600">
              <p>Exporting {baseSelected.length > 0 ? baseSelected.length : baseItems.length} items</p>
              <p>Format: {exportFormat.toUpperCase()}</p>
              <p>Fields: {selectedFields.length} selected</p>
            </div>
          </div>
        </div>
        
        <div className="flex items-center justify-end space-x-3 p-6 border-t">
          <button
            onClick={onClose}
            className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
          >
            Cancel
          </button>
          <button
            onClick={handleExport}
            disabled={isExporting || selectedFields.length === 0}
            className="inline-flex items-center px-4 py-2 text-sm font-medium text-white bg-blue-600 border border-transparent rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <Download className="h-4 w-4 mr-2" />
            {isExporting ? 'Exporting...' : 'Export'}
          </button>
        </div>
      </div>
    </div>
  )
}