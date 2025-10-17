'use client'

import { useState, useMemo, useCallback, useEffect } from 'react'
import { TableItem, SortState, ViewMode, SearchCondition, CustomFilter, AdvancedFilters, PaginationConfig } from '../types/unified-table'

interface UseUnifiedTableProps<T extends TableItem> {
  // Data
  data: T[]
  loading?: boolean
  error?: string | null
  
  // Configuration
  itemTypeName?: string
  defaultSortField?: string
  defaultViewMode?: ViewMode
  defaultItemsPerPage?: number
  
  // Search and filtering
  enableSearch?: boolean
  enableAdvancedFilters?: boolean
  enableColumnFilters?: boolean
  enableSavedViews?: boolean
  
  // Features
  enableSelection?: boolean
  enableBulkActions?: boolean
  enableExport?: boolean
  enableImport?: boolean
  enablePrint?: boolean
  
  // Callbacks
  onDataChange?: (data: T[]) => void
  onSelectionChange?: (selectedIds: string[]) => void
  onSearch?: (query: string) => void
  onFilter?: (filters: Record<string, any>) => void
  onSort?: (sortState: SortState) => void
  onPageChange?: (page: number) => void
  onItemsPerPageChange?: (itemsPerPage: number) => void
}

interface UseUnifiedTableReturn<T extends TableItem> {
  // Data state
  currentData: T[]
  filteredData: T[]
  selectedItems: string[]
  
  // UI state
  viewMode: ViewMode
  setViewMode: (mode: ViewMode) => void
  isFullScreen: boolean
  onToggleFullScreen: () => void
  
  // Search state
  searchQuery: string
  setSearchQuery: (query: string) => void
  searchConditions: SearchCondition[]
  setSearchConditions: (conditions: SearchCondition[]) => void
  
  // Filter state
  columnFilters: Record<string, any>
  onColumnFilterChange: (column: string, value: any) => void
  advancedFilters: AdvancedFilters
  setAdvancedFilters: (filters: AdvancedFilters) => void
  customFilters: CustomFilter[]
  setCustomFilters: (filters: CustomFilter[]) => void
  
  // Sort state
  sortState: SortState
  onRequestSort: (key: string) => void
  
  // Pagination state
  pagination: PaginationConfig
  onPageChange: (page: number) => void
  onItemsPerPageChange: (itemsPerPage: number) => void
  
  // Selection
  setSelectedItems: (items: string[]) => void
  onSelectItem: (id: string) => void
  onSelectAll: () => void
  allSelected: boolean
  someSelected: boolean
  
  // Actions
  onClearSearch: () => void
  onClearFilters: () => void
  onResetAll: () => void
  
  // Utility functions
  getUniqueValues: (field: string) => string[]
  hasActiveFilters: boolean
  totalItems: number
}

