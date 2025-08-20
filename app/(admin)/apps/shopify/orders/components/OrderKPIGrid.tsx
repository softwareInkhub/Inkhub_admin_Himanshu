'use client'

import { useState, useEffect } from 'react'
import { Plus, Settings } from 'lucide-react'
import { cn } from '@/lib/utils'
import KPICard from '../../products/components/KPICard'
import CustomCardModal from '../../products/components/CustomCardModal'
import CardManagerModal from '../../products/components/CardManagerModal'
import { Order } from '../types'
import { CustomCard } from '../../products/types'
import { calculateCustomValue, formatCardValue } from '../../products/utils/customCardCalculations'

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

interface OrderKPIGridProps {
  kpiMetrics: {
    totalOrders: { label: string; metric: KPIMetric; icon: string; color: string }
    paidOrders: { label: string; metric: KPIMetric; icon: string; color: string }
    pendingOrders: { label: string; metric: KPIMetric; icon: string; color: string }
    fulfilledOrders: { label: string; metric: KPIMetric; icon: string; color: string }
    totalValue: { label: string; metric: KPIMetric; icon: string; color: string }
    avgOrderValue: { label: string; metric: KPIMetric; icon: string; color: string }
  }
  orders: Order[]
  onRefresh?: (kpiKey: string) => void
  onConfigure?: (kpiKey: string, config: KPIConfig) => void
}

