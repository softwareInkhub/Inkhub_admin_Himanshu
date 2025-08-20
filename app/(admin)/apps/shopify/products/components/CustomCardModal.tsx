'use client'

import { useState, useEffect } from 'react'
import { X, Plus, Calculator, Palette, Type, Hash } from 'lucide-react'
import { cn } from '@/lib/utils'
import { Product } from '../types'
import { calculateCustomValue, formatCardValue } from '../utils/customCardCalculations'
import CalculatorInterface from './CalculatorInterface'

interface CustomCard {
  id: string
  title: string
  field: string
  operation: string
  selectedProducts: string[]
  color: string
  icon: string
  isVisible: boolean
  computedValue: number
}

interface CustomCardModalProps {
  isOpen: boolean
  onClose: () => void
  onSave: (card: CustomCard) => void
  products: any[] // Changed from Product[] to any[] to support orders
  existingCards: CustomCard[]
  editingCard?: CustomCard | null
  editingDefaultCard?: string | null
}

const OPERATIONS = [
  { value: 'sum', label: 'Sum', description: 'Add all values' },
  { value: 'average', label: 'Average', description: 'Calculate mean value' },
  { value: 'min', label: 'Minimum', description: 'Find lowest value' },
  { value: 'max', label: 'Maximum', description: 'Find highest value' },
  { value: 'count', label: 'Count', description: 'Count selected items' },
  { value: 'percentage', label: 'Percentage', description: 'Calculate percentage' },
  { value: 'difference', label: 'Difference', description: 'Calculate difference' },
  { value: 'custom', label: 'Custom Formula', description: 'Use custom calculation' }
]

const FIELDS = [
  // Product-centric fields
  { value: 'price', label: 'Price', type: 'number' },
  { value: 'total', label: 'Total', type: 'number' },
  { value: 'inventoryQuantity', label: 'Inventory', type: 'number' },
  { value: 'cost', label: 'Cost', type: 'number' },
  { value: 'compareAtPrice', label: 'Compare Price', type: 'number' },
  { value: 'salesChannels', label: 'Sales Channels', type: 'number' },
  // Order-specific fields
  { value: 'totalPrice', label: 'Total Price', type: 'number' },
  { value: 'items', label: 'Items Count', type: 'number' },
  // Design Library fields
  { value: 'views', label: 'Views', type: 'number' },
  { value: 'downloads', label: 'Downloads', type: 'number' },
  // Pinterest Pins fields
  { value: 'likes', label: 'Likes', type: 'number' },
  { value: 'comments', label: 'Comments', type: 'number' },
  { value: 'repins', label: 'Repins', type: 'number' },
  { value: 'saves', label: 'Saves', type: 'number' },
  // Pinterest Boards fields
  { value: 'pinCount', label: 'Pin Count', type: 'number' },
  { value: 'followers', label: 'Followers', type: 'number' }
]

const COLORS = [
  { value: 'from-blue-500 to-blue-600', label: 'Blue', bg: 'from-blue-50 to-blue-100' },
  { value: 'from-green-500 to-green-600', label: 'Green', bg: 'from-green-50 to-green-100' },
  { value: 'from-purple-500 to-purple-600', label: 'Purple', bg: 'from-purple-50 to-purple-100' },
  { value: 'from-orange-500 to-orange-600', label: 'Orange', bg: 'from-orange-50 to-orange-100' },
  { value: 'from-red-500 to-red-600', label: 'Red', bg: 'from-red-50 to-red-100' },
  { value: 'from-indigo-500 to-indigo-600', label: 'Indigo', bg: 'from-indigo-50 to-indigo-100' },
  { value: 'from-teal-500 to-teal-600', label: 'Teal', bg: 'from-teal-50 to-teal-100' },
  { value: 'from-pink-500 to-pink-600', label: 'Pink', bg: 'from-pink-50 to-pink-100' }
]

const ICONS = [
  '📊', '💰', '📦', '✅', '⚠️', '🔥', '⭐', '🎯', '📈', '📉', '💎', '🏆', '🎨', '🚀', '💡', '⚡'
]

