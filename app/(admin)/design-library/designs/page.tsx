'use client'

import { useEffect, useState, useRef } from 'react'
import { useAppStore } from '@/lib/store'
import {
  PageTemplate,
  useDataTable
} from '@/components/shared'
import DesignsGridCardFilterHeader from './components/DesignsGridCardFilterHeader'
import { Design } from './types'
import { generateDesigns } from './utils'

// Define table columns for designs
const designColumns = [
  {
    key: 'image',
    label: 'DESIGN',
    sortable: false,
    render: (design: Design) => (
      <div className="flex items-center space-x-3">
        <div className="w-12 h-12 rounded-md overflow-hidden bg-gray-100">
          {design.image ? (
            <img 
              src={design.image} 
              alt={design.name || 'Design'}
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
            {design?.name || 'Untitled Design'}
          </div>
          <div className="text-sm text-gray-500 truncate">
            Click to view details
          </div>
        </div>
      </div>
    )
  },
  {
    key: 'status',
    label: 'STATUS',
    sortable: true,
    render: (design: Design) => {
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
    render: (design: Design) => {
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
    render: (design: Design) => (
      <div className="text-sm text-gray-900">{design?.category || 'Uncategorized'}</div>
    )
  },
  {
    key: 'price',
    label: 'PRICE',
    sortable: true,
    render: (design: Design) => (
      <span className="text-sm font-medium text-gray-900">
        {design?.price === 0 ? 'Free' : `$${(design?.price || 0).toFixed(2)}`}
      </span>
    )
  },
  {
    key: 'size',
    label: 'SIZE',
    sortable: true,
    render: (design: Design) => (
      <span className="text-sm text-gray-900">{design?.size || 'N/A'}</span>
    )
  },
  {
    key: 'client',
    label: 'CLIENT',
    sortable: true,
    render: (design: Design) => (
      <span className="text-sm text-gray-900">{design?.client || 'N/A'}</span>
    )
  },
  {
    key: 'designer',
    label: 'DESIGNER',
    sortable: true,
    render: (design: Design) => (
      <span className="text-sm text-gray-900">{design?.designer || 'N/A'}</span>
    )
  },
  {
    key: 'views',
    label: 'VIEWS',
    sortable: true,
    render: (design: Design) => (
      <span className="text-sm text-gray-900">{(design?.views || 0).toLocaleString()}</span>
    )
  },
  {
    key: 'downloads',
    label: 'DOWNLOADS',
    sortable: true,
    render: (design: Design) => (
      <span className="text-sm text-gray-900">{(design?.downloads || 0).toLocaleString()}</span>
    )
  },
  {
    key: 'createdAt',
    label: 'CREATED',
    sortable: true,
    render: (design: Design) => (
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
    render: (design: Design) => (
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
    render: (design: Design) => (
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

function DesignLibraryPage() {
  const { addTab } = useAppStore()
  const hasAddedTab = useRef(false)

  // Initialize data table hook
  const {
    data: designData,
    loading,
    error,
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
  } = useDataTable<Design>({
    initialData: generateDesigns(50),
    columns: designColumns,
    searchableFields: [
      { key: 'title', label: 'Title', type: 'text' },
      { key: 'description', label: 'Description', type: 'text' },
      { key: 'category', label: 'Category', type: 'text' },
      { key: 'type', label: 'Type', type: 'text' },
      { key: 'status', label: 'Status', type: 'text' },
      { key: 'tags', label: 'Tags', type: 'text' }
    ],
    filterOptions: designFilters,
    defaultViewMode: 'grid',
    defaultItemsPerPage: 25
  })

  // Calculate KPI metrics based on filtered data
  const calculatedKPIs = designKPIs.map(kpi => {
    switch (kpi.key) {
      case 'totalDesigns':
        return { ...kpi, value: filteredData.length }
      case 'totalDownloads':
        return { ...kpi, value: filteredData.reduce((sum: number, design: Design) => sum + (design.downloads || 0), 0) }
      case 'avgRating':
        return { ...kpi, value: filteredData.length > 0 ? Math.round(filteredData.reduce((sum: number, design: Design) => sum + (design.views || 0), 0) / filteredData.length * 10) / 10 : 0 }
      case 'publishedDesigns':
        return { ...kpi, value: filteredData.filter((design: Design) => (design.status || 'unknown') === 'completed').length }
      case 'freeDesigns':
        return { ...kpi, value: filteredData.filter((design: Design) => design.price === 0).length }
      case 'activeCategories':
        const uniqueCategories = new Set(filteredData.map((design: Design) => design.category || 'Uncategorized'))
        return { ...kpi, value: uniqueCategories.size }
      default:
        return kpi
    }
  })

  // Tab management
  useEffect(() => {
    if (!hasAddedTab.current) {
      addTab({
        title: 'Design Library',
        path: '/design-library/designs',
        pinned: false,
        closable: true,
      })
      hasAddedTab.current = true
    }
  }, [addTab])

  // Page configuration
  const pageConfig = {
    title: 'Design Library',
    description: 'Manage and organize your design assets',
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
      settings: () => console.log('Design settings')
    }
  }

  if (loading && designData.length === 0) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-gray-500">Loading designs...</div>
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

  return (
    <PageTemplate
      config={pageConfig}
      data={currentData}
      loading={loading}
      error={error}
      GridHeaderComponent={DesignsGridCardFilterHeader}
      CardHeaderComponent={DesignsGridCardFilterHeader}
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

export default DesignLibraryPage
