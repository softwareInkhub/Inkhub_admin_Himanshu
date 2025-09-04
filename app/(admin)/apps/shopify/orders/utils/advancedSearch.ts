import { Order } from '../types'

// Column mapping for search queries - covers all table headers
const COLUMN_MAPPING: Record<string, keyof Order> = {
  // Order column
  'order': 'orderNumber',
  'ordernumber': 'orderNumber',
  'order_number': 'orderNumber',
  'number': 'orderNumber',
  
  // Status column
  'status': 'status',
  'orderstatus': 'status',
  
  // Customer column
  'customer': 'customerName',
  'customername': 'customerName',
  'customer_name': 'customerName',
  'name': 'customerName',
  
  // Total column
  'total': 'total',
  'amount': 'total',
  'price': 'total',
  'ordertotal': 'total',
  
  // Channel column
  'channel': 'channel',
  'source': 'channel',
  'platform': 'channel',
  
  // Delivery column
  'delivery': 'deliveryMethod',
  'deliverymethod': 'deliveryMethod',
  'delivery_method': 'deliveryMethod',
  'shipping': 'deliveryMethod',
  
  // Created column
  'created': 'createdAt',
  'createdat': 'createdAt',
  'created_at': 'createdAt',
  'datecreated': 'createdAt',
  
  // Updated column
  'updated': 'updatedAt',
  'updatedat': 'updatedAt',
  'updated_at': 'updatedAt',
  'dateupdated': 'updatedAt',
  'modified': 'updatedAt',
  
  // Additional fields
  'tag': 'tags',
  'tags': 'tags',
  'email': 'customerEmail',
  'customeremail': 'customerEmail',
  'customer_email': 'customerEmail',
  'id': 'id',
  'orderid': 'id',
  'serial': 'id' // For serial number searches
}

interface SearchCondition {
  column: string
  operator: string
  value: string | number | Date
  logicalOp?: 'AND' | 'OR'
}

interface ParsedQuery {
  conditions: SearchCondition[]
  isValid: boolean
  error?: string
}

// Parse advanced search query
export function parseAdvancedSearchQuery(query: string): ParsedQuery {
  if (!query.trim()) {
    return { conditions: [], isValid: false }
  }

  try {
    const conditions: SearchCondition[] = []
    
    // Check if query contains logical operators
    if (query.toUpperCase().includes(' AND ') || query.toUpperCase().includes(' OR ')) {
      const parts = query.split(/\s+(AND|OR)\s+/i)
      console.log('Split parts:', parts)
      
      for (let i = 0; i < parts.length; i += 2) {
        const conditionPart = parts[i]
        const logicalOp = parts[i + 1]?.toUpperCase() as 'AND' | 'OR'
        
        console.log('Processing part:', conditionPart, 'with logical op:', logicalOp)
        
        // Parse individual condition
        const condition = parseCondition(conditionPart)
        if (condition) {
          condition.logicalOp = logicalOp
          conditions.push(condition)
        }
      }
    } else {
      // Single condition without logical operators
      console.log('Single condition:', query)
      const condition = parseCondition(query)
      if (condition) {
        conditions.push(condition)
      }
    }

    // Debug logging
    console.log('Parsed query:', query, 'Conditions:', conditions)

    return {
      conditions,
      isValid: conditions.length > 0
    }
  } catch (error) {
    console.error('Parse error:', error)
    return {
      conditions: [],
      isValid: false,
      error: `Parse error: ${error}`
    }
  }
}

