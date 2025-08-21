'use client'

import { useEffect, useRef } from 'react'
import { useDashboardData } from './useDashboardData'
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
  spark?: number[]
}

function Sparkline({ data = [], stroke = '#2563eb' }: { data?: number[]; stroke?: string }) {
  if (!data.length) return null
  const w = 120
  const h = 36
  const max = Math.max(...data)
  const min = Math.min(...data)
  const r = Math.max(1, max - min)
  const pts = data
    .map((d, i) => `${(i / (data.length - 1)) * w},${h - ((d - min) / r) * h}`)
    .join(' ')
  return (
    <svg viewBox={`0 0 ${w} ${h}`} className="w-28 h-7">
      <polyline fill="none" stroke={stroke} strokeWidth="2" points={pts} />
    </svg>
  )
}

function buildStatCards(totals?: { orders: number; products: number; pins: number }): StatCard[] {
  return [
    {
      title: 'Total Orders',
      value: (totals?.orders ?? 0).toLocaleString(),
      change: '+12.5%',
      changeType: 'positive',
      icon: ShoppingCart,
      color: 'text-blue-600',
      spark: [22, 23, 19, 26, 30, 28, 34, 31, 36, 42, 39, 45],
    },
    {
      title: 'Products',
      value: (totals?.products ?? 0).toLocaleString(),
      change: '+8.2%',
      changeType: 'positive',
      icon: Package,
      color: 'text-green-600',
      spark: [4, 5, 5, 6, 5, 7, 9, 8, 10, 12, 11, 13],
    },
    {
      title: 'Pinterest Pins',
      value: (totals?.pins ?? 0).toLocaleString(),
      change: '+23.1%',
      changeType: 'positive',
      icon: Image,
      color: 'text-red-600',
      spark: [120, 124, 130, 126, 140, 150, 148, 160, 172, 168, 176, 190],
    },
    {
      title: 'Active Users',
      value: '1,234',
      change: '+5.7%',
      changeType: 'positive',
      icon: Users,
      color: 'text-purple-600',
      spark: [80, 82, 79, 85, 90, 88, 92, 96, 94, 98, 102, 105],
    },
  ]
}

