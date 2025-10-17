'use client'

import { useState, useEffect } from 'react'
import { Plus, Settings } from 'lucide-react'
import { cn } from '@/lib/utils'
import UnifiedKPICard from './UnifiedKPICard'
import UnifiedCustomCardModal from './UnifiedCustomCardModal'
import UnifiedCardManagerModal from './UnifiedCardManagerModal'
import { KPICardConfig, CustomCard, TableItem } from './types/unified-table'
import { calculateCustomValue, formatCardValue } from './utils/customCardCalculations'

interface KPIConfig {
  refreshRate: number
  alertThreshold: number
  isVisible: boolean
  showTrend: boolean
  showPercentage: boolean
  customLabel?: string
  customIcon?: string
}

interface UnifiedKPIGridProps<T extends TableItem> {
  kpiCards: Record<string, KPICardConfig>
  data: T[]
  onRefresh?: (kpiKey: string) => void
  onConfigure?: (kpiKey: string, config: KPIConfig) => void
  loading?: boolean
  itemTypeName?: string
  customCardFields?: string[]
  onCustomCardCreate?: (card: Omit<CustomCard, 'id'>) => void
  onCustomCardUpdate?: (card: CustomCard) => void
  onCustomCardDelete?: (cardId: string) => void
}

export default function UnifiedKPIGrid<T extends TableItem>({ 
  kpiCards, 
  data, 
  onRefresh, 
  onConfigure, 
  loading = false,
  itemTypeName = 'items',
  customCardFields = [],
  onCustomCardCreate,
  onCustomCardUpdate,
  onCustomCardDelete
}: UnifiedKPIGridProps<T>) {
  const [customCards, setCustomCards] = useState<CustomCard[]>([])
  const [showCustomCardModal, setShowCustomCardModal] = useState(false)
  const [showCardManagerModal, setShowCardManagerModal] = useState(false)
  const [showCustomTabInManager, setShowCustomTabInManager] = useState(false)
  const [editingCard, setEditingCard] = useState<CustomCard | null>(null)
  const [editingDefaultCard, setEditingDefaultCard] = useState<string | null>(null)
  
  // Initialize default card visibility based on provided kpiCards
  const [defaultCardVisibility, setDefaultCardVisibility] = useState<Record<string, boolean>>(() => {
    const visibility: Record<string, boolean> = {}
    Object.keys(kpiCards).forEach(key => {
      visibility[key] = true
    })
    return visibility
  })

  const [kpiConfigs, setKpiConfigs] = useState<Record<string, KPIConfig>>(() => {
    const configs: Record<string, KPIConfig> = {}
    Object.keys(kpiCards).forEach(key => {
      configs[key] = {
        refreshRate: 30,
        alertThreshold: 0,
        isVisible: true,
        showTrend: true,
        showPercentage: true
      }
    })
    return configs
  })

  // Load custom cards from localStorage
  useEffect(() => {
    try {
      const saved = localStorage.getItem(`custom-cards-${itemTypeName}`)
      if (saved) {
        setCustomCards(JSON.parse(saved))
      }
    } catch (error) {
      console.error('Error loading custom cards:', error)
    }
  }, [itemTypeName])

  // Save custom cards to localStorage
  useEffect(() => {
    try {
      localStorage.setItem(`custom-cards-${itemTypeName}`, JSON.stringify(customCards))
    } catch (error) {
      console.error('Error saving custom cards:', error)
    }
  }, [customCards, itemTypeName])

  // Load card visibility from localStorage
  useEffect(() => {
    try {
      const saved = localStorage.getItem(`card-visibility-${itemTypeName}`)
      if (saved) {
        setDefaultCardVisibility(JSON.parse(saved))
      }
    } catch (error) {
      console.error('Error loading card visibility:', error)
    }
  }, [itemTypeName])

  // Save card visibility to localStorage
  useEffect(() => {
    try {
      localStorage.setItem(`card-visibility-${itemTypeName}`, JSON.stringify(defaultCardVisibility))
    } catch (error) {
      console.error('Error saving card visibility:', error)
    }
  }, [defaultCardVisibility, itemTypeName])

  const handleCreateCustomCard = (cardData: Omit<CustomCard, 'id'>) => {
    const newCard: CustomCard = {
      ...cardData,
      id: `custom-${Date.now()}`
    }
    setCustomCards(prev => [...prev, newCard])
    onCustomCardCreate?.(cardData)
    setShowCustomCardModal(false)
  }

  const handleUpdateCustomCard = (updatedCard: CustomCard) => {
    setCustomCards(prev => prev.map(card => 
      card.id === updatedCard.id ? updatedCard : card
    ))
    onCustomCardUpdate?.(updatedCard)
    setEditingCard(null)
  }

  const handleDeleteCustomCard = (cardId: string) => {
    setCustomCards(prev => prev.filter(card => card.id !== cardId))
    onCustomCardDelete?.(cardId)
  }

  const handleEditCustomCard = (card: CustomCard) => {
    setEditingCard(card)
    setShowCustomCardModal(true)
  }

  const handleToggleCardVisibility = (cardKey: string) => {
    setDefaultCardVisibility(prev => ({
      ...prev,
      [cardKey]: !prev[cardKey]
    }))
  }

  const handleConfigureCard = (cardKey: string) => {
    setEditingDefaultCard(cardKey)
    setShowCardManagerModal(true)
  }

  const handleSaveKpiConfig = (cardKey: string, config: KPIConfig) => {
    setKpiConfigs(prev => ({
      ...prev,
      [cardKey]: config
    }))
    onConfigure?.(cardKey, config)
    setEditingDefaultCard(null)
  }

  const visibleDefaultCards = Object.entries(kpiCards).filter(([key]) => defaultCardVisibility[key])
  const visibleCustomCards = customCards.filter(card => card.isVisible)
  const totalVisibleCards = visibleDefaultCards.length + visibleCustomCards.length

  return (
    <div className="bg-white rounded-lg border border-gray-200 shadow-sm p-4">
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center space-x-2">
          <h3 className="text-lg font-semibold text-gray-900">
            Analytics Overview
          </h3>
          <span className="text-sm text-gray-500">
            ({totalVisibleCards} cards)
          </span>
        </div>
        
        <div className="flex items-center space-x-2">
          <button
            onClick={() => setShowCardManagerModal(true)}
            className="inline-flex items-center px-3 py-1.5 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 transition-colors"
          >
            <Settings className="h-4 w-4 mr-1.5" />
            Manage Cards
          </button>
          
          <button
            onClick={() => setShowCustomCardModal(true)}
            className="inline-flex items-center px-3 py-1.5 text-sm font-medium text-white bg-blue-600 border border-transparent rounded-md hover:bg-blue-700 transition-colors"
          >
            <Plus className="h-4 w-4 mr-1.5" />
            Add Card
          </button>
        </div>
      </div>

      {/* KPI Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4">
        {/* Default KPI Cards */}
        {visibleDefaultCards.map(([key, card]) => (
          <UnifiedKPICard
            key={key}
            title={card.label}
            value={card.metric.value}
            change={card.metric.change}
            trend={card.metric.trend}
            icon={card.icon}
            gradient={card.gradient}
            bgGradient={card.bgGradient}
            isCurrency={card.isCurrency}
            loading={loading}
            onRefresh={() => onRefresh?.(key)}
            onConfigure={() => handleConfigureCard(key)}
            config={kpiConfigs[key]}
          />
        ))}

        {/* Custom KPI Cards */}
        {visibleCustomCards.map((card) => {
          const calculatedValue = calculateCustomValue(card, data)
          
          return (
            <UnifiedKPICard
              key={card.id}
              title={card.title}
              value={calculatedValue}
              change={0} // Custom cards don't have trend data yet
              trend="neutral"
              icon={card.icon}
              gradient={card.color}
              bgGradient={card.color}
              isCurrency={card.operation === 'sum' && card.field.includes('price')}
              loading={loading}
              onRefresh={() => onRefresh?.(card.id)}
              onConfigure={() => handleEditCustomCard(card)}
              isCustom={true}
            />
          )
        })}
      </div>

      {/* Custom Card Modal */}
      {showCustomCardModal && (
        <UnifiedCustomCardModal
          isOpen={showCustomCardModal}
          onClose={() => {
            setShowCustomCardModal(false)
            setEditingCard(null)
          }}
          onSubmit={editingCard ? 
            (cardData: Omit<CustomCard, 'id'>) => handleUpdateCustomCard({ ...cardData, id: editingCard.id }) : 
            handleCreateCustomCard
          }
          editingCard={editingCard}
          availableFields={customCardFields}
          itemTypeName={itemTypeName}
        />
      )}

      {/* Card Manager Modal */}
      {showCardManagerModal && (
        <UnifiedCardManagerModal
          isOpen={showCardManagerModal}
          onClose={() => {
            setShowCardManagerModal(false)
            setEditingDefaultCard(null)
            setShowCustomTabInManager(false)
          }}
          defaultCards={Object.keys(kpiCards)}
          customCards={customCards}
          cardVisibility={defaultCardVisibility}
          onToggleVisibility={handleToggleCardVisibility}
          onEditCustomCard={handleEditCustomCard}
          onDeleteCustomCard={handleDeleteCustomCard}
          onShowCustomTab={() => setShowCustomTabInManager(true)}
          showCustomTab={showCustomTabInManager}
          editingDefaultCard={editingDefaultCard}
          onSaveKpiConfig={handleSaveKpiConfig}
          kpiConfigs={kpiConfigs}
          itemTypeName={itemTypeName}
        />
      )}
    </div>
  )
}
