export interface Order {
  id: string
  name?: string
  orderNumber: string
  customerName: string
  customerEmail: string
  phone?: string
  total: number
  currency?: string
  status: 'paid' | 'unpaid' | 'refunded' | 'pending' | 'processing' | 'shipped' | 'delivered' | 'cancelled'
  fulfillmentStatus: 'unfulfilled' | 'fulfilled' | 'partial'
  financialStatus: 'paid' | 'pending' | 'refunded'
  paymentStatus?: 'paid' | 'pending' | 'refunded'
  items: any[]
  createdAt: string
  updatedAt: string
  line_items?: any[]
  lineItems?: any[]
  totalPrice?: string
  customer?: {
    firstName: string
    lastName: string
    email: string
  }
  tags?: string[]
  channel?: string
  deliveryMethod?: string
  deliveryStatus?: string
  hasWarning?: boolean
  hasDocument?: boolean
  shippingAddress?: {
    firstName: string
    lastName: string
    address1: string
    address2: string
    city: string
    province: string
    country: string
    zip: string
    phone: string
  }
  billingAddress?: {
    firstName: string
    lastName: string
    address1: string
    address2: string
    city: string
    province: string
    country: string
    zip: string
    phone: string
  }
  _highlightResult?: {
    orderNumber: {
      value: string
      matchLevel: string
      fullyHighlighted: boolean
      matchedWords: string[]
    }
    customerName: {
      value: string
      matchLevel: string
      matchedWords: string[]
    }
    customerEmail: {
      value: string
      matchLevel: string
      matchedWords: string[]
    }
  }
}

export interface KPIMetric {
  value: number
  change: number
  trend: 'up' | 'down' | 'neutral'
}

export interface SearchCondition {
  field: string
  operator: 'contains' | 'equals' | 'starts_with' | 'ends_with'
  value: string
  connector: 'AND' | 'OR'
}

export interface AdvancedFilters {
  orderStatus: string[]
  paymentStatus: string[]
  deliveryStatus: string[]
  dateRange: { start: string; end: string }
  tags: string[]
  channels: string[]
}

export interface ColumnFilters {
  customer: string
  orderNumber: string
  fulfillmentStatus: string[]
  paymentStatus: string[]
  deliveryStatus: string[]
  tags: string[]
  channel: string[]
  deliveryMethod: string[]
  total: string
  date: string
}

export interface CustomFilter {
  id: string
  name: string
  field: string
  operator: string
  value: string
}

export interface OrderSettings {
  defaultViewMode: 'table' | 'grid' | 'card'
  itemsPerPage: number
  showAdvancedFilters: boolean
  autoSaveFilters: boolean
  defaultExportFormat: 'csv' | 'json' | 'pdf'
  includeImagesInExport: boolean
  showImages: boolean
}
