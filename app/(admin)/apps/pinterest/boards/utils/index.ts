import { Board, KPIMetrics } from '../types'

// Generate optimized image URLs with compression
export const getOptimizedImageUrl = (baseUrl: string, width: number, height: number, quality: number = 80) => {
  // For Picsum, we can add compression parameters
  if (baseUrl.includes('picsum.photos')) {
    return `${baseUrl}?compress=1&quality=${quality}`
  }
  return baseUrl
}

// Generate sample boards data with more realistic Pinterest data
export const generateBoards = (count: number): Board[] => {
  const owners = ['alice', 'bob', 'carol', 'dave', 'eve', 'frank', 'grace', 'henry', 'iris', 'jack']
  const privacies: Board['privacy'][] = ['public', 'private']
  const categories = ['Inspiration', 'Recipes', 'Travel', 'DIY', 'Fashion', 'Art', 'Tech', 'Home', 'Beauty', 'Fitness']
  const statuses: Board['status'][] = ['active', 'archived']
  const tags = ['featured', 'trending', 'popular', 'new', 'creative', 'inspiration', 'design', 'art', 'photography', 'lifestyle']
  
  // Use a fixed base date for deterministic date generation
  const baseDate = new Date('2024-01-01T00:00:00Z').getTime()
  
  return Array.from({ length: count }, (_, i) => {
    const seed = i + 1
    const pinCount = ((seed * 123) % 500) + 10
    const followers = ((seed * 456) % 5000) + 50
    const privacyIndex = seed % privacies.length
    const ownerIndex = seed % owners.length
    const categoryIndex = seed % categories.length
    const statusIndex = seed % statuses.length
    
    // Generate deterministic tags
    const boardTags = tags.filter((_, tagIndex) => (seed + tagIndex) % 2 === 0).slice(0, 3)
    
    // Generate realistic board names for first 20 boards
    let name = `Board ${i + 1}`
    if (i < 20) {
      const names = [
        'Creative Inspiration',
        'Travel Dreams',
        'Delicious Recipes',
        'DIY Projects',
        'Fashion Trends',
        'Art Gallery',
        'Tech Ideas',
        'Home Decor',
        'Beauty Tips',
        'Fitness Goals',
        'Photography',
        'Interior Design',
        'Cooking Masterclass',
        'Style Guide',
        'Craft Ideas',
        'Digital Art',
        'Lifestyle',
        'Architecture',
        'Nature Beauty',
        'Urban Style'
      ]
      name = names[i] || name
    }
    
    return {
      id: `board-${i + 1}`,
      name,
      description: `This is a ${categories[categoryIndex].toLowerCase()} board with amazing ${categories[categoryIndex].toLowerCase()} content.`,
      owner: owners[ownerIndex],
      privacy: privacies[privacyIndex],
      pinCount,
      followers,
      image: `https://picsum.photos/seed/board${seed}/400/300`,
      createdAt: new Date(baseDate - (seed * 24 * 60 * 60 * 1000)).toISOString(),
      updatedAt: new Date(baseDate - (seed * 7 * 24 * 60 * 60 * 1000)).toISOString(),
      tags: boardTags,
      isStarred: (seed % 5) === 0,
      category: categories[categoryIndex],
      status: statuses[statusIndex]
    }
  })
}

// Calculate KPI metrics from boards data
export const calculateKPIMetrics = (boards: Board[]): KPIMetrics => {
  const totalBoards = boards.length
  const publicBoards = boards.filter(board => board.privacy === 'public').length
  const privateBoards = boards.filter(board => board.privacy === 'private').length
  const totalPins = boards.reduce((sum, board) => sum + board.pinCount, 0)
  const totalFollowers = boards.reduce((sum, board) => sum + board.followers, 0)
  const averagePinsPerBoard = totalBoards > 0 ? Math.round(totalPins / totalBoards) : 0

  // Use deterministic change values
  const baseChange = 12 // Fixed change value for consistency
  
  return {
    totalBoards: {
      value: totalBoards,
      change: baseChange,
      trend: 'up' as const
    },
    publicBoards: {
      value: publicBoards,
      change: baseChange + 2,
      trend: 'up' as const
    },
    privateBoards: {
      value: privateBoards,
      change: baseChange - 3,
      trend: 'down' as const
    },
    totalPins: {
      value: totalPins,
      change: baseChange + 5,
      trend: 'up' as const
    },
    totalFollowers: {
      value: totalFollowers,
      change: baseChange + 8,
      trend: 'up' as const
    },
    averagePinsPerBoard: {
      value: averagePinsPerBoard,
      change: baseChange - 1,
      trend: 'neutral' as const
    }
  }
}

// Get unique values for a specific field
export const getUniqueValues = (boards: Board[], field: string): string[] => {
  const values = boards.map(board => board[field as keyof Board]).filter(Boolean)
  return Array.from(new Set(values.map(String)))
}

// Get unique tags from all boards
export const getUniqueTags = (boards: Board[]): string[] => {
  const allTags = boards.flatMap(board => board.tags)
  return Array.from(new Set(allTags))
}