// Parse individual condition
function parseCondition(conditionStr: string): SearchCondition | null {
  console.log('Parsing condition:', conditionStr)
  
  // Handle quoted strings with column specification
  const quotedMatch = conditionStr.match(/^([^:]+):"([^"]+)"$/)
  if (quotedMatch) {
    const [, column, value] = quotedMatch
    const mappedColumn = COLUMN_MAPPING[column.toLowerCase()]
    if (mappedColumn) {
      console.log('Quoted match:', { column: mappedColumn, value })
      return {
        column: mappedColumn,
        operator: 'contains',
        value: value
      }
    }
  }

  // Handle column:value format
  const colonMatch = conditionStr.match(/^([^:]+):(.+)$/)
  if (colonMatch) {
    const [, column, value] = colonMatch
    const mappedColumn = COLUMN_MAPPING[column.toLowerCase()]
    if (mappedColumn) {
      console.log('Colon match:', { column: mappedColumn, value })
      return {
        column: mappedColumn,
        operator: 'contains',
        value: value.trim()
      }
    }
  }

  // Handle comparison operators with column specification
  const operatorMatch = conditionStr.match(/^([^<>=!]+)\s*(<|<=|>|>=|=|!=)\s*(.+)$/)
  if (operatorMatch) {
    const [, column, operator, value] = operatorMatch
    const mappedColumn = COLUMN_MAPPING[column.toLowerCase()]
    if (mappedColumn) {
      console.log('Operator match:', { column: mappedColumn, operator, value })
      return {
        column: mappedColumn,
        operator,
        value: value.trim()
      }
    }
  }

  // Handle direct data search (no column specification)
  // Check if it's a number (for total, serial comparisons)
  if (conditionStr.match(/^(<|<=|>|>=|=|!=)\s*\d+$/)) {
    // This is a numeric comparison without column - apply to total by default
    const operatorMatch = conditionStr.match(/^(<|<=|>|>=|=|!=)\s*(\d+)$/)
    if (operatorMatch) {
      const [, operator, value] = operatorMatch
      console.log('Numeric comparison:', { column: 'total', operator, value })
      return {
        column: 'total',
        operator,
        value: parseFloat(value)
      }
    }
  }

  // Check if it's a pure number (for total matching)
  if (conditionStr.match(/^\d+$/)) {
    console.log('Pure number:', { column: 'total', value: conditionStr })
    return {
      column: 'total',
      operator: '=',
      value: parseFloat(conditionStr)
    }
  }

  // Check if it's "X in stock" format (for order items)
  const inStockMatch = conditionStr.match(/^(\d+)\s+items$/i)
  if (inStockMatch) {
    const [, quantity] = inStockMatch
    console.log('Items match:', { column: 'items', value: quantity })
    return {
      column: 'items',
      operator: '=',
      value: parseInt(quantity)
    }
  }

  // Check if it's a date (YYYY-MM-DD format)
  if (conditionStr.match(/^\d{4}-\d{2}-\d{2}$/)) {
    console.log('Date match:', { column: 'createdAt', value: conditionStr })
    return {
      column: 'createdAt',
      operator: '=',
      value: conditionStr
    }
  }

  // Check if it's a date with comparison (e.g., >2024-01-01)
  if (conditionStr.match(/^(<|<=|>|>=|=|!=)\s*\d{4}-\d{2}-\d{2}$/)) {
    const operatorMatch = conditionStr.match(/^(<|<=|>|>=|=|!=)\s*(\d{4}-\d{2}-\d{2})$/)
    if (operatorMatch) {
      const [, operator, value] = operatorMatch
      console.log('Date comparison:', { column: 'createdAt', operator, value })
      return {
        column: 'createdAt',
        operator,
        value: value
      }
    }
  }

  // Handle direct text search (no column specification)
  // This will search across all text fields
  if (conditionStr.trim()) {
    console.log('Direct text search:', { column: 'all', value: conditionStr.trim() })
    return {
      column: 'all', // Special marker for searching all fields
      operator: 'contains',
      value: conditionStr.trim()
    }
  }

  console.log('No match found for:', conditionStr)
  return null
}

// Apply advanced search to orders
export function applyAdvancedSearch(orders: Order[], parsedQuery: ParsedQuery): Order[] {
  if (!parsedQuery.isValid || parsedQuery.conditions.length === 0) {
    return orders
  }

  return orders.filter(order => {
    if (parsedQuery.conditions.length === 1) {
      // Single condition
      return evaluateCondition(order, parsedQuery.conditions[0])
    }

    // Multiple conditions with logical operators
    let result = evaluateCondition(order, parsedQuery.conditions[0])
    
    for (let i = 1; i < parsedQuery.conditions.length; i++) {
      const condition = parsedQuery.conditions[i]
      const conditionResult = evaluateCondition(order, condition)
      
      if (condition.logicalOp === 'OR') {
        result = result || conditionResult
      } else {
        result = result && conditionResult
      }
    }

    return result
  })
}

