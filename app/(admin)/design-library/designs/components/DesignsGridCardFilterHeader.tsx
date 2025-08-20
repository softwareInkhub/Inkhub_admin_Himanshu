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

export default function DesignsGridCardFilterHeader({
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
        const rect = activeButtonRef.current?.getBoundingClientRect()
        if (!rect) return
        const vw = window.innerWidth
        const vh = window.innerHeight
        const dw = 280
        const dh = 320
        let x = rect.left
        let y = rect.bottom + 5
        if (x + dw > vw) x = vw - dw - 10
        if (x < 10) x = 10
        if (y + dh > vh) y = rect.top - dh - 5
        if (y < 10) y = 10
        setDropdownPosition({ x, y })
      }
      calculatePosition()
      const onScroll = () => calculatePosition()
      const onResize = () => calculatePosition()
      window.addEventListener('scroll', onScroll, true)
      window.addEventListener('resize', onResize)
      return () => {
        window.removeEventListener('scroll', onScroll, true)
        window.removeEventListener('resize', onResize)
      }
    } else {
      setDropdownPosition(null)
    }
  }, [activeColumnFilter])

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (
        activeColumnFilter &&
        activeButtonRef.current &&
        !activeButtonRef.current.contains(e.target as Node) &&
        dropdownRef.current &&
        !dropdownRef.current.contains(e.target as Node)
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
          minWidth: '220px',
          maxWidth: '320px',
          left: `${dropdownPosition.x}px`,
          top: `${dropdownPosition.y}px`
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
                  const selected = Array.from(e.target.selectedOptions, (opt) => opt.value)
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

          <div className="mt-4 pt-3 border-top border-gray-100">
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

  const FilterButton = ({ column, active, highlighted }: { column: string; active: boolean; highlighted: boolean }) => (
    <button
      ref={activeColumnFilter === column ? activeButtonRef : null}
      onClick={() => onFilterClick(column)}
      className={cn(
        'ml-1 p-1 rounded-md hover:bg-gray-100 transition-all duration-200 hover:scale-105',
        active ? 'bg-gradient-to-r from-blue-50 to-indigo-50 text-blue-600 shadow-sm border border-blue-200' : 'text-gray-400',
        highlighted ? 'text-blue-600 bg-gradient-to-r from-blue-50 to-indigo-50 shadow-sm border border-blue-200' : 'text-gray-400'
      )}
    >
      <svg className="h-3 w-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.207A1 1 0 013 6.5V4z" />
      </svg>
    </button>
  )

  return (
    <div className="bg-gray-50 border-b border-gray-200 px-4 py-2">
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-6">
          {/* Checkbox + DESIGN (filter by name) */}
          <div className="flex items-center space-x-2 relative">
            <input
              type="checkbox"
              checked={selectedProducts.length === currentProducts.length && currentProducts.length > 0}
              onChange={onSelectAll}
              className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
            />
            <span className="text-xs font-medium text-gray-500 uppercase tracking-wider">DESIGN</span>
            <FilterButton column="name" active={activeColumnFilter === 'name'} highlighted={!!columnFilters.name} />
            {renderFilterDropdown('name', 'text')}
          </div>

          {/* STATUS */}
          <div className="flex items-center space-x-1 relative">
            <span className="text-xs font-medium text-gray-500 uppercase tracking-wider">STATUS</span>
            <FilterButton column="status" active={activeColumnFilter === 'status'} highlighted={!!columnFilters.status} />
            {renderFilterDropdown('status', 'select', getUniqueValues('status'))}
          </div>

          {/* TYPE */}
          <div className="flex items-center space-x-1 relative">
            <span className="text-xs font-medium text-gray-500 uppercase tracking-wider">TYPE</span>
            <FilterButton column="type" active={activeColumnFilter === 'type'} highlighted={Array.isArray(columnFilters.type) && columnFilters.type.length > 0} />
            {renderFilterDropdown('type', 'multi-select', getUniqueValues('type'))}
          </div>

          {/* CATEGORY */}
          <div className="flex items-center space-x-1 relative">
            <span className="text-xs font-medium text-gray-500 uppercase tracking-wider">CATEGORY</span>
            <FilterButton column="category" active={activeColumnFilter === 'category'} highlighted={Array.isArray(columnFilters.category) && columnFilters.category.length > 0} />
            {renderFilterDropdown('category', 'multi-select', getUniqueValues('category'))}
          </div>

          {/* PRICE */}
          <div className="flex items-center space-x-1 relative">
            <span className="text-xs font-medium text-gray-500 uppercase tracking-wider">PRICE</span>
            <FilterButton column="price" active={activeColumnFilter === 'price'} highlighted={!!columnFilters.price} />
            {renderFilterDropdown('price', 'numeric')}
          </div>

          {/* SIZE */}
          <div className="flex items-center space-x-1 relative">
            <span className="text-xs font-medium text-gray-500 uppercase tracking-wider">SIZE</span>
            <FilterButton column="size" active={activeColumnFilter === 'size'} highlighted={!!columnFilters.size} />
            {renderFilterDropdown('size', 'select', getUniqueValues('size'))}
          </div>

          {/* CLIENT */}
          <div className="flex items-center space-x-1 relative">
            <span className="text-xs font-medium text-gray-500 uppercase tracking-wider">CLIENT</span>
            <FilterButton column="client" active={activeColumnFilter === 'client'} highlighted={Array.isArray(columnFilters.client) && columnFilters.client.length > 0} />
            {renderFilterDropdown('client', 'multi-select', getUniqueValues('client'))}
          </div>

          {/* DESIGNER */}
          <div className="flex items-center space-x-1 relative">
            <span className="text-xs font-medium text-gray-500 uppercase tracking-wider">DESIGNER</span>
            <FilterButton column="designer" active={activeColumnFilter === 'designer'} highlighted={Array.isArray(columnFilters.designer) && columnFilters.designer.length > 0} />
            {renderFilterDropdown('designer', 'multi-select', getUniqueValues('designer'))}
          </div>

          {/* VIEWS */}
          <div className="flex items-center space-x-1 relative">
            <span className="text-xs font-medium text-gray-500 uppercase tracking-wider">VIEWS</span>
            <FilterButton column="views" active={activeColumnFilter === 'views'} highlighted={!!columnFilters.views} />
            {renderFilterDropdown('views', 'numeric')}
          </div>

          {/* DOWNLOADS */}
          <div className="flex items-center space-x-1 relative">
            <span className="text-xs font-medium text-gray-500 uppercase tracking-wider">DOWNLOADS</span>
            <FilterButton column="downloads" active={activeColumnFilter === 'downloads'} highlighted={!!columnFilters.downloads} />
            {renderFilterDropdown('downloads', 'numeric')}
          </div>

          {/* CREATED */}
          <div className="flex items-center space-x-1 relative">
            <span className="text-xs font-medium text-gray-500 uppercase tracking-wider">CREATED</span>
            <FilterButton column="createdAt" active={activeColumnFilter === 'createdAt'} highlighted={!!columnFilters.createdAt} />
            {renderFilterDropdown('createdAt', 'date')}
          </div>

          {/* UPDATED */}
          <div className="flex items-center space-x-1 relative">
            <span className="text-xs font-medium text-gray-500 uppercase tracking-wider">UPDATED</span>
            <FilterButton column="updatedAt" active={activeColumnFilter === 'updatedAt'} highlighted={!!columnFilters.updatedAt} />
            {renderFilterDropdown('updatedAt', 'date')}
          </div>

          {/* TAGS */}
          <div className="flex items-center space-x-1 relative">
            <span className="text-xs font-medium text-gray-500 uppercase tracking-wider">TAGS</span>
            <FilterButton column="tags" active={activeColumnFilter === 'tags'} highlighted={Array.isArray(columnFilters.tags) && columnFilters.tags.length > 0} />
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


