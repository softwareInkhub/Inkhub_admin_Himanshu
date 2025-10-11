'use client'

import { ChevronDown, Edit, Trash2, Download, Filter } from 'lucide-react'
import { cn } from '@/lib/utils'
import { useEffect, useRef } from 'react'
import { Order } from '../types'

interface OrderViewHeaderProps {
  viewMode: 'table' | 'grid' | 'card'
  selectedOrders: string[]
  currentOrders: Order[]
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

export default function OrderViewHeader({
  viewMode,
  selectedOrders,
  currentOrders,
  onSelectAll,
  activeColumnFilter,
  columnFilters,
  onFilterClick,
  onColumnFilterChange,
  getUniqueValues,
  onBulkEdit,
  onBulkDelete,
  onExportSelected
}: OrderViewHeaderProps) {
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
    { key: 'order', title: 'ORDER', width: 'w-32', filterType: 'text' },
    { key: 'customer', title: 'CUSTOMER', width: 'w-40', filterType: 'text' },
    { key: 'fulfillmentStatus', title: 'FULFILLMENT STATUS', width: 'w-32', filterType: 'select', options: ['unfulfilled', 'fulfilled', 'partial'] },
    { key: 'total', title: 'TOTAL', width: 'w-24', filterType: 'numeric' },
    { key: 'createdAt', title: 'DATE', width: 'w-24', filterType: 'date' },
    { key: 'items', title: 'ITEMS', width: 'w-20', filterType: 'text' },
    { key: 'deliveryStatus', title: 'DELIVERY STATUS', width: 'w-32', filterType: 'text' },
    { key: 'tags', title: 'TAGS', width: 'w-32', filterType: 'multi-select', options: getUniqueValues('tags') },
    { key: 'channel', title: 'CHANNEL', width: 'w-40', filterType: 'multi-select', options: getUniqueValues('channel') },
    { key: 'deliveryMethod', title: 'DELIVERY METHOD', width: 'w-40', filterType: 'multi-select', options: getUniqueValues('deliveryMethod') },
    { key: 'financialStatus', title: 'PAYMENT STATUS', width: 'w-32', filterType: 'select', options: ['paid', 'pending', 'partially_paid', 'partially_refunded', 'refunded', 'voided', 'authorized'] }
  ]

  const getColumnClass = (column: any) => {
    if (viewMode === 'table') {
      return column.width
    }
    return 'w-full'
  }

