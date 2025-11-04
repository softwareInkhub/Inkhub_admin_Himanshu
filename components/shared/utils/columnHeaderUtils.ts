/**
 * Utility functions for generating column header configurations
 * Makes column headers reusable across all pages
 */

export interface ColumnHeaderConfig {
  key: string
  label: string
  hasFilter?: boolean
  sortable?: boolean
  filterType?: 'text' | 'select' | 'multi-select' | 'numeric' | 'date'
  options?: string[]
}

/**
 * Auto-generates column header configuration from column key
 */
export function generateColumnHeader(key: string, customLabel?: string): ColumnHeaderConfig {
  const label = (customLabel || key).toUpperCase()
  
  // Auto-detect filter type based on column key
  let filterType: 'text' | 'select' | 'multi-select' | 'numeric' | 'date' = 'text'
  let options: string[] | undefined = undefined
  
  // Numeric fields
  if (['price', 'quantity', 'inventory', 'inventoryQuantity', 'stock', 'total', 'totalPrice', 
       'likes', 'comments', 'repins', 'pinCount', 'followerCount', 'collaborators', 
       'fileSize', 'size', 'views', 'downloads', 'amount', 'count'].includes(key)) {
    filterType = 'numeric'
  }
  // Date fields
  else if (['createdAt', 'updatedAt', 'publishedAt', 'date', 'created', 'updated'].includes(key)) {
    filterType = 'date'
  }
  // Status fields (single select)
  else if (key === 'status') {
    filterType = 'select'
    options = ['active', 'draft', 'archived']
  }
  else if (key === 'privacy') {
    filterType = 'select'
    options = ['public', 'private', 'protected']
  }
  else if (key === 'paymentStatus') {
    filterType = 'select'
    options = ['pending', 'paid', 'refunded', 'failed']
  }
  else if (key === 'fulfillmentStatus') {
    filterType = 'select'
    options = ['pending', 'fulfilled', 'shipped', 'delivered']
  }
  else if (key === 'type' && !key.includes('product')) {
    filterType = 'select'
    options = ['image', 'video', 'document', 'audio']
  }
  // Multi-select fields
  else if (['productType', 'vendor', 'category', 'tags', 'board', 'channel', 'boards', 'categories'].includes(key)) {
    filterType = 'multi-select'
  }
  
  return {
    key,
    label,
    hasFilter: true,
    sortable: true,
    filterType,
    options
  }
}

/**
 * Generates column headers for Products page
 */
export function generateProductColumnHeaders(): ColumnHeaderConfig[] {
  return [
    generateColumnHeader('title', 'PRODUCT'),
    generateColumnHeader('status', 'STATUS'),
    generateColumnHeader('inventoryQuantity', 'INVENTORY'),
    generateColumnHeader('price', 'PRICE'),
    generateColumnHeader('productType', 'TYPE'),
    generateColumnHeader('vendor', 'VENDOR'),
    generateColumnHeader('category', 'CATEGORY'),
    generateColumnHeader('createdAt', 'CREATED'),
    generateColumnHeader('updatedAt', 'UPDATED'),
  ]
}

/**
 * Generates column headers for Orders page
 */
export function generateOrderColumnHeaders(): ColumnHeaderConfig[] {
  return [
    generateColumnHeader('orderNumber', 'ORDER'),
    generateColumnHeader('customer', 'CUSTOMER'),
    generateColumnHeader('totalPrice', 'TOTAL'),
    generateColumnHeader('status', 'STATUS'),
    generateColumnHeader('channel', 'CHANNEL'),
    generateColumnHeader('paymentStatus', 'PAYMENT'),
    generateColumnHeader('fulfillmentStatus', 'FULFILLMENT'),
    generateColumnHeader('createdAt', 'CREATED'),
  ]
}

/**
 * Generates column headers for Pins page
 */
export function generatePinColumnHeaders(): ColumnHeaderConfig[] {
  return [
    generateColumnHeader('title', 'PIN'),
    generateColumnHeader('board', 'BOARD'),
    generateColumnHeader('owner', 'OWNER'),
    generateColumnHeader('likes', 'LIKES'),
    generateColumnHeader('comments', 'COMMENTS'),
    generateColumnHeader('repins', 'REPINS'),
    generateColumnHeader('createdAt', 'CREATED'),
    generateColumnHeader('updatedAt', 'UPDATED'),
  ]
}

/**
 * Generates column headers for Boards page
 */
export function generateBoardColumnHeaders(): ColumnHeaderConfig[] {
  return [
    generateColumnHeader('name', 'BOARD'),
    generateColumnHeader('owner', 'OWNER'),
    generateColumnHeader('privacy', 'PRIVACY'),
    generateColumnHeader('pinCount', 'PINS'),
    generateColumnHeader('followerCount', 'FOLLOWERS'),
    generateColumnHeader('collaborators', 'COLLABORATORS'),
    generateColumnHeader('createdAt', 'CREATED'),
    generateColumnHeader('updatedAt', 'UPDATED'),
  ]
}

/**
 * Generates column headers for Designs page
 */
export function generateDesignColumnHeaders(): ColumnHeaderConfig[] {
  return [
    generateColumnHeader('name', 'DESIGN'),
    generateColumnHeader('category', 'CATEGORY'),
    generateColumnHeader('tags', 'TAGS'),
    generateColumnHeader('dimensions', 'DIMENSIONS'),
    generateColumnHeader('fileSize', 'SIZE'),
    generateColumnHeader('status', 'STATUS'),
    generateColumnHeader('createdAt', 'CREATED'),
    generateColumnHeader('updatedAt', 'UPDATED'),
  ]
}

/**
 * Generates column headers for Content Library page
 */
export function generateContentColumnHeaders(): ColumnHeaderConfig[] {
  return [
    generateColumnHeader('title', 'CONTENT'),
    generateColumnHeader('type', 'TYPE'),
    generateColumnHeader('category', 'CATEGORY'),
    generateColumnHeader('tags', 'TAGS'),
    generateColumnHeader('status', 'STATUS'),
    generateColumnHeader('size', 'SIZE'),
    generateColumnHeader('createdAt', 'CREATED'),
    generateColumnHeader('updatedAt', 'UPDATED'),
  ]
}

/**
 * Generic function to generate column headers from column definitions
 */
export function generateColumnHeadersFromColumns(columns: Array<{ key: string; label?: string }>): ColumnHeaderConfig[] {
  return columns
    .filter((col) => col.key !== 'actions' && col.key !== 'select') // Skip action columns
    .map((col) => generateColumnHeader(col.key, col.label))
}

