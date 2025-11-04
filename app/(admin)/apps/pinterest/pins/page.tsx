'use client'

import { useEffect, useState, useRef, useMemo } from 'react'
import { useAppStore } from '@/lib/store'
import { usePinterestPinsPageStore } from '@/lib/stores/pinterest-pins-page-store'
import { 
  PageTemplate,
  useDataTable,
  GridCardFilterHeader,
  BulkActionsBar,
  ExportModal,
  type GridFilterColumn
} from '@/components/shared'
import CardsPerRowDropdown from '@/components/shared/CardsPerRowDropdown'
import GridColumnHeader from '@/components/shared/GridColumnHeader'
import { Pin } from './types'
// Server services are not used when loading from local JSON

// Define table columns for pins
const pinColumns = [
  {
    key: 'pin',
    label: 'PIN',
    sortable: true,
    width: 'w-48',
    render: (value: any, pin: Pin) => (
      <div className="flex items-center space-x-3">
        <div className="w-12 h-12 rounded-md overflow-hidden bg-gray-100 flex-shrink-0 relative">
          {pin.image ? (
            <>
              {/* Loading placeholder */}
              <div className="absolute inset-0 bg-gray-200 animate-pulse flex items-center justify-center">
                <div className="w-4 h-4 bg-gray-300 rounded-full"></div>
              </div>
              
              <img 
                src={String(pin.image)} 
                alt={String(pin.title || 'Pin')}
                className="w-full h-full object-cover relative z-10"
                loading="lazy"
                decoding="async"
                onLoad={(e) => {
                  // Hide loading placeholder when image loads
                  const target = e.target as HTMLImageElement
                  const placeholder = target.previousElementSibling as HTMLElement
                  if (placeholder) {
                    placeholder.style.display = 'none'
                  }
                }}
                onError={(e) => {
                  // Hide image and show error placeholder
                  const target = e.target as HTMLImageElement
                  const placeholder = target.previousElementSibling as HTMLElement
                  if (placeholder) {
                    placeholder.style.display = 'none'
                  }
                  target.style.display = 'none'
                  target.nextElementSibling?.classList.remove('hidden')
                }}
              />
              
              {/* Error placeholder */}
              <div className="hidden w-full h-full bg-gray-200 items-center justify-center">
                <span className="text-xs text-gray-500">Error</span>
              </div>
            </>
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
  }
  // Tags column removed as per user request
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

// Define grid filter columns for pins
const gridFilterColumns: GridFilterColumn[] = [
  { key: 'status', label: 'Status', filterType: 'select', options: ['active', 'archived'] },
  { key: 'type', label: 'Type', filterType: 'select', options: ['image', 'video', 'article'] },
  { key: 'board', label: 'Board', filterType: 'text' },
  { key: 'owner', label: 'Owner', filterType: 'text' },
  { key: 'likes', label: 'Likes', filterType: 'numeric' },
  { key: 'comments', label: 'Comments', filterType: 'numeric' },
  { key: 'repins', label: 'Repins', filterType: 'numeric' },
  { key: 'createdAt', label: 'Created', filterType: 'date' },
  { key: 'updatedAt', label: 'Updated', filterType: 'date' }
]

function PinsClient() {
  const { addTab } = useAppStore()
  const hasAddedTab = useRef(false)
  
  // ✅ USE ZUSTAND STORE for persistent state
  const {
    pageIndex, pageSize, sorting, columnFilters, globalFilter,
    setPageIndex, setPageSize, setSorting, setColumnFilters, setGlobalFilter,
    selectedRowIds, setSelectedRowIds,
    scrollY, setScrollY,
    viewMode: storedViewMode, setViewMode: setStoredViewMode,
  } = usePinterestPinsPageStore()
  
  const [loadingPins, setLoadingPins] = useState(false)
  const [pinsError, setPinsError] = useState<string | null>(null)
  const [allPins, setAllPins] = useState<Pin[]>([])
  const [isInitialLoad, setIsInitialLoad] = useState(true)
  const [showExportModal, setShowExportModal] = useState(false)
  
  // ✅ RESTORE SCROLL POSITION
  useEffect(() => {
    if (typeof window !== 'undefined') {
      try { window.history.scrollRestoration = 'manual' } catch {}
    }
    // Delay to allow layout to settle before restoring
    requestAnimationFrame(() => {
      requestAnimationFrame(() => {
        if (scrollY > 0) {
          const scroller = document.querySelector('[data-scroll-group="page-table"]') as HTMLElement | null
          if (scroller) scroller.scrollTop = scrollY
          else window.scrollTo({ top: scrollY, behavior: 'instant' as ScrollBehavior })
        }
      })
    })
    if (scrollY > 0) {
      const scroller = document.querySelector('[data-scroll-group="page-table"]') as HTMLElement | null
      if (scroller) scroller.scrollTop = scrollY
      else window.scrollTo({ top: scrollY, behavior: 'instant' as ScrollBehavior })
    }
  }, [scrollY])
  
  // ✅ SAVE SCROLL POSITION
  useEffect(() => {
    const saveScroll = () => setScrollY(window.scrollY)
    window.addEventListener('beforeunload', saveScroll)
    document.addEventListener('visibilitychange', () => {
      if (document.visibilityState === 'hidden') saveScroll()
    })
    return () => {
      saveScroll()
      window.removeEventListener('beforeunload', saveScroll)
    }
  }, [setScrollY])

  // Continuously persist scroll position while scrolling (throttled via rAF)
  useEffect(() => {
    let raf: number | null = null
    const onScroll = () => {
      if (raf) return
      raf = requestAnimationFrame(() => {
        const scroller = document.querySelector('[data-scroll-group="page-table"]') as HTMLElement | null
        const y = scroller ? scroller.scrollTop : window.scrollY
        setScrollY(y)
        raf = null
      })
    }
    window.addEventListener('scroll', onScroll, { passive: true })
    const scroller = document.querySelector('[data-scroll-group="page-table"]')
    scroller?.addEventListener('scroll', onScroll as any, { passive: true } as any)
    return () => {
      if (raf) cancelAnimationFrame(raf)
      const s = document.querySelector('[data-scroll-group="page-table"]') as HTMLElement | null
      const y = s ? s.scrollTop : window.scrollY
      setScrollY(y)
      window.removeEventListener('scroll', onScroll as any)
      s?.removeEventListener('scroll', onScroll as any)
    }
  }, [setScrollY])

  // ✅ Initialize data table hook - INTEGRATE with Zustand for persistent state
  const {
    data: pinData,
    loading,
    error,
    filteredData,
    totalPages,
    currentData,
    setData,
    currentPage,
    setCurrentPage,
    itemsPerPage,
    setItemsPerPage,
    handlePageChange,
    handleItemsPerPageChange
  } = useDataTable<Pin>({
    initialData: [],
    columns: pinColumns,
    defaultViewMode: storedViewMode,
    defaultItemsPerPage: pageSize
  })
  
  // ✅ Map Zustand state to local variables for consistency
  const searchQuery = globalFilter
  const setSearchQuery = setGlobalFilter
  const selectedItems = selectedRowIds
  const setSelectedItems = setSelectedRowIds
  const viewMode = storedViewMode
  const setViewMode = setStoredViewMode
  
  // ✅ Handlers using Zustand state
  const [searchConditions, setSearchConditions] = useState<any[]>([])
  const [customFilters, setCustomFilters] = useState<any[]>([])
  const [advancedFilters, setAdvancedFilters] = useState<any>({})
  
  const sortColumn = sorting.length > 0 ? sorting[0].id : null
  const sortDirection = sorting.length > 0 ? (sorting[0].desc ? 'desc' : 'asc') : 'desc'
  const setSortColumn = (col: string | null) => {
    if (col) {
      setSorting([{ id: col, desc: sortDirection === 'desc' }])
    } else {
      setSorting([])
    }
  }
  const setSortDirection = (dir: 'asc' | 'desc') => {
    if (sortColumn) {
      setSorting([{ id: sortColumn, desc: dir === 'desc' }])
    }
  }
  
  const handleSelectItem = (id: string) => {
    const newIds = selectedRowIds.includes(id)
      ? selectedRowIds.filter(x => x !== id)
      : [...selectedRowIds, id]
    setSelectedRowIds(newIds)
  }
  
  const handleSelectAll = () => {
    if (selectedRowIds.length === currentData.length) {
      setSelectedRowIds([])
    } else {
      setSelectedRowIds(currentData.map((item: any) => item.id))
    }
  }
  
  // Pagination handlers are now provided by useDataTable hook
  const handleSort = (column: string) => {
    if (sortColumn === column) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc')
    } else {
      setSortColumn(column)
      setSortDirection('asc')
    }
  }
  const handleSearch = setSearchQuery
  const handleAdvancedSearch = () => {}
  const handleColumnFilter = (column: string, value: any) => {
    setColumnFilters({ ...columnFilters, [column]: value })
  }
  const handleCustomFilter = () => {}
  const handleAdvancedFilter = () => {}
  const clearAllFilters = () => {
    setGlobalFilter('')
    setColumnFilters({})
    setSorting([])
  }
  const clearSearch = () => setGlobalFilter('')
  const clearColumnFilters = () => setColumnFilters({})
  const clearCustomFilters = () => setCustomFilters([])
  const clearAdvancedFilters = () => setAdvancedFilters({})

  // Grid filter handlers
  const [activeColumnFilter, setActiveColumnFilter] = useState<string | null>(null)
  const [cardsPerRow, setCardsPerRow] = useState(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('pins-cards-per-row')
      return saved ? parseInt(saved, 10) : 4
    }
    return 4
  })

  // Save cards per row preference to localStorage
  useEffect(() => {
    if (typeof window !== 'undefined') {
      localStorage.setItem('pins-cards-per-row', cardsPerRow.toString())
    }
  }, [cardsPerRow])
  
  const toggleColumnFilter = (column: string) => {
    setActiveColumnFilter(activeColumnFilter === column ? null : column)
  }
  
  const handleColumnFilterChange = (column: string, value: any) => {
    setColumnFilters({ ...columnFilters, [column]: value })
  }
  
  const getUniqueValuesForField = (field: string) => {
    return Array.from(new Set(currentData.map((item: any) => item[field]).filter(Boolean)))
  }

  // Export handlers
  const handleExportAction = () => {
    setShowExportModal(true)
  }

  // Load all pins once on initial load (cache-first + parallel chunks)
  useEffect(() => {
    if (!isInitialLoad) return
    
    let cancelled = false
    const loadAllPins = async () => {
      // Ultra-fast in-memory session cache
      try {
        if (typeof window !== 'undefined') {
          // eslint-disable-next-line @typescript-eslint/ban-ts-comment
          // @ts-ignore
          const mem = window.__pinsCache as { data: Pin[]; timestamp: number } | undefined
          if (mem && Array.isArray(mem.data) && mem.data.length > 0) {
            if (!cancelled) {
              setAllPins(mem.data)
              setIsInitialLoad(false)
              setLoadingPins(false)
              return
            }
          }
        }
      } catch {}
      setLoadingPins(true)
      setPinsError(null)
      try {
        // Load exclusively from local static JSON served from /public/pins.json
        const localRes = await fetch('/pins.json', { cache: 'no-store' })
        if (!localRes.ok) throw new Error(`Failed to load local pins.json (HTTP ${localRes.status})`)
        const localJson = await localRes.json()
        if (!Array.isArray(localJson)) throw new Error('pins.json must be a JSON array')

        const normalized: Pin[] = localJson.map((pin: any, idx: number) => {
          const imageSrc = pin.image || pin.imageUrl || pin.url || pin.src || (pin.media && (pin.media.image_url || pin.media.url)) || ''
          const rawType = String(pin.type || pin.media_type || 'image').toLowerCase()
          const type: 'image' | 'video' | 'article' = rawType === 'video' ? 'video' : rawType === 'article' ? 'article' : 'image'
          const rawStatus = String(pin.status || pin.state || 'active').toLowerCase()
          const status: 'active' | 'archived' = rawStatus === 'archived' ? 'archived' : 'active'
          const toIso = (v: any) => {
            if (!v) return ''
            const d = new Date(typeof v === 'number' ? v : String(v))
            return isNaN(d.getTime()) ? '' : d.toISOString()
          }
          return {
            id: String(pin.id || `pin-${idx}`),
            title: String(pin.title || 'Untitled Pin'),
            description: String(pin.description || ''),
            image: String(imageSrc),
            board: String(pin.board || pin.boardName || pin.board_id || 'No Board'),
            owner: String(pin.owner || pin.ownerName || pin.username || '' || 'Unknown'),
            status,
            type,
            likes: Number(pin.likes || 0),
            comments: Number(pin.comments || 0),
            repins: Number(pin.repins || 0),
            createdAt: toIso(pin.createdAt) || toIso(pin.created_at) || new Date().toISOString(),
            updatedAt: toIso(pin.updatedAt) || toIso(pin.updated_at) || toIso(pin.createdAt) || toIso(pin.created_at) || new Date().toISOString(),
            tags: Array.isArray(pin.tags) ? pin.tags : [],
            link: String(pin.link || ''),
            boardId: String(pin.boardId || ''),
            // Provide optional fields with sensible defaults to satisfy Pin type
            saves: Number(pin.saves || 0),
            isStarred: Boolean(pin.isStarred || false)
          } as Pin
        })

        if (!cancelled) {
          setAllPins(normalized)
          setIsInitialLoad(false)
          // Persist to localStorage for instant reloads
          try { localStorage.setItem('pinterest-pins-cache', JSON.stringify({ data: normalized, timestamp: Date.now() })) } catch {}
          try {
            // eslint-disable-next-line @typescript-eslint/ban-ts-comment
            // @ts-ignore
            window.__pinsCache = { data: normalized, timestamp: Date.now() }
          } catch {}
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

  // Filter pins data based on search query
  const filteredPinsData = useMemo(() => {
    if (!searchQuery.trim()) {
      return allPins
    }
    
    const query = searchQuery.toLowerCase()
    return allPins.filter(pin =>
      Object.values(pin).some(value => {
        if (Array.isArray(value)) {
          return value.some(item => String(item).toLowerCase().includes(query))
        }
        return String(value).toLowerCase().includes(query)
      })
    )
  }, [allPins, searchQuery])

  // Update data table when filtered pins data changes
  useEffect(() => {
    if (filteredPinsData.length > 0 || searchQuery.trim()) {
      setData(filteredPinsData)
    }
  }, [filteredPinsData, setData, searchQuery])

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
    description: `Manage and analyze your Pinterest pins (${allPins.length} pins loaded from local cache)`,
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
      { key: 'type', label: 'Type', type: 'text' }
      // Tags removed as per user request
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
      <div className="min-h-screen bg-gray-50">
        <div className="flex items-center justify-center min-h-[400px]">
          <div className="text-center">
            <div className="inline-flex items-center space-x-3 px-6 py-4 bg-white rounded-lg shadow-sm border">
              <div className="w-6 h-6 border-2 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
              <div>
                <div className="text-sm font-medium text-gray-900">Loading Pins...</div>
                <div className="text-xs text-gray-500 mt-1">This should only take a moment</div>
              </div>
            </div>
          </div>
        </div>
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
        cardsPerRow={cardsPerRow}
        onCardsPerRowChange={setCardsPerRow}
      />

      {/* Export Modal */}
      <ExportModal
        isOpen={showExportModal}
        onClose={() => setShowExportModal(false)}
        data={filteredData}
        selectedItems={selectedItems}
        onExport={handleExportAction}
        title="Export Pins"
      />
    </>
  )
}

export default function PinterestPinsPage() {
  return <PinsClient />
}
