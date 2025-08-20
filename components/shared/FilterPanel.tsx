'use client'

import React from 'react'
import { CustomFilter } from './types'

interface FilterPanelProps {
  activeFilter: string
  setActiveFilter: (filter: string) => void
  customFilters: CustomFilter[]
  onAddCustomFilter: (filter: CustomFilter) => void
  onRemoveCustomFilter: (id: string) => void
  showCustomFilterDropdown: boolean
  setShowCustomFilterDropdown: (show: boolean) => void
  hiddenDefaultFilters: Set<string>
  onShowAllFilters: () => void
  getUniqueValues: (field: string) => string[]
  columnFilters: Record<string, any>
  onColumnFilterChange: (column: string, value: any) => void
  onClose?: () => void
}

export default function FilterPanel({
  activeFilter,
  setActiveFilter,
  customFilters,
  onAddCustomFilter,
  onRemoveCustomFilter,
  showCustomFilterDropdown,
  setShowCustomFilterDropdown,
  hiddenDefaultFilters,
  onShowAllFilters,
  getUniqueValues,
  columnFilters,
  onColumnFilterChange,
  onClose
}: FilterPanelProps) {
  const activeCount = (
    (Array.isArray(columnFilters.status) ? columnFilters.status.length : 0) +
    (Array.isArray(columnFilters.tags) ? columnFilters.tags.length : 0) +
    (Array.isArray(columnFilters.entity) ? columnFilters.entity.length : 0) +
    (columnFilters.minPrice ? 1 : 0) +
    (columnFilters.maxPrice ? 1 : 0) +
    (columnFilters.startDate ? 1 : 0) +
    (columnFilters.endDate ? 1 : 0)
  )
  return (
    <div className="bg-white border border-gray-200 rounded-lg shadow-sm p-3">
      {/* Header - styled like Products */}
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center space-x-3">
          <div className="w-3 h-3 bg-gradient-to-r from-blue-500 to-indigo-500 rounded-full animate-pulse"></div>
          <div className="flex items-center space-x-2">
            <h3 className="text-base font-semibold text-gray-900">Advanced Filters</h3>
            <span className="text-xs text-gray-500 bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-200 px-3 py-1 rounded-full font-medium">
              {activeCount} active
            </span>
          </div>
          {activeCount > 0 && (
            <div className="flex flex-wrap gap-1.5">
              {(Array.isArray(columnFilters.status) ? columnFilters.status : []).map((status: string) => (
                <span key={status} className="inline-flex items-center space-x-1 px-2 py-0.5 bg-gradient-to-r from-blue-100 to-blue-200 text-blue-800 text-xs rounded-full border border-blue-300 shadow-sm">
                  <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd"/></svg>
                  <span className="capitalize font-medium">{status}</span>
                  <button onClick={() => onColumnFilterChange('status', (columnFilters.status as string[]).filter((s) => s !== status))} className="ml-0.5 hover:bg-blue-300 rounded-full p-0.5">
                    <svg className="w-2.5 h-2.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12"/></svg>
                  </button>
                </span>
              ))}
              {(Array.isArray(columnFilters.tags) ? columnFilters.tags : []).map((tag: string) => (
                <span key={tag} className="inline-flex items-center space-x-1 px-2 py-0.5 bg-gradient-to-r from-orange-100 to-orange-200 text-orange-800 text-xs rounded-full border border-orange-300 shadow-sm">
                  <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd"/></svg>
                  <span className="font-medium">{tag}</span>
                  <button onClick={() => onColumnFilterChange('tags', (columnFilters.tags as string[]).filter((t) => t !== tag))} className="ml-0.5 hover:bg-orange-300 rounded-full p-0.5">
                    <svg className="w-2.5 h-2.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12"/></svg>
                  </button>
                </span>
              ))}
              {(Array.isArray(columnFilters.entity) ? columnFilters.entity : []).map((ent: string) => (
                <span key={ent} className="inline-flex items-center space-x-1 px-2 py-0.5 bg-gradient-to-r from-indigo-100 to-indigo-200 text-indigo-800 text-xs rounded-full border border-indigo-300 shadow-sm">
                  <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd"/></svg>
                  <span className="font-medium">{ent}</span>
                  <button onClick={() => onColumnFilterChange('entity', (columnFilters.entity as string[]).filter((e) => e !== ent))} className="ml-0.5 hover:bg-indigo-300 rounded-full p-0.5">
                    <svg className="w-2.5 h-2.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12"/></svg>
                  </button>
                </span>
              ))}
              {columnFilters.minPrice && (
                <span className="inline-flex items-center space-x-1 px-2 py-0.5 bg-gradient-to-r from-green-100 to-green-200 text-green-800 text-xs rounded-full border border-green-300 shadow-sm">
                  <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd"/></svg>
                  <span className="font-medium">Min: ₹{columnFilters.minPrice}</span>
                  <button onClick={() => onColumnFilterChange('minPrice', '')} className="ml-0.5 hover:bg-green-300 rounded-full p-0.5">
                    <svg className="w-2.5 h-2.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12"/></svg>
                  </button>
                </span>
              )}
              {columnFilters.maxPrice && (
                <span className="inline-flex items-center space-x-1 px-2 py-0.5 bg-gradient-to-r from-green-100 to-green-200 text-green-800 text-xs rounded-full border border-green-300 shadow-sm">
                  <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd"/></svg>
                  <span className="font-medium">Max: ₹{columnFilters.maxPrice}</span>
                  <button onClick={() => onColumnFilterChange('maxPrice', '')} className="ml-0.5 hover:bg-green-300 rounded-full p-0.5">
                    <svg className="w-2.5 h-2.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12"/></svg>
                  </button>
                </span>
              )}
              {columnFilters.startDate && (
                <span className="inline-flex items-center space-x-1 px-2 py-0.5 bg-gradient-to-r from-purple-100 to-purple-200 text-purple-800 text-xs rounded-full border border-purple-300 shadow-sm">
                  <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd"/></svg>
                  <span className="font-medium">From: {columnFilters.startDate}</span>
                  <button onClick={() => onColumnFilterChange('startDate', '')} className="ml-0.5 hover:bg-purple-300 rounded-full p-0.5">
                    <svg className="w-2.5 h-2.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12"/></svg>
                  </button>
                </span>
              )}
              {columnFilters.endDate && (
                <span className="inline-flex items-center space-x-1 px-2 py-0.5 bg-gradient-to-r from-purple-100 to-purple-200 text-purple-800 text-xs rounded-full border border-purple-300 shadow-sm">
                  <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd"/></svg>
                  <span className="font-medium">To: {columnFilters.endDate}</span>
                  <button onClick={() => onColumnFilterChange('endDate', '')} className="ml-0.5 hover:bg-purple-300 rounded-full p-0.5">
                    <svg className="w-2.5 h-2.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12"/></svg>
                  </button>
                </span>
              )}
            </div>
          )}
        </div>
        <div className="flex items-center space-x-2">
          <button
            onClick={() => {
              onColumnFilterChange('status', [])
              onColumnFilterChange('tags', [])
              onColumnFilterChange('entity', [])
              onColumnFilterChange('minPrice', '')
              onColumnFilterChange('maxPrice', '')
              onColumnFilterChange('startDate', '')
              onColumnFilterChange('endDate', '')
            }}
            className="text-xs text-gray-600 hover:text-gray-800 hover:bg-gray-100 px-2 py-1 rounded-md transition-all duration-200 flex items-center space-x-1.5 border border-gray-200 hover:border-gray-300"
          >
            <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"/></svg>
            <span>Clear all</span>
          </button>
          {onClose && (
            <button
              onClick={onClose}
              className="text-xs text-gray-600 hover:text-gray-800 hover:bg-gray-100 px-2 py-1 rounded-md transition-all duration-200 flex items-center space-x-1.5 border border-gray-200 hover:border-gray-300"
            >
              <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12"/></svg>
              <span>Close</span>
            </button>
          )}
        </div>
      </div>
      
      {/* Filter Content */}
      <div className="space-y-3">
        {/* Active Filters Display */}
        {customFilters.length > 0 && (
          <div className="flex flex-wrap gap-1">
            {customFilters.map((filter) => (
              <span key={filter.id} className="inline-flex items-center space-x-1 px-2 py-0.5 bg-purple-100 text-purple-800 text-xs rounded-full">
                <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                </svg>
                <span>{filter.name}</span>
                <button
                  onClick={() => onRemoveCustomFilter(filter.id)}
                  className="ml-1 text-purple-600 hover:text-purple-800"
                >
                  <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </span>
            ))}
          </div>
        )}
        
        {/* Filter blocks */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-3">
          {/* Status */}
          <div className="bg-gradient-to-br from-blue-50 to-indigo-50 border border-blue-200 rounded-lg p-1.5 space-y-1">
            <label className="block text-xs font-semibold text-gray-800 flex items-center space-x-2">
              <div className="w-5 h-5 bg-blue-500 rounded-lg flex items-center justify-center">
                <svg className="w-3.5 h-3.5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"/></svg>
              </div>
              <span>Status</span>
            </label>
            <div className="h-28 overflow-y-auto border border-blue-200 rounded-md p-1.5 space-y-0.5 bg-white/50 text-sm">
              {['active','draft','archived','completed','approved','rejected','in_progress','pending'].map((s) => (
                <label key={s} className="flex items-center space-x-2">
                  <input
                    type="checkbox"
                    checked={Array.isArray(columnFilters.status) ? columnFilters.status.includes(s) : false}
                    onChange={(e) => {
                      const prev = Array.isArray(columnFilters.status) ? columnFilters.status : []
                      const next = e.target.checked ? Array.from(new Set([...prev, s])) : prev.filter((x: string) => x !== s)
                      onColumnFilterChange('status', next)
                    }}
                  />
                  <span className="text-xs text-gray-700 capitalize">{s.replace('_',' ')}</span>
                </label>
              ))}
            </div>
          </div>

          {/* Price Range */}
          <div className="bg-gradient-to-br from-green-50 to-emerald-50 border border-green-200 rounded-lg p-1.5 space-y-1">
            <label className="block text-xs font-semibold text-gray-800 flex items-center space-x-2">
              <div className="w-5 h-5 bg-green-500 rounded-lg flex items-center justify-center">
                <svg className="w-4.5 h-4.5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1"/></svg>
              </div>
              <span>Price Range</span>
            </label>
            <div className="space-y-2">
              <div className="relative">
                <input type="number" placeholder="Min price" value={columnFilters.minPrice || ''} onChange={(e) => onColumnFilterChange('minPrice', e.target.value)} className="w-full text-xs border border-green-200 rounded-md px-2 py-1.5 focus:ring-2 focus:ring-green-500 focus:border-transparent pl-8 bg-white/70 hover:bg-white transition-colors" />
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-green-600 text-sm font-medium">₹</span>
              </div>
              <div className="relative">
                <input type="number" placeholder="Max price" value={columnFilters.maxPrice || ''} onChange={(e) => onColumnFilterChange('maxPrice', e.target.value)} className="w-full text-xs border border-green-200 rounded-md px-2 py-1.5 focus:ring-2 focus:ring-green-500 focus:border-transparent pl-8 bg-white/70 hover:bg-white transition-colors" />
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-green-600 text-sm font-medium">₹</span>
              </div>
            </div>
          </div>

          {/* Date Range */}
          <div className="bg-gradient-to-br from-purple-50 to-violet-50 border border-purple-200 rounded-lg p-1.5 space-y-1">
            <label className="block text-xs font-semibold text-gray-800 flex items-center space-x-2">
              <div className="w-5 h-5 bg-purple-500 rounded-lg flex items-center justify-center">
                <svg className="w-3.5 h-3.5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"/></svg>
              </div>
              <span>Date Range</span>
            </label>
            <div className="space-y-2">
              <input type="date" value={columnFilters.startDate || ''} onChange={(e) => onColumnFilterChange('startDate', e.target.value)} className="w-full text-xs border border-purple-200 rounded-md px-2 py-1.5 focus:ring-2 focus:ring-purple-500 focus:border-transparent bg-white/70 hover:bg-white transition-colors" />
              <input type="date" value={columnFilters.endDate || ''} onChange={(e) => onColumnFilterChange('endDate', e.target.value)} className="w-full text-xs border border-purple-200 rounded-md px-2 py-1.5 focus:ring-2 focus:ring-purple-500 focus:border-transparent bg-white/70 hover:bg-white transition-colors" />
            </div>
          </div>

          {/* Tags */}
          <div className="bg-gradient-to-br from-orange-50 to-amber-50 border border-orange-200 rounded-lg p-1.5 space-y-1">
            <label className="block text-xs font-semibold text-gray-800 flex items-center space-x-2">
              <div className="w-5 h-5 bg-orange-500 rounded-lg flex items-center justify-center">
                <svg className="w-3.5 h-3.5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z"/></svg>
              </div>
              <span>Tags</span>
            </label>
            <div className="h-28 overflow-y-auto border border-orange-200 rounded-md p-1.5 space-y-0.5 bg-white/50 text-sm">
              {getUniqueValues('tags').map((t) => (
                <label key={t} className="flex items-center space-x-2">
                  <input
                    type="checkbox"
                    checked={Array.isArray(columnFilters.tags) ? columnFilters.tags.includes(t) : false}
                    onChange={(e) => {
                      const prev = Array.isArray(columnFilters.tags) ? columnFilters.tags : []
                      const next = e.target.checked ? Array.from(new Set([...prev, t])) : prev.filter((x: string) => x !== t)
                      onColumnFilterChange('tags', next)
                    }}
                  />
                  <span className="text-sm text-gray-700">{t}</span>
                </label>
              ))}
            </div>
          </div>

          {/* Vendors/Owners/Clients dynamic */}
          <div className="bg-gradient-to-br from-indigo-50 to-blue-50 border border-indigo-200 rounded-lg p-1.5 space-y-1">
            <label className="block text-xs font-semibold text-gray-800 flex items-center space-x-2">
              <div className="w-5 h-5 bg-indigo-500 rounded-lg flex items-center justify-center">
                <svg className="w-3.5 h-3.5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4"/></svg>
              </div>
              <span>Vendors</span>
            </label>
            <div className="h-28 overflow-y-auto border border-indigo-200 rounded-md p-1.5 space-y-0.5 bg-white/50 text-sm">
              {getUniqueValues('vendor').concat(getUniqueValues('owner')).concat(getUniqueValues('client')).filter(Boolean).map((v) => (
                <label key={v} className="flex items-center space-x-2">
                  <input
                    type="checkbox"
                    checked={Array.isArray(columnFilters.entity) ? columnFilters.entity.includes(v) : false}
                    onChange={(e) => {
                      const prev = Array.isArray(columnFilters.entity) ? columnFilters.entity : []
                      const next = e.target.checked ? Array.from(new Set([...prev, v])) : prev.filter((x: string) => x !== v)
                      onColumnFilterChange('entity', next)
                    }}
                  />
                  <span className="text-sm text-gray-700">{v}</span>
                </label>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
