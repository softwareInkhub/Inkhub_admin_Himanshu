import React from 'react'
import { Copy, Check } from 'lucide-react'
import { Order } from '../types'
import {
  VisibleField,
  getValueFromPath,
  formatValue,
  getDetailedValue,
  truncateText,
  copyToClipboard
} from './jsonColumnUtils'

export interface ColumnDef<T> {
  key: string
  label: string
  sortable: boolean
  width?: number
  render: (item: T, index?: number) => React.ReactNode
}

interface GenerateColumnsOptions {
  showJsonKeys: boolean
  onCopyPath?: (path: string) => void
}

/**
 * Generate table columns from visible fields configuration
 */
export function generateColumns(
  fields: VisibleField[],
  options: GenerateColumnsOptions
): ColumnDef<Order>[] {
  const { showJsonKeys, onCopyPath } = options

  return fields.map(field => ({
    key: field.key,
    label: field.label,
    sortable: field.sortable || false,
    width: field.width,
    render: (order: Order, index?: number) => {
      const value = getValueFromPath(order, field.path)
      const formattedValue = formatValue(value, field.type)
      const detailedValue = getDetailedValue(value, field.type)
      const shouldTruncate = formattedValue.length > 50

      return (
        <div className="min-w-0">
          <span
            className="text-sm text-gray-900 block"
            title={shouldTruncate ? detailedValue : undefined}
          >
            {shouldTruncate ? truncateText(formattedValue, 50) : formattedValue}
          </span>
        </div>
      )
    }
  }))
}

/**
 * Generate column header with optional JSON path display
 */
export function generateColumnHeader(
  field: VisibleField,
  showJsonKeys: boolean,
  onCopyPath?: (path: string) => void
): React.ReactNode {
  const [copied, setCopied] = React.useState(false)

  const handleCopy = async (e: React.MouseEvent) => {
    e.stopPropagation()
    const success = await copyToClipboard(field.path)
    if (success) {
      setCopied(true)
      onCopyPath?.(field.path)
      setTimeout(() => setCopied(false), 2000)
    }
  }

  return (
    <div className="flex items-center space-x-2 min-w-0">
      <span className="font-medium text-gray-900 truncate">{field.label}</span>
      {showJsonKeys && (
        <div className="flex items-center space-x-1 flex-shrink-0">
          <code className="text-[11px] font-mono text-gray-500 bg-gray-100 px-1.5 py-0.5 rounded">
            {field.path}
          </code>
          <button
            onClick={handleCopy}
            className="p-0.5 text-gray-400 hover:text-gray-600 transition-colors"
            title="Copy JSON path"
          >
            {copied ? (
              <Check className="h-3 w-3 text-green-600" />
            ) : (
              <Copy className="h-3 w-3" />
            )}
          </button>
        </div>
      )}
    </div>
  )
}

/**
 * Format cell value based on field type with enhanced rendering
 */
