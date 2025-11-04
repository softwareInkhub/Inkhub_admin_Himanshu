export * from '@/app/(admin)/apps/shopify/orders/utils/jsonColumnUtils'

/**
 * Utility functions for JSON column customization (shared)
 * Extracted from Orders app and made generic for shared use
 */

export type FieldType = 'string' | 'number' | 'boolean' | 'array' | 'object' | 'date'

export interface VisibleField {
  key: string
  label: string
  path: string
  type: FieldType
  sortable?: boolean
  width?: number
}

export interface ColumnConfig {
  selectedFields: VisibleField[]
  showJsonKeys: boolean
  customLabels: Record<string, string>
  columnWidths: Record<string, number>
}

export const ALL_JSON_FIELDS: VisibleField[] = [
  { key: 'orderNumber', label: 'Order Number', path: 'order_number', type: 'number', sortable: true },
  { key: 'name', label: 'Order Name', path: 'name', type: 'string', sortable: true },
  { key: 'id', label: 'Order ID', path: 'id', type: 'string', sortable: true },
  { key: 'number', label: 'Number', path: 'number', type: 'number', sortable: true },
  { key: 'phone', label: 'Phone', path: 'phone', type: 'string', sortable: false },
  { key: 'contactEmail', label: 'Contact Email', path: 'contact_email', type: 'string', sortable: false },
  { key: 'email', label: 'Email', path: 'email', type: 'string', sortable: true },
  { key: 'confirmationNumber', label: 'Confirmation Number', path: 'confirmation_number', type: 'string', sortable: false },
  { key: 'totalPrice', label: 'Total Price', path: 'total_price', type: 'string', sortable: true },
  { key: 'currentTotalPrice', label: 'Current Total Price', path: 'current_total_price', type: 'string', sortable: true },
  { key: 'subtotalPrice', label: 'Subtotal Price', path: 'subtotal_price', type: 'string', sortable: true },
  { key: 'totalDiscounts', label: 'Total Discounts', path: 'total_discounts', type: 'string', sortable: true },
  { key: 'totalTax', label: 'Total Tax', path: 'total_tax', type: 'string', sortable: true },
  { key: 'totalShippingPrice', label: 'Total Shipping', path: 'total_shipping_price_set.shop_money.amount', type: 'string', sortable: false },
  { key: 'currency', label: 'Currency', path: 'currency', type: 'string', sortable: true },
  { key: 'financialStatus', label: 'Financial Status', path: 'financial_status', type: 'string', sortable: true },
  { key: 'totalOutstanding', label: 'Total Outstanding', path: 'total_outstanding', type: 'string', sortable: false },
  { key: 'fulfillmentStatus', label: 'Fulfillment Status', path: 'fulfillment_status', type: 'string', sortable: true },
  { key: 'confirmed', label: 'Confirmed', path: 'confirmed', type: 'boolean', sortable: false },
  { key: 'test', label: 'Test Order', path: 'test', type: 'boolean', sortable: false },
  { key: 'createdAt', label: 'Created At', path: 'created_at', type: 'date', sortable: true },
  { key: 'updatedAt', label: 'Updated At', path: 'updated_at', type: 'date', sortable: true },
  { key: 'processedAt', label: 'Processed At', path: 'processed_at', type: 'date', sortable: true },
  { key: 'closedAt', label: 'Closed At', path: 'closed_at', type: 'date', sortable: false },
  { key: 'customer.firstName', label: 'Customer First Name', path: 'customer.first_name', type: 'string', sortable: false },
  { key: 'customer.lastName', label: 'Customer Last Name', path: 'customer.last_name', type: 'string', sortable: false },
  { key: 'customer.email', label: 'Customer Email', path: 'customer.email', type: 'string', sortable: false },
  { key: 'customer.phone', label: 'Customer Phone', path: 'customer.phone', type: 'string', sortable: false },
  { key: 'customer.verifiedEmail', label: 'Email Verified', path: 'customer.verified_email', type: 'boolean', sortable: false },
  { key: 'shipping_address.name', label: 'Shipping Name', path: 'shipping_address.name', type: 'string', sortable: false },
  { key: 'shipping_address.first_name', label: 'Shipping First Name', path: 'shipping_address.first_name', type: 'string', sortable: false },
  { key: 'shipping_address.last_name', label: 'Shipping Last Name', path: 'shipping_address.last_name', type: 'string', sortable: false },
  { key: 'shipping_address.address1', label: 'Shipping Address 1', path: 'shipping_address.address1', type: 'string', sortable: false },
  { key: 'shipping_address.address2', label: 'Shipping Address 2', path: 'shipping_address.address2', type: 'string', sortable: false },
  { key: 'shipping_address.city', label: 'Shipping City', path: 'shipping_address.city', type: 'string', sortable: false },
  { key: 'shipping_address.province', label: 'Shipping Province', path: 'shipping_address.province', type: 'string', sortable: false },
  { key: 'shipping_address.province_code', label: 'Shipping Province Code', path: 'shipping_address.province_code', type: 'string', sortable: false },
  { key: 'shipping_address.country', label: 'Shipping Country', path: 'shipping_address.country', type: 'string', sortable: false },
  { key: 'shipping_address.zip', label: 'Shipping ZIP', path: 'shipping_address.zip', type: 'string', sortable: false },
  { key: 'shipping_address.phone', label: 'Shipping Phone', path: 'shipping_address.phone', type: 'string', sortable: false },
  { key: 'billing_address.name', label: 'Billing Name', path: 'billing_address.name', type: 'string', sortable: false },
  { key: 'billing_address.first_name', label: 'Billing First Name', path: 'billing_address.first_name', type: 'string', sortable: false },
  { key: 'billing_address.last_name', label: 'Billing Last Name', path: 'billing_address.last_name', type: 'string', sortable: false },
  { key: 'billing_address.address1', label: 'Billing Address 1', path: 'billing_address.address1', type: 'string', sortable: false },
  { key: 'billing_address.address2', label: 'Billing Address 2', path: 'billing_address.address2', type: 'string', sortable: false },
  { key: 'billing_address.city', label: 'Billing City', path: 'billing_address.city', type: 'string', sortable: false },
  { key: 'billing_address.province', label: 'Billing Province', path: 'billing_address.province', type: 'string', sortable: false },
  { key: 'billing_address.province_code', label: 'Billing Province Code', path: 'billing_address.province_code', type: 'string', sortable: false },
  { key: 'billing_address.country', label: 'Billing Country', path: 'billing_address.country', type: 'string', sortable: false },
  { key: 'billing_address.country_code', label: 'Billing Country Code', path: 'billing_address.country_code', type: 'string', sortable: false },
  { key: 'billing_address.zip', label: 'Billing ZIP', path: 'billing_address.zip', type: 'string', sortable: false },
  { key: 'billing_address.phone', label: 'Billing Phone', path: 'billing_address.phone', type: 'string', sortable: false },
  { key: 'tags', label: 'Tags', path: 'tags', type: 'string', sortable: false },
  { key: 'note', label: 'Note', path: 'note', type: 'string', sortable: false },
  { key: 'token', label: 'Token', path: 'token', type: 'string', sortable: false },
  { key: 'checkoutToken', label: 'Checkout Token', path: 'checkout_token', type: 'string', sortable: false },
  { key: 'sourceName', label: 'Channel', path: 'source_name', type: 'string', sortable: false },
  { key: 'customerLocale', label: 'Customer Locale', path: 'customer_locale', type: 'string', sortable: false },
  { key: 'presentmentCurrency', label: 'Presentment Currency', path: 'presentment_currency', type: 'string', sortable: false },
  { key: 'browserIp', label: 'Browser IP', path: 'browser_ip', type: 'string', sortable: false },
  { key: 'line_items', label: 'Line Items', path: 'line_items', type: 'array', sortable: false },
  { key: 'lineItemsCount', label: 'Line Items Count', path: 'line_items.length', type: 'number', sortable: false },
  { key: 'shipping_lines', label: 'Shipping Lines', path: 'shipping_lines', type: 'array', sortable: false },
  { key: 'discount_codes', label: 'Discount Codes', path: 'discount_codes', type: 'array', sortable: false },
  { key: 'note_attributes', label: 'Note Attributes', path: 'note_attributes', type: 'array', sortable: false },
  { key: 'fulfillments', label: 'Fulfillments', path: 'fulfillments', type: 'array', sortable: false },
  { key: 'refunds', label: 'Refunds', path: 'refunds', type: 'array', sortable: false },
  { key: 'paymentGatewayNames', label: 'Payment Gateways', path: 'payment_gateway_names', type: 'array', sortable: false },
  { key: 'shipping_lines.0.title', label: 'Shipping Method', path: 'shipping_lines.0.title', type: 'string', sortable: false },
  { key: 'shipping_lines.0.price', label: 'Shipping Price', path: 'shipping_lines.0.price', type: 'string', sortable: false },
  { key: 'shipping_lines.0.code', label: 'Shipping Code', path: 'shipping_lines.0.code', type: 'string', sortable: false },
  { key: 'current_total_price_set.shop_money.amount', label: 'Shop Money Amount', path: 'current_total_price_set.shop_money.amount', type: 'string', sortable: false },
  { key: 'current_total_price_set.shop_money.currency_code', label: 'Shop Currency Code', path: 'current_total_price_set.shop_money.currency_code', type: 'string', sortable: false },
  { key: 'order_status_url', label: 'Order Status URL', path: 'order_status_url', type: 'string', sortable: false },
  { key: 'fulfillments.0.tracking_number', label: 'Tracking Number', path: 'fulfillments.0.tracking_number', type: 'string', sortable: false },
  { key: 'fulfillments.0.tracking_company', label: 'Tracking Company', path: 'fulfillments.0.tracking_company', type: 'string', sortable: false },
  { key: 'fulfillments.0.shipment_status', label: 'Shipment Status', path: 'fulfillments.0.shipment_status', type: 'string', sortable: false },
  { key: 'total_weight', label: 'Total Weight', path: 'total_weight', type: 'number', sortable: false },
  { key: 'buyer_accepts_marketing', label: 'Accepts Marketing', path: 'buyer_accepts_marketing', type: 'boolean', sortable: false },
  { key: 'tax_exempt', label: 'Tax Exempt', path: 'tax_exempt', type: 'boolean', sortable: false },
  { key: 'taxes_included', label: 'Taxes Included', path: 'taxes_included', type: 'boolean', sortable: false }
]