export default function CustomCardModal({ 
  isOpen, 
  onClose, 
  onSave, 
  products, 
  existingCards,
  editingCard,
  editingDefaultCard
}: CustomCardModalProps) {
  const [card, setCard] = useState<Partial<CustomCard>>({
    title: '',
    field: 'price',
    operation: 'sum',
    selectedProducts: [],
    color: 'from-blue-500 to-blue-600',
    icon: '📊',
    isVisible: true
  })
  
  const [customFormula, setCustomFormula] = useState('')
  const [previewValue, setPreviewValue] = useState<number>(0)
  const [showProductSelector, setShowProductSelector] = useState(false)

  // Handle editing existing card
  useEffect(() => {
    if (editingCard) {
      setCard({
        id: editingCard.id,
        title: editingCard.title,
        field: editingCard.field,
        operation: editingCard.operation,
        selectedProducts: editingCard.selectedProducts,
        color: editingCard.color,
        icon: editingCard.icon,
        isVisible: editingCard.isVisible
      })
      if (editingCard.operation === 'custom') {
        setCustomFormula(editingCard.operation)
      }
    } else if (editingDefaultCard) {
      // Handle editing default card - create a new custom card based on default
      const defaultCardData = {
        title: `Custom ${editingDefaultCard}`,
        field: 'price', // Default field
        operation: 'sum', // Default operation
        selectedProducts: products.map(p => p.id), // All products
        color: 'from-blue-500 to-blue-600',
        icon: '📊',
        isVisible: true
      }
      setCard(defaultCardData)
    } else {
      // Reset form for new card
      setCard({
        title: '',
        field: 'price',
        operation: 'sum',
        selectedProducts: [],
        color: 'from-blue-500 to-blue-600',
        icon: '📊',
        isVisible: true
      })
      setCustomFormula('')
    }
  }, [editingCard, editingDefaultCard, products])

  // Calculate preview value when card configuration changes
  useEffect(() => {
    if (card.field && card.operation && card.selectedProducts && card.selectedProducts.length > 0) {
      const selectedProductData = products.filter(p => card.selectedProducts!.includes(p.id))
      const values = selectedProductData.map(p => {
        const fieldValue = p[card.field as keyof any]
        // Handle different field types for products vs orders
        if (card.field === 'items' && Array.isArray(fieldValue)) {
          return fieldValue.length
        }
        if (card.field === 'totalPrice' && typeof fieldValue === 'string') {
          return parseFloat(fieldValue) || 0
        }
        return typeof fieldValue === 'number' ? fieldValue : 0
      }).filter(v => v > 0)

      const computedValue = calculateCustomValue(values, card.operation, customFormula, products.length)
      setPreviewValue(computedValue)
    }
  }, [card, products, customFormula])

  const handleSave = () => {
    if (!card.title || !card.selectedProducts || card.selectedProducts.length === 0) return

    const newCard: CustomCard = {
      id: editingCard?.id || `custom-${Date.now()}`,
      title: card.title,
      field: card.field!,
      operation: card.operation!,
      selectedProducts: card.selectedProducts,
      color: card.color!,
      icon: card.icon!,
      isVisible: card.isVisible!,
      computedValue: previewValue
    }

    onSave(newCard)
    onClose()
  }

  const toggleProductSelection = (productId: string) => {
    setCard(prev => ({
      ...prev,
      selectedProducts: (prev.selectedProducts || []).includes(productId)
        ? (prev.selectedProducts || []).filter(id => id !== productId)
        : [...(prev.selectedProducts || []), productId]
    }))
  }

  const selectAllProducts = () => {
    setCard(prev => ({
      ...prev,
      selectedProducts: products.map(p => p.id)
    }))
  }

  const clearProductSelection = () => {
    setCard(prev => ({
      ...prev,
      selectedProducts: []
    }))
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-xl max-w-4xl w-full mx-4 max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <div className="flex items-center space-x-3">
            <div className="p-2 bg-blue-100 rounded-lg">
              <Plus className="h-5 w-5 text-blue-600" />
            </div>
            <div>
              <h2 className="text-lg font-semibold text-gray-900">
                {editingCard ? 'Edit Custom Analytics Card' : editingDefaultCard ? 'Create Custom Card from Default' : 'Create Custom Analytics Card'}
              </h2>
              <p className="text-sm text-gray-500">
                {editingCard ? 'Modify your custom KPI card' : editingDefaultCard ? 'Create a custom version of the default card' : 'Build your own KPI card with custom calculations'}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="p-6 space-y-6">
          {/* Basic Information */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                <Type className="h-4 w-4 inline mr-2" />
                Card Title
              </label>
              <input
                type="text"
                value={card.title}
                onChange={(e) => setCard(prev => ({ ...prev, title: e.target.value }))}
                placeholder="e.g., Average Price of Selected Products"
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                <Hash className="h-4 w-4 inline mr-2" />
                Data Field
              </label>
              <select
                value={card.field}
                onChange={(e) => setCard(prev => ({ ...prev, field: e.target.value }))}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                {FIELDS.map(field => (
                  <option key={field.value} value={field.value}>
                    {field.label}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Enhanced Calculator Interface */}
          <CalculatorInterface
            operation={card.operation || 'sum'}
            onOperationChange={(operation) => setCard(prev => ({ ...prev, operation }))}
            customFormula={customFormula}
            onCustomFormulaChange={setCustomFormula}
            previewValue={previewValue}
            availableVariables={{
              sum: products.filter(p => card.selectedProducts?.includes(p.id))
                .map(p => {
                  const fieldValue = p[card.field as keyof any]
                  // Handle different field types for products vs orders
                  if (card.field === 'items' && Array.isArray(fieldValue)) {
                    return fieldValue.length
                  }
                  if (card.field === 'totalPrice' && typeof fieldValue === 'string') {
                    return parseFloat(fieldValue) || 0
                  }
                  return typeof fieldValue === 'number' ? fieldValue : 0
                })
                .filter(v => v > 0)
                .reduce((acc, val) => acc + val, 0),
              count: card.selectedProducts?.length || 0,
              min: products.filter(p => card.selectedProducts?.includes(p.id))
                .map(p => {
                  const fieldValue = p[card.field as keyof any]
                  if (card.field === 'items' && Array.isArray(fieldValue)) {
                    return fieldValue.length
                  }
                  if (card.field === 'totalPrice' && typeof fieldValue === 'string') {
                    return parseFloat(fieldValue) || 0
                  }
                  return typeof fieldValue === 'number' ? fieldValue : 0
                })
                .filter(v => v > 0)
                .reduce((min, val) => Math.min(min, val), Infinity) || 0,
              max: products.filter(p => card.selectedProducts?.includes(p.id))
                .map(p => {
                  const fieldValue = p[card.field as keyof any]
                  if (card.field === 'items' && Array.isArray(fieldValue)) {
                    return fieldValue.length
                  }
                  if (card.field === 'totalPrice' && typeof fieldValue === 'string') {
                    return parseFloat(fieldValue) || 0
                  }
                  return typeof fieldValue === 'number' ? fieldValue : 0
                })
                .filter(v => v > 0)
                .reduce((max, val) => Math.max(max, val), 0),
              average: products.filter(p => card.selectedProducts?.includes(p.id))
                .map(p => {
                  const fieldValue = p[card.field as keyof any]
                  if (card.field === 'items' && Array.isArray(fieldValue)) {
                    return fieldValue.length
                  }
                  if (card.field === 'totalPrice' && typeof fieldValue === 'string') {
                    return parseFloat(fieldValue) || 0
                  }
                  return typeof fieldValue === 'number' ? fieldValue : 0
                })
                .filter(v => v > 0)
                .reduce((acc, val) => acc + val, 0) / Math.max(1, card.selectedProducts?.length || 0)
            }}
          />

          {/* Product Selection */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="block text-sm font-medium text-gray-700">
                Select Items ({card.selectedProducts?.length || 0} selected)
              </label>
              <div className="flex space-x-2">
                <button
                  onClick={selectAllProducts}
                  className="text-xs px-2 py-1 bg-blue-100 text-blue-700 rounded hover:bg-blue-200"
                >
                  Select All
                </button>
                <button
                  onClick={clearProductSelection}
                  className="text-xs px-2 py-1 bg-gray-100 text-gray-700 rounded hover:bg-gray-200"
                >
                  Clear
                </button>
              </div>
            </div>
            
            <div className="border border-gray-200 rounded-lg max-h-48 overflow-y-auto">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-2 p-3">
                {(products || []).slice(0, 20).map(product => (
                  <label
                    key={product.id}
                    className="flex items-center space-x-2 p-2 hover:bg-gray-50 rounded cursor-pointer"
                  >
                    <input
                      type="checkbox"
                      checked={card.selectedProducts?.includes(product.id) || false}
                      onChange={() => toggleProductSelection(product.id)}
                      className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                    />
                    <span className="text-sm text-gray-700 truncate">
                      {product.title || product.orderNumber || product.customerName || 'Unknown Item'}
                    </span>
                    <span className="text-xs text-gray-500">
                      ₹{product.price || product.total || 0}
                    </span>
                  </label>
                ))}
              </div>
            </div>
          </div>

          {/* Visual Customization */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                <Palette className="h-4 w-4 inline mr-2" />
                Color Theme
              </label>
              <div className="grid grid-cols-4 gap-2">
                {COLORS.map(color => (
                  <button
                    key={color.value}
                    onClick={() => setCard(prev => ({ ...prev, color: color.value }))}
                    className={cn(
                      "h-10 rounded-lg border-2 transition-all duration-200",
                      `bg-gradient-to-r ${color.value}`,
                      card.color === color.value
                        ? "border-gray-800 scale-110"
                        : "border-gray-200 hover:border-gray-400"
                    )}
                  />
                ))}
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Icon
              </label>
              <div className="grid grid-cols-8 gap-2">
                {ICONS.map(icon => (
                  <button
                    key={icon}
                    onClick={() => setCard(prev => ({ ...prev, icon }))}
                    className={cn(
                      "h-10 w-10 text-lg rounded-lg border-2 flex items-center justify-center transition-all duration-200",
                      card.icon === icon
                        ? "border-blue-500 bg-blue-50 scale-110"
                        : "border-gray-200 hover:border-gray-400"
                    )}
                  >
                    {icon}
                  </button>
                ))}
              </div>
            </div>
          </div>

                     {/* Preview */}
           <div className="bg-gray-50 rounded-lg p-4">
             <h3 className="text-sm font-medium text-gray-700 mb-3">Preview</h3>
             <div className={cn(
               "border border-gray-200 rounded-lg p-3 max-w-xs",
               card.color ? `bg-gradient-to-r ${card.color}` : "bg-white"
             )}>
              <div className="flex items-center justify-between mb-1">
                <div className="flex items-center space-x-2">
                  <span className="text-base">{card.icon}</span>
                  <span className="text-xs font-medium text-gray-600 truncate">
                    {card.title || 'Card Title'}
                  </span>
                </div>
              </div>
                                                           <div className={cn(
                  "text-lg font-bold",
                  card.color ? "text-white" : "text-gray-900"
                )}>
                  {formatCardValue(previewValue, card.field || 'price')}
                </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between p-6 border-t border-gray-200">
          <div className="flex items-center space-x-2">
            <input
              type="checkbox"
              checked={card.isVisible}
              onChange={(e) => setCard(prev => ({ ...prev, isVisible: e.target.checked }))}
              className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
            />
            <span className="text-sm text-gray-700">Show card on dashboard</span>
          </div>
          
          <div className="flex space-x-3">
            <button
              onClick={onClose}
              className="px-4 py-2 text-gray-700 bg-gray-100 rounded-md hover:bg-gray-200 transition-colors"
            >
              Cancel
            </button>
            <button
              onClick={handleSave}
              disabled={!card.title || (card.selectedProducts?.length || 0) === 0}
              className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              {editingCard ? 'Update Card' : 'Create Card'}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
