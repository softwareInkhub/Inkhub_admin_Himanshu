'use client'

import React, { useState, useMemo } from 'react'
import { TableItem, ColumnDef, KPICardConfig, AlgoliaConfig, ColumnCustomizationConfig, SavedViewsConfig, BulkActionConfig, CustomFilter } from './types/unified-table'
import { useUnifiedTable } from './hooks/useUnifiedTable'
import UnifiedDataTable from './UnifiedDataTable'
import UnifiedSearchControls from './UnifiedSearchControls'
import UnifiedKPIGrid from './UnifiedKPIGrid'
import UnifiedPagination from './UnifiedPagination'
import BulkActionsBar from './BulkActionsBar'
import ExportModal from './ExportModal'
import EnhancedDetailModal from './EnhancedDetailModal'

interface UnifiedTableProps<T extends TableItem> {
  // Data
  data: T[]
  columns: ColumnDef<T>[]
  loading?: boolean
  error?: string | null
  
  // Configuration
  itemTypeName?: string
  defaultSortField?: string
  defaultViewMode?: 'table' | 'grid' | 'card'
  defaultItemsPerPage?: number
  
  // Features
  showKPIGrid?: boolean
  kpiCards?: Record<string, KPICardConfig>
  enableSearch?: boolean
  enableAdvancedFilters?: boolean
  enableColumnFilters?: boolean
  enableSavedViews?: boolean
  enableSelection?: boolean
  enableBulkActions?: boolean
  enableExport?: boolean
  enableImport?: boolean
  enablePrint?: boolean
  enableColumnCustomization?: boolean
  enableAlgoliaSearch?: boolean
  
  // Advanced configurations
  algoliaConfig?: AlgoliaConfig<T>
  columnCustomization?: ColumnCustomizationConfig
  savedViews?: SavedViewsConfig
  bulkActions?: BulkActionConfig
  
  // Callbacks
  onDataChange?: (data: T[]) => void
  onSelectionChange?: (selectedIds: string[]) => void
  onSearch?: (query: string) => void
  onFilter?: (filters: Record<string, any>) => void
  onSort?: (sortState: { key: string | null; dir: 'asc' | 'desc' | null }) => void
  onPageChange?: (page: number) => void
  onItemsPerPageChange?: (itemsPerPage: number) => void
  onRowClick?: (item: T, event: React.MouseEvent) => void
  onRefresh?: () => void
  onExport?: () => void
  onImport?: () => void
  onPrint?: () => void
  onSettings?: () => void
  onBulkEdit?: (selectedIds: string[]) => void
  onBulkDelete?: (selectedIds: string[]) => void
  
  // Custom renderers
  renderCardView?: (item: T, index: number) => React.ReactNode
  renderGridView?: (items: T[]) => React.ReactNode
  
  // UI customization
  className?: string
  showHeader?: boolean
  showFooter?: boolean
  compact?: boolean
  
  // Modal configuration
  modalSize?: 'sm' | 'md' | 'lg' | 'xl' | '2xl' | '4xl' | 'full' // NEW: Control detail modal size
}

