'use client'

import React, { useState, useRef, useCallback, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { 
  X, 
  Pin, 
  PinOff, 
  Plus, 
  Search, 
  MoreHorizontal,
  Copy,
  Edit,
  Trash2,
  ChevronLeft,
  ChevronRight
} from 'lucide-react'
import { useAppStore } from '@/lib/store'
import { cn } from '@/lib/utils'


interface TabBarProps {
  className?: string
}

export function TabBar({ className }: TabBarProps) {
  const router = useRouter()
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
  const [showScrollButtons, setShowScrollButtons] = useState(false)
  const [canScrollLeft, setCanScrollLeft] = useState(false)
  const [canScrollRight, setCanScrollRight] = useState(false)
  
  const tabsContainerRef = useRef<HTMLDivElement>(null)
  const searchInputRef = useRef<HTMLInputElement>(null)

  // Filter tabs based on search query
  const filteredTabs = tabs.filter(tab => 
    tab.title && tab.title.toLowerCase().includes(searchQuery.toLowerCase())
  )

  // Sort tabs: Dashboard first, then pinned, then others
  const sortedTabs = [...filteredTabs].sort((a, b) => {
    // Dashboard always first
    if (a.path === '/dashboard') return -1
    if (b.path === '/dashboard') return 1
    
    // Then pinned tabs
    if (a.pinned && !b.pinned) return -1
    if (!a.pinned && b.pinned) return 1
    
    // Finally by title (with null safety)
    const titleA = a.title || ''
    const titleB = b.title || ''
    return titleA.localeCompare(titleB)
  })

  // Handle scroll buttons visibility
  const checkScrollButtons = useCallback(() => {
    if (!tabsContainerRef.current) return
    
    const { scrollLeft, scrollWidth, clientWidth } = tabsContainerRef.current
    setCanScrollLeft(scrollLeft > 0)
    setCanScrollRight(scrollLeft < scrollWidth - clientWidth - 1)
    setShowScrollButtons(scrollWidth > clientWidth)
  }, [])

  useEffect(() => {
    checkScrollButtons()
    window.addEventListener('resize', checkScrollButtons)
    return () => window.removeEventListener('resize', checkScrollButtons)
  }, [checkScrollButtons, tabs])

  // Scroll handlers
  const scrollLeft = useCallback(() => {
    if (tabsContainerRef.current) {
      tabsContainerRef.current.scrollBy({ left: -200, behavior: 'smooth' })
    }
  }, [])

  const scrollRight = useCallback(() => {
    if (tabsContainerRef.current) {
      tabsContainerRef.current.scrollBy({ left: 200, behavior: 'smooth' })
    }
  }, [])

  // Search functionality
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.ctrlKey && e.key === 'f') {
        e.preventDefault()
        setShowSearch(true)
        setTimeout(() => searchInputRef.current?.focus(), 0)
      }
      if (e.key === 'Escape') {
        setShowSearch(false)
        setSearchQuery('')
      }
    }

    document.addEventListener('keydown', handleKeyDown)
    return () => document.removeEventListener('keydown', handleKeyDown)
  }, [])

  // Context menu handlers
  const handleContextMenu = useCallback((e: React.MouseEvent, tabId: string) => {
    e.preventDefault()
    setContextMenu({ x: e.clientX, y: e.clientY, tabId })
  }, [])

  const closeContextMenu = useCallback(() => {
    setContextMenu(null)
  }, [])

  useEffect(() => {
    const handleClickOutside = () => closeContextMenu()
    document.addEventListener('click', handleClickOutside)
    return () => document.removeEventListener('click', handleClickOutside)
  }, [closeContextMenu])

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

    // Remove the tab
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

  // Tab click handler with routing
  const handleTabClick = useCallback((tab: any) => {
    setActiveTab(tab.id)
    router.push(tab.path)
  }, [setActiveTab, router])

  // Add new tab handler
  const handleAddTab = useCallback(() => {
    const newTab = {
      title: 'New Tab',
      path: '/new-tab',
      pinned: false,
      closable: true
    }
    
    // Check if tab already exists
    const existingTab = tabs.find(tab => tab.path === newTab.path)
    if (existingTab) {
      setActiveTab(existingTab.id)
      router.push(existingTab.path)
    } else {
      addTab(newTab)
      router.push(newTab.path)
    }
  }, [tabs, setActiveTab, router, addTab])

  if (tabs.length === 0) return null

  return (
    <div className={cn(
      "flex h-12 items-center border-b border-secondary-200 bg-white/80 backdrop-blur-sm px-4 dark:border-secondary-700 dark:bg-secondary-800/80",
      className
    )}>
      {/* Scroll Left Button */}
      {showScrollButtons && canScrollLeft && (
        <button
          onClick={scrollLeft}
          className="mr-2 flex h-8 w-8 items-center justify-center rounded-md border border-secondary-200 bg-white/80 backdrop-blur-sm text-secondary-600 hover:bg-secondary-50 hover-lift dark:border-secondary-600 dark:bg-secondary-700/80 dark:text-secondary-400 dark:hover:bg-secondary-600"
          title="Scroll left"
        >
          <ChevronLeft className="h-4 w-4" />
        </button>
      )}

      {/* Tabs Container */}
      <div 
        ref={tabsContainerRef}
        className="flex flex-1 space-x-1 overflow-x-auto scrollbar-hide"
        onScroll={checkScrollButtons}
      >
        {sortedTabs.map((tab) => (
          <div
            key={tab.id}
            className={cn(
              'group flex items-center space-x-2 rounded-t-lg border border-b-0 border-secondary-200 bg-secondary-50/80 backdrop-blur-sm px-3 py-2 text-sm font-medium transition-all duration-300 hover-lift dark:border-secondary-600 dark:bg-secondary-700/80',
              activeTabId === tab.id
                ? 'border-primary-300 bg-white/90 text-primary-700 shadow-soft dark:border-primary-600 dark:bg-secondary-800/90 dark:text-primary-300'
                : 'text-secondary-600 hover:bg-white/90 hover:text-secondary-900 dark:text-secondary-400 dark:hover:bg-secondary-800/90 dark:hover:text-secondary-100'
            )}
            onContextMenu={(e) => handleContextMenu(e, tab.id)}
          >
            <button
              onClick={() => handleTabClick(tab)}
              className="flex-1 text-left truncate max-w-[200px] focus-ring"
              title={tab.title || 'Untitled Tab'}
            >
              {tab.pinned && <Pin className="h-3 w-3 mr-1 inline" />}
              {tab.title || 'Untitled Tab'}
            </button>
            
            <div className="flex items-center space-x-1 opacity-0 transition-opacity group-hover:opacity-100">
              {/* Pin/Unpin button - only for non-Dashboard tabs */}
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
              
              {/* Close button - only for closable tabs */}
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
            </div>
          </div>
        ))}
      </div>

      {/* Scroll Right Button */}
      {showScrollButtons && canScrollRight && (
        <button
          onClick={scrollRight}
          className="ml-2 flex h-8 w-8 items-center justify-center rounded-md border border-secondary-200 bg-white/80 backdrop-blur-sm text-secondary-600 hover:bg-secondary-50 hover-lift dark:border-secondary-600 dark:bg-secondary-700/80 dark:text-secondary-400 dark:hover:bg-secondary-600"
          title="Scroll right"
        >
          <ChevronRight className="h-4 w-4" />
        </button>
      )}

      {/* Search Button */}
      <button
        onClick={() => {
          setShowSearch(!showSearch)
          if (!showSearch) {
            setTimeout(() => searchInputRef.current?.focus(), 0)
          }
        }}
        className="ml-2 flex h-8 w-8 items-center justify-center rounded-md border border-secondary-200 bg-white/80 backdrop-blur-sm text-secondary-600 hover:bg-secondary-50 hover-lift dark:border-secondary-600 dark:bg-secondary-700/80 dark:text-secondary-400 dark:hover:bg-secondary-600"
        title="Search tabs (Ctrl+F)"
      >
        <Search className="h-4 w-4" />
      </button>

      {/* Add New Tab Button */}
      <button
        onClick={handleAddTab}
        className="ml-2 flex h-8 w-8 items-center justify-center rounded-md border border-secondary-200 bg-white/80 backdrop-blur-sm text-secondary-600 hover:bg-secondary-50 hover-lift dark:border-secondary-600 dark:bg-secondary-700/80 dark:text-secondary-400 dark:hover:bg-secondary-600"
        title="Add new tab"
      >
        <Plus className="h-4 w-4" />
      </button>

      {/* Search Input */}
      {showSearch && (
        <div className="ml-2 flex items-center animate-fade-in">
          <input
            ref={searchInputRef}
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search tabs..."
            className="h-8 w-48 rounded-md border border-secondary-200 bg-white/90 backdrop-blur-sm px-3 py-1 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500 dark:border-secondary-600 dark:bg-secondary-700/90 dark:text-white"
          />
          <button
            onClick={() => {
              setShowSearch(false)
              setSearchQuery('')
            }}
            className="ml-2 flex h-8 w-8 items-center justify-center rounded-md border border-secondary-200 bg-white/80 backdrop-blur-sm text-secondary-600 hover:bg-secondary-50 hover-lift dark:border-secondary-600 dark:bg-secondary-700/80 dark:text-secondary-400 dark:hover:bg-secondary-600"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
      )}

      {/* Context Menu */}
      {contextMenu && (
        <div
          className="fixed z-50 min-w-[200px] rounded-md border border-secondary-200 bg-white/90 backdrop-blur-sm py-1 shadow-soft animate-fade-in dark:border-secondary-600 dark:bg-secondary-800/90"
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
          {/* Pin/Unpin option - only for non-Dashboard tabs */}
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
          {/* Close option - only for closable tabs */}
          {tabs.find(t => t.id === contextMenu.tabId)?.closable && (
            <button
              onClick={() => handleCloseTab(contextMenu.tabId)}
              className="flex w-full items-center px-4 py-2 text-sm text-red-600 hover:bg-red-50 hover-lift dark:text-red-400 dark:hover:bg-red-900"
            >
              <Trash2 className="mr-2 h-4 w-4" />
              Close
            </button>
          )}
        </div>
      )}
    </div>
  )
} 