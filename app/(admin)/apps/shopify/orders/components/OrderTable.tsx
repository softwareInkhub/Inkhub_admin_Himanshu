'use client'

import { useState, useMemo, useRef, useEffect } from 'react'
import { format } from 'date-fns'
import { Order } from '../types'
import OrderFilterDropdown from './OrderFilterDropdown'


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
  showImages = false
}: OrderTableProps) {
  const [sortColumn, setSortColumn] = useState<string | null>(null)
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('asc')
  const [filterDropdown, setFilterDropdown] = useState<{
    column: string;
    position: { x: number; y: number };
  } | null>(null)

  const sortedOrders = useMemo(() => {
    if (!sortColumn) return currentOrders

    return [...currentOrders].sort((a, b) => {
      const aValue = a[sortColumn as keyof Order]
      const bValue = b[sortColumn as keyof Order]

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

      return sortDirection === 'asc' ? comparison : -comparison
    })
  }, [currentOrders, sortColumn, sortDirection])

  const handleSort = (column: string) => {
    if (sortColumn === column) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc')
    } else {
      setSortColumn(column)
      setSortDirection('asc')
    }
  }

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
      <div className="flex items-center justify-center h-64">
        <div className="text-gray-500">No orders found</div>
      </div>
    )
  }

  return (
    <div className={`bg-white rounded-lg border`}>
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead className="bg-gray-50 border-b">
            <tr>
              <th className="px-4 py-3 text-left">
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
                  className="px-2 py-1.5 text-left text-xs font-medium text-gray-500 uppercase tracking-wider border-r border-gray-200 relative"
                >
                  <div className="flex items-center justify-between">
                    <span>{column.label}</span>
                    <div className="flex items-center space-x-1">
                      {column.sortable && (
                        <button
                          onClick={() => handleSort(column.key)}
                          className="p-1 rounded-md transition-all duration-200 hover:scale-105 text-gray-400 hover:text-gray-600 hover:bg-gray-50"
                        >
                          <div className="flex flex-col">
                            <div className={`w-0 h-0 border-l-3 border-r-3 border-b-3 border-transparent ${
                              sortColumn === column.key && sortDirection === 'asc' ? 'border-b-gray-400' : 'border-b-gray-300'
                            }`} />
                            <div className={`w-0 h-0 border-l-3 border-r-3 border-t-3 border-transparent ${
                              sortColumn === column.key && sortDirection === 'desc' ? 'border-t-gray-400' : 'border-t-gray-300'
                            }`} />
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
          <tbody className="bg-white divide-y divide-gray-200">
            {sortedOrders.map((order, index) => (
              <tr
                key={order.id}
                className="hover:bg-gray-50 cursor-pointer"
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
                <td className="px-2 py-1.5">
                  <input
                    type="checkbox"
                    checked={selectedItems.includes(order.id)}
                    onChange={() => onSelectItem(order.id)}
                    onClick={(e) => e.stopPropagation()}
                    className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                  />
                </td>
                {columns.map((column) => (
                  <td key={column.key} className="px-2 py-1.5 text-sm text-gray-900 border-r border-gray-200">
                    {column.render ? column.render(order, index) : String(order[column.key as keyof Order] || '')}
                  </td>
                ))}
              </tr>
            ))}
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
    </div>
  )
}
