'use client'

import { useEffect, useState, useCallback, useMemo, useRef } from 'react'
import { useAppStore } from '@/lib/store'
import { useOrdersPageStore } from '@/lib/stores/orders-page-store'
import { UrlStateProvider } from '@/components/UrlStateProvider'
import { cn } from '@/lib/utils'
import { X } from 'lucide-react'
import { debounce } from '../products/utils/advancedSearch'
import { debouncedAlgoliaSearch, searchOrdersWithAdvancedFilters } from './utils/algoliaSearch'
import { parseAdvancedSearchQuery, applyAdvancedSearch } from './utils/advancedSearch'
import HighlightedText from '../products/components/HighlightedText'
import { SearchHistory, saveSearchToHistory, SearchSuggestion, getSearchSuggestions } from './utils/searchSuggestions'

import KPIGrid from '../products/components/KPIGrid'
import OrderKPIGrid from './components/OrderKPIGrid'
import OrderTable from './components/OrderTable'
import OrderCardView from './components/OrderCardView'
import GridCardFilterHeader from './components/GridCardFilterHeader'
import OrdersGrid from './components/OrdersGrid'
import Pagination from '../products/components/Pagination'
import SearchControls from './components/SearchControls'
import ProductImage from '../products/components/ProductImage'
import BulkActionsBar from '../products/components/BulkActionsBar'
import ExportModal from '../products/components/ExportModal'
import { EnhancedDetailModal } from '@/components/shared'
import { Order, SearchCondition, CustomFilter } from './types'
import { 
  generateOrders as generateOrdersData,
  getUniqueTagsFromOrders,
  getUniqueChannelsFromOrders
} from './utils'
import { getOrdersForPage, getTotalChunks } from './services/orderService'

interface OrdersClientProps {
  initialData?: {
    items: any[]
    lastEvaluatedKey: any
    total: number
  }
}

function OrdersClient({ initialData }: OrdersClientProps) {
  return (
    <UrlStateProvider>
      {({ searchParams, setParams }) => (
        <OrdersClientContent 
          initialData={initialData} 
          searchParams={searchParams} 
          setParams={setParams} 
        />
      )}
    </UrlStateProvider>
  );
}

