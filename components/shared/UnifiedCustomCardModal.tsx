'use client'

import { useState } from 'react'
import { X, Plus } from 'lucide-react'
import { cn } from '@/lib/utils'
import { CustomCard } from './types/unified-table'

interface UnifiedCustomCardModalProps {
  isOpen: boolean
  onClose: () => void
  onSubmit: (card: Omit<CustomCard, 'id'>) => void
  editingCard?: CustomCard | null
  availableFields?: string[]
  itemTypeName?: string
}

const DEFAULT_OPERATIONS = [
  { value: 'sum', label: 'Sum', description: 'Add all values' },
  { value: 'avg', label: 'Average', description: 'Calculate mean value' },
  { value: 'min', label: 'Minimum', description: 'Find lowest value' },
  { value: 'max', label: 'Maximum', description: 'Find highest value' },
  { value: 'count', label: 'Count', description: 'Count selected items' }
]

const DEFAULT_COLORS = [
  'bg-gradient-to-r from-blue-500 to-blue-600',
  'bg-gradient-to-r from-green-500 to-green-600',
  'bg-gradient-to-r from-purple-500 to-purple-600',
  'bg-gradient-to-r from-orange-500 to-orange-600',
  'bg-gradient-to-r from-red-500 to-red-600',
  'bg-gradient-to-r from-pink-500 to-pink-600',
  'bg-gradient-to-r from-indigo-500 to-indigo-600',
  'bg-gradient-to-r from-yellow-500 to-yellow-600'
]

const DEFAULT_ICONS = ['📊', '💰', '📈', '📉', '🔢', '⭐', '🎯', '📋']

export default function UnifiedCustomCardModal({
  isOpen,
  onClose,
  onSubmit,
  editingCard,
  availableFields = [],
  itemTypeName = 'items'
}: UnifiedCustomCardModalProps) {
  const [formData, setFormData] = useState({
    title: editingCard?.title || '',
    field: editingCard?.field || '',
    operation: editingCard?.operation || 'sum',
    color: editingCard?.color || DEFAULT_COLORS[0],
    icon: editingCard?.icon || DEFAULT_ICONS[0],
    isVisible: editingCard?.isVisible ?? true
  })

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!formData.title.trim() || !formData.field) {
      return
    }

    onSubmit({
      title: formData.title.trim(),
      field: formData.field,
      operation: formData.operation as 'sum' | 'avg' | 'count' | 'min' | 'max',
      selectedProducts: editingCard?.selectedProducts || [],
      color: formData.color,
      icon: formData.icon,
      isVisible: formData.isVisible
    })
  }

  const handleFieldChange = (field: string, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }))
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/60" onClick={onClose} />

      {/* Modal */}
      <div className="relative bg-white w-full max-w-md mx-4 rounded-xl shadow-2xl border border-gray-200 overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200 bg-gray-50">
          <h3 className="text-lg font-semibold text-gray-900">
            {editingCard ? 'Edit Custom Card' : 'Create Custom Card'}
          </h3>
          <button
            onClick={onClose}
            className="p-2 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-md transition-colors"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Content */}
        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          {/* Title */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Card Title
            </label>
            <input
              type="text"
              value={formData.title}
              onChange={(e) => handleFieldChange('title', e.target.value)}
              placeholder="Enter card title"
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              required
            />
          </div>

          {/* Field Selection */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Data Field
            </label>
            <select
              value={formData.field}
              onChange={(e) => handleFieldChange('field', e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              required
            >
              <option value="">Select a field</option>
              {availableFields.map(field => (
                <option key={field} value={field}>
                  {field.charAt(0).toUpperCase() + field.slice(1)}
                </option>
              ))}
            </select>
          </div>

          {/* Operation */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Calculation
            </label>
            <select
              value={formData.operation}
              onChange={(e) => handleFieldChange('operation', e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            >
              {DEFAULT_OPERATIONS.map(op => (
                <option key={op.value} value={op.value}>
                  {op.label} - {op.description}
                </option>
              ))}
            </select>
          </div>

          {/* Color Selection */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Card Color
            </label>
            <div className="grid grid-cols-4 gap-2">
              {DEFAULT_COLORS.map(color => (
                <button
                  key={color}
                  type="button"
                  onClick={() => handleFieldChange('color', color)}
                  className={cn(
                    "h-10 rounded-md border-2 transition-all",
                    formData.color === color 
                      ? "border-gray-900 ring-2 ring-blue-500" 
                      : "border-gray-200 hover:border-gray-300"
                  )}
                >
                  <div className={cn("w-full h-full rounded-md", color)}></div>
                </button>
              ))}
            </div>
          </div>

          {/* Icon Selection */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Card Icon
            </label>
            <div className="grid grid-cols-8 gap-2">
              {DEFAULT_ICONS.map(icon => (
                <button
                  key={icon}
                  type="button"
                  onClick={() => handleFieldChange('icon', icon)}
                  className={cn(
                    "h-10 w-10 rounded-md border-2 text-lg transition-all",
                    formData.icon === icon 
                      ? "border-gray-900 ring-2 ring-blue-500" 
                      : "border-gray-200 hover:border-gray-300"
                  )}
                >
                  {icon}
                </button>
              ))}
            </div>
          </div>

          {/* Visibility Toggle */}
          <div className="flex items-center">
            <input
              type="checkbox"
              id="isVisible"
              checked={formData.isVisible}
              onChange={(e) => handleFieldChange('isVisible', e.target.checked)}
              className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
            />
            <label htmlFor="isVisible" className="ml-2 text-sm text-gray-700">
              Show this card
            </label>
          </div>

          {/* Actions */}
          <div className="flex items-center justify-end space-x-3 pt-4 border-t border-gray-200">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-4 py-2 text-sm font-medium text-white bg-blue-600 border border-transparent rounded-md hover:bg-blue-700 transition-colors"
            >
              {editingCard ? 'Update Card' : 'Create Card'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
