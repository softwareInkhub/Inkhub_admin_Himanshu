/**
 * EXAMPLE: How to update Products Page to use Enhanced Store
 * 
 * This file shows the key changes needed in app/(admin)/apps/shopify/products/page.tsx
 * 
 * NOTE: This is a REFERENCE/DOCUMENTATION file showing code patterns.
 * Some variables are placeholders. Use this as a guide, not as runnable code.
 */

'use client'

import { useProductsPageStore, useUrlSync, useScrollPersistence } from '@/lib/stores/products-page-store'
import { shallow } from 'zustand/shallow'

function ProductsClientContent() {
  // Mock variables for example purposes (these would come from your actual component)
  const paginatedData: any[] = [] // Your actual product data
  const totalProducts = 0          // Your actual total count
  const exportProducts = (ids: string[]) => {} // Your export function
  const setCurrentPage = (n: number) => {}     // Local state setter (if you have one)
  
  // OLD function mocks (for comparison - DO NOT USE THESE)
  const setSelectedRowIds = (ids: string[]) => {} // OLD API
  const setColumnFilters = (filters: any) => {}   // OLD API  
  const setSorting = (sorting: any) => {}          // OLD API
  // ============================================================================
  // STEP 1: Enable automatic URL and scroll sync
  // ============================================================================
  useUrlSync()           // Auto-syncs pageIndex, pageSize, globalFilter with URL
  useScrollPersistence() // Auto-saves/restores scroll position

  // ============================================================================
  // STEP 2: Subscribe to state (fine-grained for performance)
  // ============================================================================
  
  // Single values (automatically optimized)
  const pageIndex = useProductsPageStore(state => state.pageIndex)
  const pageSize = useProductsPageStore(state => state.pageSize)
  const globalFilter = useProductsPageStore(state => state.globalFilter)
  const hasActiveFilters = useProductsPageStore(state => state.hasActiveFilters)
  
  // IMPORTANT: selectedRowIds is now a Set<string>, not string[]
  const selectedRowIds = useProductsPageStore(state => state.selectedRowIds)
  
  // Multiple values with shallow comparison (prevents unnecessary re-renders)
  const { sorting, columnFilters } = useProductsPageStore(
    state => ({ 
      sorting: state.sorting, 
      columnFilters: state.columnFilters 
    }),
    shallow
  )

  // ============================================================================
  // STEP 3: Get actions (these NEVER cause re-renders)
  // ============================================================================
  
  const setPageIndex = useProductsPageStore(state => state.setPageIndex)
  const setPageSize = useProductsPageStore(state => state.setPageSize)
  const goToPage = useProductsPageStore(state => state.goToPage)
  const nextPage = useProductsPageStore(state => state.nextPage)
  const prevPage = useProductsPageStore(state => state.prevPage)
  
  const setGlobalFilter = useProductsPageStore(state => state.setGlobalFilter)
  const clearGlobalFilter = useProductsPageStore(state => state.clearGlobalFilter)
  
  const toggleSort = useProductsPageStore(state => state.toggleSort)
  const clearSorting = useProductsPageStore(state => state.clearSorting)
  
  const setColumnFilter = useProductsPageStore(state => state.setColumnFilter)
  const removeColumnFilter = useProductsPageStore(state => state.removeColumnFilter)
  const clearColumnFilters = useProductsPageStore(state => state.clearColumnFilters)
  const clearAllFilters = useProductsPageStore(state => state.clearAllFilters)
  
  const toggleRow = useProductsPageStore(state => state.toggleRow)
  const selectAll = useProductsPageStore(state => state.selectAll)
  const clearSelection = useProductsPageStore(state => state.clearSelection)
  
  // Saved Views actions
  const saveView = useProductsPageStore(state => state.saveView)
  const loadView = useProductsPageStore(state => state.loadView)
  const deleteView = useProductsPageStore(state => state.deleteView)
  const views = useProductsPageStore(state => state.views)

  // ============================================================================
  // STEP 4: Update handlers to use new actions
  // ============================================================================

  // ❌ OLD: Manual page change
  const handlePageChangeOld = (page: number) => {
    setCurrentPage(page)
    setPageIndex(page - 1) // Convert 1-based to 0-based
  }

  // ✅ NEW: Use helper action
  const handlePageChange = (page: number) => {
    goToPage(page) // Handles conversion automatically
  }

  // ❌ OLD: Manual product selection (Array-based - DO NOT USE)
  const handleSelectProductOld = (productId: string) => {
    // This example shows OLD Array-based approach (before Set migration)
    const oldSelectedIds: string[] = [] // Pretend this was the old array
    const newIds = oldSelectedIds.includes(productId) 
      ? oldSelectedIds.filter((id: string) => id !== productId)
      : [...oldSelectedIds, productId]
    setSelectedRowIds(newIds) // OLD API
  }

  // ✅ NEW: Single action
  const handleSelectProduct = (productId: string) => {
    toggleRow(productId)
  }

  // ❌ OLD: Manual column filter update (DO NOT USE)
  const handleColumnFilterChangeOld = (column: string, value: any) => {
    const currentFilters = useProductsPageStore.getState().columnFilters
    const newFilters = {
      ...currentFilters,
      [column]: value
    }
    setColumnFilters(newFilters) // OLD API - manually merging filters
  }

  // ✅ NEW: Single action
  const handleColumnFilterChange = (column: string, value: any) => {
    setColumnFilter(column, value)
  }

  // ❌ OLD: Manual sorting toggle
  const handleRequestSortOld = (key: string) => {
    const currentSort = sorting.find(s => s.id === key)
    if (currentSort) {
      if (currentSort.desc) {
        setSorting([])
      } else {
        setSorting([{ id: key, desc: true }])
      }
    } else {
      setSorting([{ id: key, desc: false }])
    }
  }

  // ✅ NEW: Single action
  const handleRequestSort = (key: string) => {
    toggleSort(key) // Handles all logic internally
  }

  // ❌ OLD: Manual select all (Array operations - DO NOT USE)
  const handleSelectAllOld = () => {
    // This shows OLD Array-based approach (before Set migration)
    const oldSelectedIds: string[] = [] // Pretend this was the old array
    if (oldSelectedIds.length === paginatedData.length) {
      setSelectedRowIds([])
    } else {
      setSelectedRowIds(paginatedData.map((p: any) => p.id))
    }
  }

  // ✅ NEW: Use selectAll/clearSelection (Set-based)
  const handleSelectAll = () => {
    if (selectedRowIds.size === paginatedData.length) {
      clearSelection()
    } else {
      selectAll(paginatedData.map((p: any) => p.id))
    }
  }

  // ============================================================================
  // STEP 5: Remove manual URL sync (now automatic)
  // ============================================================================

  // ❌ DELETE THESE (handled by useUrlSync hook):
  /*
  useEffect(() => {
    const p = searchParams.get("p")
    const sz = searchParams.get("sz")
    const s = searchParams.get("s")
    if (p) setPageIndex(Number(p))
    if (sz) setPageSize(Number(sz))
    if (s) setGlobalFilter(s)
  }, [])

  useEffect(() => {
    setParams({ p: pageIndex, sz: pageSize, s: globalFilter })
  }, [pageIndex, pageSize, globalFilter, setParams])
  */

  // ============================================================================
  // STEP 6: Remove manual scroll sync (now automatic)
  // ============================================================================

  // ❌ DELETE THESE (handled by useScrollPersistence hook):
  /*
  useEffect(() => {
    if (scrollY > 0) {
      window.scrollTo({ top: scrollY, behavior: "instant" as ScrollBehavior })
    }
  }, [scrollY])

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
  */

  // ============================================================================
  // STEP 7: Update iteration over selectedRowIds (Set → Array)
  // ============================================================================

  // Convert Set to Array when needed
  const selectedIdsArray = Array.from(selectedRowIds)

  return (
    <div>
      {/* Selection count */}
      <div>{selectedRowIds.size}/{totalProducts} selected</div>

      {/* Saved Views Dropdown */}
      <div>
        <button onClick={() => saveView('Current View')}>Save View</button>
        <select onChange={(e) => loadView(e.target.value)}>
          <option value="">Select a saved view...</option>
          {Object.values(views).map(view => (
            <option key={view.id} value={view.id}>
              {view.name} ({view.filters.globalFilter || 'No search'})
            </option>
          ))}
        </select>
      </div>

      {/* Export selected (convert Set to Array) */}
      <button onClick={() => exportProducts(selectedIdsArray)}>
        Export {selectedRowIds.size} Selected
      </button>
    </div>
  )
}

