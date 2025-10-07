import { Board } from '../types'

const BACKEND_URL = process.env.NEXT_PUBLIC_BACKEND_URL || 'https://brmh.in'

// Helper function to check if we should log (development mode only)
const shouldLog = (): boolean => {
  return process.env.NODE_ENV === 'development'
}

// Configuration for boards fetching
const BOARDS_CONFIG = {
  timeout: 10000, // 10 second timeout
  maxRetries: 2,
  cacheTimeout: 5 * 60 * 1000, // 5 minutes cache
}

// In-memory cache for boards data
const boardsCache = new Map<string, { data: Board[]; timestamp: number }>()

// Map API response to Board interface
const mapApiResponseToBoard = (item: any, index: number): Board => {
  const boardData = item.Item || item
  
  return {
    id: item.id || `board-${index}`,
    name: boardData.name || 'Untitled Board',
    description: boardData.description || '',
    owner: boardData.owner?.username || 'unknown',
    privacy: (boardData.privacy || 'PUBLIC').toLowerCase() as 'public' | 'private',
    pinCount: boardData.pin_count || 0,
    followers: boardData.follower_count || 0,
    image: boardData.media?.image_cover_url || boardData.media?.pin_thumbnail_urls?.[0] || '',
    createdAt: boardData.created_at || new Date().toISOString(),
    updatedAt: boardData.board_pins_modified_at || new Date().toISOString(),
    tags: [], // Pinterest API doesn't provide tags in this response
    isStarred: false, // Default to false
    category: 'Uncategorized', // Default category
    status: 'active' as const, // Default to active
    selected: false
  }
}

// Fetch boards data from API (optimized: cache-first + parallel keys)
export const fetchBoards = async (): Promise<Board[]> => {
  try {
    const cacheKey = 'pinterest-boards'

    // 1) Cache-first: in-memory
    const cached = boardsCache.get(cacheKey)
    if (cached && (Date.now() - cached.timestamp) < BOARDS_CONFIG.cacheTimeout) {
      if (shouldLog()) console.log('📦 Using cached boards data (memory)')
      return cached.data
    }

    // 2) Cache-first: localStorage (lightweight)
    if (typeof window !== 'undefined') {
      const ls = localStorage.getItem(cacheKey)
      if (ls) {
        try {
          const parsed = JSON.parse(ls)
          if (parsed?.timestamp && (Date.now() - parsed.timestamp) < BOARDS_CONFIG.cacheTimeout && Array.isArray(parsed.data)) {
            const lsBoards: Board[] = parsed.data
            boardsCache.set(cacheKey, { data: lsBoards, timestamp: parsed.timestamp })
            if (shouldLog()) console.log('⚡ Using cached boards data (localStorage)')
            // Trigger background refresh without blocking
            setTimeout(() => { fetchBoards().catch(() => {}) }, 0)
            return lsBoards
          }
        } catch {}
      }
    }

    if (shouldLog()) console.log('🔄 Fetching Pinterest boards from API (parallel keys)...')

    // 3) Discover available keys to avoid 404 noise
    let keys: string[] = []
    try {
      const keysUrl = `${BACKEND_URL}/cache/data?project=my-app&table=pinterest_inkhub_main_get_boards`
      const keysRes = await fetch(keysUrl, { headers: { 'Accept': 'application/json' }, signal: AbortSignal.timeout(4000) })
      if (keysRes.ok) {
        const keysJson = await keysRes.json()
        const rawKeys: string[] = Array.isArray(keysJson?.keys) ? keysJson.keys : []
        // Normalize keys like "my-app:table:chunk:0" → "chunk:0"
        const normalize = (k: string) => {
          const parts = String(k).split(':')
          return parts.length >= 2 ? `${parts[parts.length - 2]}:${parts[parts.length - 1]}` : String(k)
        }
        const availableSet = new Set(rawKeys.map(normalize))
        const available = Array.from(availableSet)
        const priority = ['all', 'boards', 'chunk:0', 'chunk:1', 'chunk:2', 'chunk:3', 'chunk:4']
        keys = priority.filter(k => available.includes(k))
        if (keys.length === 0 && available.length > 0) {
          keys = [available[0]]
        }
      }
    } catch {}
    // If discovery yielded nothing, fall back to a small set of chunk keys only
    if (!keys || keys.length === 0) {
      keys = ['chunk:0', 'chunk:1', 'chunk:2', 'chunk:3', 'chunk:4']
    }

    const reqs = keys.map((key) => {
      const url = `${BACKEND_URL}/cache/data?project=my-app&table=pinterest_inkhub_main_get_boards&key=${key}`
      return fetch(url, {
        signal: AbortSignal.timeout(BOARDS_CONFIG.timeout),
        headers: { 'Accept': 'application/json', 'Content-Type': 'application/json' }
      }).then(async (res) => {
        if (!res.ok) throw new Error(`HTTP ${res.status}`)
        const json = await res.json()
        if (!json?.data || !Array.isArray(json.data)) throw new Error('Invalid data payload')
        return { key, data: json.data }
      })
    })

    const promiseAny = async <T,>(promises: Promise<T>[]): Promise<T> => new Promise((resolve, reject) => {
      let rejected = 0
      const n = promises.length
      if (n === 0) return reject(new Error('No requests'))
      promises.forEach(p => p.then(resolve).catch(() => { rejected++; if (rejected === n) reject(new Error('All failed')) }))
    })

    const { key: winningKey, data } = await promiseAny(reqs)

    const boards = (data as any[]).map((item: any, index: number) => mapApiResponseToBoard(item, index))

    // Save caches
    boardsCache.set(cacheKey, { data: boards, timestamp: Date.now() })
    if (typeof window !== 'undefined') {
      try { localStorage.setItem(cacheKey, JSON.stringify({ data: boards, timestamp: Date.now(), key: winningKey })) } catch {}
    }

    if (shouldLog()) console.log(`✅ Boards fetched via key "${winningKey}":`, boards.length)

    return boards

  } catch (error: any) {
    if (shouldLog()) {
      console.error('❌ Error fetching Pinterest boards:', error?.message || error)
    }
    // Propagate error so UI can show an error state instead of empty page
    throw error
  }
}

