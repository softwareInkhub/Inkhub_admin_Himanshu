// Base entity interface with common fields
export interface BaseEntity {
  id: string
  createdAt: string
  updatedAt: string
}

// Generic Order type for shared components (use specific Order types in pages)
export interface GenericOrder {
  id: string
  [key: string]: any
}

// Keep Order export for backward compatibility - points to GenericOrder
export type Order = GenericOrder

// Generic Product type for shared components
export interface GenericProduct {
  id: string
  [key: string]: any
}

// Keep Product export for backward compatibility
export type Product = GenericProduct

export interface CustomCard {
  id: string
  title: string
  icon: string
  color: string
  field: string
  operation: 'sum' | 'avg' | 'min' | 'max' | 'count' | 'percentage' | 'difference' | 'custom'
  selectedProducts: string[]
  isVisible: boolean
}

export interface KPIMetric {
  value: number
  change: number
  trend: 'up' | 'down' | 'neutral'
  label?: string
  icon?: string
  color?: string
}

export interface KPIMetrics {
  [key: string]: KPIMetric
}

// Table column definition
export interface TableColumn<T = any> {
  key: string
  label: string
  sortable?: boolean
  align?: 'left' | 'center' | 'right'
  render?: (value: any, item: T) => React.ReactNode
}

// Data table props
export interface DataTableProps<T extends BaseEntity> {
  data: T[]
  columns: TableColumn<T>[]
  loading?: boolean
  error?: string | null
  pagination?: {
    currentPage: number
    totalPages: number
    itemsPerPage: number
    totalItems: number
    onPageChange?: (page: number) => void
    onItemsPerPageChange?: (items: number) => void
  }
  selectedItems?: string[]
  onSelectItem?: (id: string) => void
  onSelectAll?: () => void
  onRowClick?: (item: T) => void
  searchQuery?: string
  showImages?: boolean
  isFullScreen?: boolean
  columnFilters?: Record<string, any>
  activeColumnFilter?: string | null
  onFilterClick?: (columnKey: string) => void
  onColumnFilterChange?: (columnKey: string, value: any) => void
  getUniqueValues?: (field: string) => string[]
}
