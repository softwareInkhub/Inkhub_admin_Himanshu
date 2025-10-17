// Unified Data Table Types
// Generic types for all data table components across the application

// Generic base interface for all table items
export interface TableItem {
  id: string
  [key: string]: any
}

// Generic column definition
export interface ColumnDef<T extends TableItem> {
  key: string
  label: string
  sortable?: boolean
  filterable?: boolean
  render?: (item: T, index?: number) => React.ReactNode
  width?: number
  type?: 'text' | 'number' | 'date' | 'boolean' | 'array' | 'object'
}

// KPI Metric interface
export interface KPIMetric {
  value: number
  change: number
  trend: 'up' | 'down' | 'neutral'
}

// KPI Card configuration
export interface KPICardConfig {
  key: string
  label: string
  metric: KPIMetric
  gradient: string
  icon: string
  bgGradient: string
  isCurrency: boolean
}

// Algolia configuration
export interface AlgoliaConfig<T extends TableItem> {
  enabled: boolean
  project: string
  table: string
  hitConverter: (hit: any) => T
}

// Column customization configuration
export interface ColumnCustomizationConfig {
  enabled: boolean
  jsonFieldExtractor: (data: any[]) => VisibleField[]
  categories: FieldCategory[]
}

// Saved views configuration
export interface SavedViewsConfig {
  enabled: boolean
  storageKey: string
}

// Visible field for column customization
export interface VisibleField {
  key: string
  label: string
  path: string
  type: 'text' | 'number' | 'date' | 'boolean' | 'array' | 'object'
  sortable: boolean
  category: string
}

// Field category for column manager
export interface FieldCategory {
  key: string
  label: string
  fields: VisibleField[]
}

// Column configuration for persistence
export interface ColumnConfig {
  selectedFields: VisibleField[]
  showJsonKeys: boolean
  customLabels: Record<string, string>
}

// Search condition for advanced search
export interface SearchCondition {
  field: string
  operator: 'contains' | 'equals' | 'starts_with' | 'ends_with' | 'greater_than' | 'less_than' | 'last_7_days' | 'last_30_days' | 'last_90_days'
  value: string
  connector: 'AND' | 'OR'
}

// Custom filter
export interface CustomFilter {
  id: string
  name: string
  field: string
  operator: string
  value: string
}

// Advanced filters
export interface AdvancedFilters {
  orderStatus?: string[]
  financialStatus?: string[]
  priceRange?: { min: string; max: string }
  serialNumberRange?: { min: string; max: string }
  dateRange?: { start: string; end: string }
  tags?: string[]
  channels?: string[]
}

// View mode
export type ViewMode = 'table' | 'grid' | 'card'

// Sort state
export interface SortState {
  key: string | null
  dir: 'asc' | 'desc' | null
}

// Filter dropdown position
export interface FilterPosition {
  x: number
  y: number
}

// Filter dropdown state
export interface FilterDropdown {
  column: string
  position: FilterPosition
}

// Pagination configuration
export interface PaginationConfig {
  currentPage: number
  totalPages: number
  itemsPerPage: number
  totalItems: number
  onPageChange: (page: number) => void
  onItemsPerPageChange: (items: number) => void
}

// Table settings
export interface TableSettings {
  defaultViewMode: ViewMode
  itemsPerPage: number
  showAdvancedFilters: boolean
  autoSaveFilters: boolean
  defaultExportFormat: 'csv' | 'json' | 'pdf'
  includeImagesInExport: boolean
  showImages: boolean
}

// Search history item
export interface SearchHistory {
  query: string
  timestamp: number
  resultCount: number
}

// Search suggestion
export interface SearchSuggestion {
  text: string
  type: 'history' | 'suggestion'
  resultCount?: number
}

// Saved search view
export interface SavedSearchView {
  id: string
  viewName: string
  searchQuery: string
  searchConditions: SearchCondition[]
  columnFilters: Record<string, any>
  customFilters: CustomFilter[]
  sortColumn: string
  sortDirection: string
  viewMode: ViewMode
  itemsPerPage: number
  updatedAt: string
}

// Bulk action configuration
export interface BulkActionConfig {
  enabled: boolean
  actions: {
    edit: boolean
    delete: boolean
    export: boolean
    import: boolean
    print: boolean
  }
}

// Table configuration for each page
export interface TablePageConfig<T extends TableItem> {
  // Data
  data: T[]
  loading?: boolean
  error?: string | null
  
  // Table configuration
  columns: ColumnDef<T>[]
  sortState?: SortState
  onRequestSort?: (key: string) => void
  
  // Selection
  selectedItems: string[]
  onSelectItem: (id: string) => void
  onSelectAll: () => void
  
  // Search and filters
  searchQuery: string
  setSearchQuery: (query: string) => void
  searchConditions: SearchCondition[]
  setSearchConditions: (conditions: SearchCondition[]) => void
  columnFilters: Record<string, any>
  onColumnFilterChange: (column: string, value: any) => void
  advancedFilters: AdvancedFilters
  setAdvancedFilters: (filters: AdvancedFilters) => void
  
  // View and UI
  viewMode: ViewMode
  setViewMode: (mode: ViewMode) => void
  isFullScreen: boolean
  onToggleFullScreen: () => void
  
  // Pagination
  pagination: PaginationConfig
  onPageChange: (page: number) => void
  onItemsPerPageChange: (items: number) => void
  
  // Features
  algoliaConfig?: AlgoliaConfig<T>
  columnCustomization?: ColumnCustomizationConfig
  savedViews?: SavedViewsConfig
  bulkActions?: BulkActionConfig
  
  // Callbacks
  onRowClick?: (item: T, event: React.MouseEvent) => void
  onRefresh?: () => void
  onExport?: () => void
  onImport?: () => void
  onPrint?: () => void
  onSettings?: () => void
}

// Custom card for KPI grid
export interface CustomCard {
  id: string
  title: string
  field: string
  operation: 'sum' | 'avg' | 'count' | 'min' | 'max'
  selectedProducts: string[]
  color: string
  icon: string
  isVisible: boolean
}

// Export configuration
export interface ExportConfig {
  format: 'csv' | 'json' | 'pdf'
  includeImages: boolean
  selectedFields?: string[]
  filename?: string
}

// Import configuration
export interface ImportConfig {
  format: 'csv' | 'json'
  mapping?: Record<string, string>
  validateData?: boolean
}

// Table theme configuration
export interface TableTheme {
  primaryColor: string
  secondaryColor: string
  accentColor: string
  backgroundColor: string
  textColor: string
  borderColor: string
}

// Performance configuration
export interface PerformanceConfig {
  virtualScrolling: boolean
  lazyLoading: boolean
  debounceSearch: number
  cacheResults: boolean
  preloadPages: number
}

// Accessibility configuration
export interface AccessibilityConfig {
  screenReaderSupport: boolean
  keyboardNavigation: boolean
  highContrast: boolean
  reducedMotion: boolean
}

// Complete table configuration
export interface UnifiedTableConfig<T extends TableItem> {
  page: TablePageConfig<T>
  algolia?: AlgoliaConfig<T>
  columns?: ColumnCustomizationConfig
  savedViews?: SavedViewsConfig
  bulkActions?: BulkActionConfig
  export?: ExportConfig
  import?: ImportConfig
  theme?: TableTheme
  performance?: PerformanceConfig
  accessibility?: AccessibilityConfig
}
