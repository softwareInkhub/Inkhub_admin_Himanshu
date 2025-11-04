'use client'

import { X } from 'lucide-react'

interface SaveViewModalProps {
  isOpen: boolean
  onClose: () => void
  viewName: string
  setViewName: (name: string) => void
  onSave: (name: string) => void
  currentState: {
    searchQuery?: string
    columnFiltersCount?: number
    viewMode?: string
  }
}

export default function SaveViewModal({
  isOpen,
  onClose,
  viewName,
  setViewName,
  onSave,
  currentState
}: SaveViewModalProps) {
  if (!isOpen) return null

  const handleSave = () => {
    if (viewName.trim()) {
      onSave(viewName.trim())
    }
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-[9999]">
      <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-gray-900">Save Search View</h3>
          <button 
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition-colors"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              View Name
            </label>
            <input
              type="text"
              value={viewName}
              onChange={(e) => setViewName(e.target.value)}
              onKeyPress={(e) => {
                if (e.key === 'Enter') {
                  handleSave()
                }
              }}
              placeholder="Enter a name for this search view"
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              autoFocus
            />
          </div>

          <div className="text-sm text-gray-600 bg-gray-50 rounded-md p-3 space-y-1">
            <div className="font-medium text-gray-700 mb-2">Current View Settings:</div>
            <div className="flex items-center justify-between">
              <span className="text-gray-600">Search Query:</span>
              <span className="font-medium text-gray-900">
                {currentState.searchQuery || 'None'}
              </span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-gray-600">Active Filters:</span>
              <span className="font-medium text-gray-900">
                {currentState.columnFiltersCount || 0} filters
              </span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-gray-600">View Mode:</span>
              <span className="font-medium text-gray-900 capitalize">
                {currentState.viewMode || 'table'}
              </span>
            </div>
          </div>
        </div>

        <div className="flex justify-end space-x-3 mt-6">
          <button
            onClick={onClose}
            className="px-4 py-2 text-gray-600 border border-gray-300 rounded hover:bg-gray-50 transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={handleSave}
            disabled={!viewName.trim()}
            className="px-4 py-2 text-white bg-blue-600 rounded hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            Save
          </button>
        </div>
      </div>
    </div>
  )
}



