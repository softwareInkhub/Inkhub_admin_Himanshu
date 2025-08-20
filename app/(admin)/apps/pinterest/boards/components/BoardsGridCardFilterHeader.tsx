'use client'

import { useEffect, useRef, useState } from 'react'
import { cn } from '@/lib/utils'
import CardsPerRowDropdown from '@/app/(admin)/apps/shopify/products/components/CardsPerRowDropdown'

interface Props {
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

export default function BoardsGridCardFilterHeader({
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
}: Props) {
  const [dropdownPosition, setDropdownPosition] = useState<{ x: number; y: number } | null>(null)
  const activeButtonRef = useRef<HTMLButtonElement>(null)
  const dropdownRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (activeColumnFilter && activeButtonRef.current) {
      const calculatePosition = () => {
        const buttonRect = activeButtonRef.current?.getBoundingClientRect()
        if (!buttonRect) return
        const viewportWidth = window.innerWidth
        const viewportHeight = window.innerHeight
        const dropdownWidth = 280
        const dropdownHeight = 320
        let x = buttonRect.left
        let y = buttonRect.bottom + 5
        if (x + dropdownWidth > viewportWidth) x = viewportWidth - dropdownWidth - 10
        if (x < 10) x = 10
        if (y + dropdownHeight > viewportHeight) y = buttonRect.top - dropdownHeight - 5
        if (y < 10) y = 10
        setDropdownPosition({ x, y })
      }
      calculatePosition()
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

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        activeColumnFilter &&
        activeButtonRef.current &&
        !activeButtonRef.current.contains(event.target as Node) &&
        dropdownRef.current &&
        !dropdownRef.current.contains(event.target as Node)
      ) {
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
          boxShadow:
            '0 20px 25px -5px rgba(0, 0, 0, 0.08), 0 10px 10px -5px rgba(0, 0, 0, 0.04), 0 0 0 1px rgba(255, 255, 255, 0.05)',
          minWidth: '220px',
          maxWidth: '320px',
          left: `${dropdownPosition.x}px`,
          top: `${dropdownPosition.y}px`,
        }}
      >
        <div className="p-4">
          {filterType === 'text' && (
            <div className="space-y-3">
              <input
                type="text"
                placeholder={`Filter ${column}...`}
                value={(columnFilters[column] as string) || ''}
                onChange={(e) => onColumnFilterChange(column, e.target.value)}
                className="w-full text-sm border border-gray-200 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200 bg-gray-50 hover:bg-white focus:bg-white text-black"
                autoFocus
              />
            </div>
          )}

          {filterType === 'select' && (
            <div className="space-y-3">
              <select
                value={(columnFilters[column] as string) || ''}
                onChange={(e) => onColumnFilterChange(column, e.target.value)}
                className="w-full text-sm border border-gray-200 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200 bg-gray-50 hover:bg-white focus:bg-white text-black"
              >
                <option value="">All {column}</option>
                {options?.map((option) => (
                  <option key={option} value={option}>
                    {option}
                  </option>
                ))}
              </select>
            </div>
          )}

          {filterType === 'multi-select' && (
            <div className="space-y-3">
              <select
                multiple
                value={(columnFilters[column] as string[]) || []}
                onChange={(e) => {
                  const selected = Array.from(e.target.selectedOptions, (option) => option.value)
                  onColumnFilterChange(column, selected)
                }}
                className="w-full text-sm border border-gray-200 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200 bg-gray-50 hover:bg-white focus:bg-white min-h-[80px] text-black"
              >
                {options?.map((option) => (
                  <option key={option} value={option}>
                    {option}
                  </option>
                ))}
              </select>
            </div>
          )}

          {filterType === 'numeric' && (
            <div className="space-y-4">
              <div className="text-sm font-semibold text-black mb-2">FILTER OPTIONS:</div>
              <input
                type="text"
                placeholder={`Custom filter (e.g., >100, <500, =200)`}
                value={(columnFilters[column] as string) || ''}
                onChange={(e) => onColumnFilterChange(column, e.target.value)}
                className="w-full text-sm border border-gray-200 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200 bg-gray-50 hover:bg-white focus:bg-white text-black"
                autoFocus
              />
            </div>
          )}

