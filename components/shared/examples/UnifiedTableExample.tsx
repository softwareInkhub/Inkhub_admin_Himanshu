'use client'

import React from 'react'
import { PageTemplate, useDataTable } from '../index'

// Example data type
interface ExampleItem {
  id: string
  name: string
  status: string
  price: number
  category: string
  createdAt: string
  updatedAt: string
  tags: string[]
}

// Example data
const exampleData: ExampleItem[] = [
  {
    id: '1',
    name: 'Sample Product 1',
    status: 'active',
    price: 29.99,
    category: 'Electronics',
    createdAt: '2024-01-15',
    updatedAt: '2024-01-15',
    tags: ['new', 'featured']
  },
  {
    id: '2',
    name: 'Sample Product 2',
    status: 'inactive',
    price: 49.99,
    category: 'Clothing',
    createdAt: '2024-01-14',
    updatedAt: '2024-01-14',
    tags: ['sale', 'limited']
  },
  // Add more sample data as needed
]

// Example column definitions
const exampleColumns = [
  {
    key: 'id',
    label: 'ID',
    sortable: true,
    render: (item: ExampleItem) => <span className="font-mono text-sm">{item.id}</span>
  },
  {
    key: 'name',
    label: 'Name',
    sortable: true,
    render: (item: ExampleItem) => (
      <div className="font-medium text-gray-900">{item.name}</div>
    )
  },
  {
    key: 'status',
    label: 'Status',
    sortable: true,
    render: (item: ExampleItem) => (
      <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
        item.status === 'active' 
          ? 'bg-green-100 text-green-800' 
          : 'bg-red-100 text-red-800'
      }`}>
        {item.status}
      </span>
    )
  },
  {
    key: 'price',
    label: 'Price',
    sortable: true,
    render: (item: ExampleItem) => (
      <span className="font-medium">${item.price.toFixed(2)}</span>
    )
  },
  {
    key: 'category',
    label: 'Category',
    sortable: true,
    render: (item: ExampleItem) => (
      <span className="text-gray-600">{item.category}</span>
    )
  },
  {
    key: 'createdAt',
    label: 'Created',
    sortable: true,
    render: (item: ExampleItem) => (
      <span className="text-sm text-gray-500">
        {new Date(item.createdAt).toLocaleDateString()}
      </span>
    )
  },
  {
    key: 'tags',
    label: 'Tags',
    render: (item: ExampleItem) => (
      <div className="flex flex-wrap gap-1">
        {item.tags.map((tag: string, index: number) => (
          <span
            key={index}
            className="inline-flex px-2 py-1 text-xs bg-blue-100 text-blue-800 rounded"
          >
            {tag}
          </span>
        ))}
      </div>
    )
  }
]

// Example KPI cards configuration
const exampleKPICards = [
  {
    key: 'totalItems',
    label: 'Total Items',
    value: exampleData.length,
    change: 12.5,
    trend: 'up' as const,
    icon: '📦',
    color: 'blue'
  },
  {
    key: 'activeItems',
    label: 'Active Items',
    value: exampleData.filter(item => item.status === 'active').length,
    change: 8.2,
    trend: 'up' as const,
    icon: '✅',
    color: 'green'
  },
  {
    key: 'totalValue',
    label: 'Total Value',
    value: exampleData.reduce((sum, item) => sum + item.price, 0),
    change: 15.3,
    trend: 'up' as const,
    icon: '💰',
    color: 'purple'
  },
  {
    key: 'avgPrice',
    label: 'Average Price',
    value: exampleData.reduce((sum, item) => sum + item.price, 0) / exampleData.length,
    change: -2.1,
    trend: 'down' as const,
    icon: '📊',
    color: 'orange'
  }
]

// Example component usage
export default function UnifiedTableExample() {
  const {
    data,
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
    clearAdvancedFilters,
    setData
  } = useDataTable<ExampleItem>({
    initialData: exampleData,
    columns: exampleColumns,
    searchableFields: [
      { key: 'name', label: 'Name', type: 'text' },
      { key: 'category', label: 'Category', type: 'text' },
      { key: 'status', label: 'Status', type: 'text' },
      { key: 'tags', label: 'Tags', type: 'text' }
    ],
    filterOptions: [
      { key: 'all', label: 'All' },
      { key: 'active', label: 'Active' },
      { key: 'inactive', label: 'Inactive' },
      { key: 'electronics', label: 'Electronics' },
      { key: 'clothing', label: 'Clothing' }
    ],
    defaultViewMode: 'table',
    defaultItemsPerPage: 10
  })

  const pageConfig = {
    title: 'Example Table',
    description: 'This is an example of the unified table component',
    icon: '📊',
    endpoint: '/api/example',
    columns: exampleColumns,
    kpis: exampleKPICards,
    filters: [
      { key: 'status', label: 'Status', type: 'select' },
      { key: 'category', label: 'Category', type: 'select' },
      { key: 'price', label: 'Price Range', type: 'numberRange' }
    ],
    searchableFields: [
      { key: 'name', label: 'Name', type: 'text' },
      { key: 'category', label: 'Category', type: 'text' },
      { key: 'status', label: 'Status', type: 'text' }
    ],
    actions: {
      create: () => console.log('Create item'),
      export: () => console.log('Export items'),
      import: () => console.log('Import items'),
      print: () => console.log('Print items'),
      settings: () => console.log('Settings')
    }
  }

  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold mb-6">Unified Table Example</h1>
      
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
      />
    </div>
  )
}

// Example of how to configure for different data types
export const createPinsTableConfig = () => {
  const pinsColumns = [
    {
      key: 'id',
      label: 'Pin ID',
      sortable: true,
      render: (item: any) => <span className="font-mono text-sm">{item.id}</span>
    },
    {
      key: 'title',
      label: 'Title',
      sortable: true,
      render: (item: any) => (
        <div className="font-medium text-gray-900">{item.title}</div>
      )
    },
    {
      key: 'likes',
      label: 'Likes',
      sortable: true,
      render: (item: any) => (
        <span className="font-medium text-red-600">{item.likes}</span>
      )
    },
    {
      key: 'repins',
      label: 'Repins',
      sortable: true,
      render: (item: any) => (
        <span className="font-medium text-blue-600">{item.repins}</span>
      )
    },
    {
      key: 'board',
      label: 'Board',
      sortable: true,
      render: (item: any) => (
        <span className="text-gray-600">{item.board}</span>
      )
    }
  ]

  const pinsKPICards = [
    {
      key: 'totalPins',
      label: 'Total Pins',
      value: 0,
      change: 0,
      trend: 'neutral' as const,
      icon: '📌',
      color: 'red'
    },
    {
      key: 'totalLikes',
      label: 'Total Likes',
      value: 0,
      change: 0,
      trend: 'neutral' as const,
      icon: '❤️',
      color: 'pink'
    }
  ]

  return {
    columns: pinsColumns,
    kpiCards: pinsKPICards,
    itemTypeName: 'pins',
    defaultSortField: 'likes'
  }
}

export const createBoardsTableConfig = () => {
  const boardsColumns = [
    {
      key: 'id',
      label: 'Board ID',
      sortable: true,
      render: (item: any) => <span className="font-mono text-sm">{item.id}</span>
    },
    {
      key: 'name',
      label: 'Board Name',
      sortable: true,
      render: (item: any) => (
        <div className="font-medium text-gray-900">{item.name}</div>
      )
    },
    {
      key: 'pinCount',
      label: 'Pins',
      sortable: true,
      render: (item: any) => (
        <span className="font-medium">{item.pinCount}</span>
      )
    },
    {
      key: 'followers',
      label: 'Followers',
      sortable: true,
      render: (item: any) => (
        <span className="font-medium text-green-600">{item.followers}</span>
      )
    }
  ]

  const boardsKPICards = [
    {
      key: 'totalBoards',
      label: 'Total Boards',
      value: 0,
      change: 0,
      trend: 'neutral' as const,
      icon: '📋',
      color: 'blue'
    },
    {
      key: 'totalFollowers',
      label: 'Total Followers',
      value: 0,
      change: 0,
      trend: 'neutral' as const,
      icon: '👥',
      color: 'green'
    }
  ]

  return {
    columns: boardsColumns,
    kpiCards: boardsKPICards,
    itemTypeName: 'boards',
    defaultSortField: 'followers'
  }
}
