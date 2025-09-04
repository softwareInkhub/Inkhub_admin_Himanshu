'use client'

import React, { useEffect, useState, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { usePathname } from 'next/navigation'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { EnhancedTabs } from './EnhancedTabs'
import { KeepAliveProvider, KeepAliveTabContent } from './KeepAliveTabContent'
import { usePreloadAllTabData } from '@/lib/hooks/useTabDataCache'
import { useAppStore } from '@/lib/store'

// Create a client
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 5 * 60 * 1000, // 5 minutes
      gcTime: 10 * 60 * 1000, // 10 minutes
      refetchOnWindowFocus: false,
      retry: 1,
    },
  },
})

interface EnhancedLayoutProps {
  children: React.ReactNode
  className?: string
}

export function EnhancedLayout({ children, className = '' }: EnhancedLayoutProps) {
  const pathname = usePathname()
  const { tabs, ensureDashboardTab } = useAppStore()
  const { preloadAllData, getPreloadStatus } = usePreloadAllTabData()
  const [isPreloading, setIsPreloading] = useState(false)
  const [preloadProgress, setPreloadProgress] = useState(0)

  // Ensure dashboard tab exists on mount
  useEffect(() => {
    ensureDashboardTab()
  }, [ensureDashboardTab])

  // Preload all tab data in the background
  useEffect(() => {
    const preloadData = async () => {
      if (tabs.length === 0) return
      
      setIsPreloading(true)
      setPreloadProgress(0)
      
      try {
        // Start preloading
        await preloadAllData()
        
        // Simulate progress for better UX
        const progressInterval = setInterval(() => {
          setPreloadProgress(prev => {
            if (prev >= 90) {
              clearInterval(progressInterval)
              return 100
            }
            return prev + 10
          })
        }, 100)
        
        // Complete preloading
        setTimeout(() => {
          setPreloadProgress(100)
          setIsPreloading(false)
        }, 1000)
        
      } catch (error) {
        console.error('Failed to preload data:', error)
        setIsPreloading(false)
      }
    }

    // Delay preloading to avoid blocking initial render
    const timeoutId = setTimeout(preloadData, 1000)
    
    return () => clearTimeout(timeoutId)
  }, [tabs.length, preloadAllData])

  // Get current tab info
  const currentTab = tabs.find(tab => tab.path === pathname)
  const isActiveTab = !!currentTab

  // Preload progress indicator
  const renderPreloadProgress = () => {
    if (!isPreloading) return null

    return (
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -20 }}
        className="fixed top-4 right-4 z-50 bg-white/90 backdrop-blur-md rounded-lg shadow-soft border border-secondary-200 p-4 dark:bg-secondary-800/90 dark:border-secondary-600"
      >
        <div className="flex items-center space-x-3">
          <div className="w-4 h-4 border-2 border-secondary-200 border-t-primary-500 rounded-full animate-spin" />
          <div>
            <div className="text-sm font-medium text-secondary-900 dark:text-secondary-100">
              Preloading Data
            </div>
            <div className="text-xs text-secondary-600 dark:text-secondary-400">
              {preloadProgress}% Complete
            </div>
          </div>
        </div>
        <div className="mt-2 w-32 bg-secondary-200 rounded-full h-2 dark:bg-secondary-700">
          <motion.div
            className="bg-primary-500 h-2 rounded-full"
            initial={{ width: 0 }}
            animate={{ width: `${preloadProgress}%` }}
            transition={{ duration: 0.3 }}
          />
        </div>
      </motion.div>
    )
  }

  return (
    <QueryClientProvider client={queryClient}>
      <KeepAliveProvider maxTabs={10}>
        <div className={`min-h-screen bg-secondary-50 dark:bg-secondary-900 ${className}`}>
          {/* Enhanced Tab Bar */}
          <EnhancedTabs />
          
          {/* Preload Progress Indicator */}
          <AnimatePresence>
            {renderPreloadProgress()}
          </AnimatePresence>
          
          {/* Main Content Area */}
          <main className="flex-1">
            <AnimatePresence mode="wait">
              {isActiveTab && (
                <KeepAliveTabContent
                  key={pathname}
                  path={pathname}
                  isActive={isActiveTab}
                  className="min-h-[calc(100vh-3.5rem)]"
                  onActivate={() => {
                    console.log(`🔄 Tab activated: ${pathname}`)
                  }}
                  onDeactivate={() => {
                    console.log(`💤 Tab deactivated: ${pathname}`)
                  }}
                >
                  <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -20 }}
                    transition={{
                      type: "spring",
                      stiffness: 300,
                      damping: 30,
                      duration: 0.4
                    }}
                    className="p-6"
                  >
                    {children}
                  </motion.div>
                </KeepAliveTabContent>
              )}
            </AnimatePresence>
          </main>
        </div>
      </KeepAliveProvider>
    </QueryClientProvider>
  )
}

// Tab-specific layout components
export function DashboardLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="space-y-6">
      <div className="bg-white dark:bg-secondary-800 rounded-xl shadow-soft p-6">
        <h1 className="text-2xl font-bold text-secondary-900 dark:text-secondary-100 mb-4">
          Dashboard
        </h1>
        {children}
      </div>
    </div>
  )
}

export function DesignLibraryLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="space-y-6">
      <div className="bg-white dark:bg-secondary-800 rounded-xl shadow-soft p-6">
        <h1 className="text-2xl font-bold text-secondary-900 dark:text-secondary-100 mb-4">
          Design Library
        </h1>
        {children}
      </div>
    </div>
  )
}

export function OrdersLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="space-y-6">
      <div className="bg-white dark:bg-secondary-800 rounded-xl shadow-soft p-6">
        <h1 className="text-2xl font-bold text-secondary-900 dark:text-secondary-100 mb-4">
          Orders Management
        </h1>
        {children}
      </div>
    </div>
  )
}

export function ProductsLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="space-y-6">
      <div className="bg-white dark:bg-secondary-800 rounded-xl shadow-soft p-6">
        <h1 className="text-2xl font-bold text-secondary-900 dark:text-secondary-100 mb-4">
          Product Catalog
        </h1>
        {children}
      </div>
    </div>
  )
}

// Performance monitoring component
export function TabPerformanceMonitor() {
  const pathname = usePathname()
  const { getPreloadStatus } = usePreloadAllTabData()
  
  if (process.env.NODE_ENV !== 'development') return null
  
  const preloadStatus = getPreloadStatus()
  
  return (
    <div className="fixed bottom-4 left-4 z-50 bg-white/90 backdrop-blur-md rounded-lg shadow-soft border border-secondary-200 p-3 dark:bg-secondary-800/90 dark:border-secondary-600">
      <div className="text-xs text-secondary-600 dark:text-secondary-400">
        <div>Current: {pathname}</div>
        <div>Preloaded: {Object.values(preloadStatus).filter(Boolean).length}/4</div>
        <div className="mt-1">
          {Object.entries(preloadStatus).map(([key, status]) => (
            <div key={key} className={`w-2 h-2 rounded-full inline-block mr-1 ${status ? 'bg-green-500' : 'bg-red-500'}`} />
          ))}
        </div>
      </div>
    </div>
  )
}
