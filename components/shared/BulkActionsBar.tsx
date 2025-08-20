'use client'

import React from 'react'
import { 
  Edit, 
  Download, 
  Trash2
} from 'lucide-react'
import { cn } from '@/lib/utils'

interface BulkActionsBarProps {
  selectedItems: string[]
  totalItems: number
  onBulkEdit: () => void
  onExportSelected: () => void
  onBulkDelete: () => void
  onClearSelection?: () => void
  className?: string
}

export default function BulkActionsBar({
  selectedItems,
  totalItems,
  onBulkEdit,
  onExportSelected,
  onBulkDelete,
  onClearSelection,
  className
}: BulkActionsBarProps) {
  if (selectedItems.length === 0) {
    return null
  }

  return (
    <div className={cn(
      "bg-blue-50 border-b border-blue-200 px-4 py-2 flex items-center justify-between",
      className
    )}>
      <div className="flex items-center space-x-4">
        <span className="text-sm font-medium text-blue-900">
          {selectedItems.length}/{totalItems} item{selectedItems.length !== 1 ? 's' : ''} selected
        </span>
      </div>
      <div className="flex items-center space-x-2">
        <button
          onClick={onBulkEdit}
          className="inline-flex items-center px-3 py-1.5 border border-blue-300 text-xs font-medium rounded-md text-blue-700 bg-white hover:bg-blue-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-colors"
        >
          <Edit className="h-3 w-3 mr-1" />
          Bulk Edit
        </button>
        <button
          onClick={onExportSelected}
          className="inline-flex items-center px-3 py-1.5 border border-green-300 text-xs font-medium rounded-md text-green-700 bg-white hover:bg-green-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 transition-colors"
        >
          <Download className="h-3 w-3 mr-1" />
          Export
        </button>
        <button
          onClick={onBulkDelete}
          className="inline-flex items-center px-3 py-1.5 border border-red-300 text-xs font-medium rounded-md text-red-700 bg-white hover:bg-red-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 transition-colors"
        >
          <Trash2 className="h-3 w-3 mr-1" />
          Delete
        </button>
      </div>
    </div>
  )
}