// Get status badge styling
export const getStatusBadge = (status: string, type: 'status' | 'privacy') => {
  if (type === 'status') {
    switch (status) {
      case 'active':
        return { className: "inline-flex px-2 py-1 text-xs font-medium rounded-full bg-green-100 text-green-800", text: "Active" }
      case 'archived':
        return { className: "inline-flex px-2 py-1 text-xs font-medium rounded-full bg-gray-100 text-gray-800", text: "Archived" }
      default:
        return { className: "inline-flex px-2 py-1 text-xs font-medium rounded-full bg-gray-100 text-gray-800", text: status }
    }
  } else if (type === 'privacy') {
    switch (status) {
      case 'public':
        return { className: "inline-flex px-2 py-1 text-xs font-medium rounded-full bg-blue-100 text-blue-800", text: "Public" }
      case 'private':
        return { className: "inline-flex px-2 py-1 text-xs font-medium rounded-full bg-orange-100 text-orange-800", text: "Private" }
      default:
        return { className: "inline-flex px-2 py-1 text-xs font-medium rounded-full bg-gray-100 text-gray-800", text: status }
    }
  }
  return { className: "inline-flex px-2 py-1 text-xs font-medium rounded-full bg-gray-100 text-gray-800", text: status }
}

// Filter boards based on various criteria
export const filterBoards = (
  boards: Board[],
  activeFilter: string,
  searchQuery: string,
  columnFilters: Record<string, any>,
  advancedFilters?: {
    privacy: string[]
    pinRange: { min: string; max: string }
    followerRange: { min: string; max: string }
    dateRange: { start: string; end: string }
    tags: string[]
    owners: string[]
  }
): Board[] => {
  let filtered = boards

  // Apply active filter
  if (activeFilter !== 'all') {
    switch (activeFilter) {
      case 'public':
        filtered = filtered.filter(board => board.privacy === 'public')
        break
      case 'private':
        filtered = filtered.filter(board => board.privacy === 'private')
        break
      case 'starred':
        filtered = filtered.filter(board => board.isStarred)
        break
      case 'active':
        filtered = filtered.filter(board => board.status === 'active')
        break
      case 'archived':
        filtered = filtered.filter(board => board.status === 'archived')
        break
    }
  }

  // Apply search query
  if (searchQuery) {
    const query = searchQuery.toLowerCase()
    filtered = filtered.filter(board =>
      board.name.toLowerCase().includes(query) ||
      board.description.toLowerCase().includes(query) ||
      board.owner.toLowerCase().includes(query) ||
      board.tags.some(tag => tag.toLowerCase().includes(query))
    )
  }

  // Apply column filters
  Object.entries(columnFilters).forEach(([column, value]) => {
    if (value && value !== '') {
      if (Array.isArray(value) && value.length > 0) {
        filtered = filtered.filter(board => {
          const boardValue = board[column as keyof Board]
          return Array.isArray(boardValue) 
            ? value.some((v: string) => boardValue.includes(v))
            : value.includes(String(boardValue))
        })
      } else if (typeof value === 'string') {
        filtered = filtered.filter(board => {
          const boardValue = String(board[column as keyof Board] || '').toLowerCase()
          return boardValue.includes(value.toLowerCase())
        })
      }
    }
  })

  // Apply advanced filters
  if (advancedFilters) {
    // Privacy filter
    if (advancedFilters.privacy.length > 0) {
      filtered = filtered.filter(board => advancedFilters.privacy.includes(board.privacy))
    }

    // Pin count range
    if (advancedFilters.pinRange.min) {
      filtered = filtered.filter(board => board.pinCount >= parseInt(advancedFilters.pinRange.min))
    }
    if (advancedFilters.pinRange.max) {
      filtered = filtered.filter(board => board.pinCount <= parseInt(advancedFilters.pinRange.max))
    }

    // Follower count range
    if (advancedFilters.followerRange.min) {
      filtered = filtered.filter(board => board.followers >= parseInt(advancedFilters.followerRange.min))
    }
    if (advancedFilters.followerRange.max) {
      filtered = filtered.filter(board => board.followers <= parseInt(advancedFilters.followerRange.max))
    }

    // Date range
    if (advancedFilters.dateRange.start) {
      filtered = filtered.filter(board => new Date(board.createdAt) >= new Date(advancedFilters.dateRange.start))
    }
    if (advancedFilters.dateRange.end) {
      filtered = filtered.filter(board => new Date(board.createdAt) <= new Date(advancedFilters.dateRange.end))
    }

    // Tags filter
    if (advancedFilters.tags.length > 0) {
      filtered = filtered.filter(board => 
        advancedFilters.tags.some(tag => board.tags.includes(tag))
      )
    }

    // Owners filter
    if (advancedFilters.owners.length > 0) {
      filtered = filtered.filter(board => advancedFilters.owners.includes(board.owner))
    }
  }

  return filtered
}
