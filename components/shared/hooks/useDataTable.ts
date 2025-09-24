'use client'

import { useState, useCallback, useMemo, useEffect, useRef } from 'react'
import { BaseEntity, SearchCondition, CustomFilter, ViewMode, PaginationConfig } from '../types'

interface UseDataTableProps<T extends BaseEntity> {
  initialData: T[]
  itemsPerPage?: number
  columns?: any[]
  searchableFields?: any[]
  filterOptions?: any[]
  defaultViewMode?: ViewMode
  defaultItemsPerPage?: number
}

export function useDataTable<T extends BaseEntity>({
  initialData,
  itemsPerPage = 25,
  defaultViewMode = 'table',
  defaultItemsPerPage = 25
}: UseDataTableProps<T>) {
  // State
  const [data, setData] = useState<T[]>(initialData)
  const isInitialMount = useRef(true)
  
  // Update data when initialData changes (only on subsequent updates, not initial mount)
  useEffect(() => {
    if (isInitialMount.current) {
      isInitialMount.current = false
      return
    }
    // Guard against infinite update loops when callers pass a new [] literal each render
    // Only update when initialData has actual content or a new reference that differs meaningfully
    if (Array.isArray(initialData)) {
      if (initialData.length === 0) return
      // Avoid unnecessary updates if shallowly equal by length and first id
      if (data.length === initialData.length) {
        const a = (data as any[])[0]?.id
        const b = (initialData as any[])[0]?.id
        if (a === b) return
      }
    }
    setData(initialData)
  }, [initialData])
  
  const [searchQuery, setSearchQuery] = useState('')
  const [searchConditions, setSearchConditions] = useState<SearchCondition[]>([])
  const [selectedItems, setSelectedItems] = useState<string[]>([])
  const [viewMode, setViewMode] = useState<ViewMode>(defaultViewMode)
  const [currentPage, setCurrentPage] = useState(1)
  const [itemsPerPageState, setItemsPerPageState] = useState(defaultItemsPerPage)
  const [sortColumn, setSortColumn] = useState<string | null>(null)
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('desc')
  const [customFilters, setCustomFilters] = useState<CustomFilter[]>([])
  const [activeFilter, setActiveFilter] = useState('all')
  const [columnFilters, setColumnFilters] = useState<Record<string, any>>({})

  // UI State
  const [showSearchBuilder, setShowSearchBuilder] = useState(false)
  const [showAdvancedFilter, setShowAdvancedFilter] = useState(false)
  const [showAdditionalControls, setShowAdditionalControls] = useState(false)
  const [showHeaderDropdown, setShowHeaderDropdown] = useState(false)
  const [isFullScreen, setIsFullScreen] = useState(false)

  // Filtered and sorted data
  const filteredData = useMemo(() => {
    let filtered = [...data]

    // Apply search query
    if (searchQuery) {
      filtered = filtered.filter(item =>
        Object.values(item).some(value =>
          String(value).toLowerCase().includes(searchQuery.toLowerCase())
        )
      )
    }

    // Apply search conditions
    if (searchConditions.length > 0) {
      filtered = filtered.filter(item => {
        return searchConditions.every(condition => {
          const value = item[condition.field as keyof T]
          const stringValue = String(value).toLowerCase()
          const conditionValue = condition.value.toLowerCase()

          switch (condition.operator) {
            case 'contains':
              return stringValue.includes(conditionValue)
            case 'equals':
              return stringValue === conditionValue
            case 'starts_with':
              return stringValue.startsWith(conditionValue)
            case 'ends_with':
              return stringValue.endsWith(conditionValue)
            default:
              return true
          }
        })
      })
    }

    // Apply custom filters
    if (customFilters.length > 0) {
      filtered = filtered.filter(item => {
        return customFilters.every(filter => {
          const value = item[filter.field as keyof T]
          return String(value) === filter.value
        })
      })
    }

    // Apply column filters
    Object.entries(columnFilters).forEach(([column, filterValue]) => {
      if (filterValue && filterValue.length > 0) {
        filtered = filtered.filter(item => {
          const value = item[column as keyof T]
          return filterValue.includes(String(value))
        })
      }
    })

    return filtered
  }, [data, searchQuery, searchConditions, customFilters, columnFilters])

  // Sorted data
  const sortedData = useMemo(() => {
    if (!sortColumn) return filteredData

    return [...filteredData].sort((a, b) => {
      const aValue = a[sortColumn as keyof T]
      const bValue = b[sortColumn as keyof T]

      if (aValue === bValue) return 0

      let comparison = 0
      if (typeof aValue === 'string' && typeof bValue === 'string') {
        comparison = aValue.localeCompare(bValue)
      } else if (typeof aValue === 'number' && typeof bValue === 'number') {
        comparison = aValue - bValue
      } else {
        comparison = String(aValue).localeCompare(String(bValue))
      }

      return sortDirection === 'asc' ? comparison : -comparison
    })
  }, [filteredData, sortColumn, sortDirection])

  // Pagination
  const totalItems = sortedData.length
  const totalPages = Math.ceil(totalItems / itemsPerPageState)
  const startIndex = (currentPage - 1) * itemsPerPageState
  const endIndex = startIndex + itemsPerPageState
  const paginatedData = sortedData.slice(startIndex, endIndex)

  // Actions
  const handleSelectItem = useCallback((id: string) => {
    setSelectedItems(prev =>
      prev.includes(id)
        ? prev.filter(itemId => itemId !== id)
        : [...prev, id]
    )
  }, [])

  const handleSelectAll = useCallback(() => {
    if (selectedItems.length === paginatedData.length) {
      setSelectedItems([])
    } else {
      setSelectedItems(paginatedData.map(item => item.id))
    }
  }, [selectedItems.length, paginatedData])

  const handleSort = useCallback((column: string) => {
    if (sortColumn === column) {
      setSortDirection(prev => prev === 'asc' ? 'desc' : 'asc')
    } else {
      setSortColumn(column)
      setSortDirection('asc')
    }
  }, [sortColumn])

  const handlePageChange = useCallback((page: number) => {
    setCurrentPage(page)
  }, [])

  const handleItemsPerPageChange = useCallback((items: number) => {
    setItemsPerPageState(items)
    setCurrentPage(1)
  }, [])

  const handleClearSearch = useCallback(() => {
    setSearchQuery('')
    setSearchConditions([])
  }, [])

  const handleClearSearchConditions = useCallback(() => {
    setSearchConditions([])
  }, [])

  const handleAddCustomFilter = useCallback((filter: CustomFilter) => {
    setCustomFilters(prev => [...prev, filter])
  }, [])

  const handleRemoveCustomFilter = useCallback((id: string) => {
    setCustomFilters(prev => prev.filter(filter => filter.id !== id))
  }, [])

  const handleColumnFilterChange = useCallback((column: string, value: any) => {
    setColumnFilters(prev => ({
      ...prev,
      [column]: value
    }))
  }, [])

  const handleToggleFullScreen = useCallback(() => {
    setIsFullScreen(prev => !prev)
  }, [])

  const getUniqueValues = useCallback((field: string): string[] => {
    const values = new Set<string>()
    data.forEach(item => {
      const value = item[field as keyof T]
      if (value !== undefined && value !== null) {
        values.add(String(value))
      }
    })
    return Array.from(values).sort()
  }, [data])

  // Pagination config
  const paginationConfig: PaginationConfig = {
    currentPage,
    totalPages,
    itemsPerPage: itemsPerPageState,
    totalItems,
    onPageChange: handlePageChange,
    onItemsPerPageChange: handleItemsPerPageChange
  }

  return {
    // Data
    data: paginatedData,
    totalItems,
    selectedItems,
    setSelectedItems,
    
    // Search and filters
    searchQuery,
    setSearchQuery,
    searchConditions,
    setSearchConditions,
    customFilters,
    setCustomFilters,
    activeFilter,
    setActiveFilter,
    columnFilters,
    setColumnFilters,
    advancedFilters: {},
    setAdvancedFilters: () => {},
    
    // View
    viewMode,
    setViewMode,
    currentPage,
    setCurrentPage,
    itemsPerPage: itemsPerPageState,
    setItemsPerPage: setItemsPerPageState,
    isFullScreen,
    
    // UI state
    showSearchBuilder,
    setShowSearchBuilder,
    showAdvancedFilter,
    setShowAdvancedFilter,
    showAdditionalControls,
    setShowAdditionalControls,
    showHeaderDropdown,
    setShowHeaderDropdown,
    
    // Actions
    handleSelectItem,
    handleSelectAll,
    handlePageChange,
    handleItemsPerPageChange,
    handleSort,
    handleSearch: setSearchQuery,
    handleAdvancedSearch: () => {},
    handleColumnFilter: handleColumnFilterChange,
    handleCustomFilter: handleAddCustomFilter,
    handleAdvancedFilter: () => {},
    handleClearSearch,
    handleClearSearchConditions,
    handleAddCustomFilter,
    handleRemoveCustomFilter,
    handleColumnFilterChange,
    handleToggleFullScreen,
    getUniqueValues,
    clearAllFilters: () => {},
    clearSearch: handleClearSearch,
    clearColumnFilters: () => setColumnFilters({}),
    clearCustomFilters: () => setCustomFilters([]),
    clearAdvancedFilters: () => {},
    
    // Pagination
    paginationConfig,
    totalPages,
    currentData: paginatedData,
    filteredData,
    
    // Sort state
    sortColumn,
    setSortColumn,
    sortDirection,
    setSortDirection,
    
    // Loading and error states
    loading: false,
    error: null,
    
    // Data setter for external updates
    setData
  }
}
