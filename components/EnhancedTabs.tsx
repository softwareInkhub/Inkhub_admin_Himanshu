'use client'

import React, { useState, useEffect, useMemo, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useRouter, usePathname } from 'next/navigation'
import { 
  BarChart3, 
  Palette, 
  ShoppingCart, 
  Package,
  Search,
  Plus,
  X,
  Pin,
  PinOff,
  MoreHorizontal,
  Copy,
  Edit,
  Trash2
} from 'lucide-react'
import { useAppStore } from '@/lib/store'
import { cn } from '@/lib/utils'

// Tab configuration with icons and metadata
const TAB_CONFIG = {
  '/dashboard': {
    title: 'Dashboard',
    icon: BarChart3,
    color: 'blue',
    description: 'Overview and analytics'
  },
  '/design-library/designs': {
    title: 'Design Library',
    icon: Palette,
    color: 'purple',
    description: 'Manage design assets'
  },
  '/apps/shopify/orders': {
    title: 'Orders',
    icon: ShoppingCart,
    color: 'green',
    description: 'Shopify order management'
  },
  '/apps/shopify/products': {
    title: 'Products',
    icon: Package,
    color: 'orange',
    description: 'Product catalog management'
  }
} as const

interface TabData {
  id: string
  path: keyof typeof TAB_CONFIG
  title: string
  icon: React.ComponentType<{ className?: string }>
  color: string
  description: string
  pinned: boolean
  closable: boolean
  isActive: boolean
}

interface EnhancedTabsProps {
  className?: string
}

