'use client'

import { cn } from '@/lib/utils'
import CardsPerRowDropdown from './CardsPerRowDropdown'
import { useEffect, useRef, useState } from 'react'

interface GridCardFilterHeaderProps {
  selectedProducts: string[]
  currentProducts: any[]
  onSelectAll: () => void
  activeColumnFilter: string | null
  columnFilters: Record<string, any>
  onFilterClick: (column: string) => void
  onColumnFilterChange: (column: string, value: any) => void
  getUniqueValues: (field: string) => string[]
  cardsPerRow?: number
  onCardsPerRowChange?: (value: number) => void
}

export default function GridCardFilterHeader({
  selectedProducts,
  currentProducts,
  onSelectAll,
  activeColumnFilter,
  columnFilters,
  onFilterClick,
  onColumnFilterChange,
  getUniqueValues,
  cardsPerRow = 4,
  onCardsPerRowChange
}: GridCardFilterHeaderProps) {
  const [dropdownPosition, setDropdownPosition] = useState<{ x: number; y: number } | null>(null)
  const activeButtonRef = useRef<HTMLButtonElement>(null)
  const dropdownRef = useRef<HTMLDivElement>(null)
  


  // Calculate dropdown position when active filter changes
  useEffect(() => {
    if (activeColumnFilter && activeButtonRef.current) {
      const calculatePosition = () => {
        const buttonRect = activeButtonRef.current?.getBoundingClientRect()
        if (!buttonRect) return

        const viewportWidth = window.innerWidth
        const viewportHeight = window.innerHeight
        const dropdownWidth = 280
        const dropdownHeight = 320

        // Calculate optimal position
        let x = buttonRect.left
        let y = buttonRect.bottom + 5

        // Adjust horizontal position if dropdown would go off-screen
        if (x + dropdownWidth > viewportWidth) {
          x = viewportWidth - dropdownWidth - 10
        }
        if (x < 10) {
          x = 10
        }

        // Adjust vertical position if dropdown would go off-screen
        if (y + dropdownHeight > viewportHeight) {
          y = buttonRect.top - dropdownHeight - 5
        }
        if (y < 10) {
          y = 10
        }

        setDropdownPosition({ x, y })
      }

      calculatePosition()

      // Recalculate on scroll and resize
      const handleScroll = () => calculatePosition()
      const handleResize = () => calculatePosition()

      window.addEventListener('scroll', handleScroll, true)
      window.addEventListener('resize', handleResize)

      return () => {
        window.removeEventListener('scroll', handleScroll, true)
        window.removeEventListener('resize', handleResize)
      }
    } else {
      setDropdownPosition(null)
    }
  }, [activeColumnFilter])

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (activeColumnFilter && 
          activeButtonRef.current && 
          !activeButtonRef.current.contains(event.target as Node) &&
          dropdownRef.current && 
          !dropdownRef.current.contains(event.target as Node)) {
        onFilterClick('')
      }
    }

    if (activeColumnFilter) {
      document.addEventListener('mousedown', handleClickOutside)
      return () => document.removeEventListener('mousedown', handleClickOutside)
    }
  }, [activeColumnFilter, onFilterClick])

  const renderFilterDropdown = (column: string, filterType: string, options?: string[]) => {
    if (activeColumnFilter !== column || !dropdownPosition) return null

    return (
      <div 
        ref={dropdownRef}
        className="fixed bg-white border border-gray-200 rounded-xl shadow-xl z-[999999] column-filter-dropdown backdrop-blur-sm"
        style={{
          position: 'fixed',
          zIndex: 999999,
          maxHeight: '320px',
          overflowY: 'auto',
          transform: 'translateZ(0)',
          boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.08), 0 10px 10px -5px rgba(0, 0, 0, 0.04), 0 0 0 1px rgba(255, 255, 255, 0.05)',
          minWidth: '220px',
          maxWidth: '320px',
          left: `${dropdownPosition.x}px`,
          top: `${dropdownPosition.y}px`
        }}>
        <div className="p-4">
          {filterType === 'text' && (
            <div className="space-y-3">
              <input
                type="text"
                placeholder={`Filter ${column}...`}
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
                <option value="">All {column}</option>
                {options?.map(option => (
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
                {options?.map(option => (
                  <option key={option} value={option}>{option}</option>
                ))}
              </select>
            </div>
          )}
          
          {/* Enhanced numeric filtering for price and inventory */}
          {(filterType === 'numeric' || column === 'price' || column === 'inventoryQuantity') && (
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
                if (filterType === 'text' || filterType === 'date' || filterType === 'numeric' || column === 'price' || column === 'inventoryQuantity') {
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
    )
  }

    return (
    <div className="bg-gray-50 border-b border-gray-200 px-4 py-2">
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-6">
          {/* Product Column with Filter */}
          <div className="flex items-center space-x-2 relative">
            <input
              type="checkbox"
              checked={selectedProducts.length === currentProducts.length && currentProducts.length > 0}
              onChange={onSelectAll}
              className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
            />
            <span className="text-xs font-medium text-gray-500 uppercase tracking-wider">
              PRODUCT
            </span>
            <button
              ref={activeColumnFilter === 'title' ? activeButtonRef : null}
              onClick={() => onFilterClick('title')}
              className={cn(
                "ml-1 p-1 rounded-md hover:bg-gray-100 transition-all duration-200 hover:scale-105",
                activeColumnFilter === 'title' ? "bg-gradient-to-r from-blue-50 to-indigo-50 text-blue-600 shadow-sm border border-blue-200" : "text-gray-400",
                columnFilters.title ? "text-blue-600 bg-gradient-to-r from-blue-50 to-indigo-50 shadow-sm border border-blue-200" : "text-gray-400"
              )}
            >
              <svg className="h-3 w-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.207A1 1 0 013 6.5V4z" />
              </svg>
            </button>
            {renderFilterDropdown('title', 'text')}
          </div>

          {/* Status Column */}
          <div className="flex items-center space-x-1 relative">
            <span className="text-xs font-medium text-gray-500 uppercase tracking-wider">
              STATUS
            </span>
            <button
              ref={activeColumnFilter === 'status' ? activeButtonRef : null}
              onClick={() => onFilterClick('status')}
              className={cn(
                "ml-1 p-1 rounded-md hover:bg-gray-100 transition-all duration-200 hover:scale-105",
                activeColumnFilter === 'status' ? "bg-gradient-to-r from-blue-50 to-indigo-50 text-blue-600 shadow-sm border border-blue-200" : "text-gray-400",
                columnFilters.status?.length > 0 ? "text-blue-600 bg-gradient-to-r from-blue-50 to-indigo-50 shadow-sm border border-blue-200" : "text-gray-400"
              )}
            >
              <svg className="h-3 w-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.207A1 1 0 013 6.5V4z" />
              </svg>
            </button>
            {renderFilterDropdown('status', 'select', ['active', 'draft', 'archived'])}
          </div>

          {/* Inventory Column */}
          <div className="flex items-center space-x-1 relative">
            <span className="text-xs font-medium text-gray-500 uppercase tracking-wider">
              INVENTORY
            </span>
            <button
              ref={activeColumnFilter === 'inventoryQuantity' ? activeButtonRef : null}
              onClick={() => onFilterClick('inventoryQuantity')}
              className={cn(
                "ml-1 p-1 rounded-md hover:bg-gray-100 transition-all duration-200 hover:scale-105",
                activeColumnFilter === 'inventoryQuantity' ? "bg-gradient-to-r from-blue-50 to-indigo-50 text-blue-600 shadow-sm border border-blue-200" : "text-gray-400",
                columnFilters.inventoryQuantity ? "text-blue-600 bg-gradient-to-r from-blue-50 to-indigo-50 shadow-sm border border-blue-200" : "text-gray-400"
              )}
            >
              <svg className="h-3 w-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.207A1 1 0 013 6.5V4z" />
              </svg>
            </button>
            {renderFilterDropdown('inventoryQuantity', 'numeric')}
          </div>

          {/* Price Column */}
          <div className="flex items-center space-x-1 relative">
            <span className="text-xs font-medium text-gray-500 uppercase tracking-wider">
              PRICE
            </span>
            <button
              ref={activeColumnFilter === 'price' ? activeButtonRef : null}
              onClick={() => onFilterClick('price')}
              className={cn(
                "ml-1 p-1 rounded-md hover:bg-gray-100 transition-all duration-200 hover:scale-105",
                activeColumnFilter === 'price' ? "bg-gradient-to-r from-blue-50 to-indigo-50 text-blue-600 shadow-sm border border-blue-200" : "text-gray-400",
                columnFilters.price ? "text-blue-600 bg-gradient-to-r from-blue-50 to-indigo-50 shadow-sm border border-blue-200" : "text-gray-400"
              )}
            >
              <svg className="h-3 w-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.207A1 1 0 013 6.5V4z" />
              </svg>
            </button>
            {renderFilterDropdown('price', 'numeric')}
          </div>

          {/* Type Column */}
          <div className="flex items-center space-x-1 relative">
            <span className="text-xs font-medium text-gray-500 uppercase tracking-wider">
              TYPE
            </span>
            <button
              ref={activeColumnFilter === 'productType' ? activeButtonRef : null}
              onClick={() => onFilterClick('productType')}
              className={cn(
                "ml-1 p-1 rounded-md hover:bg-gray-100 transition-all duration-200 hover:scale-105",
                activeColumnFilter === 'productType' ? "bg-gradient-to-r from-blue-50 to-indigo-50 text-blue-600 shadow-sm border border-blue-200" : "text-gray-400",
                columnFilters.productType?.length > 0 ? "text-blue-600 bg-gradient-to-r from-blue-50 to-indigo-50 shadow-sm border border-blue-200" : "text-gray-400"
              )}
            >
              <svg className="h-3 w-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.207A1 1 0 013 6.5V4z" />
              </svg>
            </button>
            {renderFilterDropdown('productType', 'multi-select', getUniqueValues('productType'))}
          </div>

          {/* Vendor Column */}
          <div className="flex items-center space-x-1 relative">
            <span className="text-xs font-medium text-gray-500 uppercase tracking-wider">
              VENDOR
            </span>
            <button
              ref={activeColumnFilter === 'vendor' ? activeButtonRef : null}
              onClick={() => onFilterClick('vendor')}
              className={cn(
                "ml-1 p-1 rounded-md hover:bg-gray-100 transition-all duration-200 hover:scale-105",
                activeColumnFilter === 'vendor' ? "bg-gradient-to-r from-blue-50 to-indigo-50 text-blue-600 shadow-sm border border-blue-200" : "text-gray-400",
                columnFilters.vendor?.length > 0 ? "text-blue-600 bg-gradient-to-r from-blue-50 to-indigo-50 shadow-sm border border-blue-200" : "text-gray-400"
              )}
            >
              <svg className="h-3 w-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.207A1 1 0 013 6.5V4z" />
              </svg>
            </button>
            {renderFilterDropdown('vendor', 'multi-select', getUniqueValues('vendor'))}
          </div>

          {/* Category Column */}
          <div className="flex items-center space-x-1 relative">
            <span className="text-xs font-medium text-gray-500 uppercase tracking-wider">
              CATEGORY
            </span>
            <button
              ref={activeColumnFilter === 'category' ? activeButtonRef : null}
              onClick={() => onFilterClick('category')}
              className={cn(
                "ml-1 p-1 rounded-md hover:bg-gray-100 transition-all duration-200 hover:scale-105",
                activeColumnFilter === 'category' ? "bg-gradient-to-r from-blue-50 to-indigo-50 text-blue-600 shadow-sm border border-blue-200" : "text-gray-400",
                columnFilters.category?.length > 0 ? "text-blue-600 bg-gradient-to-r from-blue-50 to-indigo-50 shadow-sm border border-blue-200" : "text-gray-400"
              )}
            >
              <svg className="h-3 w-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.207A1 1 0 013 6.5V4z" />
              </svg>
            </button>
            {renderFilterDropdown('category', 'multi-select', getUniqueValues('category'))}
          </div>

          {/* Created Column */}
          <div className="flex items-center space-x-1 relative">
            <span className="text-xs font-medium text-gray-500 uppercase tracking-wider">
              CREATED
            </span>
            <button
              ref={activeColumnFilter === 'createdAt' ? activeButtonRef : null}
              onClick={() => onFilterClick('createdAt')}
              className={cn(
                "ml-1 p-1 rounded-md hover:bg-gray-100 transition-all duration-200 hover:scale-105",
                activeColumnFilter === 'createdAt' ? "bg-gradient-to-r from-blue-50 to-indigo-50 text-blue-600 shadow-sm border border-blue-200" : "text-gray-400",
                columnFilters.createdAt ? "text-blue-600 bg-gradient-to-r from-blue-50 to-indigo-50 shadow-sm border border-blue-200" : "text-gray-400"
              )}
            >
              <svg className="h-3 w-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.207A1 1 0 013 6.5V4z" />
              </svg>
            </button>
            {renderFilterDropdown('createdAt', 'date')}
          </div>

          {/* Updated Column */}
          <div className="flex items-center space-x-1 relative">
            <span className="text-xs font-medium text-gray-500 uppercase tracking-wider">
              UPDATED
            </span>
            <button
              ref={activeColumnFilter === 'updatedAt' ? activeButtonRef : null}
              onClick={() => onFilterClick('updatedAt')}
              className={cn(
                "ml-1 p-1 rounded-md hover:bg-gray-100 transition-all duration-200 hover:scale-105",
                activeColumnFilter === 'updatedAt' ? "bg-gradient-to-r from-blue-50 to-indigo-50 text-blue-600 shadow-sm border border-blue-200" : "text-gray-400",
                columnFilters.updatedAt ? "text-blue-600 bg-gradient-to-r from-blue-50 to-indigo-50 shadow-sm border border-blue-200" : "text-gray-400"
              )}
            >
              <svg className="h-3 w-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.207A1 1 0 013 6.5V4z" />
              </svg>
            </button>
            {renderFilterDropdown('updatedAt', 'date')}
          </div>
        </div>
        
        {/* Cards per row dropdown - only show if handler is provided */}
        {onCardsPerRowChange && (
          <CardsPerRowDropdown
            value={cardsPerRow}
            onChange={onCardsPerRowChange}
          />
        )}
      </div>
    </div>
  )
}