export const DEFAULT_COLUMNS: string[] = [
  'name',
  'customer.firstName',
  'fulfillmentStatus',
  'currentTotalPrice',
  'createdAt',
  'updatedAt',
  'tags',
  'sourceName',
  'financialStatus',
  'email'
]

export function getValueFromPath(obj: any, path: string): any {
  if (!obj || !path) return undefined
  const parts = path.split('.')
  let current = obj
  for (const part of parts) {
    if (current === null || current === undefined) return undefined
    if (/^\d+$/.test(part)) {
      const index = parseInt(part, 10)
      if (Array.isArray(current) && index < current.length) current = current[index]
      else return undefined
    } else {
      if (part in current) current = current[part]
      else {
        const camelCase = part.replace(/_([a-z])/g, (_, letter) => letter.toUpperCase())
        if (camelCase in current) current = current[camelCase]
        else {
          const snakeCase = part.replace(/([A-Z])/g, '_$1').toLowerCase()
          if (snakeCase in current) current = current[snakeCase]
          else return undefined
        }
      }
    }
  }
  return current
}

export function formatValue(value: any, type: FieldType): string {
  if (value === null || value === undefined) return 'N/A'
  switch (type) {
    case 'boolean':
      return value ? 'Yes' : 'No'
    case 'array':
      return Array.isArray(value) ? `[${value.length} item${value.length !== 1 ? 's' : ''}]` : 'N/A'
    case 'object':
      return typeof value === 'object' ? '[Object]' : String(value)
    case 'date':
      try {
        const date = new Date(value)
        if (isNaN(date.getTime())) return String(value)
        return date.toLocaleDateString('en-US', { month: 'short', day: '2-digit', year: 'numeric' })
      } catch {
        return String(value)
      }
    case 'number':
      return typeof value === 'number' ? value.toLocaleString() : String(value)
    case 'string':
    default:
      return String(value)
  }
}

