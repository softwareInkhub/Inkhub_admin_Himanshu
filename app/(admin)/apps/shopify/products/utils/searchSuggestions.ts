import { Product } from '../types'

export interface SearchSuggestion {
  id: string
  text: string
  type: 'product' | 'vendor' | 'category' | 'tag' | 'history'
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
  products: Product[],
  searchHistory: SearchHistory[],
  maxSuggestions: number = 10
): SearchSuggestion[] => {
  if (!query.trim()) {
    return getRecentSearches(searchHistory, 5)
  }

  const suggestions: SearchSuggestion[] = []
  const queryLower = query.toLowerCase()

  // 1. Product title suggestions - with null safety
  const productSuggestions = products
    .filter(product => 
      (product.title && product.title.toLowerCase().includes(queryLower)) ||
      (product.title && product.title.toLowerCase().startsWith(queryLower))
    )
    .slice(0, 3)
    .map(product => ({
      id: `product-${product.id}`,
      text: product.title || 'Unknown Product',
      type: 'product' as const,
      icon: '📦'
    }))

  suggestions.push(...productSuggestions)

  // 2. Vendor suggestions - with null safety
  const vendorSuggestions = Array.from(new Set(products.map(p => p.vendor).filter(Boolean)))
    .filter(vendor => vendor && vendor.toLowerCase().includes(queryLower))
    .slice(0, 2)
    .map(vendor => ({
      id: `vendor-${vendor}`,
      text: vendor || 'Unknown Vendor',
      type: 'vendor' as const,
      icon: '🏢'
    }))

  suggestions.push(...vendorSuggestions)

  // 3. Category suggestions - with null safety
  const categorySuggestions = Array.from(new Set(products.map(p => p.category).filter(Boolean)))
    .filter((category): category is string => category !== undefined && category !== null && category.toLowerCase().includes(queryLower))
    .slice(0, 2)
    .map(category => ({
      id: `category-${category}`,
      text: category,
      type: 'category' as const,
      icon: '📂'
    }))

  suggestions.push(...categorySuggestions)

  // 4. Tag suggestions - with null safety
  const allTags = products.flatMap(p => p.tags || []).filter(Boolean)
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

  // 5. Search history suggestions
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
    index === self.findIndex(s => s.text.toLowerCase() === suggestion.text.toLowerCase())
  )

  return uniqueSuggestions.slice(0, maxSuggestions)
}

// Get recent searches for empty query
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
    query: query.trim(),
    timestamp: Date.now(),
    resultCount
  }

  // Remove existing entry with same query
  const filteredHistory = searchHistory.filter(h => h.query.toLowerCase() !== query.toLowerCase())
  
  // Add new entry at the beginning
  return [newHistory, ...filteredHistory].slice(0, 20) // Keep last 20 searches
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
      products: Product[],
      searchHistory: SearchHistory[]
    ) => {
      if (timeoutId) {
        clearTimeout(timeoutId)
      }

      // Always show suggestions immediately
      const suggestions = getSearchSuggestions(query, products, searchHistory)
      
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
