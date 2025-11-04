export type ViewMode = 'table' | 'grid' | 'card'

export interface TableItem {
  id: string
  [key: string]: any
}

export interface ColumnDef<T extends TableItem = TableItem> {
  key: string
  label: string
  sortable?: boolean
  render?: (item: T, index: number) => any
}

export interface SortState {
  key: string | null
  dir: 'asc' | 'desc' | null
}

export interface FilterDropdown {
  column: string
  position: { x: number; y: number }
}

export interface KPICardMetric {
  value: number
  change: number
  trend: 'up' | 'down' | 'neutral'
}

export interface KPICardConfig {
  key: string
  label: string
  metric: KPICardMetric
  icon: string
  gradient: string
  bgGradient: string
  isCurrency: boolean
}

export interface AlgoliaConfig<T extends TableItem = TableItem> {
  enabled?: boolean
  indexName?: string
  mapHitToItem?: (hit: any) => T
}

export interface ColumnCustomizationConfig {
  enabled?: boolean
}

export interface SavedViewsConfig {
  enabled?: boolean
  tableName?: string
}

export interface BulkActionConfig {
  enabled?: boolean
}

export interface PaginationConfig {
  currentPage: number
  totalPages: number
  itemsPerPage: number
  totalItems: number
  onPageChange: (page: number) => void
  onItemsPerPageChange: (items: number) => void
}

export interface CustomCard {
  id: string
  title: string
  field: string
  operation: 'sum' | 'avg' | 'min' | 'max' | 'count'
  selectedProducts: string[]
  color: string
  icon: string
  isVisible: boolean
}

export interface SearchCondition {
  field: string
  operator: 'contains' | 'equals' | 'starts_with' | 'ends_with'
  value: string
  connector: 'AND' | 'OR'
}

export interface CustomFilter {
  id: string
  name: string
  field?: string
  operator?: string
  values?: string[]
}