export default function OrderKPIGrid({ kpiMetrics, orders, onRefresh, onConfigure }: OrderKPIGridProps) {
  const [customCards, setCustomCards] = useState<CustomCard[]>([])
  const [showCustomCardModal, setShowCustomCardModal] = useState(false)
  const [showCardManagerModal, setShowCardManagerModal] = useState(false)
  const [showCustomTabInManager, setShowCustomTabInManager] = useState(false)
  const [editingCard, setEditingCard] = useState<CustomCard | null>(null)
  const [editingDefaultCard, setEditingDefaultCard] = useState<string | null>(null)
  const [defaultCardVisibility, setDefaultCardVisibility] = useState<Record<string, boolean>>({
    totalOrders: true,
    paidOrders: true,
    pendingOrders: true,
    fulfilledOrders: true,
    totalValue: true,
    avgOrderValue: true
  })

  const [kpiConfigs, setKpiConfigs] = useState<Record<string, KPIConfig>>({
    totalOrders: {
      refreshRate: 30,
      alertThreshold: 0,
      isVisible: true,
      showTrend: true,
      showPercentage: true
    },
    paidOrders: {
      refreshRate: 30,
      alertThreshold: 0,
      isVisible: true,
      showTrend: true,
      showPercentage: true
    },
    pendingOrders: {
      refreshRate: 30,
      alertThreshold: 0,
      isVisible: true,
      showTrend: true,
      showPercentage: true
    },
    fulfilledOrders: {
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
    avgOrderValue: {
      refreshRate: 30,
      alertThreshold: 0,
      isVisible: true,
      showTrend: true,
      showPercentage: true
    }
  })

  // Load custom cards and visibility settings from localStorage
  useEffect(() => {
    const savedCustomCards = localStorage.getItem('shopify-orders-custom-cards')
    const savedDefaultVisibility = localStorage.getItem('shopify-orders-default-card-visibility')
    
    if (savedCustomCards) {
      try {
        setCustomCards(JSON.parse(savedCustomCards))
      } catch (error) {
        console.error('Error loading custom cards:', error)
      }
    }
    
    if (savedDefaultVisibility) {
      try {
        setDefaultCardVisibility(JSON.parse(savedDefaultVisibility))
      } catch (error) {
        console.error('Error loading default card visibility:', error)
      }
    }
  }, [])

  // Save custom cards and visibility settings to localStorage
  useEffect(() => {
    localStorage.setItem('shopify-orders-custom-cards', JSON.stringify(customCards))
  }, [customCards])

  useEffect(() => {
    localStorage.setItem('shopify-orders-default-card-visibility', JSON.stringify(defaultCardVisibility))
  }, [defaultCardVisibility])

  const kpiData = [
    { 
      key: 'totalOrders', 
      label: kpiMetrics.totalOrders.label, 
      metric: kpiMetrics.totalOrders.metric,
      gradient: 'from-blue-500 to-blue-600',
      icon: kpiMetrics.totalOrders.icon,
      bgGradient: 'from-blue-50 to-blue-100',
      isCurrency: false
    },
    { 
      key: 'paidOrders', 
      label: kpiMetrics.paidOrders.label, 
      metric: kpiMetrics.paidOrders.metric,
      gradient: 'from-green-500 to-green-600',
      icon: kpiMetrics.paidOrders.icon,
      bgGradient: 'from-green-50 to-green-100',
      isCurrency: false
    },
    { 
      key: 'pendingOrders', 
      label: kpiMetrics.pendingOrders.label, 
      metric: kpiMetrics.pendingOrders.metric,
      gradient: 'from-yellow-500 to-yellow-600',
      icon: kpiMetrics.pendingOrders.icon,
      bgGradient: 'from-yellow-50 to-yellow-100',
      isCurrency: false
    },
    { 
      key: 'fulfilledOrders', 
      label: kpiMetrics.fulfilledOrders.label, 
      metric: kpiMetrics.fulfilledOrders.metric,
      gradient: 'from-purple-500 to-purple-600',
      icon: kpiMetrics.fulfilledOrders.icon,
      bgGradient: 'from-purple-50 to-purple-100',
      isCurrency: false
    },
    { 
      key: 'totalValue', 
      label: kpiMetrics.totalValue.label, 
      metric: kpiMetrics.totalValue.metric,
      gradient: 'from-indigo-500 to-indigo-600',
      icon: kpiMetrics.totalValue.icon,
      bgGradient: 'from-indigo-50 to-indigo-100',
      isCurrency: true
    },
    { 
      key: 'avgOrderValue', 
      label: kpiMetrics.avgOrderValue.label, 
      metric: kpiMetrics.avgOrderValue.metric,
      gradient: 'from-orange-500 to-orange-600',
      icon: kpiMetrics.avgOrderValue.icon,
      bgGradient: 'from-orange-50 to-orange-100',
      isCurrency: true
    }
  ]

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

  // Calculate custom card values for orders
  const calculateCustomCardValue = (card: CustomCard): number => {
    const selectedOrderData = orders.filter(o => card.selectedProducts.includes(o.id))
    const values = selectedOrderData.map(o => {
      const fieldValue = o[card.field as keyof Order]
      return typeof fieldValue === 'number' ? fieldValue : 0
    }).filter(v => v > 0)

    return calculateCustomValue(values, card.operation, undefined, orders.length)
  }

  return (
          <div className="bg-white shadow-sm">
        {/* Header with Add Card and Manage Cards buttons */}
        <div className="flex items-center justify-between mb-2 px-6 py-2">
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

      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3 px-6 pb-3">
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
            />
          ))}
        
        {/* Custom KPI Cards */}
        {customCards
          .filter(card => card.isVisible)
          .map(card => {
            const computedValue = calculateCustomCardValue(card)
            const isCurrency = card.field === 'total' || card.field === 'totalPrice'
            
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
                    <div className="flex items-center space-x-1 flex-shrink-0">
                      {/* Custom card indicator */}
                      <div className="w-2 h-2 bg-blue-500 rounded-full opacity-60"></div>
                    </div>
                  </div>
                  
                  <div className={cn(
                    "text-lg font-bold",
                    card.color
                  )}>
                    {formatCardValue(computedValue, card.field)}
                  </div>
                  
                  <div className="text-xs text-gray-500 mt-1">
                    {card.operation} of {card.field} ({card.selectedProducts.length} orders)
                  </div>
                </div>
              </div>
            )
          })}
      </div>

      {/* Modals */}
      <CustomCardModal
        isOpen={showCustomCardModal}
        onClose={() => {
          setShowCustomCardModal(false)
          setEditingCard(null)
          setEditingDefaultCard(null)
        }}
        onSave={handleSaveCustomCard}
        products={orders as any} // Cast to any to work with existing modal
        existingCards={customCards}
        editingCard={editingCard}
        editingDefaultCard={editingDefaultCard}
      />

      <CardManagerModal
        isOpen={showCardManagerModal}
        onClose={() => {
          setShowCardManagerModal(false)
          setShowCustomTabInManager(false)
        }}
        customCards={customCards}
        defaultCards={Object.entries(defaultCardVisibility).map(([key, isVisible]) => ({
          key,
          label: kpiData.find(k => k.key === key)?.label || key,
          isVisible
        }))}
        onUpdateCustomCard={handleUpdateCustomCard}
        onUpdateDefaultCard={handleUpdateDefaultCard}
        onDeleteCustomCard={handleDeleteCustomCard}
        onEditCustomCard={handleEditCustomCard}
        onEditDefaultCard={handleEditDefaultCard}
        defaultActiveTab={showCustomTabInManager ? 'custom' : 'default'}
      />
    </div>
  )
}
