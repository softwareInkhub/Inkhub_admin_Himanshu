'use client'

import { useState, useMemo, useRef, useEffect } from 'react'
import { format } from 'date-fns'
import { ChevronUp, ChevronDown, Braces } from 'lucide-react'
import { Order } from '../types'
import OrderFilterDropdown from './OrderFilterDropdown'
import { cn } from '@/lib/utils'
import SortIndicator from './SortIndicator'
import JsonViewerModal from './JsonViewerModal'


interface OrderTableProps {
  currentOrders: Order[]
  selectedItems: string[]
  onSelectItem: (id: string) => void
  onSelectAll: () => void
  onRowClick?: (order: Order, event: React.MouseEvent) => void
  columns: Array<{
    key: string
    label: string
    sortable?: boolean
    render?: (order: Order, index?: number) => React.ReactNode
  }>
  loading?: boolean
  error?: string | null
  searchQuery?: string
  isFullScreen?: boolean
  activeColumnFilter?: string | null
  columnFilters?: Record<string, any>
  onFilterClick?: (column: string | null) => void
  onColumnFilterChange?: (column: string, value: any) => void
  getUniqueValues?: (field: string) => string[]
  showImages?: boolean
  onClearSearch?: () => void
  isSearching?: boolean
  // New sorting props from OrdersClient
  sortState?: { key: string | null; dir: 'asc' | 'desc' | null }
  onRequestSort?: (key: any) => void
  compact?: boolean
}

