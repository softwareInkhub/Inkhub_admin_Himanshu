'use client'

import React from 'react'

interface ColumnDef {
  key: string
  label: string
}

interface TablePreferencesModalProps {
  isOpen: boolean
  title: string
  pageSize: number
  onChangePageSize: (n: number) => void
  columns: ColumnDef[]
  columnVisibility: Record<string, boolean>
  onToggleColumn: (key: string, visible: boolean) => void
  onSelectAll: () => void
  onDeselectAll: () => void
  onClose: () => void
  onSave: () => void
}

export default function TablePreferencesModal({
  isOpen,
  title,
  pageSize,
  onChangePageSize,
  columns,
  columnVisibility,
  onToggleColumn,
  onSelectAll,
  onDeselectAll,
  onClose,
  onSave
}: TablePreferencesModalProps) {
  if (!isOpen) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
      <div className="bg-white rounded-lg shadow-lg w-full max-w-3xl mx-4">
        <div className="flex items-start justify-between p-4 border-b border-gray-200">
          <div>
            <h3 className="text-lg font-semibold text-gray-900">{title} Preferences</h3>
            <p className="text-sm text-gray-500">Customize page size and visible columns</p>
          </div>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 transition-colors" aria-label="Close">
            ×
          </button>
        </div>

        <div className="p-4 grid grid-cols-1 md:grid-cols-3 gap-4">
          {/* Page size */}
          <div className="md:col-span-1">
            <div className="text-sm font-semibold text-gray-800 mb-2">Page size</div>
            {[10, 25, 50, 100, 200, 300].map((n) => (
              <label key={n} className="flex items-center space-x-2 text-sm text-gray-700 py-1">
                <input
                  type="radio"
                  name="pageSize"
                  checked={pageSize === n}
                  onChange={() => onChangePageSize(n)}
                  className="text-blue-600"
                />
                <span>{n} items</span>
              </label>
            ))}
          </div>

          {/* Columns */}
          <div className="md:col-span-2">
            <div className="flex items-center justify-between mb-2">
              <div className="text-sm font-semibold text-gray-800">Columns</div>
              <div className="space-x-2">
                <button onClick={onSelectAll} className="px-2 py-1 text-xs bg-gray-100 hover:bg-gray-200 rounded">Select all</button>
                <button onClick={onDeselectAll} className="px-2 py-1 text-xs bg-gray-100 hover:bg-gray-200 rounded">Deselect all</button>
              </div>
            </div>
            <div className="max-h-80 overflow-y-auto border rounded-md divide-y">
              {columns.map((c) => (
                <label key={c.key} className="flex items-center justify-between px-3 py-2">
                  <span className="text-sm text-gray-700">{c.label || c.key}</span>
                  <input
                    type="checkbox"
                    checked={columnVisibility[c.key] !== false}
                    onChange={(e) => onToggleColumn(c.key, e.target.checked)}
                    className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                  />
                </label>
              ))}
            </div>
          </div>
        </div>

        <div className="p-4 border-t border-gray-200 flex justify-end space-x-2">
          <button onClick={onClose} className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 rounded-md hover:bg-gray-200">Cancel</button>
          <button onClick={onSave} className="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-md hover:bg-blue-700">Save changes</button>
        </div>
      </div>
    </div>
  )
}


