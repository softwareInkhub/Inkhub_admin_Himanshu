'use client'

import { useEffect, useState, useCallback, useMemo, useRef } from 'react'
import { useAppStore } from '@/lib/store'
import { useDashboardSync } from '@/lib/dashboardSync'
import { useOrdersPageStore } from '@/lib/stores/orders-page-store'
import { UrlStateProvider } from '@/components/UrlStateProvider'
import { cn } from '@/lib/utils'
import { X, Columns } from 'lucide-react'
import { thinScrollbarStyles } from '@/components/shared/styles/scrollbarStyles'
import { debounce } from '../products/utils/advancedSearch'
import { debouncedAlgoliaSearch, searchOrdersWithAdvancedFilters } from './utils/algoliaSearch'
import { parseAdvancedSearchQuery, applyAdvancedSearch } from './utils/advancedSearch'
import { SearchHistory, saveSearchToHistory, SearchSuggestion, getSearchSuggestions } from './utils/searchSuggestions'

import OrderKPIGrid from '@/components/shared/OrderKPIGrid'
import OrderTable from '@/components/shared/OrderTable'
import OrderCardView from '@/components/shared/OrderCardView'
import OrdersGrid from '@/components/shared/OrdersGrid'
import SearchControls from '@/components/shared/SearchControls'
// Using enhanced shared components for better consistency across all pages
import { 
  GridCardFilterHeader, 
  Pagination, 
  ExportModal,
  EnhancedDetailModal,
  KPIGrid,
  HighlightedText,
  ImageDisplay,
  SaveViewModal,
  useSavedViews,
  type GridFilterColumn 
} from '@/components/shared'
import GridColumnHeader from '@/components/shared/GridColumnHeader'
import KPIHeaderActions from '@/components/shared/KPIHeaderActions'
import CardsPerRowDropdown from '@/components/shared/CardsPerRowDropdown'
import { generateOrderColumnHeaders } from '@/components/shared/utils/columnHeaderUtils'
import { Order, SearchCondition, CustomFilter } from './types'
import { 
  generateOrders as generateOrdersData,
  getUniqueTagsFromOrders,
  getUniqueChannelsFromOrders
} from './utils'
import { getOrdersForPage, getTotalChunks } from './services/orderService'

