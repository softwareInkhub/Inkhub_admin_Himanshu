'use client'

import { useEffect, useRef } from 'react'
import { 
  TrendingUp, 
  Package, 
  ShoppingCart, 
  Image, 
  Users, 
  Activity,
  BarChart3,
  Calendar,
  DollarSign
} from 'lucide-react'
import { useAppStore } from '@/lib/store'
import { cn } from '@/lib/utils'

interface StatCard {
  title: string
  value: string
  change: string
  changeType: 'positive' | 'negative' | 'neutral'
  icon: React.ComponentType<{ className?: string }>
  color: string
}

const statCards: StatCard[] = [
  {
    title: 'Total Orders',
    value: '12,847',
    change: '+12.5%',
    changeType: 'positive',
    icon: ShoppingCart,
    color: 'text-blue-600',
  },
  {
    title: 'Products',
    value: '2,341',
    change: '+8.2%',
    changeType: 'positive',
    icon: Package,
    color: 'text-green-600',
  },
  {
    title: 'Pinterest Pins',
    value: '45,892',
    change: '+23.1%',
    changeType: 'positive',
    icon: Image,
    color: 'text-red-600',
  },
  {
    title: 'Active Users',
    value: '1,234',
    change: '+5.7%',
    changeType: 'positive',
    icon: Users,
    color: 'text-purple-600',
  },
]

export default function DashboardPage() {
  const { addTab, tabs } = useAppStore()
  const hasAddedTab = useRef(false)

  useEffect(() => {
    // Only add the tab once
    if (!hasAddedTab.current) {
      addTab({
        title: 'Dashboard',
        path: '/dashboard',
        pinned: true,
        closable: false,
      })
      hasAddedTab.current = true
    }
  }, []) // Remove addTab from dependencies

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div className="animate-slide-up">
        <h1 className="text-2xl font-semibold text-secondary-900 dark:text-secondary-100 gradient-text">
          Dashboard
        </h1>
        <p className="text-secondary-600 dark:text-secondary-400">
          Welcome to INKHUB Admin. Here's an overview of your system.
        </p>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
        {statCards.map((card, index) => {
          const Icon = card.icon
          return (
            <div key={card.title} className="card hover-lift animate-fade-in" style={{ animationDelay: `${index * 0.1}s` }}>
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-secondary-600 dark:text-secondary-400">
                    {card.title}
                  </p>
                  <p className="text-2xl font-bold text-secondary-900 dark:text-secondary-100">
                    {card.value}
                  </p>
                </div>
                <div className={cn('rounded-lg p-3 hover-lift', card.color.replace('text-', 'bg-').replace('-600', '-100'))}>
                  <Icon className={cn('h-6 w-6', card.color)} />
                </div>
              </div>
              <div className="mt-4 flex items-center">
                <TrendingUp className={cn(
                  'h-4 w-4',
                  card.changeType === 'positive' ? 'text-green-600' : 'text-red-600'
                )} />
                <span className={cn(
                  'ml-1 text-sm font-medium',
                  card.changeType === 'positive' ? 'text-green-600' : 'text-red-600'
                )}>
                  {card.change}
                </span>
                <span className="ml-2 text-sm text-secondary-500 dark:text-secondary-400">
                  from last month
                </span>
              </div>
            </div>
          )
        })}
      </div>

      {/* Charts and Activity */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        {/* Recent Activity */}
        <div className="card hover-lift animate-slide-in-left">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-semibold text-secondary-900 dark:text-secondary-100">
              Recent Activity
            </h3>
            <Activity className="h-5 w-5 text-secondary-400" />
          </div>
          <div className="mt-4 space-y-4">
            {[
              { action: 'New order received', time: '2 minutes ago', type: 'order' },
              { action: 'Product updated', time: '15 minutes ago', type: 'product' },
              { action: 'Pinterest pin created', time: '1 hour ago', type: 'pinterest' },
              { action: 'User registered', time: '2 hours ago', type: 'user' },
              { action: 'System backup completed', time: '3 hours ago', type: 'system' },
            ].map((activity, index) => (
              <div key={index} className="flex items-center space-x-3 hover-lift">
                <div className="h-2 w-2 rounded-full bg-primary-500 animate-pulse-slow" />
                <div className="flex-1">
                  <p className="text-sm font-medium text-secondary-900 dark:text-secondary-100">
                    {activity.action}
                  </p>
                  <p className="text-xs text-secondary-500 dark:text-secondary-400">
                    {activity.time}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Quick Stats */}
        <div className="card hover-lift animate-slide-in-left" style={{ animationDelay: '0.2s' }}>
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-semibold text-secondary-900 dark:text-secondary-100">
              Quick Stats
            </h3>
            <BarChart3 className="h-5 w-5 text-secondary-400" />
          </div>
          <div className="mt-4 space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-sm text-secondary-600 dark:text-secondary-400">System Load</span>
              <div className="flex items-center space-x-2">
                <div className="h-2 w-24 rounded-full bg-secondary-200 dark:bg-secondary-700">
                  <div className="h-2 w-16 rounded-full bg-green-500 progress-animate"></div>
                </div>
                <span className="text-sm font-medium text-secondary-900 dark:text-secondary-100">67%</span>
              </div>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-secondary-600 dark:text-secondary-400">Memory Usage</span>
              <div className="flex items-center space-x-2">
                <div className="h-2 w-24 rounded-full bg-secondary-200 dark:bg-secondary-700">
                  <div className="h-2 w-20 rounded-full bg-blue-500 progress-animate"></div>
                </div>
                <span className="text-sm font-medium text-secondary-900 dark:text-secondary-100">83%</span>
              </div>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-secondary-600 dark:text-secondary-400">Storage</span>
              <div className="flex items-center space-x-2">
                <div className="h-2 w-24 rounded-full bg-secondary-200 dark:bg-secondary-700">
                  <div className="h-2 w-12 rounded-full bg-yellow-500 progress-animate"></div>
                </div>
                <span className="text-sm font-medium text-secondary-900 dark:text-secondary-100">45%</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* System Health */}
      <div className="card">
        <h3 className="text-lg font-semibold text-secondary-900 dark:text-secondary-100">
          System Health
        </h3>
        <div className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-3">
          {[
            { name: 'Shopify API', status: 'healthy', color: 'bg-green-500' },
            { name: 'Pinterest API', status: 'healthy', color: 'bg-green-500' },
            { name: 'Database', status: 'healthy', color: 'bg-green-500' },
          ].map((service) => (
            <div key={service.name} className="flex items-center space-x-3">
              <div className={cn('h-3 w-3 rounded-full', service.color)} />
              <div>
                <p className="text-sm font-medium text-secondary-900 dark:text-secondary-100">
                  {service.name}
                </p>
                <p className="text-xs text-secondary-500 dark:text-secondary-400">
                  {service.status}
                </p>
              </div>
            </div>
          ))}
        </div>
      </div>

    </div>
  )
} 