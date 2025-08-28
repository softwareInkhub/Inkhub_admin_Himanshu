'use client'

import { useState, useEffect } from 'react'
import { Plus, Settings } from 'lucide-react'
import { cn } from '@/lib/utils'
import { KPIMetrics } from '../types'
import { KPICard } from './KPICard'

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
  metrics: KPIMetrics
  onRefresh?: (kpiKey: string) => void
  onConfigure?: (kpiKey: string, config: KPIConfig) => void
}

export const KPIGrid = ({ metrics, onRefresh, onConfigure }: KPIGridProps) => {
  const [kpiConfigs, setKpiConfigs] = useState<Record<string, KPIConfig>>({
    totalDesigns: {
      refreshRate: 30,
      alertThreshold: 0,
      isVisible: true,
      showTrend: true,
      showPercentage: true
    },
    completedDesigns: {
      refreshRate: 30,
      alertThreshold: 0,
      isVisible: true,
      showTrend: true,
      showPercentage: true
    },
    inProgressDesigns: {
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
    totalViews: {
      refreshRate: 30,
      alertThreshold: 0,
      isVisible: true,
      showTrend: true,
      showPercentage: true
    },
    totalDownloads: {
      refreshRate: 30,
      alertThreshold: 0,
      isVisible: true,
      showTrend: true,
      showPercentage: true
    }
  })

  const kpiData = [
    {
      key: 'totalDesigns',
      label: 'Total Designs',
      metric: metrics.totalDesigns,
      gradient: 'from-blue-500 to-blue-600',
      icon: 'Palette'
    },
    {
      key: 'completedDesigns',
      label: 'Completed',
      metric: metrics.completedDesigns,
      gradient: 'from-green-500 to-green-600',
      icon: 'CheckCircle'
    },
    {
      key: 'inProgressDesigns',
      label: 'In Progress',
      metric: metrics.inProgressDesigns,
      gradient: 'from-yellow-500 to-yellow-600',
      icon: 'Clock'
    },
    {
      key: 'totalValue',
      label: 'Total Value',
      metric: metrics.totalValue,
      gradient: 'from-purple-500 to-purple-600',
      icon: 'DollarSign'
    },
    {
      key: 'totalViews',
      label: 'Total Views',
      metric: metrics.totalViews,
      gradient: 'from-indigo-500 to-indigo-600',
      icon: 'Eye'
    },
    {
      key: 'totalDownloads',
      label: 'Total Downloads',
      metric: metrics.totalDownloads,
      gradient: 'from-pink-500 to-pink-600',
      icon: 'Download'
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
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-6 p-6">
      {kpiData
        .filter(({ key }) => kpiConfigs[key]?.isVisible !== false)
        .map((kpi, index) => (
          <KPICard
            key={index}
            label={kpi.label}
            metric={kpi.metric}
            gradient={kpi.gradient}
            icon={kpi.icon}
            config={kpiConfigs[kpi.key]}
            onRefresh={() => handleRefresh(kpi.key)}
            onConfigure={(config) => handleConfigure(kpi.key, config)}
          />
        ))}
    </div>
  )
}
