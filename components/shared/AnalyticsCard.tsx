'use client'

import React from 'react'
import { LucideIcon } from 'lucide-react'
import { cn } from '@/lib/utils'

interface AnalyticsCardProps {
  title: string
  value: string | number
  change?: number
  trend?: 'up' | 'down' | 'neutral'
  icon?: LucideIcon
  color?: string
  className?: string
}

export default function AnalyticsCard({
  title,
  value,
  change,
  trend = 'neutral',
  icon: Icon,
  color = 'blue',
  className
}: AnalyticsCardProps) {
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

  const getColorClasses = () => {
    switch (color) {
      case 'blue':
        return 'bg-blue-100 text-blue-600'
      case 'green':
        return 'bg-green-100 text-green-600'
      case 'red':
        return 'bg-red-100 text-red-600'
      case 'yellow':
        return 'bg-yellow-100 text-yellow-600'
      case 'purple':
        return 'bg-purple-100 text-purple-600'
      case 'pink':
        return 'bg-pink-100 text-pink-600'
      default:
        return 'bg-gray-100 text-gray-600'
    }
  }

  return (
    <div className={cn(
      'bg-white rounded-lg border border-gray-200 p-6 hover:shadow-md transition-shadow',
      className
    )}>
      <div className="flex items-center justify-between">
        <div className="flex-1">
          <p className="text-sm font-medium text-gray-600 mb-1">{title}</p>
          <p className="text-2xl font-bold text-gray-900">{value}</p>
          {change !== undefined && (
            <div className="flex items-center space-x-1 mt-2">
              <span className={cn('text-sm font-medium', getTrendColor())}>
                {getTrendIcon()} {Math.abs(change)}%
              </span>
              <span className="text-sm text-gray-500">from last month</span>
            </div>
          )}
        </div>
        {Icon && (
          <div className={cn('p-3 rounded-lg', getColorClasses())}>
            <Icon className="h-6 w-6" />
          </div>
        )}
      </div>
    </div>
  )
}