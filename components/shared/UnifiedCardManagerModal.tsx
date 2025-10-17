'use client'

import { useState } from 'react'
import { X, Eye, EyeOff, Edit, Trash2, Settings } from 'lucide-react'
import { cn } from '@/lib/utils'
import { CustomCard } from './types/unified-table'

interface UnifiedCardManagerModalProps {
  isOpen: boolean
  onClose: () => void
  defaultCards: string[]
  customCards: CustomCard[]
  cardVisibility: Record<string, boolean>
  onToggleVisibility: (cardKey: string) => void
  onEditCustomCard: (card: CustomCard) => void
  onDeleteCustomCard: (cardId: string) => void
  onShowCustomTab: () => void
  showCustomTab: boolean
  editingDefaultCard?: string | null
  onSaveKpiConfig?: (cardKey: string, config: any) => void
  kpiConfigs?: Record<string, any>
  itemTypeName?: string
}

export default function UnifiedCardManagerModal({
  isOpen,
  onClose,
  defaultCards,
  customCards,
  cardVisibility,
  onToggleVisibility,
  onEditCustomCard,
  onDeleteCustomCard,
  onShowCustomTab,
  showCustomTab,
  editingDefaultCard,
  onSaveKpiConfig,
  kpiConfigs = {},
  itemTypeName = 'items'
}: UnifiedCardManagerModalProps) {
  const [activeTab, setActiveTab] = useState<'default' | 'custom'>('default')

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/60" onClick={onClose} />

      {/* Modal */}
      <div className="relative bg-white w-full max-w-2xl mx-4 rounded-xl shadow-2xl border border-gray-200 overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200 bg-gray-50">
          <h3 className="text-lg font-semibold text-gray-900">
            Manage {itemTypeName.charAt(0).toUpperCase() + itemTypeName.slice(1)} Cards
          </h3>
          <button
            onClick={onClose}
            className="p-2 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-md transition-colors"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Tabs */}
        <div className="flex border-b border-gray-200">
          <button
            onClick={() => setActiveTab('default')}
            className={cn(
              "flex-1 px-6 py-3 text-sm font-medium transition-colors",
              activeTab === 'default'
                ? "text-blue-600 border-b-2 border-blue-600 bg-blue-50"
                : "text-gray-500 hover:text-gray-700"
            )}
          >
            Default Cards ({defaultCards.length})
          </button>
          <button
            onClick={() => {
              setActiveTab('custom')
              onShowCustomTab()
            }}
            className={cn(
              "flex-1 px-6 py-3 text-sm font-medium transition-colors",
              activeTab === 'custom'
                ? "text-blue-600 border-b-2 border-blue-600 bg-blue-50"
                : "text-gray-500 hover:text-gray-700"
            )}
          >
            Custom Cards ({customCards.length})
          </button>
        </div>

        {/* Content */}
        <div className="p-6 max-h-96 overflow-y-auto">
          {activeTab === 'default' ? (
            <div className="space-y-4">
              <h4 className="text-sm font-medium text-gray-900 mb-4">
                Default KPI Cards
              </h4>
              {defaultCards.map(cardKey => (
                <div
                  key={cardKey}
                  className="flex items-center justify-between p-4 bg-gray-50 rounded-lg border border-gray-200"
                >
                  <div className="flex items-center space-x-3">
                    <div className="flex items-center space-x-2">
                      <button
                        onClick={() => onToggleVisibility(cardKey)}
                        className={cn(
                          "p-1 rounded transition-colors",
                          cardVisibility[cardKey]
                            ? "text-gray-600 hover:text-gray-800"
                            : "text-gray-400 hover:text-gray-600"
                        )}
                      >
                        {cardVisibility[cardKey] ? (
                          <Eye className="h-4 w-4" />
                        ) : (
                          <EyeOff className="h-4 w-4" />
                        )}
                      </button>
                      <span className="text-sm font-medium text-gray-900">
                        {cardKey.charAt(0).toUpperCase() + cardKey.slice(1)}
                      </span>
                    </div>
                  </div>
                  
                  <div className="flex items-center space-x-2">
                    {onSaveKpiConfig && (
                      <button
                        onClick={() => onSaveKpiConfig(cardKey, kpiConfigs[cardKey] || {})}
                        className="p-1 text-gray-400 hover:text-gray-600 transition-colors"
                        title="Configure"
                      >
                        <Settings className="h-4 w-4" />
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="space-y-4">
              <div className="flex items-center justify-between mb-4">
                <h4 className="text-sm font-medium text-gray-900">
                  Custom KPI Cards
                </h4>
                <span className="text-sm text-gray-500">
                  {customCards.length} cards
                </span>
              </div>
              
              {customCards.length === 0 ? (
                <div className="text-center py-8">
                  <div className="text-gray-400 text-4xl mb-2">📊</div>
                  <p className="text-sm text-gray-500">
                    No custom cards created yet
                  </p>
                  <p className="text-xs text-gray-400 mt-1">
                    Create custom cards to track specific metrics
                  </p>
                </div>
              ) : (
                customCards.map(card => (
                  <div
                    key={card.id}
                    className="flex items-center justify-between p-4 bg-blue-50 rounded-lg border border-blue-200"
                  >
                    <div className="flex items-center space-x-3">
                      <div className="flex items-center space-x-2">
                        <button
                          onClick={() => onToggleVisibility(card.id)}
                          className={cn(
                            "p-1 rounded transition-colors",
                            card.isVisible
                              ? "text-gray-600 hover:text-gray-800"
                              : "text-gray-400 hover:text-gray-600"
                          )}
                        >
                          {card.isVisible ? (
                            <Eye className="h-4 w-4" />
                          ) : (
                            <EyeOff className="h-4 w-4" />
                          )}
                        </button>
                        <span className="text-2xl">{card.icon}</span>
                        <div>
                          <span className="text-sm font-medium text-gray-900">
                            {card.title}
                          </span>
                          <div className="text-xs text-gray-500">
                            {card.field} • {card.operation}
                          </div>
                        </div>
                      </div>
                    </div>
                    
                    <div className="flex items-center space-x-2">
                      <button
                        onClick={() => onEditCustomCard(card)}
                        className="p-1 text-gray-400 hover:text-gray-600 transition-colors"
                        title="Edit"
                      >
                        <Edit className="h-4 w-4" />
                      </button>
                      <button
                        onClick={() => onDeleteCustomCard(card.id)}
                        className="p-1 text-gray-400 hover:text-red-600 transition-colors"
                        title="Delete"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  </div>
                ))
              )}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-end space-x-3 px-6 py-4 border-t border-gray-200 bg-gray-50">
          <button
            onClick={onClose}
            className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 transition-colors"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  )
}
