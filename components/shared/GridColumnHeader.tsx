'use client'

import React, { useEffect, useRef, useState } from 'react'
import { Filter } from 'lucide-react'
import { cn } from '@/lib/utils'

interface GridColumnHeaderProps {
  columns: Array<{
    key: string
    label: string
    hasFilter?: boolean
    sortable?: boolean
    filterType?: 'text' | 'select' | 'multi-select' | 'numeric' | 'date'
    options?: string[]
  }>
  activeColumnFilter?: string | null
  columnFilters?: Record<string, any>
  onFilterClick?: (column: string) => void
  onColumnFilterChange?: (column: string, value: any) => void
  onSortClick?: (column: string) => void
  sortColumn?: string
  sortDirection?: 'asc' | 'desc'
  showCheckbox?: boolean
  getUniqueValues?: (field: string) => string[]
  // Checkbox functionality
  allSelected?: boolean
  onSelectAll?: () => void
}

export default function GridColumnHeader({
  columns,
  activeColumnFilter,
  columnFilters = {},
  onFilterClick,
  onColumnFilterChange,
  onSortClick,
  sortColumn,
  sortDirection,
  showCheckbox = true,
  getUniqueValues,
  allSelected = false,
  onSelectAll
}: GridColumnHeaderProps) {
  const filterButtonRefs = useRef<Record<string, HTMLButtonElement | null>>({})
  const dropdownRefs = useRef<Record<string, HTMLDivElement | null>>({})

  // Calculate optimal dropdown position when it becomes active
  useEffect(() => {
    if (activeColumnFilter && filterButtonRefs.current[activeColumnFilter] && dropdownRefs.current[activeColumnFilter]) {
      const calculatePosition = () => {
        const filterButton = filterButtonRefs.current[activeColumnFilter]
        const dropdownElement = dropdownRefs.current[activeColumnFilter]
        if (!filterButton || !dropdownElement) return
        
        // Get the filter button's position (not the parent div)
        const buttonRect = filterButton.getBoundingClientRect()
        const viewportWidth = window.innerWidth
        const viewportHeight = window.innerHeight
        
        const dropdownWidth = 220
        const dropdownHeight = 300
        
        // Calculate horizontal position - align dropdown left edge with button left edge
        let left = buttonRect.left
        
        // Check if dropdown would go off-screen on the right
        if (left + dropdownWidth > viewportWidth - 10) {
          // Align right edge of dropdown with right edge of button
          left = buttonRect.right - dropdownWidth
        }
        
        // Ensure it doesn't go off-screen on the left
        left = Math.max(10, left)
        
        // Calculate vertical position - place below the button
        let top = buttonRect.bottom + 5
        
        // Check if dropdown would go off-screen at bottom
        const spaceBelow = viewportHeight - buttonRect.bottom
        const spaceAbove = buttonRect.top
        
        if (spaceBelow < dropdownHeight && spaceAbove >= dropdownHeight) {
          // Place above the button
          top = buttonRect.top - dropdownHeight - 5
        }
        
        // Ensure it doesn't go off-screen at top or bottom
        top = Math.max(10, Math.min(top, viewportHeight - dropdownHeight - 10))
        
        // Apply fixed positioning
        if (dropdownElement) {
          dropdownElement.style.position = 'fixed'
          dropdownElement.style.zIndex = '999999'
          dropdownElement.style.left = `${left}px`
          dropdownElement.style.top = `${top}px`
        }
      }
      
      // Initial calculation
      calculatePosition()
      
      // Recalculate on scroll and resize
      const handleScroll = () => {
        if (activeColumnFilter) calculatePosition()
      }
      
      const handleResize = () => {
        if (activeColumnFilter) calculatePosition()
      }
      
      window.addEventListener('scroll', handleScroll, true)
      window.addEventListener('resize', handleResize)
      
      return () => {
        window.removeEventListener('scroll', handleScroll, true)
        window.removeEventListener('resize', handleResize)
      }
    }
  }, [activeColumnFilter])

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (activeColumnFilter && 
          filterButtonRefs.current[activeColumnFilter] && 
          !filterButtonRefs.current[activeColumnFilter]?.contains(event.target as Node) &&
          dropdownRefs.current[activeColumnFilter] && 
          !dropdownRefs.current[activeColumnFilter]?.contains(event.target as Node)) {
        onFilterClick?.('')
      }
    }

    if (activeColumnFilter) {
      document.addEventListener('mousedown', handleClickOutside)
      return () => document.removeEventListener('mousedown', handleClickOutside)
    }
  }, [activeColumnFilter, onFilterClick])

  return (
    <div className="bg-gray-50 border-b border-gray-200">
      <div className="flex items-center gap-2 px-4 py-2 overflow-x-auto">
        {/* Checkbox Column */}
        {showCheckbox && (
          <div className="flex items-center flex-shrink-0">
            <input
              type="checkbox"
              checked={allSelected}
              onChange={onSelectAll}
              className="w-4 h-4 border border-gray-300 rounded cursor-pointer text-blue-600 focus:ring-2 focus:ring-blue-500"
              title="Select all items"
            />
          </div>
        )}
        
        {/* S.NO Column */}
        <div className="flex items-center flex-shrink-0 min-w-[45px]">
          <span className="text-xs font-medium text-gray-500 uppercase tracking-wider">
            S.NO
          </span>
        </div>

        {/* Dynamic Columns */}
        {columns.map((column) => {
          const hasActiveFilter = columnFilters[column.key] && (
            typeof columnFilters[column.key] === 'string' 
              ? columnFilters[column.key] 
              : Array.isArray(columnFilters[column.key])
                ? columnFilters[column.key].length > 0
                : false
          )

          const filterType = column.filterType || 'text'
          const options = column.options || (getUniqueValues ? getUniqueValues(column.key) : [])

          // Determine column width based on content type
          const getColumnWidth = (key: string) => {
            // Wide columns for text-heavy fields
            if (key === 'title' || key === 'product' || key === 'name' || key === 'board') return 'min-w-[130px]'
            if (key === 'description' || key === 'notes') return 'min-w-[160px]'
            
            // Medium columns
            if (key === 'category' || key === 'vendor' || key === 'owner') return 'min-w-[95px]'
            if (key === 'tags' || key === 'productType') return 'min-w-[95px]'
            if (key === 'orderNumber' || key === 'customer') return 'min-w-[110px]'
            
            // Status columns
            if (key === 'status' || key === 'privacy' || key === 'type') return 'min-w-[80px]'
            if (key === 'channel' || key === 'paymentStatus' || key === 'fulfillmentStatus') return 'min-w-[90px]'
            
            // Numeric columns
            if (key === 'price' || key === 'total' || key === 'totalPrice') return 'min-w-[75px]'
            if (key === 'inventory' || key === 'inventoryQuantity' || key === 'stock') return 'min-w-[80px]'
            if (key === 'likes' || key === 'comments' || key === 'repins' || key === 'pins' || key === 'pinCount') return 'min-w-[70px]'
            if (key === 'followers' || key === 'followerCount' || key === 'collaborators') return 'min-w-[80px]'
            if (key === 'fileSize' || key === 'size' || key === 'dimensions') return 'min-w-[75px]'
            
            // Date columns
            if (key === 'createdAt' || key === 'updatedAt' || key === 'created' || key === 'updated') return 'min-w-[90px]'
            
            // Default
            return 'min-w-[80px]'
          }

          return (
            <div 
              key={column.key}
              className={cn(
                "flex items-center gap-0.5 relative flex-shrink-0",
                getColumnWidth(column.key)
              )}
            >
              <span className="text-xs font-medium text-gray-500 uppercase tracking-wider truncate">
                {column.label}
              </span>
              
              {/* Sort Icon */}
              {column.sortable && onSortClick && (
                <button
                  onClick={() => onSortClick(column.key)}
                  className={cn(
                    "ml-1 transition-colors flex-shrink-0",
                    sortColumn === column.key ? "text-blue-600" : "text-gray-400 hover:text-gray-600"
                  )}
                  title={`Sort by ${column.label}`}
                >
                  <svg className="h-3 w-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    {sortColumn === column.key && sortDirection === 'desc' ? (
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                    ) : (
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 15l7-7 7 7" />
                    )}
                  </svg>
                </button>
              )}

              {/* Filter Icon */}
              {column.hasFilter && onFilterClick && onColumnFilterChange && (
                <>
                  <button
                    ref={(el) => { filterButtonRefs.current[column.key] = el }}
                    onClick={() => onFilterClick(column.key)}
                    className={cn(
                      "ml-1 p-1 rounded-md transition-all duration-200 flex-shrink-0",
                      activeColumnFilter === column.key 
                        ? "bg-blue-50 text-blue-600 shadow-sm border border-blue-200" 
                        : hasActiveFilter
                          ? "bg-blue-50 text-blue-600 shadow-sm border border-blue-200"
                          : "text-gray-400 hover:text-gray-600 hover:bg-gray-50"
                    )}
                    title={`Filter ${column.label}`}
                  >
                    <Filter className="h-3 w-3" />
                  </button>

                  {/* Filter Dropdown */}
                  {activeColumnFilter === column.key && (
                    <div 
                      ref={(el) => { dropdownRefs.current[column.key] = el }}
                      className="bg-white border border-gray-200 rounded-xl shadow-xl column-filter-dropdown backdrop-blur-sm"
                      style={{
                        zIndex: 999999,
                        maxHeight: '320px',
                        overflowY: 'auto',
                        transform: 'translateZ(0)',
                        boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.08), 0 10px 10px -5px rgba(0, 0, 0, 0.04)',
                        minWidth: '220px',
                        maxWidth: '320px'
                      }}
                    >
                      <div className="p-4">
                        {filterType === 'text' && (
                          <div className="space-y-3">
                            <input
                              type="text"
                              placeholder={`Filter ${column.label.toLowerCase()}...`}
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
                              <option value="">All {column.label}</option>
                              {options.map(option => (
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
                              {options.map(option => (
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
                                onClick={() => onColumnFilterChange(column.key, '>100')}
                                className="text-sm px-3 py-2 bg-gradient-to-r from-gray-50 to-gray-100 hover:from-blue-50 hover:to-indigo-50 rounded-lg border border-gray-200 hover:border-blue-300 transition-all duration-200 hover:shadow-sm text-black"
                              >
                                &gt;100
                              </button>
                              <button
                                onClick={() => onColumnFilterChange(column.key, '>500')}
                                className="text-sm px-3 py-2 bg-gradient-to-r from-gray-50 to-gray-100 hover:from-blue-50 hover:to-indigo-50 rounded-lg border border-gray-200 hover:border-blue-300 transition-all duration-200 hover:shadow-sm text-black"
                              >
                                &gt;500
                              </button>
                              <button
                                onClick={() => onColumnFilterChange(column.key, '<100')}
                                className="text-sm px-3 py-2 bg-gradient-to-r from-gray-50 to-gray-100 hover:from-blue-50 hover:to-indigo-50 rounded-lg border border-gray-200 hover:border-blue-300 transition-all duration-200 hover:shadow-sm text-black"
                              >
                                &lt;100
                              </button>
                              <button
                                onClick={() => onColumnFilterChange(column.key, '<500')}
                                className="text-sm px-3 py-2 bg-gradient-to-r from-gray-50 to-gray-100 hover:from-blue-50 hover:to-indigo-50 rounded-lg border border-gray-200 hover:border-blue-300 transition-all duration-200 hover:shadow-sm text-black"
                              >
                                &lt;500
                              </button>
                            </div>
                            <input
                              type="text"
                              placeholder={`Custom filter (e.g., >100, <500, =200)`}
                              value={columnFilters[column.key] as string || ''}
                              onChange={(e) => onColumnFilterChange(column.key, e.target.value)}
                              className="w-full text-sm border border-gray-200 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200 bg-gray-50 hover:bg-white focus:bg-white text-black"
                              autoFocus
                            />
                          </div>
                        )}
                        
                        {filterType === 'date' && (
                          <div className="space-y-4">
                            <div className="text-sm font-semibold text-black mb-2">FILTER OPTIONS:</div>
                            <div className="grid grid-cols-2 gap-2">
                              <button
                                onClick={() => {
                                  const today = new Date().toISOString().split('T')[0]
                                  onColumnFilterChange(column.key, today)
                                }}
                                className="text-sm px-3 py-2 bg-gradient-to-r from-gray-50 to-gray-100 hover:from-blue-50 hover:to-indigo-50 rounded-lg border border-gray-200 hover:border-blue-300 transition-all duration-200 hover:shadow-sm text-black"
                              >
                                Today
                              </button>
                              <button
                                onClick={() => {
                                  const yesterday = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString().split('T')[0]
                                  onColumnFilterChange(column.key, yesterday)
                                }}
                                className="text-sm px-3 py-2 bg-gradient-to-r from-gray-50 to-gray-100 hover:from-blue-50 hover:to-indigo-50 rounded-lg border border-gray-200 hover:border-blue-300 transition-all duration-200 hover:shadow-sm text-black"
                              >
                                Yesterday
                              </button>
                              <button
                                onClick={() => {
                                  const lastWeek = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]
                                  onColumnFilterChange(column.key, lastWeek)
                                }}
                                className="text-sm px-3 py-2 bg-gradient-to-r from-gray-50 to-gray-100 hover:from-blue-50 hover:to-indigo-50 rounded-lg border border-gray-200 hover:border-blue-300 transition-all duration-200 hover:shadow-sm text-black"
                              >
                                Last Week
                              </button>
                              <button
                                onClick={() => {
                                  const lastMonth = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]
                                  onColumnFilterChange(column.key, lastMonth)
                                }}
                                className="text-sm px-3 py-2 bg-gradient-to-r from-gray-50 to-gray-100 hover:from-blue-50 hover:to-indigo-50 rounded-lg border border-gray-200 hover:border-blue-300 transition-all duration-200 hover:shadow-sm text-black"
                              >
                                Last Month
                              </button>
                            </div>
                            <input
                              type="date"
                              value={columnFilters[column.key] as string || ''}
                              onChange={(e) => onColumnFilterChange(column.key, e.target.value)}
                              className="w-full text-sm border border-gray-200 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200 bg-gray-50 hover:bg-white focus:bg-white text-black"
                            />
                          </div>
                        )}
                        
                        <div className="mt-4 pt-3 border-t border-gray-100">
                          <button
                            onClick={() => {
                              if (filterType === 'text' || filterType === 'date' || filterType === 'numeric') {
                                onColumnFilterChange(column.key, '')
                              } else {
                                onColumnFilterChange(column.key, [])
                              }
                              onFilterClick(column.key)
                            }}
                            className="text-sm text-black hover:text-gray-700 hover:bg-gray-50 px-2 py-1 rounded-md transition-all duration-200"
                          >
                            Clear
                          </button>
                        </div>
                      </div>
                    </div>
                  )}
                </>
              )}
            </div>
          )
        })}
      </div>
    </div>
  )
}

