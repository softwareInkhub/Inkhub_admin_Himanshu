'use client'

import { useState, useEffect } from 'react'
import { X, Settings, Eye, EyeOff, Trash2, Edit } from 'lucide-react'
import { cn } from '@/lib/utils'

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

interface DefaultCard {
  key: string
  label: string
  isVisible: boolean
}

interface CardManagerModalProps {
  isOpen: boolean
  onClose: () => void
  customCards: CustomCard[]
  defaultCards: DefaultCard[]
  onUpdateCustomCard: (cardId: string, updates: Partial<CustomCard>) => void
  onUpdateDefaultCard: (cardKey: string, isVisible: boolean) => void
  onDeleteCustomCard: (cardId: string) => void
  onEditCustomCard: (card: CustomCard) => void
  onEditDefaultCard: (cardKey: string) => void
  defaultActiveTab?: 'default' | 'custom'
}

export default function CardManagerModal({
  isOpen,
  onClose,
  customCards,
  defaultCards,
  onUpdateCustomCard,
  onUpdateDefaultCard,
  onDeleteCustomCard,
  onEditCustomCard,
  onEditDefaultCard,
  defaultActiveTab = 'default'
}: CardManagerModalProps) {
  const [activeTab, setActiveTab] = useState<'default' | 'custom'>(defaultActiveTab)

  // Auto-switch to custom tab if there are custom cards and defaultActiveTab is 'custom'
  useEffect(() => {
    if (isOpen && defaultActiveTab === 'custom' && customCards.length > 0) {
      setActiveTab('custom')
    }
  }, [isOpen, defaultActiveTab, customCards.length])

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full mx-4 max-h-[80vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <div className="flex items-center space-x-3">
            <div className="p-2 bg-gray-100 rounded-lg">
              <Settings className="h-5 w-5 text-gray-600" />
            </div>
            <div>
              <h2 className="text-lg font-semibold text-gray-900">Manage Analytics Cards</h2>
              <p className="text-sm text-gray-500">Show or hide cards on your dashboard</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Tabs */}
        <div className="flex border-b border-gray-200">
          <button
            onClick={() => setActiveTab('default')}
            className={cn(
              "flex-1 px-4 py-3 text-sm font-medium transition-colors",
              activeTab === 'default'
                ? "text-blue-600 border-b-2 border-blue-600 bg-blue-50"
                : "text-gray-500 hover:text-gray-700 hover:bg-gray-50"
            )}
          >
            Default Cards ({defaultCards.filter(c => c.isVisible).length}/{defaultCards.length})
          </button>
          <button
            onClick={() => setActiveTab('custom')}
            className={cn(
              "flex-1 px-4 py-3 text-sm font-medium transition-colors",
              activeTab === 'custom'
                ? "text-blue-600 border-b-2 border-blue-600 bg-blue-50"
                : "text-gray-500 hover:text-gray-700 hover:bg-gray-50"
            )}
          >
            Custom Cards ({customCards.filter(c => c.isVisible).length}/{customCards.length})
          </button>
        </div>

        <div className="p-6">
          {activeTab === 'default' && (
            <div className="space-y-4">
              <h3 className="text-sm font-medium text-gray-900 mb-4">Default Analytics Cards</h3>
              {defaultCards.map(card => (
                <div
                  key={card.key}
                  className="flex items-center justify-between p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
                >
                  <div className="flex items-center space-x-3">
                    <div className="w-3 h-3 bg-blue-500 rounded-full"></div>
                    <span className="text-sm font-medium text-gray-900">{card.label}</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <button
                      onClick={() => onEditDefaultCard(card.key)}
                      className="p-2 text-blue-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                      title="Edit card"
                    >
                      <Edit className="h-4 w-4" />
                    </button>
                    <button
                      onClick={() => onUpdateDefaultCard(card.key, !card.isVisible)}
                      className={cn(
                        "p-2 rounded-lg transition-colors",
                        card.isVisible
                          ? "text-green-600 hover:bg-green-50"
                          : "text-gray-400 hover:bg-gray-100"
                      )}
                      title={card.isVisible ? "Hide card" : "Show card"}
                    >
                      {card.isVisible ? <Eye className="h-4 w-4" /> : <EyeOff className="h-4 w-4" />}
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}

          {activeTab === 'custom' && (
            <div className="space-y-4">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-sm font-medium text-gray-900">Custom Analytics Cards</h3>
                {customCards.length === 0 && (
                  <span className="text-sm text-gray-500">No custom cards created yet</span>
                )}
              </div>
              
              {customCards.map(card => (
                <div
                  key={card.id}
                  className="flex items-center justify-between p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
                >
                  <div className="flex items-center space-x-3 flex-1 min-w-0">
                    <div 
                      className={cn(
                        "w-3 h-3 rounded-full",
                        `bg-gradient-to-r ${card.color}`
                      )}
                    ></div>
                    <div className="flex items-center space-x-2 min-w-0">
                      <span className="text-base">{card.icon}</span>
                      <div className="min-w-0">
                        <div className="text-sm font-medium text-gray-900 truncate">{card.title}</div>
                        <div className="text-xs text-gray-500">
                          {card.operation} of {card.field} ({card.selectedProducts.length} products)
                        </div>
                      </div>
                    </div>
                  </div>
                  
                  <div className="flex items-center space-x-2">
                    <button
                      onClick={() => onEditCustomCard(card)}
                      className="p-2 text-blue-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                      title="Edit card"
                    >
                      <Edit className="h-4 w-4" />
                    </button>
                    <button
                      onClick={() => onUpdateCustomCard(card.id, { isVisible: !card.isVisible })}
                      className={cn(
                        "p-2 rounded-lg transition-colors",
                        card.isVisible
                          ? "text-green-600 hover:bg-green-50"
                          : "text-gray-400 hover:bg-gray-100"
                      )}
                      title={card.isVisible ? "Hide card" : "Show card"}
                    >
                      {card.isVisible ? <Eye className="h-4 w-4" /> : <EyeOff className="h-4 w-4" />}
                    </button>
                    <button
                      onClick={() => onDeleteCustomCard(card.id)}
                      className="p-2 text-red-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                      title="Delete card"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-end p-6 border-t border-gray-200">
          <button
            onClick={onClose}
            className="px-4 py-2 bg-gray-100 text-gray-700 rounded-md hover:bg-gray-200 transition-colors"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  )
}
