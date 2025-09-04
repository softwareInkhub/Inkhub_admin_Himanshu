'use client'

import React, { useState, useEffect, useRef, useMemo } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { usePathname } from 'next/navigation'

interface KeepAliveTabContentProps {
  children: React.ReactNode
  path: string
  isActive: boolean
  className?: string
  onActivate?: () => void
  onDeactivate?: () => void
}

interface TabInstance {
  path: string
  component: React.ReactNode
  isActive: boolean
  lastActive: number
  mountCount: number
}

interface KeepAliveContextType {
  registerTab: (path: string, component: React.ReactNode) => void
  unregisterTab: (path: string) => void
  activateTab: (path: string) => void
  deactivateTab: (path: string) => void
  getTabInstance: (path: string) => TabInstance | undefined
}

const KeepAliveContext = React.createContext<KeepAliveContextType | null>(null)

export function useKeepAlive() {
  const context = React.useContext(KeepAliveContext)
  if (!context) {
    throw new Error('useKeepAlive must be used within KeepAliveProvider')
  }
  return context
}

interface KeepAliveProviderProps {
  children: React.ReactNode
  maxTabs?: number
}

export function KeepAliveProvider({ children, maxTabs = 10 }: KeepAliveProviderProps) {
  const [tabInstances, setTabInstances] = useState<Map<string, TabInstance>>(new Map())
  const [activeTab, setActiveTab] = useState<string | null>(null)

  const registerTab = useMemo(() => (path: string, component: React.ReactNode) => {
    setTabInstances(prev => {
      const newMap = new Map(prev)
      
      if (!newMap.has(path)) {
        // Check if we need to evict a tab due to max limit
        if (newMap.size >= maxTabs) {
          // Find the least recently used tab (excluding active)
          let oldestTab: string | null = null
          let oldestTime = Date.now()
          
          Array.from(newMap.entries()).forEach(([tabPath, instance]) => {
            if (tabPath !== activeTab && instance.lastActive < oldestTime) {
              oldestTime = instance.lastActive
              oldestTab = tabPath
            }
          })
          
          // Remove the oldest tab
          if (oldestTab) {
            newMap.delete(oldestTab)
          }
        }
        
        newMap.set(path, {
          path,
          component,
          isActive: false,
          lastActive: Date.now(),
          mountCount: 1
        })
      } else {
        // Update existing tab
        const existing = newMap.get(path)!
        newMap.set(path, {
          ...existing,
          mountCount: existing.mountCount + 1
        })
      }
      
      return newMap
    })
  }, [maxTabs, activeTab])

  const unregisterTab = useMemo(() => (path: string) => {
    setTabInstances(prev => {
      const newMap = new Map(prev)
      const existing = newMap.get(path)
      
      if (existing) {
        if (existing.mountCount <= 1) {
          newMap.delete(path)
        } else {
          newMap.set(path, {
            ...existing,
            mountCount: existing.mountCount - 1
          })
        }
      }
      
      return newMap
    })
  }, [])

  const activateTab = useMemo(() => (path: string) => {
    setActiveTab(path)
    setTabInstances(prev => {
      const newMap = new Map(prev)
      const existing = newMap.get(path)
      
      if (existing) {
        newMap.set(path, {
          ...existing,
          isActive: true,
          lastActive: Date.now()
        })
      }
      
      return newMap
    })
  }, [])

  const deactivateTab = useMemo(() => (path: string) => {
    setTabInstances(prev => {
      const newMap = new Map(prev)
      const existing = newMap.get(path)
      
      if (existing) {
        newMap.set(path, {
          ...existing,
          isActive: false
        })
      }
      
      return newMap
    })
  }, [])

  const getTabInstance = useMemo(() => (path: string) => {
    return tabInstances.get(path)
  }, [tabInstances])

  const contextValue = useMemo(() => ({
    registerTab,
    unregisterTab,
    activateTab,
    deactivateTab,
    getTabInstance
  }), [registerTab, unregisterTab, activateTab, deactivateTab, getTabInstance])

  return (
    <KeepAliveContext.Provider value={contextValue}>
      {children}
    </KeepAliveContext.Provider>
  )
}

export function KeepAliveTabContent({
  children,
  path,
  isActive,
  className = '',
  onActivate,
  onDeactivate
}: KeepAliveTabContentProps) {
  const { registerTab, unregisterTab, activateTab, deactivateTab } = useKeepAlive()
  const [isMounted, setIsMounted] = useState(false)
  const componentRef = useRef<HTMLDivElement>(null)
  const prevIsActive = useRef(isActive)

  // Register tab on mount
  useEffect(() => {
    registerTab(path, children)
    setIsMounted(true)
    
    return () => {
      unregisterTab(path)
    }
  }, [path, children, registerTab, unregisterTab])

  // Handle activation/deactivation
  useEffect(() => {
    if (isActive && !prevIsActive.current) {
      activateTab(path)
      onActivate?.()
    } else if (!isActive && prevIsActive.current) {
      deactivateTab(path)
      onDeactivate?.()
    }
    
    prevIsActive.current = isActive
  }, [isActive, path, activateTab, deactivateTab, onActivate, onDeactivate])

  // Animation variants
  const variants = {
    hidden: {
      opacity: 0,
      x: 20,
      scale: 0.98
    },
    visible: {
      opacity: 1,
      x: 0,
      scale: 1
    },
    exit: {
      opacity: 0,
      x: -20,
      scale: 0.98
    }
  }

  if (!isMounted) {
    return null
  }

  return (
    <AnimatePresence mode="wait">
      {isActive && (
        <motion.div
          key={path}
          ref={componentRef}
          className={className}
          initial="hidden"
          animate="visible"
          exit="exit"
          variants={variants}
          transition={{
            type: "spring",
            stiffness: 300,
            damping: 30,
            duration: 0.3
          }}
          style={{
            display: isActive ? 'block' : 'none'
          }}
        >
          {children}
        </motion.div>
      )}
    </AnimatePresence>
  )
}

// Hook for managing tab lifecycle
export function useTabLifecycle(path: string) {
  const { activateTab, deactivateTab, getTabInstance } = useKeepAlive()
  const pathname = usePathname()
  const isActive = pathname === path

  useEffect(() => {
    if (isActive) {
      activateTab(path)
    } else {
      deactivateTab(path)
    }
  }, [isActive, path, activateTab, deactivateTab])

  const tabInstance = getTabInstance(path)
  const isMounted = !!tabInstance
  const lastActive = tabInstance?.lastActive || 0
  const mountCount = tabInstance?.mountCount || 0

  return {
    isActive,
    isMounted,
    lastActive,
    mountCount,
    activate: () => activateTab(path),
    deactivate: () => deactivateTab(path)
  }
}

// Performance monitoring hook
export function useTabPerformance(path: string) {
  const { getTabInstance } = useKeepAlive()
  const [performanceMetrics, setPerformanceMetrics] = useState({
    mountTime: 0,
    renderTime: 0,
    memoryUsage: 0
  })

  useEffect(() => {
    const startTime = performance.now()
    
    return () => {
      const endTime = performance.now()
      const renderTime = endTime - startTime
      
      setPerformanceMetrics(prev => ({
        ...prev,
        renderTime
      }))
    }
  }, [path])

  const tabInstance = getTabInstance(path)
  
  useEffect(() => {
    if (tabInstance) {
      // Monitor memory usage if available
      if ('memory' in performance) {
        const memory = (performance as any).memory
        setPerformanceMetrics(prev => ({
          ...prev,
          memoryUsage: memory.usedJSHeapSize
        }))
      }
    }
  }, [tabInstance])

  return performanceMetrics
}

