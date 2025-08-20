'use client'

import React, { useState } from 'react'
import { X, Edit } from 'lucide-react'
import { cn } from '@/lib/utils'

interface BulkEditModalProps {
  isOpen: boolean
  onClose: () => void
  selectedItems: string[]
  onBulkEdit: (updates: Record<string, any>) => void
  title?: string
}

export default function BulkEditModal({
  isOpen,
  onClose,
  selectedItems,
  onBulkEdit,
  title = 'Bulk Edit'
}: BulkEditModalProps) {
  const [updates, setUpdates] = useState<Record<string, any>>({
    status: { enabled: false, value: '' },
    vendor: { enabled: false, value: '' },
    productType: { enabled: false, value: '' },
    tags: { enabled: false, value: '' },
    price: { enabled: false, mode: 'set', value: 0 },
    inventoryQuantity: { enabled: false, mode: 'set', value: 0 }
  })

  if (!isOpen) return null

  const handleSave = () => {
    onBulkEdit(updates)
    onClose()
  }

  const toggleField = (field: string, enabled: boolean) => {
    setUpdates(prev => ({ ...prev, [field]: { ...prev[field], enabled } }))
  }

  const handleFieldChange = (field: string, key: string, value: any) => {
    setUpdates(prev => ({ ...prev, [field]: { ...prev[field], [key]: value } }))
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full mx-4 max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <div className="flex items-center space-x-3">
            <div className="p-2 bg-blue-100 rounded-lg">
              <Edit className="h-5 w-5 text-blue-600" />
            </div>
            <div>
              <h2 className="text-lg font-semibold text-gray-900">{title}</h2>
              <p className="text-sm text-gray-500">Edit {selectedItems.length} selected item{selectedItems.length !== 1 ? 's' : ''}</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-6">
          {/* Edit Fields Section */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-3">Edit Fields</label>
            <div className="space-y-4">
              {/* Status */}
              <div className="border rounded-lg p-4">
                <div className="flex items-center justify-between mb-3">
                  <label className="text-sm font-medium text-gray-700">Status</label>
                  <label className="flex items-center space-x-2 text-xs text-gray-500">
                    <input
                      type="checkbox"
                      checked={updates.status.enabled}
                      onChange={(e) => toggleField('status', e.target.checked)}
                      className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                    />
                    <span>Apply to all</span>
                  </label>
                </div>
                <select
                  value={updates.status.value}
                  onChange={(e) => handleFieldChange('status', 'value', e.target.value)}
                  className="w-full border border-gray-300 rounded-md px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  disabled={!updates.status.enabled}
                >
                  <option value="">No change</option>
                  <option value="active">Active</option>
                  <option value="draft">Draft</option>
                  <option value="archived">Archived</option>
                </select>
              </div>

              {/* Vendor */}
              <div className="border rounded-lg p-4">
                <div className="flex items-center justify-between mb-3">
                  <label className="text-sm font-medium text-gray-700">Vendor</label>
                  <label className="flex items-center space-x-2 text-xs text-gray-500">
                    <input
                      type="checkbox"
                      checked={updates.vendor.enabled}
                      onChange={(e) => toggleField('vendor', e.target.checked)}
                      className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                    />
                    <span>Apply to all</span>
                  </label>
                </div>
                <input
                  type="text"
                  value={updates.vendor.value}
                  onChange={(e) => handleFieldChange('vendor', 'value', e.target.value)}
                  placeholder="Enter vendor name"
                  className="w-full border border-gray-300 rounded-md px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  disabled={!updates.vendor.enabled}
                />
              </div>

              {/* Product Type */}
              <div className="border rounded-lg p-4">
                <div className="flex items-center justify-between mb-3">
                  <label className="text-sm font-medium text-gray-700">Product Type</label>
                  <label className="flex items-center space-x-2 text-xs text-gray-500">
                    <input
                      type="checkbox"
                      checked={updates.productType.enabled}
                      onChange={(e) => toggleField('productType', e.target.checked)}
                      className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                    />
                    <span>Apply to all</span>
                  </label>
                </div>
                <input
                  type="text"
                  value={updates.productType.value}
                  onChange={(e) => handleFieldChange('productType', 'value', e.target.value)}
                  placeholder="Enter product type"
                  className="w-full border border-gray-300 rounded-md px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  disabled={!updates.productType.enabled}
                />
              </div>

              {/* Tags */}
              <div className="border rounded-lg p-4">
                <div className="flex items-center justify-between mb-3">
                  <label className="text-sm font-medium text-gray-700">Tags</label>
                  <label className="flex items-center space-x-2 text-xs text-gray-500">
                    <input
                      type="checkbox"
                      checked={updates.tags.enabled}
                      onChange={(e) => toggleField('tags', e.target.checked)}
                      className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                    />
                    <span>Apply to all</span>
                  </label>
                </div>
                <input
                  type="text"
                  value={updates.tags.value}
                  onChange={(e) => handleFieldChange('tags', 'value', e.target.value)}
                  placeholder="Enter tags (comma-separated)"
                  className="w-full border border-gray-300 rounded-md px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  disabled={!updates.tags.enabled}
                />
              </div>

              {/* Price */}
              <div className="border rounded-lg p-4">
                <div className="flex items-center justify-between mb-3">
                  <label className="text-sm font-medium text-gray-700">Price</label>
                  <label className="flex items-center space-x-2 text-xs text-gray-500">
                    <input
                      type="checkbox"
                      checked={updates.price.enabled}
                      onChange={(e) => toggleField('price', e.target.checked)}
                      className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                    />
                    <span>Apply to all</span>
                  </label>
                </div>
                <div className="grid grid-cols-3 gap-2">
                  <select
                    value={updates.price.mode}
                    onChange={(e) => handleFieldChange('price', 'mode', e.target.value)}
                    className="col-span-1 border border-gray-300 rounded-md px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    disabled={!updates.price.enabled}
                  >
                    <option value="set">Set to</option>
                    <option value="increase">Increase by</option>
                    <option value="decrease">Decrease by</option>
                    <option value="percentage">Percentage +/-%</option>
                  </select>
                  <input
                    type="number"
                    step="0.01"
                    value={updates.price.value}
                    onChange={(e) => handleFieldChange('price', 'value', Number(e.target.value))}
                    className="col-span-2 border border-gray-300 rounded-md px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    disabled={!updates.price.enabled}
                  />
                </div>
              </div>

              {/* Inventory Quantity */}
              <div className="border rounded-lg p-4">
                <div className="flex items-center justify-between mb-3">
                  <label className="text-sm font-medium text-gray-700">Inventory Quantity</label>
                  <label className="flex items-center space-x-2 text-xs text-gray-500">
                    <input
                      type="checkbox"
                      checked={updates.inventoryQuantity.enabled}
                      onChange={(e) => toggleField('inventoryQuantity', e.target.checked)}
                      className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                    />
                    <span>Apply to all</span>
                  </label>
                </div>
                <div className="grid grid-cols-3 gap-2">
                  <select
                    value={updates.inventoryQuantity.mode}
                    onChange={(e) => handleFieldChange('inventoryQuantity', 'mode', e.target.value)}
                    className="col-span-1 border border-gray-300 rounded-md px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    disabled={!updates.inventoryQuantity.enabled}
                  >
                    <option value="set">Set to</option>
                    <option value="increase">Increase by</option>
                    <option value="decrease">Decrease by</option>
                  </select>
                  <input
                    type="number"
                    value={updates.inventoryQuantity.value}
                    onChange={(e) => handleFieldChange('inventoryQuantity', 'value', Number(e.target.value))}
                    className="col-span-2 border border-gray-300 rounded-md px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    disabled={!updates.inventoryQuantity.enabled}
                  />
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-end space-x-3 p-6 border-t border-gray-200">
          <button
            onClick={onClose}
            className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 rounded-md hover:bg-gray-200 transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={handleSave}
            className="flex items-center space-x-2 px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-md hover:bg-blue-700 transition-colors"
          >
            <Edit className="h-4 w-4" />
            <span>Save Changes</span>
          </button>
        </div>
      </div>
    </div>
  )
}
