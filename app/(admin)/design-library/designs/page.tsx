// @ts-nocheck
'use client'

import { useEffect, useState, useRef, useCallback, useMemo } from 'react'
import { useAppStore } from '@/lib/store'
import { useDesignLibraryPageStore } from '@/lib/stores/design-library-page-store'
import {
  PageTemplate,
  useDataTable,
  GridCardFilterHeader,
  type GridFilterColumn
} from '@/components/shared'
import CardsPerRowDropdown from '@/components/shared/CardsPerRowDropdown'
import GridColumnHeader from '@/components/shared/GridColumnHeader'
import { Design } from './types'
import { designAPI } from './services/api'
import { loadSnapshot } from '@/lib/snapshots'


// Define table columns for designs
const designColumns = [
  {
    key: 'image',
    label: 'DESIGN',
    sortable: false,
    render: (value: any, design: Design) => {
      // Optimize image URL for better loading performance
      const getOptimizedImageUrl = (url: string) => {
        if (!url) return url
        
        // For S3 URLs, add aggressive optimization parameters for thumbnail
        if (url.includes('s3.amazonaws.com')) {
          const separator = url.includes('?') ? '&' : '?'
          // Use more aggressive optimization: smaller size, higher compression, force WebP
          return `${url}${separator}w=80&h=80&fit=crop&auto=webp&q=60&f=webp`
        }
        
        return url
      }

      return (
        <div className="flex items-center space-x-3">
          <div className="w-12 h-12 rounded-md overflow-hidden bg-gray-100 relative">
            {design.image ? (
              <>
                {/* Loading placeholder */}
                <div className="absolute inset-0 bg-gray-200 animate-pulse flex items-center justify-center">
                  <div className="w-4 h-4 bg-gray-300 rounded-full"></div>
                </div>
                
                <img 
                  src={getOptimizedImageUrl(design.image)}
                  alt={design.name || 'Design'}
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
              /* No image placeholder */
              <div className="w-full h-full bg-gray-200 flex items-center justify-center">
                <span className="text-xs text-gray-500">No image</span>
              </div>
            )}
          </div>
          <div className="flex-1 min-w-0">
            <div className="text-sm font-medium text-gray-900 truncate">
              {design?.name || 'Untitled Design'}
            </div>
          </div>
        </div>
      )
    }
  },
  {
    key: 'status',
    label: 'STATUS',
    sortable: true,
    render: (value: any, design: Design) => {
      const getStatusBadge = (status: string) => {
        switch (status) {
          case 'completed':
            return { className: "inline-flex px-2 py-1 text-xs font-medium rounded-full bg-green-100 text-green-800", text: "Completed" }
          case 'in_progress':
            return { className: "inline-flex px-2 py-1 text-xs font-medium rounded-full bg-yellow-100 text-yellow-800", text: "In Progress" }
          case 'pending':
            return { className: "inline-flex px-2 py-1 text-xs font-medium rounded-full bg-blue-100 text-blue-800", text: "Pending" }
          case 'approved':
            return { className: "inline-flex px-2 py-1 text-xs font-medium rounded-full bg-green-100 text-green-800", text: "Approved" }
          case 'rejected':
            return { className: "inline-flex px-2 py-1 text-xs font-medium rounded-full bg-red-100 text-red-800", text: "Rejected" }
          default:
            return { className: "inline-flex px-2 py-1 text-xs font-medium rounded-full bg-gray-100 text-gray-800", text: status }
        }
      }
      const badge = getStatusBadge(design?.status || 'unknown')
      return <span className={badge.className}>{badge.text}</span>
    }
  },
  {
    key: 'type',
    label: 'TYPE',
    sortable: true,
    render: (value: any, design: Design) => {
      const getTypeBadge = (type: string) => {
        switch (type) {
          case 'logo':
            return { className: "inline-flex px-2 py-1 text-xs font-medium rounded-full bg-blue-100 text-blue-800", text: "Logo" }
          case 'banner':
            return { className: "inline-flex px-2 py-1 text-xs font-medium rounded-full bg-purple-100 text-purple-800", text: "Banner" }
          case 'social_media':
            return { className: "inline-flex px-2 py-1 text-xs font-medium rounded-full bg-green-100 text-green-800", text: "Social Media" }
          case 'print':
            return { className: "inline-flex px-2 py-1 text-xs font-medium rounded-full bg-orange-100 text-orange-800", text: "Print" }
          case 'web':
            return { className: "inline-flex px-2 py-1 text-xs font-medium rounded-full bg-indigo-100 text-indigo-800", text: "Web" }
          case 'illustration':
            return { className: "inline-flex px-2 py-1 text-xs font-medium rounded-full bg-pink-100 text-pink-800", text: "Illustration" }
          default:
            return { className: "inline-flex px-2 py-1 text-xs font-medium rounded-full bg-gray-100 text-gray-800", text: type }
        }
      }
      const badge = getTypeBadge(design?.type || 'unknown')
      return <span className={badge.className}>{badge.text}</span>
    }
  },
  {
    key: 'category',
    label: 'CATEGORY',
    sortable: true,
    render: (value: any, design: Design) => (
      <div className="text-sm text-gray-900">{design?.category || 'Uncategorized'}</div>
    )
  },
  {
    key: 'price',
    label: 'PRICE',
    sortable: true,
    render: (value: any, design: Design) => (
      <span className="text-sm font-medium text-gray-900">
        {design?.price === 0 ? 'Free' : `$${(design?.price || 0).toFixed(2)}`}
      </span>
    )
  },
  {
    key: 'size',
    label: 'SIZE',
    sortable: true,
    render: (value: any, design: Design) => (
      <span className="text-sm text-gray-900">{design?.size || 'N/A'}</span>
    )
  },
  {
    key: 'client',
    label: 'CLIENT',
    sortable: true,
    render: (value: any, design: Design) => (
      <span className="text-sm text-gray-900">{design?.client || 'N/A'}</span>
    )
  },
  {
    key: 'designer',
    label: 'DESIGNER',
    sortable: true,
    render: (value: any, design: Design) => (
      <span className="text-sm text-gray-900">{design?.designer || 'N/A'}</span>
    )
  },
  {
    key: 'views',
    label: 'VIEWS',
    sortable: true,
    render: (value: any, design: Design) => (
      <span className="text-sm text-gray-900">{(design?.views || 0).toLocaleString()}</span>
    )
  },
  {
    key: 'downloads',
    label: 'DOWNLOADS',
    sortable: true,
    render: (value: any, design: Design) => (
      <span className="text-sm text-gray-900">{(design?.downloads || 0).toLocaleString()}</span>
    )
  },
  {
    key: 'createdAt',
    label: 'CREATED',
    sortable: true,
    render: (value: any, design: Design) => (
      <span className="text-sm text-gray-500">
        {design?.createdAt ? new Date(design.createdAt).toLocaleDateString('en-US', {
          month: 'short',
          day: '2-digit',
          year: 'numeric'
        }) : 'No date'}
      </span>
    )
  },
  {
    key: 'updatedAt',
    label: 'UPDATED',
    sortable: true,
    render: (value: any, design: Design) => (
      <span className="text-sm text-gray-500">
        {design?.updatedAt ? new Date(design.updatedAt).toLocaleDateString('en-US', {
          month: 'short',
          day: '2-digit',
          year: 'numeric'
        }) : 'No date'}
      </span>
    )
  },
  {
    key: 'tags',
    label: 'TAGS',
    sortable: false,
    render: (value: any, design: Design) => (
      <div className="flex flex-wrap gap-0.5">
        {design?.tags?.slice(0, 2).map((tag, index) => (
          <span key={index} className="px-2 py-1 bg-blue-100 text-blue-800 text-xs rounded-full">
            {tag}
          </span>
        ))}
        {design?.tags && design.tags.length > 2 && (
          <span className="text-xs text-gray-500">
            +{design.tags.length - 2}
          </span>
        )}
      </div>
    )
  }
]