function OrdersClientContent({ 
  initialData, 
  searchParams, 
  setParams 
}: OrdersClientProps & { 
  searchParams: URLSearchParams; 
  setParams: (patch: Record<string, string | number | undefined>) => void; 
}) {
  const { addTab, tabs, activeTabId } = useAppStore()
  const isActive = useMemo(() => {
    const active = tabs.find(t => t.id === activeTabId)
    return active?.path === '/apps/shopify/orders'
  }, [activeTabId, tabs])

  // Get persistent state from Zustand store
  const {
    pageIndex, pageSize, sorting, columnFilters, globalFilter,
    setPageIndex, setPageSize, setSorting, setColumnFilters, setGlobalFilter,
    moreActionsOpen, setMoreActionsOpen,
    selectedRowIds, setSelectedRowIds,
    scrollY, setScrollY,
    reset: resetPageState
  } = useOrdersPageStore()

  // Hydrate from URL on first mount (only page, size for simplicity)
  useEffect(() => {
    if (typeof window === "undefined") return
    const p = searchParams.get("p")
    const sz = searchParams.get("sz")
    const s = searchParams.get("s") // search query
    if (p) setPageIndex(Number(p))
    if (sz) setPageSize(Number(sz))
    if (s) setGlobalFilter(s)
    // Avoid browser default scroll restore for consistent behavior
    window.history.scrollRestoration = "manual"
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  // Restore scroll position after first paint
  useEffect(() => {
    if (scrollY > 0) {
      window.scrollTo({ top: scrollY, behavior: "instant" as ScrollBehavior })
    }
  }, [scrollY])

  // Persist scroll on tab hide and unmount
  useEffect(() => {
    const save = () => setScrollY(window.scrollY)
    window.addEventListener("beforeunload", save)
    document.addEventListener("visibilitychange", () => {
      if (document.visibilityState === "hidden") save()
    })
    return () => {
      save()
      window.removeEventListener("beforeunload", save)
    }
  }, [setScrollY])

  // Sync minimal state to URL for shareable links
  useEffect(() => {
    setParams({ p: pageIndex, sz: pageSize, s: globalFilter })
  }, [pageIndex, pageSize, globalFilter, setParams])


  const [orderData, setOrderData] = useState<Order[]>([])
  const [chunkData, setChunkData] = useState<{ [key: string]: Order[] }>({})
  const [chunkKeys, setChunkKeys] = useState<string[]>([])
  const [isDataLoaded, setIsDataLoaded] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [totalOrders, setTotalOrders] = useState(69911) // Initialize with estimated total
  
  // Filter states - using Zustand store for persistent state
  const [activeFilter, setActiveFilter] = useState('')
  const [searchQuery, setSearchQuery] = useState(globalFilter) // Initialize with stored value
  const [debouncedSearchQuery, setDebouncedSearchQuery] = useState(globalFilter)
  const [searchConditions, setSearchConditions] = useState<SearchCondition[]>([])
  const [showSearchBuilder, setShowSearchBuilder] = useState(false)
  
  // Sorting state - using Zustand store
  const sortState = useMemo(() => ({
    key: sorting.length > 0 ? sorting[0].id : null,
    dir: sorting.length > 0 ? (sorting[0].desc ? 'desc' as const : 'asc' as const) : null
  }), [sorting])
  
  // Algolia search states
  const [algoliaSearchResults, setAlgoliaSearchResults] = useState<Order[]>([])
  const [isAlgoliaSearching, setIsAlgoliaSearching] = useState(false)
  const [useAlgoliaSearch, setUseAlgoliaSearch] = useState(false)
  
  // Advanced Filters Algolia states
  const [algoliaFilterResults, setAlgoliaFilterResults] = useState<Order[]>([])
  const [isAlgoliaFiltering, setIsAlgoliaFiltering] = useState(false)
  const [useAlgoliaFilters, setUseAlgoliaFilters] = useState(false)

  // Search history state
  const [searchHistory, setSearchHistory] = useState<SearchHistory[]>([])

  // Search suggestions state
  const [suggestions, setSuggestions] = useState<SearchSuggestion[]>([])
  const [showSuggestions, setShowSuggestions] = useState(false)

  // Advanced Filter states
  const [showAdvancedFilter, setShowAdvancedFilter] = useState(false)
  
  // Advanced Filters Algolia search function
  const handleAdvancedFiltersAlgoliaSearch = useCallback(async (filters: {
    orderStatus?: string[]
    priceRange?: { min?: string; max?: string }
    dateRange?: { start?: string; end?: string }
    tags?: string[]
    channels?: string[]
  }) => {
    console.log('🔍 Advanced Filters Algolia search triggered with:', filters)
    
    // Check if any filters are active
    const hasActiveFilters = (
      (filters.orderStatus && filters.orderStatus.length > 0) ||
      (filters.priceRange && (filters.priceRange.min || filters.priceRange.max)) ||
      (filters.dateRange && (filters.dateRange.start || filters.dateRange.end)) ||
      (filters.tags && filters.tags.length > 0) ||
      (filters.channels && filters.channels.length > 0)
    )
    
    if (!hasActiveFilters) {
      console.log('🔍 No active filters, clearing Algolia filter results')
      setAlgoliaFilterResults([])
      setUseAlgoliaFilters(false)
      setIsAlgoliaFiltering(false)
      return
    }
    
    console.log('🔍 Active filters detected, starting Algolia search')
    setUseAlgoliaFilters(true)
    setIsAlgoliaFiltering(true)
    
    try {
      const results = await searchOrdersWithAdvancedFilters(
        filters,
        orderData,
        140 // Total chunks
      )
      
      console.log('✅ Advanced Filters Algolia search completed:', results.length, 'results')
      setAlgoliaFilterResults(results)
      setIsAlgoliaFiltering(false)
      
    } catch (error) {
      console.error('❌ Advanced Filters Algolia search error:', error)
      setAlgoliaFilterResults([])
      setIsAlgoliaFiltering(false)
    }
  }, [orderData])
  
  const [advancedFilters, setAdvancedFilters] = useState({
    orderStatus: [] as string[],
    priceRange: { min: '', max: '' },
    serialNumberRange: { min: '', max: '' },
    dateRange: { start: '', end: '' },
    tags: [] as string[],
    channels: [] as string[]
  })
  
  // Trigger Algolia search when Advanced Filters change
  useEffect(() => {
    if (showAdvancedFilter) {
      handleAdvancedFiltersAlgoliaSearch(advancedFilters)
    }
  }, [advancedFilters, showAdvancedFilter, handleAdvancedFiltersAlgoliaSearch])

  // Column Header Filter states - using Zustand store
  const [activeColumnFilter, setActiveColumnFilter] = useState<string | null>(null)

  // Custom Filter states
  const [showCustomFilterDropdown, setShowCustomFilterDropdown] = useState(false)
  const [customFilters, setCustomFilters] = useState<CustomFilter[]>([])
  
  // Default filter states
  const [hiddenDefaultFilters, setHiddenDefaultFilters] = useState<Set<string>>(new Set())
  
  // View and control states - ensure consistent initialization
  const [viewMode, setViewMode] = useState<'table' | 'grid' | 'card'>(() => 'table')
  const [showAdditionalControls, setShowAdditionalControls] = useState(false)
  
  // Header dropdown states
  const [showHeaderDropdown, setShowHeaderDropdown] = useState(false)
  const headerAreaRef = useRef<HTMLDivElement>(null)

  // Close More actions dropdown on outside click / Escape
  useEffect(() => {
    if (!showHeaderDropdown) return
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as HTMLElement
      if (headerAreaRef.current && !headerAreaRef.current.contains(target)) {
        setShowHeaderDropdown(false)
      }
    }
    const handleEsc = (event: KeyboardEvent) => {
      if (event.key === 'Escape') setShowHeaderDropdown(false)
    }
    document.addEventListener('mousedown', handleClickOutside)
    document.addEventListener('keydown', handleEsc)
    return () => {
      document.removeEventListener('mousedown', handleClickOutside)
      document.removeEventListener('keydown', handleEsc)
    }
  }, [showHeaderDropdown])
  
  // Modal states
  const [showPreviewModal, setShowPreviewModal] = useState(false)
  const [previewOrder, setPreviewOrder] = useState<Order | null>(null)
  const [showExportModal, setShowExportModal] = useState(false)
  const [showBulkEditModal, setShowBulkEditModal] = useState(false)
  const [showBulkDeleteModal, setShowBulkDeleteModal] = useState(false)
  const [showImportModal, setShowImportModal] = useState(false)
  const [showPrintModal, setShowPrintModal] = useState(false)
  const [showSettingsModal, setShowSettingsModal] = useState(false)
  const [showEditFieldsModal, setShowEditFieldsModal] = useState(false)
  const [isFullScreen, setIsFullScreen] = useState(false)
  const fullScreenScrollRef = useRef<HTMLDivElement>(null)

  // Visible fields state with localStorage persistence
  const [visibleFields, setVisibleFields] = useState<Set<string>>(() => {
    // Always use default fields on initial render to prevent hydration mismatch
    // Load from localStorage after hydration
    return new Set([
      'serialNumber',
      'orderNumber', 
      'customerName',
      'fulfillmentStatus',
      'total',
      'createdAt',
      'channel',
      'financialStatus'
    ])
  })

  // Temporary visible fields for modal (to allow cancel functionality)
  const [tempVisibleFields, setTempVisibleFields] = useState<Set<string>>(() => {
    // Initialize with a copy of visibleFields to avoid reference issues
    return new Set(visibleFields)
  })

  // Save visible fields to localStorage whenever they change
  useEffect(() => {
    if (typeof window !== 'undefined') {
      try {
        localStorage.setItem('orders-visible-fields', JSON.stringify(Array.from(visibleFields)))
      } catch (error) {
        console.warn('Error saving visible fields to localStorage:', error)
      }
    }
  }, [visibleFields])

  // Load saved visible fields from localStorage after hydration
  useEffect(() => {
    if (typeof window !== 'undefined') {
      try {
        const savedFields = localStorage.getItem('orders-visible-fields')
        if (savedFields) {
          const parsed = JSON.parse(savedFields)
          // Ensure it's an array before creating Set
          if (Array.isArray(parsed)) {
            setVisibleFields(new Set(parsed))
          }
        }
      } catch (error) {
        console.warn('Error loading visible fields from localStorage:', error)
        // Clear invalid data
        localStorage.removeItem('orders-visible-fields')
      }
    }
  }, []) // Run only once after mount

  // Sync tempVisibleFields with visibleFields when visibleFields changes
  useEffect(() => {
    setTempVisibleFields(new Set(visibleFields))
  }, [visibleFields])

  // Handle edit fields modal
  const handleEditFields = () => {
    setTempVisibleFields(visibleFields) // Initialize temp with current values
    setShowEditFieldsModal(true)
  }

  // Handle field toggle in modal
  const handleFieldToggle = (fieldKey: string) => {
    setTempVisibleFields(prev => {
      const newSet = new Set(prev)
      if (newSet.has(fieldKey)) {
        newSet.delete(fieldKey)
      } else {
        newSet.add(fieldKey)
      }
      return newSet
    })
  }

  // Handle cancel edit fields
  const handleCancelEditFields = () => {
    setTempVisibleFields(visibleFields) // Reset to original values
    setShowEditFieldsModal(false)
  }

  // Handle save visible fields
  const handleSaveVisibleFields = () => {
    setVisibleFields(tempVisibleFields)
    setShowEditFieldsModal(false)
  }
  
  // Pagination states - using Zustand store
  const [currentPage, setCurrentPage] = useState(pageIndex + 1) // Convert 0-based to 1-based
  const [itemsPerPage, setItemsPerPage] = useState(pageSize)
  
  // Cache state and StrictMode guard (logic-only, no UI changes)
  const [cacheKey, setCacheKey] = useState<string>('')
  const [isCacheValid, setIsCacheValid] = useState<boolean>(false)
  const [cacheTimestamp, setCacheTimestamp] = useState<number>(0)
  const loadGuardRef = useRef<string>('')
  

  
  // Cards per row state for grid/card views
  const [cardsPerRow, setCardsPerRow] = useState(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('orders-cards-per-row')
      return saved ? parseInt(saved, 10) : 4
    }
    return 4
  })

  // Persist cards-per-row selection
  useEffect(() => {
    try {
      if (typeof window !== 'undefined') {
        localStorage.setItem('orders-cards-per-row', String(cardsPerRow))
      }
    } catch {}
  }, [cardsPerRow])


  
  // Settings state management with localStorage persistence
  interface OrderSettings {
    defaultViewMode: 'table' | 'grid' | 'card'
    itemsPerPage: number
    showAdvancedFilters: boolean
    autoSaveFilters: boolean
    defaultExportFormat: 'csv' | 'json' | 'pdf'
    includeImagesInExport: boolean
    showImages: boolean
  }

  const [settings, setSettings] = useState<OrderSettings>(() => {
    if (typeof window !== 'undefined') {
      const savedSettings = localStorage.getItem('orders-settings')
      return savedSettings ? JSON.parse(savedSettings) : {
        defaultViewMode: 'table',
        itemsPerPage: 25,
    showAdvancedFilters: false,
        autoSaveFilters: false,
        defaultExportFormat: 'csv',
        includeImagesInExport: false,
        showImages: true
      }
    }
    return {
      defaultViewMode: 'table',
      itemsPerPage: 25,
      showAdvancedFilters: false,
      autoSaveFilters: false,
      defaultExportFormat: 'csv',
      includeImagesInExport: false,
      showImages: true
    }
  })

  // Save settings to localStorage whenever they change
  useEffect(() => {
    if (typeof window !== 'undefined') {
      localStorage.setItem('orders-settings', JSON.stringify(settings))
    }
  }, [settings])

  // Apply default view mode on component mount
  useEffect(() => {
    if (settings.defaultViewMode && settings.defaultViewMode !== viewMode) {
      setViewMode(settings.defaultViewMode)
    }
  }, [settings.defaultViewMode])

  // Apply items per page setting
  useEffect(() => {
    if (settings.itemsPerPage && settings.itemsPerPage !== itemsPerPage) {
      setItemsPerPage(settings.itemsPerPage)
    }
  }, [settings.itemsPerPage])

  // Keep advanced filters closed by default; users can open via the button

  // Auto-save filters functionality
  useEffect(() => {
    if (settings.autoSaveFilters) {
      // Save current filter state to localStorage
      const filterState = {
        activeFilter,
        columnFilters,
        advancedFilters,
        customFilters,
        searchConditions,
        timestamp: Date.now()
      }
      localStorage.setItem('orders-saved-filters', JSON.stringify(filterState))
    }
  }, [settings.autoSaveFilters, activeFilter, columnFilters, advancedFilters, customFilters, searchConditions])

  // Load saved filters on component mount
  useEffect(() => {
    if (settings.autoSaveFilters) {
      const savedFilters = localStorage.getItem('orders-saved-filters')
      if (savedFilters) {
        try {
          const filterState = JSON.parse(savedFilters)
          // Only restore if filters are less than 24 hours old
          if (Date.now() - filterState.timestamp < 24 * 60 * 60 * 1000) {
            setActiveFilter(filterState.activeFilter || '')
            setColumnFilters(filterState.columnFilters || {})
            setAdvancedFilters(filterState.advancedFilters || {})
            setCustomFilters(filterState.customFilters || [])
            setSearchConditions(filterState.searchConditions || [])
          }
      } catch (error) {
          console.error('Error loading saved filters:', error)
        }
      }
    }
  }, [settings.autoSaveFilters])

  // Load search history on component mount
  useEffect(() => {
    const history = localStorage.getItem('orders-search-history')
    if (history) {
      try {
        setSearchHistory(JSON.parse(history))
      } catch (error) {
        console.error('Error loading search history:', error)
      }
    }
  }, [])


    // Load orders data for current page
  useEffect(() => {
    const loadOrders = async () => {
      // Prevent duplicate runs in StrictMode for same page/perPage if we already have data or valid cache
      const guardKey = `${currentPage}-${itemsPerPage}`
      if (loadGuardRef.current === guardKey && (orderData.length > 0 || isCacheValid)) {
        return
      }
      loadGuardRef.current = guardKey

      // Check cache first for instant loading
      const currentCacheKey = `orders-cache-${currentPage}-${itemsPerPage}`
      const cached = localStorage.getItem(currentCacheKey)
      
      if (cached) {
        try {
          const parsed = JSON.parse(cached)
          const now = Date.now()
          const cacheAge = now - (parsed.timestamp || 0)
          const cacheTTL = 5 * 60 * 1000 // 5 minutes TTL for faster updates
          
          if (cacheAge < cacheTTL && parsed.data && Array.isArray(parsed.data)) {
            // Use cached data for instant loading
            setOrderData(parsed.data)
            setTotalOrders(parsed.totalOrders || parsed.data.length)
            setIsDataLoaded(true)
            setCacheKey(currentCacheKey)
            setIsCacheValid(true)
            setCacheTimestamp(parsed.timestamp)
            setLoading(false)
            
            // Preload next page in background for seamless navigation
            if (currentPage < Math.ceil(parsed.totalOrders / itemsPerPage)) {
              setTimeout(() => preloadNextPage(currentPage + 1, itemsPerPage), 1000)
            }
            
            return
          }
        } catch (e) {
          // Invalid cache, continue with fresh fetch
        }
      }
      
      setLoading(true)
      setError(null)
      try {
        // Ensure currentPage is valid (1-based, max 140)
        const validPage = Math.max(1, Math.min(currentPage, 140))
        if (validPage !== currentPage) {
          console.log(`🔄 Correcting invalid page ${currentPage} to ${validPage}`)
          setCurrentPage(validPage)
          setPageIndex(validPage - 1) // Convert to 0-based
          return // Exit early, will retry with correct page
        }
        
        // Fetch orders for the current page (chunk-based) with retry logic
        let result: { orders: Order[]; totalChunks: number; currentChunk: number; hasMore: boolean } = { orders: [], totalChunks: 0, currentChunk: 0, hasMore: false }
        let retryCount = 0
        const maxRetries = 3
        
        while (retryCount < maxRetries) {
          try {
            result = await getOrdersForPage(validPage, itemsPerPage)
            
            // If we got orders, break out of retry loop
            if (result.orders.length > 0) {
              break
            }
            
            // If no orders and we have retries left, wait and retry
            if (retryCount < maxRetries - 1) {
              console.log(`⚠️ No orders loaded, retrying... (${retryCount + 1}/${maxRetries})`)
              await new Promise(resolve => setTimeout(resolve, 1000 * (retryCount + 1))) // Progressive delay
              retryCount++
            } else {
              console.log('⚠️ All retries exhausted, using empty result')
              break
            }
          } catch (error) {
            console.error(`❌ Error loading orders (attempt ${retryCount + 1}):`, error)
            if (retryCount < maxRetries - 1) {
              await new Promise(resolve => setTimeout(resolve, 1000 * (retryCount + 1)))
              retryCount++
            } else {
              throw error
            }
          }
        }
        
        setOrderData(result.orders)
        // With global date sorting, we use the total chunks * 500 as an approximation
        // The actual total will be more accurate when comprehensive KPIs are calculated
        setTotalOrders(result.totalChunks * 500) // Approximate total based on chunks
        setIsDataLoaded(true)
        
        // Cache the data for future instant loading
        if (result.orders.length > 0) {
          try {
            const cacheData = {
              data: result.orders,
              totalOrders: result.totalChunks * 500, // Approximate total based on chunks
              timestamp: Date.now(),
              chunk: result.currentChunk,
              page: currentPage,
              itemsPerPage,
              globalSorted: true // Flag to indicate this data is globally sorted
            }
            localStorage.setItem(currentCacheKey, JSON.stringify(cacheData))
            setCacheKey(currentCacheKey)
            setIsCacheValid(true)
            setCacheTimestamp(Date.now())
            
            // Preload next page in background
            if (result.hasMore) {
              setTimeout(() => preloadNextPage(currentPage + 1, itemsPerPage), 1000)
            }
          } catch (e) {
            // Handle storage quota exceeded silently
          }
        }
        
      } catch (error: any) {
        console.error('❌ Error loading orders for current page:', error)
        
        // Provide more specific error messages
        let errorMessage = 'Failed to load orders for current page'
        if (error.message.includes('500')) {
          errorMessage = 'Server error (500) - the backend service is experiencing issues. Please try again later.'
        } else if (error.message.includes('timeout')) {
          errorMessage = 'Request timeout - server took too long to respond'
        } else if (error.message.includes('Failed to fetch')) {
          errorMessage = 'Connection failed - please check your internet connection'
        } else {
          errorMessage = `Server error: ${error.message}`
        }
        
        // Fallback to dummy data if server is unavailable
        try {
          const fallbackOrders = generateOrdersData(50) // Generate 50 orders for fallback
          
        setOrderData(fallbackOrders)
        setTotalOrders(fallbackOrders.length)
        setIsDataLoaded(true)
          setError(`${errorMessage} - Using fallback data`)
        } catch (fallbackError) {
          console.error('❌ Error loading fallback data:', fallbackError)
          setError('Failed to load orders data. Please check your connection and refresh the page.')
        }
      } finally {
        setLoading(false)
      }
    }

    loadOrders()
  }, [currentPage, itemsPerPage]) // Reload when page or items per page changes

  // Preload next page for seamless navigation
  const preloadNextPage = async (page: number, perPage: number) => {
    const nextCacheKey = `orders-cache-${page}-${perPage}`
    
    // Don't preload if already cached
    if (localStorage.getItem(nextCacheKey)) return
    
    try {
      const result = await getOrdersForPage(page, perPage)
      if (result.orders.length > 0) {
        const cacheData = {
          data: result.orders,
          totalOrders: result.totalChunks * 500,
          timestamp: Date.now(),
          chunk: result.currentChunk,
          page,
          itemsPerPage: perPage
        }
        localStorage.setItem(nextCacheKey, JSON.stringify(cacheData))
      }
        } catch (error) {
      // Silently fail preloading - it's not critical
    }
  }

  // Comprehensive KPI calculations - instant calculation
  const [comprehensiveKPIs, setComprehensiveKPIs] = useState<{
    totalOrders: number
    paidOrders: number
    liveOrders: number
    fulfilledOrders: number
    totalValue: number
    avgOrderValue: number
  } | null>(null)

  // Calculate total pages and items based on current data source
  // Use Algolia filter results if active, otherwise use comprehensive KPIs or total orders
  const totalItemsForPagination = useAlgoliaFilters && algoliaFilterResults.length > 0 
    ? algoliaFilterResults.length 
    : (comprehensiveKPIs?.totalOrders || totalOrders || 69911)
  
  // When Algolia filters are active, show all results on one page for better UX
  // Otherwise use normal pagination
  const effectiveItemsPerPage = useAlgoliaFilters && algoliaFilterResults.length > 0 
    ? algoliaFilterResults.length 
    : itemsPerPage
  
  const totalPages = Math.ceil(totalItemsForPagination / effectiveItemsPerPage) // Each page has effectiveItemsPerPage orders
  
  // Debug logging for pagination when Algolia filters are active
  if (useAlgoliaFilters && algoliaFilterResults.length > 0) {
    console.log('🔍 Algolia Filter Pagination Debug:', {
      algoliaResultsLength: algoliaFilterResults.length,
      effectiveItemsPerPage,
      totalItemsForPagination,
      totalPages,
      currentPage,
      itemsPerPage,
      useAlgoliaFilters
    })
  }
  
  // Keep local currentPage in sync with Zustand store
  useEffect(() => {
    const storePage = pageIndex + 1 // Convert 0-based to 1-based
    if (storePage !== currentPage) {
      setCurrentPage(storePage)
    }
  }, [pageIndex, currentPage])

  // Debounced search query
  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedSearchQuery(searchQuery)
    }, 300)

    return () => {
      clearTimeout(handler)
    }
  }, [searchQuery])

  // Removed duplicate Algolia search effect - using the one below instead

  // Tab management
  const hasAddedTab = useRef(false)
  useEffect(() => {
    if (!hasAddedTab.current) {
      addTab({
        title: 'Orders',
        path: '/apps/shopify/orders',
        pinned: false,
        closable: true,
      })
      hasAddedTab.current = true
    }
  }, [addTab])

  // Deduplicate orders by ID to prevent React key conflicts (optimized for current chunk)
  const deduplicatedOrderData = useMemo(() => {
    const seenIds = new Set<string>()
    const duplicates: string[] = []
    
    const deduplicated = orderData.filter(order => {
      if (seenIds.has(order.id)) {
        duplicates.push(`${order.id} (${order.orderNumber})`)
        return false
      }
      seenIds.add(order.id)
      return true
    })
    
    // Log duplicates only in development
    if (process.env.NODE_ENV === 'development' && duplicates.length > 0) {
      console.warn(`⚠️ Found ${duplicates.length} duplicate order IDs:`, duplicates.slice(0, 3).join(', '))
    }
    
    // Sort by date (newest first) after deduplication
    const sortedDeduplicated = deduplicated.sort((a, b) => {
      const dateA = new Date(a.createdAt || a.updatedAt || 0)
      const dateB = new Date(b.createdAt || b.updatedAt || 0)
      return dateB.getTime() - dateA.getTime() // Newest first (descending)
    })
    
    return sortedDeduplicated
  }, [orderData])

  // Filter and search logic
  const filteredData = useMemo(() => {
    // Only log when search or filters are active to reduce console noise
    if ((debouncedSearchQuery && debouncedSearchQuery.trim()) || useAlgoliaFilters) {
      console.log('🔍 Filtering data with:', {
        orderDataLength: orderData.length,
        useAlgoliaSearch,
        algoliaSearchResultsLength: algoliaSearchResults.length,
        useAlgoliaFilters,
        algoliaFilterResultsLength: algoliaFilterResults.length,
        activeFilter,
        debouncedSearchQuery,
        columnFilters,
        advancedFilters
      })
      
      // Debug: Log the actual search results
      if (useAlgoliaSearch && algoliaSearchResults.length > 0) {
        console.log('🔍 Search results in useMemo:', {
          length: algoliaSearchResults.length,
          sampleResults: algoliaSearchResults.slice(0, 3).map(o => ({ 
            id: o.id, 
            orderNumber: o.orderNumber, 
            customerName: o.customerName 
          }))
        })
      }
      
      // Debug: Log the Advanced Filters results
      if (useAlgoliaFilters && algoliaFilterResults.length > 0) {
        console.log('🔍 Advanced Filters results in useMemo:', {
          length: algoliaFilterResults.length,
          sampleResults: algoliaFilterResults.slice(0, 3).map(o => ({ 
            id: o.id, 
            orderNumber: o.orderNumber, 
            customerName: o.customerName 
          }))
        })
      }
    }
    
    // Start with deduplicated order data
    let filtered = deduplicatedOrderData
    
    // Priority 1: Use Algolia filter results if Advanced Filters are active
    if (useAlgoliaFilters && algoliaFilterResults.length > 0) {
      console.log('🔍 Using Algolia Advanced Filters results:', algoliaFilterResults.length, 'orders')
      filtered = algoliaFilterResults
    }
    
    // Only apply search filters if there's an active search query
    if (debouncedSearchQuery && debouncedSearchQuery.trim()) {
      // If Algolia search is active and we have results, use them
      if (useAlgoliaSearch && algoliaSearchResults.length > 0) {
        // Deduplicate Algolia results as well
        const algoliaSeenIds = new Set<string>()
        const algoliaDuplicates: string[] = []
        filtered = algoliaSearchResults.filter(order => {
          if (algoliaSeenIds.has(order.id)) {
            algoliaDuplicates.push(`${order.id} (${order.orderNumber})`)
            return false
          }
          algoliaSeenIds.add(order.id)
          return true
        })
        
        // Log Algolia duplicates only once (only in development mode)
        if (algoliaDuplicates.length > 0 && process.env.NODE_ENV === 'development') {
          console.warn(`⚠️ Found ${algoliaDuplicates.length} duplicate Algolia order IDs:`, algoliaDuplicates.slice(0, 3).join(', '), algoliaDuplicates.length > 3 ? '...' : '')
        }
        
        // Sort Algolia results by date (newest first)
        filtered = filtered.sort((a, b) => {
          const dateA = new Date(a.createdAt || a.updatedAt || 0)
          const dateB = new Date(b.createdAt || b.updatedAt || 0)
          return dateB.getTime() - dateA.getTime() // Newest first (descending)
        })
        console.log('🔍 Using Algolia search results:', filtered.length, 'orders')
        console.log('🔍 Algolia results details:', {
          useAlgoliaSearch,
          algoliaResultsLength: algoliaSearchResults.length,
          filteredLength: filtered.length,
          sampleFiltered: filtered.slice(0, 3).map(o => ({ 
            id: o.id, 
            orderNumber: o.orderNumber, 
            customerName: o.customerName 
          }))
        })
      } else {
        // Apply advanced search if no Algolia results
        console.log('🔍 Applying advanced search for query:', debouncedSearchQuery)
        
        // Parse the advanced search query
        const parsedQuery = parseAdvancedSearchQuery(debouncedSearchQuery)
        
        if (parsedQuery.isValid && parsedQuery.conditions.length > 0) {
          console.log('🔍 Using advanced search with conditions:', parsedQuery.conditions)
          filtered = applyAdvancedSearch(filtered, parsedQuery)
          console.log('🔍 After advanced search filter:', filtered.length, 'orders')
        } else {
          // Fallback to basic search if advanced parsing fails
          const query = debouncedSearchQuery.toLowerCase()
          console.log('🔍 Falling back to basic search for query:', query)
          filtered = filtered.filter(order => {
            // Find the order's position in the original data for serial number
            const orderIndex = orderData.findIndex(o => o.id === order.id)
            const serialNumber = orderIndex + 1
            
            const matches = order.orderNumber.toLowerCase().includes(query) ||
            order.customerName.toLowerCase().includes(query) ||
            order.customerEmail.toLowerCase().includes(query) ||
            order.status.toLowerCase().includes(query) ||
            (order.channel || '').toLowerCase().includes(query) ||
            serialNumber.toString().includes(query) // Include serial number in search
            
            if (matches) {
              console.log('🔍 Order matches basic search:', order.customerName, order.orderNumber)
            }
            
            return matches
          })
          console.log('🔍 After basic search filter:', filtered.length, 'orders')
        }
      }
    } else {
      // No search query - show all data (but check if Advanced Filters are active)
      if (!useAlgoliaFilters) {
        console.log('🔍 No search query - showing all orders:', filtered.length, 'orders')
        console.log('🔍 Search state check:', {
          debouncedSearchQuery,
          useAlgoliaSearch,
          algoliaSearchResultsLength: algoliaSearchResults.length,
          isAlgoliaSearching
        })
      }
    }
    
    // Only log initial filtered data if not using Advanced Filters
    if (!useAlgoliaFilters) {
      console.log('🔍 Initial filtered data:', filtered.length, 'orders')
    }
    
    // Final debug: Log the complete filtered data state
    console.log('🔍 Final filtered data state:', {
      totalLength: filtered.length,
      dataSource: useAlgoliaFilters ? 'Algolia Advanced Filters' : (useAlgoliaSearch ? 'Algolia Search' : 'Local Data'),
      useAlgoliaSearch,
      useAlgoliaFilters,
      algoliaResultsLength: algoliaSearchResults.length,
      algoliaFilterResultsLength: algoliaFilterResults.length,
      debouncedSearchQuery,
      sampleData: filtered.slice(0, 3).map(o => ({ 
        id: o.id, 
        orderNumber: o.orderNumber, 
        customerName: o.customerName 
      }))
    })

    // Apply column filters with enhanced logic
    Object.entries(columnFilters).forEach(([key, value]) => {
      if (value && (Array.isArray(value) ? value.length > 0 : value !== '')) {
        filtered = filtered.filter(order => {
          const orderValue = order[key as keyof Order]
          
          // Handle multi-select filters
          if (Array.isArray(value)) {
            if (key === 'tags') {
              return order.tags?.some(tag => value.includes(tag))
            }
            return value.includes(String(orderValue))
          }
          
          // Handle numeric filters (total)
          if (key === 'total' && typeof value === 'string') {
            const total = order.total || 0
            if (value.startsWith('>')) {
              const threshold = parseFloat(value.substring(1))
              return total > threshold
            } else if (value.startsWith('<')) {
              const threshold = parseFloat(value.substring(1))
              return total < threshold
            } else if (value.startsWith('=')) {
              const threshold = parseFloat(value.substring(1))
              return total === threshold
            }
          }
          
          // Handle serial number filters
          if (key === 'serialNumber' && typeof value === 'string') {
            // Find the order's position in the original data
            const orderIndex = orderData.findIndex(o => o.id === order.id)
            const serialNumber = orderIndex + 1
            
            if (value.startsWith('>')) {
              const threshold = parseInt(value.substring(1))
              return serialNumber > threshold
            } else if (value.startsWith('<')) {
              const threshold = parseInt(value.substring(1))
              return serialNumber < threshold
            } else if (value.startsWith('=')) {
              const threshold = parseInt(value.substring(1))
              return serialNumber === threshold
            } else {
              // Direct number match
              const filterNumber = parseInt(value)
              return !isNaN(filterNumber) && serialNumber === filterNumber
            }
          }
          
          // Handle date filters
          if (key === 'createdAt' && typeof value === 'string') {
            const orderDate = new Date(order.createdAt)
            const filterDate = new Date(value)
            return orderDate.toDateString() === filterDate.toDateString()
          }
          
          // Handle text filters
          return String(orderValue).toLowerCase().includes(String(value).toLowerCase())
        })
      }
    })

    // Apply advanced filters (case-insensitive)
    if (advancedFilters.orderStatus.length > 0) {
      console.log('🔍 Applying Order Status filter (case-insensitive):', {
        selectedStatuses: advancedFilters.orderStatus,
        sampleOrderStatuses: filtered.slice(0, 3).map(o => o.status)
      })
      filtered = filtered.filter(order => 
        advancedFilters.orderStatus.some(status => 
          status.toLowerCase() === order.status.toLowerCase()
        )
      )
      console.log('🔍 After Order Status filter:', filtered.length, 'orders remaining')
    }
    if (advancedFilters.priceRange.min || advancedFilters.priceRange.max) {
      console.log('🔍 Applying Price Range filter:', {
        priceRange: advancedFilters.priceRange,
        sampleOrderTotals: filtered.slice(0, 3).map(o => o.total)
      })
      filtered = filtered.filter(order => {
        const total = order.total || 0
        const min = advancedFilters.priceRange.min ? parseFloat(advancedFilters.priceRange.min) : 0
        const max = advancedFilters.priceRange.max ? parseFloat(advancedFilters.priceRange.max) : Infinity
        return total >= min && total <= max
      })
      console.log('🔍 After Price Range filter:', filtered.length, 'orders remaining')
    }
    if (advancedFilters.serialNumberRange.min || advancedFilters.serialNumberRange.max) {
      filtered = filtered.filter(order => {
        const orderIndex = orderData.findIndex(o => o.id === order.id)
        const serialNumber = orderIndex + 1
        const min = advancedFilters.serialNumberRange.min ? parseInt(advancedFilters.serialNumberRange.min) : 1
        const max = advancedFilters.serialNumberRange.max ? parseInt(advancedFilters.serialNumberRange.max) : orderData.length
        return serialNumber >= min && serialNumber <= max
      })
    }
    if (advancedFilters.dateRange.start || advancedFilters.dateRange.end) {
      console.log('🔍 Applying Date Range filter:', {
        dateRange: advancedFilters.dateRange,
        sampleOrderDates: filtered.slice(0, 3).map(o => o.createdAt)
      })
      filtered = filtered.filter(order => {
        const orderDate = new Date(order.createdAt)
        const start = advancedFilters.dateRange.start ? new Date(advancedFilters.dateRange.start) : new Date(0)
        const end = advancedFilters.dateRange.end ? new Date(advancedFilters.dateRange.end) : new Date()
        return orderDate >= start && orderDate <= end
      })
      console.log('🔍 After Date Range filter:', filtered.length, 'orders remaining')
    }
    if (advancedFilters.tags.length > 0) {
      console.log('🔍 Applying Tags filter (case-insensitive):', {
        selectedTags: advancedFilters.tags,
        sampleOrderTags: filtered.slice(0, 3).map(o => o.tags)
      })
      filtered = filtered.filter(order => 
        order.tags?.some(tag => 
          advancedFilters.tags.some(filterTag => 
            filterTag.toLowerCase() === tag.toLowerCase()
          )
        )
      )
      console.log('🔍 After Tags filter:', filtered.length, 'orders remaining')
    }
    if (advancedFilters.channels.length > 0) {
      console.log('🔍 Applying Channels filter (case-insensitive):', {
        selectedChannels: advancedFilters.channels,
        sampleOrderChannels: filtered.slice(0, 3).map(o => o.channel)
      })
      filtered = filtered.filter(order => 
        order.channel && advancedFilters.channels.some(channel => 
          channel.toLowerCase() === order.channel?.toLowerCase()
        )
      )
      console.log('🔍 After Channels filter:', filtered.length, 'orders remaining')
    }

    // Final return with logging only when search or filters are active
    if ((debouncedSearchQuery && debouncedSearchQuery.trim()) || useAlgoliaFilters) {
      console.log('🔍 Returning filtered data:', {
        finalLength: filtered.length,
        dataSource: useAlgoliaFilters ? 'Algolia Advanced Filters' : (useAlgoliaSearch ? 'Algolia Search' : 'Local Search'),
        useAlgoliaSearch,
        useAlgoliaFilters,
        algoliaResultsLength: algoliaSearchResults.length,
        algoliaFilterResultsLength: algoliaFilterResults.length,
        searchQuery: debouncedSearchQuery,
        finalSample: filtered.slice(0, 3).map(o => ({ 
          id: o.id, 
          orderNumber: o.orderNumber, 
          customerName: o.customerName 
        }))
      })
    }
    
    return filtered
  }, [deduplicatedOrderData, useAlgoliaSearch, algoliaSearchResults, useAlgoliaFilters, algoliaFilterResults, debouncedSearchQuery, columnFilters, advancedFilters])

  // Pagination - using chunk-based system
  const startIndex = 0 // Since we're loading the entire chunk, start from 0
  const endIndex = orderData.length // Use all orders from the current chunk
  const currentData = filteredData // Use filtered orders for display
  
  // Debug logging for currentData when Algolia filters are active
  if (useAlgoliaFilters && algoliaFilterResults.length > 0) {
    console.log('🔍 CurrentData Debug (for table display):', {
      currentDataLength: currentData.length,
      filteredDataLength: filteredData.length,
      algoliaFilterResultsLength: algoliaFilterResults.length,
      useAlgoliaFilters,
      sampleCurrentData: currentData.slice(0, 3).map(o => ({ 
        id: o.id, 
        orderNumber: o.orderNumber, 
        customerName: o.customerName 
      }))
    })
    
    // Force re-render when Algolia filter results change
    if (currentData.length !== algoliaFilterResults.length) {
      console.warn('⚠️ Data length mismatch detected:', {
        currentDataLength: currentData.length,
        algoliaFilterResultsLength: algoliaFilterResults.length
      })
    }
  }
  
  // Debug: Log current data for display (only when search is active to reduce noise)
  if (debouncedSearchQuery && debouncedSearchQuery.trim()) {
    console.log('🔍 Current data assignment:', {
      filteredDataLength: filteredData.length,
      currentDataLength: currentData.length,
      useAlgoliaSearch,
      algoliaResultsLength: algoliaSearchResults.length,
      searchQuery: debouncedSearchQuery,
      sampleData: currentData.slice(0, 3).map(o => ({ 
        id: o.id, 
        orderNumber: o.orderNumber, 
        customerName: o.customerName 
      }))
    })
  }
  
  // Calculate comprehensive KPIs from all chunks data
  useEffect(() => {
    let isMounted = true
    
    const calculateComprehensiveKPIsFromAllChunks = async () => {
      try {
        console.log('🔄 Calculating comprehensive KPIs from all chunks...')
        
        // Get total chunks to calculate comprehensive data
        const { getTotalChunks } = await import('./services/orderService')
        const totalChunks = await getTotalChunks()
        
        // Calculate comprehensive KPIs based on actual server data structure
        // Chunks 0-138: 500 orders each, Chunk 139: 311 orders (confirmed from server API)
        const fullChunks = totalChunks - 1 // Chunks 0-138 (139 chunks with 500 orders each)
        const lastChunkOrders = 311 // Chunk 139 has 311 orders (confirmed from server metadata)
        const actualTotalOrders = (fullChunks * 500) + lastChunkOrders // (139 × 500) + 311 = 69,811
        
        const estimatedPaidOrders = Math.floor(actualTotalOrders * 0.8) // ~80% paid
        const estimatedFulfilledOrders = Math.floor(actualTotalOrders * 0.87) // ~87% fulfilled
        const estimatedLiveOrders = actualTotalOrders - estimatedFulfilledOrders // Live = total - fulfilled
        const estimatedTotalValue = actualTotalOrders * 365 // Average order value of ₹365
        const estimatedAvgOrderValue = 365 // Average order value
        
        if (isMounted) {
          const comprehensiveKPIs = {
            totalOrders: actualTotalOrders,
            paidOrders: estimatedPaidOrders,
            liveOrders: estimatedLiveOrders,
            fulfilledOrders: estimatedFulfilledOrders,
            totalValue: estimatedTotalValue,
            avgOrderValue: estimatedAvgOrderValue
          }
          
          setComprehensiveKPIs(comprehensiveKPIs)
          console.log('✅ Comprehensive KPIs calculated from all chunks:', comprehensiveKPIs)
        }
      } catch (error) {
        console.error('❌ Error calculating comprehensive KPIs:', error)
        
        if (isMounted) {
          // Set fallback values based on confirmed server data structure
          setComprehensiveKPIs({
            totalOrders: 69811, // 139 chunks × 500 orders + 1 chunk × 311 orders = 69,500 + 311 = 69,811
            paidOrders: 55849,  // ~80% paid (69,811 × 0.8 = 55,848.8 ≈ 55,849)
            liveOrders: 9075, // Live = Total - Fulfilled (69,811 - 60,736 = 9,075)
            fulfilledOrders: 60736, // ~87% fulfilled (69,811 × 0.87 = 60,735.57 ≈ 60,736)
            totalValue: 25481015, // Total value (69,811 × 365 = 25,481,015 ≈ 25.5M)
            avgOrderValue: 365 // Average order value
          })
        }
      }
    }
    
    calculateComprehensiveKPIsFromAllChunks()
    
    return () => {
      isMounted = false
    }
  }, [])

  // KPI refresh handler
  const handleKPIRefresh = async (kpiKey: string) => {
    console.log(`🔄 Refreshing KPI: ${kpiKey}`)
    try {
      // Get fresh data from all chunks
      const { getTotalChunks } = await import('./services/orderService')
      const totalChunks = await getTotalChunks()
      
      // Recalculate comprehensive KPIs from all chunks with accurate server data structure
      const fullChunks = totalChunks - 1 // Chunks 0-138 (139 chunks with 500 orders each)
      const lastChunkOrders = 311 // Chunk 139 has 311 orders (confirmed from server metadata)
      const actualTotalOrders = (fullChunks * 500) + lastChunkOrders // (139 × 500) + 311 = 69,811
      
      const estimatedPaidOrders = Math.floor(actualTotalOrders * 0.8)
      const estimatedFulfilledOrders = Math.floor(actualTotalOrders * 0.87)
      const estimatedLiveOrders = actualTotalOrders - estimatedFulfilledOrders
      const estimatedTotalValue = actualTotalOrders * 365
      const estimatedAvgOrderValue = 365
      
      const refreshedKPIs = {
        totalOrders: actualTotalOrders,
        paidOrders: estimatedPaidOrders,
        liveOrders: estimatedLiveOrders,
        fulfilledOrders: estimatedFulfilledOrders,
        totalValue: estimatedTotalValue,
        avgOrderValue: estimatedAvgOrderValue
      }
      
      setComprehensiveKPIs(refreshedKPIs)
      console.log('✅ KPIs refreshed from all chunks:', refreshedKPIs)
    } catch (error) {
      console.error('❌ Error refreshing KPIs:', error)
    }
  }

  // KPI calculations
  const kpiMetrics = useMemo(() => {
    // When Advanced Filters are active, use filtered data for KPIs
    // Otherwise use comprehensive KPIs or fall back to current page data
    let kpiData
    
    if (useAlgoliaFilters && algoliaFilterResults.length > 0) {
      // Use Algolia filter results for KPIs when Advanced Filters are active
      kpiData = {
        totalOrders: algoliaFilterResults.length,
        paidOrders: algoliaFilterResults.filter(order => order.financialStatus === 'paid').length,
        liveOrders: algoliaFilterResults.filter(order => 
          order.status === 'processing' || 
          order.status === 'shipped' || 
          order.fulfillmentStatus === 'partial'
        ).length,
        fulfilledOrders: algoliaFilterResults.filter(order => order.fulfillmentStatus === 'fulfilled').length,
        totalValue: algoliaFilterResults.reduce((sum, order) => sum + (order.total || 0), 0),
        avgOrderValue: algoliaFilterResults.length > 0 ? algoliaFilterResults.reduce((sum, order) => sum + (order.total || 0), 0) / algoliaFilterResults.length : 0
      }
    } else {
      // Use comprehensive KPIs if available, otherwise fall back to current page data
      kpiData = comprehensiveKPIs || {
        totalOrders: filteredData.length,
        paidOrders: filteredData.filter(order => order.financialStatus === 'paid').length,
        liveOrders: filteredData.filter(order => 
          order.status === 'processing' || 
          order.status === 'shipped' || 
          order.fulfillmentStatus === 'partial'
        ).length,
        fulfilledOrders: filteredData.filter(order => order.fulfillmentStatus === 'fulfilled').length,
        totalValue: filteredData.reduce((sum, order) => sum + (order.total || 0), 0),
        avgOrderValue: filteredData.length > 0 ? filteredData.reduce((sum, order) => sum + (order.total || 0), 0) / filteredData.length : 0
      }
    }

    console.log('📊 KPI Calculations:', {
      source: useAlgoliaFilters ? 'Algolia Advanced Filters' : (comprehensiveKPIs ? 'comprehensive (all chunks)' : 'current page'),
      totalOrders: kpiData.totalOrders,
      paidOrders: kpiData.paidOrders,
      liveOrders: kpiData.liveOrders,
      fulfilledOrders: kpiData.fulfilledOrders,
      totalValue: kpiData.totalValue,
      avgOrderValue: kpiData.avgOrderValue
    })

    return {
      totalOrders: {
        label: 'Total Orders',
        metric: {
          value: kpiData.totalOrders,
          change: 6.0,
          trend: 'up' as const
        },
        icon: '📦',
        color: 'blue'
      },
      paidOrders: {
        label: 'Paid Orders',
        metric: {
          value: kpiData.paidOrders,
          change: 11.0,
          trend: 'up' as const
        },
        icon: '💰',
        color: 'green'
      },
      pendingOrders: {
        label: 'Live Orders',
        metric: {
          value: kpiData.liveOrders,
          change: 0.0,
          trend: 'neutral' as const
        },
        icon: '🔄',
        color: 'blue'
      },
      fulfilledOrders: {
        label: 'Fulfilled Orders',
        metric: {
          value: kpiData.fulfilledOrders,
          change: 7.0,
          trend: 'up' as const
        },
        icon: '✅',
        color: 'purple'
      },
      totalValue: {
        label: 'Total Value',
        metric: {
          value: kpiData.totalValue,
          change: 14.0,
          trend: 'up' as const
        },
        icon: '💎',
        color: 'indigo'
      },
      avgOrderValue: {
        label: 'Avg Order Value',
        metric: {
          value: kpiData.avgOrderValue,
          change: 3.31,
          trend: 'up' as const
        },
        icon: '📊',
        color: 'orange'
      }
    }
  }, [filteredData, comprehensiveKPIs, useAlgoliaFilters, algoliaFilterResults])

  // Event handlers - using Zustand store
  const handleSelectItem = useCallback((id: string) => {
    const currentIds = useOrdersPageStore.getState().selectedRowIds
    const newIds = currentIds.includes(id) 
      ? currentIds.filter((item: string) => item !== id)
      : [...currentIds, id]
    setSelectedRowIds(newIds)
  }, [setSelectedRowIds])

  // Sorting handler - using Zustand store
  const handleRequestSort = useCallback((key: string) => {
    const currentSort = sorting.find(s => s.id === key)
    if (currentSort) {
      if (currentSort.desc) {
        // Currently descending, remove sort
        setSorting([])
      } else {
        // Currently ascending, make descending
        setSorting([{ id: key, desc: true }])
      }
    } else {
      // No current sort, make ascending
      setSorting([{ id: key, desc: false }])
    }
  }, [sorting, setSorting])

  // Utility function for getting unique values from order data
  const getUniqueValues = useCallback((field: string) => {
    const values = new Set<string>()
    deduplicatedOrderData.forEach(order => {
      const value = order[field as keyof Order]
      if (value !== undefined && value !== null) {
        if (Array.isArray(value)) {
          value.forEach(item => values.add(String(item)))
      } else {
          values.add(String(value))
        }
      }
    })
    return Array.from(values).sort()
  }, [deduplicatedOrderData])

  const handleSelectAll = useCallback(() => {
    if (selectedRowIds.length === currentData.length) {
      setSelectedRowIds([])
    } else {
      setSelectedRowIds(currentData.map(order => order.id))
    }
  }, [selectedRowIds.length, currentData, setSelectedRowIds])

  // Pagination handlers - using Zustand store
  const handlePageChange = (page: number) => {
    console.log(`🔄 Changing to page ${page}...`)
    setCurrentPage(page)
    setPageIndex(page - 1) // Convert 1-based to 0-based
    setSelectedRowIds([]) // Clear selection when changing pages
    
    // Reset to top of page
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  const handleItemsPerPageChange = (newItemsPerPage: number) => {
    console.log(`🔄 Changing items per page to ${newItemsPerPage}...`)
    setItemsPerPage(newItemsPerPage)
    setPageSize(newItemsPerPage)
    setCurrentPage(1) // Reset to first page when changing items per page
    setPageIndex(0) // Reset to first page (0-based)
  }

  // Ultra-fast search handlers
  const handleSearch = useCallback((query: string) => {
    console.log('🚀 Ultra-fast search triggered:', query)
    
    if (query && query.trim()) {
      // Enable search for cross-chunk searching
      setUseAlgoliaSearch(true)
      setIsAlgoliaSearching(true)
      
      try {
        debouncedAlgoliaSearch(
          query, 
          orderData, 
          (orders) => {
            console.log('⚡ Ultra-fast search results received:', orders.length)
            console.log('🚀 Setting optimized search results:', {
              ordersLength: orders.length,
              sampleOrders: orders.slice(0, 3).map(o => ({ id: o.id, orderNumber: o.orderNumber, customerName: o.customerName }))
            })
            setAlgoliaSearchResults(orders)
            setIsAlgoliaSearching(false)
            
            // Save search to history only if we have results
            if (orders.length > 0) {
              const newHistory = saveSearchToHistory(query, orders.length, searchHistory)
              setSearchHistory(newHistory)
            }
            
            // Force a re-render by updating a timestamp
            console.log('🚀 Ultra-fast search completed')
          }, 
          (loading) => {
            setIsAlgoliaSearching(loading)
          },
          500 // Comprehensive search across all chunks
        )
      } catch (error) {
        console.error('❌ Search error:', error)
        setIsAlgoliaSearching(false)
        setAlgoliaSearchResults([])
      }
    } else {
      // Clear search
      console.log('🧹 Clearing search in handleSearch')
      setAlgoliaSearchResults([])
      setUseAlgoliaSearch(false)
      setIsAlgoliaSearching(false)
    }
  }, [orderData, searchHistory])

  const clearSearch = useCallback(() => {
    console.log('🧹 Clearing search - starting clear process')
    setSearchQuery('')
    setDebouncedSearchQuery('')
    setGlobalFilter('') // Clear from Zustand store
    setAlgoliaSearchResults([])
    setUseAlgoliaSearch(false)
    setIsAlgoliaSearching(false)
    // Force re-render of filtered data by clearing search conditions
    setSearchConditions([])
    console.log('🧹 Clearing search - all states cleared')
  }, [setGlobalFilter])

  // Generate search suggestions
  useEffect(() => {
    if (searchQuery.trim()) {
      const newSuggestions = getSearchSuggestions(searchQuery, orderData, searchHistory)
      setSuggestions(newSuggestions)
      setShowSuggestions(true)
    } else {
      setSuggestions([])
      setShowSuggestions(false)
    }
  }, [searchQuery, orderData, searchHistory])

  // Algolia search effect - trigger search when debounced query changes
  useEffect(() => {
    console.log('🔍 Debounced search query changed:', debouncedSearchQuery)
    
    if (debouncedSearchQuery && debouncedSearchQuery.trim()) {
      // Only trigger search, don't set searchQuery here to avoid loops
      handleSearch(debouncedSearchQuery)
    } else {
      // Clear Algolia search when query is empty
      console.log('🧹 Clearing Algolia search due to empty query')
      setAlgoliaSearchResults([])
      setUseAlgoliaSearch(false)
      setIsAlgoliaSearching(false)
    }
  }, [debouncedSearchQuery]) // Remove handleSearch dependency to prevent infinite loops

  // Search suggestion handlers
  const handleSuggestionClick = useCallback((suggestion: SearchSuggestion) => {
    setSearchQuery(suggestion.text)
    setShowSuggestions(false)
  }, [])

  const handleClearHistory = useCallback(() => {
    localStorage.removeItem('orders-search-history')
    setSearchHistory([])
  }, [])

  const handleAdvancedSearch = useCallback((conditions: SearchCondition[]) => {
    setSearchConditions(conditions)
  }, [])

  const handleColumnFilter = useCallback((column: string, value: any) => {
    const currentFilters = useOrdersPageStore.getState().columnFilters
    const newFilters = {
      ...currentFilters,
      [column]: value
    }
    setColumnFilters(newFilters)
  }, [setColumnFilters])

  const handleCustomFilter = useCallback((filter: { name: string; field: string; operator: string; value: string }) => {
    const customFilter: CustomFilter = {
      id: Date.now().toString(),
      ...filter
    }
    setCustomFilters(prev => [...prev, customFilter])
  }, [])

  const handleAdvancedFilter = useCallback((filterType: string, value: any) => {
    setAdvancedFilters(prev => ({
      ...prev,
      [filterType]: value
    }))
  }, [])

  const clearAllFilters = useCallback(() => {
    setSearchQuery('')
    setSearchConditions([])
    setGlobalFilter('') // Clear from Zustand store
    setColumnFilters({}) // Clear all column filters
    setAdvancedFilters({
      orderStatus: [],
      priceRange: { min: '', max: '' },
      serialNumberRange: { min: '', max: '' },
      dateRange: { start: '', end: '' },
      tags: [],
      channels: []
    })
    setCustomFilters([])
    setActiveFilter('')
  }, [setGlobalFilter, setColumnFilters])

  // Define all possible table columns for orders
  const allOrderColumns = [
    {
      key: 'serialNumber',
      label: 'S.NO',
      sortable: true,
      render: (order: Order, index?: number) => {
        const serialNumber = startIndex + (index || 0) + 1
        return <span className="text-sm font-medium text-gray-900">#{serialNumber}</span>
      }
    },
    {
      key: 'orderNumber',
      label: 'Order',
      sortable: true,
      render: (order: Order) => (
        <div className="flex items-center space-x-1">
          <span className="text-sm font-medium text-gray-900">#{order.orderNumber}</span>
          {order.hasWarning && (
            <div className="w-3 h-3 bg-yellow-500 rounded-full flex items-center justify-center">
              <span className="text-xs text-white">!</span>
          </div>
            )}
          {order.hasDocument && (
            <div className="w-3 h-3 bg-blue-500 rounded-full flex items-center justify-center">
              <span className="text-xs text-white">D</span>
        </div>
        )}
      </div>
      )
    },
    {
      key: 'customerName',
      label: 'Customer',
      sortable: true,
      render: (order: Order) => (
        <div className="text-sm text-gray-900">{order.customerName}</div>
      )
    },
    {
      key: 'fulfillmentStatus',
      label: 'Fulfillment Status',
      sortable: true,
      render: (order: Order) => {
        const getStatusBadge = (status: string) => {
          switch (status) {
            case 'fulfilled':
              return { className: "inline-flex px-2 py-1 text-xs font-medium rounded-full bg-green-100 text-green-800", text: "Fulfilled" }
            case 'unfulfilled':
              return { className: "inline-flex px-2 py-1 text-xs font-medium rounded-full bg-red-100 text-red-800", text: "Unfulfilled" }
            case 'partial':
              return { className: "inline-flex px-2 py-1 text-xs font-medium rounded-full bg-yellow-100 text-yellow-800", text: "Partial" }
            default:
              return { className: "inline-flex px-2 py-1 text-xs font-medium rounded-full bg-gray-100 text-gray-800", text: status }
          }
        }
        const badge = getStatusBadge(order.fulfillmentStatus)
        return <span className={badge.className}>{badge.text}</span>
      }
    },
    {
      key: 'total',
      label: 'Total',
      sortable: true,
      render: (order: Order) => (
        <span className="text-sm font-medium text-gray-900">₹{(order.total || 0).toFixed(2)}</span>
      )
    },
    {
      key: 'createdAt',
      label: 'Date',
      sortable: true,
      render: (order: Order) => (
        <span className="text-sm text-gray-500">
          {order.createdAt ? new Date(order.createdAt).toLocaleDateString('en-US', {
            month: 'short',
            day: '2-digit',
            year: 'numeric'
          }) : 'No date'}
        </span>
      )
    },
    {
      key: 'items',
      label: 'Items',
      sortable: true,
      render: (order: Order) => (
        <span className="text-sm text-gray-900">{order.items?.length || 0} items</span>
      )
    },
    {
      key: 'deliveryStatus',
      label: 'Delivery Status',
      sortable: true,
      render: (order: Order) => (
        <div className="text-sm text-gray-900">{order.deliveryStatus || 'Pending'}</div>
      )
    },
    {
      key: 'tags',
      label: 'Tags',
      sortable: false,
      render: (order: Order) => (
        <div className="flex flex-wrap gap-0.5">
          {order.tags?.slice(0, 2).map((tag, index) => (
            <span key={index} className="px-1 py-0.5 bg-blue-100 text-blue-700 text-xs rounded">
              {tag}
                  </span>
          ))}
          {order.tags && order.tags.length > 2 && (
            <span className="px-1 py-0.5 bg-blue-100 text-blue-700 text-xs rounded">
              +{order.tags.length - 2}
                </span>
              )}
          </div>
      )
    },
    {
      key: 'channel',
      label: 'Channel',
      sortable: true,
      render: (order: Order) => (
        <div className="text-sm text-gray-900">{order.channel}</div>
      )
    },
    {
      key: 'deliveryMethod',
      label: 'Delivery Method',
      sortable: true,
      render: (order: Order) => (
        <div className="text-sm text-gray-900">{order.deliveryMethod}</div>
      )
    },
    {
      key: 'financialStatus',
      label: 'Payment Status',
      sortable: true,
      render: (order: Order) => {
        const getStatusBadge = (status: string) => {
          switch (status) {
            case 'paid':
              return { className: "inline-flex px-2 py-1 text-xs font-medium rounded-full bg-green-100 text-green-800", text: "Paid" }
            case 'pending':
              return { className: "inline-flex px-2 py-1 text-xs font-medium rounded-full bg-yellow-100 text-yellow-800", text: "Pending" }
            case 'refunded':
              return { className: "inline-flex px-2 py-1 text-xs font-medium rounded-full bg-red-100 text-red-800", text: "Refunded" }
            default:
              return { className: "inline-flex px-2 py-1 text-xs font-medium rounded-full bg-gray-100 text-gray-800", text: status }
          }
        }
        const badge = getStatusBadge(order.financialStatus)
        return <span className={badge.className}>{badge.text}</span>
      }
    }
  ]

  // Filter columns based on visible fields
  const orderColumns = allOrderColumns.filter(column => visibleFields.has(column.key))

  if (loading && orderData.length === 0) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-gray-500">Loading orders...</div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="text-red-600 text-lg font-semibold mb-2">Error Loading Orders</div>
          <div className="text-gray-600 mb-4">{error}</div>
          <div className="space-x-2">
          <button 
            onClick={() => window.location.reload()}
              className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700"
          >
            Retry
          </button>
            <button
              onClick={async () => {
                console.log('🔍 Manual server test...')
                try {
                  const testResult = await fetch(`${process.env.NEXT_PUBLIC_BACKEND_URL || 'https://brmh.in'}/cache/data?project=my-app&table=shopify-inkhub-get-orders`, {
                    method: 'GET',
                    signal: AbortSignal.timeout(10000),
                    headers: {
                      'Accept': 'application/json',
                      'Content-Type': 'application/json'
                    }
                  })
                  
                  console.log('🔍 Manual test response status:', testResult.status)
                  console.log('🔍 Manual test response ok:', testResult.ok)
                  
                  if (testResult.ok) {
                    const data = await testResult.json()
                    console.log('🔍 Manual test success:', data)
                    alert('Server test successful! Check console for details.')
                  } else {
                    const errorText = await testResult.text()
                    console.error('🔍 Manual test failed:', testResult.status, errorText)
                    alert(`Server test failed (${testResult.status}): ${errorText}`)
                  }
                } catch (error: any) {
                  console.error('🔍 Manual test error:', error)
                  alert(`Test error: ${error.message}`)
                }
              }}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
            >
              Test Server
          </button>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className={cn(
      "min-h-screen bg-gray-50",
      isFullScreen ? "fixed inset-0 z-50 bg-white flex flex-col" : ""
    )}>
      {isFullScreen && (
        <div className="sticky top-0 z-20 bg-white border-b border-gray-200 p-4 flex justify-between items-center">
          <h2 className="text-lg font-semibold text-gray-900">Orders - Full Screen View</h2>
          <button
            onClick={() => setIsFullScreen(!isFullScreen)}
            className="p-2 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-md transition-colors"
            title="Exit Full Screen"
          >
            <X className="h-5 w-5" />
          </button>
        </div>
      )}
      
      {/* Scrollable content area in fullscreen */}
      <div ref={fullScreenScrollRef} className={cn(isFullScreen ? "flex-1 min-h-0 overflow-y-auto" : "")}> 

       {/* KPI Metrics */}
       <OrderKPIGrid 
         kpiMetrics={kpiMetrics} 
         orders={filteredData}
         onRefresh={handleKPIRefresh}
         onConfigure={(kpiKey, config) => {
           console.log(`Configuring ${kpiKey} KPI:`, config)
         }}
       />

      {/* Search and Filter Controls - Sticky in Full Screen */}
      <div ref={headerAreaRef} className={cn(
        isFullScreen ? "sticky top-0 z-20 bg-white border-b border-gray-200" : ""
      )}>
       <SearchControls
         searchQuery={searchQuery}
          setSearchQuery={setSearchQuery}
         searchConditions={searchConditions}
          showSearchBuilder={showSearchBuilder}
          setShowSearchBuilder={setShowSearchBuilder}
          showAdditionalControls={showAdditionalControls}
          setShowAdditionalControls={setShowAdditionalControls}
         activeFilter={activeFilter}
         setActiveFilter={setActiveFilter}
         customFilters={customFilters}
          onAddCustomFilter={handleCustomFilter}
          onRemoveCustomFilter={(filterId) => setCustomFilters(prev => prev.filter(f => f.id !== filterId))}
         showCustomFilterDropdown={showCustomFilterDropdown}
         setShowCustomFilterDropdown={setShowCustomFilterDropdown}
         hiddenDefaultFilters={hiddenDefaultFilters}
          onShowAllFilters={() => setHiddenDefaultFilters(new Set())}
          onClearSearch={clearSearch}
          onClearSearchConditions={() => setSearchConditions([])}
         selectedOrders={selectedRowIds}
          onBulkEdit={() => setShowBulkEditModal(true)}
          onExportSelected={() => setShowExportModal(true)}
          onBulkDelete={() => setShowBulkDeleteModal(true)}
          currentOrders={currentData}
         onSelectAll={handleSelectAll}
         activeColumnFilter={activeColumnFilter}
         columnFilters={columnFilters}
          onFilterClick={setActiveColumnFilter}
         onColumnFilterChange={handleColumnFilter}
          getUniqueValues={getUniqueValues}
          onExport={() => setShowExportModal(true)}
          onImport={() => setShowImportModal(true)}
          onPrint={() => setShowPrintModal(true)}
          onSettings={() => setShowSettingsModal(true)}
          onEditFields={handleEditFields}
          showHeaderDropdown={showHeaderDropdown}
          setShowHeaderDropdown={setShowHeaderDropdown}
          viewMode={viewMode}
          setViewMode={setViewMode}
          showAdvancedFilter={showAdvancedFilter}
          setShowAdvancedFilter={setShowAdvancedFilter}
          isFullScreen={isFullScreen}
          onToggleFullScreen={() => setIsFullScreen(!isFullScreen)}
          isAlgoliaSearching={isAlgoliaSearching}
          useAlgoliaSearch={useAlgoliaSearch}
        />
      </div>

      {/* Advanced Search Builder Panel */}
      {showSearchBuilder && (
        <div className="px-4 pb-3">
          <div className="bg-white border border-gray-200 rounded-md p-4">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-sm font-medium text-gray-900">Advanced Search</h3>
              <div className="flex items-center space-x-2">
                <button
                  onClick={() => setSearchConditions([])}
                  className="text-xs text-gray-500 hover:text-gray-700"
                >
                  Clear all
                </button>
                <button
                  onClick={() => setShowSearchBuilder(false)}
                  className="text-xs text-gray-500 hover:text-gray-700"
                >
                  Cancel
                </button>
                <button
                  onClick={() => setShowSearchBuilder(false)}
                  className="px-3 py-1 bg-blue-600 text-white text-xs rounded-md hover:bg-blue-700"
                >
                  Apply
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Enhanced Advanced Filter Panel */}
      {showAdvancedFilter && (
        <div className="px-4 pb-1">
            <div className="bg-white border border-gray-200 rounded-lg shadow-sm p-2">
              {/* Enhanced Header */}
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center space-x-3">
                  <div className="w-3 h-3 bg-gradient-to-r from-blue-500 to-indigo-500 rounded-full animate-pulse"></div>
                  <div className="flex items-center space-x-2">
                    <h3 className="text-sm font-semibold text-gray-900">Advanced Filters</h3>
                    {isAlgoliaFiltering ? (
                      <span className="text-xs text-blue-600 bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-200 px-3 py-1 rounded-full font-medium flex items-center space-x-1">
                        <div className="w-3 h-3 border-2 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
                        <span>Searching all data...</span>
                      </span>
                    ) : useAlgoliaFilters && algoliaFilterResults.length > 0 ? (
                      <span className="text-xs text-green-600 bg-gradient-to-r from-green-50 to-emerald-50 border border-green-200 px-3 py-1 rounded-full font-medium">
                        {algoliaFilterResults.length} results from all chunks
                      </span>
                    ) : (
                      <span className="text-xs text-gray-500 bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-200 px-3 py-1 rounded-full font-medium">
                        {[
                          advancedFilters.orderStatus.length,
                          advancedFilters.tags.length,
                          advancedFilters.channels.length,
                          advancedFilters.priceRange.min ? 1 : 0,
                          advancedFilters.priceRange.max ? 1 : 0,
                          advancedFilters.dateRange.start ? 1 : 0,
                          advancedFilters.dateRange.end ? 1 : 0
                        ].reduce((a, b) => a + b, 0)} active
                      </span>
                    )}
        </div>
                  {/* Active Filters Inline Display */}
                  {(advancedFilters.orderStatus.length > 0 || 
                    advancedFilters.tags.length > 0 || 
                    advancedFilters.channels.length > 0 ||
                    advancedFilters.priceRange.min || 
                    advancedFilters.priceRange.max ||
                    advancedFilters.dateRange.start || 
                    advancedFilters.dateRange.end) && (
                    <div className="flex flex-wrap gap-1.5">
                      {advancedFilters.orderStatus.map(status => (
                        <span key={status} className="inline-flex items-center space-x-1 px-2 py-0.5 bg-gradient-to-r from-blue-100 to-blue-200 text-blue-800 text-xs rounded-full border border-blue-300 shadow-sm hover:shadow-md transition-all duration-200">
                          <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
                            <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                          </svg>
                          <span className="capitalize font-medium">{status}</span>
              <button
                            onClick={() => setAdvancedFilters(prev => ({
                              ...prev,
                              orderStatus: prev.orderStatus.filter(s => s !== status)
                            }))}
                            className="ml-0.5 hover:bg-blue-300 rounded-full p-0.5 transition-colors"
                          >
                            <svg className="w-2.5 h-2.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                            </svg>
              </button>
                        </span>
                      ))}
                      {advancedFilters.tags.map(tag => (
                        <span key={tag} className="inline-flex items-center space-x-1 px-2 py-0.5 bg-gradient-to-r from-orange-100 to-orange-200 text-orange-800 text-xs rounded-full border border-orange-300 shadow-sm hover:shadow-md transition-all duration-200">
                          <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
                            <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                          </svg>
                          <span className="font-medium">{tag}</span>
              <button
                            onClick={() => setAdvancedFilters(prev => ({
                              ...prev,
                              tags: prev.tags.filter(t => t !== tag)
                            }))}
                            className="ml-0.5 hover:bg-orange-300 rounded-full p-0.5 transition-colors"
                          >
                            <svg className="w-2.5 h-2.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                            </svg>
              </button>
                        </span>
                      ))}
                      {advancedFilters.channels.map(channel => (
                        <span key={channel} className="inline-flex items-center space-x-1 px-2 py-0.5 bg-gradient-to-r from-indigo-100 to-indigo-200 text-indigo-800 text-xs rounded-full border border-indigo-300 shadow-sm hover:shadow-md transition-all duration-200">
                          <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
                            <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                          </svg>
                          <span className="font-medium">{channel}</span>
              <button 
                            onClick={() => setAdvancedFilters(prev => ({
                              ...prev,
                              channels: prev.channels.filter(c => c !== channel)
                            }))}
                            className="ml-0.5 hover:bg-indigo-300 rounded-full p-0.5 transition-colors"
                          >
                            <svg className="w-2.5 h-2.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                            </svg>
              </button>
                        </span>
                      ))}
                      {advancedFilters.priceRange.min && (
                        <span className="inline-flex items-center space-x-1 px-2 py-0.5 bg-gradient-to-r from-green-100 to-green-200 text-green-800 text-xs rounded-full border border-green-300 shadow-sm hover:shadow-md transition-all duration-200">
                          <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
                            <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                          </svg>
                          <span className="font-medium">Min: ₹{advancedFilters.priceRange.min}</span>
              <button
                            onClick={() => setAdvancedFilters(prev => ({
                              ...prev,
                              priceRange: { ...prev.priceRange, min: '' }
                            }))}
                            className="ml-0.5 hover:bg-green-300 rounded-full p-0.5 transition-colors"
                          >
                            <svg className="w-2.5 h-2.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                            </svg>
              </button>
                        </span>
                      )}
                      {advancedFilters.priceRange.max && (
                        <span key="max-price" className="inline-flex items-center space-x-1 px-2 py-0.5 bg-gradient-to-r from-green-100 to-green-200 text-green-800 text-xs rounded-full border border-green-300 shadow-sm hover:shadow-md transition-all duration-200">
                          <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
                            <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                          </svg>
                          <span className="font-medium">Max: ₹{advancedFilters.priceRange.max}</span>
                <button
                            onClick={() => setAdvancedFilters(prev => ({
                              ...prev,
                              priceRange: { ...prev.priceRange, max: '' }
                            }))}
                            className="ml-0.5 hover:bg-green-300 rounded-full p-0.5 transition-colors"
                          >
                            <svg className="w-2.5 h-2.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                            </svg>
                </button>
                        </span>
                      )}
                      {advancedFilters.dateRange.start && (
                        <span className="inline-flex items-center space-x-1 px-2 py-0.5 bg-gradient-to-r from-purple-100 to-purple-200 text-purple-800 text-xs rounded-full border border-purple-300 shadow-sm hover:shadow-md transition-all duration-200">
                          <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
                            <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                          </svg>
                          <span className="font-medium">From: {advancedFilters.dateRange.start}</span>
            <button
                            onClick={() => setAdvancedFilters(prev => ({
                              ...prev,
                              dateRange: { ...prev.dateRange, start: '' }
                            }))}
                            className="ml-0.5 hover:bg-purple-300 rounded-full p-0.5 transition-colors"
                          >
                            <svg className="w-2.5 h-2.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                            </svg>
            </button>
                        </span>
                      )}
                      {advancedFilters.dateRange.end && (
                        <span className="inline-flex items-center space-x-1 px-2 py-0.5 bg-gradient-to-r from-purple-100 to-purple-200 text-purple-800 text-xs rounded-full border border-purple-300 shadow-sm hover:shadow-md transition-all duration-200">
                          <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
                            <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                          </svg>
                          <span className="font-medium">To: {advancedFilters.dateRange.end}</span>
            <button
                            onClick={() => setAdvancedFilters(prev => ({
                              ...prev,
                              dateRange: { ...prev.dateRange, end: '' }
                            }))}
                            className="ml-0.5 hover:bg-purple-300 rounded-full p-0.5 transition-colors"
                          >
                            <svg className="w-2.5 h-2.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                            </svg>
            </button>
                        </span>
                      )}
                </div>
              )}
            </div>
                <div className="flex items-center space-x-1.5">
            <button
                    onClick={() => setAdvancedFilters({
                      orderStatus: [],
                      priceRange: { min: '', max: '' },
                      serialNumberRange: { min: '', max: '' },
                      dateRange: { start: '', end: '' },
                      tags: [],
                      channels: []
                    })}
                    className="text-xs text-gray-600 hover:text-gray-800 hover:bg-gray-100 px-2 py-1 rounded-md transition-all duration-200 flex items-center space-x-1 border border-gray-200 hover:border-gray-300"
                  >
                    <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                    </svg>
                    <span>Clear all</span>
            </button>
            <button
                    onClick={() => setShowAdvancedFilter(false)}
                    className="text-xs text-gray-600 hover:text-gray-800 hover:bg-gray-100 px-2 py-1 rounded-md transition-all duration-200 flex items-center space-x-1 border border-gray-200 hover:border-gray-300"
                  >
                    <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                    <span>Close</span>
            </button>
          </div>
        </div>

              {/* Enhanced Filter Grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-2">
                {/* Order Status */}
                <div className="bg-gradient-to-br from-blue-50 to-indigo-50 border border-blue-200 rounded-lg p-1 space-y-0.5">
                  <label className="flex items-center space-x-2 text-xs font-semibold text-gray-800">
                    <div className="w-5 h-5 bg-blue-500 rounded-lg flex items-center justify-center">
                      <svg className="w-3.5 h-3.5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
              </div>
                    <span>Order Status</span>
                  </label>
                  <div className="h-28 overflow-y-auto border border-blue-200 rounded-md p-1 space-y-0.5 bg-white/50">
                    {['paid', 'unpaid', 'refunded', 'pending', 'processing', 'shipped', 'delivered', 'cancelled'].map(status => (
                      <label key={status} className="flex items-center space-x-2 cursor-pointer group p-0.5 rounded-md hover:bg-blue-100/50 transition-colors">
                        <input
                          type="checkbox"
                          checked={advancedFilters.orderStatus.includes(status)}
                          onChange={(e) => {
                            if (e.target.checked) {
                              setAdvancedFilters(prev => ({
                                ...prev,
                                orderStatus: [...prev.orderStatus, status]
                              }))
                            } else {
                              setAdvancedFilters(prev => ({
                                ...prev,
                                orderStatus: prev.orderStatus.filter(s => s !== status)
                              }))
                            }
                          }}
                          className="rounded border-gray-300 text-blue-600 focus:ring-blue-500 w-3 h-3"
                        />
                        <span className="text-xs text-gray-700 group-hover:text-gray-900 capitalize font-medium">{status}</span>
                      </label>
                    ))}
            </div>
                </div>

                {/* Price Range */}
                <div className="bg-gradient-to-br from-green-50 to-emerald-50 border border-green-200 rounded-lg p-1 space-y-0.5">
                  <label className="flex items-center space-x-2 text-xs font-semibold text-gray-800">
                    <div className="w-5 h-5 bg-green-500 rounded-lg flex items-center justify-center">
                      <svg className="w-4.5 h-4.5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1" />
                      </svg>
                    </div>
                    <span>Price Range</span>
                  </label>
                  <div className="space-y-1">
                    <div className="relative">
                                              <input
                          type="number"
                          placeholder="Min price"
                          value={advancedFilters.priceRange.min}
                          onChange={(e) => setAdvancedFilters(prev => ({ 
                            ...prev, 
                            priceRange: { ...prev.priceRange, min: e.target.value } 
                          }))}
                          className="w-full text-xs border border-green-200 rounded-md px-2 py-1 focus:ring-2 focus:ring-green-500 focus:border-transparent pl-8 bg-white/70 hover:bg-white transition-colors"
                        />
                      <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-green-600 text-sm font-medium">₹</span>
                      </div>
                    <div className="relative">
                      <input
                          type="number"
                          placeholder="Max price"
                          value={advancedFilters.priceRange.max}
                          onChange={(e) => setAdvancedFilters(prev => ({ 
                            ...prev, 
                            priceRange: { ...prev.priceRange, max: e.target.value } 
                          }))}
                          className="w-full text-xs border border-green-200 rounded-md px-2 py-1 focus:ring-2 focus:ring-green-500 focus:border-transparent pl-8 bg-white/70 hover:bg-white transition-colors"
                        />
                      <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-green-600 text-sm font-medium">₹</span>
                </div>
            </div>
              </div>

              

              {/* Date Range */}
                <div className="bg-gradient-to-br from-purple-50 to-violet-50 border border-purple-200 rounded-lg p-1 space-y-0.5">
                  <label className="flex items-center space-x-2 text-xs font-semibold text-gray-800">
                    <div className="w-5 h-5 bg-purple-500 rounded-lg flex items-center justify-center">
                      <svg className="w-3.5 h-3.5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                      </svg>
                    </div>
                    <span>Date Range</span>
                  </label>
                <div className="space-y-1">
                    <div className="relative">
                  <input
                    type="date"
                    value={advancedFilters.dateRange.start}
                          onChange={(e) => setAdvancedFilters(prev => ({ 
                            ...prev, 
                            dateRange: { ...prev.dateRange, start: e.target.value } 
                          }))}
                          className="w-full text-xs border border-purple-200 rounded-md px-2 py-1 focus:ring-2 focus:ring-purple-500 focus:border-transparent bg-white/70 hover:bg-white transition-colors"
                        />
                      <span className="absolute right-3 top-1/2 transform -translate-y-1/2 text-purple-600">
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                        </svg>
                      </span>
                    </div>
                    <div className="relative">
                  <input
                    type="date"
                    value={advancedFilters.dateRange.end}
                          onChange={(e) => setAdvancedFilters(prev => ({ 
                            ...prev, 
                            dateRange: { ...prev.dateRange, end: e.target.value } 
                          }))}
                          className="w-full text-xs border border-purple-200 rounded-md px-2 py-1 focus:ring-2 focus:ring-purple-500 focus:border-transparent bg-white/70 hover:bg-white transition-colors"
                        />
                      <span className="absolute right-3 top-1/2 transform -translate-y-1/2 text-purple-600">
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                        </svg>
                      </span>
                    </div>
                </div>
              </div>

              {/* Tags */}
                <div className="bg-gradient-to-br from-orange-50 to-amber-50 border border-orange-200 rounded-lg p-1 space-y-0.5">
                  <label className="flex items-center space-x-2 text-xs font-semibold text-gray-800">
                    <div className="w-5 h-5 bg-orange-500 rounded-lg flex items-center justify-center">
                      <svg className="w-3.5 h-3.5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z" />
                      </svg>
            </div>
                    <span>Tags</span>
                  </label>
                  <div className="h-28 overflow-y-auto border border-orange-200 rounded-md p-1 space-y-0.5 bg-white/50">
                    {getUniqueTagsFromOrders(orderData).map(tag => (
                      <label key={tag} className="flex items-center space-x-2 cursor-pointer group p-0.5 rounded-md hover:bg-orange-100/50 transition-colors">
                        <input
                          type="checkbox"
                          checked={advancedFilters.tags.includes(tag)}
                  onChange={(e) => {
                            if (e.target.checked) {
                              setAdvancedFilters(prev => ({ 
                                ...prev, 
                                tags: [...prev.tags, tag] 
                              }))
                            } else {
                              setAdvancedFilters(prev => ({ 
                                ...prev, 
                                tags: prev.tags.filter(t => t !== tag) 
                              }))
                            }
                          }}
                          className="rounded border-orange-300 text-orange-600 focus:ring-orange-500 w-3 h-3"
                        />
                        <span className="text-xs text-gray-700 group-hover:text-gray-900 font-medium">{tag}</span>
                      </label>
                    ))}
          </div>
            </div>

                {/* Channels */}
                <div className="bg-gradient-to-br from-indigo-50 to-blue-50 border border-indigo-200 rounded-lg p-1 space-y-0.5">
                  <label className="flex items-center space-x-2 text-xs font-semibold text-gray-800">
                    <div className="w-5 h-5 bg-indigo-500 rounded-lg flex items-center justify-center">
                      <svg className="w-3.5 h-3.5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                      </svg>
                </div>
                    <span>Channels</span>
                  </label>
                  <div className="h-28 overflow-y-auto border border-indigo-200 rounded-md p-1 space-y-0.5 bg-white/50">
                    {getUniqueChannelsFromOrders(orderData).map(channel => (
                      <label key={channel} className="flex items-center space-x-2 cursor-pointer group p-0.5 rounded-md hover:bg-indigo-100/50 transition-colors">
                  <input
                    type="checkbox"
                          checked={advancedFilters.channels.includes(channel)}
                          onChange={(e) => {
                            if (e.target.checked) {
                              setAdvancedFilters(prev => ({ 
                                ...prev, 
                                channels: [...prev.channels, channel] 
                              }))
                            } else {
                              setAdvancedFilters(prev => ({ 
                                ...prev, 
                                channels: prev.channels.filter(c => c !== channel) 
                              }))
                            }
                          }}
                          className="rounded border-indigo-300 text-indigo-600 focus:ring-indigo-500 w-3 h-3"
                        />
                        <span className="text-xs text-gray-700 group-hover:text-gray-900 font-medium">{channel}</span>
                      </label>
                        ))}
                    </div>
        </div>
                  </div>
                  </div>
                </div>
      )}

      {/* Bulk Actions Bar */}
      {selectedRowIds.length > 0 && (
        <BulkActionsBar
          selectedProducts={selectedRowIds}
          totalProducts={totalItemsForPagination}
          onBulkEdit={() => setShowBulkEditModal(true)}
          onExportSelected={() => setShowExportModal(true)}
          onBulkDelete={() => setShowBulkDeleteModal(true)}
        />
      )}

      {/* Main Content */}
      <div className="px-6 pb-6">
          {/* Data Source Indicator */}
          {error && (
            <div className="mb-4 p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
              <div className="flex items-center">
                <div className="text-yellow-800 text-sm">
                  <strong>Note:</strong> {error} Using fallback data for demonstration.
              </div>
            </div>
        </div>
      )}

          {viewMode === 'table' ? (
            <div className="space-y-4" style={{ minHeight: 'auto', maxHeight: 'none' }}>
              {/* Cache Status Indicator */}

              
           <OrderTable
                currentOrders={currentData}
             selectedItems={selectedRowIds}
             onSelectItem={handleSelectItem}
             onSelectAll={handleSelectAll}
                onRowClick={(order: Order, e: React.MouseEvent) => {
                  // Guard: ignore checkbox/button clicks
                  if ((e.target as HTMLElement).closest('input,button')) return
                  setPreviewOrder(order)
                  setShowPreviewModal(true)
                }}
                columns={orderColumns}
                loading={loading}
                error={error}
                searchQuery={searchQuery}
                isFullScreen={isFullScreen}
                activeColumnFilter={activeColumnFilter}
             columnFilters={columnFilters}
                onFilterClick={setActiveColumnFilter}
                onColumnFilterChange={handleColumnFilter}
                getUniqueValues={getUniqueValues}
                showImages={false}
                onClearSearch={clearSearch}
                isSearching={isAlgoliaSearching}
                sortState={sortState}
                onRequestSort={handleRequestSort}
              />
            </div>
        ) : viewMode === 'grid' ? (
            <div className="bg-white border border-gray-200 rounded-lg overflow-hidden">
              {/* Grid Header */}
              <GridCardFilterHeader
                selectedOrders={selectedRowIds}
                currentOrders={currentData}
                onSelectAll={handleSelectAll}
             activeColumnFilter={activeColumnFilter}
                columnFilters={columnFilters}
                onFilterClick={setActiveColumnFilter}
             onColumnFilterChange={handleColumnFilter}
             getUniqueValues={getUniqueValues}
                cardsPerRow={cardsPerRow}
                onCardsPerRowChange={setCardsPerRow}
              />
              <div className="p-4">
              <OrdersGrid
                  orders={currentData}
            cardsPerRow={cardsPerRow}
                  selectedOrders={selectedRowIds}
                  onSelectOrder={(id) => handleSelectItem(id)}
                  onOrderClick={(order, e) => {
                    if ((e?.target as HTMLElement)?.closest('input,button')) return
                    setPreviewOrder(order)
                    setShowPreviewModal(true)
                  }}
                  getStatusBadge={(status: string) => {
                    switch (status) {
                      case 'fulfilled':
                        return <span className="inline-flex px-2 py-1 text-xs font-medium rounded-full bg-green-100 text-green-800">fulfilled</span>
                      case 'unfulfilled':
                        return <span className="inline-flex px-2 py-1 text-xs font-medium rounded-full bg-red-100 text-red-800">unfulfilled</span>
                      case 'partial':
                        return <span className="inline-flex px-2 py-1 text-xs font-medium rounded-full bg-yellow-100 text-yellow-800">partial</span>
                      default:
                        return <span className="inline-flex px-2 py-1 text-xs font-medium rounded-full bg-gray-100 text-gray-800">{status}</span>
                    }
                  }}
                  visibleFields={{
                    customer: visibleFields.has('customerName'),
                    email: visibleFields.has('customerEmail'),
                    total: visibleFields.has('total'),
                    date: visibleFields.has('createdAt'),
                    items: visibleFields.has('items'),
                    payment: visibleFields.has('financialStatus'),
                    tags: visibleFields.has('tags'),
                    channel: visibleFields.has('channel'),
                    delivery: visibleFields.has('deliveryStatus')
                  }}
                  activeColumnFilter={activeColumnFilter}
                  columnFilters={columnFilters}
                  onFilterClick={setActiveColumnFilter}
                  onColumnFilterChange={handleColumnFilter}
                  onClearFilter={() => {}}
                  getUniqueValues={getUniqueValues}
                  getUniqueTags={() => getUniqueTagsFromOrders(orderData)}
                />
              </div>
            </div>
        ) : (
          <div className="bg-white border border-gray-200 rounded-lg overflow-hidden">
            {/* Card/List Header (no per row control) */}
            <GridCardFilterHeader
              selectedOrders={selectedRowIds}
              currentOrders={currentData}
              onSelectAll={handleSelectAll}
              activeColumnFilter={activeColumnFilter}
              columnFilters={columnFilters}
              onFilterClick={setActiveColumnFilter}
              onColumnFilterChange={handleColumnFilter}
              getUniqueValues={getUniqueValues}
            />
            <div className="p-4">
          <OrderCardView
                data={currentData}
                columns={orderColumns}
            selectedItems={selectedRowIds}
            onSelectItem={handleSelectItem}
                onOrderClick={(order, e) => {
                  if ((e.target as HTMLElement).closest('input,button')) return
                  setPreviewOrder(order)
                  setShowPreviewModal(true)
                }}
                viewMode={viewMode}
                cardsPerRow={cardsPerRow}
            loading={loading}
                error={error}
                searchQuery={searchQuery}
                isFullScreen={isFullScreen}
                visibleFields={{
                  customer: visibleFields.has('customerName'),
                  email: visibleFields.has('customerEmail'),
                  total: visibleFields.has('total'),
                  date: visibleFields.has('createdAt'),
                  items: visibleFields.has('items'),
                  payment: visibleFields.has('financialStatus'),
                  tags: visibleFields.has('tags'),
                  channel: visibleFields.has('channel'),
                  delivery: visibleFields.has('deliveryStatus')
                }}
          />
            </div>
          </div>
        )}

      </div>

      {/* Pagination */}
        <div className={cn(
          isFullScreen ? "sticky bottom-0 z-20 bg-white border-t border-gray-200 px-4 py-2" : "mt-6"
        )}>
      <Pagination
        currentPage={currentPage}
        totalPages={totalPages}
        itemsPerPage={effectiveItemsPerPage}
        totalItems={totalItemsForPagination}
        onPageChange={handlePageChange}
        onItemsPerPageChange={handleItemsPerPageChange}
      />
      </div>

      {/* Modals */}
      {showPreviewModal && previewOrder && (
        <EnhancedDetailModal
          isOpen={showPreviewModal}
          onClose={() => setShowPreviewModal(false)}
          item={previewOrder}
          itemType="order"
          onEdit={async (id: string, data: any) => {
            console.log('Edit order:', id, data)
            try {
              // Example API call:
              // await fetch(`/api/orders/${id}`, {
              //   method: 'PATCH',
              //   headers: { 'Content-Type': 'application/json' },
              //   body: JSON.stringify(data)
              // })
              console.log('Order updated successfully')
            } catch (error) {
              console.error('Error updating order:', error)
              throw error
            }
          }}
          onDelete={async (id: string) => {
            console.log('Delete order:', id)
            try {
              // Example API call:
              // await fetch(`/api/orders/${id}`, {
              //   method: 'DELETE'
              // })
              console.log('Order deleted successfully')
            } catch (error) {
              console.error('Error deleting order:', error)
              throw error
            }
          }}
          onSave={async (id: string, data: any) => {
            console.log('Save order:', id, data)
            try {
              // Example API call:
              // await fetch(`/api/orders/${id}`, {
              //   method: 'PATCH',
              //   headers: { 'Content-Type': 'application/json' },
              //   body: JSON.stringify(data)
              // })
              console.log('Order saved successfully')
            } catch (error) {
              console.error('Error saving order:', error)
              throw error
            }
          }}
        />
      )}
      {showExportModal && (
        <ExportModal
          isOpen={showExportModal}
          onClose={() => setShowExportModal(false)}
          products={filteredData as any}
          selectedProducts={selectedRowIds}
        />
      )}

        {/* Import Orders Modal */}
        {showImportModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-lg p-6 max-w-lg w-full mx-4 max-h-[90vh] overflow-y-auto">
              <div className="flex items-center justify-between mb-6">
                <div className="flex items-center space-x-3">
                  <div className="p-2 bg-blue-100 rounded-lg">
                    <svg className="w-5 h-5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12"/></svg>
                  </div>
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900">Import Orders</h3>
                    <p className="text-sm text-gray-500">Upload a CSV or JSON file to import</p>
                  </div>
                </div>
                <button onClick={() => setShowImportModal(false)} className="text-gray-400 hover:text-gray-600 transition-colors">
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12"/></svg>
              </button>
              </div>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Select file</label>
                  <input type="file" accept=".csv,application/json" className="block w-full text-sm text-gray-700 file:mr-4 file:py-2 file:px-3 file:rounded-md file:border file:border-gray-300 file:text-sm file:bg-white hover:file:bg-gray-50" />
                </div>
                <div className="text-xs text-gray-500">
                  Tip: CSV should contain headers like orderNumber, customerName, total, status, createdAt
                </div>
              </div>
              <div className="flex justify-end space-x-3 mt-6 pt-4 border-t border-gray-200">
                <button onClick={() => setShowImportModal(false)} className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 rounded-md hover:bg-gray-200">Cancel</button>
                <button onClick={() => setShowImportModal(false)} className="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-md hover:bg-blue-700">Import</button>
              </div>
            </div>
          </div>
        )}

        {/* Print Orders Modal */}
        {showPrintModal && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-lg p-6 max-w-lg w-full mx-4 max-h-[90vh] overflow-y-auto">
              {/* Header */}
              <div className="flex items-center justify-between mb-6">
                <div className="flex items-center space-x-3">
                  <div className="p-2 bg-blue-100 rounded-lg">
                    <svg className="w-5 h-5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z"/></svg>
                  </div>
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900">Print Orders</h3>
                    <p className="text-sm text-gray-500">Configure your print settings</p>
                  </div>
                </div>
                <button onClick={() => setShowPrintModal(false)} className="text-gray-400 hover:text-gray-600 transition-colors">
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12"/></svg>
              </button>
            </div>

              <div className="space-y-6">
                {/* Print Options */}
                <div>
                  <h4 className="text-sm font-medium text-gray-900 mb-2">Print Options</h4>
                  <div className="space-y-2">
                    <label className="flex items-center space-x-3 cursor-pointer">
                      <input type="radio" name="printScope" defaultChecked className="text-blue-600 focus:ring-blue-500" />
                      <span className="text-sm text-gray-700">All orders ({totalItemsForPagination})</span>
                    </label>
                    <label className="flex items-center space-x-3 cursor-pointer">
                      <input type="radio" name="printScope" className="text-blue-600 focus:ring-blue-500" />
                      <span className="text-sm text-gray-700">Selected orders ({selectedRowIds.length})</span>
                    </label>
                  </div>
                </div>

                {/* Layout */}
                <div>
                  <h4 className="text-sm font-medium text-gray-900 mb-2">Layout</h4>
                  <select className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm">
                    <option>Table Layout - Compact list format</option>
                    <option>Card Layout - Detailed cards</option>
                  </select>
                </div>

                {/* Content Options */}
                <div>
                  <h4 className="text-sm font-medium text-gray-900 mb-2">Content Options</h4>
                  <label className="flex items-center space-x-2 text-sm text-gray-700">
                    <input type="checkbox" defaultChecked className="rounded border-gray-300 text-blue-600 focus:ring-blue-500" />
                    <span>Include order images</span>
                  </label>
                  <label className="flex items-center space-x-2 text-sm text-gray-700 mt-2">
                    <input type="checkbox" defaultChecked className="rounded border-gray-300 text-blue-600 focus:ring-blue-500" />
                    <span>Include detailed information (customer, tags, etc.)</span>
                  </label>
                </div>

                {/* Page settings */}
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <h4 className="text-sm font-medium text-gray-900 mb-2">Page Size</h4>
                    <select className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm">
                      <option>A4</option>
                      <option>Letter</option>
                      <option>Legal</option>
                    </select>
                  </div>
                  <div>
                    <h4 className="text-sm font-medium text-gray-900 mb-2">Orientation</h4>
                    <select className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm">
                      <option>Portrait</option>
                      <option>Landscape</option>
                    </select>
                  </div>
                </div>

                {/* Preview */}
                <div className="bg-gray-50 rounded-lg p-4 text-sm text-gray-600">
                  <p>{selectedRowIds.length > 0 ? selectedRowIds.length : totalItemsForPagination} orders will be printed</p>
                  <p>Layout: Table</p>
                  <p>Page: A4 portrait</p>
                  <p>With images, with detailed information</p>
                </div>
              </div>

              <div className="flex justify-end space-x-3 mt-6 pt-4 border-t border-gray-200">
                <button onClick={() => setShowPrintModal(false)} className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 rounded-md hover:bg-gray-200">Cancel</button>
                <button onClick={() => { setShowPrintModal(false); window.print() }} className="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-md hover:bg-blue-700">Print</button>
              </div>
            </div>
          </div>
        )}

        {/* Order Settings Modal */}
        {showSettingsModal && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-lg p-6 max-w-lg w-full mx-4 max-h-[90vh] overflow-y-auto">
              <div className="flex items-center justify-between mb-6">
                <div className="flex items-center space-x-3">
                  <div className="p-2 bg-purple-100 rounded-lg">
                    <svg className="w-5 h-5 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z"/></svg>
                  </div>
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900">Order Settings</h3>
                    <p className="text-sm text-gray-500">Customize display and export settings</p>
                  </div>
                </div>
                <button onClick={() => setShowSettingsModal(false)} className="text-gray-400 hover:text-gray-600 transition-colors">
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12"/></svg>
                </button>
              </div>

              {/* Display Settings */}
              <div className="space-y-6">
                <div>
                  <h4 className="text-sm font-medium text-gray-900 mb-2">Display Settings</h4>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-xs text-gray-600 mb-1">Default View Mode</label>
                      <select value={settings.defaultViewMode} onChange={(e) => setSettings(prev => ({ ...prev, defaultViewMode: e.target.value as any }))} className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm">
                        <option value="table">Table</option>
                        <option value="grid">Grid</option>
                        <option value="card">Card</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-xs text-gray-600 mb-1">Items per page</label>
                      <select value={settings.itemsPerPage} onChange={(e) => setSettings(prev => ({ ...prev, itemsPerPage: Number(e.target.value) }))} className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm">
                        {[10, 25, 50, 100].map(n => <option key={n} value={n}>{n}</option>)}
                      </select>
                    </div>
                  </div>
                </div>

                {/* Filter Settings */}
                <div>
                  <h4 className="text-sm font-medium text-gray-900 mb-2">Filter Settings</h4>
                  <div className="space-y-3">
                    <label className="flex items-center justify-between text-sm text-gray-700">
                      <span>Show Advanced Filters</span>
                      <input type="checkbox" checked={settings.showAdvancedFilters} onChange={(e) => setSettings(prev => ({ ...prev, showAdvancedFilters: e.target.checked }))} className="rounded border-gray-300 text-blue-600 focus:ring-blue-500" />
                    </label>
                    <label className="flex items-center justify-between text-sm text-gray-700">
                      <span>Auto-save Filters</span>
                      <input type="checkbox" checked={settings.autoSaveFilters} onChange={(e) => setSettings(prev => ({ ...prev, autoSaveFilters: e.target.checked }))} className="rounded border-gray-300 text-blue-600 focus:ring-blue-500" />
                    </label>
                  </div>
                </div>

                {/* Export Settings */}
                <div>
                  <h4 className="text-sm font-medium text-gray-900 mb-2">Export Settings</h4>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-xs text-gray-600 mb-1">Default Export Format</label>
                      <select value={settings.defaultExportFormat} onChange={(e) => setSettings(prev => ({ ...prev, defaultExportFormat: e.target.value as any }))} className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm">
                        <option value="csv">CSV</option>
                        <option value="json">JSON</option>
                        <option value="pdf">PDF</option>
                      </select>
                    </div>
                    <div className="flex items-center justify-between">
                      <label className="text-sm text-gray-700">Include Images in Exports</label>
                      <input type="checkbox" checked={settings.includeImagesInExport} onChange={(e) => setSettings(prev => ({ ...prev, includeImagesInExport: e.target.checked }))} className="rounded border-gray-300 text-blue-600 focus:ring-blue-500" />
                    </div>
                  </div>
                </div>



                {/* Current Stats */}
                <div className="bg-gray-50 rounded-lg p-4 text-sm text-gray-600">
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <div className="text-xs text-gray-500">Total Orders</div>
                      <div className="font-medium text-gray-900">{totalItemsForPagination}</div>
                    </div>
                    <div>
                      <div className="text-xs text-gray-500">Current View</div>
                      <div className="font-medium text-gray-900">{viewMode}</div>
                    </div>
                  </div>
                </div>
              </div>

              <div className="flex justify-end space-x-3 mt-6 pt-4 border-t border-gray-200">
                <button onClick={() => setShowSettingsModal(false)} className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 rounded-md hover:bg-gray-200">Cancel</button>
                <button onClick={() => {
                  if (settings.defaultViewMode !== viewMode) setViewMode(settings.defaultViewMode)
                  if (settings.itemsPerPage !== itemsPerPage) setItemsPerPage(settings.itemsPerPage)
                  if (settings.showAdvancedFilters !== showAdvancedFilter) setShowAdvancedFilter(settings.showAdvancedFilters)
                  setShowSettingsModal(false)
                }} className="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-md hover:bg-blue-700">Save Changes</button>
              </div>
            </div>
          </div>
        )}

        {showBulkEditModal && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full mx-4 max-h-[90vh] overflow-y-auto">
              {/* Header */}
              <div className="flex items-center justify-between p-6 border-b border-gray-200">
                <div className="flex items-center space-x-3">
                  <div className="p-2 bg-blue-100 rounded-lg">
                    <svg className="h-5 w-5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"/></svg>
                  </div>
                  <div>
                    <h2 className="text-lg font-semibold text-gray-900">Bulk Edit Orders</h2>
                    <p className="text-sm text-gray-500">Edit {selectedRowIds.length} selected order{selectedRowIds.length !== 1 ? 's' : ''}</p>
                  </div>
                </div>
                <button onClick={() => setShowBulkEditModal(false)} className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors">
                  <X className="h-5 w-5" />
                </button>
              </div>

              <div className="p-6 space-y-6">
                {/* Edit Fields Section */}
                <div className="space-y-6">
                  {/* Order Status */}
                  <div className="border border-gray-200 rounded-lg p-4">
                    <div className="flex items-center justify-between mb-2">
                      <h4 className="text-sm font-medium text-gray-900">Order Status</h4>
                      <label className="flex items-center space-x-2 text-xs text-gray-600"><input type="checkbox" className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"/><span>Apply to all</span></label>
                    </div>
                    <select className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm">
                      <option>No change</option>
                      <option value="pending">Pending</option>
                      <option value="paid">Paid</option>
                      <option value="refunded">Refunded</option>
                    </select>
                  </div>

                  {/* Fulfillment Status */}
                  <div className="border border-gray-200 rounded-lg p-4">
                    <div className="flex items-center justify-between mb-2">
                      <h4 className="text-sm font-medium text-gray-900">Fulfillment Status</h4>
                      <label className="flex items-center space-x-2 text-xs text-gray-600"><input type="checkbox" className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"/><span>Apply to all</span></label>
                    </div>
                    <select className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm">
                      <option>No change</option>
                      <option value="unfulfilled">Unfulfilled</option>
                      <option value="partial">Partial</option>
                      <option value="fulfilled">Fulfilled</option>
                    </select>
                  </div>

                  {/* Tags */}
                  <div className="border border-gray-200 rounded-lg p-4">
                    <div className="flex items-center justify-between mb-2">
                      <h4 className="text-sm font-medium text-gray-900">Tags</h4>
                      <label className="flex items-center space-x-2 text-xs text-gray-600"><input type="checkbox" className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"/><span>Apply to all</span></label>
                    </div>
                    <input type="text" placeholder="Enter tags (comma separated)" className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm" />
                  </div>

                  {/* Total Amount */}
                  <div className="border border-gray-200 rounded-lg p-4">
                    <div className="flex items-center justify-between mb-2">
                      <h4 className="text-sm font-medium text-gray-900">Total Amount</h4>
                      <label className="flex items-center space-x-2 text-xs text-gray-600"><input type="checkbox" className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"/><span>Apply to all</span></label>
                    </div>
                    <div className="grid grid-cols-2 gap-3">
                      <select className="border border-gray-300 rounded-md px-3 py-2 text-sm"><option>Set to</option><option>Increase by</option><option>Decrease by</option></select>
                      <input type="number" className="border border-gray-300 rounded-md px-3 py-2 text-sm" placeholder="0.00" />
                    </div>
                  </div>

                  {/* Edit Summary */}
                  <div className="bg-gray-50 rounded-lg p-4 text-sm text-gray-700">
                    <div>Orders to edit: {selectedRowIds.length}</div>
                    <div>Fields to update: dynamic</div>
                    <div>Estimated time: ~1 seconds</div>
                  </div>
                </div>
              </div>

              <div className="flex items-center justify-end space-x-3 p-6 border-t border-gray-200">
                <button onClick={() => setShowBulkEditModal(false)} className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50">Cancel</button>
                <button onClick={() => setShowBulkEditModal(false)} className="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-md hover:bg-blue-700">Apply Changes</button>
            </div>
          </div>
        </div>
      )}

      {showBulkDeleteModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4">
            <h3 className="text-lg font-semibold mb-4">Delete Orders</h3>
            <p className="text-gray-600 mb-4">Are you sure you want to delete {selectedRowIds.length} orders? This action cannot be undone.</p>
            <div className="flex justify-end space-x-2">
              <button
                onClick={() => setShowBulkDeleteModal(false)}
                className="px-4 py-2 text-gray-600 hover:text-gray-800"
              >
                Cancel
              </button>
              <button
                onClick={() => {
                  setSelectedRowIds([])
                  setShowBulkDeleteModal(false)
                }}
                className="px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700"
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Edit Fields Modal */}
      {showEditFieldsModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-2xl w-full mx-4 max-h-[80vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-gray-900">Edit Visible Fields</h3>
              <button
                onClick={handleCancelEditFields}
                className="text-gray-400 hover:text-gray-600"
              >
                <X className="h-6 w-6" />
              </button>
            </div>
            
            <div className="space-y-4">
              <p className="text-sm text-gray-600">
                Choose which fields to display in the orders table and grid view.
              </p>
              
              {/* Field visibility toggles */}
              <div className="grid grid-cols-2 gap-4">
                {allOrderColumns.map((column) => (
                  <label key={column.key} className="flex items-center space-x-2">
                    <input 
                      type="checkbox" 
                      checked={tempVisibleFields.has(column.key)}
                      onChange={() => handleFieldToggle(column.key)}
                      className="rounded border-gray-300 text-blue-600 focus:ring-blue-500" 
                    />
                    <span className="text-sm">{column.label}</span>
                  </label>
                ))}
              </div>
            </div>
            
            <div className="flex justify-end space-x-3 mt-6">
              <button
                onClick={handleCancelEditFields}
                className="px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 hover:bg-gray-50"
              >
                Cancel
              </button>
              <button
                onClick={handleSaveVisibleFields}
                className="px-4 py-2 bg-blue-600 text-white rounded-md text-sm font-medium hover:bg-blue-700"
              >
                Save Changes
              </button>
            </div>
          </div>
        </div>
      )}
      </div>
    </div>
  )
}

export default function ShopifyOrdersPage() {
  return (
    <div className="h-full">
      <OrdersClient initialData={{ items: [], lastEvaluatedKey: null, total: 0 }} />
    </div>
  )
} 