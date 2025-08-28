'use client'

import { useState, useEffect } from 'react'
import { Plus, Settings } from 'lucide-react'
import { cn } from '@/lib/utils'
import KPICard from './KPICard'

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
  kpiMetrics: {
    totalBoards: KPIMetric
    publicBoards: KPIMetric
    privateBoards: KPIMetric
    totalPins: KPIMetric
    totalFollowers: KPIMetric
    averagePinsPerBoard: KPIMetric
  }
  onRefresh?: (kpiKey: string) => void
  onConfigure?: (kpiKey: string, config: KPIConfig) => void
}

export default function KPIGrid({ kpiMetrics, onRefresh, onConfigure }: KPIGridProps) {
  const [kpiConfigs, setKpiConfigs] = useState<Record<string, KPIConfig>>({
    totalBoards: {
      refreshRate: 30,
      alertThreshold: 0,
      isVisible: true,
      showTrend: true,
      showPercentage: true
    },
    publicBoards: {
      refreshRate: 30,
      alertThreshold: 0,
      isVisible: true,
      showTrend: true,
      showPercentage: true
    },
    privateBoards: {
      refreshRate: 30,
      alertThreshold: 0,
      isVisible: true,
      showTrend: true,
      showPercentage: true
    },
    totalPins: {
      refreshRate: 30,
      alertThreshold: 0,
      isVisible: true,
      showTrend: true,
      showPercentage: true
    },
    totalFollowers: {
      refreshRate: 30,
      alertThreshold: 0,
      isVisible: true,
      showTrend: true,
      showPercentage: true
    },
    averagePinsPerBoard: {
      refreshRate: 30,
      alertThreshold: 0,
      isVisible: true,
      showTrend: true,
      showPercentage: true
    }
  })

  const kpiData = [
    { 
      key: 'totalBoards', 
      label: 'Total Boards', 
      metric: kpiMetrics.totalBoards,
      gradient: 'from-red-500 to-red-600',
      icon: '📌',
      bgGradient: 'from-red-50 to-red-100'
    },
    { 
      key: 'publicBoards', 
      label: 'Public Boards', 
      metric: kpiMetrics.publicBoards,
      gradient: 'from-blue-500 to-blue-600',
      icon: '🌐',
      bgGradient: 'from-blue-50 to-blue-100'
    },
    { 
      key: 'privateBoards', 
      label: 'Private Boards', 
      metric: kpiMetrics.privateBoards,
      gradient: 'from-orange-500 to-orange-600',
      icon: '🔒',
      bgGradient: 'from-orange-50 to-orange-100'
    },
    { 
      key: 'totalPins', 
      label: 'Total Pins', 
      metric: kpiMetrics.totalPins,
      gradient: 'from-purple-500 to-purple-600',
      icon: '📎',
      bgGradient: 'from-purple-50 to-purple-100'
    },
    { 
      key: 'totalFollowers', 
      label: 'Total Followers', 
      metric: kpiMetrics.totalFollowers,
      gradient: 'from-green-500 to-green-600',
      icon: '👥',
      bgGradient: 'from-green-50 to-green-100'
    },
    { 
      key: 'averagePinsPerBoard', 
      label: 'Avg Pins/Board', 
      metric: kpiMetrics.averagePinsPerBoard,
      gradient: 'from-indigo-500 to-indigo-600',
      icon: '📊',
      bgGradient: 'from-indigo-50 to-indigo-100'
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

  return (
    <div className="px-4 py-3">
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-2">
        {kpiData
          .filter(({ key }) => kpiConfigs[key]?.isVisible !== false)
          .map(({ key, label, metric, gradient, icon, bgGradient }) => (
            <KPICard
              key={key}
              label={label}
              metric={metric}
              gradient={gradient}
              icon={icon}
              bgGradient={bgGradient}
              config={kpiConfigs[key]}
              onRefresh={() => handleRefresh(key)}
              onConfigure={(config) => handleConfigure(key, config)}
            />
          ))}
      </div>
    </div>
  )
}
