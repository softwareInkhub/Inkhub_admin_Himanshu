'use client'

import { useEffect, useState, useRef } from 'react'
import { useAppStore } from '@/lib/store'
import { 
  PageTemplate,
  useDataTable
} from '@/components/shared'
import PinsGridCardFilterHeader from './components/PinsGridCardFilterHeader'
import ExportModal from './components/ExportModal'
import { Pin } from './types'
import { getPinsForPage, getTotalChunks } from './services/pinService'

// Define table columns for pins
const pinColumns = [
  {
    key: 'pin',
    label: 'PIN',
    sortable: true,
    width: 'w-48',
    render: (value: any, pin: Pin) => (
      <div className="flex items-center space-x-3">
        <div className="w-12 h-12 rounded-md overflow-hidden bg-gray-100 flex-shrink-0">
          {pin.image ? (
            <img 
              src={String(pin.image)} 
              alt={String(pin.title || 'Pin')}
              className="w-full h-full object-cover"
              onError={(e) => {
                (e.target as HTMLImageElement).style.display = 'none'
              }}
            />
          ) : (
            <div className="w-full h-full bg-gray-200 flex items-center justify-center">
              <span className="text-xs text-gray-500">No image</span>
            </div>
          )}
        </div>
        <div className="flex-1 min-w-0 max-w-32">
          <div className="text-sm font-medium text-gray-900 truncate" title={String(pin.title || 'Untitled Pin')}>
            {String(pin.title || 'Untitled Pin').length > 20 
              ? `${String(pin.title || 'Untitled Pin').substring(0, 20)}...` 
              : String(pin.title || 'Untitled Pin')}
          </div>
        </div>
      </div>
    )
  },
  {
    key: 'status',
    label: 'STATUS',
    sortable: true,
    render: (value: any, pin: Pin) => {
      const getStatusBadge = (status: string) => {
        switch (status) {
          case 'active':
            return { className: "inline-flex px-2 py-1 text-xs font-medium rounded-full bg-green-100 text-green-800", text: "Active" }
          case 'archived':
            return { className: "inline-flex px-2 py-1 text-xs font-medium rounded-full bg-gray-100 text-gray-800", text: "Archived" }
          default:
            return { className: "inline-flex px-2 py-1 text-xs font-medium rounded-full bg-gray-100 text-gray-800", text: status }
        }
      }
      const badge = getStatusBadge(String(pin.status || 'active'))
      return <span className={badge.className}>{badge.text}</span>
    }
  },
  {
    key: 'type',
    label: 'TYPE',
    sortable: true,
    render: (value: any, pin: Pin) => {
      const getTypeBadge = (type: string) => {
        switch (type) {
          case 'image':
            return { className: "inline-flex px-2 py-1 text-xs font-medium rounded-full bg-blue-100 text-blue-800", text: "Image" }
          case 'video':
            return { className: "inline-flex px-2 py-1 text-xs font-medium rounded-full bg-purple-100 text-purple-800", text: "Video" }
          case 'article':
            return { className: "inline-flex px-2 py-1 text-xs font-medium rounded-full bg-green-100 text-green-800", text: "Article" }
          default:
            return { className: "inline-flex px-2 py-1 text-xs font-medium rounded-full bg-gray-100 text-gray-800", text: type }
        }
      }
      const badge = getTypeBadge(String(pin.type || 'image'))
      return <span className={badge.className}>{badge.text}</span>
    }
  },
  {
    key: 'board',
    label: 'BOARD',
    sortable: true,
    render: (value: any, pin: Pin) => (
      <div className="text-sm text-gray-900">{String(pin.board || 'No Board')}</div>
    )
  },
  {
    key: 'owner',
    label: 'OWNER',
    sortable: true,
    render: (value: any, pin: Pin) => (
      <div className="text-sm text-gray-900">{String(pin.owner || 'Unknown')}</div>
    )
  },
  {
    key: 'likes',
    label: 'LIKES',
    sortable: true,
    render: (value: any, pin: Pin) => (
      <span className="text-sm text-gray-900">{(pin.likes || 0).toLocaleString()}</span>
    )
  },
  {
    key: 'comments',
    label: 'COMMENTS',
    sortable: true,
    render: (value: any, pin: Pin) => (
      <span className="text-sm text-gray-900">{(pin.comments || 0).toLocaleString()}</span>
    )
  },
  {
    key: 'repins',
    label: 'REPINS',
    sortable: true,
    render: (value: any, pin: Pin) => (
      <span className="text-sm text-gray-900">{(pin.repins || 0).toLocaleString()}</span>
    )
  },
  {
    key: 'createdAt',
    label: 'CREATED',
    sortable: true,
    render: (value: any, pin: Pin) => (
      <span className="text-sm text-gray-500">
        {pin.createdAt ? new Date(pin.createdAt).toLocaleDateString('en-US', {
          month: 'short',
          day: 'numeric',
          year: 'numeric'
        }) : 'No date'}
      </span>
    )
  },
  {
    key: 'updatedAt',
    label: 'UPDATED',
    sortable: true,
    render: (value: any, pin: Pin) => (
      <span className="text-sm text-gray-500">
        {pin.updatedAt ? new Date(pin.updatedAt).toLocaleDateString('en-US', {
          month: 'short',
          day: 'numeric',
          year: 'numeric'
        }) : 'No date'}
      </span>
    )
  },
  {
    key: 'tags',
    label: 'TAGS',
    sortable: false,
    render: (value: any, pin: Pin) => {
      const tags = Array.isArray(pin.tags) ? pin.tags : []
      return (
        <div className="flex flex-wrap gap-1">
          {tags.length > 0 ? (
            tags.slice(0, 2).map((tag, index) => (
              <span
                key={index}
                className="inline-flex px-2 py-1 text-xs font-medium rounded-full bg-gray-100 text-gray-800"
              >
                {String(tag)}
              </span>
            ))
          ) : (
            <span className="text-xs text-gray-500">No tags</span>
          )}
          {tags.length > 2 && (
            <span className="inline-flex px-2 py-1 text-xs font-medium rounded-full bg-gray-100 text-gray-800">
              +{tags.length - 2}
            </span>
          )}
        </div>
      )
    }
  }
]

