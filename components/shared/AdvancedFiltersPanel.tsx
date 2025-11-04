'use client'

import { X } from 'lucide-react'
import { cn } from '@/lib/utils'

interface AdvancedFiltersPanelProps {
  isOpen: boolean
  onClose: () => void
  filters: {
    status?: string[]
    priceRange?: { min: string; max: string }
    dateRange?: { start: string; end: string }
    tags?: string[]
    vendors?: string[]
    type?: string[]        // For Pins (image, video, article)
    privacy?: string[]     // For Boards (public, private, secret)
    category?: string[]    // For any entity with categories
  }
  onFiltersChange: (filters: any) => void
  onClearAll: () => void
  // Data for generating filter options
  availableTags?: string[]
  availableVendors?: string[]
  availableStatuses?: string[]
  availableTypes?: string[]      // For Pins
  availablePrivacy?: string[]    // For Boards
  availableCategories?: string[] // For any entity
  // Labels customization
  statusLabel?: string
  vendorsLabel?: string
  // Loading state
  isFiltering?: boolean
}

export default function AdvancedFiltersPanel({
  isOpen,
  onClose,
  filters,
  onFiltersChange,
  onClearAll,
  availableTags = [],
  availableVendors = [],
  availableStatuses = ['active', 'draft', 'archived'],
  availableTypes = [],
  availablePrivacy = [],
  availableCategories = [],
  statusLabel = 'Product Status',
  vendorsLabel = 'Vendors',
  isFiltering = false
}: AdvancedFiltersPanelProps) {
  if (!isOpen) return null

  const activeFilterCount = [
    filters.status?.length || 0,
    filters.tags?.length || 0,
    filters.vendors?.length || 0,
    filters.type?.length || 0,
    filters.privacy?.length || 0,
    filters.category?.length || 0,
    filters.priceRange?.min ? 1 : 0,
    filters.priceRange?.max ? 1 : 0,
    filters.dateRange?.start ? 1 : 0,
    filters.dateRange?.end ? 1 : 0
  ].reduce((a, b) => a + b, 0)

  const updateFilters = (key: string, value: any) => {
    onFiltersChange({ ...filters, [key]: value })
  }

  // Calculate number of visible filter sections
  const visibleFilterCount = [
    true, // Status (always visible)
    true, // Price Range (always visible)
    true, // Date Range (always visible)
    availableTags.length > 0, // Tags (if data available)
    availableVendors.length > 0, // Vendors (if data available)
    availableTypes.length > 0, // Type (for Pins)
    availablePrivacy.length > 0, // Privacy (for Boards)
    availableCategories.length > 0 // Categories
  ].filter(Boolean).length

  // Dynamic grid columns based on visible filters (max 7 columns)
  const gridCols = Math.min(visibleFilterCount, 7)
  const gridClass = `grid grid-cols-1 md:grid-cols-2 lg:grid-cols-${Math.min(gridCols, 5)} gap-3`

  return (
    <div className="px-4 pb-1">
      <div className="bg-white border border-gray-200 rounded-lg shadow-sm p-3">
        {/* Header */}
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center space-x-3">
            <div className="w-3 h-3 bg-gradient-to-r from-blue-500 to-indigo-500 rounded-full animate-pulse"></div>
            <div className="flex items-center space-x-2">
              <h3 className="text-base font-semibold text-gray-900">Advanced Filters</h3>
              {isFiltering ? (
                <span className="text-xs text-blue-600 bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-200 px-3 py-1 rounded-full font-medium flex items-center space-x-1">
                  <div className="w-3 h-3 border-2 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
                  <span>Searching...</span>
                </span>
              ) : (
                <span className="text-xs text-gray-500 bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-200 px-3 py-1 rounded-full font-medium">
                  {activeFilterCount} active
                </span>
              )}
            </div>
            
            {/* Active Filter Tags */}
            {activeFilterCount > 0 && (
              <div className="flex flex-wrap gap-1.5">
                {filters.status?.map(status => (
                  <span key={status} className="inline-flex items-center space-x-1 px-2 py-0.5 bg-gradient-to-r from-blue-100 to-blue-200 text-blue-800 text-xs rounded-full border border-blue-300 shadow-sm">
                    <span className="capitalize font-medium">{status}</span>
                    <button
                      onClick={() => updateFilters('status', filters.status?.filter(s => s !== status))}
                      className="ml-0.5 hover:bg-blue-300 rounded-full p-0.5 transition-colors"
                    >
                      <X className="w-2.5 h-2.5" />
                    </button>
                  </span>
                ))}
                {filters.tags?.map(tag => (
                  <span key={tag} className="inline-flex items-center space-x-1 px-2 py-0.5 bg-gradient-to-r from-orange-100 to-orange-200 text-orange-800 text-xs rounded-full border border-orange-300 shadow-sm">
                    <span className="font-medium">{tag}</span>
                    <button
                      onClick={() => updateFilters('tags', filters.tags?.filter(t => t !== tag))}
                      className="ml-0.5 hover:bg-orange-300 rounded-full p-0.5 transition-colors"
                    >
                      <X className="w-2.5 h-2.5" />
                    </button>
                  </span>
                ))}
                {filters.vendors?.map(vendor => (
                  <span key={vendor} className="inline-flex items-center space-x-1 px-2 py-0.5 bg-gradient-to-r from-indigo-100 to-indigo-200 text-indigo-800 text-xs rounded-full border border-indigo-300 shadow-sm">
                    <span className="font-medium">{vendor}</span>
                    <button
                      onClick={() => updateFilters('vendors', filters.vendors?.filter(v => v !== vendor))}
                      className="ml-0.5 hover:bg-indigo-300 rounded-full p-0.5 transition-colors"
                    >
                      <X className="w-2.5 h-2.5" />
                    </button>
                  </span>
                ))}
                {filters.priceRange?.min && (
                  <span className="inline-flex items-center space-x-1 px-2 py-0.5 bg-gradient-to-r from-green-100 to-green-200 text-green-800 text-xs rounded-full border border-green-300 shadow-sm">
                    <span className="font-medium">Min: ₹{filters.priceRange.min}</span>
                    <button
                      onClick={() => updateFilters('priceRange', { ...filters.priceRange, min: '' })}
                      className="ml-0.5 hover:bg-green-300 rounded-full p-0.5 transition-colors"
                    >
                      <X className="w-2.5 h-2.5" />
                    </button>
                  </span>
                )}
                {filters.priceRange?.max && (
                  <span className="inline-flex items-center space-x-1 px-2 py-0.5 bg-gradient-to-r from-green-100 to-green-200 text-green-800 text-xs rounded-full border border-green-300 shadow-sm">
                    <span className="font-medium">Max: ₹{filters.priceRange.max}</span>
                    <button
                      onClick={() => updateFilters('priceRange', { ...filters.priceRange, max: '' })}
                      className="ml-0.5 hover:bg-green-300 rounded-full p-0.5 transition-colors"
                    >
                      <X className="w-2.5 h-2.5" />
                    </button>
                  </span>
                )}
              </div>
            )}
          </div>
          
          <div className="flex items-center space-x-2">
            <button
              onClick={onClearAll}
              className="text-xs text-gray-600 hover:text-gray-800 hover:bg-gray-100 px-2 py-1 rounded-md transition-all duration-200 flex items-center space-x-1.5 border border-gray-200 hover:border-gray-300"
            >
              <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
              </svg>
              <span>Clear all</span>
            </button>
            <button
              onClick={onClose}
              className="text-xs text-gray-600 hover:text-gray-800 hover:bg-gray-100 px-2 py-1 rounded-md transition-all duration-200 flex items-center space-x-1.5 border border-gray-200 hover:border-gray-300"
            >
              <X className="w-3 h-3" />
              <span>Close</span>
            </button>
          </div>
        </div>
        
        {/* Filter Grid - Dynamic columns based on visible filters */}
        <div className={cn(
          "grid gap-3",
          gridCols <= 3 ? "grid-cols-1 md:grid-cols-2 lg:grid-cols-3" :
          gridCols === 4 ? "grid-cols-1 md:grid-cols-2 lg:grid-cols-4" :
          "grid-cols-1 md:grid-cols-2 lg:grid-cols-5"
        )}>
          {/* Status Filter */}
          <div className="bg-gradient-to-br from-blue-50 to-indigo-50 border border-blue-200 rounded-lg p-1.5 space-y-1">
            <label className="text-xs font-semibold text-gray-800 flex items-center space-x-2">
              <div className="w-5 h-5 bg-blue-500 rounded-lg flex items-center justify-center">
                <svg className="w-3.5 h-3.5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <span>{statusLabel}</span>
            </label>
            <div className="space-y-0.5">
              {availableStatuses.map(status => (
                <label key={status} className="flex items-center space-x-2 cursor-pointer group p-0.5 rounded-md hover:bg-white/50 transition-colors">
                  <input
                    type="checkbox"
                    checked={filters.status?.includes(status) || false}
                    onChange={(e) => {
                      const currentStatus = filters.status || []
                      if (e.target.checked) {
                        updateFilters('status', [...currentStatus, status])
                      } else {
                        updateFilters('status', currentStatus.filter(s => s !== status))
                      }
                    }}
                    className="rounded border-gray-300 text-blue-600 focus:ring-blue-500 w-4 h-4"
                  />
                  <span className="text-xs text-gray-700 group-hover:text-gray-900 capitalize font-medium">{status}</span>
                </label>
              ))}
            </div>
          </div>

          {/* Price Range Filter */}
          <div className="bg-gradient-to-br from-green-50 to-emerald-50 border border-green-200 rounded-lg p-1.5 space-y-1">
            <label className="text-xs font-semibold text-gray-800 flex items-center space-x-2">
              <div className="w-5 h-5 bg-green-500 rounded-lg flex items-center justify-center">
                <svg className="w-4.5 h-4.5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1" />
                </svg>
              </div>
              <span>Price Range</span>
            </label>
            <div className="space-y-1.5">
              <div className="relative">
                <input
                  type="number"
                  placeholder="Min price"
                  value={filters.priceRange?.min || ''}
                  onChange={(e) => updateFilters('priceRange', { 
                    ...filters.priceRange, 
                    min: e.target.value 
                  })}
                  className="w-full text-xs border border-green-200 rounded-md px-2 py-1.5 focus:ring-2 focus:ring-green-500 focus:border-transparent pl-8 bg-white/70 hover:bg-white transition-colors"
                />
                <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-green-600 text-sm font-medium">₹</span>
              </div>
              <div className="relative">
                <input
                  type="number"
                  placeholder="Max price"
                  value={filters.priceRange?.max || ''}
                  onChange={(e) => updateFilters('priceRange', { 
                    ...filters.priceRange, 
                    max: e.target.value 
                  })}
                  className="w-full text-xs border border-green-200 rounded-md px-2 py-1.5 focus:ring-2 focus:ring-green-500 focus:border-transparent pl-8 bg-white/70 hover:bg-white transition-colors"
                />
                <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-green-600 text-sm font-medium">₹</span>
              </div>
            </div>
          </div>

          {/* Date Range Filter */}
          <div className="bg-gradient-to-br from-purple-50 to-violet-50 border border-purple-200 rounded-lg p-1.5 space-y-1">
            <label className="text-xs font-semibold text-gray-800 flex items-center space-x-2">
              <div className="w-5 h-5 bg-purple-500 rounded-lg flex items-center justify-center">
                <svg className="w-3.5 h-3.5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                </svg>
              </div>
              <span>Date Range</span>
            </label>
            <div className="space-y-1.5">
              <div className="relative">
                <input
                  type="date"
                  value={filters.dateRange?.start || ''}
                  onChange={(e) => updateFilters('dateRange', { 
                    ...filters.dateRange, 
                    start: e.target.value 
                  })}
                  className="w-full text-xs border border-purple-200 rounded-md px-2 py-1.5 focus:ring-2 focus:ring-purple-500 focus:border-transparent bg-white/70 hover:bg-white transition-colors"
                />
              </div>
              <div className="relative">
                <input
                  type="date"
                  value={filters.dateRange?.end || ''}
                  onChange={(e) => updateFilters('dateRange', { 
                    ...filters.dateRange, 
                    end: e.target.value 
                  })}
                  className="w-full text-xs border border-purple-200 rounded-md px-2 py-1.5 focus:ring-2 focus:ring-purple-500 focus:border-transparent bg-white/70 hover:bg-white transition-colors"
                />
              </div>
            </div>
          </div>

          {/* Tags Filter - Only show if tags are available */}
          {availableTags.length > 0 && (
            <div className="bg-gradient-to-br from-orange-50 to-amber-50 border border-orange-200 rounded-lg p-1.5 space-y-1">
              <label className="text-xs font-semibold text-gray-800 flex items-center space-x-2">
                <div className="w-5 h-5 bg-orange-500 rounded-lg flex items-center justify-center">
                  <svg className="w-3.5 h-3.5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z" />
                  </svg>
                </div>
                <span>Tags</span>
              </label>
              <div className="h-28 overflow-y-auto border border-orange-200 rounded-md p-1.5 space-y-0.5 bg-white/50">
                {availableTags.map(tag => (
                  <label key={tag} className="flex items-center space-x-2 cursor-pointer group p-1 rounded-md hover:bg-orange-100/50 transition-colors">
                    <input
                      type="checkbox"
                      checked={filters.tags?.includes(tag) || false}
                      onChange={(e) => {
                        const currentTags = filters.tags || []
                        if (e.target.checked) {
                          updateFilters('tags', [...currentTags, tag])
                        } else {
                          updateFilters('tags', currentTags.filter(t => t !== tag))
                        }
                      }}
                      className="rounded border-orange-300 text-orange-600 focus:ring-orange-500 w-4 h-4"
                    />
                    <span className="text-sm text-gray-700 group-hover:text-gray-900 font-medium">{tag}</span>
                  </label>
                ))}
              </div>
            </div>
          )}

          {/* Vendors Filter - Only show if vendors are available */}
          {availableVendors.length > 0 && (
            <div className="bg-gradient-to-br from-indigo-50 to-blue-50 border border-indigo-200 rounded-lg p-1.5 space-y-1">
              <label className="text-xs font-semibold text-gray-800 flex items-center space-x-2">
                <div className="w-5 h-5 bg-indigo-500 rounded-lg flex items-center justify-center">
                  <svg className="w-3.5 h-3.5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                  </svg>
                </div>
                <span>{vendorsLabel}</span>
              </label>
              <div className="h-28 overflow-y-auto border border-indigo-200 rounded-md p-1.5 space-y-0.5 bg-white/50">
                {availableVendors.map(vendor => (
                  <label key={vendor} className="flex items-center space-x-2 cursor-pointer group p-1 rounded-md hover:bg-indigo-100/50 transition-colors">
                    <input
                      type="checkbox"
                      checked={filters.vendors?.includes(vendor) || false}
                      onChange={(e) => {
                        const currentVendors = filters.vendors || []
                        if (e.target.checked) {
                          updateFilters('vendors', [...currentVendors, vendor])
                        } else {
                          updateFilters('vendors', currentVendors.filter(v => v !== vendor))
                        }
                      }}
                      className="rounded border-indigo-300 text-indigo-600 focus:ring-indigo-500 w-4 h-4"
                    />
                    <span className="text-sm text-gray-700 group-hover:text-gray-900 font-medium">{vendor}</span>
                  </label>
                ))}
              </div>
            </div>
          )}

          {/* Type Filter (For Pins) - Only show if availableTypes has data */}
          {availableTypes.length > 0 && (
            <div className="bg-gradient-to-br from-cyan-50 to-sky-50 border border-cyan-200 rounded-lg p-1.5 space-y-1">
              <label className="text-xs font-semibold text-gray-800 flex items-center space-x-2">
                <div className="w-5 h-5 bg-cyan-500 rounded-lg flex items-center justify-center">
                  <svg className="w-3.5 h-3.5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                  </svg>
                </div>
                <span>Type</span>
              </label>
              <div className="space-y-0.5">
                {availableTypes.map(type => (
                  <label key={type} className="flex items-center space-x-2 cursor-pointer group p-0.5 rounded-md hover:bg-white/50 transition-colors">
                    <input
                      type="checkbox"
                      checked={filters.type?.includes(type) || false}
                      onChange={(e) => {
                        const currentType = filters.type || []
                        if (e.target.checked) {
                          updateFilters('type', [...currentType, type])
                        } else {
                          updateFilters('type', currentType.filter(t => t !== type))
                        }
                      }}
                      className="rounded border-gray-300 text-cyan-600 focus:ring-cyan-500 w-4 h-4"
                    />
                    <span className="text-xs text-gray-700 group-hover:text-gray-900 capitalize font-medium">{type}</span>
                  </label>
                ))}
              </div>
            </div>
          )}

          {/* Privacy Filter (For Boards) - Only show if availablePrivacy has data */}
          {availablePrivacy.length > 0 && (
            <div className="bg-gradient-to-br from-pink-50 to-rose-50 border border-pink-200 rounded-lg p-1.5 space-y-1">
              <label className="text-xs font-semibold text-gray-800 flex items-center space-x-2">
                <div className="w-5 h-5 bg-pink-500 rounded-lg flex items-center justify-center">
                  <svg className="w-3.5 h-3.5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                  </svg>
                </div>
                <span>Privacy</span>
              </label>
              <div className="space-y-0.5">
                {availablePrivacy.map(privacy => (
                  <label key={privacy} className="flex items-center space-x-2 cursor-pointer group p-0.5 rounded-md hover:bg-white/50 transition-colors">
                    <input
                      type="checkbox"
                      checked={filters.privacy?.includes(privacy) || false}
                      onChange={(e) => {
                        const currentPrivacy = filters.privacy || []
                        if (e.target.checked) {
                          updateFilters('privacy', [...currentPrivacy, privacy])
                        } else {
                          updateFilters('privacy', currentPrivacy.filter(p => p !== privacy))
                        }
                      }}
                      className="rounded border-gray-300 text-pink-600 focus:ring-pink-500 w-4 h-4"
                    />
                    <span className="text-xs text-gray-700 group-hover:text-gray-900 capitalize font-medium">{privacy}</span>
                  </label>
                ))}
              </div>
            </div>
          )}

          {/* Category Filter - Only show if availableCategories has data */}
          {availableCategories.length > 0 && (
            <div className="bg-gradient-to-br from-teal-50 to-emerald-50 border border-teal-200 rounded-lg p-1.5 space-y-1">
              <label className="text-xs font-semibold text-gray-800 flex items-center space-x-2">
                <div className="w-5 h-5 bg-teal-500 rounded-lg flex items-center justify-center">
                  <svg className="w-3.5 h-3.5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 21a4 4 0 01-4-4V5a2 2 0 012-2h4a2 2 0 012 2v12a4 4 0 01-4 4zm0 0h12a2 2 0 002-2v-4a2 2 0 00-2-2h-2.343M11 7.343l1.657-1.657a2 2 0 012.828 0l2.829 2.829a2 2 0 010 2.828l-8.486 8.485M7 17h.01" />
                  </svg>
                </div>
                <span>Category</span>
              </label>
              <div className="h-28 overflow-y-auto border border-teal-200 rounded-md p-1.5 space-y-0.5 bg-white/50">
                {availableCategories.map(category => (
                  <label key={category} className="flex items-center space-x-2 cursor-pointer group p-1 rounded-md hover:bg-teal-100/50 transition-colors">
                    <input
                      type="checkbox"
                      checked={filters.category?.includes(category) || false}
                      onChange={(e) => {
                        const currentCategory = filters.category || []
                        if (e.target.checked) {
                          updateFilters('category', [...currentCategory, category])
                        } else {
                          updateFilters('category', currentCategory.filter(c => c !== category))
                        }
                      }}
                      className="rounded border-teal-300 text-teal-600 focus:ring-teal-500 w-4 h-4"
                    />
                    <span className="text-sm text-gray-700 group-hover:text-gray-900 font-medium">{category}</span>
                  </label>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

