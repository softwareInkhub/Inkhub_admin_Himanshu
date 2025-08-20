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
  Plus,
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
  showCustomFilterDropdown,
  setShowCustomFilterDropdown,
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
  viewMode,
  setViewMode,
  showAdvancedFilter,
  setShowAdvancedFilter,
  isFullScreen,
  onToggleFullScreen,
  isAlgoliaSearching,
  useAlgoliaSearch
}: SearchControlsProps) {
  // Search toggle state
  const [showSearch, setShowSearch] = useState(false)
  const searchInputRef = useRef<HTMLInputElement>(null)
  const containerRef = useRef<HTMLDivElement>(null)
  const [searchHistory, setSearchHistory] = useState<SharedSearchSuggestion[]>([])
  const [suggestions, setSuggestions] = useState<SharedSearchSuggestion[]>([])
  const [showSuggestions, setShowSuggestions] = useState(false)

  const handleClearSearch = () => {
    setSearchQuery('')
    onClearSearch()
    searchInputRef.current?.focus()
  }

  const handleResetAll = () => {
    setActiveFilter('all')
    setShowCustomFilterDropdown(false)
    setShowHeaderDropdown(false)
    setShowAdvancedFilter(false)
    setShowSearch(false)
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
    setSuggestions([...next.slice(0, 20), ...hist])
    setShowSuggestions(Boolean(query) || hist.length > 0)
  }, [searchQuery, currentItems, searchHistory])

  const handleSearch = (q: string) => {
    const count = Array.isArray(currentItems) ? currentItems.length : 0
    pushHistory(q, count)
    setShowSuggestions(false)
  }

  // Build generic custom filter options (mirrors Products)
  const getCustomFilterOptions = () => {
    const options: Array<{ key: string; label: string; field: string; operator: string; value: string }> = []

    const columnMappings = [
      { field: 'title', label: 'Item Name', operators: ['contains', 'equals', 'starts_with', 'ends_with'], sampleValues: getUniqueValues('title').slice(0, 5) },
      { field: 'status', label: 'Status', operators: ['equals'], sampleValues: ['active', 'draft', 'archived', 'approved', 'completed', 'partial'] },
      { field: 'inventoryQuantity', label: 'Inventory', operators: ['greater_than', 'less_than', 'equals'], sampleValues: ['0', '10', '50', '100'] },
      { field: 'price', label: 'Price', operators: ['greater_than', 'less_than', 'equals'], sampleValues: ['100', '500', '1000', '2000'] },
      { field: 'type', label: 'Type', operators: ['contains', 'equals'], sampleValues: getUniqueValues('type').slice(0, 5) },
      { field: 'productType', label: 'Product Type', operators: ['contains', 'equals'], sampleValues: getUniqueValues('productType').slice(0, 5) },
      { field: 'vendor', label: 'Vendor', operators: ['contains', 'equals'], sampleValues: getUniqueValues('vendor').slice(0, 5) },
      { field: 'owner', label: 'Owner', operators: ['contains', 'equals'], sampleValues: getUniqueValues('owner').slice(0, 5) },
      { field: 'category', label: 'Category', operators: ['contains', 'equals'], sampleValues: getUniqueValues('category').slice(0, 5) },
      { field: 'board', label: 'Board', operators: ['contains', 'equals'], sampleValues: getUniqueValues('board').slice(0, 5) },
      { field: 'tags', label: 'Tags', operators: ['contains'], sampleValues: getUniqueValues('tags').slice(0, 5) },
      { field: 'createdAt', label: 'Created Date', operators: ['last_7_days', 'last_30_days', 'last_90_days'], sampleValues: ['last_7_days', 'last_30_days', 'last_90_days'] },
      { field: 'updatedAt', label: 'Updated Date', operators: ['last_7_days', 'last_30_days', 'last_90_days'], sampleValues: ['last_7_days', 'last_30_days', 'last_90_days'] }
    ]

    columnMappings.forEach((column) => {
      column.operators.forEach((operator) => {
        column.sampleValues.forEach((value, idx) => {
          const key = `${column.field}-${operator}-${idx}`
          const label = `${column.label} ${operator.replace('_', ' ')} ${value}`
          options.push({ key, label, field: column.field, operator, value: String(value) })
        })
      })
    })

    const predefined = [
      { key: 'high-value', label: 'High-value items', field: 'price', operator: 'greater_than', value: '1000' },
      { key: 'low-stock', label: 'Low stock items', field: 'inventoryQuantity', operator: 'less_than', value: '10' },
      { key: 'recent', label: 'Recently added', field: 'createdAt', operator: 'last_7_days', value: '' },
      { key: 'featured', label: 'Featured items', field: 'tags', operator: 'contains', value: 'featured' },
      { key: 'on-sale', label: 'On sale items', field: 'compareAtPrice', operator: 'not_null', value: '' },
      { key: 'active-items', label: 'Active items', field: 'status', operator: 'equals', value: 'active' },
      { key: 'draft-items', label: 'Draft items', field: 'status', operator: 'equals', value: 'draft' },
      { key: 'archived-items', label: 'Archived items', field: 'status', operator: 'equals', value: 'archived' }
    ]

    return [...predefined, ...options.slice(0, 20)]
  }

  // Close dropdowns on outside click or Escape
  useEffect(() => {
    const handleDocumentClick = (e: MouseEvent) => {
      const target = e.target as HTMLElement
      if (!containerRef.current?.contains(target)) {
        if (showHeaderDropdown) setShowHeaderDropdown(false)
        if (showCustomFilterDropdown) setShowCustomFilterDropdown(false)
      }
    }
    const handleEsc = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        if (showHeaderDropdown) setShowHeaderDropdown(false)
        if (showCustomFilterDropdown) setShowCustomFilterDropdown(false)
      }
    }
    document.addEventListener('mousedown', handleDocumentClick)
    document.addEventListener('keydown', handleEsc)
    return () => {
      document.removeEventListener('mousedown', handleDocumentClick)
      document.removeEventListener('keydown', handleEsc)
    }
  }, [showHeaderDropdown, showCustomFilterDropdown, setShowHeaderDropdown, setShowCustomFilterDropdown])

  return (
    <div ref={containerRef} className="px-3 py-0.5 border-b-0 bg-white shadow-sm relative z-30">
      {/* Main Search Bar Layout - Single Horizontal Row */}
      <div className="flex items-center justify-between space-x-2">
        
        {/* LEFT SECTION: All, Add Filter, and Search Bar */}
        <div className="flex items-center space-x-2">
          {/* All Items Filter */}
          <button
            onClick={handleResetAll}
            className={cn(
              'px-3 py-2 text-sm font-medium rounded-md transition-all duration-200 border shadow-sm hover:shadow-md h-10',
              activeFilter === 'all'
                ? 'bg-gradient-to-r from-blue-500 to-blue-600 text-white border-blue-500 shadow-md hover:shadow-lg transform hover:scale-105'
                : 'text-gray-700 hover:text-gray-900 hover:bg-gradient-to-r hover:from-gray-50 hover:to-gray-100 bg-white border-gray-300 hover:border-gray-400'
            )}
          >
            All
          </button>
          
          {/* Custom Filters */}
          {customFilters.map((customFilter) => (
            <button
              key={customFilter.id}
              onClick={() => {
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
                    setActiveFilter('all')
                  }
                }}
                className="ml-1 hover:text-red-500 cursor-pointer flex-shrink-0"
              >
                <X className="h-3 w-3" />
              </span>
            </button>
          ))}

          {/* Search Bar - Toggle Functionality */}
          <div className="relative">
            {!showSearch ? (
              /* Search Button - When Search is Hidden */
        <button
                onClick={() => {
                  setShowSearch(true)
                  setTimeout(() => searchInputRef.current?.focus(), 0)
                }}
                className="px-3 py-2 border border-gray-300 rounded-md transition-all duration-200 text-sm bg-white shadow-sm hover:shadow-md transform hover:scale-105 h-10 text-gray-700 hover:text-blue-700 hover:bg-gradient-to-r hover:from-blue-50 hover:to-blue-100 hover:border-blue-400"
                title="Search items"
              >
                <Search className="h-4 w-4" />
        </button>
            ) : (
              /* Search Input - When Search is Visible */
              <div className="flex items-center animate-fade-in max-w-2xl">
                <div className="relative flex items-center">
                  <GoogleStyleSearch
                    value={searchQuery}
                    onChange={setSearchQuery}
                    onSearch={handleSearch}
                    placeholder={searchConditions.length > 0 ? "Advanced search active..." : "Search items... (e.g., Love)"}
          className={cn(
                      "transition-all duration-200",
                      searchQuery.length > 60 ? "w-[400px]" :
                      searchQuery.length > 50 ? "w-[380px]" :
                      searchQuery.length > 40 ? "w-[360px]" : 
                      searchQuery.length > 30 ? "w-[340px]" : 
                      searchQuery.length > 20 ? "w-[320px]" : 
                      searchQuery.length > 10 ? "w-[300px]" : "w-[320px]"
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

                  {/* Add Custom Filter Button - Auto-adjustable positioning */}
          <button
                    onClick={() => setShowCustomFilterDropdown(!showCustomFilterDropdown)}
                    className={cn(
                      "px-3 py-2 text-sm text-blue-600 hover:text-blue-700 border border-blue-300 rounded-md hover:bg-gradient-to-r hover:from-blue-50 hover:to-blue-100 transition-all duration-200 flex items-center space-x-1 bg-white shadow-sm hover:shadow-md transform hover:scale-105 h-10 flex-shrink-0",
                      searchQuery.length > 40 ? "ml-3" : "ml-2"
                    )}
                    title="Add Custom Filter"
                  >
                    <Plus className="h-4 w-4" />
          </button>

                  {/* Custom Filter Dropdown - When search is open */}
                  {showCustomFilterDropdown && showSearch && (
                    <div className="absolute top-full left-0 mt-1 w-64 bg-white border border-gray-200 rounded-md shadow-lg z-30 custom-filter-dropdown">
                      <div className="p-3">
                        <div className="text-sm font-medium text-gray-700 mb-3">Add Custom Filter</div>
                        <div className="max-h-64 overflow-y-auto space-y-1">
                          {getCustomFilterOptions().map((option) => (
                <button
                              key={option.key}
                  onClick={() => {
                                onAddCustomFilter({
                                  id: option.key,
                                  name: option.label,
                                  field: option.field,
                                  operator: option.operator,
                                  value: option.value
                                })
                                setShowCustomFilterDropdown(false)
                              }}
                              className="w-full text-left px-3 py-2 text-sm text-gray-700 hover:bg-gray-100 rounded transition-colors"
                            >
                              {option.label}
                </button>
                          ))}
                        </div>
                      </div>
                    </div>
                  )}
                  
                  {/* Close Button - Auto-adjustable positioning */}
                <button
                  onClick={() => {
                      setShowSearch(false)
                      setSearchQuery('')
                  }}
                  className={cn(
                      "flex h-10 w-10 items-center justify-center rounded-md border border-gray-300 bg-white shadow-sm text-gray-600 hover:bg-gray-50 hover:text-gray-800 transition-all duration-200 hover:shadow-md relative z-20 flex-shrink-0",
                      searchQuery.length > 40 ? "ml-3" : "ml-2"
                  )}
                    title="Close search"
                >
                    <X className="h-5 w-5" />
                </button>
              </div>
            </div>
          )}
          </div>
        </div>

        {/* RIGHT SECTION: Export, More Actions, Filter, View, Full Screen */}
        <div className="flex items-center space-x-2">
          {/* Export Button */}
          <button
            onClick={onExport}
            className="px-3 py-2 text-gray-700 hover:text-green-700 border border-gray-300 rounded-md hover:bg-gradient-to-r hover:from-green-50 hover:to-green-100 transition-all duration-200 hover:shadow-md text-sm group bg-white shadow-sm hover:shadow-lg transform hover:scale-105 hover:border-green-400 h-10"
          >
            <span className="group-hover:scale-105 transition-transform duration-200 flex items-center space-x-1">
              <svg className="h-3 w-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
              <span>Export</span>
            </span>
          </button>

          {/* More Actions Button */}
          <div className="relative">
                <button
              onClick={() => setShowHeaderDropdown(!showHeaderDropdown)}
              className="px-3 py-2 text-gray-700 hover:text-purple-700 border border-gray-300 rounded-md hover:bg-gradient-to-r hover:from-purple-50 hover:to-purple-100 transition-all duration-200 hover:shadow-md flex items-center space-x-1 text-sm group bg-white shadow-sm hover:shadow-lg transform hover:scale-105 hover:border-purple-400 h-10"
            >
              <span className="group-hover:scale-105 transition-transform duration-200 flex items-center space-x-1">
                <svg className="h-3 w-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 5v.01M12 12v.01M12 19v.01M12 6a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2z" />
                </svg>
                <span>More actions</span>
              </span>
              <ChevronDown className={cn(
                "h-3 w-3 group-hover:rotate-180 transition-transform duration-200",
                showHeaderDropdown ? "rotate-180" : ""
              )} />
                </button>
            
            {/* Header Dropdown */}
            {showHeaderDropdown && (
              <div className="absolute top-full right-0 mt-1 w-48 bg-white border border-gray-200 rounded-md shadow-xl z-50 header-dropdown backdrop-blur-sm bg-white/95">
                <div className="p-2">
                  <div className="space-y-1">
                <button
                      onClick={onImport}
                      className="w-full text-left px-3 py-2 text-xs rounded-md transition-all duration-200 text-gray-700 hover:bg-gradient-to-r hover:from-blue-50 hover:to-blue-100 hover:text-blue-700 flex items-center space-x-2"
                    >
                      <svg className="h-3 w-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                      </svg>
                      <span>Import Items</span>
                </button>
                <button
                      onClick={onPrint}
                      className="w-full text-left px-3 py-2 text-xs rounded-md transition-all duration-200 text-gray-700 hover:bg-gradient-to-r hover:from-green-50 hover:to-green-100 hover:text-green-700 flex items-center space-x-2"
                    >
                      <svg className="h-3 w-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z" />
                      </svg>
                      <span>Print Items</span>
                </button>
                <button
                      onClick={onSettings}
                      className="w-full text-left px-3 py-2 text-xs rounded-md transition-all duration-200 text-gray-700 hover:bg-gradient-to-r hover:from-purple-50 hover:to-purple-100 hover:text-purple-700 flex items-center space-x-2"
                    >
                      <svg className="h-3 w-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                      </svg>
                  <span>Settings</span>
                </button>
              </div>
            </div>
              </div>
            )}
          </div>

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
              "px-3 py-2 border border-gray-300 rounded-md transition-all duration-200 text-sm group bg-white shadow-sm hover:shadow-md transform hover:scale-105 h-10",
              "text-gray-700 hover:text-indigo-700 hover:bg-gradient-to-r hover:from-indigo-50 hover:to-indigo-100 hover:border-indigo-400"
            )}
            title={`Switch to ${viewMode === 'table' ? 'Grid' : viewMode === 'grid' ? 'Card' : 'Table'} View`}
          >
            {viewMode === 'table' ? (
              <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h18M3 14h18M3 18h18M3 6h18" />
              </svg>
            ) : viewMode === 'grid' ? (
              <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6z" />
              </svg>
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
          showCustomFilterDropdown={showCustomFilterDropdown}
          setShowCustomFilterDropdown={setShowCustomFilterDropdown}
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
