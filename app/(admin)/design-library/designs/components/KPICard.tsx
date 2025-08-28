'use client'

import { useState, useRef, useEffect } from 'react'
import { Settings, RefreshCw, Download } from 'lucide-react'
import { cn } from '@/lib/utils'
import { KPIMetric } from '../types'
import { 
  Palette, 
  CheckCircle, 
  Clock, 
  DollarSign, 
  Eye, 
  Download as DownloadIcon,
  TrendingUp,
  TrendingDown
} from 'lucide-react'

interface KPICardProps {
  label: string
  metric: KPIMetric
  gradient: string
  icon: string
  backgroundGradient?: string
  onRefresh?: () => void
  onConfigure?: (config: KPIConfig) => void
  config?: KPIConfig
}

interface KPIConfig {
  refreshRate: number // in seconds
  alertThreshold: number
  isVisible: boolean
  showTrend: boolean
  showPercentage: boolean
  customLabel?: string
  customIcon?: string
}

const iconMap = {
  Palette,
  CheckCircle,
  Clock,
  DollarSign,
  Eye,
  Download: DownloadIcon
}

export const KPICard = ({ 
  label, 
  metric, 
  gradient, 
  icon, 
  backgroundGradient,
  onRefresh,
  onConfigure,
  config
}: KPICardProps) => {
  const [showSettings, setShowSettings] = useState(false)
  const [localConfig, setLocalConfig] = useState<KPIConfig>({
    refreshRate: 30,
    alertThreshold: 0,
    isVisible: true,
    showTrend: true,
    showPercentage: true,
    customLabel: label,
    customIcon: icon,
    ...config
  })
  
  const settingsRef = useRef<HTMLDivElement>(null)
  const IconComponent = iconMap[icon as keyof typeof iconMap] || Palette

  // Close settings dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (settingsRef.current && !settingsRef.current.contains(event.target as Node)) {
        setShowSettings(false)
      }
    }

    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])
  
  const formatValue = (value: number): string => {
    if (value >= 1000000) {
      return `$${(value / 1000000).toFixed(1)}M`
    } else if (value >= 1000) {
      return `$${(value / 1000).toFixed(1)}K`
    }
    return value.toString()
  }

  const formatPercentage = (value: number) => {
    // Format percentage to 2 decimal places
    if (value === undefined || value === null) return '0.00'
    return value.toFixed(2)
  }

  const handleConfigChange = (key: keyof KPIConfig, value: any) => {
    const newConfig = { ...localConfig, [key]: value }
    setLocalConfig(newConfig)
    onConfigure?.(newConfig)
  }

  const handleRefresh = () => {
    onRefresh?.()
    setShowSettings(false)
  }

  const refreshRates = [
    { value: 15, label: '15s' },
    { value: 30, label: '30s' },
    { value: 60, label: '1m' },
    { value: 300, label: '5m' },
    { value: 600, label: '10m' }
  ]

  return (
    <div className={cn(
      "bg-white rounded-lg border border-gray-200 p-6 hover:shadow-md transition-all duration-200 group relative overflow-visible",
      backgroundGradient || ''
    )}>
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm font-medium text-gray-600">{localConfig.customLabel || label}</p>
          <p className="text-2xl font-bold text-gray-900">{formatValue(metric.value)}</p>
          {localConfig.showTrend && (
            <div className="flex items-center mt-2">
              {metric.changeType === 'increase' ? (
                <TrendingUp className="h-4 w-4 text-green-500 mr-1" />
              ) : (
                <TrendingDown className="h-4 w-4 text-red-500 mr-1" />
              )}
              {localConfig.showPercentage && (
                <span className={cn(
                  "text-sm font-medium",
                  metric.changeType === 'increase' ? 'text-green-600' : 'text-red-600'
                )}>
                  {metric.change}%
                </span>
              )}
              <span className="text-sm text-gray-500 ml-1">from last month</span>
            </div>
          )}
        </div>
        <div className="relative">
          <div className={cn("p-3 rounded-lg bg-gradient-to-r", gradient)}>
            <IconComponent className="h-6 w-6 text-white" />
          </div>
          
          {/* Settings Button */}
          <div className="absolute -top-2 -right-2" ref={settingsRef}>
            <button
              onClick={() => setShowSettings(!showSettings)}
              className="p-1 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded transition-colors opacity-0 group-hover:opacity-100 z-10 bg-white shadow-sm"
              title="Configure KPI"
            >
              <Settings className="h-3 w-3" />
            </button>
            
            {/* Settings Dropdown */}
            {showSettings && (
              <div className="absolute top-full right-0 mt-2 w-48 bg-white border border-gray-200 rounded-md shadow-lg z-[9999]">
                <div className="p-2">
                  <div className="text-xs font-medium text-gray-700 mb-2">KPI Settings</div>
                  
                  {/* Refresh Rate */}
                  <div className="mb-2">
                    <label className="text-xs text-gray-600 mb-1 block">Refresh Rate</label>
                    <select
                      value={localConfig.refreshRate}
                      onChange={(e) => handleConfigChange('refreshRate', parseInt(e.target.value))}
                      className="w-full text-xs border border-gray-300 rounded px-2 py-1 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    >
                      {refreshRates.map(rate => (
                        <option key={rate.value} value={rate.value}>{rate.label}</option>
                      ))}
                    </select>
                  </div>
                  
                  {/* Alert Threshold */}
                  <div className="mb-2">
                    <label className="text-xs text-gray-600 mb-1 block">Alert Threshold</label>
                    <input
                      type="number"
                      value={localConfig.alertThreshold}
                      onChange={(e) => handleConfigChange('alertThreshold', parseFloat(e.target.value))}
                      className="w-full text-xs border border-gray-300 rounded px-2 py-1 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      placeholder="0"
                    />
                  </div>
                  
                  {/* Display Options */}
                  <div className="mb-2">
                    <label className="text-xs text-gray-600 mb-1 block">Display Options</label>
                    <div className="space-y-1">
                      <label className="flex items-center space-x-2 text-xs">
                        <input
                          type="checkbox"
                          checked={localConfig.isVisible}
                          onChange={(e) => handleConfigChange('isVisible', e.target.checked)}
                          className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                        />
                        <span>Show Card</span>
                      </label>
                      <label className="flex items-center space-x-2 text-xs">
                        <input
                          type="checkbox"
                          checked={localConfig.showTrend}
                          onChange={(e) => handleConfigChange('showTrend', e.target.checked)}
                          className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                        />
                        <span>Show Trend</span>
                      </label>
                      <label className="flex items-center space-x-2 text-xs">
                        <input
                          type="checkbox"
                          checked={localConfig.showPercentage}
                          onChange={(e) => handleConfigChange('showPercentage', e.target.checked)}
                          className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                        />
                        <span>Show Percentage</span>
                      </label>
                    </div>
                  </div>
                  
                  {/* Custom Label */}
                  <div className="mb-2">
                    <label className="text-xs text-gray-600 mb-1 block">Custom Label</label>
                    <input
                      type="text"
                      value={localConfig.customLabel || ''}
                      onChange={(e) => handleConfigChange('customLabel', e.target.value)}
                      className="w-full text-xs border border-gray-300 rounded px-2 py-1 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      placeholder={label}
                    />
                  </div>
                  
                  {/* Custom Icon */}
                  <div className="mb-2">
                    <label className="text-xs text-gray-600 mb-1 block">Custom Icon</label>
                    <input
                      type="text"
                      value={localConfig.customIcon || ''}
                      onChange={(e) => handleConfigChange('customIcon', e.target.value)}
                      className="w-full text-xs border border-gray-300 rounded px-2 py-1 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      placeholder={icon}
                    />
                  </div>
                  
                  {/* Action Buttons */}
                  <div className="pt-2 border-t border-gray-200 space-y-1">
                    <button
                      onClick={handleRefresh}
                      className="w-full text-left px-2 py-1 text-xs text-gray-700 hover:bg-gray-100 rounded transition-colors flex items-center space-x-2"
                    >
                      <RefreshCw className="h-3 w-3" />
                      <span>Refresh Now</span>
                    </button>
                    <button
                      onClick={() => {
                        // Export KPI data
                        const data = {
                          label: localConfig.customLabel || label,
                          value: metric.value,
                          change: metric.change,
                          changeType: metric.changeType,
                          timestamp: new Date().toISOString()
                        }
                        const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' })
                        const url = URL.createObjectURL(blob)
                        const a = document.createElement('a')
                        a.href = url
                        a.download = `${label.toLowerCase().replace(/\s+/g, '-')}-kpi.json`
                        a.click()
                        URL.revokeObjectURL(url)
                      }}
                      className="w-full text-left px-2 py-1 text-xs text-gray-700 hover:bg-gray-100 rounded transition-colors flex items-center space-x-2"
                    >
                      <Download className="h-3 w-3" />
                      <span>Export Data</span>
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
      
      {/* Alert Indicator */}
      {localConfig.alertThreshold > 0 && metric.value <= localConfig.alertThreshold && (
        <div className="absolute top-2 right-2">
          <div className="w-2 h-2 bg-red-500 rounded-full animate-pulse"></div>
        </div>
      )}
    </div>
  )
}