export function EnhancedTabs({ className }: EnhancedTabsProps) {
  const router = useRouter()
  const pathname = usePathname()
  const { 
    tabs, 
    activeTabId, 
    removeTab, 
    setActiveTab, 
    toggleTabPin,
    addTab,
    renameTab,
    duplicateTab
  } = useAppStore()

  const [searchQuery, setSearchQuery] = useState('')
  const [showSearch, setShowSearch] = useState(false)
  const [contextMenu, setContextMenu] = useState<{
    x: number
    y: number
    tabId: string
  } | null>(null)
  const [hoveredTab, setHoveredTab] = useState<string | null>(null)

  // Create enhanced tab data with metadata
  const enhancedTabs = useMemo(() => {
    return tabs.map(tab => {
      const config = TAB_CONFIG[tab.path as keyof typeof TAB_CONFIG]
      if (!config) return null

      return {
        id: tab.id,
        path: tab.path as keyof typeof TAB_CONFIG,
        title: tab.title || config.title,
        icon: config.icon,
        color: config.color,
        description: config.description,
        pinned: tab.pinned,
        closable: tab.closable,
        isActive: activeTabId === tab.id
      }
    }).filter(Boolean) as TabData[]
  }, [tabs, activeTabId])

  // Filter tabs based on search query
  const filteredTabs = useMemo(() => {
    if (!searchQuery) return enhancedTabs
    return enhancedTabs.filter(tab => 
      tab.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      tab.description.toLowerCase().includes(searchQuery.toLowerCase())
    )
  }, [enhancedTabs, searchQuery])

  // Sort tabs: Dashboard first, then pinned, then others
  const sortedTabs = useMemo(() => {
    return [...filteredTabs].sort((a, b) => {
      // Dashboard always first
      if (a.path === '/dashboard') return -1
      if (b.path === '/dashboard') return 1
      
      // Then pinned tabs
      if (a.pinned && !b.pinned) return -1
      if (!a.pinned && b.pinned) return 1
      
      // Finally by title
      return a.title.localeCompare(b.title)
    })
  }, [filteredTabs])

  // Handle tab click with instant navigation
  const handleTabClick = useCallback((tab: TabData) => {
    setActiveTab(tab.id)
    router.push(tab.path)
  }, [setActiveTab, router])

  // Context menu handlers
  const handleContextMenu = useCallback((e: React.MouseEvent, tabId: string) => {
    e.preventDefault()
    setContextMenu({ x: e.clientX, y: e.clientY, tabId })
  }, [])

  const closeContextMenu = useCallback(() => {
    setContextMenu(null)
  }, [])

  // Context menu actions
  const handleDuplicateTab = useCallback((tabId: string) => {
    duplicateTab(tabId)
    closeContextMenu()
  }, [duplicateTab, closeContextMenu])

  const handleRenameTab = useCallback((tabId: string) => {
    const newTitle = prompt('Enter new tab name:')
    if (newTitle && newTitle.trim()) {
      renameTab(tabId, newTitle.trim())
    }
    closeContextMenu()
  }, [renameTab, closeContextMenu])

  const handleCloseTab = useCallback((tabId: string) => {
    const tab = tabs.find(t => t.id === tabId)
    if (!tab) return

    removeTab(tabId)
    closeContextMenu()

    // If we closed the active tab, navigate to the new active tab
    if (activeTabId === tabId) {
      const remainingTabs = tabs.filter(t => t.id !== tabId)
      if (remainingTabs.length > 0) {
        const nextTab = remainingTabs[0]
        setActiveTab(nextTab.id)
        router.push(nextTab.path)
      } else {
        // If no tabs left, go to dashboard
        router.push('/dashboard')
      }
    }
  }, [removeTab, closeContextMenu, tabs, activeTabId, setActiveTab, router])

  const handlePinTab = useCallback((tabId: string) => {
    toggleTabPin(tabId)
    closeContextMenu()
  }, [toggleTabPin, closeContextMenu])

  // Add new tab handler
  const handleAddTab = useCallback(() => {
    // Find the first available path that's not already open
    const availablePaths = Object.keys(TAB_CONFIG) as Array<keyof typeof TAB_CONFIG>
    const openPaths = tabs.map(t => t.path)
    const nextPath = availablePaths.find(path => !openPaths.includes(path))
    
    if (nextPath) {
      const config = TAB_CONFIG[nextPath]
      const newTab = {
        title: config.title,
        path: nextPath,
        pinned: false,
        closable: true
      }
      addTab(newTab)
      router.push(nextPath)
    }
  }, [tabs, addTab, router])

  // Close context menu when clicking outside
  useEffect(() => {
    const handleClickOutside = () => closeContextMenu()
    document.addEventListener('click', handleClickOutside)
    return () => document.removeEventListener('click', handleClickOutside)
  }, [closeContextMenu])

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.ctrlKey && e.key === 'f') {
        e.preventDefault()
        setShowSearch(true)
      }
      if (e.key === 'Escape') {
        setShowSearch(false)
        setSearchQuery('')
        closeContextMenu()
      }
    }

    document.addEventListener('keydown', handleKeyDown)
    return () => document.removeEventListener('keydown', handleKeyDown)
  }, [closeContextMenu])

  if (tabs.length === 0) return null

  return (
    <div className={cn(
      "flex h-14 items-center border-b border-secondary-200 bg-white/90 backdrop-blur-md px-4 dark:border-secondary-700 dark:bg-secondary-800/90",
      className
    )}>
      {/* Tabs Container */}
      <div className="flex flex-1 space-x-1 overflow-x-auto scrollbar-hide">
        <AnimatePresence mode="popLayout">
          {sortedTabs.map((tab) => (
            <motion.div
              key={tab.id}
              layout
              initial={{ opacity: 0, scale: 0.8, y: -10 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.8, y: -10 }}
              transition={{ 
                type: "spring", 
                stiffness: 500, 
                damping: 30,
                duration: 0.2
              }}
              className={cn(
                'group relative flex items-center space-x-2 rounded-t-xl border border-b-0 px-4 py-3 text-sm font-medium transition-all duration-300 hover-lift cursor-pointer',
                tab.isActive
                  ? `border-${tab.color}-300 bg-white/95 text-${tab.color}-700 shadow-soft dark:border-${tab.color}-600 dark:bg-secondary-800/95 dark:text-${tab.color}-300`
                  : 'border-secondary-200 bg-secondary-50/80 text-secondary-600 hover:bg-white/90 hover:text-secondary-900 hover:border-secondary-300 dark:border-secondary-600 dark:bg-secondary-700/80 dark:text-secondary-400 dark:hover:bg-secondary-800/90 dark:hover:text-secondary-100'
              )}
              onClick={() => handleTabClick(tab)}
              onContextMenu={(e) => handleContextMenu(e, tab.id)}
              onMouseEnter={() => setHoveredTab(tab.id)}
              onMouseLeave={() => setHoveredTab(null)}
            >
              {/* Tab Icon */}
              <tab.icon className={cn(
                "h-4 w-4 transition-colors duration-200",
                tab.isActive ? `text-${tab.color}-600` : "text-secondary-500"
              )} />
              
              {/* Tab Title */}
              <span className="truncate max-w-[150px] font-medium">
                {tab.title}
              </span>
              
              {/* Pin Indicator */}
              {tab.pinned && (
                <motion.div
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  transition={{ delay: 0.1 }}
                >
                  <Pin className="h-3 w-3 text-secondary-400" />
                </motion.div>
              )}
              
              {/* Tab Actions - Only show on hover */}
              <AnimatePresence>
                {hoveredTab === tab.id && (
                  <motion.div
                    initial={{ opacity: 0, scale: 0.8 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.8 }}
                    transition={{ duration: 0.15 }}
                    className="flex items-center space-x-1"
                    onClick={(e) => e.stopPropagation()}
                  >
                    {/* Pin/Unpin button */}
                    {tab.path !== '/dashboard' && (
                      <button
                        onClick={(e) => {
                          e.stopPropagation()
                          toggleTabPin(tab.id)
                        }}
                        className="rounded p-1 text-secondary-400 hover:bg-secondary-200 hover:text-secondary-600 hover-lift dark:text-secondary-500 dark:hover:bg-secondary-600 dark:hover:text-secondary-300"
                        title={tab.pinned ? 'Unpin tab' : 'Pin tab'}
                      >
                        {tab.pinned ? (
                          <Pin className="h-3 w-3" />
                        ) : (
                          <PinOff className="h-3 w-3" />
                        )}
                      </button>
                    )}
                    
                    {/* Close button */}
                    {tab.closable && (
                      <button
                        onClick={(e) => {
                          e.stopPropagation()
                          handleCloseTab(tab.id)
                        }}
                        className="rounded p-1 text-secondary-400 hover:bg-red-100 hover:text-red-600 hover-lift dark:text-secondary-500 dark:hover:bg-red-900 dark:hover:text-red-400"
                        title="Close tab"
                      >
                        <X className="h-3 w-3" />
                      </button>
                    )}
                  </motion.div>
                )}
              </AnimatePresence>
              
              {/* Active Tab Indicator */}
              {tab.isActive && (
                <motion.div
                  layoutId="activeTabIndicator"
                  className={cn(
                    "absolute bottom-0 left-0 right-0 h-0.5 rounded-full",
                    `bg-${tab.color}-500`
                  )}
                  transition={{ type: "spring", stiffness: 500, damping: 30 }}
                />
              )}
            </motion.div>
          ))}
        </AnimatePresence>
      </div>

      {/* Search Button */}
      <button
        onClick={() => {
          setShowSearch(!showSearch)
        }}
        className="ml-2 flex h-9 w-9 items-center justify-center rounded-lg border border-secondary-200 bg-white/80 backdrop-blur-sm text-secondary-600 hover:bg-secondary-50 hover-lift dark:border-secondary-600 dark:bg-secondary-700/80 dark:text-secondary-400 dark:hover:bg-secondary-600"
        title="Search tabs (Ctrl+F)"
      >
        <Search className="h-4 w-4" />
      </button>

      {/* Add New Tab Button */}
      <button
        onClick={handleAddTab}
        className="ml-2 flex h-9 w-9 items-center justify-center rounded-lg border border-secondary-200 bg-white/80 backdrop-blur-sm text-secondary-600 hover:bg-secondary-50 hover-lift dark:border-secondary-600 dark:bg-secondary-700/80 dark:text-secondary-400 dark:hover:bg-secondary-600"
        title="Add new tab"
      >
        <Plus className="h-4 w-4" />
      </button>

      {/* Search Input */}
      <AnimatePresence>
        {showSearch && (
          <motion.div
            initial={{ opacity: 0, width: 0 }}
            animate={{ opacity: 1, width: 'auto' }}
            exit={{ opacity: 0, width: 0 }}
            transition={{ duration: 0.2 }}
            className="ml-2 flex items-center overflow-hidden"
          >
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search tabs..."
              className="h-9 w-48 rounded-lg border border-secondary-200 bg-white/90 backdrop-blur-sm px-3 py-1 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500 dark:border-secondary-600 dark:bg-secondary-700/90 dark:text-white"
              autoFocus
            />
            <button
              onClick={() => {
                setShowSearch(false)
                setSearchQuery('')
              }}
              className="ml-2 flex h-9 w-9 items-center justify-center rounded-lg border border-secondary-200 bg-white/80 backdrop-blur-sm text-secondary-600 hover:bg-secondary-50 hover-lift dark:border-secondary-600 dark:bg-secondary-700/80 dark:text-secondary-400 dark:hover:bg-secondary-600"
            >
              <X className="h-4 w-4" />
            </button>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Context Menu */}
      <AnimatePresence>
        {contextMenu && (
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 5 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 5 }}
            transition={{ duration: 0.15 }}
            className="fixed z-50 min-w-[200px] rounded-lg border border-secondary-200 bg-white/95 backdrop-blur-md py-1 shadow-soft dark:border-secondary-600 dark:bg-secondary-800/95"
            style={{
              left: contextMenu.x,
              top: contextMenu.y,
            }}
          >
            <button
              onClick={() => handleRenameTab(contextMenu.tabId)}
              className="flex w-full items-center px-4 py-2 text-sm text-secondary-700 hover:bg-secondary-100 hover-lift dark:text-secondary-300 dark:hover:bg-secondary-700"
            >
              <Edit className="mr-2 h-4 w-4" />
              Rename
            </button>
            <button
              onClick={() => handleDuplicateTab(contextMenu.tabId)}
              className="flex w-full items-center px-4 py-2 text-sm text-secondary-700 hover:bg-secondary-100 hover-lift dark:text-secondary-300 dark:hover:bg-secondary-700"
            >
              <Copy className="mr-2 h-4 w-4" />
              Duplicate
            </button>
            {/* Pin/Unpin option */}
            {tabs.find(t => t.id === contextMenu.tabId)?.path !== '/dashboard' && (
              <button
                onClick={() => handlePinTab(contextMenu.tabId)}
                className="flex w-full items-center px-4 py-2 text-sm text-secondary-700 hover:bg-secondary-100 hover-lift dark:text-secondary-300 dark:hover:bg-secondary-700"
              >
                {tabs.find(t => t.id === contextMenu.tabId)?.pinned ? (
                  <>
                    <PinOff className="mr-2 h-4 w-4" />
                    Unpin
                  </>
                ) : (
                  <>
                    <Pin className="mr-2 h-4 w-4" />
                    Pin
                  </>
                )}
              </button>
            )}
            <div className="my-1 border-t border-secondary-200 dark:border-secondary-600" />
            {/* Close option */}
            {tabs.find(t => t.id === contextMenu.tabId)?.closable && (
              <button
                onClick={() => handleCloseTab(contextMenu.tabId)}
                className="flex w-full items-center px-4 py-2 text-sm text-red-600 hover:bg-red-50 hover-lift dark:text-red-400 dark:hover:bg-red-900"
              >
                <Trash2 className="mr-2 h-4 w-4" />
                Close
              </button>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}