export function getDetailedValue(value: any, type: FieldType): string {
  if (value === null || value === undefined) return 'No value'
  switch (type) {
    case 'array':
      return Array.isArray(value) ? (value.length === 0 ? 'Empty array' : JSON.stringify(value, null, 2)) : 'Not an array'
    case 'object':
      return typeof value === 'object' ? JSON.stringify(value, null, 2) : String(value)
    default:
      return formatValue(value, type)
  }
}

export function truncateText(text: string, maxLength: number = 50): string {
  if (text.length <= maxLength) return text
  return text.substring(0, maxLength) + '...'
}

export async function copyToClipboard(text: string): Promise<boolean> {
  try {
    if (navigator.clipboard && navigator.clipboard.writeText) {
      await navigator.clipboard.writeText(text)
      return true
    } else {
      const textarea = document.createElement('textarea')
      textarea.value = text
      textarea.style.position = 'fixed'
      textarea.style.opacity = '0'
      document.body.appendChild(textarea)
      textarea.select()
      const success = document.execCommand('copy')
      document.body.removeChild(textarea)
      return success
    }
  } catch (error) {
    console.error('Failed to copy to clipboard:', error)
    return false
  }
}

export function validateColumnConfig(config: any): config is ColumnConfig {
  if (!config || typeof config !== 'object') return false
  if (!Array.isArray(config.selectedFields)) return false
  if (typeof config.showJsonKeys !== 'boolean') return false
  if (typeof config.customLabels !== 'object') return false
  for (const field of config.selectedFields) {
    if (!field.key || !field.label || !field.path || !field.type) return false
  }
  return true
}

