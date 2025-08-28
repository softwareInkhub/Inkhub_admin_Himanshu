'use client'

import React from 'react'
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
}

export default function Pagination({
  currentPage,
  totalPages,
  itemsPerPage,
  totalItems,
  onPageChange,
  onItemsPerPageChange,
  className
}: PaginationProps) {
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
    <div className={cn(
      "flex items-center justify-between px-4 py-3 bg-white border-t border-gray-200",
      className
    )}>
      <div className="flex items-center space-x-4">
        <div className="text-sm text-gray-700">
          Showing {startItem} to {endItem} of {totalItems} results
        </div>
        
        <div className="flex items-center space-x-2">
          <span className="text-sm text-gray-700">Items per page:</span>
          <select
            value={itemsPerPage}
            onChange={(e) => onItemsPerPageChange(Number(e.target.value))}
            className="border border-gray-300 rounded px-2 py-1 text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          >
            <option value={10}>10</option>
            <option value={25}>25</option>
            <option value={50}>50</option>
            <option value={100}>100</option>
            <option value={200}>200</option>
            <option value={300}>300</option>
          </select>
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
  )
}
