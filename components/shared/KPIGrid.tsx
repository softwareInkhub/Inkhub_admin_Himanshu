'use client'

import { useState, useEffect, useRef } from 'react'
import { Plus, Settings, RefreshCw, Download } from 'lucide-react'
import { createPortal } from 'react-dom'
import { cn } from '@/lib/utils'
import { KPIGridProps, KPIMetrics } from './types'
import CustomCardModal from '@/app/(admin)/apps/shopify/products/components/CustomCardModal'
import CardManagerModal from '@/app/(admin)/apps/shopify/products/components/CardManagerModal'

interface CustomCard {
  id: string
  title: string
  field: string
  operation: string
  selectedProducts: string[]
  icon: string
  color: string
  isVisible: boolean
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

export default function KPIGrid({
  kpiMetrics,
  data,
  onRefresh,
  onConfigure,
  compact = false
}: KPIGridProps) {
  const [customCards, setCustomCards] = useState<CustomCard[]>([])
  const [showCustomCardModal, setShowCustomCardModal] = useState(false)
  const [showCardManagerModal, setShowCardManagerModal] = useState(false)
  const [showCustomTabInManager, setShowCustomTabInManager] = useState(false)
  const [editingCard, setEditingCard] = useState<CustomCard | null>(null)
  const [editingDefaultCard, setEditingDefaultCard] = useState<string | null>(null)
  const [defaultCardVisibility, setDefaultCardVisibility] = useState<Record<string, boolean>>({})

  const [kpiConfigs, setKpiConfigs] = useState<Record<string, KPIConfig>>({})
  
  // KPI Settings dropdown state
  const [showSettings, setShowSettings] = useState<string | null>(null)
  const [localConfig, setLocalConfig] = useState<KPIConfig | null>(null)
  const [dropdownPosition, setDropdownPosition] = useState<{ x: number; y: number } | null>(null)
  const settingsRef = useRef<HTMLDivElement>(null)
  const buttonRefs = useRef<Record<string, HTMLButtonElement | null>>({})

  // Load custom cards and visibility settings from localStorage
  useEffect(() => {
    const savedCustomCards = localStorage.getItem('shared-custom-cards')
    const savedDefaultVisibility = localStorage.getItem('shared-default-card-visibility')
    
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
    localStorage.setItem('shared-custom-cards', JSON.stringify(customCards))
  }, [customCards])

  useEffect(() => {
    localStorage.setItem('shared-default-card-visibility', JSON.stringify(defaultCardVisibility))
  }, [defaultCardVisibility])

  // Handle click outside to close settings dropdown
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (settingsRef.current && !settingsRef.current.contains(event.target as Node)) {
        setShowSettings(null)
        setLocalConfig(null)
        setDropdownPosition(null)
      }
    }

