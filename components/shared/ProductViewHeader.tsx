'use client'

import { ChevronDown, Edit, Trash2, Download, Filter } from 'lucide-react'
import { cn } from '@/lib/utils'
import { useEffect, useRef } from 'react'

interface ProductViewHeaderProps {
  viewMode: 'table' | 'grid' | 'card'
  selectedProducts: string[]
  currentProducts: Product[]
  onSelectAll: () => void
  activeColumnFilter: string | null
  columnFilters: Record<string, any>
  onFilterClick: (column: string) => void
  onColumnFilterChange: (column: string, value: any) => void
  getUniqueValues: (field: string) => string[]
  onBulkEdit?: () => void
  onBulkDelete?: () => void
  onExportSelected?: () => void
}

interface Product {
  id: string
  title: string
  handle: string
  vendor: string
  productType: string
  price: number
  compareAtPrice?: number
  cost: number
  inventoryQuantity: number
  status: 'active' | 'draft' | 'archived'
  publishedAt?: string
  createdAt: string
  updatedAt: string
  tags: string[]
  images: string[]
  variants: ProductVariant[]
  collections: string[]
  selected?: boolean
  salesChannels?: number
  category?: string
}

interface ProductVariant {
  id: string
  title: string
  price: number
  compareAtPrice?: number
  inventoryQuantity: number
  sku: string
  barcode?: string
  weight?: number
  weightUnit: string
}

