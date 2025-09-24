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

// Ultra-fast search suggestions with optimized performance
export const getSearchSuggestions = (
  query: string,
  orders: Order[],
  searchHistory: SearchHistory[],
  maxSuggestions: number = 8 // Reduced for faster processing
): SearchSuggestion[] => {
  if (!query.trim()) {
    return getRecentSearches(searchHistory, 5)
  }

  const suggestions: SearchSuggestion[] = []
  const queryLower = query.toLowerCase()
  
  // Limit order processing for better performance
  const limitedOrders = orders.slice(0, 1000) // Process only first 1000 orders for speed

  // 1. Serial number suggestions - optimized
  if (/^\d/.test(queryLower)) { // Only check if query starts with a number
    const serialNumberSuggestions = limitedOrders
      .map((order, index) => ({
        order,
        serialNumber: index + 1
      }))
      .filter(({ serialNumber }) => serialNumber.toString().includes(queryLower))
      .slice(0, 2) // Reduced for performance
      .map(({ order, serialNumber }) => ({
        id: `serial-${serialNumber}`,
        text: `Order #${serialNumber}`,
        type: 'serialNumber' as const,
        icon: '🔢'
      }))

    suggestions.push(...serialNumberSuggestions)
  }

  // 2. Order number suggestions - optimized with early exit
  const orderNumberSuggestions = []
  for (const order of limitedOrders) {
    if (orderNumberSuggestions.length >= 2) break // Early exit
    if (order.orderNumber && order.orderNumber.toLowerCase().includes(queryLower)) {
      orderNumberSuggestions.push({
        id: `order-${order.id}`,
        text: order.orderNumber,
        type: 'order' as const,
        icon: '📦'
      })
    }
  }
  suggestions.push(...orderNumberSuggestions)

  // 3. Customer name suggestions - optimized with early exit
  const customerSuggestions = []
  for (const order of limitedOrders) {
    if (customerSuggestions.length >= 2) break // Early exit
    if (order.customerName && order.customerName.toLowerCase().includes(queryLower)) {
      customerSuggestions.push({
        id: `customer-${order.id}`,
        text: order.customerName,
        type: 'customer' as const,
        icon: '👤'
      })
    }
  }
  suggestions.push(...customerSuggestions)

  // 4. Status suggestions - optimized with Set for deduplication
  const statusSet = new Set<string>()
  for (const order of limitedOrders) {
    if (statusSet.size >= 2) break // Early exit
    if (order.status && order.status.toLowerCase().includes(queryLower)) {
      statusSet.add(order.status)
    }
  }
  const statusSuggestions = Array.from(statusSet).map(status => ({
    id: `status-${status}`,
    text: status,
    type: 'status' as const,
    icon: '📊'
  }))
  suggestions.push(...statusSuggestions)

  // 5. Tag suggestions - optimized with early exit
  const tagSet = new Set<string>()
  for (const order of limitedOrders) {
    if (tagSet.size >= 2) break // Early exit
    if (Array.isArray(order.tags)) {
      for (const tag of order.tags) {
        if (tag && tag.toLowerCase().includes(queryLower)) {
          tagSet.add(tag)
          if (tagSet.size >= 2) break
        }
      }
    }
  }
  const tagSuggestions = Array.from(tagSet).map(tag => ({
    id: `tag-${tag}`,
    text: tag,
    type: 'tag' as const,
    icon: '🏷️'
  }))
  suggestions.push(...tagSuggestions)

  // 6. Search history suggestions - optimized
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

  // Remove duplicates using Map for better performance
  const uniqueMap = new Map<string, SearchSuggestion>()
  for (const suggestion of suggestions) {
    if (!uniqueMap.has(suggestion.text)) {
      uniqueMap.set(suggestion.text, suggestion)
    }
  }

  return Array.from(uniqueMap.values()).slice(0, maxSuggestions)
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

// Ultra-fast debounced search with optimized suggestions
export const createDebouncedSearch = (delay: number = 200) => { // Reduced delay for faster response
  let timeoutId: NodeJS.Timeout | null = null
  let lastQuery = ''
  let suggestionCache = new Map<string, SearchSuggestion[]>()
  const SUGGESTION_CACHE_TTL = 30 * 1000 // 30 seconds cache for suggestions

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

      // Check suggestion cache first for instant response
      const cacheKey = query.toLowerCase()
      const cachedSuggestions = suggestionCache.get(cacheKey)
      
      let suggestions: SearchSuggestion[]
      if (cachedSuggestions) {
        suggestions = cachedSuggestions
      } else {
        // Generate suggestions and cache them
        suggestions = getSearchSuggestions(query, orders, searchHistory)
        suggestionCache.set(cacheKey, suggestions)
        
        // Clean up cache periodically
        setTimeout(() => suggestionCache.delete(cacheKey), SUGGESTION_CACHE_TTL)
      }
      
      if (query.trim().length === 0) {
        callback([], suggestions)
        return
      }

      // Debounce the actual search with reduced delay
      timeoutId = setTimeout(() => {
        if (query !== lastQuery) {
          lastQuery = query
          // The actual search will be handled by the existing ultra-fast search
          callback([], suggestions)
        }
      }, delay)
    },

    cancel: () => {
      if (timeoutId) {
        clearTimeout(timeoutId)
        timeoutId = null
      }
    },

    clearCache: () => {
      suggestionCache.clear()
    }
  }
}
