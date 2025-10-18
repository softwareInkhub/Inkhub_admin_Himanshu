export interface Product {
  id: string
  title: string
  handle: string
  vendor: string
  productType: string
  price: number
  compareAtPrice?: number
  cost: number
  inventoryQuantity: number
  status: 'active' | 'draft' | 'archived'
  publishedAt?: string
  createdAt: string
  updatedAt: string
  tags: string[]
  images: string[]
  variants: ProductVariant[]
  collections: string[]
  selected?: boolean
  salesChannels?: number
  category?: string
  seoTitle?: string
  seoDescription?: string
  _highlightResult?: {
    title: {
      value: string
      matchLevel: string
      fullyHighlighted: boolean
      matchedWords: string[]
    }
    vendor: {
      value: string
      matchLevel: string
      matchedWords: string[]
    }
    product_type: {
      value: string
      matchLevel: string
      matchedWords: string[]
    }
  }
}

export interface ProductVariant {
  id: string
  title: string
  price: number
  compareAtPrice?: number
  inventoryQuantity: number
  sku: string
  barcode?: string
  weight?: number
  weightUnit: string
}

export interface KPIMetric {
  value: number
  change: number
  trend: 'up' | 'down' | 'neutral'
}

// KPIMetrics is now imported from @/components/shared/types

export interface SearchCondition {
  field: string
  operator: 'contains' | 'equals' | 'starts_with' | 'ends_with'
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

export interface CustomCard {
  id: string
  title: string
  field: string
  operation: string
  selectedProducts: string[]
  color: string
  icon: string
  isVisible: boolean
  computedValue: number
}

export interface ProductsClientProps {
  initialData: {
    items: any[]
    lastEvaluatedKey: any
    total: number
  }
}
