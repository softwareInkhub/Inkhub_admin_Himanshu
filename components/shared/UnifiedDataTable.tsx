'use client'

import { useState, useMemo, useRef, useEffect } from 'react'
import { format } from 'date-fns'
import { ChevronUp, ChevronDown, Braces } from 'lucide-react'
import { cn } from '@/lib/utils'
import { TableItem, ColumnDef, SortState, FilterDropdown } from './types/unified-table'
import UnifiedFilterDropdown from './UnifiedFilterDropdown'
import SortIndicator from './SortIndicator'
import JsonViewerModal from './JsonViewerModal'

interface UnifiedDataTableProps<T extends TableItem> {
  // Data
  data: T[]
  selectedItems: string[]
  onSelectItem: (id: string) => void
  onSelectAll: () => void
  onRowClick?: (item: T, event: React.MouseEvent) => void
  columns: ColumnDef<T>[]
  
  // State
  loading?: boolean
  error?: string | null
  searchQuery?: string
  isFullScreen?: boolean
  
  // Filtering
  activeColumnFilter?: string | null
  columnFilters?: Record<string, any>
  onFilterClick?: (column: string | null) => void
  onColumnFilterChange?: (column: string, value: any) => void
  getUniqueValues?: (field: string) => string[]
  
  // Display
  showImages?: boolean
  onClearSearch?: () => void
  isSearching?: boolean
  
  // Sorting
  sortState?: SortState
  onRequestSort?: (key: string) => void
  
  // Layout
  compact?: boolean
  showActions?: boolean
  showHeader?: boolean
  seamlessTop?: boolean
  columnWidths?: Record<string, number>
  headerOnly?: boolean
  renderHeader?: boolean
  
  // Scroll synchronization
  scrollGroupId?: string
  tableScrollRef?: React.RefObject<HTMLDivElement>
  
  // Custom configurations
  defaultSortField?: string
  itemTypeName?: string // e.g., "orders", "products", "pins"
  filterConfig?: (columnKey: string) => {
    filterType: 'text' | 'numeric' | 'date' | 'select' | 'multi-select'
    options?: string[]
  }
}

