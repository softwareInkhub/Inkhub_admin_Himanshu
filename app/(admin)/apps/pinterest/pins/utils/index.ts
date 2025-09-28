import { Pin, KPIMetrics } from '../types'

// Generate optimized image URLs with compression
export const getOptimizedImageUrl = (baseUrl: string, width: number, height: number, quality: number = 80) => {
  // For Picsum, we can add compression parameters
  if (baseUrl.includes('picsum.photos')) {
    return `${baseUrl}?compress=1&quality=${quality}`
  }
  return baseUrl
}

// ⚠️ WARNING: This function generates SAMPLE data and should NOT be used in production
// Only real Pinterest data from the server API should be displayed
// This is kept for development/testing purposes only
export const generatePins = (count: number): Pin[] => {
  console.warn('⚠️ generatePins() called - This creates SAMPLE data, not real Pinterest data!')
  console.warn('📌 Production should only use real data from: https://brmh.in/cache/data?project=my-app&table=pinterest_inkhub_get_pins')
  const owners = ['alice', 'bob', 'carol', 'dave', 'eve', 'frank', 'grace', 'henry', 'iris', 'jack']
  const boards = ['Inspiration', 'Recipes', 'Travel', 'DIY', 'Fashion', 'Art', 'Tech', 'Home', 'Beauty', 'Fitness']
  const types: Pin['type'][] = ['image', 'video', 'article']
  const statuses: Pin['status'][] = ['active', 'archived']
  const tags = ['featured', 'trending', 'popular', 'new', 'creative', 'inspiration', 'design', 'art', 'photography', 'lifestyle', 'food', 'travel', 'fashion', 'beauty', 'home', 'diy']
  
  // Use a fixed base date for deterministic date generation
  const baseDate = new Date('2024-01-01T00:00:00Z').getTime()
  
  return Array.from({ length: count }, (_, i) => {
    const seed = i + 1
    const likes = ((seed * 123) % 5000) + 10
    const comments = ((seed * 456) % 500) + 5
    const repins = ((seed * 789) % 1000) + 20
    const saves = ((seed * 321) % 200) + 5
    const boardIndex = seed % boards.length
    const ownerIndex = seed % owners.length
    const typeIndex = seed % types.length
    const statusIndex = seed % statuses.length
    
    // Generate deterministic tags
    const pinTags = tags.filter((_, tagIndex) => (seed + tagIndex) % 3 === 0).slice(0, 4)
    
    // Generate realistic pin titles for first 30 pins
    let title = `Pin ${i + 1}`
    if (i < 30) {
      const titles = [
        'Amazing Sunset Photography',
        'Delicious Chocolate Cake Recipe',
        'Minimalist Home Decor Ideas',
        'Summer Fashion Trends 2024',
        'Easy DIY Wall Art',
        'Healthy Breakfast Bowl',
        'Travel Photography Tips',
        'Modern Kitchen Design',
        'Beauty Routine for Glowing Skin',
        'Creative Art Projects',
        'Cozy Living Room Setup',
        'Quick Dinner Recipes',
        'Nature Photography',
        'Fashion Style Guide',
        'Home Organization Tips',
        'Delicious Smoothie Recipes',
        'Travel Destination Guide',
        'Interior Design Inspiration',
        'Skincare Routine',
        'Creative Craft Ideas',
        'Garden Design Tips',
        'Quick Lunch Ideas',
        'Street Photography',
        'Fashion Accessories',
        'Home Renovation Ideas',
        'Healthy Snack Recipes',
        'Adventure Travel',
        'Modern Bedroom Design',
        'Makeup Tutorial',
        'DIY Gift Ideas'
      ]
      title = titles[i] || title
    }
    
    return {
      id: `pin-${i + 1}`,
      title,
      description: `This is a ${boards[boardIndex].toLowerCase()} pin with amazing ${boards[boardIndex].toLowerCase()} content.`,
      board: boards[boardIndex],
      owner: owners[ownerIndex],
      image: `https://picsum.photos/seed/pin${seed}/400/300`,
      createdAt: new Date(baseDate - (seed * 24 * 60 * 60 * 1000)).toISOString(),
      updatedAt: new Date(baseDate - (seed * 7 * 24 * 60 * 60 * 1000)).toISOString(),
      tags: pinTags,
      likes,
      comments,
      repins,
      saves,
      isStarred: (seed % 7) === 0,
      type: types[typeIndex],
      status: statuses[statusIndex]
    }
  })
}