export function deduplicateFields(fields: VisibleField[]): VisibleField[] {
  const seen = new Set<string>()
  return fields.filter(field => {
    if (seen.has(field.key)) return false
    seen.add(field.key)
    return true
  })
}

export function filterFields(fields: VisibleField[], query: string): VisibleField[] {
  if (!query.trim()) return fields
  const lowerQuery = query.toLowerCase()
  return fields.filter(field =>
    field.label.toLowerCase().includes(lowerQuery) ||
    field.path.toLowerCase().includes(lowerQuery) ||
    field.key.toLowerCase().includes(lowerQuery)
  )
}

export function getDefaultColumnConfig(): ColumnConfig {
  const defaultFields = ALL_JSON_FIELDS.filter(field => DEFAULT_COLUMNS.includes(field.key))
  return { selectedFields: defaultFields, showJsonKeys: false, customLabels: {}, columnWidths: {} }
}

export function exportColumnConfig(config: ColumnConfig, filename: string = 'orders-columns-config.json') {
  const dataStr = JSON.stringify(config, null, 2)
  const dataUri = 'data:application/json;charset=utf-8,' + encodeURIComponent(dataStr)
  const exportFileDefaultName = filename
  const linkElement = document.createElement('a')
  linkElement.setAttribute('href', dataUri)
  linkElement.setAttribute('download', exportFileDefaultName)
  linkElement.click()
}

export function importColumnConfig(file: File): Promise<ColumnConfig> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = (e) => {
      try {
        const content = e.target?.result as string
        const config = JSON.parse(content)
        if (!validateColumnConfig(config)) {
          reject(new Error('Invalid column configuration format'))
          return
        }
        config.selectedFields = deduplicateFields(config.selectedFields)
        resolve(config)
      } catch (error) {
        reject(new Error('Failed to parse configuration file'))
      }
    }
    reader.onerror = () => {
      reject(new Error('Failed to read file'))
    }
    reader.readAsText(file)
  })
}