// Define KPI metrics for pins
const pinKPIs = [
  {
    key: 'totalPins',
    label: 'Total Pins',
    value: 0,
    change: 12,
    trend: 'up' as const,
    icon: '📌',
    color: 'blue'
  },
  {
    key: 'totalLikes',
    label: 'Total Likes',
    value: 0,
    change: 8,
    trend: 'up' as const,
    icon: '❤️',
    color: 'red'
  },
  {
    key: 'totalComments',
    label: 'Total Comments',
    value: 0,
    change: 15,
    trend: 'up' as const,
    icon: '💬',
    color: 'green'
  },
  {
    key: 'totalRepins',
    label: 'Total Repins',
    value: 0,
    change: 22,
    trend: 'up' as const,
    icon: '🔄',
    color: 'purple'
  },
  {
    key: 'avgEngagement',
    label: 'Avg Engagement',
    value: 0,
    change: 5,
    trend: 'up' as const,
    icon: '📊',
    color: 'orange'
  },
  {
    key: 'activeBoards',
    label: 'Active Boards',
    value: 0,
    change: 3,
    trend: 'up' as const,
    icon: '📋',
    color: 'indigo'
  }
]

// Define filter options for pins
const pinFilters = [
  { key: 'all', label: 'All' },
  { key: 'image', label: 'Images' },
  { key: 'video', label: 'Videos' },
  { key: 'article', label: 'Articles' },
  { key: 'trending', label: 'Trending' },
  { key: 'popular', label: 'Popular' },
  { key: 'recent', label: 'Recent' }
]