export default function ProductViewHeader({
  viewMode,
  selectedProducts,
  currentProducts,
  onSelectAll,
  activeColumnFilter,
  columnFilters,
  onFilterClick,
  onColumnFilterChange,
  getUniqueValues,
  onBulkEdit,
  onBulkDelete,
  onExportSelected
}: ProductViewHeaderProps) {
  const dropdownRefs = useRef<Record<string, HTMLDivElement | null>>({})

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as HTMLElement
      if (!target.closest('.column-filter-dropdown')) {
        onFilterClick('')
      }
    }

    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [onFilterClick])

  const columns = [
    { key: 'product', title: 'PRODUCT', width: 'w-64', filterType: 'text' },
    { key: 'status', title: 'STATUS', width: 'w-24', filterType: 'select', options: ['active', 'draft', 'archived'] },
    { key: 'inventory', title: 'INVENTORY', width: 'w-24', filterType: 'text' },
    { key: 'price', title: 'PRICE', width: 'w-24', filterType: 'text' },
    { key: 'type', title: 'TYPE', width: 'w-24', filterType: 'multi-select', options: getUniqueValues('productType') },
    { key: 'vendor', title: 'VENDOR', width: 'w-32', filterType: 'multi-select', options: getUniqueValues('vendor') },
    { key: 'category', title: 'CATEGORY', width: 'w-32', filterType: 'multi-select', options: getUniqueValues('category') },
    { key: 'created', title: 'CREATED', width: 'w-24', filterType: 'date' },
    { key: 'updated', title: 'UPDATED', width: 'w-24', filterType: 'date' }
  ]

  const getColumnClass = (column: any) => {
    if (viewMode === 'table') {
      return 'px-2 py-1.5 text-left text-xs font-medium text-gray-500 uppercase tracking-wider'
    } else if (viewMode === 'grid') {
      return 'px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider'
    } else { // card view
      return 'px-2 py-1.5 text-center text-xs font-medium text-gray-500 uppercase tracking-wider'
    }
  }

  const getContainerClass = () => {
    if (viewMode === 'table') {
      return 'bg-gray-50 relative'
    } else if (viewMode === 'grid') {
      return 'bg-gray-50 border-b border-gray-200'
    } else { // card view
      return 'bg-gray-50 border-b border-gray-200'
    }
  }

  const handleFilterClick = (column: string, event: React.MouseEvent) => {
    event.stopPropagation()
    onFilterClick(column)
  }

  const handleFilterChange = (column: string, value: any) => {
    onColumnFilterChange(column, value)
  }

  const handleClearFilter = (column: string) => {
    const columnConfig = columns.find(col => col.key === column)
    if (columnConfig) {
      if (columnConfig.filterType === 'text' || columnConfig.filterType === 'date') {
        onColumnFilterChange(column, '')
      } else {
        onColumnFilterChange(column, [])
      }
    }
    onFilterClick(column)
  }

  const isFilterActive = (column: string) => {
    const value = columnFilters[column]
    if (Array.isArray(value)) {
      return value.length > 0
    }
    return value && value !== ''
  }

  return (
    <div className={getContainerClass()}>
      {viewMode === 'table' ? (
        <table className="min-w-full divide-y divide-gray-200">
          <thead>
            <tr>
              <th className="px-2 py-1.5 text-left relative">
                <input
                  type="checkbox"
                  checked={selectedProducts.length === currentProducts.length && currentProducts.length > 0}
                  onChange={onSelectAll}
                  className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                />
              </th>
              {columns.map((column) => (
                <th key={column.key} className={getColumnClass(column)}>
                  <div className="flex items-center justify-between">
                    <span>{column.title}</span>
                    <button
                      onClick={(e) => handleFilterClick(column.key, e)}
                      className={cn(
                        "ml-1 text-gray-400 hover:text-gray-600 transition-colors",
                        (activeColumnFilter === column.key || isFilterActive(column.key)) && "text-blue-600"
                      )}
                    >
                      <ChevronDown className="h-3 w-3" />
                    </button>
                  </div>
                </th>
              ))}
            </tr>
          </thead>
        </table>
      ) : (
        <div className="px-4 py-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-6">
              <div className="flex items-center space-x-2">
                <input
                  type="checkbox"
                  checked={selectedProducts.length === currentProducts.length && currentProducts.length > 0}
                  onChange={onSelectAll}
                  className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                />
                <span className="text-xs font-medium text-gray-500 uppercase tracking-wider">
                  PRODUCT
                </span>
              </div>
              {columns.slice(1).map((column) => (
                <div key={column.key} className="flex items-center space-x-1 relative">
                  <span className="text-xs font-medium text-gray-500 uppercase tracking-wider">
                    {column.title}
                  </span>
                  <div className="relative">
                    <button
                      onClick={(e) => handleFilterClick(column.key, e)}
                      className={cn(
                        "text-gray-400 hover:text-gray-600 transition-colors",
                        (activeColumnFilter === column.key || isFilterActive(column.key)) && "text-blue-600"
                      )}
                    >
                      <Filter className="h-3 w-3" />
                    </button>
                    
                    {/* Filter Dropdown */}
                    {activeColumnFilter === column.key && (
                      <div 
                        ref={(el) => { dropdownRefs.current[column.key] = el }}
                        className="absolute top-full left-0 mt-1 w-48 bg-white border border-gray-200 rounded-md shadow-lg z-[9999] column-filter-dropdown"
                        style={{
                          position: 'absolute',
                          zIndex: 9999,
                          maxHeight: '300px',
                          overflowY: 'auto',
                          transform: 'translateZ(0)',
                          boxShadow: '0 10px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)'
                        }}
                      >
                        <div className="p-2">
                          {column.filterType === 'text' && (
                            <input
                              type="text"
                              placeholder={`Filter ${column.title.toLowerCase()}...`}
                              value={columnFilters[column.key] as string || ''}
                              onChange={(e) => handleFilterChange(column.key, e.target.value)}
                              className="w-full text-xs border border-gray-300 rounded px-2 py-1 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                              autoFocus
                            />
                          )}
                          
                          {column.filterType === 'select' && (
                            <select
                              value={columnFilters[column.key] as string || ''}
                              onChange={(e) => handleFilterChange(column.key, e.target.value)}
                              className="w-full text-xs border border-gray-300 rounded px-2 py-1 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                            >
                              <option value="">All {column.title}</option>
                              {column.options?.map(option => (
                                <option key={option} value={option}>{option}</option>
                              ))}
                            </select>
                          )}
                          
                          {column.filterType === 'multi-select' && (
                            <select
                              multiple
                              value={columnFilters[column.key] as string[] || []}
                              onChange={(e) => {
                                const selected = Array.from(e.target.selectedOptions, option => option.value)
                                handleFilterChange(column.key, selected)
                              }}
                              className="w-full text-xs border border-gray-300 rounded px-2 py-1 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                            >
                              {column.options?.map(option => (
                                <option key={option} value={option}>{option}</option>
                              ))}
                            </select>
                          )}
                          
                          {column.filterType === 'date' && (
                            <input
                              type="date"
                              value={columnFilters[column.key] as string || ''}
                              onChange={(e) => handleFilterChange(column.key, e.target.value)}
                              className="w-full text-xs border border-gray-300 rounded px-2 py-1 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                            />
                          )}
                          
                          <div className="mt-2 pt-2 border-t border-gray-200">
                            <button
                              onClick={() => handleClearFilter(column.key)}
                              className="text-xs text-gray-500 hover:text-gray-700"
                            >
                              Clear
                            </button>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
            <div className="flex items-center space-x-2">
              <span className="text-xs font-medium text-gray-500 uppercase tracking-wider">
                ACTIONS
              </span>
              {selectedProducts.length > 0 && (
                <div className="flex items-center space-x-1 ml-2">
                  <button
                    onClick={onBulkEdit}
                    className="p-1 text-blue-600 hover:text-blue-800 hover:bg-blue-50 rounded text-xs"
                    title="Bulk Edit"
                  >
                    <Edit className="h-3 w-3" />
                  </button>
                  <button
                    onClick={onExportSelected}
                    className="p-1 text-green-600 hover:text-green-800 hover:bg-green-50 rounded text-xs"
                    title="Export Selected"
                  >
                    <Download className="h-3 w-3" />
                  </button>
                  <button
                    onClick={onBulkDelete}
                    className="p-1 text-red-600 hover:text-red-800 hover:bg-red-50 rounded text-xs"
                    title="Bulk Delete"
                  >
                    <Trash2 className="h-3 w-3" />
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}