export default function UnifiedTable<T extends TableItem>({
  data = [],
  columns,
  loading = false,
  error = null,
  itemTypeName = 'items',
  defaultSortField = 'createdAt',
  defaultViewMode = 'table',
  defaultItemsPerPage = 25,
  showKPIGrid = true,
  kpiCards = {},
  enableSearch = true,
  enableAdvancedFilters = true,
  enableColumnFilters = true,
  enableSavedViews = true,
  enableSelection = true,
  enableBulkActions = true,
  enableExport = true,
  enableImport = true,
  enablePrint = true,
  enableColumnCustomization = true,
  enableAlgoliaSearch = false,
  algoliaConfig,
  columnCustomization,
  savedViews,
  bulkActions,
  onDataChange,
  onSelectionChange,
  onSearch,
  onFilter,
  onSort,
  onPageChange,
  onItemsPerPageChange,
  onRowClick,
  onRefresh,
  onExport,
  onImport,
  onPrint,
  onSettings,
  onBulkEdit,
  onBulkDelete,
  renderCardView,
  renderGridView,
  className,
  showHeader = true,
  showFooter = true,
  compact = true,
  modalSize = '4xl' // Default to large for backwards compatibility
}: UnifiedTableProps<T>) {
  
  // Modal states
  const [showExportModal, setShowExportModal] = useState(false)
  const [showImportModal, setShowImportModal] = useState(false)
  const [showPrintModal, setShowPrintModal] = useState(false)
  const [showSettingsModal, setShowSettingsModal] = useState(false)
  const [showBulkEditModal, setShowBulkEditModal] = useState(false)
  const [showBulkDeleteModal, setShowBulkDeleteModal] = useState(false)
  const [showDetailModal, setShowDetailModal] = useState(false)
  const [selectedItem, setSelectedItem] = useState<T | null>(null)
  
  // UI states
  const [showSearchBuilder, setShowSearchBuilder] = useState(false)
  const [showAdvancedFilter, setShowAdvancedFilter] = useState(false)
  const [showAdditionalControls, setShowAdditionalControls] = useState(false)
  const [showHeaderDropdown, setShowHeaderDropdown] = useState(false)
  const [activeFilter, setActiveFilter] = useState('')
  const [activeColumnFilter, setActiveColumnFilter] = useState<string | null>(null)
  const [hiddenDefaultFilters, setHiddenDefaultFilters] = useState<Set<string>>(new Set())
  
  // Use the unified table hook
  const {
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
    hasActiveFilters,
    totalItems
  } = useUnifiedTable({
    data,
    loading,
    error,
    itemTypeName,
    defaultSortField,
    defaultViewMode,
    defaultItemsPerPage,
    enableSearch,
    enableAdvancedFilters,
    enableColumnFilters,
    enableSavedViews,
    enableSelection,
    enableBulkActions,
    enableExport,
    enableImport,
    enablePrint,
    onDataChange,
    onSelectionChange,
    onSearch,
    onFilter,
    onSort,
    onPageChange,
    onItemsPerPageChange
  })
  
  // Handle row click
  const handleRowClick = (item: T, event: React.MouseEvent) => {
    if (onRowClick) {
      onRowClick(item, event)
    } else {
      setSelectedItem(item)
      setShowDetailModal(true)
    }
  }
  
  // Handle bulk actions
  const handleBulkEdit = () => {
    if (onBulkEdit) {
      onBulkEdit(selectedItems)
    } else {
      setShowBulkEditModal(true)
    }
  }
  
  const handleBulkDelete = () => {
    if (onBulkDelete) {
      onBulkDelete(selectedItems)
    } else {
      setShowBulkDeleteModal(true)
    }
  }
  
  const handleExportSelected = () => {
    setShowExportModal(true)
  }
  
  // Handle custom filter actions
  const handleCustomFilter = (filter: { name: string; field: string; operator: string; value: string }) => {
    const newFilter: CustomFilter = {
      id: `custom-${Date.now()}`,
      name: filter.name,
      field: filter.field,
      operator: filter.operator,
      values: [filter.value]
    }
    setCustomFilters([...customFilters, newFilter])
  }
  
  // Memoized scroll group ID for synchronization
  const scrollGroupId = useMemo(() => `unified-table-${itemTypeName}`, [itemTypeName])
  
  return (
    <div className={`flex flex-col h-full ${className || ''}`}>
      {/* KPI Grid */}
      {showKPIGrid && Object.keys(kpiCards).length > 0 && (
        <div className="mb-6">
          <UnifiedKPIGrid
            kpiCards={kpiCards}
            data={data}
            loading={loading}
            itemTypeName={itemTypeName}
            onRefresh={onRefresh}
          />
        </div>
      )}
      
      {/* Main Table Container */}
      <div className={`flex-1 flex flex-col ${isFullScreen ? 'fixed inset-0 z-[200] bg-white' : ''}`}>
        {/* Search Controls */}
        {enableSearch && (
          <UnifiedSearchControls
            searchQuery={searchQuery}
            setSearchQuery={setSearchQuery}
            searchConditions={searchConditions}
            showSearchBuilder={showSearchBuilder}
            setShowSearchBuilder={setShowSearchBuilder}
            showAdvancedFilter={showAdvancedFilter}
            setShowAdvancedFilter={setShowAdvancedFilter}
            viewMode={viewMode}
            setViewMode={setViewMode}
            showAdditionalControls={showAdditionalControls}
            setShowAdditionalControls={setShowAdditionalControls}
            activeFilter={activeFilter}
            setActiveFilter={setActiveFilter}
            customFilters={customFilters}
            onAddCustomFilter={handleCustomFilter}
            onRemoveCustomFilter={(filterId) => setCustomFilters(customFilters.filter(f => f.id !== filterId))}
            hiddenDefaultFilters={hiddenDefaultFilters}
            onShowAllFilters={() => setHiddenDefaultFilters(new Set())}
            onClearSearch={onClearSearch}
            onClearSearchConditions={() => setSearchConditions([])}
            selectedItems={selectedItems}
            onBulkEdit={handleBulkEdit}
            onExportSelected={handleExportSelected}
            onBulkDelete={handleBulkDelete}
            currentItems={currentData}
            onSelectAll={onSelectAll}
            activeColumnFilter={activeColumnFilter}
            columnFilters={columnFilters}
            onFilterClick={setActiveColumnFilter}
            onColumnFilterChange={onColumnFilterChange}
            getUniqueValues={getUniqueValues}
            onExport={() => setShowExportModal(true)}
            onImport={() => setShowImportModal(true)}
            onPrint={() => setShowPrintModal(true)}
            onSettings={() => setShowSettingsModal(true)}
            showHeaderDropdown={showHeaderDropdown}
            setShowHeaderDropdown={setShowHeaderDropdown}
            showMoreActions={enableBulkActions}
            showExport={enableExport}
            isFullScreen={isFullScreen}
            onToggleFullScreen={onToggleFullScreen}
            isAlgoliaSearching={false}
            useAlgoliaSearch={enableAlgoliaSearch}
            itemTypeName={itemTypeName}
            showViewToggle={true}
            showFullScreenToggle={true}
          />
        )}
        
        {/* Bulk Actions Bar */}
        {enableBulkActions && selectedItems.length > 0 && (
          <BulkActionsBar
            selectedItems={selectedItems}
            totalItems={currentData.length}
            onBulkEdit={handleBulkEdit}
            onBulkDelete={handleBulkDelete}
            onExportSelected={handleExportSelected}
            onClearSelection={() => {
              setSelectedItems([])
              onSelectionChange?.([])
            }}
          />
        )}
        
        {/* Table Content */}
        <div className="flex-1 overflow-hidden">
          {viewMode === 'table' ? (
            <UnifiedDataTable
              data={currentData}
              selectedItems={selectedItems}
              onSelectItem={onSelectItem}
              onSelectAll={onSelectAll}
              onRowClick={handleRowClick}
              columns={columns}
              loading={loading}
              error={error}
              searchQuery={searchQuery}
              isFullScreen={isFullScreen}
              activeColumnFilter={activeColumnFilter}
              columnFilters={columnFilters}
              onFilterClick={setActiveColumnFilter}
              onColumnFilterChange={onColumnFilterChange}
              getUniqueValues={getUniqueValues}
              onClearSearch={onClearSearch}
              isSearching={false}
              sortState={sortState}
              onRequestSort={onRequestSort}
              compact={compact}
              showActions={true}
              columnWidths={{}}
              headerOnly={false}
              renderHeader={true}
              scrollGroupId={scrollGroupId}
              defaultSortField={defaultSortField}
              itemTypeName={itemTypeName}
            />
          ) : viewMode === 'grid' ? (
            renderGridView ? (
              renderGridView(currentData)
            ) : (
              <div className="p-4 text-center text-gray-500">
                Grid view not implemented for {itemTypeName}
              </div>
            )
          ) : viewMode === 'card' ? (
            <div className="p-4">
              {renderCardView ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                  {currentData.map((item, index) => (
                    <div key={item.id}>
                      {renderCardView(item, index)}
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center text-gray-500">
                  Card view not implemented for {itemTypeName}
                </div>
              )}
            </div>
          ) : null}
        </div>
        
        {/* Pagination */}
        {showFooter && (
          <UnifiedPagination
            currentPage={pagination.currentPage}
            totalPages={pagination.totalPages}
            itemsPerPage={pagination.itemsPerPage}
            totalItems={pagination.totalItems}
            onPageChange={handlePageChange}
            onItemsPerPageChange={handleItemsPerPageChange}
            itemTypeName={itemTypeName}
            showItemsPerPage={true}
            scrollGroupId={scrollGroupId}
          />
        )}
      </div>
      
      {/* Modals */}
      {showExportModal && (
        <ExportModal
          isOpen={showExportModal}
          onClose={() => setShowExportModal(false)}
          data={selectedItems.length > 0 ? currentData.filter(item => selectedItems.includes(item.id)) : currentData}
          selectedItems={selectedItems}
          onExport={(config) => {
            console.log('Export config:', config)
            setShowExportModal(false)
          }}
          title={`Export ${itemTypeName}`}
        />
      )}
      
      {showDetailModal && selectedItem && (
        <EnhancedDetailModal
          isOpen={showDetailModal}
          onClose={() => {
            setShowDetailModal(false)
            setSelectedItem(null)
          }}
          item={selectedItem}
          itemType={itemTypeName === 'Design' ? 'design' : itemTypeName === 'Product' ? 'product' : itemTypeName === 'Order' ? 'order' : itemTypeName === 'Pin' ? 'pin' : itemTypeName === 'Board' ? 'board' : itemTypeName === 'Content' ? 'content' : 'design'}
          size={modalSize}
          onEdit={async (id: string, data: any) => {
            console.log('Edit item:', id, data)
            // Implement edit logic
          }}
          onDelete={async (id: string) => {
            console.log('Delete item:', id)
            // Implement delete logic
          }}
          onSave={async (id: string, data: any) => {
            console.log('Save item:', id, data)
            // Implement save logic
          }}
        />
      )}
      
      {/* Additional modals can be added here */}
    </div>
  )
}