export default function OrderTable({
  currentOrders,
  selectedItems,
  onSelectItem,
  onSelectAll,
  onRowClick,
  columns,
  loading = false,
  error = null,
  searchQuery = '',
  isFullScreen = false,
  activeColumnFilter,
  columnFilters = {},
  onFilterClick,
  onColumnFilterChange,
  getUniqueValues,
  showImages = false,
  onClearSearch,
  isSearching = false,
  sortState,
  onRequestSort,
  compact = true
}: OrderTableProps) {
  // Use parent's sorting state instead of internal state
  // const [sortColumn, setSortColumn] = useState<string | null>(null)
  // const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('asc')
  const [filterDropdown, setFilterDropdown] = useState<{
    column: string;
    position: { x: number; y: number };
  } | null>(null)

  // JSON viewer state
  const [jsonOpen, setJsonOpen] = useState(false)
  const [jsonOrder, setJsonOrder] = useState<Order | null>(null)

  const sortedOrders = useMemo(() => {
    // Debug logging for OrderTable component
    console.log('🔍 OrderTable received currentOrders:', {
      currentOrdersLength: currentOrders.length,
      sampleOrders: currentOrders.slice(0, 3).map(o => ({ 
        id: o.id, 
        orderNumber: o.orderNumber, 
        customerName: o.customerName 
      }))
    })
    
    // If no sort column is specified, default to sorting by date (newest first)
    if (!sortState?.key) {
      const sorted = [...currentOrders].sort((a, b) => {
        const dateA = new Date(a.createdAt || a.updatedAt || 0)
        const dateB = new Date(b.createdAt || b.updatedAt || 0)
        return dateB.getTime() - dateA.getTime() // Newest first (descending)
      })
      console.log('🔍 OrderTable sorted orders (default sort):', sorted.length)
      return sorted
    }

    const sorted = [...currentOrders].sort((a, b) => {
      const aValue = a[sortState.key as keyof Order]
      const bValue = b[sortState.key as keyof Order]

      if (aValue === undefined || aValue === null) return 1
      if (bValue === undefined || bValue === null) return -1

      let comparison = 0
      if (typeof aValue === 'string' && typeof bValue === 'string') {
        comparison = aValue.localeCompare(bValue)
      } else if (typeof aValue === 'number' && typeof bValue === 'number') {
        comparison = aValue - bValue
      } else {
        comparison = String(aValue).localeCompare(String(bValue))
      }

      return sortState.dir === 'asc' ? comparison : -comparison
    })
    console.log('🔍 OrderTable sorted orders (custom sort):', sorted.length)
    return sorted
  }, [currentOrders, sortState])

  // Use parent's onRequestSort instead of internal handleSort

  const handleFilterClick = (column: string, event: React.MouseEvent) => {
    event.stopPropagation()
    
    if (filterDropdown?.column === column) {
      setFilterDropdown(null)
      onFilterClick?.(null)
      return
    }

    const rect = event.currentTarget.getBoundingClientRect()
    const position = {
      x: rect.right + 5,
      y: rect.bottom + 5
    }

    // Adjust position if dropdown would go off screen
    const dropdownWidth = 250
    const dropdownHeight = 320
    const viewportWidth = window.innerWidth
    const viewportHeight = window.innerHeight

    if (position.x + dropdownWidth > viewportWidth) {
      position.x = rect.left - dropdownWidth - 5
    }

    if (position.y + dropdownHeight > viewportHeight) {
      position.y = rect.top - dropdownHeight - 5
    }

    setFilterDropdown({ column, position })
    onFilterClick?.(column)
  }

  const handleFilterChange = (column: string, value: any) => {
    onColumnFilterChange?.(column, value)
  }

  const handleFilterClose = () => {
    setFilterDropdown(null)
    onFilterClick?.(null)
  }

  // Get filter configuration for each column
  const getFilterConfig = (columnKey: string) => {
    switch (columnKey) {
      case 'serialNumber':
        return { filterType: 'numeric' as const }
      case 'orderNumber':
        return { filterType: 'text' as const }
      case 'customerName':
        return { filterType: 'text' as const }
      case 'fulfillmentStatus':
        return { 
          filterType: 'select' as const, 
          options: ['unfulfilled', 'fulfilled', 'partial'] 
        }
      case 'total':
        return { filterType: 'numeric' as const }
      case 'createdAt':
        return { filterType: 'date' as const }
      case 'items':
        return { filterType: 'text' as const }
      case 'deliveryStatus':
        return { 
          filterType: 'select' as const, 
          options: ['Tracking added', 'Pending', 'In Transit', 'Delivered'] 
        }
      case 'tags':
        return { 
          filterType: 'multi-select' as const, 
          options: getUniqueValues ? getUniqueValues('tags') : [] 
        }
      case 'channel':
        return { 
          filterType: 'select' as const, 
          options: getUniqueValues ? getUniqueValues('channel') : [] 
        }
      case 'deliveryMethod':
        return { 
          filterType: 'select' as const, 
          options: getUniqueValues ? getUniqueValues('deliveryMethod') : [] 
        }
      case 'paymentStatus':
        return { 
          filterType: 'select' as const, 
          options: ['paid', 'pending', 'refunded'] 
        }
      default:
        return { filterType: 'text' as const }
    }
  }

  const allSelected = currentOrders.length > 0 && selectedItems.length === currentOrders.length
  const someSelected = selectedItems.length > 0 && selectedItems.length < currentOrders.length

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-gray-500">Loading orders...</div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-red-500">Error: {error}</div>
      </div>
    )
  }

  if (currentOrders.length === 0) {
    return (
      <div className={`bg-white rounded-lg border border-gray-200 shadow-sm flex flex-col`}>
        {/* Search Status Indicator */}
        {searchQuery && (
          <div className="px-4 py-2 bg-blue-50 border-b border-blue-200 flex items-center justify-between">
            <div className="flex items-center space-x-2">
              {isSearching ? (
                <div className="w-4 h-4 border-2 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
              ) : (
                <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
              )}
              <span className="text-sm text-blue-700 font-medium">
                {isSearching ? 'Searching...' : 'Search results for "'}
                {!isSearching && searchQuery}
                {!isSearching && '"'}
              </span>
              {!isSearching && (
                <span className="text-sm text-blue-600">
                  (0 orders found)
                </span>
              )}
            </div>
            <button
              onClick={onClearSearch}
              className="text-xs text-blue-600 hover:text-blue-800 underline font-medium"
            >
              Clear search
            </button>
          </div>
        )}
        
        {/* Table Header - Always Visible with Sticky */}
        <div className="flex-1 overflow-hidden">
          <div className="overflow-x-auto h-full">
            <table className="w-full">
              <thead className="bg-gray-50 border-b border-gray-200 sticky top-0 z-10">
                <tr>
                  <th className="px-4 py-2 text-left bg-gray-50">
                    <input
                      type="checkbox"
                      checked={false}
                      disabled
                      className="rounded border-gray-300 text-gray-400 cursor-not-allowed"
                    />
                  </th>
                  {columns.map((column) => (
                    <th
                      key={column.key}
                      className={cn(
                        "px-3 py-2 text-left text-xs font-medium tracking-wider border-r border-gray-200 relative transition-all duration-200 bg-gray-50",
                        // Enhanced styling for sorted columns
                        sortState?.key === column.key
                          ? "bg-blue-50 border-blue-200 text-blue-700 font-semibold"
                          : "bg-gray-50 text-gray-500"
                      )}
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center">
                          <span className={cn(
                            "transition-colors duration-200",
                            sortState?.key === column.key ? "text-blue-700" : "text-gray-500"
                          )}>
                            {column.label}
                          </span>
                          {/* Enhanced Sort Indicator */}
                          {column.sortable && (
                            <button
                              onClick={() => onRequestSort?.(column.key as any)}
                              className={cn(
                                "ml-1 p-1 rounded-md transition-all duration-200 hover:scale-105",
                                sortState?.key === column.key
                                  ? "text-blue-600 hover:text-blue-700 hover:bg-blue-100"
                                  : "text-gray-400 hover:text-gray-600 hover:bg-gray-50"
                              )}
                              title={sortState?.key === column.key 
                                ? `Currently sorted ${sortState?.dir === 'asc' ? 'ascending' : 'descending'}. Click to ${sortState?.dir === 'asc' ? 'sort descending' : 'remove sorting'}.`
                                : `Sort by ${column.label}`
                              }
                            >
                              <SortIndicator 
                                columnKey={column.key} 
                                sortColumn={sortState?.key || null} 
                                sortDirection={sortState?.dir || 'asc'} 
                              />
                            </button>
                          )}
                        </div>
                        <div className="flex items-center space-x-1">
                          <button
                            onClick={(e) => handleFilterClick(column.key, e)}
                            className={cn(
                              "p-1 rounded-md transition-all duration-200 hover:scale-105",
                            (activeColumnFilter === column.key || filterDropdown?.column === column.key)
                              ? "bg-gradient-to-r from-blue-50 to-indigo-50 text-blue-600 shadow-sm border border-blue-200" 
                              : sortState?.key === column.key
                                ? "text-blue-500 hover:text-blue-600 hover:bg-blue-100"
                                : "text-gray-400 hover:text-gray-600 hover:bg-gray-50"
                            )}
                            title={`Filter ${column.label}`}
                          >
                            <svg className="h-3 w-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.207A1 1 0 013 6.5V4z" />
                            </svg>
                          </button>
                        </div>
                      </div>
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td colSpan={columns.length + 1} className="px-4 py-12 text-center">
                    <div className="flex flex-col items-center space-y-4">
                      <div className="text-gray-400 text-6xl">📦</div>
                      <h3 className="text-lg font-medium text-gray-900">No Orders Found</h3>
                      <p className="text-gray-600 max-w-md">
                        {searchQuery 
                          ? `No orders match your search for "${searchQuery}"`
                          : 'No orders available at the moment.'
                        }
                      </p>
                      <div className="flex items-center space-x-3">
                        {searchQuery && (
                          <button
                            onClick={onClearSearch}
                            className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
                          >
                            Clear Search
                          </button>
                        )}
                        {/* Check if there are active filters */}
                        {Object.keys(columnFilters).some(key => {
                          const value = columnFilters[key]
                          return value && (Array.isArray(value) ? value.length > 0 : value !== '')
                        }) && (
                          <button
                            onClick={() => {
                              // Clear all column filters
                              Object.keys(columnFilters).forEach(key => {
                                onColumnFilterChange?.(key, Array.isArray(columnFilters[key]) ? [] : '')
                              })
                            }}
                            className="px-4 py-2 bg-gray-600 text-white rounded-md hover:bg-gray-700 transition-colors"
                          >
                            Clear All Filters
                          </button>
                        )}
                      </div>
                    </div>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
        
        {/* Filter Dropdown - Always Available */}
        {filterDropdown && (
          <OrderFilterDropdown
            column={filterDropdown.column}
            title={columns.find(col => col.key === filterDropdown.column)?.label || filterDropdown.column}
            filterType={getFilterConfig(filterDropdown.column).filterType}
            options={getFilterConfig(filterDropdown.column).options}
            value={columnFilters[filterDropdown.column]}
            onChange={(value) => handleFilterChange(filterDropdown.column, value)}
            onClose={handleFilterClose}
            position={filterDropdown.position}
            getUniqueValues={getUniqueValues}
          />
        )}
      </div>
    )
  }

  return (
    <div className={`bg-white rounded-lg border border-gray-200 shadow-sm`} style={{ maxHeight: 'none', overflow: 'visible' }}>
      {/* Search Status Indicator */}
      {searchQuery && (
        <div className="px-4 py-2 bg-blue-50 border-b border-blue-200 flex items-center justify-between">
          <div className="flex items-center space-x-2">
            {isSearching ? (
              <div className="w-4 h-4 border-2 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
            ) : (
              <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
            )}
            <span className="text-sm text-blue-700 font-medium">
              {isSearching ? 'Searching...' : 'Search results for "'}
              {!isSearching && searchQuery}
              {!isSearching && '"'}
            </span>
            {!isSearching && (
              <span className="text-sm text-blue-600">
                ({currentOrders.length} orders found)
              </span>
            )}
          </div>
          <button
            onClick={onClearSearch}
            className="text-xs text-blue-600 hover:text-blue-800 underline font-medium"
          >
            Clear search
          </button>
        </div>
      )}
      <div className="overflow-x-auto">
        <table className="w-full" key={`orders-table-${sortedOrders.length}`}>
          <thead className="bg-gray-50 border-b border-gray-200">
            <tr>
              <th className="px-4 py-2 text-left">
                <input
                  type="checkbox"
                  checked={allSelected}
                  ref={(ref) => {
                    if (ref) ref.indeterminate = someSelected
                  }}
                  onChange={onSelectAll}
                  className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                />
              </th>
              {columns.map((column) => (
                <th
                  key={column.key}
                  className={cn("text-left text-xs font-medium text-gray-500 uppercase tracking-wider border-r border-gray-200 relative",
                    compact ? 'py-1 px-2' : 'py-2 px-3'
                  )}
                >
                  <div className="flex items-center justify-between">
                    <span>{column.label}</span>
                    <div className="flex items-center space-x-1">
                      {column.key !== 'tags' && column.key !== 'deliveryMethod' && column.sortable && (
                        <button
                          onClick={() => onRequestSort?.(column.key as any)}
                          className={cn(
                            "ml-1 p-1 rounded-md transition-all duration-200 hover:bg-gray-100",
                            sortState?.key === column.key ? "text-gray-900" : "text-gray-500 hover:text-gray-700"
                          )}
                          aria-label={`Sort by ${column.label}`}
                        >
                          <div className="flex flex-col items-center justify-center leading-none">
                            <ChevronUp className={cn("h-3.5 w-3.5", sortState?.key === column.key && sortState?.dir === 'asc' ? "text-gray-900" : "text-gray-300")}/>
                            <ChevronDown className={cn("h-3.5 w-3.5 -mt-0.5", sortState?.key === column.key && sortState?.dir === 'desc' ? "text-gray-900" : "text-gray-300")}/>
                          </div>
                        </button>
                      )}
                      <button
                        onClick={(e) => handleFilterClick(column.key, e)}
                        className={`p-1 rounded-md transition-all duration-200 hover:scale-105 ${
                          (activeColumnFilter === column.key || filterDropdown?.column === column.key)
                            ? "bg-gradient-to-r from-blue-50 to-indigo-50 text-blue-600 shadow-sm border border-blue-200" 
                            : "text-gray-400 hover:text-gray-600 hover:bg-gray-50"
                        }`}
                        title={`Filter ${column.label}`}
                      >
                        <svg className="h-3 w-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.207A1 1 0 013 6.5V4z" />
                        </svg>
                      </button>
                    </div>
                  </div>
                </th>
              ))}
              {/* Actions column header */}
              <th className={cn("text-left text-xs font-medium text-gray-500 uppercase tracking-wider",
                compact ? 'py-1 px-2' : 'py-2 px-3'
              )}>
                Actions
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {(() => {
              console.log('🔍 Rendering table rows:', sortedOrders.length, 'orders')
              return sortedOrders.map((order, index) => (
              <tr
                key={`${order.id}-${index}`}
                className="hover:bg-gray-50 cursor-pointer transition-colors duration-150"
                onClick={(e) => {
                  // If clicking checkbox or button, do not open preview
                  if ((e.target as HTMLElement).closest('input,button')) return
                  if (onRowClick) {
                    onRowClick(order, e)
                  } else {
                    onSelectItem(order.id)
                  }
                }}
              >
                <td className={cn(compact ? 'px-3 py-1.5' : 'px-4 py-2')}>
                  <input
                    type="checkbox"
                    checked={selectedItems.includes(order.id)}
                    onChange={() => onSelectItem(order.id)}
                    onClick={(e) => e.stopPropagation()}
                    className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                  />
                </td>
                {columns.map((column) => (
                  <td key={column.key} className={cn("text-sm text-gray-900 border-r border-gray-200",
                    compact ? 'py-1.5 px-2' : 'py-2 px-3'
                  )}>
                    {column.render ? column.render(order, index) : String(order[column.key as keyof Order] || '')}
                  </td>
                ))}
                {/* Actions cell */}
                <td className={cn("text-sm text-gray-900",
                  compact ? 'py-1.5 px-2' : 'py-2 px-3'
                )}>
                  <button
                    onClick={(e) => { e.stopPropagation(); setJsonOrder(order); setJsonOpen(true) }}
                    className="inline-flex items-center gap-1 px-2 py-1 text-xs font-medium text-blue-700 bg-blue-50 border border-blue-200 rounded-md hover:bg-blue-100 hover:border-blue-300 transition-colors"
                    title="View JSON"
                  >
                    <Braces className="h-4 w-4" />
                    View JSON
                  </button>
                </td>
              </tr>
            ))
            })()}
          </tbody>
        </table>
      </div>
      
      {/* Filter Dropdown */}
      {filterDropdown && (
        <OrderFilterDropdown
          column={filterDropdown.column}
          title={columns.find(col => col.key === filterDropdown.column)?.label || filterDropdown.column}
          filterType={getFilterConfig(filterDropdown.column).filterType}
          options={getFilterConfig(filterDropdown.column).options}
          value={columnFilters[filterDropdown.column]}
          onChange={(value) => handleFilterChange(filterDropdown.column, value)}
          onClose={handleFilterClose}
          position={filterDropdown.position}
          getUniqueValues={getUniqueValues}
        />
      )}

      {/* JSON Modal */}
      <JsonViewerModal
        isOpen={jsonOpen}
        title={jsonOrder ? `Order ${jsonOrder.orderNumber || jsonOrder.id} JSON` : 'Order JSON'}
        data={jsonOrder}
        onClose={() => setJsonOpen(false)}
      />
    </div>
  )
}