// Evaluate single condition
function evaluateCondition(order: Order, condition: SearchCondition): boolean {
  const operator = condition.operator
  const searchValue = condition.value

  console.log('Evaluating condition:', { column: condition.column, operator, searchValue, orderNumber: order.orderNumber })

  // Handle 'all' column search (search across all text fields)
  if (condition.column === 'all') {
    const searchLower = String(searchValue).toLowerCase()
    
    const result = (
      order.orderNumber.toLowerCase().includes(searchLower) ||
      order.customerName.toLowerCase().includes(searchLower) ||
      order.customerEmail.toLowerCase().includes(searchLower) ||
      order.status.toLowerCase().includes(searchLower) ||
      order.fulfillmentStatus.toLowerCase().includes(searchLower) ||
      order.financialStatus.toLowerCase().includes(searchLower) ||
      (order.channel?.toLowerCase() || '').includes(searchLower) ||
      (order.deliveryMethod?.toLowerCase() || '').includes(searchLower) ||
      order.tags?.some(tag => tag.toLowerCase().includes(searchLower)) ||
      String(order.total).includes(searchLower) ||
      String(order.items).includes(searchLower) ||
      new Date(order.createdAt).toLocaleDateString().toLowerCase().includes(searchLower) ||
      new Date(order.updatedAt).toLocaleDateString().toLowerCase().includes(searchLower)
    )
    
    console.log('All column search result:', result, 'for search:', searchLower)
    return result
  }

  const orderValue = order[condition.column as keyof Order]
  
  if (orderValue === undefined || orderValue === null) {
    return false
  }

  // Handle different data types
  const column = condition.column as keyof Order
  
  // Date fields (Created, Updated)
  if (column === 'createdAt' || column === 'updatedAt') {
    const orderDate = new Date(orderValue as string)
    const searchDate = new Date(searchValue as string)
    
    switch (operator) {
      case '=':
      case ':':
        return orderDate.toDateString() === searchDate.toDateString()
      case '!=':
        return orderDate.toDateString() !== searchDate.toDateString()
      case '<':
        return orderDate < searchDate
      case '<=':
        return orderDate <= searchDate
      case '>':
        return orderDate > searchDate
      case '>=':
        return orderDate >= searchDate
      case 'contains':
      default:
        return orderDate.toLocaleDateString().toLowerCase().includes(String(searchValue).toLowerCase())
    }
  }
  
  // Numeric fields (Total, Items)
  if (column === 'total' || column === 'items') {
    const orderNum = Number(orderValue)
    const searchNum = Number(searchValue)
    
    switch (operator) {
      case '=':
      case ':':
        return orderNum === searchNum
      case '!=':
        return orderNum !== searchNum
      case '<':
        return orderNum < searchNum
      case '<=':
        return orderNum <= searchNum
      case '>':
        return orderNum > searchNum
      case '>=':
        return orderNum >= searchNum
      case 'contains':
      default:
        return String(orderNum).includes(String(searchValue))
    }
  }
  
  // Array fields (Tags)
  if (Array.isArray(orderValue)) {
    switch (operator) {
      case '=':
      case ':':
        return orderValue.some(item => String(item).toLowerCase() === String(searchValue).toLowerCase())
      case '!=':
        return !orderValue.some(item => String(item).toLowerCase() === String(searchValue).toLowerCase())
      case 'contains':
      default:
        return orderValue.some(item => String(item).toLowerCase().includes(String(searchValue).toLowerCase()))
    }
  }
  
  // String fields (OrderNumber, CustomerName, Status, etc.)
  switch (operator) {
    case '=':
    case ':':
      return String(orderValue).toLowerCase() === String(searchValue).toLowerCase()
    case '!=':
      return String(orderValue).toLowerCase() !== String(searchValue).toLowerCase()
    case 'contains':
    default:
      return String(orderValue).toLowerCase().includes(String(searchValue).toLowerCase())
  }
}

// Get search suggestions
export function getSearchSuggestions(query: string): string[] {
  if (!query.trim()) {
    return [
      'paid AND >1000',
      'pending AND <500',
      'John OR Jane',
      '>100 AND <1000',
      '2024-01-01 AND paid',
      'featured OR trending'
    ]
  }
  return []
}

// Debounce function with cancel method
export function debounce<T extends (...args: any[]) => any>(
  func: T,
  wait: number
): ((...args: Parameters<T>) => void) & { cancel: () => void } {
  let timeout: NodeJS.Timeout
  
  const debounced = (...args: Parameters<T>) => {
    clearTimeout(timeout)
    timeout = setTimeout(() => func(...args), wait)
  }
  
  debounced.cancel = () => {
    clearTimeout(timeout)
  }
  
  return debounced
}