// JSON Column Customization
import { useJsonColumns } from './hooks/useJsonColumns'
import ColumnManager from '@/components/shared/ColumnManager'
import ColumnsQuickToggle from '@/components/shared/ColumnsQuickToggle'
import { generateEnhancedCellRenderer } from './utils/columnGenerator'

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
  const { notifyDashboard } = useDashboardSync()
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

  // Grid filter columns configuration for shared component
  const gridFilterColumns: GridFilterColumn[] = [
    { key: 'serialNumber', label: 'S.NO', filterType: 'numeric' },
    { key: 'orderNumber', label: 'ORDER', filterType: 'text' },
    { key: 'customerName', label: 'CUSTOMER', filterType: 'text' },
    { key: 'status', label: 'STATUS', filterType: 'select', options: ['pending', 'paid', 'refunded', 'partial', 'unfulfilled'] },
    { key: 'fulfillmentStatus', label: 'FULFILLMENT', filterType: 'select', options: ['fulfilled', 'partial', 'unfulfilled'] },
    { key: 'financialStatus', label: 'PAYMENT', filterType: 'select', options: ['paid', 'pending', 'refunded', 'partial'] },
    { key: 'total', label: 'TOTAL', filterType: 'numeric' },
    { key: 'channel', label: 'CHANNEL', filterType: 'multi-select' },
    { key: 'deliveryMethod', label: 'DELIVERY', filterType: 'multi-select' },
    { key: 'tags', label: 'TAGS', filterType: 'multi-select' },
    { key: 'createdAt', label: 'CREATED', filterType: 'date' },
    { key: 'updatedAt', label: 'UPDATED', filterType: 'date' },
  ]

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
    if (typeof window !== "undefined") {
      try { window.history.scrollRestoration = "manual" } catch {}
    }
    requestAnimationFrame(() => {
      requestAnimationFrame(() => {
        if (scrollY > 0) {
          const scroller = document.querySelector('[data-scroll-group="page-table"]') as HTMLElement | null
          if (scroller) scroller.scrollTop = scrollY
          else window.scrollTo({ top: scrollY, behavior: "instant" as ScrollBehavior })
        }
      })
    })
    if (scrollY > 0) {
      const scroller = document.querySelector('[data-scroll-group="page-table"]') as HTMLElement | null
      if (scroller) scroller.scrollTop = scrollY
      else window.scrollTo({ top: scrollY, behavior: "instant" as ScrollBehavior })
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

  // Continuously persist scroll position while scrolling (throttled via rAF)
  useEffect(() => {
    let raf = 0 as number | any
    const onScroll = () => {
      if (raf) return
      raf = requestAnimationFrame(() => {
        const scroller = document.querySelector('[data-scroll-group="page-table"]') as HTMLElement | null
        const y = scroller ? scroller.scrollTop : window.scrollY
        setScrollY(y)
        raf = 0
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
  // Skip one Algolia cycle after applying a saved view for instant local results
  const skipNextAlgoliaRef = useRef(false)

  // Two-way sync: persist local input to store and hydrate input from store
  useEffect(() => {
    if (searchQuery !== useOrdersPageStore.getState().globalFilter) {
      setGlobalFilter(searchQuery)
    }
  }, [searchQuery, setGlobalFilter])

  useEffect(() => {
    if (globalFilter !== searchQuery) {
      setSearchQuery(globalFilter)
      setDebouncedSearchQuery(globalFilter)
    }
  }, [globalFilter])

  // JSON Column Customization
  const {
    selectedFields,
    showJsonKeys,
    customLabels,
    columns: jsonColumns,
    toggleField,
    saveColumnConfig,
    resetToDefault: resetJsonColumns,
    setShowJsonKeys,
    isLoading: isLoadingColumns,
    showColumnManager,
    openColumnManager,
    closeColumnManager
  } = useJsonColumns({ 
    userId: useAppStore.getState().currentUser?.id || 'anonymous',
    searchQuery: debouncedSearchQuery 
  })

  // Advanced Filter states
  // Persist advanced filter open/closed in store for parity with Products
  const showAdvancedFilter = useOrdersPageStore((s: any) => s.showAdvancedFilter)
  const setShowAdvancedFilter = useOrdersPageStore((s: any) => s.setShowAdvancedFilter)
  
  // Advanced Filters Algolia search function
  const handleAdvancedFiltersAlgoliaSearch = useCallback(async (filters: {
    orderStatus?: string[]
    priceRange?: { min?: string; max?: string }
    dateRange?: { start?: string; end?: string }
    tags?: string[]
    channels?: string[]
  }) => {
    // Reduce console noise - only log occasionally in development
    if (Math.random() < 0.1 && process.env.NODE_ENV === 'development') {
      console.log('🔍 Advanced Filters Algolia search triggered with:', filters)
    }
    
    // Check if any filters are active
    const hasActiveFilters = (
      (filters.orderStatus && filters.orderStatus.length > 0) ||
      (filters.priceRange && (filters.priceRange.min || filters.priceRange.max)) ||
      (filters.dateRange && (filters.dateRange.start || filters.dateRange.end)) ||
      (filters.tags && filters.tags.length > 0) ||
      (filters.channels && filters.channels.length > 0)
    )
    
    if (!hasActiveFilters) {
      if (Math.random() < 0.1 && process.env.NODE_ENV === 'development') {
        console.log('🔍 No active filters, clearing Algolia filter results')
      }
      setAlgoliaFilterResults([])
      setUseAlgoliaFilters(false)
      setIsAlgoliaFiltering(false)
      return
    }
    
    if (Math.random() < 0.1 && process.env.NODE_ENV === 'development') {
      console.log('🔍 Active filters detected, starting Algolia search')
    }
    setUseAlgoliaFilters(true)
    setIsAlgoliaFiltering(true)
    
    try {
      const results = await searchOrdersWithAdvancedFilters(
        filters,
        orderData,
        140 // Total chunks
      )
      
      if (Math.random() < 0.1 && process.env.NODE_ENV === 'development') {
        console.log('✅ Advanced Filters Algolia search completed:', results.length, 'results')
      }
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
  
  // Trigger Algolia search when Advanced Filters change (debounced for better performance)
  useEffect(() => {
    if (!showAdvancedFilter) return
    
    // Debounce the search to avoid triggering on every keystroke
    const debounceTimer = setTimeout(() => {
      handleAdvancedFiltersAlgoliaSearch(advancedFilters)
    }, 500) // 500ms delay
    
    return () => clearTimeout(debounceTimer)
  }, [advancedFilters, showAdvancedFilter])

  // Map ALL table column filters to Algolia search (supports all 81+ columns)
  useEffect(() => {
    // Build derived filters from column filters
    const derived = {
      orderStatus: [] as string[],
      financialStatus: [] as string[],
      priceRange: { min: '', max: '' } as { min?: string; max?: string },
      dateRange: { start: '', end: '' } as { start?: string; end?: string },
      tags: [] as string[],
      channels: [] as string[],
      customerText: '' as string,
      orderNumberText: '' as string,
    }

    const cf = columnFilters || {}
    const has = (v: any) => Array.isArray(v) ? v.length > 0 : (v !== undefined && v !== null && String(v) !== '')

    // Specific field mappings for advanced filter fields
    // fulfillmentStatus -> orderStatus (case-insensitive)
    if (has(cf['fulfillmentStatus']) || has(cf['fulfillment_status'])) {
      const val = cf['fulfillmentStatus'] || cf['fulfillment_status']
      derived.orderStatus = Array.isArray(val) ? val as string[] : [String(val)]
    }
    
    // financialStatus -> financialStatus
    if (has(cf['financialStatus']) || has(cf['financial_status'])) {
      const val = cf['financialStatus'] || cf['financial_status']
      derived.financialStatus = Array.isArray(val) ? val as string[] : [String(val)]
    }
    
    // total/price fields -> priceRange (support ">N", "<N", "=N") or direct number
    const priceFields = ['total', 'totalPrice', 'currentTotalPrice', 'total_price', 'current_total_price']
    for (const field of priceFields) {
      if (has(cf[field])) {
        const v = String(cf[field]).trim()
        if (v.startsWith('>')) derived.priceRange.min = v.slice(1)
        else if (v.startsWith('<')) derived.priceRange.max = v.slice(1)
        else if (v.startsWith('=')) { derived.priceRange.min = v.slice(1); derived.priceRange.max = v.slice(1) }
        else if (!isNaN(Number(v))) { derived.priceRange.min = v; derived.priceRange.max = v }
        break // Only use first matching price field
      }
    }
    
    // Date fields -> dateRange (exact-day match)
    const dateFields = ['createdAt', 'created_at', 'updatedAt', 'updated_at', 'processedAt', 'processed_at']
    for (const field of dateFields) {
      if (has(cf[field])) {
        const d = String(cf[field])
        derived.dateRange.start = d
        derived.dateRange.end = d
        break // Only use first matching date field
      }
    }
    
    // tags -> tags array
    if (has(cf['tags'])) {
      derived.tags = Array.isArray(cf['tags']) ? cf['tags'] as string[] : [String(cf['tags'])]
    }
    
    // channel/source -> channels array
    const channelFields = ['channel', 'sourceName', 'source_name']
    for (const field of channelFields) {
      if (has(cf[field])) {
        const val = cf[field]
        derived.channels = Array.isArray(val) ? val as string[] : [String(val)]
        break
      }
    }
    
    // Customer name fields -> customerText
    const customerFields = ['customerName', 'customer_name', 'customer.firstName', 'customer.first_name']
    for (const field of customerFields) {
      if (has(cf[field])) {
        derived.customerText = String(cf[field])
        break
      }
    }
    
    // Order number fields -> orderNumberText
    const orderFields = ['orderNumber', 'order_number', 'name', 'number']
    for (const field of orderFields) {
      if (has(cf[field])) {
        derived.orderNumberText = String(cf[field])
        break
      }
    }

    const filtersActive = (
      derived.orderStatus.length > 0 ||
      derived.financialStatus.length > 0 ||
      !!derived.priceRange.min || !!derived.priceRange.max ||
      !!derived.dateRange.start || !!derived.dateRange.end ||
      derived.tags.length > 0 ||
      derived.channels.length > 0 ||
      !!derived.customerText ||
      !!derived.orderNumberText ||
      // Check if there are ANY other column filters (for generic text search)
      Object.keys(cf).filter(k => has(cf[k])).length > 0
    )

    if (filtersActive) {
      handleAdvancedFiltersAlgoliaSearch(derived)
    } else {
      // Clear Algolia mode when no column filters
      setUseAlgoliaFilters(false)
      setAlgoliaFilterResults([])
      setIsAlgoliaFiltering(false)
    }
  }, [columnFilters, handleAdvancedFiltersAlgoliaSearch])

  // Column Header Filter states - using Zustand store
  const [activeColumnFilter, setActiveColumnFilter] = useState<string | null>(null)

  // Custom Filter states
  const [showCustomFilterDropdown, setShowCustomFilterDropdown] = useState(false)
  const [customFilters, setCustomFilters] = useState<CustomFilter[]>([])
  
  // Default filter states
  const [hiddenDefaultFilters, setHiddenDefaultFilters] = useState<Set<string>>(new Set())
  
  // View and control states (persisted in store for parity with Products)
  const viewMode = useOrdersPageStore((s: any) => s.viewMode)
  const setStoredViewMode = useOrdersPageStore((s: any) => s.setViewMode)
  const setViewMode = (mode: 'table' | 'grid' | 'card') => setStoredViewMode(mode)
  const [showAdditionalControls, setShowAdditionalControls] = useState(false)
  
  // Pagination states - MOVED BEFORE useSavedViews to fix initialization order
  const [currentPage, setCurrentPage] = useState(pageIndex + 1) // Convert 0-based to 1-based
  const [itemsPerPage, setItemsPerPage] = useState(pageSize)
  
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
  const [isFullScreen, setIsFullScreen] = useState(false)
  
  // Export handler for shared component
  const handleExportAction = (config: { format: string; columns: string[]; selectedOnly: boolean; includeImages: boolean }) => {
    console.log('Export action triggered:', config)
    setShowExportModal(false)
  }
  const fullScreenScrollRef = useRef<HTMLDivElement>(null)
  const tableScrollRef = useRef<HTMLDivElement>(null)
  
  // Saved Views - Using generic hook
  const savedViews = useSavedViews({
    storageKey: 'orders-saved-views',
    currentState: {
      searchQuery,
      searchConditions,
      columnFilters: {},
      customFilters,
      advancedFilters,
      sortColumn: sorting[0]?.id || '',
      sortDirection: sorting[0]?.desc ? 'desc' : 'asc',
      viewMode,
      itemsPerPage
    },
    onApply: (state) => {
      // Apply saved view state
      if (state.searchQuery !== undefined) setSearchQuery(state.searchQuery)
      if (state.searchConditions !== undefined) setSearchConditions(state.searchConditions)
      if (state.customFilters !== undefined) setCustomFilters(state.customFilters)
      if (state.advancedFilters !== undefined) setAdvancedFilters(state.advancedFilters)
      if (state.sortColumn !== undefined && state.sortDirection !== undefined) {
        setSorting([{ id: state.sortColumn, desc: state.sortDirection === 'desc' }])
      }
      if (state.viewMode !== undefined) setViewMode(state.viewMode as any)
      if (state.itemsPerPage !== undefined) setItemsPerPage(state.itemsPerPage)
    }
  });
  
  
  // Table row density toggle
  const [rowDensity, setRowDensity] = useState<'compact' | 'comfortable'>('compact')
  // External header filter dropdown state
  const [headerFilterDropdown, setHeaderFilterDropdown] = useState<{
    column: string
    position: { x: number; y: number }
  } | null>(null)

  // Compute a robust dropdown position that keeps the popover on-screen
  const computeFilterDropdownPosition = useCallback((anchor: DOMRect) => {
    const viewportWidth = typeof window !== 'undefined' ? window.innerWidth : 0
    const viewportHeight = typeof window !== 'undefined' ? window.innerHeight : 0
    const dropdownWidth = 260
    const dropdownHeight = 320
    const gutter = 6

    // Preferred placement: bottom-right of anchor
    let x = anchor.right + gutter
    let y = anchor.bottom + gutter

    // If overflowing right, place to the left
    if (x + dropdownWidth > viewportWidth) {
      x = anchor.left - dropdownWidth - gutter
    }
    // If still overflowing or too close, clamp to viewport with small margin
    x = Math.max(gutter, Math.min(x, viewportWidth - dropdownWidth - gutter))

    // If overflowing bottom, place above
    if (y + dropdownHeight > viewportHeight) {
      y = anchor.top - dropdownHeight - gutter
    }
    // Clamp vertically as well
    y = Math.max(gutter, Math.min(y, viewportHeight - dropdownHeight - gutter))

    return { x, y }
  }, [])

  const openHeaderFilter = useCallback((column: string, e: React.MouseEvent) => {
    const rect = (e.currentTarget as HTMLElement).getBoundingClientRect()
    const position = computeFilterDropdownPosition(rect)
    setActiveColumnFilter(column)
    setHeaderFilterDropdown({ column, position })
  }, [setActiveColumnFilter, computeFilterDropdownPosition])

  const closeHeaderFilter = useCallback(() => {
    setHeaderFilterDropdown(null)
    setActiveColumnFilter(null)
  }, [setActiveColumnFilter])

  // Auto-close header filter dropdown on scroll/resize/Escape for better UX
  useEffect(() => {
    if (!headerFilterDropdown) return
    const handleAnyScroll = () => closeHeaderFilter()
    const handleResize = () => closeHeaderFilter()
    const handleKey = (ev: KeyboardEvent) => { if (ev.key === 'Escape') closeHeaderFilter() }
    // Use capture phase to catch scrolls inside containers
    window.addEventListener('scroll', handleAnyScroll, true)
    window.addEventListener('resize', handleResize)
    document.addEventListener('keydown', handleKey)
    return () => {
      window.removeEventListener('scroll', handleAnyScroll, true)
      window.removeEventListener('resize', handleResize)
      document.removeEventListener('keydown', handleKey)
    }
  }, [headerFilterDropdown, closeHeaderFilter])

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


  // Handle save visible fields
  const handleSaveVisibleFields = () => {
    setVisibleFields(tempVisibleFields)
  }
  
  // Pagination states already declared above before useSavedViews (lines 471-472)
  // const [currentPage, setCurrentPage] = useState(pageIndex + 1)
  // const [itemsPerPage, setItemsPerPage] = useState(pageSize)
  
  // handleApplySavedSearch removed - now using savedViews.handleApplyView from generic hook
  // Note: Algolia search trigger will be handled by the savedViews.onApply callback
  
  // Legacy function kept for reference - logic moved to savedViews.onApply
  /*
  const handleApplySavedSearch = useCallback((savedSearch: any) => {
    console.log('💾 Applying saved search:', savedSearch.viewName);
    const safeSearchQuery = savedSearch.searchQuery || savedSearch.searchState?.searchQuery || '';
    setSearchQuery(safeSearchQuery);
    setSearchConditions(savedSearch.searchConditions || savedSearch.searchState?.searchConditions || []);
    setColumnFilters(savedSearch.columnFilters || savedSearch.searchState?.columnFilters || {});
    setCustomFilters(savedSearch.customFilters || savedSearch.searchState?.customFilters || []);
    setSorting((savedSearch.sortColumn || savedSearch.searchState?.sortColumn) ? [{ id: savedSearch.sortColumn || savedSearch.searchState?.sortColumn, desc: (savedSearch.sortDirection || savedSearch.searchState?.sortDirection) === 'desc' }] : []);
    setViewMode(savedSearch.viewMode || savedSearch.searchState?.viewMode || 'table');
    setItemsPerPage(savedSearch.itemsPerPage || savedSearch.searchState?.itemsPerPage || 50);
    // 2) Kick off cross-chunk Algolia search in background to upgrade results to full set
    if (safeSearchQuery && safeSearchQuery.trim()) {
      setUseAlgoliaSearch(true)
      setIsAlgoliaSearching(true)
      try {
        debouncedAlgoliaSearch(
          safeSearchQuery,
          orderData,
          (orders: Order[]) => {
            setAlgoliaSearchResults(orders)
            setIsAlgoliaSearching(false)
          },
          (loading) => setIsAlgoliaSearching(loading),
          500
        )
      } catch {}
    } else {
      // No search query, just apply filters
      setUseAlgoliaSearch(false)
      setIsAlgoliaSearching(false)
      setAlgoliaSearchResults([])
    }
  }, [setSearchQuery, setSearchConditions, setColumnFilters, setCustomFilters, setSorting, setViewMode, setItemsPerPage, orderData]);
  */
  
  // handleDeleteSavedSearch removed - now using savedViews.handleDeleteView from generic hook
  /*
  const handleDeleteSavedSearch = useCallback(async (id: string) => {
    console.log('🗑️ Attempting to delete saved search with ID:', id)
    
    try {
      const savedSearch = savedSearches.find(s => s.id === id)
      if (!savedSearch) {
        console.warn('⚠️ Saved search not found with ID:', id)
        return
      }
      
      console.log('🗑️ Deleting saved search:', savedSearch.viewName)
      
      // Optimistically update UI first for instant feedback
      setSavedSearches(prev => {
        const next = prev.filter(s => s.id !== id)
        try { 
          if (typeof window !== 'undefined') {
            localStorage.setItem('orders-saved-views:shopify-inkhub-get-orders', JSON.stringify(next))
            console.log('✅ Updated localStorage after deletion')
          }
        } catch (e) {
          console.error('❌ Failed to update localStorage:', e)
        }
        return next
      })
      
      // CRUD API removed - only localStorage operations
      console.log('✅ Deleted saved search from localStorage:', savedSearch.viewName)
    } catch (error) {
      console.error('❌ Failed to delete saved search:', error)
      // Even if API fails, UI is already updated for better UX
    }
  }, [savedSearches]);
  */
  
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
  // useEffect(() => {
  //   if (settings.defaultViewMode && settings.defaultViewMode !== viewMode) {
  //     setViewMode(settings.defaultViewMode)
  //   }
  // }, [settings.defaultViewMode, viewMode])
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
  }, [settings.itemsPerPage, itemsPerPage])

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


    // Load orders data for current page with INSTANT CACHING
  useEffect(() => {
    const loadOrders = async () => {
      // Ultra-fast in-memory cache for instant tab switching in-session
      try {
        if (typeof window !== 'undefined') {
          // eslint-disable-next-line @typescript-eslint/ban-ts-comment
          // @ts-ignore
          const mem = window.__ordersCache as { data: Order[]; timestamp: number; page: number; perPage: number } | undefined
          if (mem && Array.isArray(mem.data) && mem.data.length > 0 && mem.page === currentPage && mem.perPage === itemsPerPage) {
            setOrderData(mem.data)
            setIsDataLoaded(true)
            setLoading(false)
            setError(null)
            // Soft background refresh
            setTimeout(() => refreshOrdersInBackground(currentPage, itemsPerPage), 300)
            return
          }
        }
      } catch {}
      // One-time cleanup: remove old v1 cache entries (only on first load)
      if (typeof window !== 'undefined' && !sessionStorage.getItem('orders-cache-cleaned-v2')) {
        try {
          Object.keys(localStorage).forEach(key => {
            if (key.startsWith('orders-cache-') && !key.includes('-v2-')) {
              localStorage.removeItem(key)
            }
          })
          sessionStorage.setItem('orders-cache-cleaned-v2', 'true')
        } catch (e) {
          // Silently fail
        }
      }

      // Prevent duplicate runs in StrictMode for same page/perPage if we already have data or valid cache
      const guardKey = `${currentPage}-${itemsPerPage}`
      if (loadGuardRef.current === guardKey && (orderData.length > 0 || isCacheValid)) {
        return
      }
      loadGuardRef.current = guardKey

      // Check cache first for INSTANT loading
      // v2: includes full raw nested data for JSON columns
      const currentCacheKey = `orders-cache-v2-${currentPage}-${itemsPerPage}`
      const cached = localStorage.getItem(currentCacheKey)
      
      if (cached) {
        try {
          const parsed = JSON.parse(cached)
          const now = Date.now()
          const cacheAge = now - (parsed.timestamp || 0)
          const cacheTTL = 10 * 60 * 1000 // 10 minutes TTL
          
          if (cacheAge < cacheTTL && parsed.data && Array.isArray(parsed.data)) {
            // INSTANT loading from cache
            setOrderData(parsed.data)
            setTotalOrders(parsed.totalOrders || parsed.data.length)
            setIsDataLoaded(true)
            setCacheKey(currentCacheKey)
            setIsCacheValid(true)
            setCacheTimestamp(parsed.timestamp)
            
            // Notify dashboard that orders data has been loaded from cache
            notifyDashboard('orders')
            setLoading(false)
            
            // Background refresh if cache is older than 5 minutes
            if (cacheAge > 5 * 60 * 1000) {
              setTimeout(() => refreshOrdersInBackground(currentPage, itemsPerPage), 2000)
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
        
        // Notify dashboard that orders data has been updated
        notifyDashboard('orders')
        
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
            try {
              // eslint-disable-next-line @typescript-eslint/ban-ts-comment
              // @ts-ignore
              window.__ordersCache = { data: result.orders, timestamp: Date.now(), page: currentPage, perPage: itemsPerPage }
            } catch {}
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

  // Background refresh function
  const refreshOrdersInBackground = async (page: number, perPage: number) => {
    try {
      const result = await getOrdersForPage(page, perPage)
      if (result.orders.length > 0) {
        const cacheKey = `orders-cache-v2-${page}-${perPage}`
        const cacheData = {
          data: result.orders,
          totalOrders: result.totalChunks * 500,
          timestamp: Date.now(),
          chunk: result.currentChunk,
          page,
          itemsPerPage: perPage,
          globalSorted: true
        }
        localStorage.setItem(cacheKey, JSON.stringify(cacheData))
        
        // Update current data if it's the active page
        if (page === currentPage && perPage === itemsPerPage) {
          setOrderData(result.orders)
          setTotalOrders(result.totalChunks * 500)
        }
      }
    } catch (error) {
      // Silently fail background refresh
    }
  }

  // Preload next page for seamless navigation
  const preloadNextPage = async (page: number, perPage: number) => {
    const nextCacheKey = `orders-cache-v2-${page}-${perPage}`
    
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

  // Comprehensive KPI calculations - real data calculation
  
  const [comprehensiveKPIs, setComprehensiveKPIs] = useState<{
    totalOrders: number
    paidOrders: number
    liveOrders: number
    fulfilledOrders: number
    totalValue: number
    avgOrderValue: number
  } | null>(null)
  const [isCalculatingKPIs, setIsCalculatingKPIs] = useState(false)
  const [kpisCachedAge, setKpisCachedAge] = useState<number | null>(null)

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

  // ============================================================
  // Filter and search logic - ALL via Algolia (NO LOCAL SEARCH)
  // All searches and filters are case-insensitive and handled server-side
  // ============================================================
  const filteredData = useMemo(() => {
    // Reduced logging for better performance
    const shouldLog = process.env.NODE_ENV === 'development' && Math.random() < 0.05 // Only 5% of the time
    
    // Start with deduplicated order data
    let filtered = deduplicatedOrderData
    
    // Priority 1: Use Algolia filter results if Advanced Filters are active
    if (useAlgoliaFilters && algoliaFilterResults.length > 0) {
      if (shouldLog) {
      console.log('🔍 Using Algolia Advanced Filters results:', algoliaFilterResults.length, 'orders')
      }
      filtered = algoliaFilterResults
    }
    
    // Priority 2: Use Algolia search results if search query is active
    else if (debouncedSearchQuery && debouncedSearchQuery.trim() && useAlgoliaSearch && algoliaSearchResults.length > 0) {
      // Deduplicate Algolia results
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
      
      if (shouldLog) {
        console.log('🔍 Using Algolia search results:', filtered.length, 'orders')
      }
    }
    
    // Priority 3: Show all local data when no filters/search active
    else if (!debouncedSearchQuery || !debouncedSearchQuery.trim()) {
      // Show all local data - no logging needed for performance
    }

    // NO LOCAL FILTERING - All filters are handled by Algolia
    // Column filters and advanced filters are already applied server-side
    
    return filtered
  }, [deduplicatedOrderData, useAlgoliaSearch, algoliaSearchResults, useAlgoliaFilters, algoliaFilterResults, debouncedSearchQuery, columnFilters, advancedFilters])

  // Pagination - Orders uses chunk-based system where each page loads a new chunk
  // Each chunk is fetched based on currentPage via getOrdersForPage()
  // The itemsPerPage controls how we slice the current chunk's data for display
  const startIndex = 0
  const endIndex = Math.min(itemsPerPage, filteredData.length)
  const currentData = useMemo(() => {
    // When Algolia filters are active, show all results without slicing
    if (useAlgoliaFilters && algoliaFilterResults.length > 0) {
      return filteredData
    }
    // For chunk-based system: slice the current chunk data based on itemsPerPage
    // This allows user to see 10, 25, 50, 100, 200, or 500 items from the current chunk
    return filteredData.slice(0, itemsPerPage)
  }, [filteredData, itemsPerPage, useAlgoliaFilters, algoliaFilterResults])

  // Calculate total pages and items based on current data source (AFTER filteredData is defined)
  // Use Algolia filter results if active, otherwise use comprehensive KPIs for total count
  const totalItemsForPagination = useAlgoliaFilters && algoliaFilterResults.length > 0 
    ? algoliaFilterResults.length 
    : (comprehensiveKPIs?.totalOrders || totalOrders || 69811)
  
  // Total pages calculation:
  // For chunk-based system, we have 140 chunks total, each with ~500 orders
  // Total pages = 140 (one page per chunk, regardless of itemsPerPage setting)
  const totalPages = useAlgoliaFilters && algoliaFilterResults.length > 0
    ? Math.ceil(algoliaFilterResults.length / itemsPerPage)
    : 140 // Fixed 140 pages (140 chunks)
  
  // Debug logging for pagination when Algolia filters are active (reduced frequency)
  if (useAlgoliaFilters && algoliaFilterResults.length > 0 && process.env.NODE_ENV === 'development' && Math.random() < 0.05) {
    console.log('🔍 Algolia Filter Pagination Debug:', {
      algoliaResultsLength: algoliaFilterResults.length,
      totalItemsForPagination,
      totalPages,
      currentPage,
      itemsPerPage,
      useAlgoliaFilters
    })
  }
  
  // Debug logging for currentData when Algolia filters are active (reduced frequency)
  if (useAlgoliaFilters && algoliaFilterResults.length > 0 && process.env.NODE_ENV === 'development' && Math.random() < 0.02) {
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
    
    // Only warn about significant mismatches (not expected filtering differences)
    const lengthDifference = Math.abs(currentData.length - algoliaFilterResults.length)
    if (lengthDifference > 5) { // Only warn if difference is more than 5 orders
      console.warn('⚠️ Significant data length mismatch detected:', {
        currentDataLength: currentData.length,
        algoliaFilterResultsLength: algoliaFilterResults.length,
        difference: lengthDifference,
        note: 'Small differences are expected due to additional local filtering'
      })
    }
  }
  
  // Debug: Log current data for display (only when search is active and reduced frequency)
  if (debouncedSearchQuery && debouncedSearchQuery.trim() && process.env.NODE_ENV === 'development' && Math.random() < 0.1) {
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
  
  // Calculate comprehensive KPIs with INSTANT CACHING
  useEffect(() => {
    let isMounted = true
    
    const calculateOptimizedKPIs = async () => {
      // Cache configuration
      const CACHE_KEY = 'orders-comprehensive-kpis'
      const CACHE_TTL = 30 * 60 * 1000 // 30 minutes cache
      
      // Background calculation functions (defined before usage)
      const calculateRealKPIs = async () => {
        if (!isMounted) return
        
        try {
          const { getTotalChunks, fetchChunk } = await import('./services/orderService')
          const totalChunks = await getTotalChunks()
          
          // Use smaller sample size for faster calculation
          const sampleSize = 3
          const sampleChunks = []
          for (let i = 0; i < sampleSize; i++) {
            const randomChunk = Math.floor(Math.random() * (totalChunks - 1))
            sampleChunks.push(randomChunk)
          }
          
          // Fetch sample chunks in parallel
          const samplePromises = sampleChunks.map(chunkNum => 
            fetchChunk(chunkNum).catch(() => [])
          )
          const sampleResults = await Promise.all(samplePromises)
          const sampleOrders = sampleResults.flat()
          
          if (sampleOrders.length === 0 || !isMounted) return
          
          // Calculate statistics from sample
          const samplePaidRate = sampleOrders.filter(order => order.financialStatus === 'paid').length / sampleOrders.length
          const sampleFulfilledRate = sampleOrders.filter(order => order.fulfillmentStatus === 'fulfilled').length / sampleOrders.length
          const sampleLiveRate = sampleOrders.filter(order => 
            order.status === 'processing' || 
            order.status === 'shipped' || 
            order.fulfillmentStatus === 'partial'
          ).length / sampleOrders.length
          const sampleAvgValue = sampleOrders.reduce((sum, order) => sum + (order.total || 0), 0) / sampleOrders.length
          
          // Extrapolate to full dataset
          const estimatedTotalOrders = (totalChunks - 1) * 500 + 311
          const realKPIs = {
            totalOrders: estimatedTotalOrders,
            paidOrders: Math.round(estimatedTotalOrders * samplePaidRate),
            liveOrders: Math.round(estimatedTotalOrders * sampleLiveRate),
            fulfilledOrders: Math.round(estimatedTotalOrders * sampleFulfilledRate),
            totalValue: Math.round(estimatedTotalOrders * sampleAvgValue),
            avgOrderValue: Math.round(sampleAvgValue * 100) / 100
          }
          
          if (isMounted) {
            setComprehensiveKPIs(realKPIs)
            
            // Cache the results
            localStorage.setItem(CACHE_KEY, JSON.stringify({
              data: realKPIs,
              timestamp: Date.now()
            }))
            setKpisCachedAge(0)
          }
        } catch (error) {
          // Silently fail background calculation
        }
      }
      
      const refreshKPIsInBackground = async () => {
        if (!isMounted) return
        calculateRealKPIs()
      }

      try {
        // Check for cached KPIs first - instant loading
        
        const cached = localStorage.getItem(CACHE_KEY)
        if (cached) {
          try {
            const { data, timestamp } = JSON.parse(cached)
            const cacheAge = Date.now() - timestamp
            
            if (cacheAge < CACHE_TTL) {
              // Instant loading from cache
              setComprehensiveKPIs(data)
              setIsCalculatingKPIs(false)
              setKpisCachedAge(cacheAge)
              
              // Background refresh if cache is older than 10 minutes
              if (cacheAge > 10 * 60 * 1000) {
                setTimeout(() => refreshKPIsInBackground(), 2000)
              }
              return
            }
          } catch (e) {
            // Silently handle invalid cache
          }
        }
        
        // Set fallback KPIs immediately for instant UI
        const fallbackKPIs = {
          totalOrders: 69811,
          paidOrders: 55849,
          liveOrders: 9075,
          fulfilledOrders: 60736,
          totalValue: 25481015,
          avgOrderValue: 365
        }
        
        setComprehensiveKPIs(fallbackKPIs)
        setIsCalculatingKPIs(false)
        
        
        // Start background calculation
        calculateRealKPIs()
        
      } catch (error) {
        // Silently handle errors and use fallback KPIs
        if (isMounted) {
          const fallbackKPIs = {
            totalOrders: 69811,
            paidOrders: 55849,
            liveOrders: 9075,
            fulfilledOrders: 60736,
            totalValue: 25481015,
            avgOrderValue: 365
          }
          
          setComprehensiveKPIs(fallbackKPIs)
          setIsCalculatingKPIs(false)
        }
      }
    }
    
    calculateOptimizedKPIs()
    
    return () => {
      isMounted = false
    }
  }, [])

  // KPI refresh handler with FAST approach
  const handleKPIRefresh = async (kpiKey: string) => {
    // Show loading state briefly
    setIsCalculatingKPIs(true)
    
    // Clear cache and refresh in background
    const CACHE_KEY = 'orders-comprehensive-kpis'
    localStorage.removeItem(CACHE_KEY)
    
    // Quick refresh with minimal sample
    setTimeout(async () => {
      try {
        const { getTotalChunks, fetchChunk } = await import('./services/orderService')
        const totalChunks = await getTotalChunks()
        
        // Use very small sample for quick refresh
        const sampleSize = 2
        const sampleChunks = []
        for (let i = 0; i < sampleSize; i++) {
          const randomChunk = Math.floor(Math.random() * (totalChunks - 1))
          sampleChunks.push(randomChunk)
        }
        
        // Fetch sample chunks in parallel
        const samplePromises = sampleChunks.map(chunkNum => 
          fetchChunk(chunkNum).catch(() => [])
        )
        const sampleResults = await Promise.all(samplePromises)
        const sampleOrders = sampleResults.flat()
        
        if (sampleOrders.length > 0) {
          // Calculate statistics from small sample
          const samplePaidRate = sampleOrders.filter(order => order.financialStatus === 'paid').length / sampleOrders.length
          const sampleFulfilledRate = sampleOrders.filter(order => order.fulfillmentStatus === 'fulfilled').length / sampleOrders.length
          const sampleLiveRate = sampleOrders.filter(order => 
            order.status === 'processing' || 
            order.status === 'shipped' || 
            order.fulfillmentStatus === 'partial'
          ).length / sampleOrders.length
          const sampleAvgValue = sampleOrders.reduce((sum, order) => sum + (order.total || 0), 0) / sampleOrders.length
          
          // Extrapolate to full dataset
          const estimatedTotalOrders = (totalChunks - 1) * 500 + 311
          const refreshedKPIs = {
            totalOrders: estimatedTotalOrders,
            paidOrders: Math.round(estimatedTotalOrders * samplePaidRate),
            liveOrders: Math.round(estimatedTotalOrders * sampleLiveRate),
            fulfilledOrders: Math.round(estimatedTotalOrders * sampleFulfilledRate),
            totalValue: Math.round(estimatedTotalOrders * sampleAvgValue),
            avgOrderValue: Math.round(sampleAvgValue * 100) / 100
          }
          
          setComprehensiveKPIs(refreshedKPIs)
          
          // Cache the refreshed results
          localStorage.setItem(CACHE_KEY, JSON.stringify({
            data: refreshedKPIs,
            timestamp: Date.now()
          }))
          setKpisCachedAge(0)
        }
      } catch (error) {
        // Silently handle refresh errors
      } finally {
        setIsCalculatingKPIs(false)
      }
    }, 500) // Quick 500ms delay
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

    // Reduce KPI calculation logging noise
    if (process.env.NODE_ENV === 'development' && Math.random() < 0.05) { // Only log 5% of the time
      console.log('📊 KPI Calculations:', {
        source: useAlgoliaFilters ? 'Algolia Advanced Filters' : (comprehensiveKPIs ? 'comprehensive (all chunks)' : 'current page'),
        totalOrders: kpiData.totalOrders,
        paidOrders: kpiData.paidOrders,
        liveOrders: kpiData.liveOrders,
        fulfilledOrders: kpiData.fulfilledOrders,
        totalValue: kpiData.totalValue,
        avgOrderValue: kpiData.avgOrderValue
      })
    }

    return {
      totalOrders: {
        label: 'Total Orders',
        metric: {
          value: kpiData.totalOrders,
          change: 6.0,
          trend: 'up' as const
        },
        icon: '/orders kpi cards icon/total orders.svg',
        color: 'blue'
      },
      paidOrders: {
        label: 'Paid Orders',
        metric: {
          value: kpiData.paidOrders,
          change: 11.0,
          trend: 'up' as const
        },
        icon: '/orders kpi cards icon/Paid Orders.svg',
        color: 'green'
      },
      pendingOrders: {
        label: 'Live Orders',
        metric: {
          value: kpiData.liveOrders,
          change: 0.0,
          trend: 'neutral' as const
        },
        icon: '/orders kpi cards icon/live orders.svg',
        color: 'blue'
      },
      fulfilledOrders: {
        label: 'Fulfilled Orders',
        metric: {
          value: kpiData.fulfilledOrders,
          change: 7.0,
          trend: 'up' as const
        },
        icon: '/orders kpi cards icon/Fulfilled Orders.svg',
        color: 'purple'
      },
      totalValue: {
        label: 'Total Value',
        metric: {
          value: kpiData.totalValue,
          change: 14.0,
          trend: 'up' as const
        },
        icon: '/orders kpi cards icon/Total Value.svg',
        color: 'indigo'
      },
      avgOrderValue: {
        label: 'Avg Order Value',
        metric: {
          value: kpiData.avgOrderValue,
          change: 3.31,
          trend: 'up' as const
        },
        icon: '/orders kpi cards icon/converted_icon_6.svg',
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
    
    // Also update settings to keep both in sync
    setSettings(prev => ({ ...prev, itemsPerPage: newItemsPerPage }))
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
    if (searchQuery && searchQuery.trim()) {
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
    
    if (skipNextAlgoliaRef.current) {
      skipNextAlgoliaRef.current = false
      setUseAlgoliaSearch(false)
      setIsAlgoliaSearching(false)
      return
    }
    
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

  // Remove a specific column filter (for filter chips clear action)
  const removeColumnFilter = useCallback((column: string) => {
    const currentFilters = useOrdersPageStore.getState().columnFilters as Record<string, any>
    const { [column]: _omit, ...rest } = currentFilters || {}
    setColumnFilters(rest)
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

  // Generate table columns from JSON customization
  const serialNumberColumn = {
    key: 'serialNumber',
    label: 'S.NO',
    sortable: true,
    render: (order: Order, index?: number) => {
      const serialNumber = startIndex + (index || 0) + 1
      return <span className="text-sm font-medium text-gray-900">#{serialNumber}</span>
    }
  }

  // Use JSON-generated columns, prepend serial number
  const allOrderColumns = [
    serialNumberColumn,
    ...jsonColumns
  ]

  // Legacy static columns (kept for backwards compatibility, but not used)
  const legacyOrderColumns = [
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

  // Filter columns based on visible fields - now using JSON columns
  const orderColumns = allOrderColumns

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
      "h-full bg-white flex flex-col overflow-hidden",
      isFullScreen ? "fixed inset-0 z-50 bg-white" : ""
    )}>
      {/* KPI Metrics - Full width, no extra spacing */}
      <div className="flex-shrink-0 w-full">
        <OrderKPIGrid 
          kpiMetrics={kpiMetrics} 
          orders={filteredData}
          onRefresh={handleKPIRefresh}
          onConfigure={(kpiKey, config) => {
            console.log(`Configuring ${kpiKey} KPI:`, config)
          }}
          loading={isCalculatingKPIs}
        />
      </div>

      {/* Search and Filter Controls - Fixed height */}
      <div ref={headerAreaRef} className="flex-shrink-0">
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
         selectedProducts={selectedRowIds}
          onBulkEdit={() => setShowBulkEditModal(true)}
          onExportSelected={() => setShowExportModal(true)}
          onBulkDelete={() => setShowBulkDeleteModal(true)}
         currentProducts={currentData}
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
         isAlgoliaFiltering={isAlgoliaFiltering}
         useAlgoliaFilters={useAlgoliaFilters}
          onSaveToSearchViews={savedViews.handleSaveView}
          savedSearches={savedViews.savedViews.map(view => ({
            id: view.id,
            viewName: view.viewName,
            searchQuery: view.searchState.searchQuery || '',
            searchConditions: view.searchState.searchConditions || [],
            columnFilters: view.searchState.columnFilters || {},
            customFilters: view.searchState.customFilters || [],
            sortColumn: view.searchState.sortColumn || '',
            sortDirection: view.searchState.sortDirection || 'desc',
            viewMode: view.searchState.viewMode || 'table',
            itemsPerPage: view.searchState.itemsPerPage || 25,
            updatedAt: view.updatedAt ? new Date(view.updatedAt).toISOString() : undefined
          }))}
          onApplySavedSearch={savedViews.handleApplyView}
          onDeleteSavedSearch={savedViews.handleDeleteView}
       />
       </div>

      {/* Persistent Actions Row - Fixed height */}
      <div className="flex-shrink-0 px-4 py-1 bg-white border-b border-gray-200">
        <div className="flex items-center justify-between gap-2 flex-wrap">
          {/* Left action group */}
          <div className="flex items-center justify-start gap-2 flex-wrap">
          {/* Selection counter */}
          <div className="mr-2 text-xs sm:text-sm text-gray-600">
            {selectedRowIds.length}/{totalItemsForPagination} selected
          </div>
          <button
            onClick={() => setShowImportModal(true)}
            className={cn(
              "px-3 py-1 text-xs sm:text-sm rounded-md transition-all duration-200 bg-white shadow-sm hover:shadow-md",
              "text-blue-700 border border-blue-400 hover:bg-gradient-to-r hover:from-blue-50 hover:to-blue-100"
            )}
            title="Import Orders"
          >
            <span className="inline-flex items-center gap-1">
              <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12"/></svg>
              <span>Import</span>
            </span>
          </button>
          <button
            onClick={() => setShowPrintModal(true)}
            className={cn(
              "px-3 py-1 text-xs sm:text-sm rounded-md transition-all duration-200 bg-white shadow-sm hover:shadow-md",
              "text-indigo-700 border border-indigo-400 hover:bg-gradient-to-r hover:from-indigo-50 hover:to-indigo-100"
            )}
            title="Print Orders"
          >
            <span className="inline-flex items-center gap-1">
              <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z"/></svg>
              <span>Print</span>
            </span>
          </button>
          {/* Bulk Edit */}
          <button
            onClick={() => setShowBulkEditModal(true)}
            className={cn(
              "px-3 py-1 text-xs sm:text-sm rounded-md bg-white transition-all duration-200 shadow-sm hover:shadow-md",
              "text-blue-700 border border-blue-500"
            )}
            title="Bulk Edit selected rows"
          >
            <span className="inline-flex items-center gap-1">
              <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"/></svg>
              <span>Bulk Edit</span>
            </span>
          </button>
          <button

onClick={() => setShowExportModal(true)}
            className={cn(
              "px-3 py-1 text-xs sm:text-sm rounded-md transition-all duration-200 bg-white shadow-sm hover:shadow-md",
              "text-green-700 border border-green-400 hover:bg-gradient-to-r hover:from-green-50 hover:to-green-100"
            )}
            title="Export"
          >
            <span className="inline-flex items-center gap-1">
              <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"/></svg>
              <span>Export</span>
            </span>
          </button>
          {/* Delete */}
          <button
            onClick={() => setShowBulkDeleteModal(true)}
            className={cn(
              "px-3 py-1 text-xs sm:text-sm rounded-md bg-white transition-all duration-200 shadow-sm hover:shadow-md",
              "text-red-700 border border-red-500"
            )}
            title="Delete selected rows"
          >
            <span className="inline-flex items-center gap-1">
              <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"/></svg>
              <span>Delete</span>
            </span>
          </button>

          {/* NEW: Column Customization Button */}
          <button
            onClick={openColumnManager}
            className={cn(
              "px-3 py-1 text-xs sm:text-sm rounded-md transition-all duration-200 bg-white shadow-sm hover:shadow-md",
              "text-purple-700 border border-purple-400 hover:bg-gradient-to-r hover:from-purple-50 hover:to-purple-100"
            )}
            title="Customize Columns"
          >
            <span className="inline-flex items-center gap-1">
              <Columns className="h-4 w-4" />
              <span>Columns</span>
            </span>
          </button>
          </div>

          {/* Right side controls */}
          <div className="flex items-center gap-2">
            {/* Cards per row near Settings (grid/card modes) */}
            {(viewMode === 'grid' || viewMode === 'card') && (
              <CardsPerRowDropdown value={cardsPerRow} onChange={setCardsPerRow} />
            )}
            {/* NEW: Quick Column Toggle */}
            <ColumnsQuickToggle
              selectedFields={selectedFields}
              onToggleField={toggleField}
              onOpenManager={openColumnManager}
              className="hidden md:block"
            />

            {/* JSON paths toggle removed by request */}

            {/* Reset button moved inside Columns dropdown */}

            {/* Existing Settings button */}
            <button
              onClick={() => {
                setTempVisibleFields(visibleFields) // Initialize temp fields with current values
                setShowSettingsModal(true)
              }}
            className="px-3 py-1 text-xs sm:text-sm text-gray-700 hover:text-purple-700 border border-gray-300 rounded-md hover:bg-gradient-to-r hover:from-purple-50 hover:to-purple-100 transition-all duration-200 bg-white shadow-sm hover:shadow-md"
              title="Settings"
            >
              <span className="inline-flex items-center gap-1">
                <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z"/><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"/></svg>
                <span>Settings</span>
              </span>
            </button>
          </div>
        </div>
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



      {/* Main Content - Takes remaining space, no overflow */}
      <div className="flex-1 min-h-0 overflow-hidden">
          {/* Data Source Indicator */}
          {error && (
            <div className="mb-2 p-2 bg-yellow-50 border border-yellow-200 rounded-lg">
              <div className="flex items-center">
                <div className="text-yellow-800 text-sm">
                  <strong>Note:</strong> {error} Using fallback data for demonstration.
              </div>
            </div>
        </div>
      )}

          {viewMode === 'table' ? (
            <div className="h-full flex flex-col bg-white">
              {/* Table content - horizontally scrollable with visible scrollbar */}
              <div 
                className="flex-1 min-h-0 overflow-x-auto overflow-y-auto"
                style={thinScrollbarStyles}
              >
                <div 
                  ref={tableScrollRef}
                  className="min-w-max"
                  data-scroll-group="orders-table"
                >
                  <OrderTable
                    currentOrders={currentData}
                    selectedItems={selectedRowIds}
                    onSelectItem={handleSelectItem}
                    onSelectAll={handleSelectAll}
                    onRowClick={(order: Order, e: React.MouseEvent) => {
                      if ((e.target as HTMLElement).closest('input,button')) return
                      setPreviewOrder(order)
                      setShowPreviewModal(true)
                    }}
                    columns={(function(){
                      // Reorder columns to match the requested sequence
                      const priority: Record<string, number> = {
                        // 1. S.NO is added separately as serialNumberColumn
                        name: 1, // 2. order (order name)
                        'customer.firstName': 2, // 3. customer first name
                        fulfillmentStatus: 3, // 4. fulfillment status
                        currentTotalPrice: 4, // 5. current total price
                        createdAt: 5, // 6. created date
                        updatedAt: 6, // 7. updated date
                        deliveryStatus: 7, // 8. delivery status
                        tags: 8, // 9. tags
                        sourceName: 9, // 10. channels
                        financialStatus: 10, // 11. payment status
                        email: 11 // 12. email
                      }

                      const orderedJson = [...jsonColumns].sort((a, b) => {
                        const pa = priority[a.key as keyof typeof priority] ?? Number.MAX_SAFE_INTEGER
                        const pb = priority[b.key as keyof typeof priority] ?? Number.MAX_SAFE_INTEGER
                        if (pa === pb) return 0
                        return pa - pb
                      })

                      const allOrderColumns = [serialNumberColumn, ...orderedJson]
                      return allOrderColumns
                    })()}
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
                    compact={rowDensity === 'compact'}
                    showActions={false}
                    columnWidths={{ serialNumber: 88 }}
                    renderHeader
                    scrollGroupId="orders-table"
                    tableScrollRef={tableScrollRef}
                  />
                </div>
              </div>
              
              {/* Pagination - Sticky at bottom of container, always visible */}
              <div className="flex-shrink-0">
                <Pagination
                  currentPage={currentPage}
                  totalPages={totalPages}
                  itemsPerPage={itemsPerPage}
                  totalItems={totalItemsForPagination}
                  onPageChange={handlePageChange}
                  onItemsPerPageChange={handleItemsPerPageChange}
                  scrollGroupId="orders-table"
                  tableScrollRef={tableScrollRef}
                  showScrollbar={true}
                  itemType="orders"
                />
              </div>
            </div>
          ) : viewMode === 'grid' ? (
            <div className="h-full flex flex-col bg-white">
              {/* Data Table Column Headers - Auto-generated */}
              <div className="flex-shrink-0">
                <GridColumnHeader
                  columns={generateOrderColumnHeaders()}
                  activeColumnFilter={activeColumnFilter}
                  columnFilters={columnFilters}
                  onFilterClick={setActiveColumnFilter}
                  onColumnFilterChange={handleColumnFilter}
                  getUniqueValues={getUniqueValues}
                  sortColumn={sorting[0]?.id}
                  sortDirection={sorting[0]?.desc ? 'desc' : 'asc'}
                  onSortClick={(column) => {
                    const isDesc = sorting[0]?.id === column && !sorting[0]?.desc
                    setSorting([{ id: column, desc: isDesc }])
                  }}
                  allSelected={selectedRowIds.length === currentData.length && currentData.length > 0}
                  onSelectAll={handleSelectAll}
                />
              </div>
              {/* Scrollable grid content */}
              <div 
                className="flex-1 min-h-0 overflow-y-auto p-4"
                style={thinScrollbarStyles}
              >
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
              
              {/* Pagination - Sticky at bottom of container, always visible */}
              <div className="flex-shrink-0">
                <Pagination
                  currentPage={currentPage}
                  totalPages={totalPages}
                  itemsPerPage={itemsPerPage}
                  totalItems={totalItemsForPagination}
                  onPageChange={handlePageChange}
                  onItemsPerPageChange={handleItemsPerPageChange}
                  itemType="orders"
                />
              </div>
            </div>
        ) : (
          <div className="h-full flex flex-col bg-white">
            {/* Data Table Column Headers - Auto-generated */}
            <div className="flex-shrink-0">
              <GridColumnHeader
                columns={generateOrderColumnHeaders()}
                activeColumnFilter={activeColumnFilter}
                columnFilters={columnFilters}
                onFilterClick={setActiveColumnFilter}
                onColumnFilterChange={handleColumnFilter}
                getUniqueValues={getUniqueValues}
                sortColumn={sorting[0]?.id}
                sortDirection={sorting[0]?.desc ? 'desc' : 'asc'}
                onSortClick={(column) => {
                  const isDesc = sorting[0]?.id === column && !sorting[0]?.desc
                  setSorting([{ id: column, desc: isDesc }])
                }}
                allSelected={selectedRowIds.length === currentData.length && currentData.length > 0}
                onSelectAll={handleSelectAll}
              />
            </div>
            {/* Scrollable card content */}
            <div 
              className="flex-1 min-h-0 overflow-y-auto p-4"
              style={thinScrollbarStyles}
            >
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
            
            {/* Pagination - Sticky at bottom of container, always visible */}
            <div className="flex-shrink-0">
              <Pagination
                currentPage={currentPage}
                totalPages={totalPages}
                itemsPerPage={itemsPerPage}
                totalItems={totalItemsForPagination}
                onPageChange={handlePageChange}
                onItemsPerPageChange={handleItemsPerPageChange}
                itemType="orders"
              />
            </div>
          </div>
        )}

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
          orders={filteredData as any}
          selectedOrders={selectedRowIds}
          onExport={handleExportAction}
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
                      <select 
                        value={settings.itemsPerPage} 
                        onChange={(e) => {
                          const newValue = Number(e.target.value)
                          setSettings(prev => ({ ...prev, itemsPerPage: newValue }))
                          // Immediately update pagination state to sync both controls
                          setItemsPerPage(newValue)
                          setPageSize(newValue)
                          setCurrentPage(1)
                          setPageIndex(0)
                        }} 
                        className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm"
                      >
                        {[10, 25, 50, 100, 200, 500].map(n => <option key={n} value={n}>{n}</option>)}
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

                {/* Field Visibility Settings */}
                <div>
                  <h4 className="text-sm font-medium text-gray-900 mb-3">Visible Columns</h4>
                  <div className="border border-gray-200 rounded-lg p-4">
                    <p className="text-xs text-gray-600 mb-3">
                      Choose which columns to display in the orders table and grid view.
                    </p>
                    <div className="grid grid-cols-2 gap-3 max-h-60 overflow-y-auto">
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
                    <div className="flex justify-between items-center mt-3 pt-3 border-t border-gray-200">
                      <button
                        onClick={() => {
                          const allFields = new Set(allOrderColumns.map(col => col.key))
                          setTempVisibleFields(allFields)
                        }}
                        className="text-xs text-blue-600 hover:text-blue-800 underline"
                      >
                        Select All
                      </button>
                      <button
                        onClick={() => {
                          setTempVisibleFields(new Set(['serialNumber', 'orderNumber', 'customerName', 'total', 'createdAt']))
                        }}
                        className="text-xs text-gray-600 hover:text-gray-800 underline"
                      >
                        Reset to Default
                      </button>
                    </div>
                  </div>
                </div>
              </div>

              <div className="flex justify-end space-x-3 mt-6 pt-4 border-t border-gray-200">
                <button onClick={() => {
                  setTempVisibleFields(visibleFields) // Reset temp fields
                  setShowSettingsModal(false)
                }} className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 rounded-md hover:bg-gray-200">Cancel</button>
                <button onClick={() => {
                  if (settings.defaultViewMode !== viewMode) setViewMode(settings.defaultViewMode)
                  if (settings.itemsPerPage !== itemsPerPage) setItemsPerPage(settings.itemsPerPage)
                  if (settings.showAdvancedFilters !== showAdvancedFilter) setShowAdvancedFilter(settings.showAdvancedFilters)
                  // Apply field visibility changes
                  handleSaveVisibleFields()
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


      {/* Save Search Modal - Using Generic Component */}
      <SaveViewModal
        isOpen={savedViews.showSaveModal}
        onClose={() => savedViews.setShowSaveModal(false)}
        viewName={savedViews.viewName}
        setViewName={savedViews.setViewName}
        onSave={savedViews.handleConfirmSave}
        currentState={{
          searchQuery,
          columnFiltersCount: Object.keys(columnFilters || {}).length,
          viewMode
        }}
      />

      {/* Column Manager Modal */}
      <ColumnManager
        isOpen={showColumnManager}
        onClose={closeColumnManager}
        selectedFields={selectedFields}
        showJsonKeys={showJsonKeys}
        customLabels={customLabels}
        onSave={saveColumnConfig}
        onReset={resetJsonColumns}
      />
    </div>
  )
}

export default function ShopifyOrdersPage() {
  return <OrdersClient initialData={{ items: [], lastEvaluatedKey: null, total: 0 }} />
} 