// Get total number of boards
export const getTotalBoards = async (): Promise<number> => {
  try {
    const boards = await fetchBoards()
    return boards.length
  } catch (error) {
    if (shouldLog()) {
      console.error('❌ Error getting total boards:', error)
    }
    return 0
  }
}

// Calculate KPI metrics from boards data
export const calculateBoardsKPIs = (boards: Board[]) => {
  const totalBoards = boards.length
  const publicBoards = boards.filter(board => board.privacy === 'public').length
  const privateBoards = boards.filter(board => board.privacy === 'private').length
  const totalPins = boards.reduce((sum, board) => sum + board.pinCount, 0)
  const totalFollowers = boards.reduce((sum, board) => sum + board.followers, 0)
  const averagePinsPerBoard = totalBoards > 0 ? Math.round(totalPins / totalBoards) : 0
  const uniqueCategories = new Set(boards.map(board => board.category || 'Uncategorized')).size

  return {
    totalBoards: {
      value: totalBoards,
      change: 0, // No change data available from API
      trend: 'neutral' as const
    },
    totalPins: {
      value: totalPins,
      change: 0,
      trend: 'neutral' as const
    },
    totalFollowers: {
      value: totalFollowers,
      change: 0,
      trend: 'neutral' as const
    },
    publicBoards: {
      value: publicBoards,
      change: 0,
      trend: 'neutral' as const
    },
    avgPinsPerBoard: {
      value: averagePinsPerBoard,
      change: 0,
      trend: 'neutral' as const
    },
    activeCategories: {
      value: uniqueCategories,
      change: 0,
      trend: 'neutral' as const
    }
  }
}

// Clear boards cache
export const clearBoardsCache = (): void => {
  boardsCache.clear()
  if (shouldLog()) {
    console.log('🗑️ Boards cache cleared')
  }
}

// Test API connectivity
export const testBoardsAPI = async (): Promise<{ success: boolean; message: string; data?: any }> => {
  try {
    const url = `${BACKEND_URL}/cache/data?project=my-app&table=pinterest_inkhub_main_get_boards&key=chunk:0`
    
    if (shouldLog()) {
      console.log('🧪 Testing Pinterest boards API connectivity...')
      console.log('🔗 Test URL:', url)
    }
    
    const response = await fetch(url, {
      headers: {
        'Accept': 'application/json',
        'Content-Type': 'application/json'
      },
      signal: AbortSignal.timeout(5000) // 5 second timeout for test
    })
    
    if (!response.ok) {
      return {
        success: false,
        message: `HTTP ${response.status}: ${response.statusText}`
      }
    }
    
    const json = await response.json()
    
    return {
      success: true,
      message: `API working. Response has ${json?.data?.length || 0} boards`,
      data: {
        hasData: !!json?.data,
        dataType: Array.isArray(json?.data) ? 'array' : typeof json?.data,
        dataLength: Array.isArray(json?.data) ? json.data.length : 'N/A',
        sampleItem: json?.data?.[0] ? 'has sample' : 'no sample'
      }
    }
    
  } catch (error: any) {
    return {
      success: false,
      message: `Network error: ${error.message}`
    }
  }
}
