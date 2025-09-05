import { Board } from '../types'

const BACKEND_URL = process.env.NEXT_PUBLIC_BACKEND_URL || 'https://brmh.in'
const TABLE = 'pinterest_inkhub_main_get_boards'
const CHUNK_TIMEOUT_MS = 30000
const CHUNK_TTL_MS = 5 * 60 * 1000
const TOTAL_TTL_MS = 10 * 60 * 1000

const chunkCache: Map<number, { data: Board[]; ts: number }> = new Map()
const inflight: Map<number, Promise<Board[]>> = new Map()
let cachedTotal: { value: number; ts: number } | null = null

function mapRecordToBoard(raw: any): Board {
  const item = raw?.Item || raw
  const cover = item?.media?.image_cover_url
  const thumbnails = Array.isArray(item?.media?.pin_thumbnail_urls) ? item.media.pin_thumbnail_urls : []
  const image = cover || thumbnails[0] || ''
  const privacyRaw = String(item?.privacy || 'PUBLIC').toLowerCase()

  return {
    id: String(item?.id || raw?.id || ''),
    name: String(item?.name || ''),
    description: String(item?.description || ''),
    owner: String(item?.owner?.username || ''),
    privacy: (privacyRaw === 'public' ? 'public' : 'private') as 'public' | 'private',
    pinCount: Number(item?.pin_count || 0),
    followers: Number(item?.follower_count || 0),
    image,
    createdAt: String(item?.created_at || ''),
    updatedAt: String(raw?.timestamp || ''),
    tags: [],
    isStarred: false,
    category: undefined,
    status: 'active'
  }
}

export async function getTotalChunks(): Promise<number> {
  if (cachedTotal && Date.now() - cachedTotal.ts < TOTAL_TTL_MS) return cachedTotal.value
  try {
    const url = `${BACKEND_URL}/cache/data?project=my-app&table=${TABLE}`
    const res = await fetch(url, { headers: { 'Accept': 'application/json' } })
    if (res.ok) {
      const json = await res.json()
      const n = Array.isArray(json?.keys) ? json.keys.length : 0
      cachedTotal = { value: Math.max(1, n), ts: Date.now() }
      return cachedTotal.value
    }
  } catch {}
  cachedTotal = { value: 1, ts: Date.now() }
  return 1
}

export async function fetchChunk(chunkNumber: number): Promise<Board[]> {
  const cached = chunkCache.get(chunkNumber)
  if (cached && Date.now() - cached.ts < CHUNK_TTL_MS) return cached.data
  const existing = inflight.get(chunkNumber)
  if (existing) return existing

  const promise = (async () => {
    const url = `${BACKEND_URL}/cache/data?project=my-app&table=${TABLE}&key=chunk:${chunkNumber}`
    const res = await fetch(url, { signal: AbortSignal.timeout(CHUNK_TIMEOUT_MS) })
    if (res.ok) {
      const json = await res.json()
      const rows = Array.isArray(json?.data) ? json.data : []
      const mapped = rows.map((r: any) => mapRecordToBoard(r))
      chunkCache.set(chunkNumber, { data: mapped, ts: Date.now() })
      return mapped
    }
    return []
  })()

  inflight.set(chunkNumber, promise)
  try {
    return await promise
  } finally {
    inflight.delete(chunkNumber)
  }
}

export async function getBoardsForPage(pageNumber: number): Promise<{
  boards: Board[]
  totalChunks: number
  currentChunk: number
  hasMore: boolean
}> {
  const chunk = pageNumber - 1
  const total = await getTotalChunks()
  if (chunk >= total) return { boards: [], totalChunks: total, currentChunk: chunk, hasMore: false }
  const boards = await fetchChunk(chunk)
  return { boards, totalChunks: total, currentChunk: chunk, hasMore: chunk < total - 1 }
}


