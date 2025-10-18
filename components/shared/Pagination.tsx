'use client'

import React, { useRef, useEffect, useState } from 'react'
import { 
  ChevronLeft, 
  ChevronRight, 
  ChevronsLeft, 
  ChevronsRight 
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { PaginationConfig } from './types'

interface PaginationProps extends PaginationConfig {
  className?: string
  itemType?: string  // Generic item type name (e.g., 'products', 'orders', 'items')
  scrollGroupId?: string  // For horizontal scroll synchronization
  tableScrollRef?: React.RefObject<HTMLDivElement>  // Reference to table for scroll sync
  showScrollbar?: boolean  // Whether to show the horizontal scrollbar
}

export default function Pagination({
  currentPage,
  totalPages,
  itemsPerPage,
  totalItems,
  onPageChange,
  onItemsPerPageChange,
  className,
  itemType = 'results',
  scrollGroupId,
  tableScrollRef,
  showScrollbar = false
}: PaginationProps) {
  const paginationScrollRef = useRef<HTMLDivElement>(null)
  const [scrollbarWidth, setScrollbarWidth] = useState('300%')

  // Update scrollbar width when table is loaded (for horizontal scroll sync)
  useEffect(() => {
    if (!showScrollbar || !tableScrollRef) return

    const updateScrollbarWidth = () => {
      const tableElement = tableScrollRef?.current
      
      if (tableElement) {
        const scrollWidth = tableElement.scrollWidth
        const clientWidth = tableElement.clientWidth
        
        if (scrollWidth > 0 && clientWidth > 0) {
          setScrollbarWidth(`${scrollWidth}px`)
        } else {
          setScrollbarWidth('300%')
        }
      } else {
        setScrollbarWidth('300%')
      }
    }

    // Initial update with multiple attempts to ensure table is loaded
    updateScrollbarWidth()
    const timeoutId1 = setTimeout(updateScrollbarWidth, 100)
    const timeoutId2 = setTimeout(updateScrollbarWidth, 500)
    const timeoutId3 = setTimeout(updateScrollbarWidth, 1000)
    const timeoutId4 = setTimeout(updateScrollbarWidth, 2000)

    // Update on resize
    const resizeObserver = new ResizeObserver(updateScrollbarWidth)
    const tableElement = tableScrollRef?.current
    if (tableElement) {
      resizeObserver.observe(tableElement)
    }

    return () => {
      clearTimeout(timeoutId1)
      clearTimeout(timeoutId2)
      clearTimeout(timeoutId3)
      clearTimeout(timeoutId4)
      resizeObserver.disconnect()
    }
  }, [showScrollbar, tableScrollRef])

  // Synchronize horizontal scroll between table and pagination
  useEffect(() => {
    if (!showScrollbar || !tableScrollRef) return

    const paginationElement = paginationScrollRef.current
    const tableElement = tableScrollRef?.current
    
    if (!paginationElement || !tableElement) return

    let isTableScrolling = false
    let isPaginationScrolling = false

    const handleTableScroll = () => {
      if (isPaginationScrolling) return
      isTableScrolling = true
      paginationElement.scrollLeft = tableElement.scrollLeft
      setTimeout(() => { isTableScrolling = false }, 10)
    }

    const handlePaginationScroll = () => {
      if (isTableScrolling) return
      isPaginationScrolling = true
      tableElement.scrollLeft = paginationElement.scrollLeft
      setTimeout(() => { isPaginationScrolling = false }, 10)
    }

    tableElement.addEventListener('scroll', handleTableScroll, { passive: true })
    paginationElement.addEventListener('scroll', handlePaginationScroll, { passive: true })

    return () => {
      tableElement.removeEventListener('scroll', handleTableScroll)
      paginationElement.removeEventListener('scroll', handlePaginationScroll)
    }
  }, [showScrollbar, tableScrollRef])
  const getPageNumbers = () => {
    const pages = []
    const maxVisiblePages = 5
    
    if (totalPages <= maxVisiblePages) {
      for (let i = 1; i <= totalPages; i++) {
        pages.push(i)
      }
    } else {
      if (currentPage <= 3) {
        for (let i = 1; i <= 4; i++) {
          pages.push(i)
        }
        pages.push('...')
        pages.push(totalPages)
      } else if (currentPage >= totalPages - 2) {
        pages.push(1)
        pages.push('...')
        for (let i = totalPages - 3; i <= totalPages; i++) {
          pages.push(i)
        }
      } else {
        pages.push(1)
        pages.push('...')
        for (let i = currentPage - 1; i <= currentPage + 1; i++) {
          pages.push(i)
        }
        pages.push('...')
        pages.push(totalPages)
      }
    }
    
    return pages
  }

  const startItem = (currentPage - 1) * itemsPerPage + 1
  const endItem = Math.min(currentPage * itemsPerPage, totalItems)

  return (
    <div className={cn("flex-shrink-0 bg-white", !showScrollbar && "border-t border-gray-200", className)}>
      {/* Horizontal Scrollbar - synchronized with table (optional) */}
      {showScrollbar && (
        <div 
          ref={paginationScrollRef}
          className="pagination-scrollbar overflow-x-auto border-b border-gray-200 bg-gray-50"
          style={{ 
            height: '17px',
            minHeight: '17px'
          }}
        >
          <div 
            className="h-full bg-gray-200 flex items-center justify-center text-xs text-gray-500" 
            style={{ 
              width: scrollbarWidth,
              minWidth: '100%'
            }}
          >
            <span>← Scroll horizontally to navigate table columns →</span>
          </div>
        </div>
      )}
      
      {/* Pagination Controls */}
      <div className="px-4 py-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <div className="text-sm text-gray-700">
              Showing {startItem} to {endItem} of {totalItems} {itemType}
            </div>
            
            <div className="flex items-center space-x-2">
              <span className="text-sm text-gray-700">Show:</span>
              <select
                value={itemsPerPage}
                onChange={(e) => onItemsPerPageChange(Number(e.target.value))}
                className="text-sm border border-gray-300 rounded-md px-2 py-1 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value={10}>10</option>
                <option value={25}>25</option>
                <option value={50}>50</option>
                <option value={100}>100</option>
                <option value={200}>200</option>
                <option value={250}>250</option>
                <option value={300}>300</option>
                <option value={500}>500</option>
              </select>
              <span className="text-sm text-gray-700">per page</span>
            </div>
          </div>
      
      <div className="flex items-center space-x-1">
        {/* First Page */}
        <button
          onClick={() => onPageChange(1)}
          disabled={currentPage === 1}
          className={cn(
            "p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded transition-colors",
            currentPage === 1 && "opacity-50 cursor-not-allowed"
          )}
          title="First page"
        >
          <ChevronsLeft className="h-4 w-4" />
        </button>
        
        {/* Previous Page */}
        <button
          onClick={() => onPageChange(currentPage - 1)}
          disabled={currentPage === 1}
          className={cn(
            "p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded transition-colors",
            currentPage === 1 && "opacity-50 cursor-not-allowed"
          )}
          title="Previous page"
        >
          <ChevronLeft className="h-4 w-4" />
        </button>
        
        {/* Page Numbers */}
        <div className="flex items-center space-x-1">
          {getPageNumbers().map((page, index) => (
            <React.Fragment key={index}>
              {page === '...' ? (
                <span className="px-3 py-2 text-gray-500">...</span>
              ) : (
                <button
                  onClick={() => onPageChange(page as number)}
                  className={cn(
                    "px-3 py-2 text-sm font-medium rounded transition-colors",
                    currentPage === page
                      ? "bg-blue-600 text-white"
                      : "text-gray-700 hover:bg-gray-100"
                  )}
                >
                  {page}
                </button>
              )}
            </React.Fragment>
          ))}
        </div>
        
        {/* Next Page */}
        <button
          onClick={() => onPageChange(currentPage + 1)}
          disabled={currentPage === totalPages}
          className={cn(
            "p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded transition-colors",
            currentPage === totalPages && "opacity-50 cursor-not-allowed"
          )}
          title="Next page"
        >
          <ChevronRight className="h-4 w-4" />
        </button>
        
          {/* Last Page */}
          <button
            onClick={() => onPageChange(totalPages)}
            disabled={currentPage === totalPages}
            className={cn(
              "p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded transition-colors",
              currentPage === totalPages && "opacity-50 cursor-not-allowed"
            )}
            title="Last page"
          >
            <ChevronsRight className="h-4 w-4" />
          </button>
        </div>
      </div>
    </div>
    </div>
  )
}
