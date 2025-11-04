'use client'

import { useState, useEffect } from 'react'
import { Plus, Settings } from 'lucide-react'
import { cn } from '@/lib/utils'
import KPICard from './KPICard'
import { CustomCardModal, CardManagerModal } from './index'
import { CustomCard } from './types'
import { calculateCustomValue } from './utils/customCardCalculations'

interface KPIMetric {
  value: number
  change: number
  trend: 'up' | 'down' | 'neutral'
}

interface KPIConfig {
  refreshRate: number
  alertThreshold: number
  isVisible: boolean
  showTrend: boolean
  showPercentage: boolean
  customLabel?: string
  customIcon?: string
}

interface KPIGridProps {
  // Generic: any set of KPI entries keyed by id. Each entry should include metric and optional display properties
  kpiMetrics: Record<string, { label?: string; metric?: KPIMetric; gradient?: string; icon?: string; bgGradient?: string; isCurrency?: boolean }>
  onRefresh?: (kpiKey: string) => void
  onConfigure?: (kpiKey: string, config: KPIConfig) => void
  items?: any[] // Generic items for custom card calculations
  loading?: boolean
}

export default function KPIGrid({ kpiMetrics, onRefresh, onConfigure, items = [], loading = false }: KPIGridProps) {
  const [customCards, setCustomCards] = useState<CustomCard[]>([])
  const [showCustomCardModal, setShowCustomCardModal] = useState(false)
  const [showCardManagerModal, setShowCardManagerModal] = useState(false)
  const [showCustomTabInManager, setShowCustomTabInManager] = useState(false)
  const [editingCard, setEditingCard] = useState<CustomCard | null>(null)
  const [editingDefaultCard, setEditingDefaultCard] = useState<string | null>(null)
  const [defaultCardVisibility, setDefaultCardVisibility] = useState<Record<string, boolean>>(() => {
    // Initialize from localStorage on mount, or default all to visible
    try {
      const savedVisibility = localStorage.getItem('shared-default-card-visibility')
      if (savedVisibility) {
        return JSON.parse(savedVisibility)
      }
    } catch {}
    
    // Default: all cards visible
    const initial: Record<string, boolean> = {}
    Object.keys(kpiMetrics || {}).forEach(key => {
      initial[key] = true
    })
    return initial
  })

  // Load custom cards from localStorage (only once on mount)
  useEffect(() => {
    try {
      const savedCustomCards = localStorage.getItem('shared-custom-cards')
      if (savedCustomCards) {
        setCustomCards(JSON.parse(savedCustomCards))
      }
    } catch (error) {
      console.error('Error loading custom cards:', error)
    }
  }, [])

  // Update visibility for any NEW KPI keys that appear (without causing infinite loop)
  useEffect(() => {
    const currentKeys = Object.keys(kpiMetrics || {})
    const visibilityKeys = Object.keys(defaultCardVisibility)
    const newKeys = currentKeys.filter(key => !visibilityKeys.includes(key))
    
    if (newKeys.length > 0) {
      setDefaultCardVisibility(prev => {
        const updated = { ...prev }
        newKeys.forEach(key => {
          updated[key] = true // New cards default to visible
        })
        return updated
      })
    }
  }, [Object.keys(kpiMetrics || {}).join(',')]) // Stable dependency - only changes when keys change

  // Save custom cards to localStorage
  useEffect(() => {
    try {
      localStorage.setItem('shared-custom-cards', JSON.stringify(customCards))
      // Dispatch event to notify other components
      window.dispatchEvent(new CustomEvent('kpi-cards-updated'))
    } catch (error) {
      console.error('Error saving custom cards:', error)
    }
  }, [customCards])

  // Save default card visibility to localStorage
  useEffect(() => {
    try {
      localStorage.setItem('shared-default-card-visibility', JSON.stringify(defaultCardVisibility))
      // Dispatch event to notify other components
      window.dispatchEvent(new CustomEvent('kpi-cards-updated'))
    } catch (error) {
      console.error('Error saving card visibility:', error)
    }
  }, [defaultCardVisibility])
  const [kpiConfigs, setKpiConfigs] = useState<Record<string, KPIConfig>>({
    totalProducts: {
      refreshRate: 30,
      alertThreshold: 0,
      isVisible: true,
      showTrend: true,
      showPercentage: true
    },
    activeProducts: {
      refreshRate: 30,
      alertThreshold: 0,
      isVisible: true,
      showTrend: true,
      showPercentage: true
    },
    draftProducts: {
      refreshRate: 30,
      alertThreshold: 0,
      isVisible: true,
      showTrend: true,
      showPercentage: true
    },
    totalValue: {
      refreshRate: 30,
      alertThreshold: 0,
      isVisible: true,
      showTrend: true,
      showPercentage: true
    },
    averagePrice: {
      refreshRate: 30,
      alertThreshold: 0,
      isVisible: true,
      showTrend: true,
      showPercentage: true
    },
    lowStock: {
      refreshRate: 30,
      alertThreshold: 10, // Default threshold for low stock
      isVisible: true,
      showTrend: true,
      showPercentage: true
    }
  })

  const palette = [
    { gradient: 'from-blue-500 to-blue-600', bg: 'from-blue-50 to-blue-100', icon: '📦' },
    { gradient: 'from-green-500 to-green-600', bg: 'from-green-50 to-green-100', icon: '✅' },
    { gradient: 'from-yellow-500 to-yellow-600', bg: 'from-yellow-50 to-yellow-100', icon: '📝' },
    { gradient: 'from-purple-500 to-purple-600', bg: 'from-purple-50 to-purple-100', icon: '💰' },
    { gradient: 'from-indigo-500 to-indigo-600', bg: 'from-indigo-50 to-indigo-100', icon: '📊' },
    { gradient: 'from-red-500 to-red-600', bg: 'from-red-50 to-red-100', icon: '⚠️' }
  ]

  const entries = Object.entries(kpiMetrics || {})
  const kpiData = entries.map(([key, cfg], idx) => {
    const paletteIdx = idx % palette.length
    const { gradient, bg, icon } = palette[paletteIdx]
    const metric: KPIMetric = cfg.metric || { value: 0, change: 0, trend: 'neutral' }
    const label = cfg.label || key
    return {
      key,
      label,
      metric,
      gradient: cfg.gradient || gradient,
      icon: cfg.icon || icon,
      bgGradient: cfg.bgGradient || bg,
      isCurrency: cfg.isCurrency || false
    }
  })

  const handleRefresh = (kpiKey: string) => {
    onRefresh?.(kpiKey)
  }

  const handleConfigure = (kpiKey: string, config: KPIConfig) => {
    setKpiConfigs(prev => ({
      ...prev,
      [kpiKey]: config
    }))
    onConfigure?.(kpiKey, config)
  }

  const handleSaveCustomCard = (card: CustomCard) => {
    if (editingCard) {
      // Update existing card
      setCustomCards(prev => prev.map(c => c.id === editingCard.id ? card : c))
      setEditingCard(null)
    } else {
      // Add new card
      setCustomCards(prev => [...prev, card])
      // Automatically open manage cards modal and switch to custom tab
      setShowCustomTabInManager(true)
      setShowCardManagerModal(true)
    }
  }

  const handleUpdateCustomCard = (cardId: string, updates: Partial<CustomCard>) => {
    setCustomCards(prev => prev.map(card => 
      card.id === cardId ? { ...card, ...updates } : card
    ))
  }

  const handleDeleteCustomCard = (cardId: string) => {
    setCustomCards(prev => prev.filter(card => card.id !== cardId))
  }

  const handleEditCustomCard = (card: CustomCard) => {
    setEditingCard(card)
    setShowCustomCardModal(true)
    setShowCardManagerModal(false)
  }

  const handleEditDefaultCard = (cardKey: string) => {
    setEditingDefaultCard(cardKey)
    setShowCustomCardModal(true)
    setShowCardManagerModal(false)
  }

  const handleUpdateDefaultCard = (cardKey: string, isVisible: boolean) => {
    setDefaultCardVisibility(prev => ({ ...prev, [cardKey]: isVisible }))
  }

  // Calculate custom card values
  const calculateCustomCardValue = (card: CustomCard): number => {
    const selectedData = items.filter(item => card.selectedProducts.includes(item.id))
    const values = selectedData.map(item => {
      const fieldValue = item[card.field]
      return typeof fieldValue === 'number' ? fieldValue : 0
    }).filter(v => v > 0)

    return calculateCustomValue(values, card.operation, undefined, items.length)
  }

  return (
    <>
      <div className="bg-white">
        {/* Header with Add Card and Manage Cards buttons */}
        <div className="flex items-center justify-between mb-2 px-4 py-2">
          <div className="flex items-center space-x-2">
            <h3 className="text-sm font-medium text-gray-700">Analytics Overview</h3>
            <span className="text-xs text-gray-500">
              ({kpiData.filter(({ key }) => defaultCardVisibility[key] && kpiConfigs[key]?.isVisible !== false).length + customCards.filter(c => c.isVisible).length} cards)
            </span>
          </div>
          <div className="flex items-center space-x-2">
            <button
              onClick={() => setShowCardManagerModal(true)}
              className="flex items-center space-x-1 px-2 py-1 text-xs text-gray-600 hover:text-gray-800 bg-gray-100 hover:bg-gray-200 rounded-md transition-colors"
            >
              <Settings className="h-3 w-3" />
              <span>Manage Cards</span>
            </button>
            <button
              onClick={() => setShowCustomCardModal(true)}
              className="flex items-center space-x-1 px-3 py-1 text-xs font-medium text-white bg-blue-600 hover:bg-blue-700 rounded-md transition-colors shadow-sm hover:shadow-md"
            >
              <Plus className="h-3 w-3" />
              <span>Add Card</span>
            </button>
          </div>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3 px-4 pb-2">
        {/* Default KPI Cards */}
        {kpiData
          .filter(({ key }) => defaultCardVisibility[key] && kpiConfigs[key]?.isVisible !== false)
          .map(({ key, label, metric, gradient, icon, bgGradient, isCurrency }) => (
            <KPICard
              key={key}
              label={label}
              metric={metric}
              gradient={gradient}
              icon={icon}
              bgGradient={bgGradient}
              isCurrency={isCurrency}
              config={kpiConfigs[key]}
              onRefresh={() => handleRefresh(key)}
              onConfigure={(config) => handleConfigure(key, config)}
              loading={loading}
            />
          ))}
        
        {/* Custom KPI Cards */}
        {customCards
          .filter(card => card.isVisible)
          .map(card => {
            const computedValue = calculateCustomCardValue(card)
            const isCurrency = card.field === 'total' || card.field === 'totalPrice' || card.field === 'price'
            
            return (
              <div
                key={card.id}
                className={cn(
                  "bg-white border border-gray-200 rounded-lg p-2 hover:shadow-md transition-all duration-200 group",
                  "relative overflow-visible"
                )}
              >
                {/* Background Gradient */}
                <div className={cn(
                  "absolute inset-0 opacity-5 group-hover:opacity-10 transition-opacity duration-200 rounded-lg",
                  `bg-gradient-to-r ${card.color}`
                )} />
                
                <div className="relative z-10">
                  <div className="flex items-center justify-between mb-1">
                    <div className="flex items-center space-x-2 flex-1 min-w-0">
                      <span className="text-base flex-shrink-0">{card.icon}</span>
                      <span className="text-xs font-medium text-gray-600 truncate">{card.title}</span>
                    </div>
                  </div>
                  <div className="mt-2">
                    <div className="text-xl font-bold text-gray-900">
                      {isCurrency ? `₹${computedValue.toLocaleString()}` : computedValue.toLocaleString()}
                    </div>
                    <div className="text-xs text-gray-500 mt-1 capitalize">{card.operation}</div>
                  </div>
      </div>
    </div>
            )
          })}
      </div>
      </div>

      {/* Custom Card Modal */}
      {showCustomCardModal && (
        <CustomCardModal
          isOpen={showCustomCardModal}
          onClose={() => {
            setShowCustomCardModal(false)
            setEditingCard(null)
            setEditingDefaultCard(null)
          }}
          onSave={handleSaveCustomCard}
          items={items}
          editingCard={editingCard}
          existingCards={customCards}
          editingDefaultCard={editingDefaultCard}
        />
      )}

      {/* Card Manager Modal */}
      {showCardManagerModal && (
        <CardManagerModal
          isOpen={showCardManagerModal}
          onClose={() => {
            setShowCardManagerModal(false)
            setShowCustomTabInManager(false)
          }}
          defaultCards={kpiData.map(({ key, label }) => ({
            key,
            label,
            isVisible: defaultCardVisibility[key] ?? true
          }))}
          customCards={customCards}
          onUpdateDefaultCard={handleUpdateDefaultCard}
          onUpdateCustomCard={handleUpdateCustomCard}
          onDeleteCustomCard={handleDeleteCustomCard}
          onEditCustomCard={handleEditCustomCard}
          onEditDefaultCard={handleEditDefaultCard}
        />
      )}
    </>
  )
}