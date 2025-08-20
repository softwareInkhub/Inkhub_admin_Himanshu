// Shared Types for the INKHUB Admin Panel
// These types are used across all pages and components

// Base Entity Interface
export interface BaseEntity {
  id: string
  createdAt: string
  updatedAt: string
  selected?: boolean
}

// Search and Filter Types
export interface SearchCondition {
  field: string
  operator: 'contains' | 'equals' | 'starts_with' | 'ends_with' | 'greater_than' | 'less_than' | 'not_null' | 'last_7_days' | 'last_30_days' | 'last_90_days'
  value: string
  connector: 'AND' | 'OR'
}

export interface CustomFilter {
  id: string
  name: string
  field: string
  operator: string
  value: string
}

export interface SearchHistory {
  query: string
  results: number
  timestamp: number
}

// KPI Types
export interface KPIMetric {
  value: number
  change: number
  trend: 'up' | 'down' | 'neutral'
  label: string
  icon?: string
  color?: string
}

export interface KPIMetrics {
  [key: string]: KPIMetric
}

// Table Column Types
export interface TableColumn {
  key: string
  label: string
  sortable?: boolean
  filterable?: boolean
  filterType?: 'text' | 'select' | 'multi-select' | 'date'
  width?: string
  align?: 'left' | 'center' | 'right'
  render?: (value: any, row: any) => React.ReactNode
}

// View Modes
export type ViewMode = 'table' | 'grid' | 'card' | 'list'

// Status Types
export interface StatusConfig {
  value: string
  label: string
  color: string
  bgColor: string
  icon?: string
}

// Pagination Types
export interface PaginationConfig {
  currentPage: number
  totalPages: number
  itemsPerPage: number
  totalItems: number
  onPageChange: (page: number) => void
  onItemsPerPageChange: (items: number) => void
}

// Filter Types
export interface FilterConfig {
  type: 'select' | 'multiselect' | 'date' | 'dateRange' | 'number' | 'numberRange' | 'text' | 'checkbox'
  key: string
  label: string
  options?: Array<{ value: string; label: string }>
  placeholder?: string
  min?: number
  max?: number
}

export interface AdvancedFilters {
  [key: string]: any
}

// Bulk Action Types
export interface BulkAction {
  id: string
  label: string
  icon: string
  action: (selectedIds: string[]) => void
  variant?: 'primary' | 'secondary' | 'danger'
  disabled?: boolean
}

// Export Types
export interface ExportConfig {
  format: 'csv' | 'json' | 'pdf' | 'excel'
  includeImages?: boolean
  selectedOnly?: boolean
  columns?: string[]
}

// Modal Types
export interface ModalConfig {
  isOpen: boolean
  onClose: () => void
  title: string
  size?: 'sm' | 'md' | 'lg' | 'xl' | 'full'
}

// Settings Types
export interface PageSettings {
  defaultViewMode: ViewMode
  itemsPerPage: number
  showAdvancedFilters: boolean
  autoSaveFilters: boolean
  defaultExportFormat: 'csv' | 'json' | 'pdf'
  includeImagesInExport: boolean
  showImages: boolean
}

// Data Source Types
export interface DataSource {
  endpoint: string
  method: 'GET' | 'POST' | 'PUT' | 'DELETE'
  headers?: Record<string, string>
  params?: Record<string, any>
}

// Component Props Types
export interface DataTableProps<T extends BaseEntity> {
  data: T[]
  columns: TableColumn[]
  loading?: boolean
  error?: string | null
  pagination?: PaginationConfig
  selectedItems?: string[]
  onSelectItem?: (id: string) => void
  onSelectAll?: () => void
  onRowClick?: (item: T) => void
  searchQuery?: string
  showImages?: boolean
  isFullScreen?: boolean
  // Column filter controls (optional)
  columnFilters?: Record<string, any>
  activeColumnFilter?: string | null
  onFilterClick?: (column: string) => void
  onColumnFilterChange?: (column: string, value: any) => void
}

export interface SearchControlsProps {
  searchQuery: string
  setSearchQuery: (query: string) => void
  searchConditions: SearchCondition[]
  showSearchBuilder: boolean
  setShowSearchBuilder: (show: boolean) => void
  showAdditionalControls: boolean
  setShowAdditionalControls: (show: boolean) => void
  activeFilter: string
  setActiveFilter: (filter: string) => void
  customFilters: CustomFilter[]
  onAddCustomFilter: (filter: CustomFilter) => void
  onRemoveCustomFilter: (id: string) => void
  showCustomFilterDropdown: boolean
  setShowCustomFilterDropdown: (show: boolean) => void
  hiddenDefaultFilters: Set<string>
  onShowAllFilters: () => void
  onClearSearch: () => void
  onClearSearchConditions: () => void
  selectedItems: string[]
  onBulkEdit: () => void
  onExportSelected: () => void
  onBulkDelete: () => void
  currentItems: any[]
  onSelectAll: () => void
  activeColumnFilter: string | null
  columnFilters: Record<string, any>
  onFilterClick: (column: string) => void
  onColumnFilterChange: (column: string, value: any) => void
  getUniqueValues: (field: string) => string[]
  onExport: () => void
  onImport: () => void
  onPrint: () => void
  onSettings: () => void
  showHeaderDropdown: boolean
  setShowHeaderDropdown: (show: boolean) => void
  viewMode: ViewMode
  setViewMode: (mode: ViewMode) => void
  showAdvancedFilter: boolean
  setShowAdvancedFilter: (show: boolean) => void
  isFullScreen: boolean
  onToggleFullScreen: () => void
  isAlgoliaSearching: boolean
  useAlgoliaSearch: boolean
}

export interface KPIGridProps {
  kpiMetrics: KPIMetrics
  data: any[]
  onRefresh?: (kpiKey: string) => void
  onConfigure?: (kpiKey: string, config: any) => void
  compact?: boolean
}

// Utility Types
export type DeepPartial<T> = {
  [P in keyof T]?: T[P] extends object ? DeepPartial<T[P]> : T[P]
}

export type Optional<T, K extends keyof T> = Omit<T, K> & Partial<Pick<T, K>>

export type RequiredFields<T, K extends keyof T> = T & Required<Pick<T, K>>
