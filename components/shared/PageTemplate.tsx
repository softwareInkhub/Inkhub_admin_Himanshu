'use client'

import React, { useState } from 'react'
import { LucideIcon, Package, ShoppingCart, Image, Palette, X } from 'lucide-react'
import { cn } from '@/lib/utils'
import { BaseEntity, ViewMode, TableColumn, KPIMetrics } from './types'
import { 
  PageHeader, 
  SearchControls, 
  DataTable, 
  DataGrid, 
  DataCard,
  KPIGrid,
  BulkActionsBar,
  Pagination,
  ExportModal,
  ImportModal,
  BulkEditModal,
  BulkDeleteModal
} from './index'
import ProductsGridCardFilterHeader from '@/app/(admin)/apps/shopify/products/components/GridCardFilterHeader'

// Reusable props contract for grid/card header components
interface GridHeaderComponentProps {
  selectedProducts: string[]
  currentProducts: any[]
  onSelectAll: () => void
  activeColumnFilter: string | null
  columnFilters: Record<string, any>
  onFilterClick: (column: string) => void
  onColumnFilterChange: (column: string, value: any) => void
  getUniqueValues: (field: string) => string[]
  cardsPerRow?: number
  onCardsPerRowChange?: (value: number) => void
}

interface PageConfig {
  title: string
  description: string
  icon: string
  endpoint: string
  columns: any[]
  kpis: any[]
  filters: any[]
  searchableFields: any[]
  actions: {
    create: () => void
    export: () => void
    import: () => void
    print: () => void
    settings: () => void
  }
}

interface PageTemplateProps<T extends BaseEntity> {
  config: PageConfig
  data: T[]
  loading?: boolean
  error?: string | null
  // Optional custom headers for grid and card views
  GridHeaderComponent?: React.ComponentType<GridHeaderComponentProps>
  CardHeaderComponent?: React.ComponentType<GridHeaderComponentProps>
  searchQuery?: string
  setSearchQuery?: (query: string) => void
  searchConditions?: any[]
  setSearchConditions?: (conditions: any[]) => void
  selectedItems?: string[]
  setSelectedItems?: (items: string[]) => void
  viewMode?: ViewMode
  setViewMode?: (mode: ViewMode) => void
  currentPage?: number
  setCurrentPage?: (page: number) => void
  itemsPerPage?: number
  setItemsPerPage?: (items: number) => void
  sortColumn?: string | null
  setSortColumn?: (column: string | null) => void
  sortDirection?: 'asc' | 'desc'
  setSortDirection?: (direction: 'asc' | 'desc') => void
  columnFilters?: Record<string, any>
  setColumnFilters?: (filters: Record<string, any>) => void
  customFilters?: any[]
  setCustomFilters?: (filters: any[]) => void
  advancedFilters?: any
  setAdvancedFilters?: (filters: any) => void
  totalPages?: number
  handleSelectItem?: (id: string, selected: boolean) => void
  handleSelectAll?: () => void
  handlePageChange?: (page: number) => void
  handleItemsPerPageChange?: (items: number) => void
  handleSort?: (column: string) => void
  handleSearch?: (query: string) => void
  handleAdvancedSearch?: () => void
  handleColumnFilter?: (column: string, value: any) => void
  handleCustomFilter?: (filter: any) => void
  handleAdvancedFilter?: (filters: any) => void
  clearAllFilters?: () => void
  clearSearch?: () => void
  clearColumnFilters?: () => void
  clearCustomFilters?: () => void
  clearAdvancedFilters?: () => void
}

// Icon mapping function
const getIconComponent = (iconName: string): LucideIcon => {
  switch (iconName.toLowerCase()) {
    case 'package':
    case 'products':
      return Package
    case 'shopping-cart':
    case 'orders':
      return ShoppingCart
    case 'image':
    case 'pins':
    case 'boards':
      return Image
    case 'palette':
    case 'designs':
      return Palette
    default:
      return Package
  }
}