// Calculate KPI metrics from pins data
export const calculateKPIMetrics = (pins: Pin[]): KPIMetrics => {
  const totalPins = pins.length
  const imagePins = pins.filter(pin => pin.type === 'image').length
  const videoPins = pins.filter(pin => pin.type === 'video').length
  const articlePins = pins.filter(pin => pin.type === 'article').length
  const totalLikes = pins.reduce((sum, pin) => sum + pin.likes, 0)
  const totalComments = pins.reduce((sum, pin) => sum + pin.comments, 0)
  const totalRepins = pins.reduce((sum, pin) => sum + pin.repins, 0)
  const averageEngagement = totalPins > 0 ? Math.round((totalLikes + totalComments + totalRepins) / totalPins) : 0

  // Use deterministic change values
  const baseChange = 15 // Fixed change value for consistency
  
  return {
    totalPins: {
      value: totalPins,
      change: baseChange,
      trend: 'up' as const
    },
    imagePins: {
      value: imagePins,
      change: baseChange + 3,
      trend: 'up' as const
    },
    videoPins: {
      value: videoPins,
      change: baseChange + 8,
      trend: 'up' as const
    },
    articlePins: {
      value: articlePins,
      change: baseChange - 2,
      trend: 'down' as const
    },
    totalLikes: {
      value: totalLikes,
      change: baseChange + 5,
      trend: 'up' as const
    },
    totalComments: {
      value: totalComments,
      change: baseChange + 7,
      trend: 'up' as const
    },
    totalRepins: {
      value: totalRepins,
      change: baseChange + 4,
      trend: 'up' as const
    },
    averageEngagement: {
      value: averageEngagement,
      change: baseChange + 2,
      trend: 'up' as const
    }
  }
}

// Get unique values for a specific field
export const getUniqueValues = (pins: Pin[], field: string): string[] => {
  const values = pins.map(pin => pin[field as keyof Pin]).filter(Boolean)
  return Array.from(new Set(values.map(String)))
}

// Get unique tags from all pins
export const getUniqueTags = (pins: Pin[]): string[] => {
  const allTags = pins.flatMap(pin => pin.tags)
  return Array.from(new Set(allTags))
}

// Get status badge styling
export const getStatusBadge = (status: string, type: 'status' | 'type') => {
  if (type === 'status') {
    switch (status) {
      case 'active':
        return { className: "inline-flex px-2 py-1 text-xs font-medium rounded-full bg-green-100 text-green-800", text: "Active" }
      case 'archived':
        return { className: "inline-flex px-2 py-1 text-xs font-medium rounded-full bg-gray-100 text-gray-800", text: "Archived" }
      default:
        return { className: "inline-flex px-2 py-1 text-xs font-medium rounded-full bg-gray-100 text-gray-800", text: status }
    }
  } else if (type === 'type') {
    switch (status) {
      case 'image':
        return { className: "inline-flex px-2 py-1 text-xs font-medium rounded-full bg-blue-100 text-blue-800", text: "Image" }
      case 'video':
        return { className: "inline-flex px-2 py-1 text-xs font-medium rounded-full bg-purple-100 text-purple-800", text: "Video" }
      case 'article':
        return { className: "inline-flex px-2 py-1 text-xs font-medium rounded-full bg-orange-100 text-orange-800", text: "Article" }
      default:
        return { className: "inline-flex px-2 py-1 text-xs font-medium rounded-full bg-gray-100 text-gray-800", text: status }
    }
  }
  return { className: "inline-flex px-2 py-1 text-xs font-medium rounded-full bg-gray-100 text-gray-800", text: status }
}