          {filterType === 'date' && (
            <div className="space-y-4">
              <input
                type="date"
                value={(columnFilters[column] as string) || ''}
                onChange={(e) => onColumnFilterChange(column, e.target.value)}
                className="w-full text-sm border border-gray-200 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200 bg-gray-50 hover:bg-white focus:bg-white text-black"
              />
            </div>
          )}

          <div className="mt-4 pt-3 border-t border-gray-100">
            <button
              onClick={() => {
                onColumnFilterChange(column, Array.isArray(columnFilters[column]) ? [] : '')
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
          {/* Checkbox + BOARD */}
          <div className="flex items-center space-x-2 relative">
            <input
              type="checkbox"
              checked={selectedProducts.length === currentProducts.length && currentProducts.length > 0}
              onChange={onSelectAll}
              className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
            />
            <span className="text-xs font-medium text-gray-500 uppercase tracking-wider">BOARD</span>
            <button
              ref={activeColumnFilter === 'board' ? activeButtonRef : null}
              onClick={() => onFilterClick('board')}
              className={cn(
                'ml-1 p-1 rounded-md hover:bg-gray-100 transition-all duration-200 hover:scale-105',
                activeColumnFilter === 'board'
                  ? 'bg-gradient-to-r from-blue-50 to-indigo-50 text-blue-600 shadow-sm border border-blue-200'
                  : 'text-gray-400',
                columnFilters.board ? 'text-blue-600 bg-gradient-to-r from-blue-50 to-indigo-50 shadow-sm border border-blue-200' : 'text-gray-400'
              )}
            >
              <svg className="h-3 w-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.207A1 1 0 013 6.5V4z" />
              </svg>
            </button>
            {renderFilterDropdown('board', 'text')}
          </div>

          {/* STATUS */}
          <div className="flex items-center space-x-1 relative">
            <span className="text-xs font-medium text-gray-500 uppercase tracking-wider">STATUS</span>
            <button
              ref={activeColumnFilter === 'status' ? activeButtonRef : null}
              onClick={() => onFilterClick('status')}
              className={cn(
                'ml-1 p-1 rounded-md hover:bg-gray-100 transition-all duration-200 hover:scale-105',
                activeColumnFilter === 'status'
                  ? 'bg-gradient-to-r from-blue-50 to-indigo-50 text-blue-600 shadow-sm border border-blue-200'
                  : 'text-gray-400',
                columnFilters.status ? 'text-blue-600 bg-gradient-to-r from-blue-50 to-indigo-50 shadow-sm border border-blue-200' : 'text-gray-400'
              )}
            >
              <svg className="h-3 w-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.207A1 1 0 013 6.5V4z" />
              </svg>
            </button>
            {renderFilterDropdown('status', 'select', ['active', 'archived'])}
          </div>

          {/* PRIVACY */}
          <div className="flex items-center space-x-1 relative">
            <span className="text-xs font-medium text-gray-500 uppercase tracking-wider">PRIVACY</span>
            <button
              ref={activeColumnFilter === 'privacy' ? activeButtonRef : null}
              onClick={() => onFilterClick('privacy')}
              className={cn(
                'ml-1 p-1 rounded-md hover:bg-gray-100 transition-all duration-200 hover:scale-105',
                activeColumnFilter === 'privacy'
                  ? 'bg-gradient-to-r from-blue-50 to-indigo-50 text-blue-600 shadow-sm border border-blue-200'
                  : 'text-gray-400',
                columnFilters.privacy ? 'text-blue-600 bg-gradient-to-r from-blue-50 to-indigo-50 shadow-sm border border-blue-200' : 'text-gray-400'
              )}
            >
              <svg className="h-3 w-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.207A1 1 0 013 6.5V4z" />
              </svg>
            </button>
            {renderFilterDropdown('privacy', 'select', ['public', 'private'])}
          </div>

          {/* CATEGORY */}
          <div className="flex items-center space-x-1 relative">
            <span className="text-xs font-medium text-gray-500 uppercase tracking-wider">CATEGORY</span>
            <button
              ref={activeColumnFilter === 'category' ? activeButtonRef : null}
              onClick={() => onFilterClick('category')}
              className={cn(
                'ml-1 p-1 rounded-md hover:bg-gray-100 transition-all duration-200 hover:scale-105',
                activeColumnFilter === 'category'
                  ? 'bg-gradient-to-r from-blue-50 to-indigo-50 text-blue-600 shadow-sm border border-blue-200'
                  : 'text-gray-400',
                Array.isArray(columnFilters.category) && columnFilters.category.length > 0
                  ? 'text-blue-600 bg-gradient-to-r from-blue-50 to-indigo-50 shadow-sm border border-blue-200'
                  : 'text-gray-400'
              )}
            >
              <svg className="h-3 w-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.207A1 1 0 013 6.5V4z" />
              </svg>
            </button>
            {renderFilterDropdown('category', 'multi-select', getUniqueValues('category'))}
          </div>

          {/* OWNER */}
          <div className="flex items-center space-x-1 relative">
            <span className="text-xs font-medium text-gray-500 uppercase tracking-wider">OWNER</span>
            <button
              ref={activeColumnFilter === 'owner' ? activeButtonRef : null}
              onClick={() => onFilterClick('owner')}
              className={cn(
                'ml-1 p-1 rounded-md hover:bg-gray-100 transition-all duration-200 hover:scale-105',
                activeColumnFilter === 'owner'
                  ? 'bg-gradient-to-r from-blue-50 to-indigo-50 text-blue-600 shadow-sm border border-blue-200'
                  : 'text-gray-400',
                Array.isArray(columnFilters.owner) && columnFilters.owner.length > 0
                  ? 'text-blue-600 bg-gradient-to-r from-blue-50 to-indigo-50 shadow-sm border border-blue-200'
                  : 'text-gray-400'
              )}
            >
              <svg className="h-3 w-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.207A1 1 0 013 6.5V4z" />
              </svg>
            </button>
            {renderFilterDropdown('owner', 'multi-select', getUniqueValues('owner'))}
          </div>

          {/* PINS */}
          <div className="flex items-center space-x-1 relative">
            <span className="text-xs font-medium text-gray-500 uppercase tracking-wider">PINS</span>
            <button
              ref={activeColumnFilter === 'pinCount' ? activeButtonRef : null}
              onClick={() => onFilterClick('pinCount')}
              className={cn(
                'ml-1 p-1 rounded-md hover:bg-gray-100 transition-all duration-200 hover:scale-105',
                activeColumnFilter === 'pinCount'
                  ? 'bg-gradient-to-r from-blue-50 to-indigo-50 text-blue-600 shadow-sm border border-blue-200'
                  : 'text-gray-400',
                columnFilters.pinCount ? 'text-blue-600 bg-gradient-to-r from-blue-50 to-indigo-50 shadow-sm border border-blue-200' : 'text-gray-400'
              )}
            >
              <svg className="h-3 w-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.207A1 1 0 013 6.5V4z" />
              </svg>
            </button>
            {renderFilterDropdown('pinCount', 'numeric')}
          </div>

          {/* FOLLOWERS */}
          <div className="flex items-center space-x-1 relative">
            <span className="text-xs font-medium text-gray-500 uppercase tracking-wider">FOLLOWERS</span>
            <button
              ref={activeColumnFilter === 'followers' ? activeButtonRef : null}
              onClick={() => onFilterClick('followers')}
              className={cn(
                'ml-1 p-1 rounded-md hover:bg-gray-100 transition-all duration-200 hover:scale-105',
                activeColumnFilter === 'followers'
                  ? 'bg-gradient-to-r from-blue-50 to-indigo-50 text-blue-600 shadow-sm border border-blue-200'
                  : 'text-gray-400',
                columnFilters.followers ? 'text-blue-600 bg-gradient-to-r from-blue-50 to-indigo-50 shadow-sm border border-blue-200' : 'text-gray-400'
              )}
            >
              <svg className="h-3 w-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.207A1 1 0 013 6.5V4z" />
              </svg>
            </button>
            {renderFilterDropdown('followers', 'numeric')}
          </div>

          {/* CREATED */}
          <div className="flex items-center space-x-1 relative">
            <span className="text-xs font-medium text-gray-500 uppercase tracking-wider">CREATED</span>
            <button
              ref={activeColumnFilter === 'createdAt' ? activeButtonRef : null}
              onClick={() => onFilterClick('createdAt')}
              className={cn(
                'ml-1 p-1 rounded-md hover:bg-gray-100 transition-all duration-200 hover:scale-105',
                activeColumnFilter === 'createdAt'
                  ? 'bg-gradient-to-r from-blue-50 to-indigo-50 text-blue-600 shadow-sm border border-blue-200'
                  : 'text-gray-400',
                columnFilters.createdAt ? 'text-blue-600 bg-gradient-to-r from-blue-50 to-indigo-50 shadow-sm border border-blue-200' : 'text-gray-400'
              )}
            >
              <svg className="h-3 w-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.207A1 1 0 013 6.5V4z" />
              </svg>
            </button>
            {renderFilterDropdown('createdAt', 'date')}
          </div>

          {/* UPDATED */}
          <div className="flex items-center space-x-1 relative">
            <span className="text-xs font-medium text-gray-500 uppercase tracking-wider">UPDATED</span>
            <button
              ref={activeColumnFilter === 'updatedAt' ? activeButtonRef : null}
              onClick={() => onFilterClick('updatedAt')}
              className={cn(
                'ml-1 p-1 rounded-md hover:bg-gray-100 transition-all duration-200 hover:scale-105',
                activeColumnFilter === 'updatedAt'
                  ? 'bg-gradient-to-r from-blue-50 to-indigo-50 text-blue-600 shadow-sm border border-blue-200'
                  : 'text-gray-400',
                columnFilters.updatedAt ? 'text-blue-600 bg-gradient-to-r from-blue-50 to-indigo-50 shadow-sm border border-blue-200' : 'text-gray-400'
              )}
            >
              <svg className="h-3 w-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.207A1 1 0 013 6.5V4z" />
              </svg>
            </button>
            {renderFilterDropdown('updatedAt', 'date')}
          </div>

          {/* TAGS */}
          <div className="flex items-center space-x-1 relative">
            <span className="text-xs font-medium text-gray-500 uppercase tracking-wider">TAGS</span>
            <button
              ref={activeColumnFilter === 'tags' ? activeButtonRef : null}
              onClick={() => onFilterClick('tags')}
              className={cn(
                'ml-1 p-1 rounded-md hover:bg-gray-100 transition-all duration-200 hover:scale-105',
                activeColumnFilter === 'tags'
                  ? 'bg-gradient-to-r from-blue-50 to-indigo-50 text-blue-600 shadow-sm border border-blue-200'
                  : 'text-gray-400',
                Array.isArray(columnFilters.tags) && columnFilters.tags.length > 0
                  ? 'text-blue-600 bg-gradient-to-r from-blue-50 to-indigo-50 shadow-sm border border-blue-200'
                  : 'text-gray-400'
              )}
            >
              <svg className="h-3 w-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.207A1 1 0 013 6.5V4z" />
              </svg>
            </button>
            {renderFilterDropdown('tags', 'multi-select', getUniqueValues('tags'))}
          </div>
        </div>

        {onCardsPerRowChange && (
          <CardsPerRowDropdown value={cardsPerRow} onChange={onCardsPerRowChange} />
        )}
      </div>
    </div>
  )
}