export default function UnifiedDataTable<T extends TableItem>({
  data,
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
  compact = true,
  showActions = true,
  columnWidths,
  headerOnly = false,
  renderHeader = true,
  scrollGroupId,
  tableScrollRef,
  defaultSortField = 'createdAt',
  itemTypeName = 'items',
  filterConfig
}: UnifiedDataTableProps<T>) {
  // Refs for horizontal scroll synchronization
  const scrollContainerRef = useRef<HTMLDivElement | null>(null)

  // Sync horizontal scroll across instances sharing the same group id
  useEffect(() => {
    if (!scrollGroupId) return
    const el = scrollContainerRef.current
    if (!el) return
    el.setAttribute('data-scroll-group', scrollGroupId)

    const onScroll = () => {
      const others = document.querySelectorAll<HTMLDivElement>(`div[data-scroll-group="${scrollGroupId}"]`)
      others.forEach((node) => {
        if (node === el) return
        if (node.scrollLeft !== el.scrollLeft) {
          node.scrollLeft = el.scrollLeft
        }
      })
    }
    el.addEventListener('scroll', onScroll, { passive: true })
    return () => {
      el.removeEventListener('scroll', onScroll)
    }
  }, [scrollGroupId])

  // Sync external tableScrollRef with internal scrollContainerRef
  useEffect(() => {
    if (!tableScrollRef) return
    
    const syncRefs = () => {
      if (scrollContainerRef.current && tableScrollRef.current !== scrollContainerRef.current) {
        Object.defineProperty(tableScrollRef, 'current', {
          value: scrollContainerRef.current,
          writable: true,
          configurable: true
        })
      }
    }

    syncRefs()
    const timeoutId = setTimeout(syncRefs, 100)
    
    return () => {
      clearTimeout(timeoutId)
    }
  }, [tableScrollRef])

  // Log scroll events for debugging
  useEffect(() => {
    const el = scrollContainerRef.current
    if (!el) return

    const onScroll = () => {
      console.log('UnifiedDataTable scroll:', el.scrollLeft)
    }
    el.addEventListener('scroll', onScroll, { passive: true })
    return () => {
      el.removeEventListener('scroll', onScroll)
    }
  }, [])

  const [filterDropdown, setFilterDropdown] = useState<FilterDropdown | null>(null)

  // JSON viewer state
  const [jsonOpen, setJsonOpen] = useState(false)
  const [jsonItem, setJsonItem] = useState<T | null>(null)

  const sortedData = useMemo(() => {
    // Reduce debug logging noise - only log occasionally in development
    const shouldLog = process.env.NODE_ENV === 'development' && Math.random() < 0.05 // 5% chance
    
    if (shouldLog) {
      console.log('🔍 UnifiedDataTable received data:', {
        dataLength: data.length,
        sampleData: data.slice(0, 3).map(item => ({ 
          id: item.id, 
          // Show first few properties for debugging
          ...Object.fromEntries(Object.entries(item).slice(0, 3))
        }))
      })
    }
    
    // If no sort column is specified, default to sorting by date (newest first)
    if (!sortState?.key) {
      const sorted = [...data].sort((a, b) => {
        const dateA = new Date(a[defaultSortField] || a.updatedAt || a.createdAt || 0)
        const dateB = new Date(b[defaultSortField] || b.updatedAt || b.createdAt || 0)
        return dateB.getTime() - dateA.getTime() // Newest first (descending)
      })
      if (shouldLog) {
        console.log('🔍 UnifiedDataTable sorted data (default sort):', sorted.length)
      }
      return sorted
    }

    const sorted = [...data].sort((a, b) => {
      const aValue = a[sortState.key as keyof T]
      const bValue = b[sortState.key as keyof T]

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
    if (shouldLog) {
      console.log('🔍 UnifiedDataTable sorted data (custom sort):', sorted.length)
    }
    return sorted
  }, [data, sortState, defaultSortField])

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
    if (filterConfig) {
      return filterConfig(columnKey)
    }
    
    // Default filter configuration
    switch (columnKey) {
      case 'serialNumber':
        return { filterType: 'numeric' as const }
      case 'orderNumber':
      case 'productName':
      case 'pinTitle':
      case 'boardName':
      case 'designName':
        return { filterType: 'text' as const }
      case 'fulfillmentStatus':
      case 'status':
        return { 
          filterType: 'select' as const, 
          options: ['unfulfilled', 'fulfilled', 'partial', 'active', 'inactive'] 
        }
      case 'total':
      case 'price':
      case 'value':
        return { filterType: 'numeric' as const }
      case 'createdAt':
      case 'updatedAt':
        return { filterType: 'date' as const }
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
      default:
        return { filterType: 'text' as const }
    }
  }

  const allSelected = data.length > 0 && selectedItems.length === data.length
  const someSelected = selectedItems.length > 0 && selectedItems.length < data.length

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-gray-500">Loading {itemTypeName}...</div>
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

  if (!headerOnly && data.length === 0) {
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
                  (0 {itemTypeName} found)
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
              {renderHeader && (
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
                              onClick={() => onRequestSort?.(column.key)}
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
              )}
              <tbody>
                <tr>
                  <td colSpan={columns.length + 1} className="px-4 py-12 text-center">
                    <div className="flex flex-col items-center space-y-4">
                      <div className="text-gray-400 text-6xl">📦</div>
                      <h3 className="text-lg font-medium text-gray-900">No {itemTypeName.charAt(0).toUpperCase() + itemTypeName.slice(1)} Found</h3>
                      <p className="text-gray-600 max-w-md">
                        {searchQuery 
                          ? `No ${itemTypeName} match your search for "${searchQuery}"`
                          : `No ${itemTypeName} available at the moment.`
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
          <UnifiedFilterDropdown
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

  const renderColGroup = () => (
    columnWidths ? (
      <colgroup>
        <col style={{ width: 44 }} />
        {columns.map((c) => (
          <col key={`col-${c.key}`} style={c.key in (columnWidths || {}) ? { width: columnWidths![c.key] } : undefined} />
        ))}
        {showActions && <col />}
      </colgroup>
    ) : null
  )

  const tableHeader = (
    <thead className="sticky top-0 z-30 bg-white shadow-sm" style={{ position: 'sticky', top: 0, backgroundColor: 'white', zIndex: 30 }}>
      <tr className="bg-white">
        <th className="bg-white sticky top-0 z-30 px-4 py-3 text-left border-b-2 border-gray-200" style={{ position: 'sticky', top: 0, backgroundColor: 'white', zIndex: 30 }}>
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
            className={cn("bg-white sticky top-0 z-30 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider border-b-2 border-gray-200 border-r whitespace-nowrap min-w-[160px]",
              compact ? 'py-2 px-2' : 'py-3 px-3'
            )}
            style={{ position: 'sticky', top: 0, backgroundColor: 'white', zIndex: 30 }}
          >
            <div className="flex items-center justify-between">
              <span>{column.label}</span>
              <div className="flex items-center space-x-1">
                {column.key !== 'tags' && column.key !== 'deliveryMethod' && column.sortable && (
                  <button
                    onClick={() => onRequestSort?.(column.key)}
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
                  className={cn(
                    "p-1 rounded-md transition-all duration-200 hover:scale-105",
                    (activeColumnFilter === column.key || filterDropdown?.column === column.key)
                      ? "bg-gradient-to-r from-blue-50 to-indigo-50 text-blue-600 shadow-sm border border-blue-200"
                      : (columnFilters && ((Array.isArray(columnFilters[column.key]) && (columnFilters[column.key] as any[]).length > 0) || (!Array.isArray(columnFilters[column.key]) && String(columnFilters[column.key] || '').trim() !== '')))
                        ? "text-blue-600 bg-blue-50 border border-blue-200"
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
        {showActions && (
          <th className={cn("text-left text-xs font-medium text-gray-500 uppercase tracking-wider",
            compact ? 'py-1 px-2' : 'py-2 px-3'
          )}>
            Actions
          </th>
        )}
      </tr>
    </thead>
  )

  if (headerOnly) {
    return (
      <div className={`bg-white rounded-lg border border-gray-200 shadow-sm`}>
        <div className="overflow-x-auto" ref={scrollContainerRef}>
          <table className="min-w-max table-fixed">
            {renderColGroup()}
            {tableHeader}
          </table>
        </div>
        {/* Filter Dropdown for header-only mode */}
        {filterDropdown && (
          <UnifiedFilterDropdown
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
                ({data.length} {itemTypeName} found)
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
      <div className="overflow-x-auto [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]">
        <div ref={scrollContainerRef} className="overflow-x-auto [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]">
          <table className="min-w-max table-fixed" key={`unified-table-${sortedData.length}`}>
          {renderColGroup()}
          {renderHeader ? tableHeader : null}
          <tbody className="bg-white divide-y divide-gray-200">
            {(() => {
              // Reduce render logging noise - only log occasionally in development
              if (process.env.NODE_ENV === 'development' && Math.random() < 0.02) { // 2% chance
                console.log('🔍 Rendering table rows:', sortedData.length, itemTypeName)
              }
              return sortedData.map((item, index) => (
              <tr
                key={`${item.id}-${index}`}
                className="hover:bg-gray-50 cursor-pointer transition-colors duration-150"
                onClick={(e) => {
                  // If clicking checkbox or button, do not open preview
                  if ((e.target as HTMLElement).closest('input,button')) return
                  if (onRowClick) {
                    onRowClick(item, e)
                  } else {
                    onSelectItem(item.id)
                  }
                }}
              >
                <td className={cn(compact ? 'px-3 py-1.5' : 'px-4 py-2')}>
                  <input
                    type="checkbox"
                    checked={selectedItems.includes(item.id)}
                    onChange={() => onSelectItem(item.id)}
                    onClick={(e) => e.stopPropagation()}
                    className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                  />
                </td>
                {columns.map((column) => (
                  <td key={column.key} className={cn("text-sm text-gray-900 border-r border-gray-200 whitespace-nowrap min-w-[160px]",
                    compact ? 'py-1.5 px-2' : 'py-2 px-3'
                  )}>
                    {column.render ? column.render(item, index) : String(item[column.key as keyof T] || '')}
                  </td>
                ))}
                {/* Actions cell (optional) */}
                {showActions && (
                  <td className={cn("text-sm text-gray-900",
                    compact ? 'py-1.5 px-2' : 'py-2 px-3'
                  )}>
                    <button
                      onClick={(e) => { e.stopPropagation(); setJsonItem(item); setJsonOpen(true) }}
                      className="inline-flex items-center gap-1 px-2 py-1 text-xs font-medium text-blue-700 bg-blue-50 border border-blue-200 rounded-md hover:bg-blue-100 hover:border-blue-300 transition-colors"
                      title="View JSON"
                    >
                      <Braces className="h-4 w-4" />
                      View JSON
                    </button>
                  </td>
                )}
              </tr>
            ))
            })()}
          </tbody>
          </table>
        </div>
      </div>
      
      {/* Filter Dropdown */}
      {filterDropdown && (
        <UnifiedFilterDropdown
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
        title={jsonItem ? `${itemTypeName.charAt(0).toUpperCase() + itemTypeName.slice(1)} ${jsonItem.id} JSON` : `${itemTypeName.charAt(0).toUpperCase() + itemTypeName.slice(1)} JSON`}
        data={jsonItem}
        onClose={() => setJsonOpen(false)}
      />
    </div>
  )
}