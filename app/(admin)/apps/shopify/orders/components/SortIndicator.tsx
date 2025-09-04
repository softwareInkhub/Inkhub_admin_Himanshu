'use client'

interface SortIndicatorProps {
  columnKey: string
  sortColumn: string | null
  sortDirection: 'asc' | 'desc'
}

export default function SortIndicator({ columnKey, sortColumn, sortDirection }: SortIndicatorProps) {
  if (sortColumn !== columnKey) {
    return null // No indicator when not sorted
  }

  return (
    <div className="flex flex-col items-center ml-1">
      <div className={`w-0 h-0 border-l-2 border-r-2 border-b-2 border-transparent transition-all duration-200 ${
        sortDirection === 'asc' ? 'border-b-blue-600' : 'border-b-gray-300'
      }`} />
      <div className={`w-0 h-0 border-l-2 border-r-2 border-t-2 border-transparent transition-all duration-200 ${
        sortDirection === 'desc' ? 'border-t-blue-600' : 'border-t-gray-300'
      }`} />
    </div>
  )
}
