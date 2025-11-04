'use client'

import React from 'react'
import { ChevronLeft, ChevronRight, ChevronsLeft, ChevronsRight } from 'lucide-react'

interface PaginationProps {
  currentPage: number
  totalPages: number
  itemsPerPage: number
  totalItems?: number
  onPageChange: (page: number) => void
  onItemsPerPageChange?: (n: number) => void
  itemType?: string
  scrollGroupId?: string
  tableScrollRef?: React.RefObject<HTMLElement>
  showScrollbar?: boolean
}

export default function Pagination({
  currentPage,
  totalPages,
  onPageChange,
  itemsPerPage,
  onItemsPerPageChange,
  totalItems,
  itemType,
}: PaginationProps) {
  const maxPages = Math.max(totalPages, 1)
  const startItem = totalItems ? (currentPage - 1) * itemsPerPage + 1 : 0
  const endItem = totalItems ? Math.min(currentPage * itemsPerPage, totalItems) : 0
  
  // Generate page numbers to display
  const getPageNumbers = () => {
    const pages: (number | string)[] = []
    const showEllipsis = totalPages > 7
    
    if (!showEllipsis) {
      // Show all pages if total pages <= 7
      for (let i = 1; i <= totalPages; i++) {
        pages.push(i)
      }
    } else {
      // Always show first page
      pages.push(1)
      
      if (currentPage > 3) {
        pages.push('...')
      }
      
      // Show pages around current page
      const startPage = Math.max(2, currentPage - 1)
      const endPage = Math.min(totalPages - 1, currentPage + 1)
      
      for (let i = startPage; i <= endPage; i++) {
        if (i !== 1 && i !== totalPages) {
          pages.push(i)
        }
      }
      
      if (currentPage < totalPages - 2) {
        pages.push('...')
      }
      
      // Always show last page
      if (totalPages > 1) {
        pages.push(totalPages)
      }
    }
    
    return pages
  }
  
  const pageNumbers = getPageNumbers()
  
  return (
    <div className="flex items-center justify-between px-6 py-3 bg-white border-t border-gray-200">
      {/* Left Section - Summary and Items Per Page */}
      <div className="flex items-center gap-4">
        {typeof totalItems === 'number' && totalItems > 0 && (
          <span className="text-sm text-gray-700">
            Showing <span className="font-semibold">{startItem}</span> to <span className="font-semibold">{endItem}</span> of{' '}
            <span className="font-semibold">{totalItems}</span> {itemType || 'items'}
          </span>
        )}
        
        {onItemsPerPageChange && (
          <div className="flex items-center gap-2">
            <span className="text-sm text-gray-600">Show:</span>
            <select
              className="border border-gray-300 rounded px-2 py-1 text-sm bg-white text-gray-700 hover:border-gray-400 focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500 transition-colors cursor-pointer"
              value={itemsPerPage}
              onChange={(e) => onItemsPerPageChange(parseInt(e.target.value))}
              aria-label="Items per page"
            >
              {[10, 25, 50, 100, 200, 500].map(n => (
                <option key={n} value={n}>{n}</option>
              ))}
            </select>
            <span className="text-sm text-gray-600">per page</span>
          </div>
        )}
      </div>
      
      {/* Right Section - Page Navigation */}
      <div className="flex items-center gap-1">
        {/* First Page Button */}
        <button
          onClick={() => onPageChange(1)}
          disabled={currentPage <= 1}
          className="p-1.5 text-gray-600 hover:bg-gray-100 rounded disabled:opacity-40 disabled:cursor-not-allowed disabled:hover:bg-transparent transition-colors"
          aria-label="First page"
          title="First page"
        >
          <ChevronsLeft className="h-4 w-4" />
        </button>
        
        {/* Previous Page Button */}
        <button
          onClick={() => currentPage > 1 && onPageChange(currentPage - 1)}
          disabled={currentPage <= 1}
          className="p-1.5 text-gray-600 hover:bg-gray-100 rounded disabled:opacity-40 disabled:cursor-not-allowed disabled:hover:bg-transparent transition-colors"
          aria-label="Previous page"
          title="Previous page"
        >
          <ChevronLeft className="h-4 w-4" />
        </button>
        
        {/* Page Numbers */}
        <div className="flex items-center gap-1 mx-2">
          {pageNumbers.map((page, index) => {
            if (page === '...') {
              return (
                <span key={`ellipsis-${index}`} className="px-2 text-gray-500">
                  ...
                </span>
              )
            }
            
            const pageNum = page as number
            const isActive = pageNum === currentPage
            
            return (
              <button
                key={pageNum}
                onClick={() => onPageChange(pageNum)}
                className={`min-w-[32px] h-8 px-2 text-sm font-medium rounded transition-colors ${
                  isActive
                    ? 'bg-blue-600 text-white hover:bg-blue-700'
                    : 'text-gray-700 hover:bg-gray-100'
                }`}
                aria-label={`Page ${pageNum}`}
                aria-current={isActive ? 'page' : undefined}
              >
                {pageNum}
              </button>
            )
          })}
        </div>
        
        {/* Next Page Button */}
        <button
          onClick={() => currentPage < totalPages && onPageChange(currentPage + 1)}
          disabled={currentPage >= totalPages}
          className="p-1.5 text-gray-600 hover:bg-gray-100 rounded disabled:opacity-40 disabled:cursor-not-allowed disabled:hover:bg-transparent transition-colors"
          aria-label="Next page"
          title="Next page"
        >
          <ChevronRight className="h-4 w-4" />
        </button>
        
        {/* Last Page Button */}
        <button
          onClick={() => onPageChange(totalPages)}
          disabled={currentPage >= totalPages}
          className="p-1.5 text-gray-600 hover:bg-gray-100 rounded disabled:opacity-40 disabled:cursor-not-allowed disabled:hover:bg-transparent transition-colors"
          aria-label="Last page"
          title="Last page"
        >
          <ChevronsRight className="h-4 w-4" />
        </button>
      </div>
    </div>
  )
}






