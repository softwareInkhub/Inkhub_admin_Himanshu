'use client'

import { useEffect, useState, useCallback, useMemo, useRef } from 'react'
import { useAppStore } from '@/lib/store'
import { useProductsPageStore } from '@/lib/stores/products-page-store'
import { UrlStateProvider } from '@/components/UrlStateProvider'
import { cn } from '@/lib/utils'
import { X } from 'lucide-react'
import { debounce } from './utils/advancedSearch'
import { debouncedAlgoliaSearch, searchProductsWithAdvancedFilters } from './utils/algoliaSearch'
import HighlightedText from './components/HighlightedText'
import { SearchHistory, saveSearchToHistory } from './utils/searchSuggestions'

import KPIGrid from './components/KPIGrid'
import ProductTable from './components/ProductTable'
import ProductCardView from './components/ProductCardView'
import GridCardFilterHeader from './components/GridCardFilterHeader'
import Pagination from './components/Pagination'
import SearchControls from './components/SearchControls'
import ProductImage from './components/ProductImage'
import BulkActionsBar from './components/BulkActionsBar'
import ExportModal from './components/ExportModal'
import CardsPerRowDropdown from './components/CardsPerRowDropdown'
import { EnhancedDetailModal } from '@/components/shared'
import { Product, SearchCondition, CustomFilter } from './types'
import { 
  calculateKPIMetrics, 
  getUniqueValues, 
  getUniqueTags, 
  getStatusBadge,
  filterProducts
} from './utils'

interface ProductsClientProps {
  initialData: {
    items: any[]
    lastEvaluatedKey: any
    total: number
  }
}

function ProductsClient({ initialData }: ProductsClientProps) {
  return (
    <UrlStateProvider>
      {({ searchParams, setParams }) => (
        <ProductsClientContent 
          initialData={initialData} 
          searchParams={searchParams} 
          setParams={setParams} 
        />
      )}
    </UrlStateProvider>
  );
}

