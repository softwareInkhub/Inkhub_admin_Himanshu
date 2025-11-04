'use client'

import React from 'react'
import { 
  Plus, 
  Download, 
  Upload, 
  Printer, 
  Settings, 
  MoreHorizontal,
  Edit,
  Trash2,
  Eye
} from 'lucide-react'
import { cn } from '@/lib/utils'

interface ActionButtonsProps {
  onCreate?: () => void
  onExport?: () => void
  onImport?: () => void
  onPrint?: () => void
  onSettings?: () => void
  onEdit?: () => void
  onDelete?: () => void
  onView?: () => void
  showCreate?: boolean
  showExport?: boolean
  showImport?: boolean
  showPrint?: boolean
  showSettings?: boolean
  showEdit?: boolean
  showDelete?: boolean
  showView?: boolean
  className?: string
}

export default function ActionButtons({
  onCreate,
  onExport,
  onImport,
  onPrint,
  onSettings,
  onEdit,
  onDelete,
  onView,
  showCreate = true,
  showExport = true,
  showImport = true,
  showPrint = true,
  showSettings = true,
  showEdit = true,
  showDelete = true,
  showView = true,
  className
}: ActionButtonsProps) {
  return (
    <div className={cn('flex items-center space-x-2', className)}>
      {showCreate && onCreate && (
        <button
          onClick={onCreate}
          className="flex items-center space-x-2 px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700 transition-colors"
        >
          <Plus className="h-4 w-4" />
          <span>Create</span>
        </button>
      )}

      {showView && onView && (
        <button
          onClick={onView}
          className="flex items-center space-x-2 px-3 py-2 text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
        >
          <Eye className="h-4 w-4" />
          <span>View</span>
        </button>
      )}

      {showEdit && onEdit && (
        <button
          onClick={onEdit}
          className="flex items-center space-x-2 px-3 py-2 text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
        >
          <Edit className="h-4 w-4" />
          <span>Edit</span>
        </button>
      )}

      {showExport && onExport && (
        <button
          onClick={onExport}
          className="flex items-center space-x-2 px-3 py-2 text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
        >
          <Download className="h-4 w-4" />
          <span>Export</span>
        </button>
      )}

      {showImport && onImport && (
        <button
          onClick={onImport}
          className="flex items-center space-x-2 px-3 py-2 text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
        >
          <Upload className="h-4 w-4" />
          <span>Import</span>
        </button>
      )}

      {showPrint && onPrint && (
        <button
          onClick={onPrint}
          className="flex items-center space-x-2 px-3 py-2 text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
        >
          <Printer className="h-4 w-4" />
          <span>Print</span>
        </button>
      )}

      {showDelete && onDelete && (
        <button
          onClick={onDelete}
          className="flex items-center space-x-2 px-3 py-2 text-red-700 bg-white border border-red-300 rounded-lg hover:bg-red-50 transition-colors"
        >
          <Trash2 className="h-4 w-4" />
          <span>Delete</span>
        </button>
      )}

      {showSettings && onSettings && (
        <button
          onClick={onSettings}
          className="flex items-center space-x-2 px-3 py-2 text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
        >
          <Settings className="h-4 w-4" />
          <span>Settings</span>
        </button>
      )}

      {/* More Actions Dropdown */}
      <div className="relative">
        <button className="flex items-center space-x-2 px-3 py-2 text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors">
          <MoreHorizontal className="h-4 w-4" />
          <span>More</span>
        </button>
      </div>
    </div>
  )
}