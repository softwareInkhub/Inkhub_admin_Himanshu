'use client'

import React, { useState, useRef, useEffect } from 'react'
import { 
  Search, 
  Filter, 
  Grid, 
  List, 
  Download,
  X,
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
import { SearchControlsProps, ViewMode } from './types'
import AdvancedSearchBuilder from './AdvancedSearchBuilder'
import FilterPanel from './FilterPanel'
import ColumnFilter from './ColumnFilter'
import GoogleStyleSearch, { SharedSearchSuggestion } from './GoogleStyleSearch'

export default function SearchControls({
  searchQuery,
  setSearchQuery,
  searchConditions,
  showSearchBuilder,
  setShowSearchBuilder,
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
  viewMode,
  setViewMode,
  showAdvancedFilter,
  setShowAdvancedFilter,
  isFullScreen,
  onToggleFullScreen,
  isAlgoliaSearching,
  useAlgoliaSearch
}: SearchControlsProps) {
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
      .map((it: any) => String(it.title || it.name || '').trim())
      .filter(t => t && (!query || t.toLowerCase().includes(query)))

    const vendorLike = items
      .map((it: any) => String(it.vendor || it.owner || '').trim())
      .filter(t => t && (!query || t.toLowerCase().includes(query)))

    const categoryLike = items
      .map((it: any) => String(it.category || it.board || '').trim())
      .filter(t => t && (!query || t.toLowerCase().includes(query)))

    const tagsLike = items
      .flatMap((it: any) => Array.isArray(it.tags) ? it.tags : [])
      .map((t: any) => String(t).trim())
      .filter(t => t && (!query || t.toLowerCase().includes(query)))

    const next: SharedSearchSuggestion[] = [
      ...make(nameLike, 'item'),
      ...make(vendorLike, 'vendor'),
      ...make(categoryLike, 'category'),
      ...make(tagsLike, 'tag')
    ]

    // Append recent history if no query
    const hist = !query ? searchHistory.slice(0, 4) : []
    
    // Deduplicate suggestions by text to avoid showing the same item twice
    const allSuggestions = [...next.slice(0, 20), ...hist]
    const seen = new Set<string>()
    const nextCombined = allSuggestions.filter(suggestion => {
      if (seen.has(suggestion.text)) {
        return false
      }
      seen.add(suggestion.text)
      return true
    })

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

  const handleSearch = (q: string) => {
    const count = Array.isArray(currentItems) ? currentItems.length : 0
    pushHistory(q, count)
    setShowSuggestions(false)
  }


  return (
    <div className="px-3 py-0.5 border-b-0 bg-white shadow-sm">
      {/* Main Search Bar Layout - Single Horizontal Row */}
      <div className="flex items-center justify-between space-x-2">
        
        {/* LEFT SECTION: Add Filter and Search Bar */}
        <div className="flex items-center space-x-2">
          
          {/* Custom Filters */}
          {customFilters.map((customFilter) => (
            <button
              key={customFilter.id}
              onClick={() => {
                // Prevent double tabs - only set if not already active
                if (activeFilter !== customFilter.id) {
                  setActiveFilter(customFilter.id)
                }
              }}
              className={cn(
                'px-3 py-2 rounded-md text-sm font-medium transition-all duration-200 flex items-center space-x-1 border shadow-sm hover:shadow-md h-10 max-w-32',
                activeFilter === customFilter.id
                  ? 'bg-gradient-to-r from-blue-500 to-blue-600 text-white border-blue-500 shadow-md hover:shadow-lg transform hover:scale-105'
                  : 'bg-white text-gray-700 hover:bg-gradient-to-r hover:from-gray-50 hover:to-gray-100 hover:text-gray-900 border-gray-300 hover:border-gray-400'
              )}
              title={customFilter.name}
            >
              <span className="truncate">{customFilter.name}</span>
              <span
                onClick={(e) => {
                  e.stopPropagation()
                  onRemoveCustomFilter(customFilter.id)
                  if (activeFilter === customFilter.id) {
                    setActiveFilter('')
                  }
                }}
                className="ml-1 hover:text-red-500 cursor-pointer flex-shrink-0"
              >
                <X className="h-3 w-3" />
              </span>
            </button>
          ))}

          {/* Search Bar - Always Visible */}
          <div className="relative">
            <div className="flex items-center animate-fade-in">
              <div className="relative flex items-center">
                <GoogleStyleSearch
                  value={searchQuery}
                  onChange={setSearchQuery}
                  onSearch={handleSearch}
                  placeholder={searchConditions.length > 0 ? "Advanced search active..." : "Search items... (e.g., Love)"}
                  className={cn(
                    "transition-all duration-200",
                    searchQuery.length > 60 ? "w-[600px]" :
                    searchQuery.length > 50 ? "w-[580px]" :
                    searchQuery.length > 40 ? "w-[560px]" : 
                    searchQuery.length > 30 ? "w-[540px]" : 
                    searchQuery.length > 20 ? "w-[520px]" : 
                    searchQuery.length > 10 ? "w-[500px]" : "w-[480px]"
                  )}
                  suggestions={suggestions}
                  isLoading={isAlgoliaSearching}
                  showSuggestions={showSuggestions && !searchConditions.length}
                  onSuggestionClick={(s) => { setSearchQuery(s.text); handleSearch(s.text) }}
                  onClearHistory={clearHistory}
                />
                
                {/* Advanced Search Indicator */}
                {searchConditions.length > 0 && (
                  <div className="absolute -top-1 -right-1 bg-gradient-to-r from-blue-500 to-blue-600 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center shadow-md animate-pulse z-10">
                    {searchConditions.length}
                  </div>
                )}


                

              </div>
            </div>
          </div>
        </div>

        {/* RIGHT SECTION: Filter, View, Full Screen */}
        <div className="flex items-center space-x-2 flex-shrink-0">

          {/* Advanced Filter Button */}
          <button
            onClick={() => setShowAdvancedFilter(!showAdvancedFilter)}
            className={cn(
              "px-3 py-2 border border-gray-300 rounded-md transition-all duration-200 text-sm bg-white shadow-sm hover:shadow-md transform hover:scale-105 h-10",
              showAdvancedFilter
                ? "bg-gradient-to-r from-orange-50 to-orange-100 border-orange-300 text-orange-600 shadow-md hover:shadow-lg"
                : "text-gray-700 hover:text-orange-700 hover:bg-gradient-to-r hover:from-orange-50 hover:to-orange-100 hover:border-orange-400"
            )}
            title="Advanced Filter"
          >
            <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.207A1 1 0 013 6.5V4z" />
            </svg>
          </button>
          
          {/* View Mode Button */}
          <button
            onClick={() => {
              // Cycle through views: table -> grid -> card -> table
              if (viewMode === 'table') {
                setViewMode('grid')
              } else if (viewMode === 'grid') {
                setViewMode('card')
              } else {
                setViewMode('table')
              }
            }}
            className={cn(
              "px-3 py-2 border border-gray-300 rounded-md transition-all duration-200 text-sm bg-white shadow-sm hover:shadow-md transform hover:scale-105 h-10",
              viewMode === 'grid'
                ? "bg-gradient-to-r from-indigo-50 to-indigo-100 border-indigo-300 text-indigo-600 shadow-md hover:shadow-lg"
                : viewMode === 'card'
                ? "bg-gradient-to-r from-pink-50 to-pink-100 border-pink-300 text-pink-600 shadow-md hover:shadow-lg"
                : "text-gray-700 hover:text-indigo-700 hover:bg-gradient-to-r hover:from-indigo-50 hover:to-indigo-100 hover:border-indigo-400"
            )}
            title={`Switch to ${viewMode === 'table' ? 'grid' : viewMode === 'grid' ? 'card' : 'table'} view`}
          >
            {viewMode === 'table' ? (
              <Grid className="h-4 w-4" />
            ) : viewMode === 'grid' ? (
              <List className="h-4 w-4" />
            ) : (
              <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2H5a2 2 0 00-2-2z" />
              </svg>
            )}
          </button>
          
          {/* Full Screen Button */}
          <button
            onClick={onToggleFullScreen}
            className={cn(
              "px-3 py-2 border border-gray-300 rounded-md transition-all duration-200 text-sm group bg-white shadow-sm hover:shadow-md transform hover:scale-105 h-10",
              isFullScreen
                ? "bg-gradient-to-r from-teal-50 to-teal-100 border-teal-300 text-teal-600 shadow-md hover:shadow-lg"
                : "text-gray-700 hover:text-teal-700 hover:bg-gradient-to-r hover:from-teal-50 hover:to-teal-100 hover:border-teal-400"
            )}
            title={isFullScreen ? "Exit Full Screen" : "Enter Full Screen"}
          >
            {isFullScreen ? (
              <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 3v3a2 2 0 01-2 2H3m18 0h-3a2 2 0 01-2-2V3m0 18v-3a2 2 0 012-2h3M3 16h3a2 2 0 012 2v3" />
              </svg>
            ) : (
              <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 8V4m0 0h4M4 4l5 5m11-1V4m0 0h-4m4 0l-5 5M4 16v4m0 0h4m-4 0l5-5m11 5l-5-5m5 5v-4m0 4h-4" />
              </svg>
            )}
          </button>
        </div>
      </div>

      {/* Additional Controls */}
      {showAdditionalControls && (
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <span className="text-sm text-gray-600">
              {selectedItems.length} of {currentItems.length} selected
            </span>
            <div className="flex items-center space-x-2">
              <button
                onClick={onBulkEdit}
                className="flex items-center space-x-2 px-3 py-1.5 bg-blue-600 text-white text-sm rounded-md hover:bg-blue-700 transition-colors"
              >
                <Edit className="h-4 w-4" />
                <span>Edit</span>
              </button>
              <button
                onClick={onExportSelected}
                className="flex items-center space-x-2 px-3 py-1.5 bg-green-600 text-white text-sm rounded-md hover:bg-green-700 transition-colors"
              >
                <Download className="h-4 w-4" />
                <span>Export</span>
              </button>
              <button
                onClick={onBulkDelete}
                className="flex items-center space-x-2 px-3 py-1.5 bg-red-600 text-white text-sm rounded-md hover:bg-red-700 transition-colors"
              >
                <Trash2 className="h-4 w-4" />
                <span>Delete</span>
              </button>
            </div>
          </div>
          <button
            onClick={() => setShowAdditionalControls(false)}
            className="text-gray-400 hover:text-gray-600"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
      )}

      {/* Advanced Search Builder */}
      {showSearchBuilder && (
        <AdvancedSearchBuilder
          searchConditions={searchConditions}
          onClearConditions={onClearSearchConditions}
          onClose={() => setShowSearchBuilder(false)}
        />
      )}

      {/* Advanced Filter Panel */}
      {showAdvancedFilter && (
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
      )}
    </div>
  )
}