function ProductsClientContent({ 
  initialData, 
  searchParams, 
  setParams 
}: ProductsClientProps & { 
  searchParams: URLSearchParams; 
  setParams: (patch: Record<string, string | number | undefined>) => void; 
}) {
  const { addTab, tabs } = useAppStore()

  // Get persistent state from Zustand store
  const {
    pageIndex, pageSize, sorting, columnFilters, globalFilter,
    setPageIndex, setPageSize, setSorting, setColumnFilters, setGlobalFilter,
    moreActionsOpen, setMoreActionsOpen,
    selectedRowIds, setSelectedRowIds,
    scrollY, setScrollY,
    reset: resetPageState
  } = useProductsPageStore()

  // Hydrate from URL on first mount
  useEffect(() => {
    if (typeof window === "undefined") return
    const p = searchParams.get("p")
    const sz = searchParams.get("sz")
    const s = searchParams.get("s") // search query
    if (p) setPageIndex(Number(p))
    if (sz) setPageSize(Number(sz))
    if (s) setGlobalFilter(s)
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

  const [productData, setProductData] = useState<Product[]>([])
  const [chunkData, setChunkData] = useState<{ [key: string]: Product[] }>({})
  const [chunkKeys, setChunkKeys] = useState<string[]>([])
  const [isDataLoaded, setIsDataLoaded] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [totalProducts, setTotalProducts] = useState(0)
  
  // Filter states - using Zustand store for persistent state
  const [activeFilter, setActiveFilter] = useState('all')
  const [searchQuery, setSearchQuery] = useState(globalFilter) // Initialize with stored value
  const [debouncedSearchQuery, setDebouncedSearchQuery] = useState(globalFilter)
  const [searchConditions, setSearchConditions] = useState<SearchCondition[]>([])
  const [showSearchBuilder, setShowSearchBuilder] = useState(false)
  
  // Algolia search states
  const [algoliaSearchResults, setAlgoliaSearchResults] = useState<Product[]>([])
  const [isAlgoliaSearching, setIsAlgoliaSearching] = useState(false)
  const [useAlgoliaSearch, setUseAlgoliaSearch] = useState(false)
  const searchInProgressRef = useRef(false)

  // Advanced Filters Algolia states
  const [algoliaFilterResults, setAlgoliaFilterResults] = useState<Product[]>([])
  const [isAlgoliaFiltering, setIsAlgoliaFiltering] = useState(false)
  const [useAlgoliaFilters, setUseAlgoliaFilters] = useState(false)

  // Search history state
  const [searchHistory, setSearchHistory] = useState<SearchHistory[]>([])

  // Advanced Filter states
  const [showAdvancedFilter, setShowAdvancedFilter] = useState(false)
  const [advancedFilters, setAdvancedFilters] = useState({
    productStatus: [] as string[],
    priceRange: { min: '', max: '' },
    dateRange: { start: '', end: '' },
    tags: [] as string[],
    vendors: [] as string[]
  })

  // Advanced Filters Algolia search function
  const handleAdvancedFiltersAlgoliaSearch = useCallback(async (filters: {
    productStatus?: string[]
    priceRange?: { min?: string; max?: string }
    dateRange?: { start?: string; end?: string }
    tags?: string[]
    vendors?: string[]
  }) => {
    console.log('🔍 Advanced Filters Algolia search triggered with:', filters)
    
    // Check if any filters are active
    const hasActiveFilters = (
      (filters.productStatus && filters.productStatus.length > 0) ||
      (filters.priceRange && (filters.priceRange.min || filters.priceRange.max)) ||
      (filters.dateRange && (filters.dateRange.start || filters.dateRange.end)) ||
      (filters.tags && filters.tags.length > 0) ||
      (filters.vendors && filters.vendors.length > 0)
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
      const results = await searchProductsWithAdvancedFilters(
        filters,
        productData,
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
  }, [productData])

  // Trigger Algolia search when Advanced Filters change
  useEffect(() => {
    if (showAdvancedFilter) {
      handleAdvancedFiltersAlgoliaSearch(advancedFilters)
    }
  }, [advancedFilters, showAdvancedFilter, handleAdvancedFiltersAlgoliaSearch])

  // Derive advanced filters from column header filters and trigger Algolia
  useEffect(() => {
    const cf = columnFilters || {}

    const derived = {
      productStatus: [] as string[],
      priceRange: { min: '', max: '' } as { min?: string; max?: string },
      dateRange: { start: '', end: '' } as { start?: string; end?: string },
    tags: [] as string[],
      vendors: [] as string[],
    }

    // Local refiners that we can apply after Algolia returns
    const refiners: {
      title?: string
      productType?: string[]
      category?: string[]
      inventoryQuantity?: string
    } = {}

    const has = (v: any) => Array.isArray(v) ? v.length > 0 : (v !== undefined && v !== null && String(v) !== '')

    // status -> productStatus
    if (has(cf['status'])) {
      derived.productStatus = Array.isArray(cf['status']) ? cf['status'] as string[] : [String(cf['status'])]
    }
    // price -> priceRange (>, <, =, or number)
    if (has(cf['price'])) {
      const v = String(cf['price']).trim()
      if (v.startsWith('>')) derived.priceRange.min = v.slice(1)
      else if (v.startsWith('<')) derived.priceRange.max = v.slice(1)
      else if (v.startsWith('=')) { derived.priceRange.min = v.slice(1); derived.priceRange.max = v.slice(1) }
      else if (!isNaN(Number(v))) { derived.priceRange.min = v; derived.priceRange.max = v }
    }
    // createdAt / updatedAt -> dateRange (prefer createdAt exact day; if both exist, use min/max)
    const created = has(cf['createdAt']) ? new Date(String(cf['createdAt'])) : null
    const updated = has(cf['updatedAt']) ? new Date(String(cf['updatedAt'])) : null
    if (created && !isNaN(created.getTime())) {
      const d = created.toISOString().slice(0, 10)
      derived.dateRange.start = d
      derived.dateRange.end = d
    }
    if (updated && !isNaN(updated.getTime())) {
      const d = updated.toISOString().slice(0, 10)
      if (!derived.dateRange.start || d < derived.dateRange.start) derived.dateRange.start = d
      if (!derived.dateRange.end || d > derived.dateRange.end) derived.dateRange.end = d
    }
    // tags -> tags
    if (has(cf['tags'])) {
      derived.tags = Array.isArray(cf['tags']) ? cf['tags'] as string[] : [String(cf['tags'])]
    }
    // vendor -> vendors
    if (has(cf['vendor'])) {
      derived.vendors = Array.isArray(cf['vendor']) ? cf['vendor'] as string[] : [String(cf['vendor'])]
    }
    // title -> text search via Algolia
    if (has(cf['title'])) {
      refiners.title = String(cf['title']).trim()
    }
    // productType/category/inventoryQuantity as local refiners (post-Algolia)
    if (has(cf['productType'])) {
      refiners.productType = Array.isArray(cf['productType']) ? cf['productType'] as string[] : [String(cf['productType'])]
    }
    if (has(cf['category'])) {
      refiners.category = Array.isArray(cf['category']) ? cf['category'] as string[] : [String(cf['category'])]
    }
    if (has(cf['inventoryQuantity'])) {
      refiners.inventoryQuantity = String(cf['inventoryQuantity'])
    }

    const filtersActive = (
      derived.productStatus.length > 0 ||
      !!derived.priceRange.min || !!derived.priceRange.max ||
      !!derived.dateRange.start || !!derived.dateRange.end ||
      derived.tags.length > 0 ||
      derived.vendors.length > 0
    )

    const applyRefiners = (base: Product[]) => {
      let result = base
      // productType/category refiners
      if (refiners.productType && refiners.productType.length > 0) {
        result = result.filter(p => refiners.productType!.includes(String(p.productType)))
      }
      if (refiners.category && refiners.category.length > 0) {
        result = result.filter(p => refiners.category!.includes(String(p.category)))
      }
      // inventoryQuantity numeric filter using >,<,=, or direct value
      if (refiners.inventoryQuantity) {
        const v = refiners.inventoryQuantity.trim()
        result = result.filter(p => {
          const qty = Number(p.inventoryQuantity || 0)
          if (v.startsWith('>')) return qty > Number(v.slice(1))
          if (v.startsWith('<')) return qty < Number(v.slice(1))
          if (v.startsWith('=')) return qty === Number(v.slice(1))
          if (!isNaN(Number(v))) return qty === Number(v)
          return true
        })
      }
      return result
    }

    const searchSpace: Product[] = (chunkKeys && chunkKeys.length > 0) ? (Object.values(chunkData).flat() as Product[]) : productData

    if (filtersActive && refiners.title) {
      // Run both: advanced Algolia filters and title Algolia search, then intersect
      handleAdvancedFiltersAlgoliaSearch(derived)
      setIsAlgoliaFiltering(true)
      setUseAlgoliaFilters(true)
      debouncedAlgoliaSearch(refiners.title, searchSpace, (products) => {
        // Intersect by id with current algoliaFilterResults if present; otherwise just use search
        const byId = new Set((algoliaFilterResults.length > 0 ? algoliaFilterResults : products).map(p => p.id))
        const intersection = products.filter(p => byId.has(p.id))
        const refined = applyRefiners(intersection)
        setAlgoliaFilterResults(refined)
        setIsAlgoliaFiltering(false)
      }, 300)
    } else if (filtersActive) {
      // Only advanced filters
      setUseAlgoliaFilters(true)
      handleAdvancedFiltersAlgoliaSearch(derived)
    } else if (refiners.title) {
      // Only title column filter → run Algolia text search across chunks
      setUseAlgoliaFilters(true)
      setIsAlgoliaFiltering(true)
      debouncedAlgoliaSearch(refiners.title, searchSpace, (products) => {
        const refined = applyRefiners(products)
        setAlgoliaFilterResults(refined)
        setIsAlgoliaFiltering(false)
      }, 300)
    } else {
      setUseAlgoliaFilters(false)
      setAlgoliaFilterResults([])
      setIsAlgoliaFiltering(false)
    }
  }, [columnFilters, handleAdvancedFiltersAlgoliaSearch, productData, chunkData, chunkKeys])

  // Column Header Filter states - using Zustand store
  const [activeColumnFilter, setActiveColumnFilter] = useState<string | null>(null)

  // Custom Filter states
  const [showCustomFilterDropdown, setShowCustomFilterDropdown] = useState(false)
  const [customFilters, setCustomFilters] = useState<CustomFilter[]>([])
  
  // Default filter states
  const [hiddenDefaultFilters, setHiddenDefaultFilters] = useState<Set<string>>(new Set())
  
  // View and control states
  const [viewMode, setViewMode] = useState<'table' | 'grid' | 'card'>('table')
  const [showAdditionalControls, setShowAdditionalControls] = useState(false)
  
  // Header dropdown states
  const [showHeaderDropdown, setShowHeaderDropdown] = useState(false)
  
  // Modal states
  const [showPreviewModal, setShowPreviewModal] = useState(false)
  const [showExportModal, setShowExportModal] = useState(false)
  const [showBulkEditModal, setShowBulkEditModal] = useState(false)
  const [showBulkDeleteModal, setShowBulkDeleteModal] = useState(false)
  const [showImportModal, setShowImportModal] = useState(false)
  const [showPrintModal, setShowPrintModal] = useState(false)
  const [printOptions, setPrintOptions] = useState({
    printType: 'all',
    layout: 'table',
    includeImages: true,
    includeDetails: true,
    pageSize: 'A4',
    orientation: 'portrait'
  })
  const [showSettingsModal, setShowSettingsModal] = useState(false)
  const [isFullScreen, setIsFullScreen] = useState(false)
  
  // Pagination states - using Zustand store
  const [currentPage, setCurrentPage] = useState(pageIndex + 1) // Convert 0-based to 1-based
  const [itemsPerPage, setItemsPerPage] = useState(pageSize)
  
  // Keep local currentPage in sync with Zustand store
  useEffect(() => {
    const storePage = pageIndex + 1 // Convert 0-based to 1-based
    if (storePage !== currentPage) {
      setCurrentPage(storePage)
    }
  }, [pageIndex, currentPage])

  // Cards per row state for grid/card views
  const [cardsPerRow, setCardsPerRow] = useState(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('products-cards-per-row')
      return saved ? parseInt(saved, 10) : 4
    }
    return 4
  })
  
  // Settings state management with localStorage persistence
  interface ProductSettings {
    defaultViewMode: 'table' | 'grid' | 'card'
    itemsPerPage: number
    showAdvancedFilters: boolean
    autoSaveFilters: boolean
    defaultExportFormat: 'csv' | 'json' | 'pdf'
    includeImagesInExport: boolean
    showImages: boolean
  }

  const [settings, setSettings] = useState<ProductSettings>(() => {
    if (typeof window !== 'undefined') {
      const savedSettings = localStorage.getItem('products-settings')
      return savedSettings ? JSON.parse(savedSettings) : {
        defaultViewMode: 'table',
        itemsPerPage: 500,
        showAdvancedFilters: false,
        autoSaveFilters: false,
        defaultExportFormat: 'csv',
        includeImagesInExport: false,
        showImages: true
      }
    }
    return {
      defaultViewMode: 'table',
      itemsPerPage: 500,
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
      localStorage.setItem('products-settings', JSON.stringify(settings))
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
      setPageSize(settings.itemsPerPage)
    }
  }, [settings.itemsPerPage, itemsPerPage, setPageSize])


  // Apply advanced filter setting
  useEffect(() => {
    if (settings.showAdvancedFilters !== showAdvancedFilter) {
      setShowAdvancedFilter(settings.showAdvancedFilters)
    }
  }, [settings.showAdvancedFilters])

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
      localStorage.setItem('products-saved-filters', JSON.stringify(filterState))
    }
  }, [settings.autoSaveFilters, activeFilter, columnFilters, advancedFilters, customFilters, searchConditions])

  // Load saved filters on component mount if auto-save is enabled
  useEffect(() => {
    if (settings.autoSaveFilters && typeof window !== 'undefined') {
      const savedFilters = localStorage.getItem('products-saved-filters')
      if (savedFilters) {
        try {
          const filterState = JSON.parse(savedFilters)
          // Only load filters if they're less than 24 hours old
          if (Date.now() - filterState.timestamp < 24 * 60 * 60 * 1000) {
            setActiveFilter(filterState.activeFilter || '')
            setColumnFilters(filterState.columnFilters || {})
            setAdvancedFilters(filterState.advancedFilters || {
              productStatus: [],
              tags: [],
              vendors: [],
              priceRange: { min: '', max: '' },
              dateRange: { start: '', end: '' }
            })
            setCustomFilters(filterState.customFilters || [])
            setSearchConditions(filterState.searchConditions || [])
          }
        } catch (error) {
          console.error('Error loading saved filters:', error)
        }
      }
    }
  }, [settings.autoSaveFilters])

  // Save cards per row preference to localStorage
  useEffect(() => {
    if (typeof window !== 'undefined') {
      localStorage.setItem('products-cards-per-row', cardsPerRow.toString())
    }
  }, [cardsPerRow])
  
  // Generate grid classes based on cards per row
  const getGridClasses = (cardsPerRow: number) => {
    const baseClasses = "grid gap-4 p-4"
    
    // Handle cases where Tailwind doesn't have the class
    const getGridColsClass = (cols: number) => {
      if (cols <= 6) {
        return `grid-cols-${cols}`
      } else {
        // For 7 and 8 columns, use custom CSS
        return `grid-cols-6`
      }
    }
    
    const lgCols = Math.min(cardsPerRow, 4)
    const xlCols = cardsPerRow
    
    const responsiveClasses = `grid-cols-1 sm:grid-cols-2 lg:${getGridColsClass(lgCols)} xl:${getGridColsClass(xlCols)}`
    
    // Add custom CSS for 7 and 8 columns
    const customStyle = cardsPerRow > 6 ? `grid-template-columns: repeat(${cardsPerRow}, minmax(0, 1fr));` : ''
    
    return {
      className: `${baseClasses} ${responsiveClasses}`,
      style: customStyle ? { gridTemplateColumns: `repeat(${cardsPerRow}, minmax(0, 1fr))` } : {}
    }
  }
  
  // Preview state
  const [previewProduct, setPreviewProduct] = useState<Product | null>(null)
  const hasFetchedRef = useRef(false)

  // Utility functions for data processing
  const toSlug = (text: string): string =>
    (text || '')
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/(^-|-$)+/g, '')

  const parseDate = (value: any): string => {
    const d = value ? new Date(value) : new Date()
    return isNaN(d.getTime()) ? new Date().toISOString() : d.toISOString()
  }

  const mapVariant = (v: any, idx: number) => ({
    id: String(v?.id ?? `variant-${idx}`),
    title: String(v?.title ?? `Variant ${idx + 1}`),
    price: Number(v?.price ?? v?.compare_at_price ?? 0) || 0,
    compareAtPrice: v?.compare_at_price != null ? Number(v.compare_at_price) : undefined,
    inventoryQuantity: Number(v?.inventory_quantity ?? v?.inventoryQuantity ?? 0) || 0,
    sku: String(v?.sku ?? ''),
    barcode: v?.barcode ? String(v.barcode) : undefined,
    weight: v?.weight != null ? Number(v.weight) : undefined,
    weightUnit: String(v?.weight_unit ?? v?.weightUnit ?? 'kg')
  })

  const mapRecordToProduct = (raw: any, idx: number): Product | null => {
    try {
      // Skip if no raw data
      if (!raw || typeof raw !== 'object') {
        return null
      }
    
    // Handle product image data structure (from cache) - legacy support
    if (raw?.product_id && raw?.src && !raw?.title) {
      // This is a product image record, not a product → skip
      return null
    }
    
      // Extract basic fields with better fallbacks
      const idValue = raw?.id || raw?.product_id || raw?.gid || `product-${idx}`
      const title = raw?.title || raw?.name || `Product ${idx + 1}`
      
      // Skip if we can't get a valid ID or title
      if (!idValue || !title) {
        return null
      }
      
      // Handle variants
    const variantsArray: any[] = Array.isArray(raw?.variants) ? raw.variants : []
      const totalInventory = variantsArray.reduce((sum, v) => {
        const qty = Number(v?.inventory_quantity ?? v?.inventoryQuantity ?? 0)
        return sum + (isNaN(qty) ? 0 : qty)
      }, 0)
      
    const primaryVariant = variantsArray[0] || {}
      
      // Handle images
    const imagesArr = Array.isArray(raw?.images) ? raw.images : (raw?.image ? [raw.image] : [])
    const imageUrls = imagesArr
        .map((img: any) => {
          if (typeof img === 'string') return img
          return img?.src || img?.url || ''
        })
      .filter(Boolean)

      // Extract other fields
      const productType = raw?.product_type || raw?.productType || raw?.category || ''
      const priceCandidate = primaryVariant?.price || raw?.price || 0
      const statusRaw = String(raw?.status || 'active').toLowerCase()
      const status = (statusRaw === 'active' || statusRaw === 'draft' || statusRaw === 'archived') 
        ? statusRaw as Product['status'] 
        : 'active'

      // Handle tags
      let tags: string[] = []
      if (Array.isArray(raw?.tags)) {
        tags = raw.tags
      } else if (typeof raw?.tags === 'string') {
        tags = raw.tags.split(',').map((t: string) => t.trim()).filter(Boolean)
      }

      // Handle collections
      const collections = Array.isArray(raw?.collections) ? raw.collections : []

    return {
        id: String(idValue),
        title: String(title),
        handle: raw?.handle || toSlug(title),
        vendor: String(raw?.vendor || raw?.brand || ''),
        productType: String(productType),
        price: Number(priceCandidate) || 0,
      compareAtPrice: primaryVariant?.compare_at_price != null ? Number(primaryVariant.compare_at_price) : undefined,
      cost: Number(primaryVariant?.cost ?? raw?.cost ?? 0) || 0,
      inventoryQuantity: Number(raw?.inventory_quantity ?? raw?.inventoryQuantity ?? totalInventory) || 0,
      status,
      publishedAt: raw?.published_at ? parseDate(raw?.published_at) : undefined,
      createdAt: parseDate(raw?.created_at ?? raw?.createdAt),
      updatedAt: parseDate(raw?.updated_at ?? raw?.updatedAt),
        tags,
        images: imageUrls,
      variants: variantsArray.map(mapVariant),
        collections,
      selected: false,
      salesChannels: Number(raw?.salesChannels ?? 1) || 1,
        category: String(productType) || ''
      }
    } catch (error) {
      console.error(`Error mapping product at index ${idx}:`, error, raw)
      return null
    }
  }

  // Fetch real products from cache API
  const fetchProducts = async (isBackground: boolean = false) => {
    // Prevent duplicate fetches on first mount (Strict Mode double-invoke)
    if (hasFetchedRef.current && !isBackground) {
      console.log('⏭️ Skipping fetch: already in progress or completed')
      return
    }
    hasFetchedRef.current = true
    if (!isBackground) setLoading(true)
    setError(null)
    
    try {
      const BACKEND_URL = 'https://brmh.in'
      
      // Try multiple possible keys for products data
      const possibleKeys = ['chunk:0', 'all', 'products']
      
      for (const key of possibleKeys) {
        try {
          const url = `${BACKEND_URL}/cache/data?project=my-app&table=shopify-inkhub-get-products&key=${key}`
          console.log('🌐 Trying URL:', url)
          
          const response = await fetch(url, { 
          signal: AbortSignal.timeout(45000),
        headers: { Accept: 'application/json', 'Accept-Encoding': 'identity' }
      })
      
          console.log('📡 Response status:', response.status, response.statusText)
          
          if (response.ok) {
            const text = await response.text()
            const jsonData = JSON.parse(text)
            
            if (jsonData?.data && Array.isArray(jsonData.data)) {
              console.log('📦 Raw data from API:', {
                key,
                count: jsonData.data.length,
                firstItem: jsonData.data[0]
              })
              
              // Map and filter products
              const mappedProducts = jsonData.data
                .map((raw: any, idx: number) => {
                  try {
                    return mapRecordToProduct(raw, idx)
                  } catch (error) {
                    console.warn(`Failed to map product at index ${idx}:`, error)
                    return null
                  }
                })
                .filter(Boolean) as Product[]
              
              // Remove duplicates by id
              const uniqueProducts = Array.from(
                new Map(mappedProducts.map(p => [p.id, p])).values()
              )
              
              console.log('✅ Successfully processed products:', {
                key,
                rawCount: jsonData.data.length,
                mappedCount: mappedProducts.length,
                uniqueCount: uniqueProducts.length,
                sampleProduct: uniqueProducts[0]
              })
              
              // Set the data
            setProductData(uniqueProducts)
            setTotalProducts(uniqueProducts.length)
              setChunkData({ [key]: uniqueProducts })
              setChunkKeys([key])
            setIsDataLoaded(true)
            setLoading(false)
              setError(null)
              return // Success, exit the function
            }
          }
        } catch (keyError) {
          console.log(`❌ Failed to fetch with key "${key}":`, keyError)
          // Continue to next key
        }
      }
      
      // If we get here, all keys failed
      throw new Error('No products data found in any cache key. Please cache the products data first.')
      
      } catch (e: any) {
        if (e?.name === 'AbortError') {
        console.log('⏹️ Request aborted')
          return
        }
        
        console.error('❌ Cache fetch error:', e)
        
        if (e.message.includes('404') || e.message.includes('Not Found')) {
          setError('No products data available. Please cache the products data first using the Caching page.')
        } else {
          setError(`Failed to load products: ${e.message}`)
        }
      } finally {
        setIsDataLoaded(true)
        if (!isBackground) setLoading(false)
      }
  }

  // Fetch real products from cache API using chunk-based approach
  useEffect(() => {
    console.log('🚀 Products page mounted, starting data fetch...')
    
    // Only fetch if we haven't fetched yet or if data is empty
    if (hasFetchedRef.current && productData.length > 0) {
      console.log('📦 Data already loaded, skipping fetch')
      return
    }
    
    // Check if we have cached data first
    if (typeof window !== 'undefined') {
      const cached = localStorage.getItem('products-cache')
      if (cached) {
        console.log('💾 Found cached data, checking age...')
        try {
          const parsed = JSON.parse(cached)
          const now = Date.now()
          const cacheAge = now - (parsed.timestamp || 0)
          const cacheTTL = 30 * 60 * 1000 // 30 minutes to avoid frequent cold loads
          
          if (cacheAge < cacheTTL && parsed.data && Array.isArray(parsed.data) && parsed.data.length > 0) {
            console.log('✅ Using fresh cached data:', parsed.data.length, 'products')
            // Use cached data if it's fresh
            setProductData(parsed.data)
            setTotalProducts(parsed.data.length)
            setChunkData({ 'cached': parsed.data })
            setChunkKeys(['cached'])
            setIsDataLoaded(true)
            setLoading(false)
            hasFetchedRef.current = true
            // Trigger a background refresh without blocking UI
            ;(async () => {
              try { await fetchProducts(true) } catch {}
            })()
            return
          } else {
            console.log('⏰ Cached data is stale or empty, fetching fresh data...')
          }
        } catch (e) {
          console.log('❌ Invalid cache, fetching fresh data...')
          // Invalid cache, continue with fresh fetch
        }
      } else {
        console.log('📭 No cached data found, fetching fresh data...')
      }
    }

    // Reset state to ensure clean data loading
    setProductData([])
    setChunkData({})
    setChunkKeys([])
    setTotalProducts(0)
    setIsDataLoaded(false)
    setError(null)
    hasFetchedRef.current = false

    console.log('🌐 Starting fresh API fetch...')
    fetchProducts()
  }, []) // Remove productData.length dependency to prevent infinite loops

  // Tab management
  useEffect(() => {
    addTab({
      title: 'Products',
      path: '/apps/shopify/products',
      pinned: false,
      closable: true,
    })
  }, [addTab])

  // Save data to cache when loaded successfully
  useEffect(() => {
    if (isDataLoaded && productData.length > 0 && typeof window !== 'undefined') {
      // Only cache essential fields to reduce storage size and avoid quota exceeded errors
      const essentialProducts = productData.map(product => ({
        id: product.id,
        title: product.title,
        status: product.status,
        price: product.price,
        inventoryQuantity: product.inventoryQuantity,
        vendor: product.vendor,
        productType: product.productType,
        category: product.category,
        images: product.images?.slice(0, 1), // Only first image
        createdAt: product.createdAt,
        updatedAt: product.updatedAt,
        tags: product.tags?.slice(0, 5), // Only first 5 tags
        handle: product.handle
      }))
      
      try {
        const cacheData = {
          data: essentialProducts,
          timestamp: Date.now(),
          count: essentialProducts.length
        }
        localStorage.setItem('products-cache', JSON.stringify(cacheData))
        console.log('📦 Essential product data cached successfully:', essentialProducts.length, 'products')
      } catch (e) {
        // Handle quota exceeded or other storage errors silently
        console.warn('⚠️ Could not cache products data:', e)
      }
    }
  }, [isDataLoaded, productData])

  // Debug: Monitor product data changes (reduced logging for cleaner console)
  useEffect(() => {
    if (productData.length > 0) {
      console.log('📊 Product data loaded:', productData.length, 'products')
    }
  }, [productData.length])

  // Calculate KPI metrics - reflect filtered data when Algolia filters are active
  const kpiMetrics = useMemo(() => {
    const dataToUse = useAlgoliaFilters && algoliaFilterResults.length > 0 
      ? algoliaFilterResults 
      : (useAlgoliaSearch && algoliaSearchResults.length > 0 
        ? algoliaSearchResults 
        : productData)
    
    return calculateKPIMetrics(dataToUse)
  }, [productData, useAlgoliaFilters, algoliaFilterResults, useAlgoliaSearch, algoliaSearchResults])

  // Get all products for filtering (combine all chunks)
  const allProducts = useMemo(() => {
    console.log('🔍 AllProducts Debug:', {
      chunkKeys: chunkKeys,
      chunkDataKeys: Object.keys(chunkData),
      chunkDataLength: Object.values(chunkData).flat().length,
      productDataLength: productData.length,
      productData: productData.slice(0, 2) // Show first 2 products
    })
    
    if (chunkKeys.length > 0) {
      const chunkProducts = Object.values(chunkData).flat()
      return chunkProducts
    }
    return productData
  }, [chunkKeys, chunkData, productData])

      // Filter products based on all criteria - optimized for performance
  const filteredProducts = useMemo(() => {
      
      // Start with deduplicated product data
      let filtered = allProducts
      
      // Priority 1: Use Algolia filter results if Advanced Filters are active
      if (useAlgoliaFilters && algoliaFilterResults.length > 0) {
        console.log('🔍 Using Algolia Advanced Filters results:', algoliaFilterResults.length, 'products')
        filtered = algoliaFilterResults
      }
      // Priority 2: Use Algolia search results if regular search is active
      else if (useAlgoliaSearch && algoliaSearchResults.length > 0) {
        console.log('🔍 Using Algolia search results:', algoliaSearchResults.length, 'products')
        filtered = algoliaSearchResults
      }
      // Priority 3: Use local filtering if no Algolia results
      else {
        filtered = filterProducts(allProducts, activeFilter, debouncedSearchQuery, columnFilters, advancedFilters)
      }
      
      // Apply custom filters only if they exist
      if (customFilters.length > 0) {
        filtered = filtered.filter(product => {
          return customFilters.every(customFilter => {
            const productValue = product[customFilter.field as keyof Product]
            
            switch (customFilter.operator) {
              case 'contains':
                return String(productValue || '').toLowerCase().includes(customFilter.value.toLowerCase())
              case 'equals':
                return String(productValue || '') === customFilter.value
              case 'starts_with':
                return String(productValue || '').toLowerCase().startsWith(customFilter.value.toLowerCase())
              case 'ends_with':
                return String(productValue || '').toLowerCase().endsWith(customFilter.value.toLowerCase())
              case 'greater_than':
                return Number(productValue || 0) > Number(customFilter.value)
              case 'less_than':
                return Number(productValue || 0) < Number(customFilter.value)
              case 'not_null':
                return productValue != null && productValue !== ''
              case 'last_7_days':
                const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000)
                const productDate = typeof productValue === 'string' ? new Date(productValue) : new Date()
                return productDate >= sevenDaysAgo
              case 'last_30_days':
                const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000)
                const productDate30 = typeof productValue === 'string' ? new Date(productValue) : new Date()
                return productDate30 >= thirtyDaysAgo
              case 'last_90_days':
                const ninetyDaysAgo = new Date(Date.now() - 90 * 24 * 60 * 60 * 1000)
                const productDate90 = typeof productValue === 'string' ? new Date(productValue) : new Date()
                return productDate90 >= ninetyDaysAgo
              default:
                return true
            }
          })
        })
      }
        
      // Apply search conditions only if they exist
      if (searchConditions.length > 0) {
        filtered = filtered.filter(product => {
          return searchConditions.every((condition, index) => {
            const productValue = product[condition.field as keyof Product]
            const value = String(productValue || '').toLowerCase()
            const searchValue = condition.value.toLowerCase()
            
            let matches = false
            switch (condition.operator) {
              case 'contains':
                matches = value.includes(searchValue)
                break
              case 'equals':
                matches = value === searchValue
                break
              case 'starts_with':
                matches = value.startsWith(searchValue)
                break
              case 'ends_with':
                matches = value.endsWith(searchValue)
                break
              default:
                matches = true
            }
            
            // Apply connector logic (AND/OR)
            if (index === 0) return matches
            const prevCondition = searchConditions[index - 1]
            if (prevCondition.connector === 'AND') {
              return matches
            } else if (prevCondition.connector === 'OR') {
              // For OR, we need to check if any previous condition was true
              const prevMatches = searchConditions.slice(0, index).some((_, i) => {
                const prevProductValue = product[searchConditions[i].field as keyof Product]
                const prevValue = String(prevProductValue || '').toLowerCase()
                const prevSearchValue = searchConditions[i].value.toLowerCase()
                
                switch (searchConditions[i].operator) {
                  case 'contains':
                    return prevValue.includes(prevSearchValue)
                  case 'equals':
                    return prevValue === prevSearchValue
                  case 'starts_with':
                    return prevValue.startsWith(prevSearchValue)
                  case 'ends_with':
                    return prevValue.endsWith(prevSearchValue)
                  default:
                    return true
                }
              })
              return prevMatches || matches
            }
            
            return matches
          })
        })
      }
        

      return filtered
    }, [
      allProducts, 
      activeFilter, 
      debouncedSearchQuery, 
      columnFilters, 
      advancedFilters, 
      customFilters, 
      searchConditions, 
      useAlgoliaSearch, 
      algoliaSearchResults,
      useAlgoliaFilters,
      algoliaFilterResults
    ])

    // Calculate total items for pagination - use Algolia filter results if active
    const totalItemsForPagination = useAlgoliaFilters && algoliaFilterResults.length > 0 
      ? algoliaFilterResults.length 
      : filteredProducts.length
    
    // When Algolia filters are active, show all results on one page for better UX
    // Otherwise use normal pagination
    const effectiveItemsPerPage = useAlgoliaFilters && algoliaFilterResults.length > 0 
      ? algoliaFilterResults.length 
      : itemsPerPage

    // Memoize paginated data
    const paginatedData = useMemo(() => {
      const startIndex = (currentPage - 1) * effectiveItemsPerPage
      const endIndex = startIndex + effectiveItemsPerPage
      return filteredProducts.slice(startIndex, endIndex)
    }, [filteredProducts, currentPage, effectiveItemsPerPage])

    // Memoize total pages
    const totalPages = useMemo(() => {
      return Math.ceil(totalItemsForPagination / effectiveItemsPerPage)
    }, [totalItemsForPagination, effectiveItemsPerPage])

    // KPI calculations will be handled by the existing logic

    // Handle product selection
    const handleSelectProduct = (productId: string) => {
      const currentIds = useProductsPageStore.getState().selectedRowIds
      const newIds = currentIds.includes(productId) 
        ? currentIds.filter((id: string) => id !== productId)
        : [...currentIds, productId]
      setSelectedRowIds(newIds)
    }

    const handleSelectAll = () => {
      if (selectedRowIds.length === paginatedData.length) {
        setSelectedRowIds([])
      } else {
        setSelectedRowIds(paginatedData.map(p => p.id))
      }
    }

    // Handle product row click
    const handleProductClick = (product: Product, event: React.MouseEvent) => {
      // Don't trigger if clicking on checkbox or action buttons
      if ((event.target as HTMLElement).closest('input[type="checkbox"]') ||
          (event.target as HTMLElement).closest('button')) {
        return
      }
      
      setPreviewProduct(product)
      setShowPreviewModal(true)
    }

    // Handle pagination
    const handlePageChange = (page: number) => {
      setCurrentPage(page)
      setPageIndex(page - 1) // Convert 1-based to 0-based
    }

    const handleItemsPerPageChange = (items: number) => {
    // Allow changing items per page since we're now using filtered data
      setItemsPerPage(items)
      setPageSize(items)
      setCurrentPage(1)
      setPageIndex(0) // Reset to first page (0-based)
    }

    // Handle column filtering
    const handleColumnFilterChange = (column: string, value: any) => {
      const currentFilters = useProductsPageStore.getState().columnFilters
      const newFilters = {
        ...currentFilters,
        [column]: value
      }
      setColumnFilters(newFilters)
    }

    const toggleColumnFilter = (column: string) => {
      setActiveColumnFilter(activeColumnFilter === column ? null : column)
    }

    const clearColumnFilters = () => {
      setColumnFilters({
        title: '',
        status: [],
        productType: [],
        vendor: [],
        category: [],
        tags: [],
        price: '',
        inventoryQuantity: '',
        createdAt: '',
        updatedAt: ''
      })
    }

    // Handle custom filters
    const addCustomFilter = (filter: { name: string; field: string; operator: string; value: string }) => {
      const newFilter: CustomFilter = {
        id: `custom-${Date.now()}`,
        ...filter
      }
      setCustomFilters(prev => [...prev, newFilter])
      setShowCustomFilterDropdown(false)
    }

    const removeCustomFilter = (filterId: string) => {
      setCustomFilters(prev => prev.filter(f => f.id !== filterId))
    }

    // Handle search conditions
    const clearSearchConditions = () => {
      setSearchConditions([])
    }

    const addSearchCondition = () => {
      const newCondition = {
        field: 'title',
        operator: 'contains' as const,
        value: '',
        connector: 'AND' as const
      }
      setSearchConditions([...searchConditions, newCondition])
    }

    const updateSearchCondition = (index: number, field: string, value: any) => {
      const updatedConditions = [...searchConditions]
      updatedConditions[index] = { ...updatedConditions[index], [field]: value }
      setSearchConditions(updatedConditions)
    }



    const removeSearchCondition = (index: number) => {
      setSearchConditions(searchConditions.filter((_, i) => i !== index))
    }

    const clearSearch = () => {
      setSearchQuery('')
      setGlobalFilter('') // Clear from Zustand store
    }

    // Handle filter visibility
    const showAllFilters = () => {
      setHiddenDefaultFilters(new Set())
    }

    // Header action handlers
    const handleExport = () => {
      setShowExportModal(true)
    }

    const handleImport = () => {
      setShowImportModal(true)
    }

    const handlePrint = () => {
      setShowPrintModal(true)
    }

    const handleSettings = () => {
      setShowSettingsModal(true)
      setShowHeaderDropdown(false)
    }

    const closeSettingsModal = () => {
      setShowSettingsModal(false)
    }


    // Bulk operation handlers
    const handleBulkEdit = () => {
      setShowBulkEditModal(true)
      setShowAdditionalControls(false)
    }

    const handleExportSelected = () => {
      setShowExportModal(true)
      setShowAdditionalControls(false)
    }

    const handleBulkDelete = () => {
      setShowBulkDeleteModal(true)
      setShowAdditionalControls(false)
    }

    // Handle full screen toggle
    const handleToggleFullScreen = () => {
      setIsFullScreen(!isFullScreen)
    }

    // Modal close handlers
    const closeBulkEditModal = () => {
      setShowBulkEditModal(false)
    }



    const closeBulkDeleteModal = () => {
      setShowBulkDeleteModal(false)
    }

    const closeImportModal = () => {
      setShowImportModal(false)
    }

    const closePrintModal = () => {
      setShowPrintModal(false)
    }

    // Utility functions for components
    const getUniqueValuesForField = (field: string) => getUniqueValues(productData, field)
    const getUniqueTagsFromProducts = () => getUniqueTags(productData)
    const getStatusBadgeForProduct = (status: string, type: 'status' | 'inventory') => getStatusBadge(status, type)

    // Search builder configuration
    const searchableFields = [
      { key: 'title', label: 'Product Title' },
      { key: 'vendor', label: 'Vendor' },
      { key: 'productType', label: 'Product Type' },
      { key: 'category', label: 'Category' },
      { key: 'description', label: 'Description' },
      { key: 'tags', label: 'Tags' }
    ]

    const operators = [
      { key: 'contains', label: 'Contains' },
      { key: 'equals', label: 'Equals' },
      { key: 'starts_with', label: 'Starts with' },
      { key: 'ends_with', label: 'Ends with' }
    ]

    // Close dropdowns when clicking outside
    useEffect(() => {
      const handleClickOutside = (event: MouseEvent) => {
        const target = event.target as HTMLElement
        
        if (!target.closest('.header-dropdown')) {
          setShowHeaderDropdown(false)
        }
        if (!target.closest('.custom-filter-dropdown')) {
          setShowCustomFilterDropdown(false)
        }
        if (!target.closest('.additional-controls-dropdown')) {
          setShowAdditionalControls(false)
        }
        if (!target.closest('.column-filter-dropdown')) {
          setActiveColumnFilter(null)
        }
      }

      document.addEventListener('mousedown', handleClickOutside)
      return () => document.removeEventListener('mousedown', handleClickOutside)
    }, [])

    // Optimized search effect with proper debouncing and reduced re-renders
    useEffect(() => {
      const timeoutId = setTimeout(() => {
        setDebouncedSearchQuery(searchQuery)
      }, 300)

      return () => clearTimeout(timeoutId)
    }, [searchQuery])

    // Optimized Algolia search effect with stable dependencies
    const handleAlgoliaSearch = useCallback((query: string) => {
      // Only search if query is at least 2 characters long
      if (query.trim().length >= 2) {
        setIsAlgoliaSearching(true)
        setUseAlgoliaSearch(true)
        
        debouncedAlgoliaSearch(query, allProducts, (products) => {
          setAlgoliaSearchResults(products)
          setIsAlgoliaSearching(false)
          
          // Save search to history only if we have results
          if (products.length > 0) {
            const newHistory = saveSearchToHistory(query, products.length, searchHistory)
            setSearchHistory(newHistory)
          }
        }, 300)
      } else {
        setAlgoliaSearchResults([])
        setUseAlgoliaSearch(false)
        setIsAlgoliaSearching(false)
      }
    }, []) // Remove dependencies to prevent recreation

    // Separate effect for Algolia search with proper dependency management
    useEffect(() => {
      // Prevent multiple simultaneous searches
      if (searchInProgressRef.current) {
        return
      }

      // Skip if query is too short or empty
      if (!debouncedSearchQuery.trim() || debouncedSearchQuery.trim().length < 2) {
        setAlgoliaSearchResults([])
        setUseAlgoliaSearch(false)
        setIsAlgoliaSearching(false)
        searchInProgressRef.current = false
        return
      }

      // Only search if query has changed and is valid
      searchInProgressRef.current = true
      setIsAlgoliaSearching(true)
      setUseAlgoliaSearch(true)
      
      debouncedAlgoliaSearch(debouncedSearchQuery, allProducts, (products) => {
        setAlgoliaSearchResults(products)
        setIsAlgoliaSearching(false)
        searchInProgressRef.current = false
        
        // Save search to history only if we have results
        if (products.length > 0) {
          const newHistory = saveSearchToHistory(debouncedSearchQuery, products.length, searchHistory)
          setSearchHistory(newHistory)
        }
      }, 300)

      // Cleanup function to reset search state on unmount
      return () => {
        searchInProgressRef.current = false
        setIsAlgoliaSearching(false)
      }
    }, [debouncedSearchQuery]) // Only depend on the search query

    // Reset to first page when filters change - optimized to prevent unnecessary resets
    useEffect(() => {
      setCurrentPage(1)
    }, [activeFilter, columnFilters]) // Removed debouncedSearchQuery to prevent constant resets

    // Handle settings updates
    const handleSettingsUpdate = (newSettings: Partial<ProductSettings>) => {
      setSettings(prev => ({ ...prev, ...newSettings }))
      
      // If auto-save filters is being disabled, clear saved filters
      if (newSettings.autoSaveFilters === false) {
        localStorage.removeItem('products-saved-filters')
      }
    }

    // Bulk edit form state
    const [bulkEditForm, setBulkEditForm] = useState({
      status: { enabled: false, value: '' },
      vendor: { enabled: false, value: '' },
      productType: { enabled: false, value: '' },
      tags: { enabled: false, value: '' },
      price: { enabled: false, operation: 'set', value: '' },
      inventory: { enabled: false, operation: 'set', value: '' }
    })

    const handleBulkEditFieldToggle = (field: string, enabled: boolean) => {
      setBulkEditForm(prev => ({
        ...prev,
        [field]: { ...prev[field as keyof typeof prev], enabled }
      }))
    }

    const handleBulkEditFieldChange = (field: string, value: string) => {
      setBulkEditForm(prev => ({
        ...prev,
        [field]: { ...prev[field as keyof typeof prev], value }
      }))
    }

    const handleBulkEditOperationChange = (field: string, operation: string) => {
      setBulkEditForm(prev => ({
        ...prev,
        [field]: { ...prev[field as keyof typeof prev], operation }
      }))
    }

    if ((loading || !isDataLoaded) && productData.length === 0) {
      return (
        <div className="min-h-screen bg-gray-50">
          {/* Header Skeleton */}
          <div className="bg-white border-b border-gray-200 px-6 py-4">
            <div className="animate-pulse">
              <div className="h-8 bg-gray-200 rounded w-32 mb-4"></div>
              <div className="flex space-x-4">
                <div className="h-10 bg-gray-200 rounded w-24"></div>
                <div className="h-10 bg-gray-200 rounded w-24"></div>
                <div className="h-10 bg-gray-200 rounded w-24"></div>
            </div>
            </div>
          </div>

          {/* KPI Skeleton */}
          <div className="px-6 py-4">
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
              {Array.from({ length: 6 }).map((_, i) => (
                <div key={i} className="bg-white border border-gray-200 rounded-lg p-4">
                  <div className="animate-pulse">
                    <div className="h-4 bg-gray-200 rounded w-20 mb-2"></div>
                    <div className="h-6 bg-gray-200 rounded w-16"></div>
              </div>
          </div>
              ))}
            </div>
          </div>

          {/* Table Skeleton */}
          <div className="px-6 py-4">
            <div className="bg-white border border-gray-200 rounded-lg overflow-hidden">
              <div className="animate-pulse">
                <div className="h-12 bg-gray-100"></div>
                {Array.from({ length: 5 }).map((_, i) => (
                  <div key={i} className="h-16 border-b border-gray-200 last:border-b-0">
                    <div className="flex items-center space-x-4 p-4">
                      <div className="w-10 h-10 bg-gray-200 rounded"></div>
                      <div className="flex-1">
                        <div className="h-4 bg-gray-200 rounded w-32 mb-2"></div>
                        <div className="h-3 bg-gray-200 rounded w-24"></div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )
    }

    if (error) {
      const isNoDataError = error.includes('No products data available')
      
      return (
        <div className="flex items-center justify-center h-64">
          <div className="text-center max-w-md">
            <div className={`text-lg font-semibold mb-2 ${isNoDataError ? 'text-orange-600' : 'text-red-600'}`}>
              {isNoDataError ? 'No Products Data Available' : 'Error Loading Products'}
            </div>
            <div className="text-gray-600 mb-4">{error}</div>
            
            {isNoDataError && (
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-4">
                <div className="text-blue-800 font-medium mb-2">How to fix this:</div>
                <ol className="text-blue-700 text-sm text-left space-y-1">
                  <li>1. Go to the <strong>Caching</strong> page in Settings</li>
                  <li>2. Click "Start Caching" for the <strong>Products</strong> section</li>
                  <li>3. Wait for the caching to complete</li>
                  <li>4. Return to this page and refresh</li>
                </ol>
              </div>
            )}
            
            <div className="space-x-2">
              <button 
                onClick={() => setError(null)}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
              >
                Retry
              </button>
              
              {isNoDataError && (
                <button 
                  onClick={() => window.location.href = '/settings/caching'}
                  className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700"
                >
                  Go to Caching Page
                </button>
              )}
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
            <h2 className="text-lg font-semibold text-gray-900">Products - Full Screen View</h2>
            <button
              onClick={handleToggleFullScreen}
              className="p-2 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-md transition-colors"
              title="Exit Full Screen"
            >
              <X className="h-5 w-5" />
            </button>
          </div>
        )}

        {/* KPI Metrics */}
        <KPIGrid 
          kpiMetrics={kpiMetrics} 
          products={useAlgoliaFilters && algoliaFilterResults.length > 0 
            ? algoliaFilterResults 
            : (useAlgoliaSearch && algoliaSearchResults.length > 0 
              ? algoliaSearchResults 
              : allProducts)}
          onRefresh={(kpiKey) => {
            console.log(`Refreshing ${kpiKey} KPI...`)
            // Here you can implement actual refresh logic
            // For now, we'll just log the action
          }}
          onConfigure={(kpiKey, config) => {
            console.log(`Configuring ${kpiKey} KPI:`, config)
            // Here you can implement configuration saving logic
            // For now, we'll just log the configuration
          }}
        />

        {/* Search and Filter Controls - Sticky in Full Screen */}
        <div className={cn(
          isFullScreen ? "sticky top-0 z-10 bg-white border-b border-gray-200" : ""
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
          onAddCustomFilter={addCustomFilter}
          onRemoveCustomFilter={removeCustomFilter}
          showCustomFilterDropdown={showCustomFilterDropdown}
          setShowCustomFilterDropdown={setShowCustomFilterDropdown}
          hiddenDefaultFilters={hiddenDefaultFilters}
          onShowAllFilters={showAllFilters}
          onClearSearch={clearSearch}
          onClearSearchConditions={clearSearchConditions}
          selectedProducts={selectedRowIds}
          onBulkEdit={handleBulkEdit}
          onExportSelected={handleExportSelected}
          onBulkDelete={handleBulkDelete}
          // Column filter props
          currentProducts={paginatedData}
          onSelectAll={handleSelectAll}
          activeColumnFilter={activeColumnFilter}
          columnFilters={columnFilters}
          onFilterClick={toggleColumnFilter}
          onColumnFilterChange={handleColumnFilterChange}
          getUniqueValues={getUniqueValuesForField}
          // Header action props
          onExport={handleExport}
          onImport={handleImport}
          onPrint={handlePrint}
          onSettings={handleSettings}
          showHeaderDropdown={showHeaderDropdown}
          setShowHeaderDropdown={setShowHeaderDropdown}
          // View and control props
          viewMode={viewMode}
          setViewMode={setViewMode}
          showAdvancedFilter={showAdvancedFilter}
          setShowAdvancedFilter={setShowAdvancedFilter}
          isFullScreen={isFullScreen}
          onToggleFullScreen={handleToggleFullScreen}
          // Algolia search props
          isAlgoliaSearching={isAlgoliaSearching}
          useAlgoliaSearch={useAlgoliaSearch}
          // Algolia filter props
          isAlgoliaFiltering={isAlgoliaFiltering}
          useAlgoliaFilters={useAlgoliaFilters}
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
                    onClick={clearSearchConditions}
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

              <div className="space-y-3">
                {searchConditions.length === 0 && (
                  <div className="text-center py-4 text-gray-500 text-sm">
                    No search conditions added. Click "Add Condition" to start building your search.
                  </div>
                )}
                
                {searchConditions.length > 0 && (
                  <div className="p-3 bg-blue-50 border border-blue-200 rounded-md">
                    <div className="text-xs font-medium text-blue-800 mb-2">Active Search Conditions:</div>
                    <div className="space-y-1">
                      {searchConditions.map((condition, index) => (
                        <div key={index} className="text-xs text-blue-700">
                          {index > 0 && <span className="font-medium">{condition.connector} </span>}
                          <span className="font-medium">{searchableFields.find(f => f.key === condition.field)?.label}</span>
                          <span> {condition.operator.replace('_', ' ')} </span>
                          <span className="font-medium">"{condition.value}"</span>
                  </div>
                      ))}
                </div>
              </div>
                )}
                
                {searchConditions.map((condition, index) => (
                  <div key={index} className="flex items-center space-x-2 p-3 bg-gray-50 rounded-md border border-gray-200">
                    {index > 0 && (
          <select
                    value={condition.connector}
                    onChange={(e) => updateSearchCondition(index, 'connector', e.target.value)}
                    className="text-xs border border-gray-300 rounded px-2 py-1 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  >
                    <option value="AND">AND</option>
                    <option value="OR">OR</option>
          </select>
                    )}
                    
          <select
                  value={condition.field}
                  onChange={(e) => updateSearchCondition(index, 'field', e.target.value)}
                  className="text-xs border border-gray-300 rounded px-2 py-1 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  {searchableFields.map(field => (
                    <option key={field.key} value={field.key}>{field.label}</option>
                  ))}
          </select>
                    
          <select
                  value={condition.operator}
                  onChange={(e) => updateSearchCondition(index, 'operator', e.target.value)}
                  className="text-xs border border-gray-300 rounded px-2 py-1 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  {operators.map(op => (
                    <option key={op.key} value={op.key}>{op.label}</option>
                  ))}
          </select>
                    
                  <input
                    type="text"
                    placeholder="Enter value..."
                    value={condition.value}
                    onChange={(e) => updateSearchCondition(index, 'value', e.target.value)}
                    className="flex-1 text-xs border border-gray-300 rounded px-2 py-1 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                    
          <button
                  onClick={() => removeSearchCondition(index)}
                  className="p-1 text-red-500 hover:text-red-700"
                >
                    <X className="h-3 w-3" />
          </button>
                  </div>
                ))}
                
              <button
                  onClick={addSearchCondition}
                  className="px-3 py-1 bg-gray-100 text-gray-700 text-xs rounded-md hover:bg-gray-200"
                >
                  Add Condition
              </button>
              </div>
            </div>
          </div>
        )}

        {/* Enhanced Advanced Filter Panel */}
        {showAdvancedFilter && (
          <div className="px-4 pb-1">
            <div className="bg-white border border-gray-200 rounded-lg shadow-sm p-3">
              {/* Enhanced Header */}
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center space-x-3">
                  <div className="w-3 h-3 bg-gradient-to-r from-blue-500 to-indigo-500 rounded-full animate-pulse"></div>
                  <div className="flex items-center space-x-2">
                    <h3 className="text-base font-semibold text-gray-900">Advanced Filters</h3>
                    <span className="text-xs text-gray-500 bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-200 px-3 py-1 rounded-full font-medium">
                      {[
                        advancedFilters.productStatus.length,
                        advancedFilters.tags.length,
                        advancedFilters.vendors.length,
                        advancedFilters.priceRange.min ? 1 : 0,
                        advancedFilters.priceRange.max ? 1 : 0,
                        advancedFilters.dateRange.start ? 1 : 0,
                        advancedFilters.dateRange.end ? 1 : 0
                      ].reduce((a, b) => a + b, 0)} active
                    </span>
                  </div>
                  {/* Active Filters Inline Display */}
                  {(advancedFilters.productStatus.length > 0 || 
                    advancedFilters.tags.length > 0 || 
                    advancedFilters.vendors.length > 0 ||
                    advancedFilters.priceRange.min || 
                    advancedFilters.priceRange.max ||
                    advancedFilters.dateRange.start || 
                    advancedFilters.dateRange.end) && (
                    <div className="flex flex-wrap gap-1.5">
                      {advancedFilters.productStatus.map(status => (
                        <span key={status} className="inline-flex items-center space-x-1 px-2 py-0.5 bg-gradient-to-r from-blue-100 to-blue-200 text-blue-800 text-xs rounded-full border border-blue-300 shadow-sm hover:shadow-md transition-all duration-200">
                          <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
                            <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                          </svg>
                          <span className="capitalize font-medium">{status}</span>
                          <button
                            onClick={() => setAdvancedFilters(prev => ({
                              ...prev,
                              productStatus: prev.productStatus.filter(s => s !== status)
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
                      {advancedFilters.vendors.map(vendor => (
                        <span key={vendor} className="inline-flex items-center space-x-1 px-2 py-0.5 bg-gradient-to-r from-indigo-100 to-indigo-200 text-indigo-800 text-xs rounded-full border border-indigo-300 shadow-sm hover:shadow-md transition-all duration-200">
                          <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
                            <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                          </svg>
                          <span className="font-medium">{vendor}</span>
                          <button
                            onClick={() => setAdvancedFilters(prev => ({
                              ...prev,
                              vendors: prev.vendors.filter(v => v !== vendor)
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
                        <span className="inline-flex items-center space-x-1 px-2 py-0.5 bg-gradient-to-r from-green-100 to-green-200 text-green-800 text-xs rounded-full border border-green-300 shadow-sm hover:shadow-md transition-all duration-200">
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
                <div className="flex items-center space-x-2">
                  <button
                    onClick={() => setAdvancedFilters({
                      productStatus: [],
                      priceRange: { min: '', max: '' },
                      dateRange: { start: '', end: '' },
                      tags: [],
                      vendors: []
                    })}
                    className="text-xs text-gray-600 hover:text-gray-800 hover:bg-gray-100 px-2 py-1 rounded-md transition-all duration-200 flex items-center space-x-1.5 border border-gray-200 hover:border-gray-300"
                  >
                    <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                    </svg>
                    <span>Clear all</span>
                  </button>
                  <button
                    onClick={() => setShowAdvancedFilter(false)}
                    className="text-xs text-gray-600 hover:text-gray-800 hover:bg-gray-100 px-2 py-1 rounded-md transition-all duration-200 flex items-center space-x-1.5 border border-gray-200 hover:border-gray-300"
                  >
                    <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                    <span>Close</span>
                  </button>
                </div>
              </div>
              
              {/* Enhanced Filter Grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-3">
                {/* Product Status */}
                <div className="bg-gradient-to-br from-blue-50 to-indigo-50 border border-blue-200 rounded-lg p-1.5 space-y-1">
                  <label className="text-xs font-semibold text-gray-800 flex items-center space-x-2">
                    <div className="w-5 h-5 bg-blue-500 rounded-lg flex items-center justify-center">
                      <svg className="w-3.5 h-3.5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                    </div>
                    <span>Product Status</span>
                  </label>
                  <div className="space-y-0.5">
                    {['active', 'draft', 'archived'].map(status => (
                      <label key={status} className="flex items-center space-x-2 cursor-pointer group p-0.5 rounded-md hover:bg-white/50 transition-colors">
                        <input
                          type="checkbox"
                          checked={advancedFilters.productStatus.includes(status)}
                          onChange={(e) => {
                            if (e.target.checked) {
                              setAdvancedFilters(prev => ({
                                ...prev,
                                productStatus: [...prev.productStatus, status]
                              }))
                            } else {
                              setAdvancedFilters(prev => ({
                                ...prev,
                                productStatus: prev.productStatus.filter(s => s !== status)
                              }))
                            }
                          }}
                          className="rounded border-gray-300 text-blue-600 focus:ring-blue-500 w-4 h-4"
                        />
                        <span className="text-xs text-gray-700 group-hover:text-gray-900 capitalize font-medium">{status}</span>
                      </label>
                    ))}
                  </div>
                </div>

                {/* Price Range */}
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
                        value={advancedFilters.priceRange.min}
                        onChange={(e) => setAdvancedFilters(prev => ({ 
                          ...prev, 
                          priceRange: { ...prev.priceRange, min: e.target.value } 
                        }))}
                        className="w-full text-xs border border-green-200 rounded-md px-2 py-1.5 focus:ring-2 focus:ring-green-500 focus:border-transparent pl-8 bg-white/70 hover:bg-white transition-colors"
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
                        className="w-full text-xs border border-green-200 rounded-md px-2 py-1.5 focus:ring-2 focus:ring-green-500 focus:border-transparent pl-8 bg-white/70 hover:bg-white transition-colors"
                      />
                      <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-green-600 text-sm font-medium">₹</span>
                    </div>
                  </div>
                </div>

                {/* Date Range */}
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
                        value={advancedFilters.dateRange.start}
                        onChange={(e) => setAdvancedFilters(prev => ({ 
                          ...prev, 
                          dateRange: { ...prev.dateRange, start: e.target.value } 
                        }))}
                        className="w-full text-xs border border-purple-200 rounded-md px-2 py-1.5 focus:ring-2 focus:ring-purple-500 focus:border-transparent bg-white/70 hover:bg-white transition-colors"
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
                        className="w-full text-xs border border-purple-200 rounded-md px-2 py-1.5 focus:ring-2 focus:ring-purple-500 focus:border-transparent bg-white/70 hover:bg-white transition-colors"
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
                    {getUniqueTagsFromProducts().map(tag => (
                      <label key={tag} className="flex items-center space-x-2 cursor-pointer group p-1 rounded-md hover:bg-orange-100/50 transition-colors">
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
                          className="rounded border-orange-300 text-orange-600 focus:ring-orange-500 w-4 h-4"
                        />
                        <span className="text-sm text-gray-700 group-hover:text-gray-900 font-medium">{tag}</span>
                      </label>
                    ))}
                  </div>
                </div>

                {/* Vendors */}
                <div className="bg-gradient-to-br from-indigo-50 to-blue-50 border border-indigo-200 rounded-lg p-1.5 space-y-1">
                  <label className="text-xs font-semibold text-gray-800 flex items-center space-x-2">
                    <div className="w-5 h-5 bg-indigo-500 rounded-lg flex items-center justify-center">
                      <svg className="w-3.5 h-3.5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                      </svg>
                    </div>
                    <span>Vendors</span>
                  </label>
                  <div className="h-28 overflow-y-auto border border-indigo-200 rounded-md p-1.5 space-y-0.5 bg-white/50">
                    {getUniqueValuesForField('vendor').map(vendor => (
                      <label key={vendor} className="flex items-center space-x-2 cursor-pointer group p-1 rounded-md hover:bg-indigo-100/50 transition-colors">
                        <input
                          type="checkbox"
                          checked={advancedFilters.vendors.includes(vendor)}
                          onChange={(e) => {
                            if (e.target.checked) {
                              setAdvancedFilters(prev => ({ 
                                ...prev, 
                                vendors: [...prev.vendors, vendor] 
                              }))
                            } else {
                              setAdvancedFilters(prev => ({ 
                                ...prev, 
                                vendors: prev.vendors.filter(v => v !== vendor) 
                              }))
                            }
                          }}
                          className="rounded border-indigo-300 text-indigo-600 focus:ring-indigo-500 w-4 h-4"
                        />
                        <span className="text-sm text-gray-700 group-hover:text-gray-900 font-medium">{vendor}</span>
                      </label>
                    ))}
                  </div>
                </div>
              </div>


            </div>
          </div>
        )}

        {/* Main Content Area */}
        <div className={cn(
          "transition-all duration-300",
          isFullScreen 
            ? "flex-1 overflow-hidden flex flex-col" 
            : "px-3 py-0.5"
        )}>
          {/* All View Containers - Standardized Layout */}
          <div className={cn(
            "bg-white rounded-md border border-gray-200 overflow-hidden",
            isFullScreen ? "flex-1 flex flex-col" : ""
          )}>
            {/* Bulk Actions Bar - Common for all views */}
            <BulkActionsBar
              selectedProducts={selectedRowIds}
              totalProducts={totalItemsForPagination}
              onBulkEdit={handleBulkEdit}
              onExportSelected={handleExportSelected}
              onBulkDelete={handleBulkDelete}
            />

          {viewMode === 'table' && (
            <>
                {/* Products Table - Scrollable Content */}
                <div className={cn(
                  isFullScreen ? "flex-1 overflow-auto" : ""
                )}>
              <ProductTable
                currentProducts={paginatedData}
                selectedProducts={selectedRowIds}
                onSelectProduct={handleSelectProduct}
                onSelectAll={handleSelectAll}
                onProductClick={handleProductClick}
                getStatusBadge={getStatusBadgeForProduct}
                activeColumnFilter={activeColumnFilter}
                columnFilters={columnFilters}
                onFilterClick={toggleColumnFilter}
                onColumnFilterChange={handleColumnFilterChange}
                getUniqueValues={getUniqueValuesForField}
                isFullScreen={isFullScreen}
                searchQuery={debouncedSearchQuery}
                showImages={settings.showImages}
              />
                </div>
                
                {/* Pagination for Table View - Sticky Bottom */}
                <div className={cn(
                  "border-t border-gray-200",
                  isFullScreen ? "sticky bottom-0 bg-white z-10" : ""
                )}>
              <Pagination
                currentPage={currentPage}
                totalPages={totalPages}
                itemsPerPage={itemsPerPage}
                totalItems={totalItemsForPagination}
                onPageChange={handlePageChange}
                onItemsPerPageChange={handleItemsPerPageChange}
              />
                </div>
            </>
          )}

          {viewMode === 'grid' && (
              <>
                {/* Grid Filter Header - Sticky in Full Screen */}
                <div className={cn(
                  isFullScreen ? "sticky top-0 z-10 bg-white border-b border-gray-200" : ""
                )}>
                  <GridCardFilterHeader
                    selectedProducts={selectedRowIds}
                    currentProducts={paginatedData}
                    onSelectAll={handleSelectAll}
                    activeColumnFilter={activeColumnFilter}
                    columnFilters={columnFilters}
                    onFilterClick={toggleColumnFilter}
                    onColumnFilterChange={handleColumnFilterChange}
                    getUniqueValues={getUniqueValuesForField}
                    cardsPerRow={cardsPerRow}
                    onCardsPerRowChange={setCardsPerRow}
                  />
                </div>
                
                {/* Grid Content - Scrollable */}
                <div 
                  className={cn(
                    getGridClasses(cardsPerRow).className,
                    isFullScreen ? "flex-1 overflow-auto" : ""
                  )}
                  style={getGridClasses(cardsPerRow).style}
                >
                {paginatedData.map((product) => (
                  <div
                    key={product.id}
                    className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow cursor-pointer"
                    onClick={(e) => handleProductClick(product, e)}
                  >
                    <div className="flex items-center space-x-3 mb-3">
                    <input
                      type="checkbox"
                        checked={selectedRowIds.includes(product.id)}
                      onChange={(e) => {
                          e.stopPropagation()
                          handleSelectProduct(product.id)
                        }}
                        className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                      />
                      {settings.showImages ? (
                      <ProductImage src={product.images?.[0] || ''} alt={product.title} size="md" />
                      ) : (
                        <div className="w-12 h-12 flex items-center justify-center bg-gray-200 rounded-lg">
                          <svg className="w-6 h-6 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                          </svg>
                    </div>
                      )}
                    </div>
                    <h3 className="font-medium text-gray-900 mb-1 line-clamp-2">
                      {debouncedSearchQuery && product._highlightResult?.title?.value ? (
                        <HighlightedText 
                          text={product._highlightResult.title.value}
                          className="text-gray-900"
                        />
                      ) : (
                        product.title
                      )}
                    </h3>
                    <p className="text-sm text-gray-500 mb-2">{product.vendor}</p>
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-lg font-semibold text-gray-900">₹{product.price}</span>
                      {(() => {
                        const badge = getStatusBadgeForProduct(product.status, 'status')
                        return <span className={badge.className}>{badge.text}</span>
                      })()}
                    </div>
                    <div className="flex items-center justify-between text-sm text-gray-500">
                      <span>Stock: {product.inventoryQuantity}</span>
                      <span>{product.productType}</span>
                    </div>
                  </div>
                ))}
              </div>
                
                {/* Pagination for Grid View - Sticky Bottom */}
                <div className={cn(
                  "border-t border-gray-200",
                  isFullScreen ? "sticky bottom-0 bg-white z-10" : ""
                )}>
                <Pagination
                  currentPage={currentPage}
                  totalPages={totalPages}
                  totalItems={totalItemsForPagination}
                  itemsPerPage={itemsPerPage}
                  onPageChange={handlePageChange}
                  onItemsPerPageChange={handleItemsPerPageChange}
                />
              </div>
              </>
          )}

          {viewMode === 'card' && (
            <>
                {/* Card Filter Header - Sticky in Full Screen */}
                <div className={cn(
                  isFullScreen ? "sticky top-0 z-10 bg-white border-b border-gray-200" : ""
                )}>
                  <GridCardFilterHeader
                    selectedProducts={selectedRowIds}
                    currentProducts={paginatedData}
                    onSelectAll={handleSelectAll}
                    activeColumnFilter={activeColumnFilter}
                    columnFilters={columnFilters}
                    onFilterClick={toggleColumnFilter}
                    onColumnFilterChange={handleColumnFilterChange}
                    getUniqueValues={getUniqueValuesForField}
                    cardsPerRow={cardsPerRow}
                    onCardsPerRowChange={setCardsPerRow}
                  />
                </div>
                
                {/* Card Content - Scrollable */}
                <div className={cn(
                  isFullScreen ? "flex-1 overflow-auto" : ""
                )}>
                <ProductCardView
                  currentProducts={paginatedData}
                  selectedProducts={selectedRowIds}
                  onSelectProduct={handleSelectProduct}
                  onProductClick={handleProductClick}
                  getStatusBadge={getStatusBadgeForProduct}
                  cardsPerRow={cardsPerRow}
                  searchQuery={debouncedSearchQuery}
                  showImages={settings.showImages}
                />
              </div>
              
                {/* Pagination for Card View - Sticky Bottom */}
                <div className={cn(
                  "border-t border-gray-200",
                  isFullScreen ? "sticky bottom-0 bg-white z-10" : ""
                )}>
                <Pagination
                  currentPage={currentPage}
                  totalPages={totalPages}
                  itemsPerPage={itemsPerPage}
                  totalItems={totalItemsForPagination}
                  onPageChange={handlePageChange}
                  onItemsPerPageChange={handleItemsPerPageChange}
                />
              </div>
            </>
          )}
          </div>
        </div>

        {/* Preview Modal */}
        {showPreviewModal && previewProduct && (
          <EnhancedDetailModal
            isOpen={showPreviewModal}
            onClose={() => setShowPreviewModal(false)}
            item={previewProduct}
            itemType="product"
            onEdit={async (id: string, data: any) => {
              console.log('Edit product:', id, data)
              try {
                // Example API call:
                // await fetch(`/api/products/${id}`, {
                //   method: 'PATCH',
                //   headers: { 'Content-Type': 'application/json' },
                //   body: JSON.stringify(data)
                // })
                console.log('Product updated successfully')
              } catch (error) {
                console.error('Error updating product:', error)
                throw error
              }
            }}
            onDelete={async (id: string) => {
              console.log('Delete product:', id)
              try {
                // Example API call:
                // await fetch(`/api/products/${id}`, {
                //   method: 'DELETE'
                // })
                console.log('Product deleted successfully')
              } catch (error) {
                console.error('Error deleting product:', error)
                throw error
              }
            }}
            onSave={async (id: string, data: any) => {
              console.log('Save product:', id, data)
              try {
                // Example API call:
                // await fetch(`/api/products/${id}`, {
                //   method: 'PATCH',
                //   headers: { 'Content-Type': 'application/json' },
                //   body: JSON.stringify(data)
                // })
                console.log('Product saved successfully')
              } catch (error) {
                console.error('Error saving product:', error)
                throw error
              }
            }}
          />
        )}

        {/* Export Modal */}
        <ExportModal
          isOpen={showExportModal}
          onClose={() => setShowExportModal(false)}
          products={useAlgoliaFilters && algoliaFilterResults.length > 0 
            ? algoliaFilterResults 
            : (useAlgoliaSearch && algoliaSearchResults.length > 0 
              ? algoliaSearchResults 
              : filteredProducts)}
          selectedProducts={selectedRowIds}
        />





        {/* Bulk Edit Modal */}
        {showBulkEditModal && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full mx-4 max-h-[90vh] overflow-y-auto">
              {/* Header */}
              <div className="flex items-center justify-between p-6 border-b border-gray-200">
                <div className="flex items-center space-x-3">
                  <div className="p-2 bg-blue-100 rounded-lg">
                    <svg className="h-5 w-5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                    </svg>
                  </div>
                  <div>
                    <h2 className="text-lg font-semibold text-gray-900">Bulk Edit Products</h2>
                    <p className="text-sm text-gray-500">
                Edit {selectedRowIds.length} selected product{selectedRowIds.length !== 1 ? 's' : ''}
              </p>
                  </div>
                </div>
                <button
                  onClick={closeBulkEditModal}
                  className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>

              <div className="p-6 space-y-6">
                {/* Edit Fields Section */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-3">
                    Edit Fields
                  </label>
                  <div className="space-y-4">
                                         {/* Status Field */}
                     <div className="border rounded-lg p-4">
                       <div className="flex items-center justify-between mb-3">
                         <label className="text-sm font-medium text-gray-700">Status</label>
                         <div className="flex items-center space-x-2">
                           <input
                             type="checkbox"
                             checked={bulkEditForm.status.enabled}
                             onChange={(e) => handleBulkEditFieldToggle('status', e.target.checked)}
                             className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                           />
                           <label className="text-xs text-gray-500">Apply to all</label>
                         </div>
                       </div>
                       <select 
                         value={bulkEditForm.status.value}
                         onChange={(e) => handleBulkEditFieldChange('status', e.target.value)}
                         className="w-full border border-gray-300 rounded-md px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                         disabled={!bulkEditForm.status.enabled}
                       >
                    <option value="">No change</option>
                    <option value="active">Active</option>
                    <option value="draft">Draft</option>
                    <option value="archived">Archived</option>
                  </select>
                </div>

                     {/* Vendor Field */}
                     <div className="border rounded-lg p-4">
                       <div className="flex items-center justify-between mb-3">
                         <label className="text-sm font-medium text-gray-700">Vendor</label>
                         <div className="flex items-center space-x-2">
                           <input
                             type="checkbox"
                             checked={bulkEditForm.vendor.enabled}
                             onChange={(e) => handleBulkEditFieldToggle('vendor', e.target.checked)}
                             className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                           />
                           <label className="text-xs text-gray-500">Apply to all</label>
                </div>
                </div>
                       <input 
                         type="text" 
                         value={bulkEditForm.vendor.value}
                         onChange={(e) => handleBulkEditFieldChange('vendor', e.target.value)}
                         placeholder="Enter vendor name" 
                         className="w-full border border-gray-300 rounded-md px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                         disabled={!bulkEditForm.vendor.enabled}
                       />
              </div>

                     {/* Product Type Field */}
                     <div className="border rounded-lg p-4">
                       <div className="flex items-center justify-between mb-3">
                         <label className="text-sm font-medium text-gray-700">Product Type</label>
                         <div className="flex items-center space-x-2">
                           <input
                             type="checkbox"
                             checked={bulkEditForm.productType.enabled}
                             onChange={(e) => handleBulkEditFieldToggle('productType', e.target.checked)}
                             className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                           />
                           <label className="text-xs text-gray-500">Apply to all</label>
                         </div>
                       </div>
                       <input 
                         type="text" 
                         value={bulkEditForm.productType.value}
                         onChange={(e) => handleBulkEditFieldChange('productType', e.target.value)}
                         placeholder="Enter product type" 
                         className="w-full border border-gray-300 rounded-md px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                         disabled={!bulkEditForm.productType.enabled}
                       />
                     </div>

                     {/* Tags Field */}
                     <div className="border rounded-lg p-4">
                       <div className="flex items-center justify-between mb-3">
                         <label className="text-sm font-medium text-gray-700">Tags</label>
                         <div className="flex items-center space-x-2">
                           <input
                             type="checkbox"
                             checked={bulkEditForm.tags.enabled}
                             onChange={(e) => handleBulkEditFieldToggle('tags', e.target.checked)}
                             className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                           />
                           <label className="text-xs text-gray-500">Apply to all</label>
                         </div>
                       </div>
                       <input 
                         type="text" 
                         value={bulkEditForm.tags.value}
                         onChange={(e) => handleBulkEditFieldChange('tags', e.target.value)}
                         placeholder="Enter tags (comma separated)" 
                         className="w-full border border-gray-300 rounded-md px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                         disabled={!bulkEditForm.tags.enabled}
                       />
                     </div>

                     {/* Price Field */}
                     <div className="border rounded-lg p-4">
                       <div className="flex items-center justify-between mb-3">
                         <label className="text-sm font-medium text-gray-700">Price</label>
                         <div className="flex items-center space-x-2">
                           <input
                             type="checkbox"
                             checked={bulkEditForm.price.enabled}
                             onChange={(e) => handleBulkEditFieldToggle('price', e.target.checked)}
                             className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                           />
                           <label className="text-xs text-gray-500">Apply to all</label>
                         </div>
                       </div>
                       <div className="flex space-x-2">
                         <select 
                           value={bulkEditForm.price.operation}
                           onChange={(e) => handleBulkEditOperationChange('price', e.target.value)}
                           className="flex-1 border border-gray-300 rounded-md px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                           disabled={!bulkEditForm.price.enabled}
                         >
                           <option value="set">Set to</option>
                           <option value="increase">Increase by</option>
                           <option value="decrease">Decrease by</option>
                           <option value="percentage">Percentage</option>
                         </select>
                         <input 
                           type="number" 
                           value={bulkEditForm.price.value}
                           onChange={(e) => handleBulkEditFieldChange('price', e.target.value)}
                           placeholder="0.00" 
                           className="flex-1 border border-gray-300 rounded-md px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                           disabled={!bulkEditForm.price.enabled}
                         />
                       </div>
                     </div>

                     {/* Inventory Field */}
                     <div className="border rounded-lg p-4">
                       <div className="flex items-center justify-between mb-3">
                         <label className="text-sm font-medium text-gray-700">Inventory Quantity</label>
                         <div className="flex items-center space-x-2">
                           <input
                             type="checkbox"
                             checked={bulkEditForm.inventory.enabled}
                             onChange={(e) => handleBulkEditFieldToggle('inventory', e.target.checked)}
                             className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                           />
                           <label className="text-xs text-gray-500">Apply to all</label>
                         </div>
                       </div>
                       <div className="flex space-x-2">
                         <select 
                           value={bulkEditForm.inventory.operation}
                           onChange={(e) => handleBulkEditOperationChange('inventory', e.target.value)}
                           className="flex-1 border border-gray-300 rounded-md px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                           disabled={!bulkEditForm.inventory.enabled}
                         >
                           <option value="set">Set to</option>
                           <option value="increase">Increase by</option>
                           <option value="decrease">Decrease by</option>
                         </select>
                         <input 
                           type="number" 
                           value={bulkEditForm.inventory.value}
                           onChange={(e) => handleBulkEditFieldChange('inventory', e.target.value)}
                           placeholder="0" 
                           className="flex-1 border border-gray-300 rounded-md px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                           disabled={!bulkEditForm.inventory.enabled}
                         />
              </div>
            </div>
          </div>
                </div>

                                 {/* Edit Summary Section */}
                <div>
                   <label className="block text-sm font-medium text-gray-700 mb-3">
                     Edit Summary
                      </label>
                   <div className="bg-gray-50 rounded-lg p-4 space-y-2 text-sm">
                     <div className="flex justify-between">
                       <span className="text-gray-600">Products to edit:</span>
                       <span className="font-medium">{selectedRowIds.length}</span>
                  </div>
                     <div className="flex justify-between">
                       <span className="text-gray-600">Fields to update:</span>
                       <span className="font-medium">
                         {Object.values(bulkEditForm).filter(field => field.enabled).length} selected
                       </span>
                </div>
                     <div className="flex justify-between">
                       <span className="text-gray-600">Estimated time:</span>
                       <span className="font-medium">~{Math.ceil(selectedRowIds.length / 10)} seconds</span>
              </div>
                     {Object.values(bulkEditForm).filter(field => field.enabled).length > 0 && (
                       <div className="mt-3 pt-3 border-t border-gray-200">
                         <div className="text-xs text-gray-500 mb-2">Changes to apply:</div>
                         <div className="space-y-1">
                           {bulkEditForm.status.enabled && (
                             <div className="text-xs text-gray-600">• Status: {bulkEditForm.status.value || 'No change'}</div>
                           )}
                           {bulkEditForm.vendor.enabled && (
                             <div className="text-xs text-gray-600">• Vendor: {bulkEditForm.vendor.value || 'Not specified'}</div>
                           )}
                           {bulkEditForm.productType.enabled && (
                             <div className="text-xs text-gray-600">• Product Type: {bulkEditForm.productType.value || 'Not specified'}</div>
                           )}
                           {bulkEditForm.tags.enabled && (
                             <div className="text-xs text-gray-600">• Tags: {bulkEditForm.tags.value || 'Not specified'}</div>
                           )}
                           {bulkEditForm.price.enabled && (
                             <div className="text-xs text-gray-600">• Price: {bulkEditForm.price.operation} {bulkEditForm.price.value || '0'}</div>
                           )}
                           {bulkEditForm.inventory.enabled && (
                             <div className="text-xs text-gray-600">• Inventory: {bulkEditForm.inventory.operation} {bulkEditForm.inventory.value || '0'}</div>
                           )}
                         </div>
                       </div>
                     )}
                   </div>
                 </div>
              </div>

              {/* Footer */}
              <div className="flex justify-end space-x-3 p-6 border-t border-gray-200">
                <button
                  onClick={closeBulkEditModal}
                  className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 rounded-md hover:bg-gray-200 transition-colors"
                >
                  Cancel
                </button>
                <button
                   onClick={() => {
                     // Validate that at least one field is enabled
                     const enabledFields = Object.values(bulkEditForm).filter(field => field.enabled)
                     if (enabledFields.length === 0) {
                       alert('Please select at least one field to edit.')
                       return
                     }

                     // Validate that enabled fields have values
                     const invalidFields = enabledFields.filter(field => !field.value)
                     if (invalidFields.length > 0) {
                       alert('Please provide values for all selected fields.')
                       return
                     }

                     // Handle bulk edit logic here
                     console.log('Applying bulk edit changes...', {
                       selectedRowIds,
                       changes: bulkEditForm,
                       enabledFields: enabledFields.length
                     })
                     
                     // Reset form
                     setBulkEditForm({
                       status: { enabled: false, value: '' },
                       vendor: { enabled: false, value: '' },
                       productType: { enabled: false, value: '' },
                       tags: { enabled: false, value: '' },
                       price: { enabled: false, operation: 'set', value: '' },
                       inventory: { enabled: false, operation: 'set', value: '' }
                     })
                     
                     closeBulkEditModal()
                   }}
                   disabled={Object.values(bulkEditForm).filter(field => field.enabled).length === 0}
                   className="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-md hover:bg-blue-700 transition-colors flex items-center space-x-2 disabled:bg-gray-400 disabled:cursor-not-allowed"
                 >
                   <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                     <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                   </svg>
                   <span>Apply Changes</span>
                </button>
              </div>
            </div>
          </div>
        )}



        {/* Bulk Delete Modal */}
        {showBulkDeleteModal && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Delete Products</h3>
              <p className="text-sm text-gray-600 mb-4">
                Are you sure you want to delete {selectedRowIds.length} selected product{selectedRowIds.length !== 1 ? 's' : ''}? This action cannot be undone.
              </p>
              <div className="bg-red-50 border border-red-200 rounded-md p-3 mb-4">
                <p className="text-sm text-red-700">
                  <strong>Warning:</strong> This will permanently delete the selected products and all associated data.
                </p>
              </div>
              <div className="flex justify-end space-x-3">
                <button
                  onClick={closeBulkDeleteModal}
                  className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 rounded-md hover:bg-gray-200"
                >
                  Cancel
                </button>
                <button
                  onClick={() => {
                    // Handle bulk delete logic here
                    setSelectedRowIds([])
                    closeBulkDeleteModal()
                  }}
                  className="px-4 py-2 text-sm font-medium text-white bg-red-600 rounded-md hover:bg-red-700"
                >
                  Delete Products
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Import Modal */}
        {showImportModal && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold text-gray-900">Import Products</h3>
                <button
                  onClick={() => setShowImportModal(false)}
                  className="text-gray-400 hover:text-gray-600"
                >
                  ×
                </button>
              </div>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">File</label>
                  <input type="file" accept=".csv,.xlsx,.json" className="w-full border border-gray-300 rounded-md px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Import Options</label>
                  <div className="space-y-2">
                    <label className="flex items-center">
                      <input type="checkbox" className="rounded border-gray-300 text-blue-600 focus:ring-blue-500" />
                      <span className="ml-2 text-sm text-gray-700">Update existing products</span>
                    </label>
                    <label className="flex items-center">
                      <input type="checkbox" className="rounded border-gray-300 text-blue-600 focus:ring-blue-500" />
                      <span className="ml-2 text-sm text-gray-700">Skip errors and continue</span>
                    </label>
                  </div>
                </div>
              </div>
              <div className="flex justify-end space-x-3 mt-6">
                <button
                  onClick={closeImportModal}
                  className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 rounded-md hover:bg-gray-200"
                >
                  Cancel
                </button>
                <button
                  onClick={closeImportModal}
                  className="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-md hover:bg-blue-700"
                >
                  Import
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Enhanced Print Modal */}
        {showPrintModal && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-lg p-6 max-w-lg w-full mx-4 max-h-[90vh] overflow-y-auto">
              {/* Header */}
              <div className="flex items-center justify-between mb-6">
                <div className="flex items-center space-x-3">
                  <div className="p-2 bg-blue-100 rounded-lg">
                    <svg className="w-5 h-5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z" />
                    </svg>
                  </div>
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900">Print Products</h3>
                    <p className="text-sm text-gray-500">Configure your print settings</p>
                  </div>
                </div>
                <button
                  onClick={closePrintModal}
                  className="text-gray-400 hover:text-gray-600 transition-colors"
                >
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>

              <div className="space-y-6">
                {/* Print Options */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-3">Print Options</label>
                  <div className="space-y-3">
                    <label className="flex items-center p-3 border border-gray-200 rounded-lg hover:bg-gray-50 cursor-pointer transition-colors">
                      <input 
                        type="radio" 
                        name="printOption" 
                        value="all" 
                        checked={printOptions.printType === 'all'}
                        onChange={(e) => setPrintOptions(prev => ({ ...prev, printType: e.target.value }))}
                        className="rounded border-gray-300 text-blue-600 focus:ring-blue-500" 
                      />
                      <div className="ml-3">
                        <div className="text-sm font-medium text-gray-900">All products ({totalItemsForPagination})</div>
                        <div className="text-xs text-gray-500">Print all filtered products</div>
                      </div>
                    </label>
                    <label className="flex items-center p-3 border border-gray-200 rounded-lg hover:bg-gray-50 cursor-pointer transition-colors">
                      <input 
                        type="radio" 
                        name="printOption" 
                        value="selected" 
                        checked={printOptions.printType === 'selected'}
                        onChange={(e) => setPrintOptions(prev => ({ ...prev, printType: e.target.value }))}
                        className="rounded border-gray-300 text-blue-600 focus:ring-blue-500" 
                      />
                      <div className="ml-3">
                        <div className="text-sm font-medium text-gray-900">Selected products ({selectedRowIds.length})</div>
                        <div className="text-xs text-gray-500">Print only selected products</div>
                      </div>
                    </label>
                  </div>
                </div>

                {/* Layout Options */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-3">Layout</label>
                  <select 
                    value={printOptions.layout}
                    onChange={(e) => setPrintOptions(prev => ({ ...prev, layout: e.target.value }))}
                    className="w-full border border-gray-300 rounded-md px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  >
                    <option value="table">Table Layout - Compact list format</option>
                    <option value="grid">Grid Layout - Card-based layout</option>
                    <option value="list">List Layout - Simple text list</option>
                    <option value="detailed">Detailed Layout - Full product information</option>
                  </select>
                </div>

                {/* Content Options */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-3">Content Options</label>
                  <div className="space-y-3">
                    <label className="flex items-center">
                      <input 
                        type="checkbox" 
                        checked={printOptions.includeImages}
                        onChange={(e) => setPrintOptions(prev => ({ ...prev, includeImages: e.target.checked }))}
                        className="rounded border-gray-300 text-blue-600 focus:ring-blue-500" 
                      />
                      <span className="ml-2 text-sm text-gray-700">Include product images</span>
                    </label>
                    <label className="flex items-center">
                      <input 
                        type="checkbox" 
                        checked={printOptions.includeDetails}
                        onChange={(e) => setPrintOptions(prev => ({ ...prev, includeDetails: e.target.checked }))}
                        className="rounded border-gray-300 text-blue-600 focus:ring-blue-500" 
                      />
                      <span className="ml-2 text-sm text-gray-700">Include detailed information (description, tags, etc.)</span>
                    </label>
                  </div>
                </div>

                {/* Page Settings */}
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Page Size</label>
                    <select 
                      value={printOptions.pageSize}
                      onChange={(e) => setPrintOptions(prev => ({ ...prev, pageSize: e.target.value }))}
                      className="w-full border border-gray-300 rounded-md px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    >
                      <option value="A4">A4</option>
                      <option value="A3">A3</option>
                      <option value="Letter">Letter</option>
                      <option value="Legal">Legal</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Orientation</label>
                    <select 
                      value={printOptions.orientation}
                      onChange={(e) => setPrintOptions(prev => ({ ...prev, orientation: e.target.value }))}
                      className="w-full border border-gray-300 rounded-md px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    >
                      <option value="portrait">Portrait</option>
                      <option value="landscape">Landscape</option>
                    </select>
                  </div>
                </div>

                {/* Print Preview */}
                <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
                  <div className="flex items-center space-x-2 mb-2">
                    <svg className="w-4 h-4 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                    </svg>
                    <span className="text-sm font-medium text-gray-700">Print Preview</span>
                  </div>
                  <div className="text-xs text-gray-600 space-y-1">
                    <div>• {printOptions.printType === 'all' ? `${totalItemsForPagination} products` : `${selectedRowIds.length} selected products`} will be printed</div>
                    <div>• Layout: {printOptions.layout.charAt(0).toUpperCase() + printOptions.layout.slice(1)}</div>
                    <div>• Page: {printOptions.pageSize} {printOptions.orientation}</div>
                    <div>• {printOptions.includeImages ? 'With' : 'Without'} images, {printOptions.includeDetails ? 'with' : 'without'} detailed information</div>
                  </div>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex justify-between items-center mt-6 pt-4 border-t border-gray-200">
                <div className="text-xs text-gray-500">
                  Tip: Use landscape orientation for better table layouts
                </div>
                <div className="flex space-x-3">
                  <button
                    onClick={closePrintModal}
                    className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 rounded-md hover:bg-gray-200 transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={() => {
                      // Handle print functionality
                      const productsToPrint = printOptions.printType === 'all' 
                        ? (useAlgoliaFilters && algoliaFilterResults.length > 0 
                          ? algoliaFilterResults 
                          : (useAlgoliaSearch && algoliaSearchResults.length > 0 
                            ? algoliaSearchResults 
                            : filteredProducts))
                        : (useAlgoliaFilters && algoliaFilterResults.length > 0 
                          ? algoliaFilterResults 
                          : (useAlgoliaSearch && algoliaSearchResults.length > 0 
                            ? algoliaSearchResults 
                            : filteredProducts)).filter(p => selectedRowIds.includes(p.id))
                      console.log('Printing products:', {
                        count: productsToPrint.length,
                        options: printOptions,
                        products: productsToPrint.slice(0, 3) // Log first 3 for debugging
                      })
                      // Here you would implement actual print functionality
                      closePrintModal()
                    }}
                    className="px-6 py-2 text-sm font-medium text-white bg-blue-600 rounded-md hover:bg-blue-700 transition-colors flex items-center space-x-2"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z" />
                    </svg>
                    <span>Print</span>
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Settings Modal */}
        {showSettingsModal && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-lg p-6 max-w-lg w-full mx-4 max-h-[80vh] overflow-y-auto">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold text-gray-900">Product Settings</h3>
                <button
                  onClick={closeSettingsModal}
                  className="text-gray-400 hover:text-gray-600"
                >
                  ×
                </button>
              </div>
              <div className="space-y-6">
                {/* Display Settings */}
                <div>
                  <h4 className="text-md font-medium text-gray-900 mb-3">Display Settings</h4>
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <div>
                        <div className="text-sm font-medium text-gray-700">Default View Mode</div>
                        <div className="text-xs text-gray-500">Choose the default view when opening products</div>
                      </div>
                      <select 
                        value={settings.defaultViewMode}
                        onChange={(e) => handleSettingsUpdate({ defaultViewMode: e.target.value as 'table' | 'grid' | 'card' })}
                        className="border border-gray-300 rounded-md px-3 py-1 text-sm"
                      >
                        <option value="table">Table</option>
                        <option value="grid">Grid</option>
                        <option value="card">Card</option>
                      </select>
                    </div>
                    <div className="flex items-center justify-between">
                      <div>
                        <div className="text-sm font-medium text-gray-700">Items per page</div>
                        <div className="text-xs text-gray-500">Number of products to show per page</div>
                      </div>
                      <select 
                        value={settings.itemsPerPage}
                        onChange={(e) => handleSettingsUpdate({ itemsPerPage: parseInt(e.target.value) })}
                        className="border border-gray-300 rounded-md px-3 py-1 text-sm"
                      >
                        <option value={25}>25</option>
                        <option value={50}>50</option>
                        <option value={100}>100</option>
                        <option value={250}>250</option>
                        <option value={500}>500</option>
                      </select>
                    </div>
                  </div>
                </div>

                {/* Filter Settings */}
                <div>
                  <h4 className="text-md font-medium text-gray-900 mb-3">Filter Settings</h4>
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <div>
                        <div className="text-sm font-medium text-gray-700">Show Advanced Filters</div>
                        <div className="text-xs text-gray-500">
                          {settings.showAdvancedFilters 
                            ? 'Advanced filtering options are currently enabled' 
                            : 'Enable advanced filtering options for more detailed filtering'
                          }
                        </div>
                      </div>
                      <label className="relative inline-flex items-center cursor-pointer">
                        <input 
                          type="checkbox" 
                          className="sr-only peer" 
                          checked={settings.showAdvancedFilters}
                          onChange={(e) => {
                            handleSettingsUpdate({ showAdvancedFilters: e.target.checked })
                            // Immediately apply the change
                            setShowAdvancedFilter(e.target.checked)
                          }}
                        />
                        <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                      </label>
                    </div>
                    <div className="flex items-center justify-between">
                      <div>
                        <div className="text-sm font-medium text-gray-700">Auto-save Filters</div>
                        <div className="text-xs text-gray-500">
                          {settings.autoSaveFilters 
                            ? 'Your filter preferences will be automatically saved and restored' 
                            : 'Remember your filter preferences across sessions'
                          }
                        </div>
                      </div>
                      <label className="relative inline-flex items-center cursor-pointer">
                        <input 
                          type="checkbox" 
                          className="sr-only peer" 
                          checked={settings.autoSaveFilters}
                          onChange={(e) => handleSettingsUpdate({ autoSaveFilters: e.target.checked })}
                        />
                        <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                      </label>
                    </div>
                    
                    {/* Filter Status Indicator */}
                    {(activeFilter !== '' || Object.keys(columnFilters).length > 0 || 
                      advancedFilters.productStatus.length > 0 || advancedFilters.tags.length > 0 || 
                      advancedFilters.vendors.length > 0 || customFilters.length > 0 || 
                      searchConditions.length > 0) && (
                      <div className="mt-3 p-3 bg-blue-50 border border-blue-200 rounded-lg">
                        <div className="flex items-center space-x-2">
                          <svg className="h-4 w-4 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.207A1 1 0 013 6.5V4z" />
                          </svg>
                          <div className="text-sm text-blue-800">
                            <strong>Active Filters:</strong> {[
                              activeFilter !== '' && `Main: ${activeFilter}`,
                              Object.keys(columnFilters).length > 0 && `Columns: ${Object.keys(columnFilters).length}`,
                              advancedFilters.productStatus.length > 0 && `Status: ${advancedFilters.productStatus.length}`,
                              advancedFilters.tags.length > 0 && `Tags: ${advancedFilters.tags.length}`,
                              advancedFilters.vendors.length > 0 && `Vendors: ${advancedFilters.vendors.length}`,
                              customFilters.length > 0 && `Custom: ${customFilters.length}`,
                              searchConditions.length > 0 && `Search: ${searchConditions.length}`
                            ].filter(Boolean).join(', ')}
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                </div>

                {/* Export Settings */}
                <div>
                  <h4 className="text-md font-medium text-gray-900 mb-3">Export Settings</h4>
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <div>
                        <div className="text-sm font-medium text-gray-700">Default Export Format</div>
                        <div className="text-xs text-gray-500">
                          Current default: {settings.defaultExportFormat.toUpperCase()}
                        </div>
                      </div>
                      <select 
                        value={settings.defaultExportFormat}
                        onChange={(e) => handleSettingsUpdate({ defaultExportFormat: e.target.value as 'csv' | 'json' | 'pdf' })}
                        className="border border-gray-300 rounded-md px-3 py-1 text-sm"
                      >
                        <option value="csv">CSV</option>
                        <option value="json">JSON</option>
                        <option value="pdf">PDF</option>
                      </select>
                    </div>
                    <div className="flex items-center justify-between">
                      <div>
                        <div className="text-sm font-medium text-gray-700">Include Images in Exports</div>
                        <div className="text-xs text-gray-500">
                          {settings.includeImagesInExport 
                            ? 'Product images will be included in exports' 
                            : 'Product images will be excluded from exports'
                          }
                        </div>
                      </div>
                      <label className="relative inline-flex items-center cursor-pointer">
                        <input 
                          type="checkbox" 
                          className="sr-only peer" 
                          checked={settings.includeImagesInExport}
                          onChange={(e) => handleSettingsUpdate({ includeImagesInExport: e.target.checked })}
                        />
                        <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                      </label>
                    </div>
                    <div className="flex items-center justify-between">
                      <div>
                        <div className="text-sm font-medium text-gray-700">Show Images in Views</div>
                        <div className="text-xs text-gray-500">
                          {settings.showImages 
                            ? 'Product images are currently displayed in all views' 
                            : 'Product images are hidden in all views'
                          }
                        </div>
                      </div>
                      <label className="relative inline-flex items-center cursor-pointer">
                        <input 
                          type="checkbox" 
                          className="sr-only peer" 
                          checked={settings.showImages}
                          onChange={(e) => handleSettingsUpdate({ showImages: e.target.checked })}
                        />
                        <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                      </label>
                    </div>
                    
                    {/* Export Status Indicator */}
                    <div className="mt-3 p-3 bg-green-50 border border-green-200 rounded-lg">
                      <div className="flex items-center space-x-2">
                        <svg className="h-4 w-4 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                        </svg>
                        <div className="text-sm text-green-800">
                          <strong>Export Ready:</strong> {totalItemsForPagination} products available for export in {settings.defaultExportFormat.toUpperCase()} format
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Current Statistics */}
                <div>
                  <h4 className="text-md font-medium text-gray-900 mb-3">Current Statistics</h4>
                  <div className="grid grid-cols-2 gap-3 text-sm">
                    <div className="bg-gray-50 rounded-lg p-3">
                      <div className="text-gray-500">Total Products</div>
                      <div className="font-semibold text-gray-900">{productData.length}</div>
                    </div>
                    <div className="bg-gray-50 rounded-lg p-3">
                      <div className="text-gray-500">Active Products</div>
                      <div className="font-semibold text-gray-900">{productData.filter(p => p.status === 'active').length}</div>
                    </div>
                    <div className="bg-gray-50 rounded-lg p-3">
                      <div className="text-gray-500">Draft Products</div>
                      <div className="font-semibold text-gray-900">{productData.filter(p => p.status === 'draft').length}</div>
                    </div>
                    <div className="bg-gray-50 rounded-lg p-3">
                      <div className="text-gray-500">Current View</div>
                      <div className="font-semibold text-gray-900 capitalize">{viewMode}</div>
                    </div>
                  </div>
                </div>
              </div>
              <div className="flex justify-end space-x-3 mt-6 pt-4 border-t border-gray-200">
                <button
                  onClick={closeSettingsModal}
                  className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 rounded-md hover:bg-gray-200"
                >
                  Cancel
                </button>
                <button
                  onClick={() => {
                    // Apply settings immediately
                    if (settings.defaultViewMode !== viewMode) {
                      setViewMode(settings.defaultViewMode)
                    }
                    if (settings.itemsPerPage !== itemsPerPage) {
                      setItemsPerPage(settings.itemsPerPage)
                    }
                    if (settings.showAdvancedFilters !== showAdvancedFilter) {
                      setShowAdvancedFilter(settings.showAdvancedFilters)
                    }
                    console.log('Settings saved successfully!')
                    closeSettingsModal()
                  }}
                  className="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-md hover:bg-blue-700"
                >
                  Save Changes
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    )
  }

  export default function ShopifyProductsPage() {
    const { addTab, tabs } = useAppStore()
    const hasAddedTab = useRef(false)

    useEffect(() => {
      if (!hasAddedTab.current) {
        addTab({
          title: 'Products',
          path: '/apps/shopify/products',
          pinned: false,
          closable: true,
        })
        hasAddedTab.current = true
      }
    }, [])

    const initialData = { items: [], lastEvaluatedKey: null, total: 0 }

    return (
      <div className="h-full">
        <ProductsClient initialData={initialData} />
      </div>
    )
  }
