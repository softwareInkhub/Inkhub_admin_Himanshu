'use client'

import { useState, useEffect, useCallback } from 'react'

interface SavedView {
  id: string
  viewName: string
  created_at?: number
  createdAt: number
  updatedAt: number
  userId?: string
  searchState: {
    searchQuery?: string
    searchConditions?: any[]
    columnFilters?: Record<string, any>
    customFilters?: any[]
    advancedFilters?: any
    sortColumn?: string
    sortDirection?: 'asc' | 'desc'
    viewMode?: 'table' | 'grid' | 'card'
    itemsPerPage?: number
  }
}

interface UseSavedViewsProps {
  storageKey: string // e.g., 'pins-saved-views', 'boards-saved-views'
  currentState: {
    searchQuery?: string
    searchConditions?: any[]
    columnFilters?: Record<string, any>
    customFilters?: any[]
    advancedFilters?: any
    sortColumn?: string
    sortDirection?: 'asc' | 'desc'
    viewMode?: 'table' | 'grid' | 'card'
    itemsPerPage?: number
  }
  onApply: (state: SavedView['searchState']) => void
}

export function useSavedViews({ storageKey, currentState, onApply }: UseSavedViewsProps) {
  const [savedViews, setSavedViews] = useState<SavedView[]>([])
  const [showSaveModal, setShowSaveModal] = useState(false)
  const [viewName, setViewName] = useState('')

  // Load saved views from localStorage on mount
  useEffect(() => {
    if (typeof window === 'undefined') return
    
    try {
      const cached = localStorage.getItem(storageKey)
      if (cached) {
        const parsed = JSON.parse(cached)
        if (Array.isArray(parsed)) {
          setSavedViews(parsed)
        }
      }
    } catch (error) {
      console.error('Error loading saved views:', error)
    }
  }, [storageKey])

  // Save view to localStorage
  const handleSaveView = useCallback(() => {
    setShowSaveModal(true)
    // Pre-fill with search query if available
    if (currentState.searchQuery && currentState.searchQuery.trim()) {
      setViewName(currentState.searchQuery.trim())
    }
  }, [currentState.searchQuery])

  // Confirm save with view name
  const handleConfirmSave = useCallback((name: string) => {
    if (!name.trim()) return

    try {
      const nowTs = Date.now()
      const newView: SavedView = {
        id: `view-${nowTs}`,
        viewName: name.trim(),
        created_at: nowTs,
        createdAt: nowTs,
        updatedAt: nowTs,
        userId: 'user', // Can be replaced with actual user ID if available
        searchState: {
          searchQuery: currentState.searchQuery,
          searchConditions: currentState.searchConditions,
          columnFilters: currentState.columnFilters,
          customFilters: currentState.customFilters,
          advancedFilters: currentState.advancedFilters,
          sortColumn: currentState.sortColumn,
          sortDirection: currentState.sortDirection,
          viewMode: currentState.viewMode,
          itemsPerPage: currentState.itemsPerPage
        }
      }

      setSavedViews(prev => {
        const next = [...prev, newView]
        try {
          if (typeof window !== 'undefined') {
            localStorage.setItem(storageKey, JSON.stringify(next))
          }
        } catch (error) {
          console.error('Error saving view to localStorage:', error)
        }
        return next
      })

      setShowSaveModal(false)
      setViewName('')
    } catch (error) {
      console.error('Error creating saved view:', error)
    }
  }, [storageKey, currentState])

  // Apply a saved view
  const handleApplyView = useCallback((savedView: SavedView) => {
    console.log('📋 Applying saved view:', savedView.viewName)
    
    // Support both old and new formats
    const searchState = savedView.searchState || {
      searchQuery: (savedView as any).searchQuery,
      searchConditions: (savedView as any).searchConditions,
      columnFilters: (savedView as any).columnFilters,
      customFilters: (savedView as any).customFilters,
      sortColumn: (savedView as any).sortColumn,
      sortDirection: (savedView as any).sortDirection,
      viewMode: (savedView as any).viewMode,
      itemsPerPage: (savedView as any).itemsPerPage
    }

    onApply(searchState)
  }, [onApply])

  // Delete a saved view
  const handleDeleteView = useCallback((id: string) => {
    setSavedViews(prev => {
      const next = prev.filter(view => view.id !== id)
      try {
        if (typeof window !== 'undefined') {
          localStorage.setItem(storageKey, JSON.stringify(next))
        }
      } catch (error) {
        console.error('Error deleting view:', error)
      }
      return next
    })
  }, [storageKey])

  return {
    savedViews,
    showSaveModal,
    setShowSaveModal,
    viewName,
    setViewName,
    handleSaveView,
    handleConfirmSave,
    handleApplyView,
    handleDeleteView
  }
}