    document.addEventListener('mousedown', handleClickOutside)
    return () => {
      document.removeEventListener('mousedown', handleClickOutside)
    }
  }, [])

  // Calculate dropdown position when settings are opened
  const calculateDropdownPosition = (buttonElement: HTMLButtonElement) => {
    const rect = buttonElement.getBoundingClientRect()
    const viewportWidth = window.innerWidth
    const viewportHeight = window.innerHeight
    const dropdownWidth = 256 // w-64 = 16rem = 256px
    
    let x = rect.right - dropdownWidth / 2
    let y = rect.bottom + 4 // mt-1 = 4px
    
    // Ensure dropdown doesn't go off-screen horizontally
    if (x < 8) x = 8
    if (x + dropdownWidth > viewportWidth - 8) x = viewportWidth - dropdownWidth - 8
    
    // If dropdown would go off-screen vertically, position it above the button
    if (y + 400 > viewportHeight - 8) { // 400px is approximate dropdown height
      y = rect.top - 400 - 4
    }
    
    return { x, y }
  }

  const kpiData = Object.entries(kpiMetrics).map(([key, metric]) => {
    // Determine gradient and icon based on the metric key or use defaults
    let gradient = 'from-blue-500 to-blue-600'
    let icon = '📊'
    let bgGradient = 'from-blue-50 to-blue-100'
    let isCurrency = false

    // Map common KPI keys to appropriate styling
    if (key.toLowerCase().includes('total')) {
      gradient = 'from-blue-500 to-blue-600'
      icon = '📊'
      bgGradient = 'from-blue-50 to-blue-100'
    } else if (key.toLowerCase().includes('active')) {
      gradient = 'from-green-500 to-green-600'
      icon = '✅'
      bgGradient = 'from-green-50 to-green-100'
    } else if (key.toLowerCase().includes('draft')) {
      gradient = 'from-yellow-500 to-yellow-600'
      icon = '📝'
      bgGradient = 'from-yellow-50 to-yellow-100'
    } else if (key.toLowerCase().includes('value') || key.toLowerCase().includes('price') || key.toLowerCase().includes('cost')) {
      gradient = 'from-purple-500 to-purple-600'
      icon = '💰'
      bgGradient = 'from-purple-50 to-purple-100'
      isCurrency = true
    } else if (key.toLowerCase().includes('average') || key.toLowerCase().includes('avg')) {
      gradient = 'from-indigo-500 to-indigo-600'
      icon = '📈'
      bgGradient = 'from-indigo-50 to-indigo-100'
    } else if (key.toLowerCase().includes('stock') || key.toLowerCase().includes('low')) {
      gradient = 'from-red-500 to-red-600'
      icon = '⚠️'
      bgGradient = 'from-red-50 to-red-100'
    } else if (key.toLowerCase().includes('likes')) {
      gradient = 'from-pink-500 to-pink-600'
      icon = '❤️'
      bgGradient = 'from-pink-50 to-pink-100'
    } else if (key.toLowerCase().includes('comments')) {
      gradient = 'from-green-500 to-green-600'
      icon = '💬'
      bgGradient = 'from-green-50 to-green-100'
    } else if (key.toLowerCase().includes('repins') || key.toLowerCase().includes('shares')) {
      gradient = 'from-indigo-500 to-indigo-600'
      icon = '🔄'
      bgGradient = 'from-indigo-50 to-indigo-100'
    } else if (key.toLowerCase().includes('engagement')) {
      gradient = 'from-orange-500 to-orange-600'
      icon = '📊'
      bgGradient = 'from-orange-50 to-orange-100'
    } else if (key.toLowerCase().includes('boards')) {
      gradient = 'from-teal-500 to-teal-600'
      icon = '📋'
      bgGradient = 'from-teal-50 to-teal-100'
    } else if (key.toLowerCase().includes('pins')) {
      gradient = 'from-red-500 to-red-600'
      icon = '📌'
      bgGradient = 'from-red-50 to-red-100'
    } else if (key.toLowerCase().includes('designs')) {
      gradient = 'from-purple-500 to-purple-600'
      icon = '🎨'
      bgGradient = 'from-purple-50 to-purple-100'
    } else if (key.toLowerCase().includes('views')) {
      gradient = 'from-blue-500 to-blue-600'
      icon = '👁️'
      bgGradient = 'from-blue-50 to-blue-100'
    } else if (key.toLowerCase().includes('downloads')) {
      gradient = 'from-green-500 to-green-600'
      icon = '⬇️'
      bgGradient = 'from-green-50 to-green-100'
    }

    // Use custom icon if provided in the metric
    if (metric.icon) {
      icon = metric.icon
    }

    return {
      key,
      label: metric.label || key,
      metric,
      gradient,
      icon,
      bgGradient,
      isCurrency
    }
  })

  // Initialize kpiConfigs and defaultCardVisibility dynamically based on the provided metrics
  useEffect(() => {
    const newConfigs: Record<string, KPIConfig> = {}
    const newVisibility: Record<string, boolean> = {}
    
    Object.keys(kpiMetrics).forEach(key => {
      if (!kpiConfigs[key]) {
        newConfigs[key] = {
          refreshRate: 30,
          alertThreshold: 0,
          isVisible: true,
          showTrend: true,
          showPercentage: true
        }
      }
      
      // Set default visibility to true for all KPI cards
      if (defaultCardVisibility[key] === undefined) {
        newVisibility[key] = true
      }
    })
    
    if (Object.keys(newConfigs).length > 0) {
      setKpiConfigs(prev => ({ ...prev, ...newConfigs }))
    }
    
    if (Object.keys(newVisibility).length > 0) {
      setDefaultCardVisibility(prev => ({ ...prev, ...newVisibility }))
    }
  }, [kpiMetrics])

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

  const formatPercentage = (value: number): string => {
    return `${value > 0 ? '+' : ''}${value.toFixed(2)}%`
  }

  const handleConfigChange = (kpiKey: string, field: keyof KPIConfig, value: any) => {
    const currentConfig = kpiConfigs[kpiKey] || {
      refreshRate: 30,
      alertThreshold: 0,
      isVisible: true,
      showTrend: true,
      showPercentage: true
    }
    
    const newConfig = { ...currentConfig, [field]: value }
    setLocalConfig(newConfig)
    handleConfigure(kpiKey, newConfig)
  }

  const handleRefreshKPI = (kpiKey: string) => {
    handleRefresh(kpiKey)
    setShowSettings(null)
    setDropdownPosition(null)
  }

  const handleExportKPI = (kpiKey: string) => {
    console.log(`Exporting ${kpiKey} data...`)
    setShowSettings(null)
    setDropdownPosition(null)
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
    const selectedData = data.filter((item: any) => card.selectedProducts.includes(item.id))
    const values = selectedData.map((item: any) => {
      const fieldValue = item[card.field as keyof any]
      return typeof fieldValue === 'number' ? fieldValue : 0
    }).filter(v => v > 0)

    // Simple calculation - you can enhance this based on operation
    switch (card.operation) {
      case 'sum':
        return values.reduce((sum, val) => sum + val, 0)
      case 'average':
        return values.length > 0 ? values.reduce((sum, val) => sum + val, 0) / values.length : 0
      case 'count':
        return values.length
      case 'min':
        return values.length > 0 ? Math.min(...values) : 0
      case 'max':
        return values.length > 0 ? Math.max(...values) : 0
      default:
        return values.reduce((sum, val) => sum + val, 0)
    }
  }

  const formatCardValue = (value: number, field: string): string => {
    const isCurrency = field === 'price' || field === 'cost' || field === 'total' || field === 'value'
    
    if (isCurrency) {
      if (value >= 1000000) {
        return `₹${(value / 1000000).toFixed(1)}M`
      } else if (value >= 1000) {
        return `₹${(value / 1000).toFixed(1)}K`
      }
      return `₹${Math.round(value).toLocaleString()}`
    }
    
    if (value >= 1000000) {
      return `${(value / 1000000).toFixed(1)}M`
    } else if (value >= 1000) {
      return `${(value / 1000).toFixed(1)}K`
    }
    return Math.round(value).toLocaleString()
  }

  // Render KPI Settings Dropdown as Portal
  const renderKPISettingsDropdown = () => {
    if (!showSettings || !dropdownPosition) return null

    const dropdownContent = (
      <div
        ref={settingsRef}
        className="fixed w-64 bg-white border border-gray-200 rounded-lg shadow-2xl p-3"
        style={{
          left: dropdownPosition.x,
          top: dropdownPosition.y,
          zIndex: 999999
        }}
      >
        <div className="text-sm font-medium text-gray-900 mb-3">KPI Settings</div>
        
        {/* Refresh Rate */}
        <div className="mb-3">
          <label className="block text-xs font-medium text-gray-700 mb-1">Refresh Rate</label>
          <select
            value={localConfig?.refreshRate || 30}
            onChange={(e) => handleConfigChange(showSettings, 'refreshRate', parseInt(e.target.value))}
            className="w-full text-xs border border-gray-300 rounded px-2 py-1 focus:outline-none focus:ring-1 focus:ring-blue-500"
          >
            <option value={15}>15s</option>
            <option value={30}>30s</option>
            <option value={60}>1m</option>
            <option value={300}>5m</option>
            <option value={600}>10m</option>
          </select>
        </div>

        {/* Alert Threshold */}
        <div className="mb-3">
          <label className="block text-xs font-medium text-gray-700 mb-1">Alert Threshold</label>
          <input
            type="number"
            value={localConfig?.alertThreshold || 0}
            onChange={(e) => handleConfigChange(showSettings, 'alertThreshold', parseInt(e.target.value) || 0)}
            className="w-full text-xs border border-gray-300 rounded px-2 py-1 focus:outline-none focus:ring-1 focus:ring-blue-500"
            placeholder="0"
          />
        </div>

        {/* Display Options */}
        <div className="mb-3">
          <label className="block text-xs font-medium text-gray-700 mb-1">Display Options</label>
          <div className="space-y-1">
            <label className="flex items-center text-xs">
              <input
                type="checkbox"
                checked={localConfig?.isVisible !== false}
                onChange={(e) => handleConfigChange(showSettings, 'isVisible', e.target.checked)}
                className="mr-2 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
              />
              Show Card
            </label>
            <label className="flex items-center text-xs">
              <input
                type="checkbox"
                checked={localConfig?.showTrend !== false}
                onChange={(e) => handleConfigChange(showSettings, 'showTrend', e.target.checked)}
                className="mr-2 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
              />
              Show Trend
            </label>
            <label className="flex items-center text-xs">
              <input
                type="checkbox"
                checked={localConfig?.showPercentage !== false}
                onChange={(e) => handleConfigChange(showSettings, 'showPercentage', e.target.checked)}
                className="mr-2 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
              />
              Show Percentage
            </label>
          </div>
        </div>

        {/* Custom Label */}
        <div className="mb-3">
          <label className="block text-xs font-medium text-gray-700 mb-1">Custom Label</label>
          <input
            type="text"
            value={localConfig?.customLabel || ''}
            onChange={(e) => handleConfigChange(showSettings, 'customLabel', e.target.value)}
            className="w-full text-xs border border-gray-300 rounded px-2 py-1 focus:outline-none focus:ring-1 focus:ring-blue-500"
            placeholder={kpiData.find(k => k.key === showSettings)?.label || ''}
          />
        </div>

        {/* Custom Icon */}
        <div className="mb-3">
          <label className="block text-xs font-medium text-gray-700 mb-1">Custom Icon</label>
          <input
            type="text"
            value={localConfig?.customIcon || ''}
            onChange={(e) => handleConfigChange(showSettings, 'customIcon', e.target.value)}
            className="w-full text-xs border border-gray-300 rounded px-2 py-1 focus:outline-none focus:ring-1 focus:ring-blue-500"
            placeholder={kpiData.find(k => k.key === showSettings)?.icon || ''}
          />
        </div>

        {/* Action Buttons */}
        <div className="flex space-x-2 pt-2 border-t border-gray-200">
          <button
            onClick={() => handleRefreshKPI(showSettings)}
            className="flex items-center space-x-1 px-2 py-1 text-xs bg-blue-100 text-blue-700 rounded hover:bg-blue-200 transition-colors"
          >
            <RefreshCw className="h-3 w-3" />
            <span>Refresh Now</span>
          </button>
          <button
            onClick={() => handleExportKPI(showSettings)}
            className="flex items-center space-x-1 px-2 py-1 text-xs bg-green-100 text-green-700 rounded hover:bg-green-200 transition-colors"
          >
            <Download className="h-3 w-3" />
            <span>Export Data</span>
          </button>
        </div>
      </div>
    )

    return createPortal(dropdownContent, document.body)
  }

  return (
    <div className="bg-white shadow-sm">
      {/* Header with Add Card and Manage Cards buttons */}
      <div className="flex items-center justify-between mb-2 px-6 py-2">
        <div className="flex items-center space-x-2">
          <h3 className="text-sm font-medium text-gray-700">Analytics Overview</h3>
          <span className="text-xs text-gray-500">
            ({kpiData.filter(({ key }) => (defaultCardVisibility[key] !== false) && (kpiConfigs[key]?.isVisible !== false)).length + customCards.filter(c => c.isVisible).length} cards)
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
          .filter(({ key }) => (defaultCardVisibility[key] !== false) && (kpiConfigs[key]?.isVisible !== false))
          .map(({ key, label, metric, gradient, icon, bgGradient, isCurrency }) => (
            <div
              key={key}
              className={cn(
                "bg-white border border-gray-200 rounded-lg p-1.5 hover:shadow-md transition-all duration-200 group",
                "relative overflow-visible"
              )}
            >
              {/* Background Gradient */}
              <div className={cn(
                "absolute inset-0 opacity-5 group-hover:opacity-10 transition-opacity duration-200 rounded-lg",
                bgGradient
              )} />
              
              <div className="relative z-10">
                <div className="flex items-center justify-between mb-0.5">
                  <div className="flex items-center space-x-2 flex-1 min-w-0">
                    <span className="text-base flex-shrink-0">{kpiConfigs[key]?.customIcon || icon}</span>
                    <span className="text-xs font-medium text-gray-600 truncate">{kpiConfigs[key]?.customLabel || label}</span>
                  </div>
                  <div className="flex items-center space-x-1 flex-shrink-0">
                    {kpiConfigs[key]?.showTrend && metric && (
                      <>
                        {metric.trend === 'up' ? (
                          <span className="text-green-600">↗</span>
                        ) : metric.trend === 'down' ? (
                          <span className="text-red-600">↘</span>
                        ) : (
                          <span className="text-gray-400">→</span>
                        )}
                        {kpiConfigs[key]?.showPercentage && (
                          <span className={cn(
                            "text-xs font-medium",
                            metric.trend === 'up' ? "text-green-600" :
                            metric.trend === 'down' ? "text-red-600" :
                            "text-gray-500"
                          )}>
                            {metric.change > 0 ? '+' : ''}{metric.change.toFixed(2)}%
                          </span>
                        )}
                      </>
                    )}
                    
                    {/* Settings Button */}
                    <div className="relative">
                      <button
                        ref={(el) => { buttonRefs.current[key] = el }}
                        onClick={() => {
                          if (showSettings === key) {
                            setShowSettings(null)
                            setLocalConfig(null)
                            setDropdownPosition(null)
                          } else {
                            const buttonElement = buttonRefs.current[key]
                            if (buttonElement) {
                              const position = calculateDropdownPosition(buttonElement)
                              setDropdownPosition(position)
                              setShowSettings(key)
                              setLocalConfig(kpiConfigs[key] || {
                                refreshRate: 30,
                                alertThreshold: 0,
                                isVisible: true,
                                showTrend: true,
                                showPercentage: true
                              })
                            }
                          }
                        }}
                        className="p-1 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded transition-colors opacity-0 group-hover:opacity-100 z-10"
                        title="Configure KPI"
                      >
                        <Settings className="h-3 w-3" />
                      </button>
                    </div>
                  </div>
                </div>
                
                <div className={cn(
                  "text-lg font-bold",
                  gradient
                )}>
                  {isCurrency ? 
                    (metric.value >= 1000000 ? 
                      `₹${(metric.value / 1000000).toFixed(1)}M` : 
                      metric.value >= 1000 ? 
                        `₹${(metric.value / 1000).toFixed(1)}K` : 
                        `₹${Math.round(metric.value).toLocaleString()}`
                    ) : 
                    (metric.value >= 1000000 ? 
                      `${(metric.value / 1000000).toFixed(1)}M` : 
                      metric.value >= 1000 ? 
                        `${(metric.value / 1000).toFixed(1)}K` : 
                        Math.round(metric.value).toLocaleString()
                    )
                  }
                </div>
                
                {/* Alert Indicator */}
                {kpiConfigs[key]?.alertThreshold > 0 && metric.value <= kpiConfigs[key]?.alertThreshold && (
                  <div className="absolute top-2 right-2">
                    <div className="w-2 h-2 bg-red-500 rounded-full animate-pulse"></div>
                  </div>
                )}
              </div>
            </div>
          ))}
        
        {/* Custom KPI Cards */}
        {customCards
          .filter(card => card.isVisible)
          .map(card => {
            const computedValue = calculateCustomCardValue(card)
            const isCurrency = card.field === 'price' || card.field === 'cost' || card.field === 'total' || card.field === 'value'
            
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
                    {card.operation} of {card.field} ({card.selectedProducts.length} items)
                  </div>
                </div>
              </div>
            )
          })}
      </div>

      {/* Render KPI Settings Dropdown as Portal */}
      {renderKPISettingsDropdown()}

      {/* Modals */}
      <CustomCardModal
        isOpen={showCustomCardModal}
        onClose={() => {
          setShowCustomCardModal(false)
          setEditingCard(null)
          setEditingDefaultCard(null)
        }}
        onSave={handleSaveCustomCard}
        products={data as any} // Cast to any to work with existing modal
        existingCards={customCards as any}
        editingCard={editingCard as any}
        editingDefaultCard={editingDefaultCard}
      />

      <CardManagerModal
        isOpen={showCardManagerModal}
        onClose={() => {
          setShowCardManagerModal(false)
          setShowCustomTabInManager(false)
        }}
        customCards={customCards as any}
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
