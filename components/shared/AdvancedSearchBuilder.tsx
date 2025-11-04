'use client'

import React from 'react'
import { X } from 'lucide-react'
import type { SearchCondition } from './types/unified-table'

interface AdvancedSearchBuilderProps {
  searchConditions: SearchCondition[]
  onClearConditions: () => void
  onClose: () => void
}

export default function AdvancedSearchBuilder({
  searchConditions,
  onClearConditions,
  onClose
}: AdvancedSearchBuilderProps) {
  return (
    <div className="bg-white border border-gray-200 rounded-lg p-4">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-sm font-medium text-gray-900">Advanced Search</h3>
        <div className="flex items-center space-x-2">
          <button
            onClick={onClearConditions}
            className="text-xs text-gray-500 hover:text-gray-700"
          >
            Clear all
          </button>
          <button
            onClick={onClose}
            className="text-xs text-gray-500 hover:text-gray-700"
          >
            Cancel
          </button>
          <button
            onClick={onClose}
            className="px-3 py-1 bg-blue-600 text-white text-xs rounded-md hover:bg-blue-700"
          >
            Apply
          </button>
        </div>
      </div>

      <div className="space-y-3">
        {searchConditions.length === 0 && (
          <div className="text-center py-4 text-gray-500 text-sm">
            No search conditions added. Click "Add Condition" to start building your search.
          </div>
        )}
        
        {searchConditions.length > 0 && (
          <div className="p-3 bg-blue-50 border border-blue-200 rounded-md">
            <div className="text-xs font-medium text-blue-800 mb-2">Active Search Conditions:</div>
            <div className="space-y-1">
              {searchConditions.map((condition, index) => (
                <div key={index} className="text-xs text-blue-700">
                  {index > 0 && <span className="font-medium">{condition.connector} </span>}
                  <span className="font-medium">{condition.field}</span>
                  <span> {condition.operator.replace('_', ' ')} </span>
                  <span className="font-medium">"{condition.value}"</span>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}