export function renderCellValue(
  order: Order,
  field: VisibleField,
  options: {
    compact?: boolean
    showTooltip?: boolean
    highlightSearch?: string
  } = {}
): React.ReactNode {
  const { compact = false, showTooltip = true, highlightSearch } = options
  const value = getValueFromPath(order, field.path)

  // Handle null/undefined
  if (value === null || value === undefined) {
    return (
      <span className="text-xs text-gray-400 italic">N/A</span>
    )
  }

  // Handle different types with custom rendering
  switch (field.type) {
    case 'boolean':
      return (
        <span className={`
          inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium
          ${value ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'}
        `}>
          {value ? 'Yes' : 'No'}
        </span>
      )

    case 'array':
      if (Array.isArray(value)) {
        return (
          <span
            className="text-xs text-gray-700"
            title={showTooltip ? JSON.stringify(value, null, 2) : undefined}
          >
            [{value.length} item{value.length !== 1 ? 's' : ''}]
          </span>
        )
      }
      return <span className="text-xs text-gray-400 italic">Not an array</span>

    case 'object':
      if (typeof value === 'object') {
        return (
          <span
            className="text-xs text-gray-700 font-mono"
            title={showTooltip ? JSON.stringify(value, null, 2) : undefined}
          >
            &#123;Object&#125;
          </span>
        )
      }
      return <span className="text-xs text-gray-900">{String(value)}</span>

    case 'date':
      try {
        const date = new Date(value)
        if (isNaN(date.getTime())) {
          return <span className="text-sm text-gray-900">{String(value)}</span>
        }
        return (
          <span className="text-sm text-gray-700">
            {date.toLocaleDateString('en-US', {
              month: 'short',
              day: '2-digit',
              year: 'numeric',
              ...(compact ? {} : { hour: '2-digit', minute: '2-digit' })
            })}
          </span>
        )
      } catch {
        return <span className="text-sm text-gray-900">{String(value)}</span>
      }

    case 'number':
      const numValue = typeof value === 'number' ? value : parseFloat(value)
      if (isNaN(numValue)) {
        return <span className="text-sm text-gray-900">{String(value)}</span>
      }
      
      // Check if it's a currency field
      const isCurrency = field.key.includes('total') || 
                         field.key.includes('price') || 
                         field.key.includes('amount')
      
      if (isCurrency) {
        return (
          <span className="text-sm font-medium text-gray-900">
            ₹{numValue.toFixed(2)}
          </span>
        )
      }
      
      return (
        <span className="text-sm text-gray-900">
          {numValue.toLocaleString()}
        </span>
      )

    case 'string':
    default:
      const strValue = String(value)
      const shouldTruncate = strValue.length > 50
      const displayValue = shouldTruncate ? truncateText(strValue, 50) : strValue

      // Highlight search if provided
      if (highlightSearch && strValue.toLowerCase().includes(highlightSearch.toLowerCase())) {
        const parts = strValue.split(new RegExp(`(${highlightSearch})`, 'gi'))
        return (
          <span className="text-sm text-gray-900" title={showTooltip && shouldTruncate ? strValue : undefined}>
            {parts.map((part, i) => 
              part.toLowerCase() === highlightSearch.toLowerCase() ? (
                <mark key={i} className="bg-yellow-200">{part}</mark>
              ) : (
                <span key={i}>{part}</span>
              )
            )}
          </span>
        )
      }

      return (
        <span
          className="text-sm text-gray-900"
          title={showTooltip && shouldTruncate ? strValue : undefined}
        >
          {displayValue}
        </span>
      )
  }
}

/**
 * Generate status badge for common status fields
 */
export function renderStatusBadge(status: string, type: 'fulfillment' | 'financial' | 'delivery'): React.ReactNode {
  const statusMap: Record<string, Record<string, { className: string; text: string }>> = {
    fulfillment: {
      fulfilled: { className: 'bg-green-100 text-green-800', text: 'Fulfilled' },
      unfulfilled: { className: 'bg-red-100 text-red-800', text: 'Unfulfilled' },
      partial: { className: 'bg-yellow-100 text-yellow-800', text: 'Partial' }
    },
    financial: {
      paid: { className: 'bg-green-100 text-green-800', text: 'Paid' },
      pending: { className: 'bg-yellow-100 text-yellow-800', text: 'Pending' },
      refunded: { className: 'bg-red-100 text-red-800', text: 'Refunded' }
    },
    delivery: {
      delivered: { className: 'bg-green-100 text-green-800', text: 'Delivered' },
      shipped: { className: 'bg-blue-100 text-blue-800', text: 'Shipped' },
      processing: { className: 'bg-yellow-100 text-yellow-800', text: 'Processing' },
      pending: { className: 'bg-gray-100 text-gray-800', text: 'Pending' }
    }
  }

  const badge = statusMap[type]?.[status.toLowerCase()] || {
    className: 'bg-gray-100 text-gray-800',
    text: status
  }

  return (
    <span className={`inline-flex px-2 py-1 text-xs font-medium rounded-full ${badge.className}`}>
      {badge.text}
    </span>
  )
}

