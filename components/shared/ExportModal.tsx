'use client'

import { X, Download, FileText, FileSpreadsheet, FileJson, Image as ImageIcon } from 'lucide-react'
import { useEffect, useMemo, useState } from 'react'

type GenericItem = { id: string; [key: string]: any }
export type FieldType = 'string' | 'number' | 'date' | 'array' | 'object' | 'image' | 'boolean'

export interface ExportFieldConfig {
  key: string
  label: string
  type?: FieldType
}

export type ExportRequestConfig = {
  format: 'csv' | 'json' | 'pdf'
  columns: string[]
  selectedOnly: boolean
  includeImages: boolean
}

interface ExportModalProps {
  isOpen: boolean
  onClose: () => void
  // Generic usage
  data?: GenericItem[]
  selectedItems?: string[]
  title?: string
  columnsConfig?: ExportFieldConfig[]
  defaultSelectedFields?: string[]
  includeImagesOption?: boolean
  // Legacy usage
  orders?: GenericItem[]
  selectedOrders?: string[]
  onExport?: (config: ExportRequestConfig) => void
}

const DEFAULT_EXPORT_FIELDS: ExportFieldConfig[] = [
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

const DEFAULT_SELECTED_FIELDS = DEFAULT_EXPORT_FIELDS.slice(0, 6).map(field => field.key)

function sanitizeDefaultSelection(fieldConfigs: ExportFieldConfig[], defaults?: string[]): string[] {
  const availableKeys = new Set(fieldConfigs.map(field => field.key))
  const provided = (defaults && defaults.length ? defaults : DEFAULT_SELECTED_FIELDS).filter(key => availableKeys.has(key))
  if (provided.length > 0) return provided
  return fieldConfigs.length > 0 ? [fieldConfigs[0].key] : []
}

export default function ExportModal({
  isOpen,
  onClose,
  data,
  selectedItems,
  title = 'Export',
  columnsConfig,
  defaultSelectedFields,
  includeImagesOption = false,
  orders,
  selectedOrders,
  onExport
}: ExportModalProps) {
  const [exportFormat, setExportFormat] = useState<'csv' | 'json' | 'pdf'>('csv')
  const [isExporting, setIsExporting] = useState(false)

  const fieldConfigs = columnsConfig && columnsConfig.length > 0 ? columnsConfig : DEFAULT_EXPORT_FIELDS
  const normalizedDefaultFields = useMemo(
    () => sanitizeDefaultSelection(fieldConfigs, defaultSelectedFields),
    [fieldConfigs, defaultSelectedFields]
  )
  const [selectedFields, setSelectedFields] = useState<string[]>(normalizedDefaultFields)
  const [includeImages, setIncludeImages] = useState(includeImagesOption)

  useEffect(() => {
    setSelectedFields(normalizedDefaultFields)
  }, [normalizedDefaultFields, isOpen])

  useEffect(() => {
    setIncludeImages(includeImagesOption)
  }, [includeImagesOption, isOpen])

  const handleFieldToggle = (fieldKey: string) => {
    setSelectedFields(prev => 
      prev.includes(fieldKey) 
        ? prev.filter(f => f !== fieldKey)
        : [...prev, fieldKey]
    )
  }

  const baseItems: GenericItem[] = useMemo(() => {
    if (Array.isArray(data) && data.length > 0) return data
    if (Array.isArray(orders) && orders.length > 0) return orders
    return []
  }, [data, orders])

  const baseSelected: string[] = useMemo(() => {
    if (Array.isArray(selectedItems)) return selectedItems
    if (Array.isArray(selectedOrders)) return selectedOrders
    return []
  }, [selectedItems, selectedOrders])

  const handleExport = async () => {
    setIsExporting(true)
    
    try {
      const dataToExport = baseSelected.length > 0 
        ? baseItems.filter(item => baseSelected.includes(String(item.id)))
        : baseItems

      if (onExport) {
        onExport({
          format: exportFormat,
          columns: selectedFields,
          selectedOnly: baseSelected.length > 0,
          includeImages: includeImagesOption ? includeImages : false
        })
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

  const exportToCSV = (items: GenericItem[], fields: string[]) => {
    const activeFields = fieldConfigs.filter(f => fields.includes(f.key))
    const headers = activeFields.map(f => f.label)
    const csvHeader = headers.join(',')
    
    const csvRows = items.map(item => {
      const row = activeFields.map(field => {
        const value = item[field.key]
        const formattedValue = formatValue(value, field.type || 'string')
        return `"${formattedValue.replace(/"/g, '""')}"`
      })
      return row.join(',')
    })
    
    const csvContent = [csvHeader, ...csvRows].join('\n')
    downloadFile(csvContent, `${sanitizedFileName(title)}.csv`, 'text/csv')
  }

  const exportToJSON = (items: GenericItem[], fields: string[]) => {
    const activeFields = fieldConfigs.filter(f => fields.includes(f.key))
    const jsonData = items.map(item => {
      const exportOrder: any = {}
      activeFields.forEach(field => {
        exportOrder[field.label] = item[field.key]
      })
      return exportOrder
    })
    
    const jsonContent = JSON.stringify(jsonData, null, 2)
    downloadFile(jsonContent, `${sanitizedFileName(title)}.json`, 'application/json')
  }

  const exportToPDF = async (_orders: GenericItem[], _fields: string[]) => {
    // PDF export implementation would go here
    // For now, just show a message
    alert('PDF export functionality will be implemented soon!')
  }

  const formatValue = (value: any, type: FieldType): string => {
    if (value === null || value === undefined) return ''
    
    switch (type) {
      case 'date':
        return value ? new Date(value).toLocaleDateString() : ''
      case 'array':
        return Array.isArray(value) ? value.join(', ') : String(value)
      case 'number':
        return typeof value === 'number' ? value.toString() : String(value)
      case 'boolean':
        return typeof value === 'boolean' ? (value ? 'Yes' : 'No') : String(value)
      default:
        return String(value)
    }
  }

  const sanitizedFileName = (name: string) => {
    if (!name) return 'export'
    return `${name.toLowerCase().replace(/\s+/g, '-')}_export`
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
      <div className="bg-white rounded-lg shadow-xl max-w-sm w-full mx-4">
        <div className="flex items-center justify-between p-4 border-b">
          <h2 className="text-base font-semibold text-gray-900">{title}</h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600"
          >
            <X className="h-6 w-6" />
          </button>
        </div>
        
        <div className="p-4 space-y-4">
          {/* Export Format */}
          <div>
            <h3 className="text-sm font-medium text-gray-900 mb-2">Export Format</h3>
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
            <h3 className="text-sm font-medium text-gray-900 mb-2">Fields to Export</h3>
            <div className="space-y-1.5 max-h-40 overflow-y-auto">
              {fieldConfigs.map(field => (
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

          {includeImagesOption && (
            <div className="flex items-center justify-between rounded-md border p-3">
              <div className="flex items-center space-x-2">
                <ImageIcon className="h-4 w-4 text-gray-500" />
                <div>
                  <p className="text-sm font-medium text-gray-900">Include product images</p>
                  <p className="text-xs text-gray-500">Embed the primary image when exporting (PDF/JSON compatible)</p>
                </div>
              </div>
              <label className="relative inline-flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  className="sr-only peer"
                  checked={includeImages}
                  onChange={(e) => setIncludeImages(e.target.checked)}
                />
                <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600" />
              </label>
            </div>
          )}

          {/* Export Info */}
          <div className="bg-gray-50 rounded-lg p-3">
            <div className="text-xs text-gray-600">
              <p>Exporting {baseSelected.length > 0 ? baseSelected.length : baseItems.length} items</p>
              <p>Format: {exportFormat.toUpperCase()}</p>
              <p>Fields: {selectedFields.length} selected</p>
            </div>
          </div>
        </div>
        
        <div className="flex items-center justify-end space-x-2 p-4 border-t">
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