// Filter pins based on various criteria
export const filterPins = (
  pins: Pin[],
  activeFilter: string,
  searchQuery: string,
  columnFilters: Record<string, any>,
  advancedFilters?: {
    type: string[]
    board: string[]
    likeRange: { min: string; max: string }
    commentRange: { min: string; max: string }
    repinRange: { min: string; max: string }
    dateRange: { start: string; end: string }
    tags: string[]
    owners: string[]
  }
): Pin[] => {
  let filtered = pins

  // Apply active filter
  if (activeFilter !== 'all') {
    switch (activeFilter) {
      case 'image':
        filtered = filtered.filter(pin => pin.type === 'image')
        break
      case 'video':
        filtered = filtered.filter(pin => pin.type === 'video')
        break
      case 'article':
        filtered = filtered.filter(pin => pin.type === 'article')
        break
      case 'starred':
        filtered = filtered.filter(pin => pin.isStarred)
        break
      case 'active':
        filtered = filtered.filter(pin => pin.status === 'active')
        break
      case 'archived':
        filtered = filtered.filter(pin => pin.status === 'archived')
        break
    }
  }

  // Apply search query
  if (searchQuery) {
    const query = searchQuery.toLowerCase()
    filtered = filtered.filter(pin =>
      pin.title.toLowerCase().includes(query) ||
      pin.description.toLowerCase().includes(query) ||
      pin.board.toLowerCase().includes(query) ||
      pin.owner.toLowerCase().includes(query) ||
      pin.tags.some(tag => tag.toLowerCase().includes(query))
    )
  }

  // Apply column filters
  Object.entries(columnFilters).forEach(([column, value]) => {
    if (value && value !== '') {
      if (Array.isArray(value) && value.length > 0) {
        filtered = filtered.filter(pin => {
          const pinValue = pin[column as keyof Pin]
          return Array.isArray(pinValue) 
            ? value.some((v: string) => pinValue.includes(v))
            : value.includes(String(pinValue))
        })
      } else if (typeof value === 'string') {
        filtered = filtered.filter(pin => {
          const pinValue = String(pin[column as keyof Pin] || '').toLowerCase()
          return pinValue.includes(value.toLowerCase())
        })
      }
    }
  })

  // Apply advanced filters
  if (advancedFilters) {
    // Type filter
    if (advancedFilters.type.length > 0) {
      filtered = filtered.filter(pin => advancedFilters.type.includes(pin.type || 'image'))
    }

    // Board filter
    if (advancedFilters.board.length > 0) {
      filtered = filtered.filter(pin => advancedFilters.board.includes(pin.board))
    }

    // Like count range
    if (advancedFilters.likeRange.min) {
      filtered = filtered.filter(pin => pin.likes >= parseInt(advancedFilters.likeRange.min))
    }
    if (advancedFilters.likeRange.max) {
      filtered = filtered.filter(pin => pin.likes <= parseInt(advancedFilters.likeRange.max))
    }

    // Comment count range
    if (advancedFilters.commentRange.min) {
      filtered = filtered.filter(pin => pin.comments >= parseInt(advancedFilters.commentRange.min))
    }
    if (advancedFilters.commentRange.max) {
      filtered = filtered.filter(pin => pin.comments <= parseInt(advancedFilters.commentRange.max))
    }

    // Repin count range
    if (advancedFilters.repinRange.min) {
      filtered = filtered.filter(pin => pin.repins >= parseInt(advancedFilters.repinRange.min))
    }
    if (advancedFilters.repinRange.max) {
      filtered = filtered.filter(pin => pin.repins <= parseInt(advancedFilters.repinRange.max))
    }

    // Date range
    if (advancedFilters.dateRange.start) {
      filtered = filtered.filter(pin => new Date(pin.createdAt) >= new Date(advancedFilters.dateRange.start))
    }
    if (advancedFilters.dateRange.end) {
      filtered = filtered.filter(pin => new Date(pin.createdAt) <= new Date(advancedFilters.dateRange.end))
    }

    // Tags filter
    if (advancedFilters.tags.length > 0) {
      filtered = filtered.filter(pin => 
        advancedFilters.tags.some(tag => pin.tags.includes(tag))
      )
    }

    // Owners filter
    if (advancedFilters.owners.length > 0) {
      filtered = filtered.filter(pin => advancedFilters.owners.includes(pin.owner))
    }
  }

  return filtered
}