export function useUnifiedTable<T extends TableItem>({
  data = [],
  loading = false,
  error = null,
  itemTypeName = 'items',
  defaultSortField = 'createdAt',
  defaultViewMode = 'table',
  defaultItemsPerPage = 25,
  enableSearch = true,
  enableAdvancedFilters = true,
  enableColumnFilters = true,
  enableSavedViews = true,
  enableSelection = true,
  enableBulkActions = true,
  enableExport = true,
  enableImport = true,
  enablePrint = true,
  onDataChange,
  onSelectionChange,
  onSearch,
  onFilter,
  onSort,
  onPageChange: onPageChangeCallback,
  onItemsPerPageChange: onItemsPerPageChangeCallback
}: UseUnifiedTableProps<T>): UseUnifiedTableReturn<T> {
  
  // UI State
  const [viewMode, setViewMode] = useState<ViewMode>(defaultViewMode)
  const [isFullScreen, setIsFullScreen] = useState(false)
  
  // Search State
  const [searchQuery, setSearchQuery] = useState('')
  const [searchConditions, setSearchConditions] = useState<SearchCondition[]>([])
  
  // Filter State
  const [columnFilters, setColumnFilters] = useState<Record<string, any>>({})
  const [advancedFilters, setAdvancedFilters] = useState<AdvancedFilters>({})
  const [customFilters, setCustomFilters] = useState<CustomFilter[]>([])
  
  // Sort State
  const [sortState, setSortState] = useState<SortState>({
    key: defaultSortField,
    dir: 'desc'
  })
  
  // Pagination State
  const [currentPage, setCurrentPage] = useState(1)
  const [itemsPerPage, setItemsPerPage] = useState(defaultItemsPerPage)
  
  // Selection State
  const [selectedItems, setSelectedItems] = useState<string[]>([])
  
  // Computed data
  const filteredData = useMemo(() => {
    let result = [...data]
    
    // Apply search query
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase()
      result = result.filter(item => {
        return Object.values(item).some(value => {
          if (typeof value === 'string') {
            return value.toLowerCase().includes(query)
          }
          if (typeof value === 'number') {
            return value.toString().includes(query)
          }
          if (Array.isArray(value)) {
            return value.some(v => String(v).toLowerCase().includes(query))
          }
          return false
        })
      })
    }
    
    // Apply column filters
    Object.entries(columnFilters).forEach(([column, filterValue]) => {
      if (filterValue !== undefined && filterValue !== null && filterValue !== '') {
        if (Array.isArray(filterValue)) {
          if (filterValue.length > 0) {
            result = result.filter(item => {
              const itemValue = item[column]
              if (Array.isArray(itemValue)) {
                return filterValue.some(fv => itemValue.includes(fv))
              }
              return filterValue.includes(itemValue)
            })
          }
        } else if (typeof filterValue === 'object' && filterValue.min !== undefined) {
          // Numeric range filter
          result = result.filter(item => {
            const itemValue = Number(item[column])
            const min = Number(filterValue.min)
            const max = Number(filterValue.max)
            if (isNaN(itemValue)) return false
            if (filterValue.min && itemValue < min) return false
            if (filterValue.max && itemValue > max) return false
            return true
          })
        } else if (typeof filterValue === 'object' && filterValue.start !== undefined) {
          // Date range filter
          result = result.filter(item => {
            const itemDate = new Date(item[column])
            const startDate = new Date(filterValue.start)
            const endDate = new Date(filterValue.end)
            if (isNaN(itemDate.getTime())) return false
            if (filterValue.start && itemDate < startDate) return false
            if (filterValue.end && itemDate > endDate) return false
            return true
          })
        } else {
          // Simple text filter
          result = result.filter(item => {
            const itemValue = String(item[column] || '').toLowerCase()
            return itemValue.includes(String(filterValue).toLowerCase())
          })
        }
      }
    })
    
    // Apply advanced filters
    if (advancedFilters.orderStatus && advancedFilters.orderStatus.length > 0) {
      result = result.filter(item => advancedFilters.orderStatus!.includes(item.status))
    }
    
    if (advancedFilters.financialStatus && advancedFilters.financialStatus.length > 0) {
      result = result.filter(item => advancedFilters.financialStatus!.includes(item.financialStatus))
    }
    
    if (advancedFilters.priceRange) {
      const { min, max } = advancedFilters.priceRange
      result = result.filter(item => {
        const price = Number(item.total || item.price || 0)
        if (min && price < Number(min)) return false
        if (max && price > Number(max)) return false
        return true
      })
    }
    
    if (advancedFilters.tags && advancedFilters.tags.length > 0) {
      result = result.filter(item => {
        const itemTags = Array.isArray(item.tags) ? item.tags : []
        return advancedFilters.tags!.some(tag => itemTags.includes(tag))
      })
    }
    
    // Apply custom filters
    customFilters.forEach(filter => {
      result = result.filter(item => {
        const itemValue = item[filter.field]
        switch (filter.operator) {
          case 'equals':
            return itemValue === filter.value
          case 'contains':
            return String(itemValue).toLowerCase().includes(filter.value.toLowerCase())
          case 'starts_with':
            return String(itemValue).toLowerCase().startsWith(filter.value.toLowerCase())
          case 'ends_with':
            return String(itemValue).toLowerCase().endsWith(filter.value.toLowerCase())
          case 'greater_than':
            return Number(itemValue) > Number(filter.value)
          case 'less_than':
            return Number(itemValue) < Number(filter.value)
          default:
            return true
        }
      })
    })
    
    return result
  }, [data, searchQuery, columnFilters, advancedFilters, customFilters])
  
  // Sorted data
  const sortedData = useMemo(() => {
    if (!sortState.key) return filteredData
    
    return [...filteredData].sort((a, b) => {
      const aValue = a[sortState.key as keyof T]
      const bValue = b[sortState.key as keyof T]
      
      if (aValue === undefined || aValue === null) return 1
      if (bValue === undefined || bValue === null) return -1
      
      let comparison = 0
      if (typeof aValue === 'string' && typeof bValue === 'string') {
        comparison = aValue.localeCompare(bValue)
      } else if (typeof aValue === 'number' && typeof bValue === 'number') {
        comparison = aValue - bValue
      } else {
        comparison = String(aValue).localeCompare(String(bValue))
      }
      
      return sortState.dir === 'asc' ? comparison : -comparison
    })
  }, [filteredData, sortState])
  
  // Paginated data
  const currentData = useMemo(() => {
    const startIndex = (currentPage - 1) * itemsPerPage
    const endIndex = startIndex + itemsPerPage
    return sortedData.slice(startIndex, endIndex)
  }, [sortedData, currentPage, itemsPerPage])
  
  // Selection helpers
  const allSelected = currentData.length > 0 && selectedItems.length === currentData.length
  const someSelected = selectedItems.length > 0 && selectedItems.length < currentData.length
  
  // Event handlers
  const onRequestSort = useCallback((key: string) => {
    setSortState(prev => ({
      key: prev.key === key ? (prev.dir === 'asc' ? key : null) : key,
      dir: prev.key === key ? (prev.dir === 'asc' ? 'desc' : 'asc') : 'asc'
    }))
    onSort?.({ key, dir: sortState.dir === 'asc' ? 'desc' : 'asc' })
  }, [sortState.dir, onSort])
  
  const onSelectItem = useCallback((id: string) => {
    setSelectedItems(prev => {
      const newSelection = prev.includes(id) 
        ? prev.filter(item => item !== id)
        : [...prev, id]
      onSelectionChange?.(newSelection)
      return newSelection
    })
  }, [onSelectionChange])
  
  const onSelectAll = useCallback(() => {
    if (allSelected) {
      setSelectedItems([])
      onSelectionChange?.([])
    } else {
      const allIds = currentData.map(item => item.id)
      setSelectedItems(allIds)
      onSelectionChange?.(allIds)
    }
  }, [allSelected, currentData, onSelectionChange])
  
  const onColumnFilterChange = useCallback((column: string, value: any) => {
    setColumnFilters(prev => {
      const newFilters = { ...prev, [column]: value }
      onFilter?.(newFilters)
      return newFilters
    })
  }, [onFilter])
  
  const onPageChange = useCallback((page: number) => {
    setCurrentPage(page)
    onPageChangeCallback?.(page)
  }, [onPageChangeCallback])
  
  const onItemsPerPageChange = useCallback((newItemsPerPage: number) => {
    setItemsPerPage(newItemsPerPage)
    setCurrentPage(1) // Reset to first page when changing items per page
    onItemsPerPageChangeCallback?.(newItemsPerPage)
  }, [onItemsPerPageChangeCallback])
  
  const onToggleFullScreen = useCallback(() => {
    setIsFullScreen(prev => !prev)
  }, [])
  
  const onClearSearch = useCallback(() => {
    setSearchQuery('')
    onSearch?.('')
  }, [onSearch])
  
  const onClearFilters = useCallback(() => {
    setColumnFilters({})
    setAdvancedFilters({})
    setCustomFilters([])
    onFilter?.({})
  }, [onFilter])
  
  const onResetAll = useCallback(() => {
    setSearchQuery('')
    setSearchConditions([])
    setColumnFilters({})
    setAdvancedFilters({})
    setCustomFilters([])
    setSelectedItems([])
    setCurrentPage(1)
    onSearch?.('')
    onFilter?.({})
    onSelectionChange?.([])
  }, [onSearch, onFilter, onSelectionChange])
  
  // Utility functions
  const getUniqueValues = useCallback((field: string): string[] => {
    const values = new Set<string>()
    data.forEach(item => {
      const value = item[field]
      if (value !== undefined && value !== null) {
        if (Array.isArray(value)) {
          value.forEach(v => values.add(String(v)))
        } else {
          values.add(String(value))
        }
      }
    })
    return Array.from(values).sort()
  }, [data])
  
  const hasActiveFilters = useMemo(() => {
    return Object.values(columnFilters).some(value => 
      value !== undefined && value !== null && value !== '' && 
      (!Array.isArray(value) || value.length > 0)
    ) || Object.values(advancedFilters).some(value => 
      value !== undefined && value !== null && 
      (!Array.isArray(value) || value.length > 0)
    ) || customFilters.length > 0
  }, [columnFilters, advancedFilters, customFilters])
  
  // Reset pagination when data changes
  useEffect(() => {
    setCurrentPage(1)
  }, [searchQuery, columnFilters, advancedFilters, customFilters, sortState])
  
  // Clear selection when data changes
  useEffect(() => {
    setSelectedItems([])
    onSelectionChange?.([])
  }, [data, onSelectionChange])
  
  // Pagination config
  const pagination: PaginationConfig = useMemo(() => ({
    currentPage,
    totalPages: Math.ceil(sortedData.length / itemsPerPage),
    itemsPerPage,
    totalItems: sortedData.length,
    onPageChange,
    onItemsPerPageChange
  }), [currentPage, itemsPerPage, sortedData.length, onPageChange, onItemsPerPageChange])
  
  return {
    // Data state
    currentData,
    filteredData,
    selectedItems,
    
    // UI state
    viewMode,
    setViewMode,
    isFullScreen,
    onToggleFullScreen,
    
    // Search state
    searchQuery,
    setSearchQuery,
    searchConditions,
    setSearchConditions,
    
    // Filter state
    columnFilters,
    onColumnFilterChange,
    advancedFilters,
    setAdvancedFilters,
    customFilters,
    setCustomFilters,
    
    // Sort state
    sortState,
    onRequestSort,
    
    // Pagination state
    pagination,
    onPageChange,
    onItemsPerPageChange,
    
    // Selection
    setSelectedItems,
    onSelectItem,
    onSelectAll,
    allSelected,
    someSelected,
    
    // Actions
    onClearSearch,
    onClearFilters,
    onResetAll,
    
    // Utility functions
    getUniqueValues,
    hasActiveFilters,
    totalItems: sortedData.length
  }
}
