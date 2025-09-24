'use client'

import { Search, Filter, Grid, List, X, ChevronDown } from 'lucide-react'
import { cn } from '@/lib/utils'

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
  showAdvancedFilter: boolean
  setShowAdvancedFilter: (show: boolean) => void
  viewMode: 'table' | 'grid' | 'list'
  setViewMode: (mode: 'table' | 'grid' | 'list') => void
  showViewOptions: boolean
  setShowViewOptions: (show: boolean) => void
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
  hiddenDefaultFilters: Set<string>
  onShowAllFilters: () => void
  onClearSearch: () => void
  onClearSearchConditions: () => void
  selectedBoards: string[]
  onBulkEdit: () => void
  onExportSelected: () => void
  onBulkDelete: () => void
}

export default function SearchControls({
  searchQuery,
  setSearchQuery,
  searchConditions,
  showSearchBuilder,
  setShowSearchBuilder,
  showAdvancedFilter,
  setShowAdvancedFilter,
  viewMode,
  setViewMode,
  showViewOptions,
  setShowViewOptions,
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
  selectedBoards,
  onBulkEdit,
  onExportSelected,
  onBulkDelete
}: SearchControlsProps) {
  const getViewModeIcon = () => {
    switch (viewMode) {
      case 'table':
        return <Grid className="h-3 w-3" />
      case 'grid':
        return <Grid className="h-3 w-3" />
      case 'list':
        return <List className="h-3 w-3" />
      default:
        return <Grid className="h-3 w-3" />
    }
  }


  return (
    <div className="px-4 py-3 border-b border-gray-200 bg-white">
      <div className="flex items-center space-x-3">
        {/* Left side - Search and Filters - Extended to take more space */}
        <div className="flex items-center space-x-3 flex-1">
          {/* Search Input */}
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
            <input
              type="text"
              placeholder="Search boards..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-red-500 focus:border-transparent text-sm"
            />
            {searchQuery && (
              <button
                onClick={onClearSearch}
                className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
              >
                <X className="h-4 w-4" />
              </button>
            )}
          </div>

          {/* Filter Tabs */}
          <div className="flex items-center space-x-1">
            <button
              onClick={() => setActiveFilter('public')}
              className={cn(
                "px-3 py-1.5 text-xs font-medium rounded-md transition-colors",
                activeFilter === 'public'
                  ? "bg-blue-100 text-blue-700"
                  : "text-gray-600 hover:text-gray-900 hover:bg-gray-100"
              )}
            >
              Public
            </button>
            <button
              onClick={() => setActiveFilter('private')}
              className={cn(
                "px-3 py-1.5 text-xs font-medium rounded-md transition-colors",
                activeFilter === 'private'
                  ? "bg-orange-100 text-orange-700"
                  : "text-gray-600 hover:text-gray-900 hover:bg-gray-100"
              )}
            >
              Private
            </button>
            <button
              onClick={() => setActiveFilter('starred')}
              className={cn(
                "px-3 py-1.5 text-xs font-medium rounded-md transition-colors",
                activeFilter === 'starred'
                  ? "bg-yellow-100 text-yellow-700"
                  : "text-gray-600 hover:text-gray-900 hover:bg-gray-100"
              )}
            >
              Starred
            </button>
          </div>

          {/* Advanced Search Builder Toggle */}
          <button
            onClick={() => setShowSearchBuilder(!showSearchBuilder)}
            className={cn(
              "px-3 py-1.5 text-xs font-medium rounded-md transition-colors flex items-center space-x-1",
              showSearchBuilder
                ? "bg-blue-100 text-blue-700"
                : "text-gray-600 hover:text-gray-900 hover:bg-gray-100"
            )}
          >
            <Filter className="h-3 w-3" />
            <span>Advanced Search</span>
          </button>

          {/* Advanced Filter Toggle */}
          <button
            onClick={() => setShowAdvancedFilter(!showAdvancedFilter)}
            className={cn(
              "px-3 py-1.5 text-xs font-medium rounded-md transition-colors flex items-center space-x-1",
              showAdvancedFilter
                ? "bg-purple-100 text-purple-700"
                : "text-gray-600 hover:text-gray-900 hover:bg-gray-100"
            )}
          >
            <Filter className="h-3 w-3" />
            <span>Filters</span>
          </button>

        </div>

        {/* Right side - View Controls */}
        <div className="flex items-center space-x-2 flex-shrink-0">
          {/* View Mode Toggle */}
          <div className="relative">
            <button
              onClick={() => setShowViewOptions(!showViewOptions)}
              className="px-3 py-1.5 text-xs font-medium text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-md transition-colors flex items-center space-x-1"
            >
              {getViewModeIcon()}
              <span className="capitalize">{viewMode}</span>
              <ChevronDown className="h-3 w-3" />
            </button>

            {showViewOptions && (
              <div className="absolute top-full right-0 mt-1 w-32 bg-white border border-gray-200 rounded-md shadow-lg z-20 view-options-dropdown">
                <div className="p-1">
                  <button
                    onClick={() => {
                      setViewMode('table')
                      setShowViewOptions(false)
                    }}
                    className="w-full text-left px-2 py-1 text-xs text-gray-700 hover:bg-gray-100 rounded transition-colors"
                  >
                    Table View
                  </button>
                  <button
                    onClick={() => {
                      setViewMode('grid')
                      setShowViewOptions(false)
                    }}
                    className="w-full text-left px-2 py-1 text-xs text-gray-700 hover:bg-gray-100 rounded transition-colors"
                  >
                    Grid View
                  </button>
                  <button
                    onClick={() => {
                      setViewMode('list')
                      setShowViewOptions(false)
                    }}
                    className="w-full text-left px-2 py-1 text-xs text-gray-700 hover:bg-gray-100 rounded transition-colors"
                  >
                    List View
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* Additional Controls */}
          <div className="relative">
            <button
              onClick={() => setShowAdditionalControls(!showAdditionalControls)}
              className="px-3 py-1.5 text-xs font-medium text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-md transition-colors flex items-center space-x-1"
            >
              <span>Actions</span>
              <ChevronDown className="h-3 w-3" />
            </button>

            {showAdditionalControls && (
              <div className="absolute top-full right-0 mt-1 w-48 bg-white border border-gray-200 rounded-md shadow-lg z-20 additional-controls-dropdown">
                <div className="p-2">
                  <div className="space-y-1">
                    <button
                      onClick={onBulkEdit}
                      disabled={selectedBoards.length === 0}
                      className={cn(
                        "w-full text-left px-2 py-1 text-xs rounded transition-colors",
                        selectedBoards.length === 0 ? "text-gray-400 cursor-not-allowed" : "text-gray-700 hover:bg-gray-100"
                      )}
                    >
                      Bulk Edit {selectedBoards.length > 0 && `(${selectedBoards.length})`}
                    </button>
                    <button
                      onClick={onExportSelected}
                      disabled={selectedBoards.length === 0}
                      className={cn(
                        "w-full text-left px-2 py-1 text-xs rounded transition-colors",
                        selectedBoards.length === 0 ? "text-gray-400 cursor-not-allowed" : "text-gray-700 hover:bg-gray-100"
                      )}
                    >
                      Export Selected {selectedBoards.length > 0 && `(${selectedBoards.length})`}
                    </button>
                    <button
                      onClick={onBulkDelete}
                      disabled={selectedBoards.length === 0}
                      className={cn(
                        "w-full text-left px-2 py-1 text-xs rounded transition-colors",
                        selectedBoards.length === 0 ? "text-gray-400 cursor-not-allowed" : "text-red-600 hover:bg-red-50"
                      )}
                    >
                      Delete Selected {selectedBoards.length > 0 && `(${selectedBoards.length})`}
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Active Filters Display */}
      {(customFilters.length > 0 || searchConditions.length > 0) && (
        <div className="mt-3 pt-3 border-t border-gray-200">
          <div className="flex flex-wrap gap-2">
            {customFilters.map((filter) => (
              <span
                key={filter.id}
                className="inline-flex items-center px-2 py-1 bg-blue-100 text-blue-800 text-xs rounded-full"
              >
                {filter.name}
                <button
                  onClick={() => onRemoveCustomFilter(filter.id)}
                  className="ml-1 text-blue-600 hover:text-blue-800"
                >
                  <X className="h-3 w-3" />
                </button>
              </span>
            ))}
            {searchConditions.length > 0 && (
              <span className="inline-flex items-center px-2 py-1 bg-green-100 text-green-800 text-xs rounded-full">
                Advanced Search ({searchConditions.length} conditions)
                <button
                  onClick={onClearSearchConditions}
                  className="ml-1 text-green-600 hover:text-green-800"
                >
                  <X className="h-3 w-3" />
                </button>
              </span>
            )}
          </div>
        </div>
      )}
    </div>
  )
}
