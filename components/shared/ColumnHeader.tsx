'use client'

import { Filter } from 'lucide-react'
import { cn } from '@/lib/utils'
import { useEffect, useRef, useState } from 'react'

interface ColumnHeaderProps {
  title: string
  column: string
  hasFilter?: boolean
  filterType?: 'text' | 'select' | 'multi-select' | 'date'
  options?: string[]
  columnFilters: Record<string, any>
  activeColumnFilter: string | null
  onFilterClick: (column: string) => void
  onColumnFilterChange: (column: string, value: any) => void
  dropdownPosition?: 'left' | 'right'
}

export default function ColumnHeader({
  title,
  column,
  hasFilter = false,
  filterType = 'text',
  options = [],
  columnFilters,
  activeColumnFilter,
  onFilterClick,
  onColumnFilterChange,
  dropdownPosition = 'left'
}: ColumnHeaderProps) {
  const [dropdownDirection, setDropdownDirection] = useState<'left' | 'right'>('left')
  const [dropdownTop, setDropdownTop] = useState<'top' | 'bottom'>('bottom')
  const headerRef = useRef<HTMLTableCellElement>(null)
  const dropdownRef = useRef<HTMLDivElement>(null)

  const handleFilterClick = () => {
    onFilterClick(column)
  }

  // Calculate optimal dropdown position when it becomes active
  useEffect(() => {
    if (activeColumnFilter === column && headerRef.current && dropdownRef.current) {
      const calculatePosition = () => {
        if (!headerRef.current || !dropdownRef.current) return
        
        const headerRect = headerRef.current.getBoundingClientRect()
        const viewportWidth = window.innerWidth
        const viewportHeight = window.innerHeight
        
        // Calculate available space on right and left
        const spaceOnRight = viewportWidth - headerRect.right
        const spaceOnLeft = headerRect.left
        const dropdownWidth = 200 // Approximate dropdown width
        
        // Determine horizontal direction with better logic
        let newDirection: 'left' | 'right' = 'right'
        if (spaceOnRight < dropdownWidth && spaceOnLeft >= dropdownWidth) {
          newDirection = 'left'
        } else if (spaceOnRight >= dropdownWidth) {
          newDirection = 'right'
        } else if (spaceOnLeft >= dropdownWidth) {
          newDirection = 'left'
        } else {
          // If neither side has enough space, choose the side with more space
          newDirection = spaceOnRight > spaceOnLeft ? 'right' : 'left'
        }
        
        // Calculate available space below and above
        const spaceBelow = viewportHeight - headerRect.bottom
        const spaceAbove = headerRect.top
        const dropdownHeight = 300 // Approximate dropdown height
        
        // Determine vertical direction
        let newTop: 'top' | 'bottom' = 'bottom'
        if (spaceBelow < dropdownHeight && spaceAbove >= dropdownHeight) {
          newTop = 'top'
        } else if (spaceBelow >= dropdownHeight) {
          newTop = 'bottom'
        } else if (spaceAbove >= dropdownHeight) {
          newTop = 'top'
        } else {
          // If neither side has enough space, choose the side with more space
          newTop = spaceBelow > spaceAbove ? 'bottom' : 'top'
        }
        
        setDropdownDirection(newDirection)
        setDropdownTop(newTop)
        
        // Set fixed positioning for the dropdown
        const dropdown = dropdownRef.current
        if (dropdown) {
          dropdown.style.position = 'fixed'
          dropdown.style.zIndex = '999999'
          
          // Calculate fixed position coordinates
          let left: number
          if (newDirection === 'right') {
            left = headerRect.right
          } else {
            left = headerRect.left - dropdownWidth
          }
          
          let top: number
          if (newTop === 'bottom') {
            top = headerRect.bottom + 5
          } else {
            top = headerRect.top - dropdownHeight - 5
          }
          
          // Ensure dropdown stays within viewport bounds
          left = Math.max(10, Math.min(left, viewportWidth - dropdownWidth - 10))
          top = Math.max(10, Math.min(top, viewportHeight - dropdownHeight - 10))
          
          dropdown.style.left = `${left}px`
          dropdown.style.top = `${top}px`
        }
      }
      
      // Calculate position immediately
      calculatePosition()
      
      // Recalculate on scroll and resize
      const handleScroll = () => {
        if (activeColumnFilter === column) {
          calculatePosition()
        }
      }
      
      const handleResize = () => {
        if (activeColumnFilter === column) {
          calculatePosition()
        }
      }
      
      window.addEventListener('scroll', handleScroll, true)
      window.addEventListener('resize', handleResize)
      
      return () => {
        window.removeEventListener('scroll', handleScroll, true)
        window.removeEventListener('resize', handleResize)
      }
    }
  }, [activeColumnFilter, column])

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (activeColumnFilter === column && 
          headerRef.current && 
          !headerRef.current.contains(event.target as Node) &&
          dropdownRef.current && 
          !dropdownRef.current.contains(event.target as Node)) {
        onFilterClick('')
      }
    }

    if (activeColumnFilter === column) {
      document.addEventListener('mousedown', handleClickOutside)
      return () => document.removeEventListener('mousedown', handleClickOutside)
    }
  }, [activeColumnFilter, column, onFilterClick])

  return (
    <th ref={headerRef} className="px-2 py-1.5 text-left text-xs font-medium text-gray-500 uppercase tracking-wider border-r border-gray-200 relative">
      <div className="flex items-center justify-between">
        <span>{title}</span>
        {hasFilter && (
          <div className="relative">
            <button
              onClick={handleFilterClick}
              className={cn(
                "ml-1 p-1 rounded-md transition-all duration-200 hover:scale-105",
                activeColumnFilter === column 
                  ? "bg-gradient-to-r from-blue-50 to-indigo-50 text-blue-600 shadow-sm border border-blue-200" 
                  : "text-gray-400 hover:text-gray-600 hover:bg-gray-50",
                columnFilters[column] && 
                (typeof columnFilters[column] === 'string' ? 
                  (columnFilters[column] as string) : 
                  Array.isArray(columnFilters[column]) ?
                    (columnFilters[column] as string[])?.length > 0 :
                    (columnFilters[column] as any)?.min || (columnFilters[column] as any)?.max || (columnFilters[column] as any)?.start || (columnFilters[column] as any)?.end
                ) ? "text-blue-600 bg-gradient-to-r from-blue-50 to-indigo-50 shadow-sm border border-blue-200" : "text-gray-400"
              )}
            >
              <Filter className="h-3 w-3" />
            </button>
            
            {/* Enhanced Filter Dropdown */}
            {activeColumnFilter === column && (
              <div 
                ref={dropdownRef}
                className="bg-white border border-gray-200 rounded-xl shadow-xl column-filter-dropdown backdrop-blur-sm"
                style={{
                  zIndex: 999999,
                  maxHeight: '320px',
                  overflowY: 'auto',
                  transform: 'translateZ(0)',
                  boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.08), 0 10px 10px -5px rgba(0, 0, 0, 0.04), 0 0 0 1px rgba(255, 255, 255, 0.05)',
                  minWidth: '220px',
                  maxWidth: '320px'
                }}
              >
                <div className="p-4">
                  {filterType === 'text' && (
                    <div className="space-y-3">
                      <input
                        type="text"
                        placeholder={`Filter ${title.toLowerCase()}...`}
                        value={columnFilters[column] as string || ''}
                        onChange={(e) => onColumnFilterChange(column, e.target.value)}
                        className="w-full text-sm border border-gray-200 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200 bg-gray-50 hover:bg-white focus:bg-white text-black"
                        autoFocus
                      />
                    </div>
                  )}
                  
                  {filterType === 'select' && (
                    <div className="space-y-3">
                      <select
                        value={columnFilters[column] as string || ''}
                        onChange={(e) => onColumnFilterChange(column, e.target.value)}
                        className="w-full text-sm border border-gray-200 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200 bg-gray-50 hover:bg-white focus:bg-white text-black"
                      >
                        <option value="">All {title}</option>
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
                        value={columnFilters[column] as string[] || []}
                        onChange={(e) => {
                          const selected = Array.from(e.target.selectedOptions, option => option.value)
                          onColumnFilterChange(column, selected)
                        }}
                        className="w-full text-sm border border-gray-200 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200 bg-gray-50 hover:bg-white focus:bg-white min-h-[80px] text-black"
                      >
                        {options.map(option => (
                          <option key={option} value={option}>{option}</option>
                        ))}
                      </select>
                    </div>
                  )}
                  
                  {/* Enhanced numeric filtering for price and inventory */}
                  {(column === 'price' || column === 'inventoryQuantity') && (
                    <div className="space-y-4">
                      <div className="text-sm font-semibold text-black mb-2">FILTER OPTIONS:</div>
                      <div className="grid grid-cols-2 gap-2">
                        <button
                          onClick={() => onColumnFilterChange(column, '>100')}
                          className="text-sm px-3 py-2 bg-gradient-to-r from-gray-50 to-gray-100 hover:from-blue-50 hover:to-indigo-50 rounded-lg border border-gray-200 hover:border-blue-300 transition-all duration-200 hover:shadow-sm text-black"
                        >
                          &gt;100
                        </button>
                        <button
                          onClick={() => onColumnFilterChange(column, '>500')}
                          className="text-sm px-3 py-2 bg-gradient-to-r from-gray-50 to-gray-100 hover:from-blue-50 hover:to-indigo-50 rounded-lg border border-gray-200 hover:border-blue-300 transition-all duration-200 hover:shadow-sm text-black"
                        >
                          &gt;500
                        </button>
                        <button
                          onClick={() => onColumnFilterChange(column, '<100')}
                          className="text-sm px-3 py-2 bg-gradient-to-r from-gray-50 to-gray-100 hover:from-blue-50 hover:to-indigo-50 rounded-lg border border-gray-200 hover:border-blue-300 transition-all duration-200 hover:shadow-sm text-black"
                        >
                          &lt;100
                        </button>
                        <button
                          onClick={() => onColumnFilterChange(column, '<500')}
                          className="text-sm px-3 py-2 bg-gradient-to-r from-gray-50 to-gray-100 hover:from-blue-50 hover:to-indigo-50 rounded-lg border border-gray-200 hover:border-blue-300 transition-all duration-200 hover:shadow-sm text-black"
                        >
                          &lt;500
                        </button>
                      </div>
                      <input
                        type="text"
                        placeholder={`Custom filter (e.g., >100, <500, =200)`}
                        value={columnFilters[column] as string || ''}
                        onChange={(e) => onColumnFilterChange(column, e.target.value)}
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
                            onColumnFilterChange(column, today)
                          }}
                          className="text-sm px-3 py-2 bg-gradient-to-r from-gray-50 to-gray-100 hover:from-blue-50 hover:to-indigo-50 rounded-lg border border-gray-200 hover:border-blue-300 transition-all duration-200 hover:shadow-sm text-black"
                        >
                          Today
                        </button>
                        <button
                          onClick={() => {
                            const yesterday = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString().split('T')[0]
                            onColumnFilterChange(column, yesterday)
                          }}
                          className="text-sm px-3 py-2 bg-gradient-to-r from-gray-50 to-gray-100 hover:from-blue-50 hover:to-indigo-50 rounded-lg border border-gray-200 hover:border-blue-300 transition-all duration-200 hover:shadow-sm text-black"
                        >
                          Yesterday
                        </button>
                        <button
                          onClick={() => {
                            const lastWeek = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]
                            onColumnFilterChange(column, lastWeek)
                          }}
                          className="text-sm px-3 py-2 bg-gradient-to-r from-gray-50 to-gray-100 hover:from-blue-50 hover:to-indigo-50 rounded-lg border border-gray-200 hover:border-blue-300 transition-all duration-200 hover:shadow-sm text-black"
                        >
                          Last Week
                        </button>
                        <button
                          onClick={() => {
                            const lastMonth = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]
                            onColumnFilterChange(column, lastMonth)
                          }}
                          className="text-sm px-3 py-2 bg-gradient-to-r from-gray-50 to-gray-100 hover:from-blue-50 hover:to-indigo-50 rounded-lg border border-gray-200 hover:border-blue-300 transition-all duration-200 hover:shadow-sm text-black"
                        >
                          Last Month
                        </button>
                        <button
                          onClick={() => {
                            const thisYear = new Date().getFullYear().toString() + '-01-01'
                            onColumnFilterChange(column, thisYear)
                          }}
                          className="text-sm px-3 py-2 bg-gradient-to-r from-gray-50 to-gray-100 hover:from-blue-50 hover:to-indigo-50 rounded-lg border border-gray-200 hover:border-blue-300 transition-all duration-200 hover:shadow-sm text-black"
                        >
                          This Year
                        </button>
                        <button
                          onClick={() => {
                            const lastYear = (new Date().getFullYear() - 1).toString() + '-01-01'
                            onColumnFilterChange(column, lastYear)
                          }}
                          className="text-sm px-3 py-2 bg-gradient-to-r from-gray-50 to-gray-100 hover:from-blue-50 hover:to-indigo-50 rounded-lg border border-gray-200 hover:border-blue-300 transition-all duration-200 hover:shadow-sm text-black"
                        >
                          Last Year
                        </button>
                        <button
                          onClick={() => {
                            onColumnFilterChange(column, '2024-06-11')
                          }}
                          className="text-sm px-3 py-2 bg-gradient-to-r from-gray-50 to-gray-100 hover:from-blue-50 hover:to-indigo-50 rounded-lg border border-gray-200 hover:border-blue-300 transition-all duration-200 hover:shadow-sm text-black"
                        >
                          Test Date
                        </button>
                      </div>
                      <input
                        type="date"
                        value={columnFilters[column] as string || ''}
                        onChange={(e) => onColumnFilterChange(column, e.target.value)}
                        className="w-full text-sm border border-gray-200 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200 bg-gray-50 hover:bg-white focus:bg-white text-black"
                      />
                      <div className="text-xs text-gray-500 mt-1">
                        Format: YYYY-MM-DD (e.g., 2024-06-11)
                      </div>
                    </div>
                  )}
                  
                  <div className="mt-4 pt-3 border-t border-gray-100">
                    <button
                      onClick={() => {
                        if (filterType === 'text' || filterType === 'date' || column === 'price' || column === 'inventoryQuantity') {
                          onColumnFilterChange(column, '')
                        } else {
                          onColumnFilterChange(column, [])
                        }
                        onFilterClick(column)
                      }}
                      className="text-sm text-black hover:text-gray-700 hover:bg-gray-50 px-2 py-1 rounded-md transition-all duration-200"
                    >
                      Clear
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </th>
  )
}