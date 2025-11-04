'use client'

import { useEffect, useMemo, useState } from 'react'

interface UseDataTableParams<T> {
  initialData: T[]
  columns?: any[]
  defaultViewMode?: 'table' | 'grid' | 'card'
  defaultItemsPerPage?: number
}

export function useDataTable<T>({
  initialData,
  defaultItemsPerPage = 25
}: UseDataTableParams<T>) {
  const [data, setData] = useState<T[]>(initialData || [])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [currentPage, setCurrentPage] = useState(1)
  const [itemsPerPage, setItemsPerPage] = useState(defaultItemsPerPage)

  // Sync from initialData only when it meaningfully changes and is non-empty.
  const initialSig = useMemo(() => {
    if (!Array.isArray(initialData)) return 'na'
    const firstId = (initialData as any)[0]?.id ?? ''
    return `${initialData.length}:${firstId}`
  }, [initialData])

  useEffect(() => {
    if (!Array.isArray(initialData)) return
    if (initialData.length === 0) return // avoid loops from inline [] literals
    setData(initialData)
  }, [initialSig])

  const filteredData = useMemo(() => data, [data])

  const totalPages = Math.max(1, Math.ceil(filteredData.length / itemsPerPage))

  const currentData = useMemo(() => {
    const start = (currentPage - 1) * itemsPerPage
    const end = start + itemsPerPage
    return filteredData.slice(start, end)
  }, [filteredData, currentPage, itemsPerPage])

  const handlePageChange = (page: number) => setCurrentPage(page)
  const handleItemsPerPageChange = (n: number) => setItemsPerPage(n)

  return {
    data,
    loading,
    error,
    filteredData,
    totalPages,
    currentData,
    setData,
    currentPage,
    setCurrentPage,
    itemsPerPage,
    setItemsPerPage,
    handlePageChange,
    handleItemsPerPageChange
  }
}