  const renderFilterDropdown = (column: any) => {
    if (activeColumnFilter !== column.key || !column.filterType) return null

    const filterType = column.filterType
    const options = column.options || []

    return (
      <div className="absolute top-full left-0 mt-2 w-48 bg-white border border-gray-200 rounded-xl shadow-xl z-[9999] column-filter-dropdown backdrop-blur-sm"
        style={{
          position: 'absolute',
          zIndex: 9999,
          maxHeight: '320px',
          overflowY: 'auto',
          transform: 'translateZ(0)',
          boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.08), 0 10px 10px -5px rgba(0, 0, 0, 0.04), 0 0 0 1px rgba(255, 255, 255, 0.05)',
          minWidth: '220px',
          maxWidth: '320px'
        }}>
        <div className="p-4">
          {filterType === 'text' && (
            <div className="space-y-3">
              <input
                type="text"
                placeholder={`Filter ${column.title.toLowerCase()}...`}
                value={columnFilters[column.key] as string || ''}
                onChange={(e) => onColumnFilterChange(column.key, e.target.value)}
                className="w-full text-sm border border-gray-200 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200 bg-gray-50 hover:bg-white focus:bg-white text-black"
                autoFocus
              />
            </div>
          )}
          
          {filterType === 'select' && (
            <div className="space-y-3">
              <select
                value={columnFilters[column.key] as string || ''}
                onChange={(e) => onColumnFilterChange(column.key, e.target.value)}
                className="w-full text-sm border border-gray-200 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200 bg-gray-50 hover:bg-white focus:bg-white text-black"
              >
                <option value="">All {column.title.toLowerCase()}</option>
                {options.map((option: string) => (
                  <option key={option} value={option}>{option}</option>
                ))}
              </select>
            </div>
          )}
          
          {filterType === 'multi-select' && (
            <div className="space-y-3">
              <select
                multiple
                value={columnFilters[column.key] as string[] || []}
                onChange={(e) => {
                  const selected = Array.from(e.target.selectedOptions, option => option.value)
                  onColumnFilterChange(column.key, selected)
                }}
                className="w-full text-sm border border-gray-200 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200 bg-gray-50 hover:bg-white focus:bg-white min-h-[80px] text-black"
              >
                {options.map((option: string) => (
                  <option key={option} value={option}>{option}</option>
                ))}
              </select>
            </div>
          )}
          
          {filterType === 'numeric' && (
            <div className="space-y-4">
              <div className="text-sm font-semibold text-black mb-2">FILTER OPTIONS:</div>
              <div className="grid grid-cols-2 gap-2">
                <button
                  onClick={() => onColumnFilterChange(column.key, { min: '0', max: '100' })}
                  className="text-xs px-2 py-1 bg-gradient-to-r from-green-50 to-green-100 border border-green-200 rounded-md hover:from-green-100 hover:to-green-200 transition-all duration-200 text-green-700 font-medium"
                >
                  Under ₹100
                </button>
                <button
                  onClick={() => onColumnFilterChange(column.key, { min: '100', max: '500' })}
                  className="text-xs px-2 py-1 bg-gradient-to-r from-blue-50 to-blue-100 border border-blue-200 rounded-md hover:from-blue-100 hover:to-blue-200 transition-all duration-200 text-blue-700 font-medium"
                >
                  ₹100-500
                </button>
                <button
                  onClick={() => onColumnFilterChange(column.key, { min: '500', max: '1000' })}
                  className="text-xs px-2 py-1 bg-gradient-to-r from-purple-50 to-purple-100 border border-purple-200 rounded-md hover:from-purple-100 hover:to-purple-200 transition-all duration-200 text-purple-700 font-medium"
                >
                  ₹500-1000
                </button>
                <button
                  onClick={() => onColumnFilterChange(column.key, { min: '1000', max: '' })}
                  className="text-xs px-2 py-1 bg-gradient-to-r from-orange-50 to-orange-100 border border-orange-200 rounded-md hover:from-orange-100 hover:to-orange-200 transition-all duration-200 text-orange-700 font-medium"
                >
                  Over ₹1000
                </button>
              </div>
            </div>
          )}
          
          {filterType === 'date' && (
            <div className="space-y-4">
              <div className="text-sm font-semibold text-black mb-2">FILTER OPTIONS:</div>
              <div className="grid grid-cols-2 gap-2">
                <button
                  onClick={() => onColumnFilterChange(column.key, 'today')}
                  className="text-xs px-2 py-1 bg-gradient-to-r from-green-50 to-green-100 border border-green-200 rounded-md hover:from-green-100 hover:to-green-200 transition-all duration-200 text-green-700 font-medium"
                >
                  Today
                </button>
                <button
                  onClick={() => onColumnFilterChange(column.key, 'yesterday')}
                  className="text-xs px-2 py-1 bg-gradient-to-r from-blue-50 to-blue-100 border border-blue-200 rounded-md hover:from-blue-100 hover:to-blue-200 transition-all duration-200 text-blue-700 font-medium"
                >
                  Yesterday
                </button>
                <button
                  onClick={() => onColumnFilterChange(column.key, 'this_week')}
                  className="text-xs px-2 py-1 bg-gradient-to-r from-purple-50 to-purple-100 border border-purple-200 rounded-md hover:from-purple-100 hover:to-purple-200 transition-all duration-200 text-purple-700 font-medium"
                >
                  This Week
                </button>
                <button
                  onClick={() => onColumnFilterChange(column.key, 'this_month')}
                  className="text-xs px-2 py-1 bg-gradient-to-r from-orange-50 to-orange-100 border border-orange-200 rounded-md hover:from-orange-100 hover:to-orange-200 transition-all duration-200 text-orange-700 font-medium"
                >
                  This Month
                </button>
                <button
                  onClick={() => onColumnFilterChange(column.key, 'last_7_days')}
                  className="text-xs px-2 py-1 bg-gradient-to-r from-indigo-50 to-indigo-100 border border-indigo-200 rounded-md hover:from-indigo-100 hover:to-indigo-200 transition-all duration-200 text-indigo-700 font-medium"
                >
                  Last 7 Days
                </button>
                <button
                  onClick={() => onColumnFilterChange(column.key, 'last_30_days')}
                  className="text-xs px-2 py-1 bg-gradient-to-r from-pink-50 to-pink-100 border border-pink-200 rounded-md hover:from-pink-100 hover:to-pink-200 transition-all duration-200 text-pink-700 font-medium"
                >
                  Last 30 Days
                </button>
              </div>
              <div className="text-xs text-gray-500 mt-2">
                Format: YYYY-MM-DD
              </div>
            </div>
          )}
        </div>
      </div>
    )
  }

  if (viewMode !== 'table') return null

  return (
    <div className="bg-white border-b border-gray-200">
      <div className="flex items-center h-12 px-4">
        {/* Select All Checkbox */}
        <div className="flex items-center space-x-2 mr-4">
          <input
            type="checkbox"
            checked={selectedOrders.length === currentOrders.length && currentOrders.length > 0}
            onChange={onSelectAll}
            className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
          />
          <span className="text-sm text-gray-600">
            {selectedOrders.length} of {currentOrders.length} selected
          </span>
        </div>

        {/* Bulk Actions */}
        {selectedOrders.length > 0 && (
          <div className="flex items-center space-x-2 mr-4">
            {onBulkEdit && (
              <button
                onClick={onBulkEdit}
                className="text-xs px-2 py-1 bg-blue-50 text-blue-600 rounded hover:bg-blue-100 transition-colors"
              >
                Bulk Edit
              </button>
            )}
            {onExportSelected && (
              <button
                onClick={onExportSelected}
                className="text-xs px-2 py-1 bg-green-50 text-green-600 rounded hover:bg-green-100 transition-colors"
              >
                Export Selected
              </button>
            )}
            {onBulkDelete && (
              <button
                onClick={onBulkDelete}
                className="text-xs px-2 py-1 bg-red-50 text-red-600 rounded hover:bg-red-100 transition-colors"
              >
                Delete Selected
              </button>
            )}
          </div>
        )}

        {/* Column Headers */}
        <div className="flex-1 flex items-center">
          {columns.map((column) => (
            <div
              key={column.key}
              className={cn(
                "flex items-center justify-between px-3 py-2 relative",
                getColumnClass(column)
              )}
            >
              <span className="text-xs font-medium text-gray-700 uppercase tracking-wide">
                {column.title}
              </span>
              
              {column.filterType && (
                <div className="relative">
                  <button
                    onClick={() => onFilterClick(activeColumnFilter === column.key ? '' : column.key)}
                    className={cn(
                      "ml-1 p-1 rounded hover:bg-gray-200 transition-colors",
                      activeColumnFilter === column.key ? "bg-blue-50 text-blue-600" : "text-gray-400",
                      columnFilters[column.key] && 
                      (typeof columnFilters[column.key] === 'string' ? 
                        (columnFilters[column.key] as string) : 
                        Array.isArray(columnFilters[column.key]) ?
                          (columnFilters[column.key] as string[])?.length > 0 :
                          (columnFilters[column.key] as any)?.min || (columnFilters[column.key] as any)?.max || (columnFilters[column.key] as any)?.start || (columnFilters[column.key] as any)?.end
                      ) ? "text-blue-600" : "text-gray-400"
                    )}
                  >
                    <Filter className="h-3 w-3" />
                  </button>
                  
                  {renderFilterDropdown(column)}
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
