'use client'

import React, { useMemo, useState } from 'react'
import { CustomCard } from '@/components/shared/types'

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

  const defaultCount = useMemo(() => defaultCards?.length || 0, [defaultCards])
  const customCount = useMemo(() => customCards?.length || 0, [customCards])

  if (!isOpen) return null
  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-[9999]">
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-3xl">
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-3 border-b">
          <div className="flex items-center gap-2">
            <div className="h-7 w-7 rounded-lg bg-gray-100 flex items-center justify-center">⚙️</div>
            <div>
              <div className="text-base font-semibold text-gray-900">Manage Analytics Cards</div>
              <div className="text-xs text-gray-500">Show or hide cards on your dashboard</div>
            </div>
          </div>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600">✕</button>
        </div>

        {/* Tabs */}
        <div className="px-5 pt-2">
          <div className="flex border-b">
            <button
              onClick={() => setActiveTab('default')}
              className={`px-4 py-2 text-sm font-medium ${activeTab==='default' ? 'text-blue-700 border-b-2 border-blue-600' : 'text-gray-600 hover:text-gray-800'}`}
            >
              Default Cards ({defaultCount})
            </button>
            <button
              onClick={() => setActiveTab('custom')}
              className={`px-4 py-2 text-sm font-medium ${activeTab==='custom' ? 'text-blue-700 border-b-2 border-blue-600' : 'text-gray-600 hover:text-gray-800'}`}
            >
              Custom Cards ({customCount})
            </button>
          </div>
        </div>

        {/* Body */}
        <div className="px-5 py-3 max-h-[70vh] overflow-auto">
          {activeTab === 'default' ? (
            <div className="space-y-3">
              <div className="text-sm font-medium text-gray-800">Default Analytics Cards</div>
              <div className="space-y-2">
                {defaultCards?.map((card) => (
                  <div key={card.key} className={`flex items-center justify-between p-3 border rounded-lg ${card.isVisible ? 'bg-white border-gray-200' : 'bg-gray-50 border-gray-300 opacity-60'}`}>
                    <div className="flex items-center gap-2">
                      <span className={`h-2 w-2 rounded-full ${card.isVisible ? 'bg-blue-500' : 'bg-gray-400'}`}></span>
                      <span className={`text-sm ${card.isVisible ? 'text-gray-900' : 'text-gray-500'}`}>{card.label}</span>
                      {!card.isVisible && (
                        <span className="ml-2 px-2 py-0.5 text-xs font-medium bg-gray-200 text-gray-600 rounded-full">
                          Hidden
                        </span>
                      )}
                    </div>
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => onEditDefaultCard(card.key)}
                        title="Edit"
                        className="h-8 w-8 rounded-md border border-gray-200 text-blue-600 hover:bg-blue-50"
                      >
                        ✏️
                      </button>
                      <button
                        onClick={() => onUpdateDefaultCard(card.key, !card.isVisible)}
                        title={card.isVisible ? 'Hide Card' : 'Show Card'}
                        className={`h-8 w-8 rounded-md border transition-all ${card.isVisible ? 'text-green-600 border-green-200 bg-green-50 hover:bg-green-100' : 'text-red-500 border-red-200 bg-red-50 hover:bg-red-100'}`}
                      >
                        {card.isVisible ? '👁️' : '👁️‍🗨️'}
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ) : (
            <div className="space-y-3">
              <div className="text-sm font-medium text-gray-800">Your Custom Cards</div>
              {customCards && customCards.length > 0 ? (
                <div className="space-y-2">
                  {customCards.map(card => (
                    <div key={card.id} className={`flex items-center justify-between p-3 border rounded-lg ${card.isVisible ? 'bg-white border-gray-200' : 'bg-gray-50 border-gray-300 opacity-60'}`}>
                      <div className="flex items-center gap-2 min-w-0">
                        <span className="text-lg">{card.icon}</span>
                        <span className={`text-sm truncate ${card.isVisible ? 'text-gray-900' : 'text-gray-500'}`}>{card.title}</span>
                        <span className={`ml-2 text-[11px] ${card.isVisible ? 'text-gray-500' : 'text-gray-400'}`}>{card.operation} of {card.field}</span>
                        {!card.isVisible && (
                          <span className="ml-2 px-2 py-0.5 text-xs font-medium bg-gray-200 text-gray-600 rounded-full">
                            Hidden
                          </span>
                        )}
                      </div>
                      <div className="flex items-center gap-2">
                        <button onClick={() => onEditCustomCard(card)} title="Edit" className="h-8 w-8 rounded-md border border-gray-200 text-blue-600 hover:bg-blue-50">✏️</button>
                        <button onClick={() => onUpdateCustomCard(card.id, { isVisible: !card.isVisible })} title={card.isVisible ? 'Hide Card' : 'Show Card'} className={`h-8 w-8 rounded-md border transition-all ${card.isVisible ? 'text-green-600 border-green-200 bg-green-50 hover:bg-green-100' : 'text-red-500 border-red-200 bg-red-50 hover:bg-red-100'}`}>
                          {card.isVisible ? '👁️' : '👁️‍🗨️'}
                        </button>
                        <button onClick={() => onDeleteCustomCard(card.id)} title="Delete" className="h-8 w-8 rounded-md border border-red-200 text-red-600 hover:bg-red-50">🗑️</button>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-sm text-gray-500">You have not created any custom cards yet.</div>
              )}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-end gap-2 px-5 py-3 border-t bg-gray-50">
          <button onClick={onClose} className="px-3.5 py-2 text-sm bg-white border border-gray-300 rounded-md hover:bg-gray-50">Close</button>
        </div>
      </div>
    </div>
  )
}





