'use client'

import React from 'react'
import { cn } from '@/lib/utils'

interface DataGridProps<T> {
  data: T[]
  renderItem: (item: T, index: number) => React.ReactNode
  columns?: 1 | 2 | 3 | 4 | 5 | 6
  gap?: 'sm' | 'md' | 'lg'
  className?: string
  emptyMessage?: string
  loading?: boolean
  loadingSkeleton?: React.ReactNode
}

export default function DataGrid<T>({
  data,
  renderItem,
  columns = 3,
  gap = 'md',
  className,
  emptyMessage = 'No items found',
  loading = false,
  loadingSkeleton,
}: DataGridProps<T>) {
  const getGridClasses = () => {
    const baseClasses = 'grid'
    
    // Column classes
    const columnClasses = {
      1: 'grid-cols-1',
      2: 'grid-cols-1 sm:grid-cols-2',
      3: 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-3',
      4: 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-4',
      5: 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5',
      6: 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6',
    }

    // Gap classes
    const gapClasses = {
      sm: 'gap-3',
      md: 'gap-4',
      lg: 'gap-6',
    }

    return cn(baseClasses, columnClasses[columns], gapClasses[gap])
  }

  if (loading) {
    return (
      <div className={cn(getGridClasses(), className)}>
        {loadingSkeleton || (
          Array.from({ length: 6 }).map((_, index) => (
            <div key={index} className="card p-4 animate-pulse">
              <div className="h-4 bg-secondary-200 rounded mb-2"></div>
              <div className="h-3 bg-secondary-200 rounded mb-1"></div>
              <div className="h-3 bg-secondary-200 rounded w-2/3"></div>
            </div>
          ))
        )}
      </div>
    )
  }

  if (data.length === 0) {
    return (
      <div className={cn('text-center py-12', className)}>
        <div className="text-secondary-500 dark:text-secondary-400">
          {emptyMessage}
        </div>
      </div>
    )
  }

  return (
    <div className={cn(getGridClasses(), className)}>
      {data.map((item, index) => (
        <div key={index} className="animate-fade-in" style={{ animationDelay: `${index * 50}ms` }}>
          {renderItem(item, index)}
        </div>
      ))}
    </div>
  )
}

// Grid item wrapper component
interface GridItemProps {
  children: React.ReactNode
  className?: string
  onClick?: () => void
  selected?: boolean
}

export function GridItem({ children, className, onClick, selected }: GridItemProps) {
  return (
    <div
      className={cn(
        'border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow cursor-pointer',
        selected && 'ring-2 ring-blue-500 bg-blue-50',
        className
      )}
      onClick={onClick}
    >
      {children}
    </div>
  )
}
