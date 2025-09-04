'use client'

import { Search, Filter, X, Plus, ChevronDown, Edit, Trash2, Download } from 'lucide-react'
import { cn } from '@/lib/utils'
import { useEffect, useRef, useState } from 'react'
import { parseAdvancedSearchQuery, getSearchSuggestions, debounce } from '../utils/advancedSearch'
import GoogleStyleSearch from './GoogleStyleSearch'
import { SearchSuggestion, SearchHistory, getSearchSuggestions as getLocalSearchSuggestions, saveSearchToHistory } from '../utils/searchSuggestions'

interface SearchControlsProps {
  searchQuery: string
  setSearchQuery: (query: string) => void
  searchConditions: Array<{
    field: string
    operator: 'contains' | 'equals' | 'starts_with' | 'ends_with'
    value: string
    connector: 'AND' | 'OR'
  }>
  showSearchBuilder: boolean
  setShowSearchBuilder: (show: boolean) => void
  showAdditionalControls: boolean
  setShowAdditionalControls: (show: boolean) => void
  activeFilter: string
  setActiveFilter: (filter: string) => void
  customFilters: Array<{
    id: string
    name: string
    field: string
    operator: string
    value: string
  }>
  onAddCustomFilter: (filter: { name: string; field: string; operator: string; value: string }) => void
  onRemoveCustomFilter: (filterId: string) => void
  showCustomFilterDropdown: boolean
  setShowCustomFilterDropdown: (show: boolean) => void
  hiddenDefaultFilters: Set<string>
  onShowAllFilters: () => void
  onClearSearch: () => void
  onClearSearchConditions: () => void
  selectedOrders: string[]
  onBulkEdit: () => void
  onExportSelected: () => void
  onBulkDelete: () => void
  // Column filter props
  currentOrders: any[]
  onSelectAll: () => void
  activeColumnFilter: string | null
  columnFilters: Record<string, any>
  onFilterClick: (column: string) => void
  onColumnFilterChange: (column: string, value: any) => void
  getUniqueValues: (field: string) => string[]
  // Header action props
  onExport: () => void
  onImport: () => void
  onPrint: () => void
  onSettings: () => void
  showHeaderDropdown: boolean
  setShowHeaderDropdown: (show: boolean) => void
  // View and control props
  viewMode: 'table' | 'grid' | 'card'
  setViewMode: (mode: 'table' | 'grid' | 'card') => void
  showAdvancedFilter: boolean
  setShowAdvancedFilter: (show: boolean) => void
  isFullScreen: boolean
  onToggleFullScreen: () => void
  // Algolia search props
  isAlgoliaSearching?: boolean
  useAlgoliaSearch?: boolean
}

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
  selectedOrders,
  onBulkEdit,
  onExportSelected,
  onBulkDelete,
  // Column filter props
  currentOrders,
  onSelectAll,
  activeColumnFilter,
  columnFilters,
  onFilterClick,
  onColumnFilterChange,
  getUniqueValues,
  // Header action props
  onExport,
  // Algolia search props
  isAlgoliaSearching = false,
  useAlgoliaSearch = false,
  onImport,
  onPrint,
  onSettings,
  showHeaderDropdown,
  setShowHeaderDropdown,
  // View and control props
  viewMode,
  setViewMode,
  showAdvancedFilter,
  setShowAdvancedFilter,
  isFullScreen,
  onToggleFullScreen
}: SearchControlsProps) {
  // Search state
  const [searchHistory, setSearchHistory] = useState<SearchHistory[]>([])
  const [suggestions, setSuggestions] = useState<SearchSuggestion[]>([])
  const [showSuggestions, setShowSuggestions] = useState(false)
  const searchInputRef = useRef<HTMLInputElement>(null)

  // Load search history from localStorage
  useEffect(() => {
    const savedHistory = localStorage.getItem('orders-search-history')
    if (savedHistory) {
      try {
        setSearchHistory(JSON.parse(savedHistory))
      } catch (error) {
        console.error('Failed to load search history:', error)
      }
    }
  }, [])

  // Save search history to localStorage
  useEffect(() => {
    localStorage.setItem('orders-search-history', JSON.stringify(searchHistory))
  }, [searchHistory])

  // Generate suggestions when search query changes
  useEffect(() => {
    const newSuggestions = getLocalSearchSuggestions(searchQuery, currentOrders, searchHistory)
    setSuggestions(newSuggestions)
    setShowSuggestions(searchQuery.length > 0 || searchHistory.length > 0)
  }, [searchQuery, currentOrders, searchHistory])

  // Handle search - this should trigger the main search logic
  const handleSearch = (query: string) => {
    console.log('🔍 SearchControls handleSearch called with:', query)
    if (query.trim()) {
      // Save to history
      const newHistory = saveSearchToHistory(query, currentOrders.length, searchHistory)
      setSearchHistory(newHistory)
      // Trigger the main search by setting the search query
      setSearchQuery(query)
      // Also trigger the debounced search immediately for better UX
      // The main page will handle the debounced search through useEffect
    } else {
      // Clear search
      setSearchQuery('')
    }
    setShowSuggestions(false)
  }

  // Handle suggestion click
  const handleSuggestionClick = (suggestion: SearchSuggestion) => {
    setSearchQuery(suggestion.text)
    handleSearch(suggestion.text)
  }

  // Handle clear history
  const handleClearHistory = () => {
    setSearchHistory([])
    localStorage.removeItem('orders-search-history')
  }

  const getCustomFilterOptions = () => {
    const options: Array<{
      key: string
      label: string
      field: string
      operator: string
      value: string
    }> = []
    
    // Dynamic options based on table headers and their values
    const columnMappings = [
      { 
        field: 'orderNumber', 
        label: 'Order Number', 
        operators: ['contains', 'equals', 'starts_with', 'ends_with'],
        sampleValues: getUniqueValues('orderNumber').slice(0, 5)
      },
      { 
        field: 'customerName', 
        label: 'Customer Name', 
        operators: ['contains', 'equals', 'starts_with', 'ends_with'],
        sampleValues: getUniqueValues('customerName').slice(0, 5)
      },
      { 
        field: 'status', 
        label: 'Status', 
        operators: ['equals'],
        sampleValues: ['paid', 'pending', 'refunded']
      },
      { 
        field: 'fulfillmentStatus', 
        label: 'Fulfillment', 
        operators: ['equals'],
        sampleValues: ['fulfilled', 'unfulfilled', 'partial']
      },
      { 
        field: 'total', 
        label: 'Total', 
        operators: ['greater_than', 'less_than', 'equals'],
        sampleValues: ['100', '500', '1000', '2000']
      },
      { 
        field: 'tags', 
        label: 'Tags', 
        operators: ['contains'],
        sampleValues: getUniqueValues('tags').slice(0, 5)
      },
      { 
        field: 'createdAt', 
        label: 'Created Date', 
        operators: ['last_7_days', 'last_30_days', 'last_90_days'],
        sampleValues: ['last_7_days', 'last_30_days', 'last_90_days']
      },
      { 
        field: 'updatedAt', 
        label: 'Updated Date', 
        operators: ['last_7_days', 'last_30_days', 'last_90_days'],
        sampleValues: ['last_7_days', 'last_30_days', 'last_90_days']
      }
    ]

    // Generate options for each column
    columnMappings.forEach((column, index) => {
      column.operators.forEach((operator, opIndex) => {
        column.sampleValues.forEach((value, valIndex) => {
          const key = `${column.field}-${operator}-${valIndex}`
          const label = `${column.label} ${operator.replace('_', ' ')} ${value}`
          
          options.push({
            key,
            label,
            field: column.field,
            operator,
            value: value.toString()
          })
        })
      })
    })

    // Add some common predefined filters
    const predefinedFilters = [
      { key: 'high-value', label: 'High-value orders', field: 'total', operator: 'greater_than', value: '1000' },
      { key: 'recent', label: 'Recent orders', field: 'createdAt', operator: 'last_7_days', value: '' },
      { key: 'pending', label: 'Pending orders', field: 'status', operator: 'equals', value: 'pending' },
      { key: 'fulfilled', label: 'Fulfilled orders', field: 'fulfillmentStatus', operator: 'equals', value: 'fulfilled' },
      { key: 'unfulfilled', label: 'Unfulfilled orders', field: 'fulfillmentStatus', operator: 'equals', value: 'unfulfilled' },
      { key: 'paid', label: 'Paid orders', field: 'status', operator: 'equals', value: 'paid' },
      { key: 'refunded', label: 'Refunded orders', field: 'status', operator: 'equals', value: 'refunded' }
    ]

    return [...predefinedFilters, ...options.slice(0, 20)] // Limit to first 20 dynamic options + predefined
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
                     placeholder={searchConditions.length > 0 ? "Advanced search active..." : "Search orders... (e.g., #1001)"}
                     className={cn(
                       "transition-all duration-200",
                       searchQuery.length > 60 ? "w-[600px]" :
                       searchQuery.length > 50 ? "w-[580px]" :
                       searchQuery.length > 40 ? "w-[560px]" : 
                       searchQuery.length > 30 ? "w-[540px]" : 
                       searchQuery.length > 20 ? "w-[520px]" : 
                       searchQuery.length > 10 ? "w-[500px]" : "w-[480px]",
                       // Add visual indicator when search is active
                       searchQuery && "ring-2 ring-blue-200 border-blue-300"
                     )}
                     suggestions={suggestions}
                     isLoading={isAlgoliaSearching}
                     showSuggestions={showSuggestions && !searchConditions.length}
                     onSuggestionClick={handleSuggestionClick}
                     onClearHistory={handleClearHistory}
                   />
                  
                                     {/* Advanced Search Indicator */}
                   {searchConditions.length > 0 && (
                     <div className="absolute -top-1 -right-1 bg-gradient-to-r from-blue-500 to-blue-600 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center shadow-md animate-pulse z-10">
                       {searchConditions.length}
                     </div>
                   )}
                   

                  
                                     {/* Add Custom Filter Button */}
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
                   
                   {/* Custom Filter Dropdown */}
                   {showCustomFilterDropdown && (
                     <div className="absolute top-full left-0 mt-1 w-64 bg-white border border-gray-200 rounded-md shadow-lg z-30 custom-filter-dropdown">
                       <div className="p-3">
                         <div className="text-sm font-medium text-gray-700 mb-3">Add Custom Filter</div>
                         <div className="max-h-64 overflow-y-auto space-y-1">
                           {getCustomFilterOptions().map((option) => (
                             <button
                               key={option.key}
                               onClick={() => {
                                 onAddCustomFilter({
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
                  
                                     {/* Clear Search Button */}
                   <button
                     onClick={() => {
                       setSearchQuery('')
                       // Clear search state in parent component
                       onClearSearch()
                     }}
                     className={cn(
                       "flex h-10 w-10 items-center justify-center rounded-md border border-gray-300 bg-white shadow-sm text-gray-600 hover:bg-gray-50 hover:text-gray-800 transition-all duration-200 hover:shadow-md relative z-20 flex-shrink-0",
                       searchQuery.length > 40 ? "ml-3" : "ml-2"
                     )}
                     title="Clear search"
                   >
                     <X className="h-5 w-5" />
                   </button>
                </div>
              </div>
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
              <div className="absolute top-full right-0 mt-1 w-48 bg-white border border-gray-200 rounded-md shadow-xl z-20 header-dropdown backdrop-blur-sm bg-white/95">
                <div className="p-2">
                  <div className="space-y-1">
                    <button
                      onClick={onImport}
                      className="w-full text-left px-3 py-2 text-xs rounded-md transition-all duration-200 text-gray-700 hover:bg-gradient-to-r hover:from-blue-50 hover:to-blue-100 hover:text-blue-700 flex items-center space-x-2"
                    >
                      <svg className="h-3 w-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                      </svg>
                      <span>Import Orders</span>
                    </button>
                    <button
                      onClick={onPrint}
                      className="w-full text-left px-3 py-2 text-xs rounded-md transition-all duration-200 text-gray-700 hover:bg-gradient-to-r hover:from-green-50 hover:to-green-100 hover:text-green-700 flex items-center space-x-2"
                    >
                      <svg className="h-3 w-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z" />
                      </svg>
                      <span>Print Orders</span>
                    </button>
                    <button
                      onClick={onSettings}
                      className="w-full text-left px-3 py-2 text-xs rounded-md transition-all duration-200 text-gray-700 hover:bg-gradient-to-r hover:from-purple-50 hover:to-purple-100 hover:text-purple-700 flex items-center space-x-2"
                    >
                      <svg className="h-3 w-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
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
    </div>
  )
}
