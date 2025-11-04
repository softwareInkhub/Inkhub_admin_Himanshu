'use client'

import React, { useState, useRef, useEffect } from 'react'
import { 
  Search, 
  Filter, 
  Grid, 
  List, 
  Download, 
  Upload, 
  Printer, 
  Settings, 
  MoreHorizontal,
  X,
  ChevronDown,
  ChevronUp,
  Eye,
  Edit,
  Trash2,
  Pin,
  PinOff,
  Maximize2,
  Minimize2
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { SearchCondition, CustomFilter, ViewMode, TableItem } from './types/unified-table'
import AdvancedSearchBuilder from './AdvancedSearchBuilder'
import FilterPanel from './FilterPanel'
import ColumnFilter from './ColumnFilter'
import GoogleStyleSearch from './GoogleStyleSearch'

// Define search suggestion type locally (matches SearchSuggestion from utils/searchSuggestions)
interface SharedSearchSuggestion {
  id: string
  text: string
  type: 'history' | 'product' | 'vendor' | 'category' | 'tag'
  count?: number
}

interface UnifiedSearchControlsProps<T extends TableItem> {
  // Search
  searchQuery: string
  setSearchQuery: (query: string) => void
  searchConditions: SearchCondition[]
  showSearchBuilder: boolean
  setShowSearchBuilder: (show: boolean) => void
  showAdvancedFilter: boolean
  setShowAdvancedFilter: (show: boolean) => void
  
  // View and UI
  viewMode: ViewMode
  setViewMode: (mode: ViewMode) => void
  showAdditionalControls: boolean
  setShowAdditionalControls: (show: boolean) => void
  isFullScreen: boolean
  onToggleFullScreen: () => void
  
  // Filters
  activeFilter: string
  setActiveFilter: (filter: string) => void
  customFilters: CustomFilter[]
  onAddCustomFilter: (filter: { name: string; field: string; operator: string; value: string }) => void
  onRemoveCustomFilter: (filterId: string) => void
  hiddenDefaultFilters: Set<string>
  onShowAllFilters: () => void
  
  // Actions
  onClearSearch: () => void
  onClearSearchConditions: () => void
  selectedItems: string[]
  onBulkEdit: () => void
  onExportSelected: () => void
  onBulkDelete: () => void
  onExport: () => void
  onImport: () => void
  onPrint: () => void
  onSettings: () => void
  
  // Data and filtering
  currentItems: T[]
  onSelectAll: () => void
  activeColumnFilter: string | null
  columnFilters: Record<string, any>
  onFilterClick: (column: string | null) => void
  onColumnFilterChange: (column: string, value: any) => void
  getUniqueValues: (field: string) => string[]
  
  // UI state
  showHeaderDropdown: boolean
  setShowHeaderDropdown: (show: boolean) => void
  showMoreActions?: boolean
  showExport?: boolean
  
  // Algolia integration
  isAlgoliaSearching?: boolean
  useAlgoliaSearch?: boolean
  
  // Page-specific configuration
  itemTypeName?: string
  showViewToggle?: boolean
  showFullScreenToggle?: boolean
}

export default function UnifiedSearchControls<T extends TableItem>({
  searchQuery,
  setSearchQuery,
  searchConditions,
  showSearchBuilder,
  setShowSearchBuilder,
  showAdvancedFilter,
  setShowAdvancedFilter,
  viewMode,
  setViewMode,
  showAdditionalControls,
  setShowAdditionalControls,
  activeFilter,
  setActiveFilter,
  customFilters,
  onAddCustomFilter,
  onRemoveCustomFilter,
  hiddenDefaultFilters,
  onShowAllFilters,
  onClearSearch,
  onClearSearchConditions,
  selectedItems,
  onBulkEdit,
  onExportSelected,
  onBulkDelete,
  currentItems,
  onSelectAll,
  activeColumnFilter,
  columnFilters,
  onFilterClick,
  onColumnFilterChange,
  getUniqueValues,
  onExport,
  onImport,
  onPrint,
  onSettings,
  showHeaderDropdown,
  setShowHeaderDropdown,
  showMoreActions = true,
  showExport = true,
  isFullScreen,
  onToggleFullScreen,
  isAlgoliaSearching = false,
  useAlgoliaSearch = false,
  itemTypeName = 'items',
  showViewToggle = true,
  showFullScreenToggle = true
}: UnifiedSearchControlsProps<T>) {
  // Search state - always visible
  const searchInputRef = useRef<HTMLInputElement>(null)
  const containerRef = useRef<HTMLDivElement>(null)
  const [searchHistory, setSearchHistory] = useState<SharedSearchSuggestion[]>([])
  const [suggestions, setSuggestions] = useState<SharedSearchSuggestion[]>([])
  const [showSuggestions, setShowSuggestions] = useState(false)
  const prevSigRef = useRef<string>('')
  const prevShowRef = useRef<boolean>(false)

  const handleClearSearch = () => {
    setSearchQuery('')
    onClearSearch()
    searchInputRef.current?.focus()
  }

  const handleResetAll = () => {
    setActiveFilter('')
    setShowHeaderDropdown(false)
    setShowAdvancedFilter(false)
    if (searchQuery) handleClearSearch()
    onClearSearchConditions()
    // Reset all column filters generically
    const keys = Object.keys(columnFilters || {})
    keys.forEach((key) => {
      const val = (columnFilters as any)[key]
      onColumnFilterChange(key, Array.isArray(val) ? [] : '')
    })
    onFilterClick('')
  }

  // Load and save simple history (shared across pages)
  useEffect(() => {
    try {
      const raw = localStorage.getItem('shared-search-history')
      if (raw) setSearchHistory(JSON.parse(raw))
    } catch {}
  }, [])

  useEffect(() => {
    try {
      localStorage.setItem('shared-search-history', JSON.stringify(searchHistory.slice(0, 10)))
    } catch {}
  }, [searchHistory])

  // Click outside detection to close dropdown
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as HTMLElement
      
      // Check if click is outside the dropdown and its trigger button
      if (!target.closest('.header-dropdown') && !target.closest('[data-dropdown-trigger="more-actions"]')) {
        setShowHeaderDropdown(false)
      }
    }

    // Only add listener when dropdown is open
    if (showHeaderDropdown) {
      document.addEventListener('mousedown', handleClickOutside)
      return () => document.removeEventListener('mousedown', handleClickOutside)
    }
  }, [showHeaderDropdown, setShowHeaderDropdown])

  const pushHistory = (text: string, count: number) => {
    if (!text.trim()) return
    const item: SharedSearchSuggestion = { id: `h-${Date.now()}`, text, type: 'history', count }
    setSearchHistory(prev => [item, ...prev.filter(h => h.text !== text)].slice(0, 10))
  }

  const clearHistory = () => {
    setSearchHistory([])
    localStorage.removeItem('shared-search-history')
  }

  // Build lightweight suggestions from current items and query
  useEffect(() => {
    const query = (searchQuery || '').toLowerCase().trim()
    const items = Array.isArray(currentItems) ? currentItems : []
    const max = 6
    const make = (arr: string[], type: SharedSearchSuggestion['type']) =>
      Array.from(new Set(arr.filter(Boolean))).slice(0, max).map((t, i) => ({ id: `${type}-${i}-${t}`, text: t, type }))

    const nameLike = items
      .map((it: any) => String(it.title || it.name || it.orderNumber || it.productName || '').trim())
      .filter(t => t && (!query || t.toLowerCase().includes(query)))

    const vendorLike = items
      .map((it: any) => String(it.vendor || it.owner || it.customerName || '').trim())
      .filter(t => t && (!query || t.toLowerCase().includes(query)))

    const categoryLike = items
      .map((it: any) => String(it.category || it.board || it.type || '').trim())
      .filter(t => t && (!query || t.toLowerCase().includes(query)))

    const tagsLike = items
      .flatMap((it: any) => Array.isArray(it.tags) ? it.tags : [])
      .map((t: any) => String(t).trim())
      .filter(t => t && (!query || t.toLowerCase().includes(query)))

    const next: SharedSearchSuggestion[] = [
      ...make(nameLike, 'product'),
      ...make(vendorLike, 'vendor'),
      ...make(categoryLike, 'category'),
      ...make(tagsLike, 'tag')
    ]

    // Append recent history if no query
    const hist = !query ? searchHistory.slice(0, 4) : []
    const nextCombined = [...next.slice(0, 20), ...hist]

    // Build a stable signature to avoid redundant state updates
    const signature = `${query}|${items.length}|${searchHistory.length}|${nextCombined.length}`
    const shouldShow = Boolean(query) || hist.length > 0

    // Only update if suggestions content length or show flag meaningfully changed
    if (signature !== prevSigRef.current) {
      prevSigRef.current = signature
      setSuggestions(nextCombined)
    }
    if (shouldShow !== prevShowRef.current) {
      prevShowRef.current = shouldShow
      setShowSuggestions(shouldShow)
    }
  }, [searchQuery, currentItems, searchHistory])

  const handleSuggestionSelect = (suggestion: SharedSearchSuggestion) => {
    setSearchQuery(suggestion.text)
    pushHistory(suggestion.text, currentItems.length)
    setShowSuggestions(false)
    searchInputRef.current?.focus()
  }

  const handleSearchSubmit = (query: string) => {
    if (query.trim()) {
      pushHistory(query, currentItems.length)
    }
    setShowSuggestions(false)
  }

  const allSelected = currentItems.length > 0 && selectedItems.length === currentItems.length
  const someSelected = selectedItems.length > 0 && selectedItems.length < currentItems.length

  return (
    <div ref={containerRef} className="px-4 py-3 border-b border-gray-200 bg-white">
      {/* Main Search Bar */}
      <div className="flex items-center space-x-3 mb-3">
        <div className="flex-1 relative">
          <GoogleStyleSearch
            value={searchQuery}
            onChange={setSearchQuery}
            onSearch={handleSearchSubmit}
            suggestions={suggestions}
            showSuggestions={showSuggestions}
            onSuggestionClick={handleSuggestionSelect}
            onClearHistory={clearHistory}
            placeholder={`Search ${itemTypeName}... (e.g., Love)`}
            isLoading={isAlgoliaSearching}
          />
        </div>
        
        <button
          onClick={() => setShowSearchBuilder(!showSearchBuilder)}
          className={cn(
            "px-3 py-2 text-sm font-medium rounded-md border transition-colors",
            showSearchBuilder
              ? "bg-blue-50 border-blue-200 text-blue-700"
              : "bg-white border-gray-300 text-gray-700 hover:bg-gray-50"
          )}
        >
          <Filter className="h-4 w-4 mr-1.5" />
          Advanced
        </button>

        {showViewToggle && (
          <div className="flex items-center bg-gray-100 rounded-md p-1">
            <button
              onClick={() => setViewMode('table')}
              className={cn(
                "p-1.5 rounded transition-colors",
                viewMode === 'table' ? "bg-white shadow-sm" : "hover:bg-gray-200"
              )}
              title="Table view"
            >
              <List className="h-4 w-4" />
            </button>
            <button
              onClick={() => setViewMode('grid')}
              className={cn(
                "p-1.5 rounded transition-colors",
                viewMode === 'grid' ? "bg-white shadow-sm" : "hover:bg-gray-200"
              )}
              title="Grid view"
            >
              <Grid className="h-4 w-4" />
            </button>
          </div>
        )}

        {showFullScreenToggle && (
          <button
            onClick={onToggleFullScreen}
            className="p-2 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-md transition-colors"
            title={isFullScreen ? "Exit fullscreen" : "Enter fullscreen"}
          >
            {isFullScreen ? <Minimize2 className="h-4 w-4" /> : <Maximize2 className="h-4 w-4" />}
          </button>
        )}
      </div>

      {/* Action Buttons Row */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-2">
          {/* Selection Info */}
          <span className="text-sm text-gray-600">
            {selectedItems.length}/{currentItems.length} selected
          </span>
          
          {/* Bulk Actions */}
          {selectedItems.length > 0 && (
            <div className="flex items-center space-x-2">
              <button
                onClick={onBulkEdit}
                className="inline-flex items-center px-3 py-1.5 text-sm font-medium text-blue-700 bg-blue-50 border border-blue-200 rounded-md hover:bg-blue-100 transition-colors"
              >
                <Edit className="h-4 w-4 mr-1" />
                Bulk Edit
              </button>
              <button
                onClick={onExportSelected}
                className="inline-flex items-center px-3 py-1.5 text-sm font-medium text-green-700 bg-green-50 border border-green-200 rounded-md hover:bg-green-100 transition-colors"
              >
                <Download className="h-4 w-4 mr-1" />
                Export
              </button>
              <button
                onClick={onBulkDelete}
                className="inline-flex items-center px-3 py-1.5 text-sm font-medium text-red-700 bg-red-50 border border-red-200 rounded-md hover:bg-red-100 transition-colors"
              >
                <Trash2 className="h-4 w-4 mr-1" />
                Delete
              </button>
            </div>
          )}
        </div>

        <div className="flex items-center space-x-2">
          {/* Import Button */}
          <button
            onClick={onImport}
            className="inline-flex items-center px-3 py-1.5 text-sm font-medium text-blue-700 bg-white border border-blue-200 rounded-md hover:bg-blue-50 transition-colors"
          >
            <Upload className="h-4 w-4 mr-1" />
            Import
          </button>

          {/* Print Button */}
          <button
            onClick={onPrint}
            className="inline-flex items-center px-3 py-1.5 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 transition-colors"
          >
            <Printer className="h-4 w-4 mr-1" />
            Print
          </button>

          {/* Export Button */}
          {showExport && (
            <button
              onClick={onExport}
              className="inline-flex items-center px-3 py-1.5 text-sm font-medium text-green-700 bg-white border border-green-200 rounded-md hover:bg-green-50 transition-colors"
            >
              <Download className="h-4 w-4 mr-1" />
              Export
            </button>
          )}

          {/* More Actions Dropdown */}
          {showMoreActions && (
            <div className="relative">
              <button
                onClick={() => setShowHeaderDropdown(!showHeaderDropdown)}
                className="inline-flex items-center px-3 py-1.5 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 transition-colors"
                data-dropdown-trigger="more-actions"
              >
                <MoreHorizontal className="h-4 w-4 mr-1" />
                More actions
                <ChevronDown className="h-4 w-4 ml-1" />
              </button>

              {showHeaderDropdown && (
                <div className="absolute right-0 mt-2 w-48 bg-white border border-gray-200 rounded-md shadow-lg z-50 header-dropdown">
                  <div className="py-1">
                    <button
                      onClick={() => {
                        setShowAdvancedFilter(!showAdvancedFilter)
                        setShowHeaderDropdown(false)
                      }}
                      className="flex items-center w-full px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                    >
                      <Filter className="h-4 w-4 mr-3" />
                      Advanced Filters
                    </button>
                    <button
                      onClick={() => {
                        onSettings()
                        setShowHeaderDropdown(false)
                      }}
                      className="flex items-center w-full px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                    >
                      <Settings className="h-4 w-4 mr-3" />
                      Settings
                    </button>
                    <button
                      onClick={handleResetAll}
                      className="flex items-center w-full px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                    >
                      <X className="h-4 w-4 mr-3" />
                      Reset All Filters
                    </button>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Settings Button */}
          <button
            onClick={onSettings}
            className="inline-flex items-center px-3 py-1.5 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 transition-colors"
          >
            <Settings className="h-4 w-4 mr-1" />
            Settings
          </button>
        </div>
      </div>

      {/* Advanced Search Builder */}
      {showSearchBuilder && (
        <div className="mt-3 pt-3 border-t border-gray-200">
          <AdvancedSearchBuilder
            searchConditions={searchConditions}
            onClearConditions={() => onClearSearchConditions()}
            onClose={() => setShowSearchBuilder(false)}
          />
        </div>
      )}

      {/* Advanced Filters Panel */}
      {showAdvancedFilter && (
        <div className="mt-3 pt-3 border-t border-gray-200">
          <FilterPanel
            activeFilter={activeFilter}
            setActiveFilter={setActiveFilter}
            customFilters={customFilters}
            onAddCustomFilter={onAddCustomFilter}
            onRemoveCustomFilter={onRemoveCustomFilter}
            hiddenDefaultFilters={hiddenDefaultFilters}
            onShowAllFilters={onShowAllFilters}
            getUniqueValues={getUniqueValues}
            columnFilters={columnFilters}
            onColumnFilterChange={onColumnFilterChange}
            onClose={() => setShowAdvancedFilter(false)}
          />
        </div>
      )}
    </div>
  )
}