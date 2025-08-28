import { Pin } from '../types'

export interface SearchSuggestion {
  id: string
  text: string
  type: 'pin' | 'board' | 'owner' | 'tag' | 'history'
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
  pins: Pin[],
  searchHistory: SearchHistory[],
  maxSuggestions: number = 10
): SearchSuggestion[] => {
  if (!query.trim()) {
    return getRecentSearches(searchHistory, 5)
  }

  const suggestions: SearchSuggestion[] = []
  const queryLower = query.toLowerCase()

  // 1. Pin title suggestions
  const pinSuggestions = pins
    .filter(pin => 
      (pin.title && pin.title.toLowerCase().includes(queryLower)) ||
      (pin.title && pin.title.toLowerCase().startsWith(queryLower))
    )
    .slice(0, 3)
    .map(pin => ({
      id: `pin-${pin.id}`,
      text: pin.title || 'Unknown Pin',
      type: 'pin' as const,
      icon: '📌'
    }))

  suggestions.push(...pinSuggestions)

  // 2. Board suggestions
  const boardSuggestions = Array.from(new Set(pins.map(p => p.board).filter(Boolean)))
    .filter(board => board && board.toLowerCase().includes(queryLower))
    .slice(0, 2)
    .map(board => ({
      id: `board-${board}`,
      text: board || 'Unknown Board',
      type: 'board' as const,
      icon: '📋'
    }))

  suggestions.push(...boardSuggestions)

  // 3. Owner suggestions
  const ownerSuggestions = Array.from(new Set(pins.map(p => p.owner).filter(Boolean)))
    .filter(owner => owner && owner.toLowerCase().includes(queryLower))
    .slice(0, 2)
    .map(owner => ({
      id: `owner-${owner}`,
      text: owner || 'Unknown Owner',
      type: 'owner' as const,
      icon: '👤'
    }))

  suggestions.push(...ownerSuggestions)

  // 4. Tag suggestions
  const allTags = pins.flatMap(p => p.tags || []).filter(Boolean)
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
      pins: Pin[],
      searchHistory: SearchHistory[]
    ) => {
      if (timeoutId) {
        clearTimeout(timeoutId)
      }

      // Always show suggestions immediately
      const suggestions = getSearchSuggestions(query, pins, searchHistory)
      
      if (query.trim().length === 0) {
        callback([], suggestions)
        return
      }

      // Debounce the actual search
      timeoutId = setTimeout(() => {
        if (query !== lastQuery) {
          lastQuery = query
          // The actual search will be handled by the existing filtering logic
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
