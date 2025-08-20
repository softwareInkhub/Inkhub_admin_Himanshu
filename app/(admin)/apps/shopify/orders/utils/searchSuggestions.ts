import { Order } from '../types'

export interface SearchSuggestion {
  id: string
  text: string
  type: 'order' | 'customer' | 'status' | 'tag' | 'history' | 'serialNumber'
  count?: number
  icon?: string
}

export interface SearchHistory {
  query: string
  timestamp: number
  resultCount: number
}

// Get search suggestions based on current input and available data
export const getSearchSuggestions = (
  query: string,
  orders: Order[],
  searchHistory: SearchHistory[],
  maxSuggestions: number = 10
): SearchSuggestion[] => {
  if (!query.trim()) {
    return getRecentSearches(searchHistory, 5)
  }

  const suggestions: SearchSuggestion[] = []
  const queryLower = query.toLowerCase()

  // 1. Serial number suggestions
  const serialNumberSuggestions = orders
    .map((order, index) => ({
      order,
      serialNumber: index + 1
    }))
    .filter(({ serialNumber }) => serialNumber.toString().includes(queryLower))
    .slice(0, 3)
    .map(({ order, serialNumber }) => ({
      id: `serial-${serialNumber}`,
      text: `Order #${serialNumber}`,
      type: 'serialNumber' as const,
      icon: '🔢'
    }))

  suggestions.push(...serialNumberSuggestions)

  // 2. Order number suggestions - with null safety
  const orderNumberSuggestions = orders
    .filter(order => 
      (order.orderNumber && order.orderNumber.toLowerCase().includes(queryLower)) ||
      (order.orderNumber && order.orderNumber.toLowerCase().startsWith(queryLower))
    )
    .slice(0, 3)
    .map(order => ({
      id: `order-${order.id}`,
      text: order.orderNumber || 'Unknown Order',
      type: 'order' as const,
      icon: '📦'
    }))

  suggestions.push(...orderNumberSuggestions)

  // 3. Customer name suggestions - with null safety
  const customerSuggestions = orders
    .filter(order => 
      (order.customerName && order.customerName.toLowerCase().includes(queryLower)) ||
      (order.customerName && order.customerName.toLowerCase().startsWith(queryLower))
    )
    .slice(0, 2)
    .map(order => ({
      id: `customer-${order.id}`,
      text: order.customerName || 'Unknown Customer',
      type: 'customer' as const,
      icon: '👤'
    }))

  suggestions.push(...customerSuggestions)

  // 4. Status suggestions - with null safety
  const statusSuggestions = Array.from(new Set(orders.map(o => o.status).filter(Boolean)))
    .filter(status => status && status.toLowerCase().includes(queryLower))
    .slice(0, 2)
    .map(status => ({
      id: `status-${status}`,
      text: status || 'Unknown Status',
      type: 'status' as const,
      icon: '📊'
    }))

  suggestions.push(...statusSuggestions)

  // 5. Tag suggestions - with null safety
  const allTags = orders.flatMap(o => o.tags || []).filter(Boolean)
  const tagSuggestions = Array.from(new Set(allTags))
    .filter(tag => tag && tag.toLowerCase().includes(queryLower))
    .slice(0, 2)
    .map(tag => ({
      id: `tag-${tag}`,
      text: tag || 'Unknown Tag',
      type: 'tag' as const,
      icon: '🏷️'
    }))

  suggestions.push(...tagSuggestions)

  // 6. Search history suggestions
  const historySuggestions = searchHistory
    .filter(history => history.query && history.query.toLowerCase().includes(queryLower))
    .slice(0, 2)
    .map(history => ({
      id: `history-${history.query}`,
      text: history.query,
      type: 'history' as const,
      icon: '🕒'
    }))

  suggestions.push(...historySuggestions)

  // Remove duplicates and limit results
  const uniqueSuggestions = suggestions.filter((suggestion, index, self) => 
    index === self.findIndex(s => s.text === suggestion.text)
  )

  return uniqueSuggestions.slice(0, maxSuggestions)
}

// Get recent searches from history
export const getRecentSearches = (
  searchHistory: SearchHistory[],
  maxResults: number = 5
): SearchSuggestion[] => {
  return searchHistory
    .sort((a, b) => b.timestamp - a.timestamp)
    .slice(0, maxResults)
    .map(history => ({
      id: `history-${history.query}`,
      text: history.query,
      type: 'history' as const,
      icon: '🕒'
    }))
}

// Save search to history
export const saveSearchToHistory = (
  query: string,
  resultCount: number,
  searchHistory: SearchHistory[]
): SearchHistory[] => {
  const newHistory: SearchHistory = {
    query,
    timestamp: Date.now(),
    resultCount
  }

  // Remove existing entry with same query
  const filteredHistory = searchHistory.filter(h => h.query !== query)
  
  // Add new entry at the beginning
  return [newHistory, ...filteredHistory].slice(0, 10) // Keep only last 10 searches
}

// Get popular searches (based on frequency)
export const getPopularSearches = (
  searchHistory: SearchHistory[],
  maxResults: number = 5
): SearchSuggestion[] => {
  const queryCounts = searchHistory.reduce((acc, history) => {
    const query = history.query.toLowerCase()
    acc[query] = (acc[query] || 0) + 1
    return acc
  }, {} as Record<string, number>)

  return Object.entries(queryCounts)
    .sort(([, a], [, b]) => b - a)
    .slice(0, maxResults)
    .map(([query, count]) => ({
      id: `popular-${query}`,
      text: query,
      type: 'history' as const,
      icon: '🔥',
      count
    }))
}

// Debounced search with suggestions
export const createDebouncedSearch = (delay: number = 300) => {
  let timeoutId: NodeJS.Timeout | null = null
  let lastQuery = ''

  return {
    search: (
      query: string,
      callback: (results: any[], suggestions: SearchSuggestion[]) => void,
      orders: Order[],
      searchHistory: SearchHistory[]
    ) => {
      if (timeoutId) {
        clearTimeout(timeoutId)
      }

      // Always show suggestions immediately
      const suggestions = getSearchSuggestions(query, orders, searchHistory)
      
      if (query.trim().length === 0) {
        callback([], suggestions)
        return
      }

      // Debounce the actual search
      timeoutId = setTimeout(() => {
        if (query !== lastQuery) {
          lastQuery = query
          // The actual search will be handled by the existing Algolia search
          callback([], suggestions)
        }
      }, delay)
    },

    cancel: () => {
      if (timeoutId) {
        clearTimeout(timeoutId)
        timeoutId = null
      }
    }
  }
}
