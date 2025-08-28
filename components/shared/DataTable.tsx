'use client'

import React, { useState, useMemo } from 'react'
import { 
  ChevronUp, 
  ChevronDown, 
  MoreHorizontal
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { DataTableProps, TableColumn, BaseEntity } from './types'
import ProductsColumnHeader from '@/app/(admin)/apps/shopify/products/components/ColumnHeader'
import StatusBadge from './StatusBadge'
import ImageDisplay from './ImageDisplay'
import HighlightedText from './HighlightedText'

export default function DataTable<T extends BaseEntity>({
  data,
  columns,
  loading = false,
  error = null,
  pagination,
  selectedItems = [],
  onSelectItem,
  onSelectAll,
  onRowClick,
  searchQuery = '',
  showImages = true,
  isFullScreen = false,
  columnFilters = {},
  activeColumnFilter = null,
  onFilterClick = () => {},
  onColumnFilterChange = () => {}
}: DataTableProps<T>) {
  const inferFilterType = (key: string): 'text' | 'select' | 'multi-select' | 'date' => {
    if (key === 'createdAt' || key === 'updatedAt' || key.toLowerCase().includes('date')) return 'date'
    if (key === 'price' || key === 'inventoryQuantity') return 'text'
    return 'text'
  }
  const [sortColumn, setSortColumn] = useState<string | null>(null)
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('desc')

  // Sort data
  const sortedData = useMemo(() => {
    if (!sortColumn) return data

    return [...data].sort((a, b) => {
      const aValue = a[sortColumn as keyof T]
      const bValue = b[sortColumn as keyof T]

      if (aValue === bValue) return 0

      let comparison = 0
      if (typeof aValue === 'string' && typeof bValue === 'string') {
        comparison = aValue.localeCompare(bValue)
      } else if (typeof aValue === 'number' && typeof bValue === 'number') {
        comparison = aValue - bValue
      } else if (aValue instanceof Date && bValue instanceof Date) {
        comparison = aValue.getTime() - bValue.getTime()
      } else {
        comparison = String(aValue).localeCompare(String(bValue))
      }

      return sortDirection === 'asc' ? comparison : -comparison
    })
  }, [data, sortColumn, sortDirection])

  const handleSort = (columnKey: string) => {
    if (sortColumn === columnKey) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc')
    } else {
      setSortColumn(columnKey)
      setSortDirection('asc')
    }
  }

  const handleRowClick = (item: T, event: React.MouseEvent) => {
    // Don't trigger if clicking on checkbox or action buttons
    if ((event.target as HTMLElement).closest('input[type="checkbox"]') ||
        (event.target as HTMLElement).closest('button')) {
      return
    }
    
    onRowClick?.(item)
  }

  const handleSelectItem = (id: string) => {
    onSelectItem?.(id)
  }

  if (loading) {
    return (
      <div className="animate-pulse">
        <div className="h-12 bg-gray-200 rounded-t-lg"></div>
        {Array.from({ length: 5 }).map((_, i) => (
          <div key={i} className="h-16 bg-gray-100 border-b border-gray-200 last:border-b-0"></div>
        ))}
      </div>
    )
  }

  if (error) {
    return (
      <div className="flex items-center justify-center h-32 text-red-600">
        <div className="text-center">
          <div className="text-lg font-semibold mb-2">Error Loading Data</div>
          <div className="text-sm">{error}</div>
        </div>
      </div>
    )
  }

  if (data.length === 0) {
    return (
      <div className="flex items-center justify-center h-32 text-gray-500">
        <div className="text-center">
          <div className="text-lg font-semibold mb-2">No Data Found</div>
          <div className="text-sm">Try adjusting your search or filters</div>
        </div>
      </div>
    )
  }

  // Compute serial offset if pagination provided
  const startIndex = pagination ? ((pagination.currentPage - 1) * pagination.itemsPerPage) : 0

  return (
    <div className={cn(
      "bg-white rounded-lg border border-gray-200 overflow-hidden",
      isFullScreen && "flex-1 flex flex-col"
    )}>
      <div className={cn(
        "overflow-auto",
        isFullScreen ? "flex-1" : ""
      )}>
        <table className="min-w-full divide-y divide-gray-200">
          <thead className={cn(
            "bg-gray-50 relative",
            isFullScreen ? "sticky top-0 z-10" : ""
          )}>
            <tr>
              <th className="px-2 py-1.5 text-left relative">
                <div className="flex items-center space-x-2">
                  <input
                    type="checkbox"
                    checked={selectedItems.length === data.length && data.length > 0}
                    onChange={onSelectAll}
                    className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                  />
                </div>
              </th>
              <th className="px-2 py-1.5 text-left relative">
                <div className="flex items-center space-x-2">
                  <span className="text-xs font-medium text-gray-500 uppercase tracking-wider">
                    S.No
                  </span>
                </div>
              </th>
              {columns.map((column) => (
                <ProductsColumnHeader
                  key={column.key}
                  title={column.label}
                  column={column.key}
                  hasFilter={true}
                  filterType={(column.filterType as any) || inferFilterType(column.key)}
                  options={[]}
                  columnFilters={columnFilters}
                  activeColumnFilter={activeColumnFilter}
                  onFilterClick={onFilterClick}
                  onColumnFilterChange={onColumnFilterChange}
                />
              ))}
            </tr>
          </thead>

          <tbody className="bg-white">
            {sortedData.map((item, index) => (
              <tr
                key={item.id}
                className={cn(
                  "hover:bg-gray-50 transition-colors cursor-pointer",
                  index < sortedData.length - 1 ? "border-b border-gray-200" : ""
                )}
                onClick={(e) => handleRowClick(item, e)}
              >
                <td className="px-2 py-1.5 whitespace-nowrap border-r border-gray-200">
                  <input
                    type="checkbox"
                    checked={selectedItems.includes(item.id)}
                    onChange={() => handleSelectItem(item.id)}
                    className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                    onClick={(e) => e.stopPropagation()}
                  />
                </td>
                <td className="px-2 py-1.5 whitespace-nowrap border-r border-gray-200">
                  <div className="flex items-center justify-center">
                    <span className="text-sm font-medium text-gray-600">#{startIndex + index + 1}</span>
                  </div>
                </td>
                {columns.map((column) => (
                  <td
                    key={column.key}
                    className={cn(
                      "px-2 py-1.5 whitespace-nowrap border-r border-gray-200",
                      column.align === 'center' && "text-center",
                      column.align === 'right' && "text-right"
                    )}
                  >
                    {column.render ? (
                      column.render(item[column.key as keyof T], item)
                    ) : (
                      <div className="text-sm text-gray-900">
                        {item[column.key as keyof T] ? String(item[column.key as keyof T]) : '-'}
                      </div>
                    )}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {pagination && (
        <div className="border-t border-gray-200 bg-gray-50 px-4 py-3">
          <div className="flex items-center justify-between">
            <div className="text-sm text-gray-700">
              Showing {((pagination.currentPage - 1) * pagination.itemsPerPage) + 1} to {Math.min(pagination.currentPage * pagination.itemsPerPage, pagination.totalItems)} of {pagination.totalItems} results
            </div>
            <div className="flex items-center space-x-2">
              <select
                value={pagination.itemsPerPage}
                onChange={(e) => pagination.onItemsPerPageChange(Number(e.target.value))}
                className="border border-gray-300 rounded px-2 py-1 text-sm"
              >
                <option value={10}>10</option>
                <option value={25}>25</option>
                <option value={50}>50</option>
                <option value={100}>100</option>
                <option value={200}>200</option>
                <option value={300}>300</option>
              </select>
              <span className="text-sm text-gray-700">per page</span>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