// Define KPI metrics for designs
const designKPIs = [
  {
    key: 'totalDesigns',
    label: 'Total Designs',
    value: 0,
    change: 15,
    trend: 'up' as const,
    icon: '🎨',
    color: 'blue'
  },
  {
    key: 'totalDownloads',
    label: 'Total Downloads',
    value: 0,
    change: 25,
    trend: 'up' as const,
    icon: '⬇️',
    color: 'green'
  },
  {
    key: 'avgRating',
    label: 'Average Rating',
    value: 0,
    change: 2,
    trend: 'up' as const,
    icon: '⭐',
    color: 'yellow'
  },
  {
    key: 'publishedDesigns',
    label: 'Published',
    value: 0,
    change: 8,
    trend: 'up' as const,
    icon: '✅',
    color: 'purple'
  },
  {
    key: 'freeDesigns',
    label: 'Free Designs',
    value: 0,
    change: 12,
    trend: 'up' as const,
    icon: '🆓',
    color: 'orange'
  },
  {
    key: 'activeCategories',
    label: 'Categories',
    value: 0,
    change: 3,
    trend: 'up' as const,
    icon: '🏷️',
    color: 'indigo'
  }
]

// Define filter options for designs
const designFilters = [
  { key: 'all', label: 'All' },
  { key: 'template', label: 'Templates' },
  { key: 'mockup', label: 'Mockups' },
  { key: 'illustration', label: 'Illustrations' },
  { key: 'icon', label: 'Icons' },
  { key: 'published', label: 'Published' },
  { key: 'draft', label: 'Drafts' },
  { key: 'free', label: 'Free' },
  { key: 'paid', label: 'Paid' }
]

