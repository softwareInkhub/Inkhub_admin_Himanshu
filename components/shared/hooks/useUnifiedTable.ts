'use client'

import { useMemo, useState } from 'react'
import { TableItem } from '../types/unified-table'

type ViewMode = 'table' | 'grid' | 'card'

interface UseUnifiedTableParams<T extends TableItem> {
  data: T[]
  loading?: boolean
  error?: string | null
  itemTypeName?: string
  defaultSortField?: string
  defaultViewMode?: ViewMode
  defaultItemsPerPage?: number
  enableSearch?: boolean
  enableAdvancedFilters?: boolean
  enableColumnFilters?: boolean
  enableSavedViews?: boolean
  enableSelection?: boolean
  enableBulkActions?: boolean
  enableExport?: boolean
  enableImport?: boolean
  enablePrint?: boolean
  onDataChange?: (data: T[]) => void
  onSelectionChange?: (selectedIds: string[]) => void
  onSearch?: (query: string) => void
  onFilter?: (filters: Record<string, any>) => void
  onSort?: (sortState: { key: string | null; dir: 'asc' | 'desc' | null }) => void
  onPageChange?: (page: number) => void
  onItemsPerPageChange?: (itemsPerPage: number) => void
}

export function useUnifiedTable<T extends TableItem>({
  data,
  defaultSortField = 'createdAt',
  defaultViewMode = 'table',
  defaultItemsPerPage = 25,
  onSelectionChange,
  onSearch,
  onFilter,
  onSort,
  onPageChange,
  onItemsPerPageChange
}: UseUnifiedTableParams<T>) {
  const [searchQuery, setSearchQuery] = useState('')
  const [searchConditions, setSearchConditions] = useState<any[]>([])
  const [columnFilters, setColumnFilters] = useState<Record<string, any>>({})
  const [advancedFilters, setAdvancedFilters] = useState<Record<string, any>>({})
  const [customFilters, setCustomFilters] = useState<any[]>([])
  const [sortState, setSortState] = useState<{ key: string | null; dir: 'asc' | 'desc' | null }>({ key: defaultSortField, dir: null })
  const [viewMode, setViewMode] = useState<ViewMode>(defaultViewMode)
  const [isFullScreen, setIsFullScreen] = useState(false)
  const [selectedItems, setSelectedItems] = useState<string[]>([])

  const [currentPage, setCurrentPage] = useState(1)
  const [itemsPerPage, setItemsPerPage] = useState(defaultItemsPerPage)

  const onToggleFullScreen = () => setIsFullScreen((v) => !v)

  const onColumnFilterChange = (column: string, value: any) => {
    setColumnFilters((prev) => {
      const next = { ...prev, [column]: value }
      onFilter?.(next)
      return next
    })
  }

  const filteredData = useMemo(() => {
    let next = Array.isArray(data) ? data : []
    // Very light search filter; pages can override via props if needed
    if (searchQuery) {
      const q = searchQuery.toLowerCase()
      next = next.filter((it) => JSON.stringify(it).toLowerCase().includes(q))
    }
    // Column filters (basic contains/equality for arrays/strings)
    Object.entries(columnFilters).forEach(([key, val]) => {
      if (val == null || val === '' || (Array.isArray(val) && val.length === 0)) return
      next = next.filter((it: any) => {
        const field = it[key]
        if (Array.isArray(val)) return val.includes(field)
        return String(field ?? '').toLowerCase().includes(String(val).toLowerCase())
      })
    })
    return next
  }, [data, searchQuery, columnFilters])

  const totalItems = filteredData.length

  const currentData = useMemo(() => {
    const start = (currentPage - 1) * itemsPerPage
    const end = start + itemsPerPage
    return filteredData.slice(start, end)
  }, [filteredData, currentPage, itemsPerPage])

  const pagination = {
    currentPage,
    totalPages: Math.max(1, Math.ceil(totalItems / itemsPerPage)),
    itemsPerPage,
    totalItems
  }

  const onRequestSort = (key: string) => {
    setSortState((prev) => {
      const dir: 'asc' | 'desc' = prev.key === key ? (prev.dir === 'asc' ? 'desc' : 'asc') : 'asc'
      const next = { key, dir }
      onSort?.(next)
      return next
    })
  }

  const onSelectItem = (id: string) => {
    setSelectedItems((prev) => {
      const next = prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]
      onSelectionChange?.(next)
      return next
    })
  }

  const onSelectAll = () => {
    setSelectedItems((prev) => {
      const allIds = currentData.map((d) => d.id)
      const allSelected = prev.length === allIds.length && allIds.every((id) => prev.includes(id))
      const next = allSelected ? [] : allIds
      onSelectionChange?.(next)
      return next
    })
  }

  const allSelected = currentData.length > 0 && selectedItems.length === currentData.length
  const someSelected = selectedItems.length > 0 && selectedItems.length < currentData.length

  const onClearSearch = () => {
    setSearchQuery('')
    setSearchConditions([])
    onSearch?.('')
  }

  const onClearFilters = () => {
    setColumnFilters({})
    setAdvancedFilters({})
    setCustomFilters([])
  }

  const onResetAll = () => {
    onClearSearch()
    onClearFilters()
    setSelectedItems([])
  }

  const getUniqueValues = (field: string): string[] => {
    const set = new Set<string>()
    for (const it of data) {
      const v = (it as any)[field]
      if (Array.isArray(v)) v.forEach((x) => set.add(String(x)))
      else if (v != null) set.add(String(v))
    }
    return Array.from(set)
  }

  const handlePageChange = (page: number) => {
    setCurrentPage(page)
    onPageChange?.(page)
  }

  const handleItemsPerPageChange = (n: number) => {
    setItemsPerPage(n)
    onItemsPerPageChange?.(n)
  }

  return {
    currentData,
    filteredData,
    selectedItems,
    setSelectedItems,
    viewMode,
    setViewMode,
    isFullScreen,
    onToggleFullScreen,
    searchQuery,
    setSearchQuery,
    searchConditions,
    setSearchConditions,
    columnFilters,
    onColumnFilterChange,
    advancedFilters,
    setAdvancedFilters,
    customFilters,
    setCustomFilters,
    sortState,
    onRequestSort,
    pagination,
    onPageChange: handlePageChange,
    onItemsPerPageChange: handleItemsPerPageChange,
    onSelectItem,
    onSelectAll,
    allSelected,
    someSelected,
    onClearSearch,
    onClearFilters,
    onResetAll,
    getUniqueValues,
    hasActiveFilters: Object.values(columnFilters).some((v) => (Array.isArray(v) ? v.length > 0 : Boolean(v))),
    totalItems
  }
}














