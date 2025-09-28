import { Pin } from '../types'

const BACKEND_URL = process.env.NEXT_PUBLIC_BACKEND_URL || 'https://brmh.in'

// Pinterest cache table and chunk behavior
const TABLE = 'pinterest_inkhub_get_pins'
const CHUNK_TTL_MS = 5 * 60 * 1000 // 5 minutes
const TOTAL_CHUNKS_TTL_MS = 10 * 60 * 1000 // 10 minutes
const CHUNK_TIMEOUT_MS = 30000

// In-memory caches
const chunkDataCache: Map<number, { data: Pin[]; timestamp: number }> = new Map()
const inflightChunkFetches: Map<number, Promise<Pin[]>> = new Map()
let cachedTotalChunks: { value: number; timestamp: number } | null = null

// Map raw pinterest item to Pin type
function mapRecordToPin(raw: any, idx: number): Pin {
  const item = raw?.Item || raw
  const media = item?.media || {}
  const images = media?.images || {}
  const imageUrl = images?.['600x']?.url || images?.['1200x']?.url || images?.['400x300']?.url || ''
  const owner = item?.board_owner?.username || ''

  // Handle potential pin_id object
  let pinId = item?.id || raw?.id || item?.pin_id || raw?.pin_id
  if (typeof pinId === 'object' && pinId !== null) {
    pinId = pinId.id || pinId.pin_id || JSON.stringify(pinId)
  }

  // Ensure all string fields are properly converted
  const title = item?.title || ''
  const description = item?.description || item?.note || ''
  const boardId = item?.board_id || ''
  const createdAt = item?.created_at || ''
  const updatedAt = raw?.timestamp || item?.updated_at || ''

  return {
    id: String(pinId || `pin-${Date.now()}-${idx}`),
    title: String(title),
    description: String(description),
    board: String(boardId),
    owner: String(owner),
    image: String(imageUrl),
    createdAt: String(createdAt),
    updatedAt: String(updatedAt),
    tags: Array.isArray(item?.product_tags) ? item.product_tags.map((tag: any) => String(tag)) : [],
    likes: Number(item?.likes || 0),
    comments: Number(item?.comments || 0),
    repins: Number(item?.repins || 0),
    saves: Number(item?.saves || 0),
    isStarred: Boolean(item?.isStarred || false),
    type: String(media?.media_type || 'image') as 'image' | 'video' | 'article',
    status: String(item?.status || 'active') as 'active' | 'archived'
  }
}

export const getTotalChunks = async (): Promise<number> => {
  if (cachedTotalChunks && Date.now() - cachedTotalChunks.timestamp < TOTAL_CHUNKS_TTL_MS) {
    return cachedTotalChunks.value
  }

  try {
    const keysUrl = `${BACKEND_URL}/cache/data?project=my-app&table=${TABLE}`
    const res = await fetch(keysUrl, { headers: { 'Accept': 'application/json' } })
    if (res.ok) {
      const json = await res.json()
      const count = Array.isArray(json?.keys) ? json.keys.length : 0
      if (count > 0) {
        cachedTotalChunks = { value: count, timestamp: Date.now() }
        return count
      }
    }
  } catch {}
  // Fallback
  cachedTotalChunks = { value: 1, timestamp: Date.now() }
  return 1
}

export const fetchChunk = async (chunkNumber: number, maxRetries: number = 3): Promise<Pin[]> => {
  const cached = chunkDataCache.get(chunkNumber)
  if (cached && Date.now() - cached.timestamp < CHUNK_TTL_MS) {
    return cached.data
  }

  const existing = inflightChunkFetches.get(chunkNumber)
  if (existing) return existing

  let retry = 0
  const promise = (async () => {
    while (retry < maxRetries) {
      try {
        const url = `${BACKEND_URL}/cache/data?project=my-app&table=${TABLE}&key=chunk:${chunkNumber}`
        const res = await fetch(url, { signal: AbortSignal.timeout(CHUNK_TIMEOUT_MS) })
        if (res.ok) {
          const json = await res.json()
          const rows = Array.isArray(json?.data) ? json.data : []
          const mapped = rows.map((r: any, idx: number) => mapRecordToPin(r, idx))
          chunkDataCache.set(chunkNumber, { data: mapped, timestamp: Date.now() })
          return mapped
        }
        retry++
        await new Promise(r => setTimeout(r, 500 * (retry + 1)))
      } catch (e) {
        if (retry === maxRetries - 1) throw e
        retry++
        await new Promise(r => setTimeout(r, 500 * (retry + 1)))
      }
    }
    throw new Error(`Failed to fetch pins chunk ${chunkNumber}`)
  })()

  inflightChunkFetches.set(chunkNumber, promise)
  try {
    return await promise
  } finally {
    inflightChunkFetches.delete(chunkNumber)
  }
}

export const getPinsForPage = async (pageNumber: number): Promise<{
  pins: Pin[]
  totalChunks: number
  currentChunk: number
  hasMore: boolean
}> => {
  const chunkNumber = pageNumber - 1
  const totalChunks = await getTotalChunks()
  if (chunkNumber >= totalChunks) {
    return { pins: [], totalChunks, currentChunk: chunkNumber, hasMore: false }
  }
  const pins = await fetchChunk(chunkNumber)
  const hasMore = chunkNumber < totalChunks - 1
  return { pins, totalChunks, currentChunk: chunkNumber, hasMore }
}


