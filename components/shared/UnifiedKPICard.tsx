'use client'

import React from 'react'
import { cn } from '@/lib/utils'
import { KPICardConfig } from './types/unified-table'

interface UnifiedKPICardProps {
  title: string
  value: number
  change: number
  trend: 'up' | 'down' | 'neutral'
  icon: string
  gradient: string
  bgGradient: string
  isCurrency: boolean
  loading?: boolean
  onRefresh?: () => void
  onConfigure?: () => void
  config?: {
    refreshRate: number
    alertThreshold: number
    isVisible: boolean
    showTrend: boolean
    showPercentage: boolean
    customLabel?: string
    customIcon?: string
  }
  isCustom?: boolean
}

export default function UnifiedKPICard({
  title,
  value,
  change,
  trend,
  icon,
  gradient,
  bgGradient,
  isCurrency,
  loading = false,
  onRefresh,
  onConfigure,
  config,
  isCustom = false
}: UnifiedKPICardProps) {
  const getTrendIcon = () => {
    switch (trend) {
      case 'up':
        return '↗'
      case 'down':
        return '↘'
      default:
        return '→'
    }
  }

  const getTrendColor = () => {
    switch (trend) {
      case 'up':
        return 'text-green-600'
      case 'down':
        return 'text-red-600'
      default:
        return 'text-gray-600'
    }
  }

  const formatValue = (val: number) => {
    if (isCurrency) {
      return `$${val.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
    }
    
    if (val >= 1000000) {
      return `${(val / 1000000).toFixed(1)}M`
    } else if (val >= 1000) {
      return `${(val / 1000).toFixed(1)}K`
    }
    
    return val.toLocaleString()
  }

  const formatChange = (change: number) => {
    const sign = change >= 0 ? '+' : ''
    return `${sign}${change.toFixed(2)}%`
  }

  return (
    <div className={cn(
      "relative bg-white rounded-lg border border-gray-200 shadow-sm hover:shadow-md transition-shadow duration-200",
      isCustom && "ring-2 ring-blue-200"
    )}>
      {/* Header with actions */}
      <div className="flex items-center justify-between p-4 pb-2">
        <div className="flex items-center space-x-2">
          <span className="text-2xl">{icon}</span>
          <h3 className="text-sm font-medium text-gray-900 truncate">{title}</h3>
        </div>
        
        <div className="flex items-center space-x-1">
          {onRefresh && (
            <button
              onClick={onRefresh}
              disabled={loading}
              className="p-1 text-gray-400 hover:text-gray-600 transition-colors"
              title="Refresh"
            >
              <svg 
                className={cn("h-4 w-4", loading && "animate-spin")} 
                fill="none" 
                stroke="currentColor" 
                viewBox="0 0 24 24"
              >
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
              </svg>
            </button>
          )}
          
          {onConfigure && (
            <button
              onClick={onConfigure}
              className="p-1 text-gray-400 hover:text-gray-600 transition-colors"
              title="Configure"
            >
              <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
              </svg>
            </button>
          )}
        </div>
      </div>

      {/* Content */}
      <div className="px-4 pb-4">
        <div className="flex items-baseline justify-between">
          <div className="flex items-baseline space-x-2">
            <span className="text-2xl font-bold text-gray-900">
              {loading ? (
                <div className="w-16 h-8 bg-gray-200 rounded animate-pulse"></div>
              ) : (
                formatValue(value)
              )}
            </span>
          </div>
          
          {config?.showTrend !== false && (
            <div className={cn("flex items-center space-x-1 text-sm font-medium", getTrendColor())}>
              <span>{getTrendIcon()}</span>
              <span>{formatChange(change)}</span>
            </div>
          )}
        </div>
        
        {/* Custom indicator */}
        {isCustom && (
          <div className="mt-2">
            <span className="inline-flex items-center px-2 py-1 text-xs font-medium text-blue-700 bg-blue-100 rounded-full">
              Custom
            </span>
          </div>
        )}
      </div>

      {/* Gradient background */}
      <div className={cn("absolute inset-0 rounded-lg opacity-5 pointer-events-none", bgGradient)}></div>
    </div>
  )
}