function PinsClient() {
  const { addTab } = useAppStore()
  const hasAddedTab = useRef(false)
  const [loadingPins, setLoadingPins] = useState(false)
  const [pinsError, setPinsError] = useState<string | null>(null)
  const [allPins, setAllPins] = useState<Pin[]>([])
  const [isInitialLoad, setIsInitialLoad] = useState(true)
  const [showExportModal, setShowExportModal] = useState(false)

  // Initialize data table hook
  const {
    data: pinData,
    loading,
    error,
    searchQuery,
    setSearchQuery,
    searchConditions,
    setSearchConditions,
    selectedItems,
    setSelectedItems,
    viewMode,
    setViewMode,
    currentPage,
    setCurrentPage,
    itemsPerPage,
    setItemsPerPage,
    sortColumn,
    setSortColumn,
    sortDirection,
    setSortDirection,
    columnFilters,
    setColumnFilters,
    customFilters,
    setCustomFilters,
    advancedFilters,
    setAdvancedFilters,
    filteredData,
    totalPages,
    currentData,
    handleSelectItem,
    handleSelectAll,
    handlePageChange,
    handleItemsPerPageChange,
    handleSort,
    handleSearch,
    handleAdvancedSearch,
    handleColumnFilter,
    handleCustomFilter,
    handleAdvancedFilter,
    clearAllFilters,
    clearSearch,
    clearColumnFilters,
    clearCustomFilters,
    clearAdvancedFilters,
    setData
  } = useDataTable<Pin>({
    initialData: [],
    columns: pinColumns,
    searchableFields: [
      { key: 'title', label: 'Title', type: 'text' },
      { key: 'description', label: 'Description', type: 'text' },
      { key: 'board', label: 'Board', type: 'text' },
      { key: 'owner', label: 'Owner', type: 'text' },
      { key: 'tags', label: 'Tags', type: 'text' },
      { key: 'type', label: 'Type', type: 'text' }
    ],
    filterOptions: pinFilters,
    defaultViewMode: 'table',
    defaultItemsPerPage: 500
  })

  // Load all pins once on initial load
  useEffect(() => {
    if (!isInitialLoad) return
    
    let cancelled = false
    const loadAllPins = async () => {
      setLoadingPins(true)
      setPinsError(null)
      try {
        const totalChunks = await getTotalChunks()
        const allPinsData: Pin[] = []
        
        // Load all chunks to get complete real data only
        console.log(`📌 Loading ${totalChunks} chunks of real Pinterest pins from server...`)
        
        for (let i = 0; i < totalChunks; i++) {
          try {
            const { pins } = await getPinsForPage(i + 1)
            if (pins && pins.length > 0) {
              // Validate that we have real Pinterest data
              const validPins = pins.filter(pin => 
                pin.id && 
                pin.id.length > 5 && // Real Pinterest IDs are long
                !pin.id.startsWith('pin-') // Avoid any generated IDs
              )
              allPinsData.push(...validPins)
              console.log(`✅ Loaded ${validPins.length} real pins from chunk ${i + 1}`)
            }
          } catch (e) {
            console.warn(`❌ Failed to load chunk ${i + 1}:`, e)
          }
        }
        
        if (!cancelled) {
          if (allPinsData.length > 0) {
            console.log(`🎉 Successfully loaded ${allPinsData.length} real Pinterest pins from server`)
            setAllPins(allPinsData)
          } else {
            console.warn('⚠️ No real Pinterest pins found in server data')
            setPinsError('No real Pinterest pins available from server')
          }
          setIsInitialLoad(false)
        }
      } catch (e: any) {
        if (!cancelled) setPinsError(e?.message || 'Failed to load pins')
      } finally {
        if (!cancelled) setLoadingPins(false)
      }
    }
    
    loadAllPins()
    return () => { cancelled = true }
  }, [isInitialLoad])

  // Update data table when all pins are loaded or page changes
  useEffect(() => {
    if (allPins.length > 0) {
      setData(allPins as any)
    }
  }, [allPins, setData])

  // Calculate KPI metrics based on filtered data
  const calculatedKPIs = pinKPIs.map(kpi => {
    switch (kpi.key) {
      case 'totalPins':
        return { ...kpi, value: filteredData.length }
      case 'totalLikes':
        return { ...kpi, value: filteredData.reduce((sum, pin) => sum + (pin.likes || 0), 0) }
      case 'totalComments':
        return { ...kpi, value: filteredData.reduce((sum, pin) => sum + (pin.comments || 0), 0) }
      case 'totalRepins':
        return { ...kpi, value: filteredData.reduce((sum, pin) => sum + (pin.repins || 0), 0) }
      case 'avgEngagement':
        const totalEngagement = filteredData.reduce((sum, pin) => sum + (pin.likes || 0) + (pin.comments || 0) + (pin.repins || 0), 0)
        return { ...kpi, value: filteredData.length > 0 ? Math.round(totalEngagement / filteredData.length) : 0 }
      case 'activeBoards':
        const uniqueBoards = new Set(filteredData.map(pin => pin.board || 'Unknown'))
        return { ...kpi, value: uniqueBoards.size }
      default:
        return kpi
    }
  })

  // API Integration Functions for Enhanced Modal
  const handlePinEdit = async (id: string, data: any) => {
    try {
      // Example API call for updating a pin
      const response = await fetch(`/api/pins/${id}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(data)
      })
      
      if (!response.ok) {
        throw new Error('Failed to update pin')
      }
      
      // Update local data
      const updatedPin = await response.json()
      const updatedPins = pinData.map(pin => 
        pin.id === id ? { ...pin, ...updatedPin } : pin
      )
      // setPinData(updatedPins) // This line was removed from the original file, so it's removed here.
      
      console.log('Pin updated successfully:', updatedPin)
    } catch (error) {
      console.error('Error updating pin:', error)
      throw error
    }
  }

  const handlePinDelete = async (id: string) => {
    try {
      // Example API call for deleting a pin
      const response = await fetch(`/api/pins/${id}`, {
        method: 'DELETE',
      })
      
      if (!response.ok) {
        throw new Error('Failed to delete pin')
      }
      
      // Remove from local data
      const updatedPins = pinData.filter(pin => pin.id !== id)
      // setPinData(updatedPins) // This line was removed from the original file, so it's removed here.
      
      console.log('Pin deleted successfully')
    } catch (error) {
      console.error('Error deleting pin:', error)
      throw error
    }
  }

  const handlePinSave = async (id: string, data: any) => {
    try {
      // Example API call for saving pin changes
      const response = await fetch(`/api/pins/${id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(data)
      })
      
      if (!response.ok) {
        throw new Error('Failed to save pin')
      }
      
      // Update local data
      const savedPin = await response.json()
      const updatedPins = pinData.map(pin => 
        pin.id === id ? { ...pin, ...savedPin } : pin
      )
      // setPinData(updatedPins) // This line was removed from the original file, so it's removed here.
      
      console.log('Pin saved successfully:', savedPin)
    } catch (error) {
      console.error('Error saving pin:', error)
      throw error
    }
  }

  // Tab management
  useEffect(() => {
    if (!hasAddedTab.current) {
      addTab({
        title: 'Pinterest Pins',
        path: '/apps/pinterest/pins',
        pinned: false,
        closable: true,
      })
      hasAddedTab.current = true
    }
  }, [addTab])

  // Page configuration
  const pageConfig = {
    title: 'Pinterest Pins',
    description: `Manage and analyze your Pinterest pins (${allPins.length} real pins from server)`,
    icon: '📌',
    endpoint: '/api/pins',
    columns: pinColumns,
    kpis: calculatedKPIs,
    filters: pinFilters,
    searchableFields: [
      { key: 'title', label: 'Title', type: 'text' },
      { key: 'description', label: 'Description', type: 'text' },
      { key: 'board', label: 'Board', type: 'text' },
      { key: 'owner', label: 'Owner', type: 'text' },
      { key: 'tags', label: 'Tags', type: 'text' },
      { key: 'type', label: 'Type', type: 'text' }
    ],
    actions: {
      create: () => console.log('Create pin'),
      export: () => setShowExportModal(true),
      import: () => console.log('Import pins'),
      print: () => console.log('Print pins'),
      settings: () => console.log('Pin settings')
    }
  }

  if ((loading || loadingPins) && pinData.length === 0) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-gray-500">Loading pins...</div>
      </div>
    )
  }

  if (error || pinsError) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="text-red-600 text-lg font-semibold mb-2">Error Loading Real Pinterest Pins</div>
          <div className="text-gray-600 mb-4">{error || pinsError}</div>
          <div className="text-sm text-gray-500 mb-4">
            Only real Pinterest data from server is displayed. No sample data is used.
          </div>
          <button 
            onClick={() => window.location.reload()}
            className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700"
          >
            Retry Loading Real Data
          </button>
        </div>
      </div>
    )
  }

  return (
    <>
      <PageTemplate
        config={pageConfig}
        data={currentData}
        loading={loading || loadingPins}
        error={error || pinsError}
        GridHeaderComponent={PinsGridCardFilterHeader}
        CardHeaderComponent={PinsGridCardFilterHeader}
          searchQuery={searchQuery}
          setSearchQuery={setSearchQuery}
          searchConditions={searchConditions}
        setSearchConditions={setSearchConditions}
        selectedItems={selectedItems}
        setSelectedItems={setSelectedItems}
          viewMode={viewMode}
          setViewMode={setViewMode}
        currentPage={currentPage}
        setCurrentPage={setCurrentPage}
        itemsPerPage={itemsPerPage}
        setItemsPerPage={setItemsPerPage}
        sortColumn={sortColumn}
        setSortColumn={setSortColumn}
        sortDirection={sortDirection}
        setSortDirection={setSortDirection}
        columnFilters={columnFilters}
        setColumnFilters={setColumnFilters}
          customFilters={customFilters}
        setCustomFilters={setCustomFilters}
        advancedFilters={advancedFilters}
        setAdvancedFilters={setAdvancedFilters}
        totalPages={totalPages}
        handleSelectItem={handleSelectItem}
        handleSelectAll={handleSelectAll}
        handlePageChange={handlePageChange}
        handleItemsPerPageChange={handleItemsPerPageChange}
        handleSort={handleSort}
        handleSearch={handleSearch}
        handleAdvancedSearch={handleAdvancedSearch}
        handleColumnFilter={handleColumnFilter}
        handleCustomFilter={handleCustomFilter}
        handleAdvancedFilter={handleAdvancedFilter}
        clearAllFilters={clearAllFilters}
        clearSearch={clearSearch}
        clearColumnFilters={clearColumnFilters}
        clearCustomFilters={clearCustomFilters}
        clearAdvancedFilters={clearAdvancedFilters}
      />

      {/* Export Modal */}
      <ExportModal
        isOpen={showExportModal}
        onClose={() => setShowExportModal(false)}
        pins={filteredData}
        selectedPins={selectedItems}
      />
    </>
  )
}

export default function PinterestPinsPage() {
  return (
    <div className="h-full">
      <PinsClient />
    </div>
  )
}
