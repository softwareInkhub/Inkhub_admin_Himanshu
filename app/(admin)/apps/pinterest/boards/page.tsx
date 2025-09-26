'use client'

import { useEffect, useState, useRef, useMemo } from 'react'
import { useAppStore } from '@/lib/store'
import { 
  PageTemplate, 
  useDataTable
} from '@/components/shared'
import BoardsGridCardFilterHeader from './components/BoardsGridCardFilterHeader'
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

function BoardsClient() {
  const { addTab } = useAppStore()
  const hasAddedTab = useRef(false)
  const [boardsData, setBoardsData] = useState<Board[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  // Fetch real boards data
  useEffect(() => {
    const loadBoards = async () => {
      try {
        setIsLoading(true)
        setError(null)
        const boards = await fetchBoards()
        setBoardsData(boards)
      } catch (err: any) {
        setError(err.message || 'Failed to load boards')
        console.error('Error loading boards:', err)
      } finally {
        setIsLoading(false)
      }
    }

    loadBoards()
  }, [])

  // Initialize data table hook
  const {
    data: boardData,
    loading,
    error: tableError,
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
    clearAdvancedFilters
  } = useDataTable<Board>({
    initialData: boardsData,
    columns: boardColumns,
    searchableFields: [
      { key: 'name', label: 'Name', type: 'text' },
      { key: 'description', label: 'Description', type: 'text' },
      { key: 'owner', label: 'Owner', type: 'text' },
      { key: 'category', label: 'Category', type: 'text' },
      { key: 'tags', label: 'Tags', type: 'text' },
      { key: 'privacy', label: 'Privacy', type: 'text' }
    ],
    filterOptions: boardFilters,
    defaultViewMode: 'table',
    defaultItemsPerPage: 25
  })

  // Update data table when boards data changes
  useEffect(() => {
    if (boardsData.length > 0) {
      // The useDataTable hook should automatically update when initialData changes
      // If not, we might need to trigger a refresh
    }
  }, [boardsData])

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

  if (isLoading && boardsData.length === 0) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-gray-500">Loading Pinterest boards...</div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="text-red-600 text-lg font-semibold mb-2">Error Loading Pinterest Boards</div>
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

  return (
    <PageTemplate
      config={pageConfig}
      data={currentData}
      loading={isLoading}
      error={error}
      GridHeaderComponent={BoardsGridCardFilterHeader}
      CardHeaderComponent={BoardsGridCardFilterHeader}
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
  )
}

export default function PinterestBoardsPage() {
  return (
    <div className="h-full">
      <BoardsClient />
    </div>
  )
}