export default function PageTemplate<T extends BaseEntity>({
  config,
  data,
  loading = false,
  error = null,
  GridHeaderComponent,
  CardHeaderComponent,
  searchQuery = '',
  setSearchQuery = () => {},
  searchConditions = [],
  setSearchConditions = () => {},
  selectedItems = [],
  setSelectedItems = () => {},
  viewMode = 'table',
  setViewMode = () => {},
  currentPage = 1,
  setCurrentPage = () => {},
  itemsPerPage = 25,
  setItemsPerPage = () => {},
  sortColumn = null,
  setSortColumn = () => {},
  sortDirection = 'desc',
  setSortDirection = () => {},
  columnFilters: _unusedColumnFilters = {},
  setColumnFilters: _unusedSetColumnFilters = () => {},
  customFilters = [],
  setCustomFilters = () => {},
  advancedFilters = {},
  setAdvancedFilters = () => {},
  totalPages = 1,
  handleSelectItem = () => {},
  handleSelectAll = () => {},
  handlePageChange = () => {},
  handleItemsPerPageChange = () => {},
  handleSort = () => {},
  handleSearch = () => {},
  handleAdvancedSearch = () => {},
  handleColumnFilter = () => {},
  handleCustomFilter = () => {},
  handleAdvancedFilter = () => {},
  clearAllFilters = () => {},
  clearSearch = () => {},
  clearColumnFilters = () => {},
  clearCustomFilters = () => {},
  clearAdvancedFilters = () => {}
}: PageTemplateProps<T>) {
  // Modal states
  const [showExportModal, setShowExportModal] = useState(false)
  const [showImportModal, setShowImportModal] = useState(false)
  const [showPrintModal, setShowPrintModal] = useState(false)
  const [showSettingsModal, setShowSettingsModal] = useState(false)
  const [showBulkEditModal, setShowBulkEditModal] = useState(false)
  const [showBulkDeleteModal, setShowBulkDeleteModal] = useState(false)

  // Get the icon component
  const IconComponent = getIconComponent(config.icon)
  const [hoveredItemId, setHoveredItemId] = useState<string | null>(null)
  // Cards-per-row controls for grid and card views
  const [gridCardsPerRow, setGridCardsPerRow] = useState<number>(4)
  const [cardCardsPerRow, setCardCardsPerRow] = useState<number>(6)
  // Advanced filter visibility
  const [showAdvancedFilter, setShowAdvancedFilter] = useState<boolean>(false)
  // Header dropdown state
  const [showHeaderDropdown, setShowHeaderDropdown] = useState<boolean>(false)

  // Column filter state (shared across views)
  const [activeColumnFilter, setActiveColumnFilter] = useState<string | null>(null)
  const [localColumnFilters, setLocalColumnFilters] = useState<Record<string, any>>({})

  const onFilterClickHeader = (column: string) => {
    setActiveColumnFilter(prev => (prev === column ? null : column))
  }

  const onColumnFilterChangeHeader = (column: string, value: any) => {
    setLocalColumnFilters(prev => ({ ...prev, [column]: value }))
  }

  const getUniqueValues = (field: string): string[] => {
    const values = (data as any[]).map((item) => item?.[field]).filter(Boolean)
    const flat = ([] as any[]).concat(...values.map(v => Array.isArray(v) ? v : [v]))
    return Array.from(new Set(flat.map(v => String(v))))
  }

  const applyColumnFilters = (items: T[]): T[] => {
    const filters = localColumnFilters
    const entries = Object.entries(filters).filter(([key, v]) => {
      if (['minPrice', 'maxPrice', 'startDate', 'endDate', 'entity'].includes(key)) return false
      if (Array.isArray(v)) return v.length > 0
      return v !== '' && v !== undefined && v !== null
    })

    // Fast path when nothing to filter
    const hasSpecial = Boolean(filters.minPrice || filters.maxPrice || filters.startDate || filters.endDate || (Array.isArray(filters.entity) && filters.entity.length > 0))
    if (!hasSpecial && entries.length === 0) return items

    const matches = (item: any, key: string, value: any) => {
      const raw = item?.[key]
      if (raw == null) return false
      if (Array.isArray(value)) {
        if (Array.isArray(raw)) {
          return raw.some((r: any) => value.includes(String(r)))
        }
        return value.includes(String(raw))
      }
      const str = String(value).trim()
      const numMatch = str.match(/^[<>~=]\s?\d+(\.\d+)?$/)
      if (numMatch && typeof raw === 'number') {
        const op = str[0]
        const num = parseFloat(str.slice(1))
        if (op === '>') return raw > num
        if (op === '<') return raw < num
        if (op === '=') return raw === num
      }
      if (/^\d{4}-\d{2}-\d{2}$/.test(str)) {
        const d1 = new Date(raw).toISOString().slice(0, 10)
        return d1 === str
      }
      return String(raw).toLowerCase().includes(str.toLowerCase())
    }

    return (items as any[]).filter((item) => {
      // Apply generic filters
      const genericPass = entries.every(([k, v]) => matches(item, k, v))
      if (!genericPass) return false

      // Special: price range (if price exists on item)
      if ((filters.minPrice || filters.maxPrice) && typeof item.price === 'number') {
        const min = filters.minPrice ? parseFloat(String(filters.minPrice)) : -Infinity
        const max = filters.maxPrice ? parseFloat(String(filters.maxPrice)) : Infinity
        if (!(item.price >= min && item.price <= max)) return false
      }

      // Special: date range on createdAt if present
      if (filters.startDate || filters.endDate) {
        const created = item.createdAt ? new Date(item.createdAt).getTime() : null
        if (created != null) {
          const start = filters.startDate ? new Date(String(filters.startDate)).getTime() : -Infinity
          const end = filters.endDate ? new Date(String(filters.endDate)).getTime() : Infinity
          if (!(created >= start && created <= end)) return false
        }
      }

      // Special: entity list (matches vendor/owner/client/designer)
      if (Array.isArray(filters.entity) && filters.entity.length > 0) {
        const entities = [item.vendor, item.owner, item.client, item.designer].filter(Boolean).map(String)
        const anyMatch = entities.some((e) => filters.entity.includes(e))
        if (!anyMatch) return false
      }

      return true
    })
  }

  // Helper to mirror Products page responsive grid behavior
  const getGridClasses = (cardsPerRow: number) => {
    const baseClasses = "grid gap-4 p-6"
    const getCols = (cols: number) => (cols <= 6 ? `grid-cols-${cols}` : `grid-cols-6`)
    const mdCols = Math.min(cardsPerRow, 4)
    const lgCols = Math.min(cardsPerRow, 5)
    const xlCols = cardsPerRow
    const responsive = `grid-cols-2 sm:grid-cols-3 md:${getCols(mdCols)} lg:${getCols(lgCols)} xl:${getCols(xlCols)}`
    const customStyle = cardsPerRow > 6 ? { gridTemplateColumns: `repeat(${cardsPerRow}, minmax(0, 1fr))` } : {}
    return { className: `${baseClasses} ${responsive}`, style: customStyle as React.CSSProperties }
  }

  if (loading && data.length === 0) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-gray-500">Loading...</div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="text-red-600 text-lg font-semibold mb-2">Error</div>
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

  const filteredData = applyColumnFilters(data)

  const [isFullScreen, setIsFullScreen] = useState<boolean>(false)

  return (
    <div className={cn(
      "min-h-screen bg-gray-50",
      isFullScreen ? "fixed inset-0 z-50 bg-white flex flex-col" : ""
    )}>
      {isFullScreen && (
        <div className="sticky top-0 z-20 bg-white border-b border-gray-200 p-4 flex justify-between items-center">
          <h2 className="text-lg font-semibold text-gray-900">{config.title} - Full Screen View</h2>
          <button
            onClick={() => setIsFullScreen(false)}
            className="p-2 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-md transition-colors"
            title="Exit Full Screen"
          >
            <X className="h-5 w-5" />
          </button>
        </div>
      )}
      {/* KPI Grid */}
      <div className="px-4 py-3">
        <KPIGrid 
          kpiMetrics={config.kpis.reduce((acc, kpi) => {
            acc[kpi.key] = kpi
            return acc
          }, {} as KPIMetrics)} 
          data={data} 
          compact
        />
      </div>

      {/* Search Controls */}
      <div className={cn("px-4 pb-2", isFullScreen ? "sticky top-0 z-40 bg-white border-b border-gray-200" : "") }>
        <SearchControls
          searchQuery={searchQuery}
          setSearchQuery={setSearchQuery}
          searchConditions={searchConditions}
          showSearchBuilder={false}
          setShowSearchBuilder={() => {}}
          showAdditionalControls={false}
          setShowAdditionalControls={() => {}}
          activeFilter="all"
          setActiveFilter={() => {}}
          customFilters={customFilters}
          onAddCustomFilter={handleCustomFilter}
          onRemoveCustomFilter={() => {}}
          showCustomFilterDropdown={false}
          setShowCustomFilterDropdown={() => {}}
          hiddenDefaultFilters={new Set()}
          onShowAllFilters={() => {}}
          onClearSearch={clearSearch}
          onClearSearchConditions={() => {}}
          selectedItems={selectedItems}
          onBulkEdit={() => setShowBulkEditModal(true)}
          onExportSelected={() => setShowExportModal(true)}
          onBulkDelete={() => setShowBulkDeleteModal(true)}
          currentItems={filteredData}
          onSelectAll={handleSelectAll}
          activeColumnFilter={activeColumnFilter}
          columnFilters={localColumnFilters}
          onFilterClick={onFilterClickHeader}
          onColumnFilterChange={onColumnFilterChangeHeader}
          getUniqueValues={getUniqueValues}
          onExport={() => setShowExportModal(true)}
          onImport={() => setShowImportModal(true)}
          onPrint={() => setShowPrintModal(true)}
          onSettings={() => setShowSettingsModal(true)}
          showHeaderDropdown={showHeaderDropdown}
          setShowHeaderDropdown={setShowHeaderDropdown}
          viewMode={viewMode}
          setViewMode={setViewMode}
          showAdvancedFilter={showAdvancedFilter}
          setShowAdvancedFilter={setShowAdvancedFilter}
          isFullScreen={isFullScreen}
          onToggleFullScreen={() => setIsFullScreen(!isFullScreen)}
          isAlgoliaSearching={false}
          useAlgoliaSearch={false}
        />
      </div>

      {/* Bulk Actions Bar */}
      {selectedItems.length > 0 && (
        <BulkActionsBar
          selectedItems={selectedItems}
          totalItems={data.length}
          onBulkEdit={() => setShowBulkEditModal(true)}
          onExportSelected={() => setShowExportModal(true)}
          onBulkDelete={() => setShowBulkDeleteModal(true)}
          onClearSelection={() => setSelectedItems([])}
        />
      )}

      {/* Main Content */}
      <div className={cn(
        isFullScreen ? "flex-1 overflow-hidden flex flex-col px-4 pb-4" : "px-4 pb-4"
      )}>
        {viewMode === 'table' && (
          <>
            <div className={cn(isFullScreen ? "flex-1 overflow-auto" : "") }>
          <DataTable
                data={filteredData}
            columns={config.columns}
            selectedItems={selectedItems}
            onSelectItem={(id: string) => handleSelectItem(id, !selectedItems.includes(id))}
            onSelectAll={handleSelectAll}
            searchQuery={searchQuery}
                columnFilters={localColumnFilters}
                activeColumnFilter={activeColumnFilter}
                onFilterClick={onFilterClickHeader}
                onColumnFilterChange={onColumnFilterChangeHeader}
              />
            </div>
            <div className={cn("border-t border-gray-200", isFullScreen ? "sticky bottom-0 bg-white z-10" : "") }>
              <Pagination
                currentPage={currentPage}
                totalPages={totalPages}
                itemsPerPage={itemsPerPage}
                totalItems={data.length}
                onPageChange={handlePageChange}
                onItemsPerPageChange={handleItemsPerPageChange}
              />
            </div>
          </>
        )}

        {viewMode === 'grid' && (
          <>
          {(() => {
            const HeaderComp = GridHeaderComponent || ProductsGridCardFilterHeader
            return (
              <div className={cn(isFullScreen ? "sticky top-0 z-10 bg-white border-b border-gray-200" : "") }>
                <HeaderComp
                  selectedProducts={selectedItems}
                  currentProducts={filteredData}
                  onSelectAll={handleSelectAll}
                  activeColumnFilter={activeColumnFilter}
                  columnFilters={localColumnFilters}
                  onFilterClick={onFilterClickHeader}
                  onColumnFilterChange={onColumnFilterChangeHeader}
                  getUniqueValues={getUniqueValues}
                  cardsPerRow={gridCardsPerRow}
                  onCardsPerRowChange={(v: number) => setGridCardsPerRow(v)}
                />
              </div>
            )
          })()}
          <div className={cn(getGridClasses(gridCardsPerRow).className, isFullScreen ? "flex-1 overflow-auto" : "")} style={getGridClasses(gridCardsPerRow).style}>
            {filteredData.map((item: T) => (
              <div
                key={item.id}
                className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow cursor-pointer"
                onClick={() => handleSelectItem(item.id, !selectedItems.includes(item.id))}
              >
                <div className="flex items-center space-x-3 mb-3">
                  <input
                    type="checkbox"
                    checked={selectedItems.includes(item.id)}
                    onChange={() => handleSelectItem(item.id, !selectedItems.includes(item.id))}
                    className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                    onClick={(e) => e.stopPropagation()}
                  />
                  {/* Image display */}
                  {(item as any).image && (
                    <div className="w-12 h-12 rounded-md overflow-hidden bg-gray-100 flex-shrink-0">
                      <img 
                        src={(item as any).image} 
                        alt={(item as any).title || (item as any).name || 'Item'}
                        className="w-full h-full object-cover"
                      />
                    </div>
                  )}
                </div>
                
                <h3 className="font-medium text-gray-900 mb-1 line-clamp-2">
                  {(item as any).title || (item as any).name || 'Untitled'}
                </h3>
                
                {(item as any).description && (
                  <p className="text-sm text-gray-500 mb-2 line-clamp-2">{(item as any).description}</p>
                )}
                
                <div className="flex items-center justify-between mb-2">
                  {(item as any).price && (
                    <span className="text-lg font-semibold text-gray-900">₹{(item as any).price}</span>
                  )}
                  {(item as any).status && (
                    <span className="px-2 py-1 bg-gray-100 text-gray-800 text-xs rounded-full">
                      {(item as any).status}
                    </span>
                  )}
                </div>
                
                <div className="flex items-center justify-between text-sm text-gray-500">
                  {(item as any).inventoryQuantity && (
                    <span>Stock: {(item as any).inventoryQuantity}</span>
                  )}
                  {(item as any).type && (
                    <span>{(item as any).type}</span>
                  )}
                </div>
              </div>
            ))}
          </div>
          <div className={cn("border-t border-gray-200", isFullScreen ? "sticky bottom-0 bg-white z-10" : "") }>
            <Pagination
              currentPage={currentPage}
              totalPages={totalPages}
              itemsPerPage={itemsPerPage}
              totalItems={data.length}
              onPageChange={handlePageChange}
              onItemsPerPageChange={handleItemsPerPageChange}
            />
          </div>
          </>
        )}

        {viewMode === 'card' && (
          <>
          {(() => {
            const HeaderComp = CardHeaderComponent || GridHeaderComponent || ProductsGridCardFilterHeader
            return (
              <div className={cn(isFullScreen ? "sticky top-0 z-10 bg-white border-b border-gray-200" : "") }>
                <HeaderComp
                  selectedProducts={selectedItems}
                  currentProducts={filteredData}
                  onSelectAll={handleSelectAll}
                  activeColumnFilter={activeColumnFilter}
                  columnFilters={localColumnFilters}
                  onFilterClick={onFilterClickHeader}
                  onColumnFilterChange={onColumnFilterChangeHeader}
                  getUniqueValues={getUniqueValues}
                  cardsPerRow={cardCardsPerRow}
                  onCardsPerRowChange={(v: number) => setCardCardsPerRow(v)}
                />
              </div>
            )
          })()}
          <div className={cn(getGridClasses(cardCardsPerRow).className, isFullScreen ? "flex-1 overflow-auto" : "")} style={getGridClasses(cardCardsPerRow).style}>
            {filteredData.map((item: T) => {
              const anyItem: any = item as any
              const title = anyItem.title || anyItem.name || 'Untitled'
              const subtitle = anyItem.vendor || anyItem.board || anyItem.owner || anyItem.client || anyItem.designer || ''
              const leftInfo =
                anyItem.inventoryQuantity != null ? `Stock: ${anyItem.inventoryQuantity}` :
                anyItem.pinCount != null ? `Pins: ${anyItem.pinCount}` :
                anyItem.views != null ? `Views: ${anyItem.views}` : ''
              const rightInfo = anyItem.type || anyItem.category || ''
              return (
                <div
                  key={item.id}
                  className="relative group cursor-pointer transition-all duration-200 hover:scale-105 hover:shadow-lg border border-gray-300 rounded-lg"
                  onClick={() => handleSelectItem(item.id, !selectedItems.includes(item.id))}
                  onMouseEnter={() => setHoveredItemId(item.id)}
                  onMouseLeave={() => setHoveredItemId(null)}
                >
                  {/* Checkbox overlay */}
                  <div className="absolute top-2 left-2 z-10">
                    <input
                      type="checkbox"
                      checked={selectedItems.includes(item.id)}
                      onChange={() => handleSelectItem(item.id, !selectedItems.includes(item.id))}
                      className="rounded border-gray-300 text-blue-600 focus:ring-blue-500 bg-white/80 backdrop-blur-sm"
                      onClick={(e) => e.stopPropagation()}
                    />
                  </div>

                  {/* Image */}
                  <div className="relative aspect-square rounded-lg overflow-hidden bg-gray-100">
                    {anyItem.image ? (
                      <img 
                        src={anyItem.image} 
                        alt={title}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center bg-gray-200">
                        <svg className="w-12 h-12 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                        </svg>
                      </div>
                    )}

                    {/* Hover overlay with info */}
                    <div className={cn(
                      "absolute inset-0 bg-black/60 text-white p-3 flex flex-col justify-end transition-opacity duration-200",
                      hoveredItemId === item.id ? "opacity-100" : "opacity-0"
                    )}>
                      <div className="space-y-1">
                        <h3 className="text-sm font-medium line-clamp-2">{title}</h3>
                        {subtitle && <p className="text-xs text-gray-300">{subtitle}</p>}
                        <div className="flex items-center justify-between">
                          {anyItem.price != null && (
                            <span className="text-sm font-semibold">₹{anyItem.price}</span>
                          )}
                          {anyItem.status && (
                            <span className="text-xs px-1.5 py-0.5 rounded-full bg-gray-500/20 text-gray-200">
                              {String(anyItem.status)}
                            </span>
                          )}
                        </div>
                        {(leftInfo || rightInfo) && (
                          <div className="flex items-center justify-between text-xs text-gray-300">
                            <span>{leftInfo}</span>
                            <span>{rightInfo}</span>
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Status indicator dot */}
                    {anyItem.status && (
                      <div className={cn(
                        "absolute top-2 right-2 w-3 h-3 rounded-full border-2 border-white",
                        String(anyItem.status).toLowerCase().includes('active') || String(anyItem.status).toLowerCase().includes('completed') || String(anyItem.status).toLowerCase().includes('approved')
                          ? "bg-green-500" :
                        String(anyItem.status).toLowerCase().includes('draft') || String(anyItem.status).toLowerCase().includes('in_progress')
                          ? "bg-blue-500" :
                        String(anyItem.status).toLowerCase().includes('archived') || String(anyItem.status).toLowerCase().includes('rejected')
                          ? "bg-gray-500" : "bg-gray-400"
                      )} />
        )}
      </div>

                  {/* No sticky footer: below-image info fully removed */}
                </div>
              )
            })}
          </div>
          <div className={cn("border-t border-gray-200", isFullScreen ? "sticky bottom-0 bg-white z-10" : "") }>
        <Pagination
          currentPage={currentPage}
          totalPages={totalPages}
          itemsPerPage={itemsPerPage}
          totalItems={data.length}
          onPageChange={handlePageChange}
          onItemsPerPageChange={handleItemsPerPageChange}
        />
      </div>
          </>
        )}
      </div>

      {/* Removed outer fallback pagination to avoid duplicates; pagination is rendered within each view */}

      {/* Modals */}
      {showExportModal && (
        <ExportModal
          isOpen={showExportModal}
          onClose={() => setShowExportModal(false)}
          data={data}
          selectedItems={selectedItems}
          onExport={(config: any) => {
            console.log('Export config:', config)
            setShowExportModal(false)
          }}
        />
      )}

      {showImportModal && (
        <ImportModal
          isOpen={showImportModal}
          onClose={() => setShowImportModal(false)}
          onImport={(file: File) => {
            console.log('Import file:', file)
            setShowImportModal(false)
          }}
        />
      )}

      {showPrintModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
          <div className="bg-white rounded-lg shadow-lg w-full max-w-xl mx-4">
            <div className="flex items-start justify-between p-4 border-b border-gray-200">
              <div>
                <h3 className="text-lg font-semibold text-gray-900">Print {config.title}</h3>
                <p className="text-sm text-gray-500">Configure your print settings</p>
              </div>
              <button onClick={() => setShowPrintModal(false)} className="text-gray-400 hover:text-gray-600 transition-colors">
                <X className="h-5 w-5" />
              </button>
            </div>
            <div className="p-4 space-y-4">
              <div>
                <div className="text-sm font-medium text-gray-700 mb-2">Print Options</div>
                <div className="space-y-2">
                  <label className="flex items-center space-x-2 text-sm text-gray-700">
                    <input type="radio" name="printScope" defaultChecked className="text-blue-600" />
                    <span>All {config.title.toLowerCase()}</span>
                  </label>
                  <label className="flex items-center space-x-2 text-sm text-gray-700">
                    <input type="radio" name="printScope" className="text-blue-600" />
                    <span>Selected ({selectedItems.length})</span>
                  </label>
                </div>
              </div>
              <div>
                <div className="text-sm font-medium text-gray-700 mb-2">Layout</div>
                <select className="w-full border border-gray-300 rounded-md p-2 text-sm">
                  <option>Table Layout - Compact list format</option>
                  <option>Grid Layout - Cards format</option>
                  <option>Card Layout - Image focused</option>
                </select>
              </div>
              <div>
                <div className="text-sm font-medium text-gray-700 mb-2">Content Options</div>
                <label className="flex items-center space-x-2 text-sm text-gray-700 mb-1">
                  <input type="checkbox" defaultChecked className="text-blue-600" />
                  <span>Include images</span>
                </label>
                <label className="flex items-center space-x-2 text-sm text-gray-700">
                  <input type="checkbox" defaultChecked className="text-blue-600" />
                  <span>Include detailed information</span>
                </label>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <div className="text-sm font-medium text-gray-700 mb-2">Page Size</div>
                  <select className="w-full border border-gray-300 rounded-md p-2 text-sm">
                    <option>A4</option>
                    <option>Letter</option>
                    <option>Legal</option>
                  </select>
                </div>
                <div>
                  <div className="text-sm font-medium text-gray-700 mb-2">Orientation</div>
                  <select className="w-full border border-gray-300 rounded-md p-2 text-sm">
                    <option>Portrait</option>
                    <option>Landscape</option>
                  </select>
                </div>
              </div>
              <div className="text-xs text-gray-500 border rounded-md p-2">
                {data.length} items will be printed
              </div>
            </div>
            <div className="p-4 border-t border-gray-200 flex justify-end space-x-2">
              <button onClick={() => setShowPrintModal(false)} className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 rounded-md hover:bg-gray-200">Cancel</button>
              <button onClick={() => { setShowPrintModal(false); window.print() }} className="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-md hover:bg-blue-700">Print</button>
            </div>
          </div>
        </div>
      )}

      {showSettingsModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
          <div className="bg-white rounded-lg shadow-lg w-full max-w-xl mx-4">
            <div className="flex items-start justify-between p-4 border-b border-gray-200">
              <div>
                <h3 className="text-lg font-semibold text-gray-900">{config.title} Settings</h3>
                <p className="text-sm text-gray-500">Customize display and export settings</p>
              </div>
              <button onClick={() => setShowSettingsModal(false)} className="text-gray-400 hover:text-gray-600 transition-colors">
                <X className="h-5 w-5" />
              </button>
            </div>
            <div className="p-4 space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <div className="text-sm font-medium text-gray-700 mb-2">Default View Mode</div>
                  <select className="w-full border border-gray-300 rounded-md p-2 text-sm" defaultValue={viewMode}>
                    <option value="table">Table</option>
                    <option value="grid">Grid</option>
                    <option value="card">Card</option>
                  </select>
                </div>
                <div>
                  <div className="text-sm font-medium text-gray-700 mb-2">Items per page</div>
                  <select className="w-full border border-gray-300 rounded-md p-2 text-sm" defaultValue={itemsPerPage}>
                    <option value={10}>10</option>
                    <option value={25}>25</option>
                    <option value={50}>50</option>
                    <option value={100}>100</option>
                  </select>
                </div>
              </div>
              <div>
                <div className="text-sm font-medium text-gray-700 mb-2">Filter Settings</div>
                <label className="flex items-center space-x-2 text-sm text-gray-700 mb-1">
                  <input type="checkbox" className="text-blue-600" />
                  <span>Show Advanced Filters</span>
                </label>
                <label className="flex items-center space-x-2 text-sm text-gray-700">
                  <input type="checkbox" className="text-blue-600" />
                  <span>Auto-save Filters</span>
                </label>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <div className="text-sm font-medium text-gray-700 mb-2">Default Export Format</div>
                  <select className="w-full border border-gray-300 rounded-md p-2 text-sm">
                    <option>CSV</option>
                    <option>JSON</option>
                    <option>PDF</option>
                  </select>
                </div>
                <div className="flex items-end">
                  <label className="flex items-center space-x-2 text-sm text-gray-700">
                    <input type="checkbox" className="text-blue-600" />
                    <span>Include Images in Exports</span>
                  </label>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3 text-xs text-gray-500 border rounded-md p-2">
                <div>Total Items: {data.length}</div>
                <div>Current View: {viewMode}</div>
              </div>
            </div>
            <div className="p-4 border-t border-gray-200 flex justify-end space-x-2">
              <button onClick={() => setShowSettingsModal(false)} className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 rounded-md hover:bg-gray-200">Cancel</button>
              <button onClick={() => setShowSettingsModal(false)} className="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-md hover:bg-blue-700">Save Changes</button>
            </div>
          </div>
        </div>
      )}

      {showBulkEditModal && (
        <BulkEditModal
          isOpen={showBulkEditModal}
          onClose={() => setShowBulkEditModal(false)}
          selectedItems={selectedItems}
          onBulkEdit={(updates: Record<string, any>) => {
            console.log('Bulk edit updates:', updates)
            setShowBulkEditModal(false)
          }}
        />
      )}

      {showBulkDeleteModal && (
        <BulkDeleteModal
          isOpen={showBulkDeleteModal}
          onClose={() => setShowBulkDeleteModal(false)}
          selectedItems={selectedItems}
          onBulkDelete={() => {
            console.log('Bulk delete confirmed')
            setShowBulkDeleteModal(false)
          }}
        />
      )}
    </div>
  )
}