/**
 * Generate enhanced cell renderer with status badges for known fields
 */
export function generateEnhancedCellRenderer(
  order: Order,
  field: VisibleField,
  options: {
    compact?: boolean
    showTooltip?: boolean
    highlightSearch?: string
  } = {}
): React.ReactNode {
  // Helper: try multiple JSON paths in order and return first non-nullish value
  const getFirstValue = (paths: string[]): any => {
    for (const p of paths) {
      const v = getValueFromPath(order, p)
      if (v !== undefined && v !== null && String(v) !== '') return v
    }
    return undefined
  }
  // Special rendering for status fields
  if (field.key === 'fulfillmentStatus' || field.key === 'fulfillment_status') {
    // Try multiple paths to find the fulfillment status
    const value = getFirstValue(['fulfillment_status', 'fulfillmentStatus', 'fulfillment', field.path])
    if (value) return renderStatusBadge(String(value), 'fulfillment')
    // If still no value, try the Order type property directly
    if (order.fulfillmentStatus) return renderStatusBadge(String(order.fulfillmentStatus), 'fulfillment')
  }

  if (field.key === 'financialStatus' || field.key === 'financial_status' || field.key === 'paymentStatus') {
    // Try multiple paths to find the financial status
    const value = getFirstValue(['financial_status', 'financialStatus', 'paymentStatus', field.path])
    if (value) return renderStatusBadge(String(value), 'financial')
    // If still no value, try the Order type property directly
    if (order.financialStatus) return renderStatusBadge(String(order.financialStatus), 'financial')
  }

  if (field.key === 'deliveryStatus') {
    const value = getFirstValue(['delivery_status', 'deliveryStatus', field.path])
    if (value) return renderStatusBadge(String(value), 'delivery')
    // If still no value, try the Order type property directly
    if (order.deliveryStatus) return renderStatusBadge(String(order.deliveryStatus), 'delivery')
  }

  // Friendly fallbacks for common business columns
  if (field.key === 'name') {
    // Prefer true order name (e.g., "#INK5253"). If absent, synthesize from order number.
    const trueName = getFirstValue(['name', 'order_name'])
    if (trueName) return <span className="text-sm text-gray-900">{String(trueName)}</span>

    const numFallback = getFirstValue(['orderNumber', 'order_number', 'number'])
    if (numFallback !== undefined) {
      const s = String(numFallback)
      const display = s.startsWith('#') ? s : `#${s}`
      return <span className="text-sm text-gray-900">{display}</span>
    }
    return <span className="text-xs text-gray-400 italic">N/A</span>
  }

  if (field.key === 'email') {
    const value = getFirstValue(['email', 'contact_email', 'customer.email', 'customerEmail'])
    if (value) {
      const str = String(value)
      return (
        <div className="max-w-[220px] text-sm text-gray-900 truncate" title={str}>
          {str}
        </div>
      )
    }
    return <span className="text-xs text-gray-400 italic">N/A</span>
  }

  if (field.key === 'currentTotalPrice') {
    const value = getFirstValue([
      'current_total_price',
      'current_total_price_set.shop_money.amount',
      'total_price',
      'total'
    ])
    if (value !== undefined) {
      const num = typeof value === 'number' ? value : parseFloat(String(value))
      if (!isNaN(num)) {
        return <span className="text-sm font-medium text-gray-900">₹{num.toFixed(2)}</span>
      }
      return <span className="text-sm text-gray-900">{String(value)}</span>
    }
    return <span className="text-xs text-gray-400 italic">N/A</span>
  }

  // Customer name fallbacks (works for both nested and flattened shapes)
  if (field.key === 'customer.firstName' || field.path.endsWith('customer.first_name') || field.key === 'customerName') {
    const value = getFirstValue([
      'customer.first_name',
      'customer.firstName', 
      'shipping_address.first_name',
      'billing_address.first_name',
      'customerName', // Direct property
      'firstName', // Direct property
      'customer_name', // Alternative naming
      'first_name' // Alternative naming
    ])
    if (value) return <span className="text-sm text-gray-900">{String(value)}</span>
    
    // Final fallback: check Order object directly
    if (order.customerName) return <span className="text-sm text-gray-900">{String(order.customerName)}</span>
    if ((order as any).firstName) return <span className="text-sm text-gray-900">{String((order as any).firstName)}</span>
    
    return <span className="text-xs text-gray-400 italic">N/A</span>
  }

  if (field.key === 'customer.lastName' || field.path.endsWith('customer.last_name')) {
    const value = getFirstValue([
      'customer.last_name',
      'customer.lastName',
      'shipping_address.last_name',
      'billing_address.last_name'
    ])
    if (value) return <span className="text-sm text-gray-900">{String(value)}</span>
    return <span className="text-xs text-gray-400 italic">N/A</span>
  }

  // Special rendering/fallbacks for common columns that may live in multiple places
  if (field.key === 'phone') {
    // Root level phone, then customer.phone, then shipping/billing phones
    const value = getFirstValue([
      field.path, // typically 'phone'
      'customer.phone',
      'shipping_address.phone',
      'billing_address.phone'
    ])

    if (value) {
      return (
        <span className="text-sm text-gray-900">
          {String(value)}
        </span>
      )
    }
    return <span className="text-xs text-gray-400 italic">N/A</span>
  }

  // Channel/Source name fallback (API uses source_name, model uses channel)
  if (field.key === 'sourceName' || field.key.toLowerCase().includes('channel')) {
    const value = getFirstValue([
      'channel',
      'source_name',
      'sourceName'
    ])
    if (value) return <span className="text-sm text-gray-900">{String(value)}</span>
    return <span className="text-xs text-gray-400 italic">N/A</span>
  }

  // Generic email fallback for any email-like column keys/paths
  if (
    field.key.toLowerCase().includes('email') ||
    field.path.toLowerCase().endsWith('email')
  ) {
    const value = getFirstValue([
      field.path,
      'customerEmail',
      'email',
      'contact_email',
      'customer.email'
    ])
    if (value) {
      const str = String(value)
      return (
        <div className="max-w-[220px] text-sm text-gray-900 truncate" title={str}>
          {str}
        </div>
      )
    }
    return <span className="text-xs text-gray-400 italic">N/A</span>
  }

  // Special rendering for tags (handles both array and comma-separated string)
  if (field.key === 'tags') {
    const tagsValue = getValueFromPath(order, field.path)
    
    // Handle comma-separated string (API format)
    if (typeof tagsValue === 'string' && tagsValue.trim()) {
      const tags = tagsValue.split(',').map(t => t.trim()).filter(Boolean)
      if (tags.length > 0) {
        return (
          <div className="flex flex-wrap gap-1">
            {tags.slice(0, 2).map((tag, index) => (
              <span key={index} className="px-1.5 py-0.5 bg-blue-100 text-blue-700 text-xs rounded">
                {tag}
              </span>
            ))}
            {tags.length > 2 && (
              <span className="px-1.5 py-0.5 bg-blue-100 text-blue-700 text-xs rounded">
                +{tags.length - 2}
              </span>
            )}
          </div>
        )
      }
    }
    
    // Handle array format (if transformed)
    if (Array.isArray(tagsValue) && tagsValue.length > 0) {
      return (
        <div className="flex flex-wrap gap-1">
          {tagsValue.slice(0, 2).map((tag, index) => (
            <span key={index} className="px-1.5 py-0.5 bg-blue-100 text-blue-700 text-xs rounded">
              {tag}
            </span>
          ))}
          {tagsValue.length > 2 && (
            <span className="px-1.5 py-0.5 bg-blue-100 text-blue-700 text-xs rounded">
              +{tagsValue.length - 2}
            </span>
          )}
        </div>
      )
    }
  }

  // Default rendering
  return renderCellValue(order, field, options)
}

