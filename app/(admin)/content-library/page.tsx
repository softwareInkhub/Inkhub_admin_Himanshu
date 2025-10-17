'use client'

import { useEffect, useState, useRef, useCallback, useMemo } from 'react'
import { useAppStore } from '@/lib/store'
import { useContentLibraryPageStore } from '@/lib/stores/content-library-page-store'
import {
  PageTemplate,
  useDataTable
} from '@/components/shared'
import ContentGridCardFilterHeader from './components/ContentGridCardFilterHeader'
import { ContentItem } from './types'

// Define table columns for content
const contentColumns = [
  {
    key: 'preview',
    label: 'CONTENT',
    sortable: false,
    render: (value: any, content: ContentItem) => {
      return (
        <div className="flex items-center space-x-3">
          <div className="w-12 h-12 rounded-md overflow-hidden bg-gray-100 relative">
            {content.previewUrl ? (
              <>
                {/* Loading placeholder */}
                <div className="absolute inset-0 bg-gray-200 animate-pulse flex items-center justify-center">
                  <div className="w-4 h-4 bg-gray-300 rounded-full"></div>
                </div>
                
                <img 
                  src={content.previewUrl}
                  alt={content.title || 'Content'}
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
              /* No preview placeholder */
              <div className="w-full h-full bg-gray-200 flex items-center justify-center">
                <span className="text-xs text-gray-500">No preview</span>
              </div>
            )}
          </div>
          <div className="flex-1 min-w-0">
            <div className="text-sm font-medium text-gray-900 truncate">
              {content?.title || 'Untitled Content'}
            </div>
            <div className="text-xs text-gray-500 truncate">
              {content?.summary || 'No description'}
            </div>
          </div>
        </div>
      )
    }
  },
  {
    key: 'type',
    label: 'TYPE',
    sortable: true,
    render: (value: any, content: ContentItem) => {
      const getTypeBadge = (type: string) => {
        switch (type) {
          case 'text':
            return { className: "inline-flex px-2 py-1 text-xs font-medium rounded-full bg-blue-100 text-blue-800", text: "Text" }
          case 'image':
            return { className: "inline-flex px-2 py-1 text-xs font-medium rounded-full bg-green-100 text-green-800", text: "Image" }
          case 'video':
            return { className: "inline-flex px-2 py-1 text-xs font-medium rounded-full bg-purple-100 text-purple-800", text: "Video" }
          case 'audio':
            return { className: "inline-flex px-2 py-1 text-xs font-medium rounded-full bg-orange-100 text-orange-800", text: "Audio" }
          case 'file':
            return { className: "inline-flex px-2 py-1 text-xs font-medium rounded-full bg-gray-100 text-gray-800", text: "File" }
          case 'json':
            return { className: "inline-flex px-2 py-1 text-xs font-medium rounded-full bg-yellow-100 text-yellow-800", text: "JSON" }
          case 'richtext':
            return { className: "inline-flex px-2 py-1 text-xs font-medium rounded-full bg-indigo-100 text-indigo-800", text: "Rich Text" }
          case 'html':
            return { className: "inline-flex px-2 py-1 text-xs font-medium rounded-full bg-pink-100 text-pink-800", text: "HTML" }
          default:
            return { className: "inline-flex px-2 py-1 text-xs font-medium rounded-full bg-gray-100 text-gray-800", text: type }
        }
      }
      const badge = getTypeBadge(content?.type || 'unknown')
      return <span className={badge.className}>{badge.text}</span>
    }
  },
  {
    key: 'status',
    label: 'STATUS',
    sortable: true,
    render: (value: any, content: ContentItem) => {
      const getStatusBadge = (status: string) => {
        switch (status) {
          case 'published':
            return { className: "inline-flex px-2 py-1 text-xs font-medium rounded-full bg-green-100 text-green-800", text: "Published" }
          case 'draft':
            return { className: "inline-flex px-2 py-1 text-xs font-medium rounded-full bg-yellow-100 text-yellow-800", text: "Draft" }
          case 'archived':
            return { className: "inline-flex px-2 py-1 text-xs font-medium rounded-full bg-gray-100 text-gray-800", text: "Archived" }
          default:
            return { className: "inline-flex px-2 py-1 text-xs font-medium rounded-full bg-gray-100 text-gray-800", text: status }
        }
      }
      const badge = getStatusBadge(content?.status || 'unknown')
      return <span className={badge.className}>{badge.text}</span>
    }
  },
  {
    key: 'labels',
    label: 'LABELS',
    sortable: false,
    render: (value: any, content: ContentItem) => (
      <div className="flex flex-wrap gap-0.5">
        {content?.labels?.slice(0, 2).map((label, index) => (
          <span key={index} className="px-2 py-1 bg-blue-100 text-blue-800 text-xs rounded-full">
            {label}
          </span>
        ))}
        {content?.labels && content.labels.length > 2 && (
          <span className="text-xs text-gray-500">
            +{content.labels.length - 2}
          </span>
        )}
      </div>
    )
  },
  {
    key: 'bytes',
    label: 'SIZE',
    sortable: true,
    render: (value: any, content: ContentItem) => {
      const formatBytes = (bytes: number) => {
        if (bytes === 0) return '0 Bytes'
        const k = 1024
        const sizes = ['Bytes', 'KB', 'MB', 'GB']
        const i = Math.floor(Math.log(bytes) / Math.log(k))
        return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i]
      }
      return <span className="text-sm text-gray-900">{formatBytes(content?.bytes || 0)}</span>
    }
  },
  {
    key: 'locale',
    label: 'LOCALE',
    sortable: true,
    render: (value: any, content: ContentItem) => (
      <span className="text-sm text-gray-900">{content?.locale || 'N/A'}</span>
    )
  },
  {
    key: 'version',
    label: 'VERSION',
    sortable: true,
    render: (value: any, content: ContentItem) => (
      <span className="text-sm text-gray-900">v{content?.version || 1}</span>
    )
  },
  {
    key: 'createdAt',
    label: 'CREATED',
    sortable: true,
    render: (value: any, content: ContentItem) => (
      <span className="text-sm text-gray-500">
        {content?.createdAt ? new Date(content.createdAt).toLocaleDateString('en-US', {
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
    render: (value: any, content: ContentItem) => (
      <span className="text-sm text-gray-500">
        {content?.updatedAt ? new Date(content.updatedAt).toLocaleDateString('en-US', {
          month: 'short',
          day: '2-digit',
          year: 'numeric'
        }) : 'No date'}
      </span>
    )
  },
  {
    key: 'updatedBy',
    label: 'UPDATED BY',
    sortable: true,
    render: (value: any, content: ContentItem) => (
      <span className="text-sm text-gray-900">{content?.updatedBy || 'Unknown'}</span>
    )
  }
]

// Define KPI metrics for content
const contentKPIs = [
  {
    key: 'totalContent',
    label: 'Total Content',
    value: 0,
    change: 12,
    trend: 'up' as const,
    icon: '📄',
    color: 'blue'
  },
  {
    key: 'publishedContent',
    label: 'Published',
    value: 0,
    change: 8,
    trend: 'up' as const,
    icon: '✅',
    color: 'green'
  },
  {
    key: 'draftContent',
    label: 'Drafts',
    value: 0,
    change: 5,
    trend: 'up' as const,
    icon: '📝',
    color: 'orange'
  },
  {
    key: 'totalSize',
    label: 'Total Size',
    value: 0,
    change: 15,
    trend: 'up' as const,
    icon: '💾',
    color: 'purple'
  },
  {
    key: 'activeTypes',
    label: 'Content Types',
    value: 0,
    change: 2,
    trend: 'up' as const,
    icon: '🏷️',
    color: 'indigo'
  },
  {
    key: 'activeLocales',
    label: 'Locales',
    value: 0,
    change: 1,
    trend: 'up' as const,
    icon: '🌐',
    color: 'teal'
  }
]

// Define filter options for content
const contentFilters = [
  { key: 'all', label: 'All' },
  { key: 'text', label: 'Text' },
  { key: 'image', label: 'Images' },
  { key: 'video', label: 'Videos' },
  { key: 'audio', label: 'Audio' },
  { key: 'file', label: 'Files' },
  { key: 'published', label: 'Published' },
  { key: 'draft', label: 'Drafts' },
  { key: 'archived', label: 'Archived' }
]

interface ContentLibraryClientProps {
  initialData: {
    items: any[]
    lastEvaluatedKey: any
    total: number
  }
}

function ContentLibraryClient({ initialData }: ContentLibraryClientProps) {
  return (
        <ContentLibraryClientContent 
          initialData={initialData} 
        />
  );
}

function ContentLibraryClientContent({ 
  initialData
}: ContentLibraryClientProps) {
  const { addTab } = useAppStore()
  const hasAddedTab = useRef(false)
  
  // ✅ USE ZUSTAND STORE for persistent state
  const {
    pageIndex, pageSize, sorting, columnFilters, globalFilter,
    setPageIndex, setPageSize, setSorting, setColumnFilters, setGlobalFilter,
    selectedRowIds, setSelectedRowIds,
    scrollY, setScrollY,
    viewMode: storedViewMode, setViewMode: setStoredViewMode,
  } = useContentLibraryPageStore()
  
  // Use sessionStorage to persist data across page navigations
  const [serverData, setServerData] = useState<ContentItem[]>([])
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
  
        // Generate mock content data similar to the original
  const generateMockContent = useCallback((): ContentItem[] => {
        const types: ContentItem['type'][] = ['text', 'image', 'video', 'audio', 'file', 'json', 'richtext', 'html']
        const statuses: ContentItem['status'][] = ['draft', 'published', 'archived']
        const labels = ['marketing', 'social-media', 'product', 'announcement', 'tutorial', 'news', 'design', 'content']
        const locales = ['en-US', 'en-IN', 'es-ES', 'fr-FR', 'de-DE']
        
    return Array.from({ length: 100 }, (_, i) => {
          const type = types[i % types.length]
          const status = statuses[i % statuses.length]
          const itemLabels = labels.slice(0, Math.floor(Math.random() * 3) + 1)
          const locale = locales[i % locales.length]
          const size = Math.floor(Math.random() * 10000000) + 1000 // 1KB to 10MB
          const createdDate = new Date(Date.now() - Math.random() * 30 * 24 * 60 * 60 * 1000) // Last 30 days
          const updatedDate = new Date(createdDate.getTime() + Math.random() * 7 * 24 * 60 * 60 * 1000) // Updated within 7 days of creation
          
          return {
            id: `content-${i + 1}`,
            namespaceKey: 'default',
            title: `${type.charAt(0).toUpperCase() + type.slice(1)} Content ${i + 1}`,
            type,
            status,
            labels: itemLabels,
            locale,
            summary: `This is a sample ${type} content item for testing purposes. It contains relevant information about ${itemLabels.join(', ')}.`,
            bytes: size,
            version: Math.floor(Math.random() * 5) + 1,
            createdAt: createdDate.toISOString(),
            updatedAt: updatedDate.toISOString(),
            createdBy: `user-${Math.floor(Math.random() * 10) + 1}`,
            updatedBy: `user-${Math.floor(Math.random() * 10) + 1}`,
            storageKey: `storage/${type}/${i + 1}`,
            previewUrl: ['image', 'video'].includes(type) ? `https://picsum.photos/400/300?random=${i + 1}` : undefined,
            meta: {
              content: type === 'json' ? JSON.stringify({ sample: true, index: i + 1, type }) : 
                      type === 'richtext' ? `<p>Rich text content for item ${i + 1}</p>` :
                      type === 'html' ? `<div><h3>HTML Content ${i + 1}</h3><p>Sample HTML content</p></div>` :
                      `Sample ${type} content for testing item ${i + 1}`,
              filename: type === 'file' ? `sample-file-${i + 1}.pdf` : undefined,
              contentType: type === 'image' ? 'image/jpeg' : type === 'video' ? 'video/mp4' : type === 'audio' ? 'audio/mpeg' : 'application/octet-stream'
            }
          }
        })
  }, [])
  
  // Function to force refresh data from server
  const forceRefresh = useCallback(async () => {
    console.log('🔄 Force refreshing content data...')
    hasFetchedRef.current = false
    setDataLoaded(false)
    setServerData([])
    setDataSource('unknown')
    setIsLoadingServerData(true)
    
    // Clear any existing cache
    if (isClient) {
      sessionStorage.removeItem('content-cached-data')
      sessionStorage.removeItem('content-data-loaded')
    }
    
    // The useEffect will automatically trigger fresh fetch
  }, [isClient])

  // Set client flag to prevent hydration issues
  useEffect(() => {
    setIsClient(true)
  }, [])

  // Load cached data from sessionStorage after client-side hydration
  useEffect(() => {
    if (!isClient) return
    
    const loadCachedData = async () => {
      try {
        // Try to load from sessionStorage cache
        const cached = sessionStorage.getItem('content-cached-data')
        const dataLoaded = sessionStorage.getItem('content-data-loaded') === 'true'
        
        if (cached && dataLoaded) {
          try {
            const parsedData = JSON.parse(cached)
            console.log(`✅ Found sessionStorage cache with ${parsedData.length} content items`)
            setServerData(parsedData)
            setDataLoaded(true)
            setIsLoadingServerData(false)
            setDataSource('cache')
            setCacheChecked(true)
            return
          } catch (e) {
            console.log('Failed to parse cached content data')
          }
        }
        
        console.log('ℹ️ No cached data found, will generate mock data')
      } catch (error) {
        console.log('Error loading cached data:', error)
      } finally {
        // Mark cache check complete so fetch effect may proceed if needed
        setCacheChecked(true)
      }
    }
    
    loadCachedData()
  }, [isClient])

  // Generate mock data if no cached data
  useEffect(() => {
    // Only generate after cache check completes, and only if no cached data present
    if (!isClient || !cacheChecked || serverData.length > 0 || dataLoaded || hasFetchedRef.current) {
      return
    }
    
    console.log('🔄 No cached data found, generating mock content data...')
    hasFetchedRef.current = true
    
    const generateData = async () => {
      try {
        setIsLoadingServerData(true)
        
        console.log('Generating mock content data...')
        const mockContent = generateMockContent()
        
        setServerData(mockContent)
        setDataLoaded(true)
        setDataSource('server')
        
        // Cache data in sessionStorage
        if (isClient) {
          sessionStorage.setItem('content-cached-data', JSON.stringify(mockContent))
          sessionStorage.setItem('content-data-loaded', 'true')
        }
        
        setIsLoadingServerData(false)
        console.log(`✅ Successfully generated ${mockContent.length} content items`)
      } catch (error) {
        console.error('❌ Error generating content data:', error)
        setServerData([])
        setDataLoaded(true)
      } finally {
        setIsLoadingServerData(false)
      }
    }

    generateData()
  }, [isClient, serverData.length, dataLoaded, cacheChecked, generateMockContent])

  // ✅ Initialize data table hook - INTEGRATE with Zustand for persistent state
  const {
    data: contentData,
    loading,
    error,
    filteredData,
    totalPages,
    currentData,
    setData
  } = useDataTable<ContentItem>({
    initialData: serverData,
    columns: contentColumns,
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
  const currentPage = pageIndex + 1 // Convert 0-based to 1-based
  const setCurrentPage = (page: number) => setPageIndex(page - 1)
  const itemsPerPage = pageSize
  const setItemsPerPage = (size: number) => {
    setPageSize(size)
    setPageIndex(0)
  }
  
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
  
  const handlePageChange = (page: number) => setCurrentPage(page)
  const handleItemsPerPageChange = (items: number) => setItemsPerPage(items)
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

  // Update data table when server data changes - always sync to ensure cache loads properly
  useEffect(() => {
    if (serverData.length > 0) {
      console.log(`📊 Syncing ${serverData.length} content items to data table (current: ${contentData.length})`)
      setData(serverData)
    }
  }, [serverData, setData])

  // Handle pagination changes without re-fetching data
  useEffect(() => {
    if (serverData.length > 0 && currentPage === 1 && contentData.length === 0) {
      setData(serverData)
    }
  }, [currentPage, serverData, contentData.length, setData])

  // Memoize all content data to prevent unnecessary recalculations
  const allContent = useMemo(() => {
    return serverData.length > 0 ? serverData : contentData
  }, [serverData, contentData])

  // Calculate KPI metrics based on server data (not filtered data for accurate totals)
  const calculatedKPIs = useMemo(() => {
    const dataToUse = allContent.length > 0 ? allContent : filteredData;
    
    return contentKPIs.map(kpi => {
      switch (kpi.key) {
        case 'totalContent':
          return { ...kpi, value: dataToUse.length }
        case 'publishedContent':
          return { ...kpi, value: dataToUse.filter((content: any) => content.status === 'published').length }
        case 'draftContent':
          return { ...kpi, value: dataToUse.filter((content: any) => content.status === 'draft').length }
        case 'totalSize':
          const totalSize = dataToUse.reduce((sum: number, content: any) => {
            return sum + (content.bytes || 0);
          }, 0);
          return { ...kpi, value: Math.round(totalSize / 1024 / 1024) } // Convert to MB
        case 'activeTypes':
          const uniqueTypes = new Set(dataToUse.map((content: any) => content.type || 'unknown'));
          return { ...kpi, value: uniqueTypes.size }
        case 'activeLocales':
          const uniqueLocales = new Set(dataToUse.map((content: any) => content.locale || 'unknown'));
          return { ...kpi, value: uniqueLocales.size }
        default:
          return kpi
      }
    })
  }, [allContent, filteredData])

  // Tab management
  useEffect(() => {
    if (!hasAddedTab.current) {
      addTab({
        title: 'Content Library',
        path: '/content-library',
        pinned: false,
        closable: true,
      })
      hasAddedTab.current = true
    }
  }, [addTab])

  // Page configuration - memoized to prevent unnecessary re-renders
  const pageConfig = useMemo(() => ({
    title: 'Content Library',
    description: dataSource === 'cache' 
      ? `Manage and organize all content (${serverData.length} items loaded from cache)`
      : dataSource === 'server'
      ? `Manage and organize all content (${serverData.length} items loaded from server)`
      : 'Manage and organize all content',
    icon: '📄',
    endpoint: '/api/content',
    columns: contentColumns,
    kpis: calculatedKPIs,
    filters: contentFilters,
    searchableFields: [
      { key: 'title', label: 'Title', type: 'text' },
      { key: 'summary', label: 'Summary', type: 'text' },
      { key: 'type', label: 'Type', type: 'text' },
      { key: 'status', label: 'Status', type: 'text' },
      { key: 'labels', label: 'Labels', type: 'text' },
      { key: 'locale', label: 'Locale', type: 'text' }
    ],
    actions: {
      create: () => console.log('Create content'),
      export: () => console.log('Export content'),
      import: () => console.log('Import content'),
      print: () => console.log('Print content'),
      settings: () => console.log('Content settings'),
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
                <div className="text-sm font-medium text-gray-900">Loading Content...</div>
                <div className="text-xs text-gray-500 mt-1">This should only take a moment</div>
              </div>
            </div>
          </div>
        </div>
      </div>
    )
  }

  if (loading && contentData.length === 0 && serverData.length === 0) {
    return (
      <div className="min-h-screen bg-gray-50">
        <div className="flex items-center justify-center min-h-[400px]">
          <div className="text-center">
            <div className="inline-flex items-center space-x-3 px-6 py-4 bg-white rounded-lg shadow-sm border">
              <div className="w-6 h-6 border-2 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
              <div>
                <div className="text-sm font-medium text-gray-900">Loading Content...</div>
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
          <div className="text-red-600 text-lg font-semibold mb-2">Error Loading Content</div>
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
  if (!isLoadingServerData && dataLoaded && serverData.length === 0 && contentData.length === 0) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center max-w-md">
          <div className="text-6xl mb-4">📄</div>
          <div className="text-xl font-semibold text-gray-900 mb-2">No Content Found</div>
          <div className="text-gray-600 mb-6">
            Unable to load content data. Please check your connection and try again.
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
    <div>
    <PageTemplate
      config={pageConfig}
        data={currentData}
      loading={loading}
      error={error}
        GridHeaderComponent={ContentGridCardFilterHeader}
        CardHeaderComponent={ContentGridCardFilterHeader}
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
    </div>
  )
}

export default function ContentLibraryPage() {
  return (
    <div className="h-full">
      <ContentLibraryClient initialData={{ items: [], lastEvaluatedKey: null, total: 0 }} />
    </div>
  )
}
