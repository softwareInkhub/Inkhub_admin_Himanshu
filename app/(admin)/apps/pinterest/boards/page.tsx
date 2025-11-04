'use client'

import { useEffect, useState, useRef, useMemo } from 'react'
import { useAppStore } from '@/lib/store'
import { usePinterestBoardsPageStore } from '@/lib/stores/pinterest-boards-page-store'
import { 
  PageTemplate, 
  useDataTable,
  GridCardFilterHeader,
  type GridFilterColumn
} from '@/components/shared'
import CardsPerRowDropdown from '@/components/shared/CardsPerRowDropdown'
import GridColumnHeader from '@/components/shared/GridColumnHeader'
import { Board } from './types'
import { fetchBoards, calculateBoardsKPIs } from './services/boardService'

// Define table columns for boards
const boardColumns = [
  {
    key: 'board',
    label: 'BOARD',
    sortable: true,
    render: (value: any, board: Board) => (
      <div className="flex items-center space-x-3">
        <div className="w-12 h-12 rounded-md overflow-hidden bg-gray-100 flex-shrink-0">
          {board.image ? (
            <img 
              src={board.image} 
              alt={board.name || 'Board'}
              className="w-full h-full object-cover"
            />
          ) : (
            <div className="w-full h-full bg-gray-200 flex items-center justify-center">
              <span className="text-xs text-gray-500">No image</span>
            </div>
          )}
        </div>
        <div className="flex-1 min-w-0">
          <div className="text-sm font-medium text-gray-900 truncate">
            {board.name || 'Untitled Board'}
          </div>
        </div>
      </div>
    )
  },
  {
    key: 'status',
    label: 'STATUS',
    sortable: true,
    render: (value: any, board: Board) => {
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
      const badge = getStatusBadge(board.status || 'active')
      return <span className={badge.className}>{badge.text}</span>
    }
  },
  {
    key: 'privacy',
    label: 'PRIVACY',
    sortable: true,
    render: (value: any, board: Board) => {
      const getPrivacyBadge = (privacy: string) => {
        switch (privacy) {
          case 'public':
            return { className: "inline-flex px-2 py-1 text-xs font-medium rounded-full bg-blue-100 text-blue-800", text: "Public" }
          case 'private':
            return { className: "inline-flex px-2 py-1 text-xs font-medium rounded-full bg-orange-100 text-orange-800", text: "Private" }
          default:
            return { className: "inline-flex px-2 py-1 text-xs font-medium rounded-full bg-gray-100 text-gray-800", text: privacy }
        }
      }
      const badge = getPrivacyBadge(board.privacy || 'public')
      return <span className={badge.className}>{badge.text}</span>
    }
  },
  {
    key: 'category',
    label: 'CATEGORY',
    sortable: true,
    render: (value: any, board: Board) => (
      <div className="text-sm text-gray-900">{board.category || 'Uncategorized'}</div>
    )
  },
  {
    key: 'owner',
    label: 'OWNER',
    sortable: true,
    render: (value: any, board: Board) => (
      <div className="text-sm text-gray-900">{board.owner || 'Unknown'}</div>
    )
  },
  {
    key: 'pinCount',
    label: 'PINS',
    sortable: true,
    render: (value: any, board: Board) => (
      <span className="text-sm text-gray-900">{(board.pinCount || 0).toLocaleString()}</span>
    )
  },
  {
    key: 'followers',
    label: 'FOLLOWERS',
    sortable: true,
    render: (value: any, board: Board) => (
      <span className="text-sm text-gray-900">{(board.followers || 0).toLocaleString()}</span>
    )
  },
  {
    key: 'createdAt',
    label: 'CREATED',
    sortable: true,
    render: (value: any, board: Board) => (
      <span className="text-sm text-gray-500">
        {board.createdAt ? new Date(board.createdAt).toLocaleDateString('en-US', {
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
    render: (value: any, board: Board) => (
      <span className="text-sm text-gray-500">
        {board.updatedAt ? new Date(board.updatedAt).toLocaleDateString('en-US', {
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
    render: (value: any, board: Board) => (
      <div className="flex flex-wrap gap-1">
        {board.tags && board.tags.length > 0 ? (
          board.tags.slice(0, 2).map((tag, index) => (
            <span
              key={index}
              className="inline-flex px-2 py-1 text-xs font-medium rounded-full bg-gray-100 text-gray-800"
            >
              {tag}
            </span>
          ))
        ) : (
          <span className="text-xs text-gray-500">No tags</span>
        )}
        {board.tags && board.tags.length > 2 && (
          <span className="inline-flex px-2 py-1 text-xs font-medium rounded-full bg-gray-100 text-gray-800">
            +{board.tags.length - 2}
          </span>
        )}
      </div>
    )
  }
]

// Define KPI metrics for boards
const boardKPIs = [
  {
    key: 'totalBoards',
    label: 'Total Boards',
    value: 0,
    change: 8,
    trend: 'up' as const,
    icon: '📋',
    color: 'blue'
  },
  {
    key: 'totalPins',
    label: 'Total Pins',
    value: 0,
    change: 15,
    trend: 'up' as const,
    icon: '📌',
    color: 'red'
  },
  {
    key: 'totalFollowers',
    label: 'Total Followers',
    value: 0,
    change: 12,
    trend: 'up' as const,
    icon: '👥',
    color: 'green'
  },
  {
    key: 'publicBoards',
    label: 'Public Boards',
    value: 0,
    change: 5,
    trend: 'up' as const,
    icon: '🌐',
    color: 'purple'
  },
  {
    key: 'avgPinsPerBoard',
    label: 'Avg Pins/Board',
    value: 0,
    change: 3,
    trend: 'up' as const,
    icon: '📊',
    color: 'orange'
  },
  {
    key: 'activeCategories',
    label: 'Active Categories',
    value: 0,
    change: 2,
    trend: 'up' as const,
    icon: '🏷️',
    color: 'indigo'
  }
]

// Define filter options for boards
const boardFilters = [
  { key: 'all', label: '' },
  { key: 'public', label: 'Public' },
  { key: 'private', label: 'Private' },
  { key: 'secret', label: 'Secret' },
  { key: 'popular', label: 'Popular' },
  { key: 'recent', label: 'Recent' },
  { key: 'trending', label: 'Trending' }
]

// Define grid filter columns for boards
const gridFilterColumns: GridFilterColumn[] = [
  { key: 'status', label: 'Status', filterType: 'select', options: ['active', 'archived'] },
  { key: 'privacy', label: 'Privacy', filterType: 'select', options: ['public', 'private', 'secret'] },
  { key: 'category', label: 'Category', filterType: 'text' },
  { key: 'owner', label: 'Owner', filterType: 'text' },
  { key: 'pinCount', label: 'Pin Count', filterType: 'numeric' },
  { key: 'followers', label: 'Followers', filterType: 'numeric' },
  { key: 'createdAt', label: 'Created', filterType: 'date' },
  { key: 'updatedAt', label: 'Updated', filterType: 'date' }
]

function BoardsClient() {
  const { addTab } = useAppStore()
  const hasAddedTab = useRef(false)
  
  // ✅ USE ZUSTAND STORE for persistent state
  const {
    pageIndex, pageSize, sorting, columnFilters, globalFilter,
    setPageIndex, setPageSize, setSorting, setColumnFilters, setGlobalFilter,
    selectedRowIds, setSelectedRowIds,
    scrollY, setScrollY,
    viewMode: storedViewMode, setViewMode: setStoredViewMode,
  } = usePinterestBoardsPageStore()
  
  const [boardsData, setBoardsData] = useState<Board[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  
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

  // Fetch real boards data
  useEffect(() => {
    const loadBoards = async () => {
      try {
        setIsLoading(true)
        setError(null)
        // Ultra-fast in-memory session cache
        try {
          if (typeof window !== 'undefined') {
            // eslint-disable-next-line @typescript-eslint/ban-ts-comment
            // @ts-ignore
            const mem = window.__boardsCache as { data: Board[]; timestamp: number } | undefined
            if (mem && Array.isArray(mem.data) && mem.data.length > 0) {
              setBoardsData(mem.data)
              setIsLoading(false)
              return
            }
          }
        } catch {}
        const boards = await fetchBoards()
        setBoardsData(boards)
        try {
          // eslint-disable-next-line @typescript-eslint/ban-ts-comment
          // @ts-ignore
          window.__boardsCache = { data: boards, timestamp: Date.now() }
        } catch {}
      } catch (err: any) {
        setError(err?.message || 'Failed to load boards')
        console.error('Error loading boards:', err)
      } finally {
        setIsLoading(false)
      }
    }

    loadBoards()
  }, [])

  // ✅ Initialize data table hook - INTEGRATE with Zustand for persistent state
  const {
    data: boardData,
    loading,
    error: tableError,
    filteredData,
    totalPages,
    currentData,
    setData: setBoardData,
    currentPage,
    setCurrentPage,
    itemsPerPage,
    setItemsPerPage,
    handlePageChange,
    handleItemsPerPageChange
  } = useDataTable<Board>({
    initialData: boardsData,
    columns: boardColumns,
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
      const saved = localStorage.getItem('boards-cards-per-row')
      return saved ? parseInt(saved, 10) : 4
    }
    return 4
  })

  // Save cards per row preference to localStorage
  useEffect(() => {
    if (typeof window !== 'undefined') {
      localStorage.setItem('boards-cards-per-row', cardsPerRow.toString())
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

  // Filter boards data based on search query
  const filteredBoardsData = useMemo(() => {
    if (!searchQuery.trim()) {
      return boardsData
    }
    
    const query = searchQuery.toLowerCase()
    return boardsData.filter(board =>
      Object.values(board).some(value => {
        if (Array.isArray(value)) {
          return value.some(item => String(item).toLowerCase().includes(query))
        }
        return String(value).toLowerCase().includes(query)
      })
    )
  }, [boardsData, searchQuery])

  // Update data table when filtered boards data changes
  useEffect(() => {
    if (filteredBoardsData.length > 0 || searchQuery.trim()) {
      setBoardData(filteredBoardsData)
    }
  }, [filteredBoardsData, setBoardData, searchQuery])

  // Calculate KPI metrics based on real boards data
  const calculatedKPIs = useMemo(() => {
    const kpiData = calculateBoardsKPIs(boardsData)
    
    return boardKPIs.map(kpi => {
      switch (kpi.key) {
        case 'totalBoards':
          return { ...kpi, value: kpiData.totalBoards.value }
        case 'totalPins':
          return { ...kpi, value: kpiData.totalPins.value }
        case 'totalFollowers':
          return { ...kpi, value: kpiData.totalFollowers.value }
        case 'publicBoards':
          return { ...kpi, value: kpiData.publicBoards.value }
        case 'avgPinsPerBoard':
          return { ...kpi, value: kpiData.avgPinsPerBoard.value }
        case 'activeCategories':
          return { ...kpi, value: kpiData.activeCategories.value }
        default:
          return kpi
      }
    })
  }, [boardsData])

  // Tab management
  useEffect(() => {
    if (!hasAddedTab.current) {
      addTab({
        title: 'Pinterest Boards',
        path: '/apps/pinterest/boards',
        pinned: false,
        closable: true,
      })
      hasAddedTab.current = true
    }
  }, [addTab])

  // Page configuration
  const pageConfig = {
    title: 'Pinterest Boards',
    description: 'Manage and analyze your Pinterest boards',
    icon: '📋',
    endpoint: '/api/boards',
    columns: boardColumns,
    kpis: calculatedKPIs,
    filters: boardFilters,
    searchableFields: [
      { key: 'name', label: 'Name', type: 'text' },
      { key: 'description', label: 'Description', type: 'text' },
      { key: 'owner', label: 'Owner', type: 'text' },
      { key: 'category', label: 'Category', type: 'text' },
      { key: 'tags', label: 'Tags', type: 'text' },
      { key: 'privacy', label: 'Privacy', type: 'text' }
    ],
    actions: {
      create: () => console.log('Create board'),
      export: () => console.log('Export boards'),
      import: () => console.log('Import boards'),
      print: () => console.log('Print boards'),
      settings: () => console.log('Board settings')
    }
  }

  // Unified loading UI (consistent with other pages)
  if (isLoading && boardsData.length === 0) {
    return (
      <div className="min-h-screen bg-gray-50">
        <div className="flex items-center justify-center min-h-[400px]">
          <div className="text-center">
            <div className="inline-flex items-center space-x-3 px-6 py-4 bg-white rounded-lg shadow-sm border">
              <div className="w-6 h-6 border-2 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
              <div>
                <div className="text-sm font-medium text-gray-900">Loading Boards...</div>
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
          <div className="text-red-600 text-lg font-semibold mb-2">Error Loading Pinterest Boards</div>
          <div className="text-gray-600 mb-4">{error}</div>
          <div className="text-xs text-gray-500 mb-4">Tip: Ensure caching job ran for table <code>pinterest_inkhub_main_get_boards</code> and at least one of the keys like <code>all</code>, <code>boards</code>, or <code>chunk:0</code> exists.</div>
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

  return (
    <PageTemplate
      config={pageConfig}
      data={currentData}
      loading={isLoading}
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

export default function PinterestBoardsPage() {
  return <BoardsClient />
}