// Define grid filter columns for designs
const gridFilterColumns: GridFilterColumn[] = [
  { key: 'status', label: 'Status', filterType: 'select', options: ['completed', 'in_progress', 'pending', 'approved', 'rejected'] },
  { key: 'type', label: 'Type', filterType: 'select', options: ['logo', 'banner', 'social_media', 'print', 'web', 'illustration'] },
  { key: 'category', label: 'Category', filterType: 'text' },
  { key: 'price', label: 'Price', filterType: 'numeric' },
  { key: 'size', label: 'Size', filterType: 'text' },
  { key: 'client', label: 'Client', filterType: 'text' },
  { key: 'designer', label: 'Designer', filterType: 'text' },
  { key: 'views', label: 'Views', filterType: 'numeric' },
  { key: 'downloads', label: 'Downloads', filterType: 'numeric' },
  { key: 'createdAt', label: 'Created', filterType: 'date' },
  { key: 'updatedAt', label: 'Updated', filterType: 'date' }
]

function DesignLibraryPage() {
  const { addTab } = useAppStore()
  const hasAddedTab = useRef(false)
  
  // ✅ USE ZUSTAND STORE for persistent state
  const {
    pageIndex, pageSize, sorting, columnFilters, globalFilter,
    setPageIndex, setPageSize, setSorting, setColumnFilters, setGlobalFilter,
    selectedRowIds, setSelectedRowIds,
    scrollY, setScrollY,
    viewMode: storedViewMode, setViewMode: setStoredViewMode,
  } = useDesignLibraryPageStore()
  
  // Use sessionStorage to persist data across page navigations
  const [serverData, setServerData] = useState<Design[]>([])
  const [isLoadingServerData, setIsLoadingServerData] = useState(true)
  const [dataLoaded, setDataLoaded] = useState(false)
  const [isClient, setIsClient] = useState(false)
  const [cacheChecked, setCacheChecked] = useState(false)
  const [dataSource, setDataSource] = useState<'cache' | 'server' | 'unknown'>('unknown')
  const hasFetchedRef = useRef(false)
  
  // ✅ RESTORE SCROLL POSITION
  useEffect(() => {
    if (typeof window !== 'undefined') {
      try { window.history.scrollRestoration = 'manual' } catch {}
    }
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
  
  // Normalize raw server rows (from snapshots) into UI-friendly Design objects
  const normalizeDesigns = useCallback((rows: any[]): Design[] => {
    if (!Array.isArray(rows)) return []
    return rows.map((row: any) => {
      // If already looks normalized (has common client fields), return as-is
      if (row && (row.image || row.name || row.title)) {
        return row as Design
      }
      // Otherwise transform from server shape
      return designAPI.transformServerDesign(row)
    })
  }, [])
  
  // Function to force refresh data from server
  const forceRefresh = useCallback(async () => {
    console.log('🔄 Force refreshing design data from server...')
    hasFetchedRef.current = false
    setDataLoaded(false)
    setServerData([])
    setDataSource('unknown')
    setIsLoadingServerData(true)
    
    // Clear any existing cache
    if (isClient) {
      sessionStorage.removeItem('designs-cached-data')
      sessionStorage.removeItem('designs-data-loaded')
    }
    
    // The useEffect will automatically trigger fresh fetch
  }, [isClient])

  // Image preloading optimization
  const preloadImages = useCallback((designs: Design[]) => {
    if (!designs || designs.length === 0) return
    
    // Preload first 20 images for immediate visibility
    const imagesToPreload = designs.slice(0, 20).filter(d => d.image)
    
    imagesToPreload.forEach(design => {
      if (design.image && design.image.includes('s3.amazonaws.com')) {
        const optimizedUrl = `${design.image}?w=80&h=80&fit=crop&auto=webp&q=60&f=webp`
        
        // Create image element for preloading
        const img = new Image()
        img.src = optimizedUrl
        img.loading = 'eager' // Force eager loading for preload
      }
    })
    
    console.log(`🚀 Preloaded ${imagesToPreload.length} design images for faster rendering`)
  }, [])

  // Set client flag to prevent hydration issues
  useEffect(() => {
    setIsClient(true)
  }, [])

  // Load cached data from snapshots (preferred) or sessionStorage after client-side hydration
  useEffect(() => {
    if (!isClient) return
    
    const loadCachedData = async () => {
      try {
        // Ultra-fast in-memory cache per session
        try {
          // eslint-disable-next-line @typescript-eslint/ban-ts-comment
          // @ts-ignore
          const mem = window.__designsCache as { data: Design[]; timestamp: number } | undefined
          if (mem && Array.isArray(mem.data) && mem.data.length > 0) {
            setServerData(mem.data)
            setDataLoaded(true)
            setIsLoadingServerData(false)
            setDataSource('cache')
            preloadImages(mem.data)
            setCacheChecked(true)
            return
          }
        } catch {}
        // First try to load from snapshot cache (from Caching page)
        console.log('🔍 Checking for cached design data...')
        const snapshot = await loadSnapshot('design-library')
        
        if (snapshot && Array.isArray(snapshot.data) && snapshot.data.length > 0) {
          console.log(`✅ Found snapshot cache with ${snapshot.data.length} designs`)
          const normalized = normalizeDesigns(snapshot.data)
          setServerData(normalized)
          setDataLoaded(true)
          setIsLoadingServerData(false)
          setDataSource('cache')
          preloadImages(normalized)
          setCacheChecked(true)
          return
        }
        
        // Fallback to sessionStorage cache
        const cached = sessionStorage.getItem('designs-cached-data')
        const dataLoaded = sessionStorage.getItem('designs-data-loaded') === 'true'
        
        if (cached && dataLoaded) {
          try {
            const parsedData = JSON.parse(cached)
            console.log(`✅ Found sessionStorage cache with ${parsedData.length} designs`)
            const normalized = normalizeDesigns(parsedData)
            setServerData(normalized)
            setDataLoaded(true)
            setIsLoadingServerData(false)
            setDataSource('cache')
            preloadImages(normalized)
            setCacheChecked(true)
              try {
                // eslint-disable-next-line @typescript-eslint/ban-ts-comment
                // @ts-ignore
                window.__designsCache = { data: normalized, timestamp: Date.now() }
              } catch {}
            return
          } catch (e) {
            console.log('Failed to parse cached designs data')
          }
        }
        
        console.log('ℹ️ No cached data found, will fetch from server')
      } catch (error) {
        console.log('Error loading cached data:', error)
      } finally {
        // Mark cache check complete so fetch effect may proceed if needed
        setCacheChecked(true)
      }
    }
    
    loadCachedData()
  }, [isClient, preloadImages, normalizeDesigns])

  // Optimized data fetching with better performance and caching
  useEffect(() => {
    // Only fetch after cache check completes, and only if no cached data present
    if (!isClient || !cacheChecked || serverData.length > 0 || dataLoaded || hasFetchedRef.current) {
      return
    }
    
    console.log('🔄 No cached data found, fetching fresh design data from all chunks...')
    hasFetchedRef.current = true
    
    const fetchServerData = async () => {
      try {
        setIsLoadingServerData(true)
        
        console.log('Fetching design data from server...')
        
        // Try multiple keys in parallel for fastest success
        const BACKEND_URL = process.env.NEXT_PUBLIC_BACKEND_URL || 'https://brmh.in'
        // Default to all 7 chunks based on server data
        let keysToFetch = ['chunk:0', 'chunk:1', 'chunk:2', 'chunk:3', 'chunk:4', 'chunk:5', 'chunk:6']

        try {
          const keysUrl = `${BACKEND_URL}/cache/data?project=my-app&table=admin-design-image`
          console.log('🔍 Discovering design cache keys from:', keysUrl)
          const keysRes = await fetch(keysUrl, { 
            headers: { 'Accept': 'application/json' }, 
            signal: AbortSignal.timeout(10000) // Increased to 10 seconds
          })
          if (keysRes.ok) {
            const keysJson = await keysRes.json()
            const availableKeys: string[] = Array.isArray(keysJson?.keys) ? keysJson.keys : []
            console.log('📋 Raw design keys from server:', availableKeys)
            
            // Normalize keys: extract "chunk:0" from "my-app:admin-design-image:chunk:0"
            const normalizedAvailableKeys = availableKeys.map(k => {
              const parts = String(k).split(':')
              // If it looks like "prefix:prefix:chunk:0", extract "chunk:0"
              if (parts.length >= 2 && parts[parts.length - 2] === 'chunk') {
                return `chunk:${parts[parts.length - 1]}`
              }
              // Otherwise just return the last part
              return parts[parts.length - 1] || String(k)
            })
            console.log('🎯 Normalized design keys:', normalizedAvailableKeys)
            
            // Filter to only chunk keys that exist on server
            const chunkKeys = normalizedAvailableKeys.filter(k => /^chunk:\d+$/i.test(k))
            console.log('✅ Available chunk keys from server:', chunkKeys)
            
            if (chunkKeys.length > 0) {
              // Sort chunk keys by numeric index for predictable order
              chunkKeys.sort((a,b) => (parseInt(a.split(':')[1]||'0') - parseInt(b.split(':')[1]||'0')))
              keysToFetch = chunkKeys
              console.log('✅ Using all available chunk keys:', keysToFetch)
            } else {
              // Fallback to default chunks if none found
              keysToFetch = ['chunk:0', 'chunk:1', 'chunk:2', 'chunk:3', 'chunk:4', 'chunk:5', 'chunk:6']
              console.log('⚠️ No chunk keys found, using default chunks:', keysToFetch)
            }
          } else {
            console.log(`ℹ️ Keys discovery returned status ${keysRes.status}, will use default keys`)
          }
        } catch (e) {
          // Silently handle timeout/network errors and use default keys
          if (e instanceof Error && e.name === 'AbortError') {
            console.log('ℹ️ Keys discovery timed out, using default chunk keys')
          } else {
            console.log('ℹ️ Keys discovery unavailable, using default chunk keys')
          }
        }

        console.log('🚀 Will attempt to fetch design keys:', keysToFetch)
        
        const fetchPromises = keysToFetch.map(key => {
          const url = `${BACKEND_URL}/cache/data?project=my-app&table=admin-design-image&key=${key}`
          console.log(`📥 Fetching design key "${key}" from:`, url)
          return fetch(url, {
            signal: AbortSignal.timeout(15000) // Increased to 15 seconds
          }).then(async res => {
            if (!res.ok) {
              throw new Error(`HTTP ${res.status} for key ${key}`)
            }
            const json = await res.json()
            if (!json?.data || !Array.isArray(json.data)) {
              throw new Error(`Invalid data for key ${key}`)
            }
            console.log(`✅ Design key "${key}" succeeded with ${json.data.length} items`)
            return { key, data: json.data }
          }).catch(error => {
            // Return empty data instead of throwing, so Promise.all doesn't fail
            console.log(`ℹ️ Key "${key}" unavailable, skipping`)
            return { key, data: [] }
          })
        })

        try {
          // Use Promise.all to fetch ALL chunks, not just the first one
          const allResults = await Promise.all(fetchPromises)
          
          // Combine all chunk data
          const allDesigns: any[] = []
          allResults.forEach(result => {
            if (result.data.length > 0) {
              const transformedChunk = result.data.map((serverDesign: any) => designAPI.transformServerDesign(serverDesign))
              allDesigns.push(...transformedChunk)
              console.log(`✅ Added ${transformedChunk.length} designs from key "${result.key}"`)
            }
          })
          
          if (allDesigns.length > 0) {
            setServerData(allDesigns)
            setDataLoaded(true)
            setDataSource('server')
            if (isClient) {
              sessionStorage.setItem('designs-cached-data', JSON.stringify(allDesigns))
              sessionStorage.setItem('designs-data-loaded', 'true')
              // Preload images for faster rendering
              preloadImages(allDesigns)
            }
            setIsLoadingServerData(false)
            console.log(`✅ Successfully loaded ${allDesigns.length} total designs from ${allResults.filter(r => r.data.length > 0).length} chunks`)
            return
          }
        } catch (parallelErr) {
          console.log('⚠️ Parallel key fetch failed, falling back to chunk-based approach:', parallelErr)
          
          // Fallback: try to fetch all chunks individually
          try {
            console.log('🔄 Attempting to fetch all chunks individually...')
            const allDesigns: any[] = []
            
            for (let i = 0; i < 7; i++) {
              try {
                const chunkUrl = `${BACKEND_URL}/cache/data?project=my-app&table=admin-design-image&key=chunk:${i}`
                console.log(`📥 Fetching chunk ${i} from:`, chunkUrl)
                const chunkRes = await fetch(chunkUrl, { signal: AbortSignal.timeout(15000) }) // Increased to 15 seconds
                
                if (chunkRes.ok) {
                  const chunkJson = await chunkRes.json()
                  if (chunkJson?.data && Array.isArray(chunkJson.data)) {
                    const chunkDesigns = chunkJson.data.map((serverDesign: any) => designAPI.transformServerDesign(serverDesign))
                    allDesigns.push(...chunkDesigns)
                    console.log(`✅ Chunk ${i} loaded: ${chunkDesigns.length} designs`)
                  }
                } else {
                  console.log(`ℹ️ Chunk ${i} returned status ${chunkRes.status}`)
                }
              } catch (chunkErr) {
                // Only log non-timeout errors
                if (chunkErr instanceof Error && chunkErr.name !== 'AbortError') {
                  console.log(`ℹ️ Chunk ${i} unavailable`)
                }
              }
            }
            
            if (allDesigns.length > 0) {
              setServerData(allDesigns)
              setDataLoaded(true)
              setDataSource('server')
              if (isClient) {
                sessionStorage.setItem('designs-cached-data', JSON.stringify(allDesigns))
                sessionStorage.setItem('designs-data-loaded', 'true')
                // Preload images for faster rendering
                preloadImages(allDesigns)
              }
              setIsLoadingServerData(false)
              console.log(`✅ Fallback successful: Loaded ${allDesigns.length} designs from all chunks`)
              return
            }
          } catch (fallbackErr) {
            console.error('❌ Fallback chunk fetching also failed:', fallbackErr)
          }
        }

        // Final fallback: fetch all chunks using the API method
        console.log('🔄 Using final fallback method to fetch all chunks...')
        const designs = await designAPI.getDesignsWithFallback()
        
        if (designs.length === 0) {
          console.error('❌ No designs loaded from any method')
          setServerData([])
          setDataLoaded(true)
          return
        }
        
        setServerData(designs)
        setDataLoaded(true)
        setDataSource('server')
        
        // Cache data in sessionStorage
        if (isClient) {
          sessionStorage.setItem('designs-cached-data', JSON.stringify(designs))
          sessionStorage.setItem('designs-data-loaded', 'true')
          // Preload images for faster rendering
          preloadImages(designs)
        }
        
        console.log(`✅ Final fallback successful: Loaded ${designs.length} designs`)
      } catch (error) {
        console.error('❌ Error fetching server data:', error)
        setServerData([])
        setDataLoaded(true)
      } finally {
        setIsLoadingServerData(false)
      }
    }

    fetchServerData()
  }, [isClient, serverData.length, dataLoaded, cacheChecked, preloadImages])

  // ✅ Initialize data table hook - INTEGRATE with Zustand for persistent state
  const {
    data: designData,
    loading,
    error,
    filteredData,
    currentData,
    totalPages,
    setData,
    currentPage,
    setCurrentPage,
    itemsPerPage,
    setItemsPerPage,
    handlePageChange,
    handleItemsPerPageChange
  } = useDataTable<Design>({
    initialData: serverData,
    columns: designColumns,
    defaultViewMode: storedViewMode,
    defaultItemsPerPage: pageSize
  })
  
  // ✅ Map Zustand state to local variables for consistency
  const searchQuery = globalFilter
  const setSearchQuery = setGlobalFilter
  const selectedItems = selectedRowIds
  const setSelectedItems = setSelectedRowIds
  const viewMode = storedViewMode
  const setViewMode = (mode: 'table' | 'grid' | 'card') => setStoredViewMode(mode)
  
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
      const saved = localStorage.getItem('designs-cards-per-row')
      return saved ? parseInt(saved, 10) : 4
    }
    return 4
  })

  // Save cards per row preference to localStorage
  useEffect(() => {
    if (typeof window !== 'undefined') {
      localStorage.setItem('designs-cards-per-row', cardsPerRow.toString())
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



  // Filter designs data based on search query
  const filteredDesignsData = useMemo(() => {
    if (!searchQuery.trim()) {
      return serverData
    }
    
    const query = searchQuery.toLowerCase()
    return serverData.filter(design =>
      Object.values(design).some(value => {
        if (Array.isArray(value)) {
          return value.some(item => String(item).toLowerCase().includes(query))
        }
        return String(value).toLowerCase().includes(query)
      })
    )
  }, [serverData, searchQuery])

  // Update data table when filtered designs data changes
  useEffect(() => {
    if (filteredDesignsData.length > 0 || searchQuery.trim()) {
      console.log(`📊 Syncing ${filteredDesignsData.length} filtered designs to data table (search: "${searchQuery}")`)
      setData(filteredDesignsData)
    }
  }, [filteredDesignsData, setData, searchQuery])

  // Handle pagination changes without re-fetching data
  useEffect(() => {
    if (serverData.length > 0 && currentPage === 1 && designData.length === 0) {
      setData(serverData)
    }
  }, [currentPage, serverData, designData.length, setData])

  // Memoize all designs data to prevent unnecessary recalculations
  const allDesigns = useMemo(() => {
    return serverData.length > 0 ? serverData : designData
  }, [serverData, designData])

  // Calculate KPI metrics based on server data (not filtered data for accurate totals)
  const calculatedKPIs = useMemo(() => {
    const dataToUse = allDesigns.length > 0 ? allDesigns : filteredData;
    
    return designKPIs.map(kpi => {
      switch (kpi.key) {
        case 'totalDesigns':
          return { ...kpi, value: dataToUse.length }
        case 'totalDownloads':
          const downloadCount = dataToUse.reduce((sum: number, design: any) => {
            return sum + (design.downloads || 0);
          }, 0);
          return { ...kpi, value: downloadCount }
        case 'avgRating':
          const completedCount = dataToUse.filter((design: any) => 
            design.designStatus === 'completed' || design.status === 'completed'
          ).length;
          const avgValue = dataToUse.length > 0 ? 
            Math.round((completedCount / dataToUse.length) * 100) / 10 : 0;
          return { ...kpi, value: avgValue }
        case 'publishedDesigns':
          return { ...kpi, value: dataToUse.filter((design: any) => 
            (design.designStatus === 'completed' || design.status === 'completed')
          ).length }
        case 'freeDesigns':
          return { ...kpi, value: dataToUse.filter((design: any) => {
            const price = parseFloat(design.designPrice) || design.price || 0;
            return price === 0;
          }).length }
        case 'activeCategories':
          const uniqueCategories = new Set(dataToUse.map((design: any) => 
            design.designType || design.category || design.type || 'Uncategorized'
          ));
          return { ...kpi, value: uniqueCategories.size }
        default:
          return kpi
      }
    })
  }, [allDesigns, filteredData])

  // Tab management
  useEffect(() => {
    if (!hasAddedTab.current) {
      addTab({
        title: 'Designs',
        path: '/design-library/designs',
        pinned: false,
        closable: true,
      })
      hasAddedTab.current = true
    }
  }, [addTab])

  // Page configuration - memoized to prevent unnecessary re-renders
  const pageConfig = useMemo(() => ({
    title: 'Design Library',
    description: dataSource === 'cache' 
      ? `Manage and organize your design assets (${serverData.length} designs loaded from cache)`
      : dataSource === 'server'
      ? `Manage and organize your design assets (${serverData.length} designs loaded from server)`
      : 'Manage and organize your design assets',
    icon: '🎨',
    endpoint: '/api/designs',
    columns: designColumns,
    kpis: calculatedKPIs,
    filters: designFilters,
    searchableFields: [
      { key: 'title', label: 'Title', type: 'text' },
      { key: 'description', label: 'Description', type: 'text' },
      { key: 'category', label: 'Category', type: 'text' },
      { key: 'type', label: 'Type', type: 'text' },
      { key: 'status', label: 'Status', type: 'text' },
      { key: 'tags', label: 'Tags', type: 'text' }
    ],
    actions: {
      create: () => console.log('Create design'),
      export: () => console.log('Export designs'),
      import: () => console.log('Import designs'),
      print: () => console.log('Print designs'),
      settings: () => console.log('Design settings'),
      refresh: forceRefresh
    }
  }), [calculatedKPIs, dataSource, serverData.length, forceRefresh])

  // Show loading state while fetching server data (unified spinner UI)
  if ((isLoadingServerData && serverData.length === 0) || !isClient) {
    return (
      <div className="min-h-screen bg-gray-50">
        <div className="flex items-center justify-center min-h-[400px]">
          <div className="text-center">
            <div className="inline-flex items-center space-x-3 px-6 py-4 bg-white rounded-lg shadow-sm border">
              <div className="w-6 h-6 border-2 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
              <div>
                <div className="text-sm font-medium text-gray-900">Loading Designs...</div>
                <div className="text-xs text-gray-500 mt-1">This should only take a moment</div>
              </div>
            </div>
          </div>
        </div>
      </div>
    )
  }



  if (loading && designData.length === 0 && serverData.length === 0) {
    return (
      <div className="min-h-screen bg-gray-50">
        <div className="flex items-center justify-center min-h-[400px]">
          <div className="text-center">
            <div className="inline-flex items-center space-x-3 px-6 py-4 bg-white rounded-lg shadow-sm border">
              <div className="w-6 h-6 border-2 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
              <div>
                <div className="text-sm font-medium text-gray-900">Loading Designs...</div>
                <div className="text-xs text-gray-500 mt-1">This should only take a moment</div>
              </div>
            </div>
          </div>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="text-red-600 text-lg font-semibold mb-2">Error Loading Designs</div>
          <div className="text-gray-600 mb-4">{error}</div>
          <button 
            onClick={() => window.location.reload()}
            className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700"
          >
            Retry
          </button>
        </div>
      </div>
    )
  }

  // Show empty state if no data after loading
  if (!isLoadingServerData && dataLoaded && serverData.length === 0 && designData.length === 0) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center max-w-md">
          <div className="text-6xl mb-4">🎨</div>
          <div className="text-xl font-semibold text-gray-900 mb-2">No Designs Found</div>
          <div className="text-gray-600 mb-6">
            Unable to load design data from the server. Please check your connection and try again.
          </div>
          <button 
            onClick={() => {
              hasFetchedRef.current = false
              setDataLoaded(false)
              setIsLoadingServerData(true)
              window.location.reload()
            }}
            className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-medium"
          >
            Retry Loading
          </button>
        </div>
      </div>
    )
  }





  return (
    <PageTemplate
      config={pageConfig}
      data={currentData}
          loading={loading}
      error={error}
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
      modalSize="2xl"
      />
  )
}

export default DesignLibraryPage