export default function DashboardPage() {
  const { addTab, tabs } = useAppStore()
  const hasAddedTab = useRef(false)
  const { data, loading } = useDashboardData()

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
    <div className="space-y-4 animate-fade-in">
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
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {buildStatCards(data?.totals).map((card, index) => {
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
              <div className="mt-3 flex items-center justify-between">
                <div className="flex items-center">
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
                {card.spark && (
                  <Sparkline
                    data={card.spark}
                    stroke={card.color.includes('blue') ? '#2563eb' : card.color.includes('green') ? '#16a34a' : card.color.includes('red') ? '#dc2626' : '#7c3aed'}
                  />
                )}
              </div>
            </div>
          )
        })}
      </div>

      {/* Sales vs Orders + Activity */}
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        {/* Sales vs Orders */}
        <div className="card hover-lift animate-slide-in-left">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-semibold text-secondary-900 dark:text-secondary-100">Sales vs Orders</h3>
            <Calendar className="h-5 w-5 text-secondary-400" />
          </div>
          <div className="mt-2">
            <svg viewBox="0 0 600 220" className="w-full h-40">
              <defs>
                <linearGradient id="fillSales" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#dbeafe"/>
                  <stop offset="100%" stopColor="#ffffff"/>
                </linearGradient>
              </defs>
              <line x1="0" y1="200" x2="600" y2="200" stroke="#e5e7eb" />
              <polyline fill="none" stroke="#16a34a" strokeWidth="2" points="0,180 60,170 120,165 180,150 240,155 300,140 360,135 420,120 480,125 540,110 600,115"/>
              <polyline fill="url(#fillSales)" stroke="#2563eb" strokeWidth="2" points="0,190 60,185 120,170 180,160 240,165 300,150 360,145 420,138 480,140 540,135 600,130 600,200 0,200"/>
            </svg>
            <div className="mt-1 grid grid-cols-2 gap-2 text-sm">
              <div className="flex items-center space-x-2"><span className="h-2 w-2 rounded-full bg-blue-600"></span><span className="text-secondary-700">Sales</span><span className="font-semibold text-secondary-900">₹1.24M</span></div>
              <div className="flex items-center space-x-2"><span className="h-2 w-2 rounded-full bg-green-600"></span><span className="text-secondary-700">Orders</span><span className="font-semibold text-secondary-900">12.8K</span></div>
            </div>
          </div>
        </div>
        {/* Recent Activity */}
        <div className="card hover-lift animate-slide-in-left">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-semibold text-secondary-900 dark:text-secondary-100">
              Recent Activity
            </h3>
            <Activity className="h-5 w-5 text-secondary-400" />
          </div>
          <div className="mt-2 space-y-2">
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
          <div className="mt-2 space-y-3">
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
        {/* Sales by Channel */}
        <div className="card hover-lift animate-slide-in-left" style={{ animationDelay: '0.25s' }}>
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-semibold text-secondary-900 dark:text-secondary-100">Sales by Channel</h3>
            <DollarSign className="h-5 w-5 text-secondary-400" />
          </div>
          <div className="mt-2 space-y-3">
            {[
              { name: 'Online Store', pct: 56, color: 'bg-blue-500' },
              { name: 'Pinterest', pct: 28, color: 'bg-rose-500' },
              { name: 'Wholesale', pct: 12, color: 'bg-emerald-500' },
              { name: 'Other', pct: 4, color: 'bg-amber-500' },
            ].map((ch) => (
              <div key={ch.name}>
                <div className="flex items-center justify-between text-sm">
                  <span className="text-secondary-700 dark:text-secondary-300">{ch.name}</span>
                  <span className="font-medium text-secondary-900 dark:text-secondary-100">{ch.pct}%</span>
                </div>
                <div className="mt-1 h-2 w-full rounded-full bg-secondary-200 dark:bg-secondary-700">
                  <div className={cn('h-2 rounded-full', ch.color)} style={{ width: `${ch.pct}%` }} />
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Top Lists + System Health */}
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        <div className="card">
          <h3 className="text-lg font-semibold text-secondary-900 dark:text-secondary-100">Top Products</h3>
          <div className="mt-2 overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-secondary-500">
                  <th className="text-left py-2">Product</th>
                  <th className="text-right py-2">Units</th>
                  <th className="text-right py-2">Revenue</th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {(data?.topProducts || []).map((p) => (
                  <tr key={p.name} className="hover:bg-secondary-50">
                    <td className="py-2">{p.name}</td>
                    <td className="text-right py-2">{p.units.toLocaleString()}</td>
                    <td className="text-right py-2 font-medium">₹{p.revenue.toLocaleString()}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        <div className="card">
          <h3 className="text-lg font-semibold text-secondary-900 dark:text-secondary-100">
            System Health
          </h3>
          <div className="mt-2 grid grid-cols-1 gap-3 sm:grid-cols-3">
            {[
              { name: 'Shopify API', status: 'healthy', color: 'bg-green-500', latency: '142ms', uptime: '99.98%' },
              { name: 'Pinterest API', status: 'healthy', color: 'bg-green-500', latency: '156ms', uptime: '99.95%' },
              { name: 'Database', status: 'healthy', color: 'bg-green-500', latency: '23ms', uptime: '99.99%' },
            ].map((service) => (
              <div key={service.name} className="flex items-center justify-between p-3 rounded-md border">
                <div className="flex items-center space-x-3">
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
                <div className="text-right">
                  <div className="text-xs text-secondary-500">Latency</div>
                  <div className="text-sm font-medium">{service.latency}</div>
                  <div className="text-xs text-secondary-500">Uptime</div>
                  <div className="text-sm font-medium">{service.uptime}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="card">
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          {[
            { label: 'New Orders', value: '182', color: 'bg-blue-100 text-blue-700' },
            { label: 'New Users', value: '67', color: 'bg-purple-100 text-purple-700' },
            { label: 'Refunds', value: '5', color: 'bg-red-100 text-red-700' },
            { label: 'Support Tickets', value: '14', color: 'bg-amber-100 text-amber-700' },
          ].map((s) => (
            <div key={s.label} className={cn('rounded-md p-3 text-center', s.color)}>
              <div className="text-2xl font-semibold">{s.value}</div>
              <div className="text-xs mt-1">{s.label}</div>
            </div>
          ))}
        </div>
      </div>

    </div>
  )
} 