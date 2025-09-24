import { log } from 'console'
import { Order } from '../types'


const BACKEND_URL = process.env.NEXT_PUBLIC_BACKEND_URL || 'https://brmh.in'

// Configuration for pagination-based chunk fetching
const CHUNK_CONFIG = {
  ordersPerChunk: 500, // Each chunk contains 500 orders
  chunkTimeout: 30000, // 30 seconds timeout per chunk (avoid AbortError spam)
  maxRetries: 3
}

// Lightweight caching to prevent duplicate network calls (no UI changes)
const CHUNK_TTL_MS = 5 * 60 * 1000 // 5 minutes
const TOTAL_CHUNKS_TTL_MS = 10 * 60 * 1000 // 10 minutes

// In-memory caches
const chunkDataCache: Map<number, { data: Order[]; timestamp: number }> = new Map()
const inflightChunkFetches: Map<number, Promise<Order[]>> = new Map()
let cachedTotalChunks: { value: number; timestamp: number } | null = null

// Helper function to parse date strings
const parseDate = (dateStr: any): string => {
  if (!dateStr) return new Date().toISOString()
  try {
    const date = new Date(dateStr)
    return date.toISOString()
  } catch {
    return new Date().toISOString()
  }
}

// Helper function to map raw order data to Order type
const mapRecordToOrder = (raw: any, idx: number): Order => {
  const orderNumber = String(raw?.order_number ?? raw?.orderNumber ?? raw?.name ?? `#INK${Math.floor(Math.random() * 90000) + 10000}`)
  const customerName = String(raw?.customer?.first_name ?? raw?.customer?.last_name ?? raw?.customer_name ?? raw?.customerName ?? `Customer ${idx + 1}`)
  const customerEmail = String(raw?.customer?.email ?? raw?.customer_email ?? raw?.customerEmail ?? `customer${idx + 1}@example.com`)
  
  const financialStatus = String(raw?.financial_status ?? raw?.financialStatus ?? 'pending').toLowerCase()
  const fulfillmentStatus = String(raw?.fulfillment_status ?? raw?.fulfillmentStatus ?? 'unfulfilled').toLowerCase()
  
  const total = Number(raw?.total_price ?? raw?.totalPrice ?? raw?.total ?? 0) || 0
  const itemsCount = Array.isArray(raw?.line_items) ? raw.line_items.length : 1
  
  const tags = Array.isArray(raw?.tags) ? raw.tags : (typeof raw?.tags === 'string' ? raw.tags.split(',').map((t: string) => t.trim()).filter(Boolean) : [])
  
  const channel = String(raw?.source_name ?? raw?.sourceName ?? raw?.channel ?? 'Shopify')
  const deliveryMethod = String(raw?.shipping_lines?.[0]?.title ?? raw?.delivery_method ?? raw?.deliveryMethod ?? 'Standard Shipping')
  
  const deliveryStatus = fulfillmentStatus === 'fulfilled' ? 'Tracking added' : 'Pending'
  
  return {
    id: String(raw?.id ?? raw?.order_id ?? raw?.gid ?? `order-${Date.now()}-${idx}`),
    orderNumber,
    customerName,
    customerEmail,
    status: financialStatus as 'paid' | 'pending' | 'refunded',
    fulfillmentStatus: fulfillmentStatus as 'unfulfilled' | 'fulfilled' | 'partial',
    financialStatus: financialStatus as 'paid' | 'pending' | 'refunded',
    total,
    currency: String(raw?.currency ?? 'INR'),
    items: itemsCount,
    deliveryStatus,
    tags,
    channel,
    deliveryMethod,
    paymentStatus: financialStatus as 'paid' | 'pending' | 'refunded',
    createdAt: parseDate(raw?.created_at ?? raw?.createdAt),
    updatedAt: parseDate(raw?.updated_at ?? raw?.updatedAt),
    lineItems: Array.isArray(raw?.line_items) ? raw.line_items.map((item: any) => ({
      id: String(item?.id ?? `item-${Date.now()}-${idx}`),
      title: String(item?.title ?? item?.name ?? 'Unknown Product'),
      quantity: Number(item?.quantity ?? 1),
      price: Number(item?.price ?? 0),
      sku: String(item?.sku ?? ''),
      variantId: String(item?.variant_id ?? item?.variantId ?? '')
    })) : [],
    shippingAddress: raw?.shipping_address ? {
      firstName: String(raw.shipping_address?.first_name ?? ''),
      lastName: String(raw.shipping_address?.last_name ?? ''),
      address1: String(raw.shipping_address?.address1 ?? ''),
      address2: String(raw.shipping_address?.address2 ?? ''),
      city: String(raw.shipping_address?.city ?? ''),
      province: String(raw.shipping_address?.province ?? ''),
      country: String(raw.shipping_address?.country ?? ''),
      zip: String(raw.shipping_address?.zip ?? ''),
      phone: String(raw.shipping_address?.phone ?? '')
    } : undefined,
    billingAddress: raw?.billing_address ? {
      firstName: String(raw.billing_address?.first_name ?? ''),
      lastName: String(raw.billing_address?.last_name ?? ''),
      address1: String(raw.billing_address?.address1 ?? ''),
      address2: String(raw.billing_address?.address2 ?? ''),
      city: String(raw.billing_address?.city ?? ''),
      province: String(raw.billing_address?.province ?? ''),
      country: String(raw.billing_address?.country ?? ''),
      zip: String(raw.billing_address?.zip ?? ''),
      phone: String(raw.billing_address?.phone ?? '')
    } : undefined
  }
}

// Get total number of chunks available
export const getTotalChunks = async (): Promise<number> => {
  // Serve from in-memory cache if fresh
  if (cachedTotalChunks && Date.now() - cachedTotalChunks.timestamp < TOTAL_CHUNKS_TTL_MS) {
    return cachedTotalChunks.value
  }

  try {
    const keysUrl = `${BACKEND_URL}/cache/data?project=my-app&table=shopify-inkhub-get-orders`
    
    // Use a simple fetch without AbortController to avoid timeout issues
    // This prevents AbortError issues that were causing data loading failures
    const keysRes = await fetch(keysUrl, {
      headers: {
        'Accept': 'application/json',
        'Content-Type': 'application/json'
      }
    })
    
    if (keysRes.ok) {
      const keysJson = await keysRes.json()
      if (keysJson?.keys && Array.isArray(keysJson.keys)) {
        const count = keysJson.keys.length
        cachedTotalChunks = { value: count, timestamp: Date.now() }
        return count
      }
    }
    // Default to 140 (based on actual data structure: 139 full pages + 1 partial page); also cache default briefly to avoid spamming
    cachedTotalChunks = { value: 140, timestamp: Date.now() }
    return 140
  } catch (error) {
    // Network failed, use cached fallback or default
    if (cachedTotalChunks) return cachedTotalChunks.value
    return 140
  }
}

// Fetch a specific chunk by chunk number
export const fetchChunk = async (chunkNumber: number, maxRetries: number = 3): Promise<Order[]> => {
  // Serve fresh from in-memory cache
  const cached = chunkDataCache.get(chunkNumber)
  if (cached && Date.now() - cached.timestamp < CHUNK_TTL_MS) {
    return cached.data
  }

  // Deduplicate concurrent fetches for the same chunk
  const inflightExisting = inflightChunkFetches.get(chunkNumber)
  if (inflightExisting) return inflightExisting

  let retryCount = 0

  const promise = (async () => {
    while (retryCount < maxRetries) {
      try {
        const BACKEND_URL = process.env.NEXT_PUBLIC_BACKEND_URL || 'https://brmh.in'
        const chunkUrl = `${BACKEND_URL}/cache/data?project=my-app&table=shopify-inkhub-get-orders&key=chunk:${chunkNumber}`
        
        // Only log in development mode
        if (process.env.NODE_ENV === 'development') {
          console.log(`🔄 Fetching chunk ${chunkNumber}...`)
          console.log(`🔗 Chunk ${chunkNumber} URL: ${chunkUrl}`)
        }
        
        const chunkRes = await fetch(chunkUrl, { 
          signal: AbortSignal.timeout(CHUNK_CONFIG.chunkTimeout)
        })
        
        if (chunkRes.ok) {
          const chunkJson = await chunkRes.json()
          
          if (chunkJson?.data && Array.isArray(chunkJson.data)) {
            const mappedChunk = chunkJson.data.map((item: any, idx: number) => 
              mapRecordToOrder(item, idx)
            )
            
            // Only log in development mode
            if (process.env.NODE_ENV === 'development') {
              console.log(`✅ Successfully mapped ${mappedChunk.length} orders from chunk ${chunkNumber}`)
            }
            
            // Cache in memory
            chunkDataCache.set(chunkNumber, { data: mappedChunk, timestamp: Date.now() })
            return mappedChunk
          } else {
            console.warn(`⚠️ Chunk ${chunkNumber} has no valid data array:`, chunkJson)
            return []
          }
        } else {
          console.error(`❌ Chunk ${chunkNumber} fetch failed:`, chunkRes.status, chunkRes.statusText)
          if (retryCount === maxRetries - 1) {
            throw new Error(`Chunk ${chunkNumber} fetch failed (${chunkRes.status}): ${chunkRes.statusText}`)
          }
          retryCount++
          await new Promise(resolve => setTimeout(resolve, 1000 * (retryCount + 1))) // Reduced delay
        }
      } catch (error: any) {
        console.error(`❌ Chunk ${chunkNumber} fetch error (attempt ${retryCount + 1}):`, error.message)
        
        if (retryCount === maxRetries - 1) {
          throw error
        }
        
        retryCount++
        await new Promise(resolve => setTimeout(resolve, 1000 * (retryCount + 1))) // Reduced delay
      }
    }
    
    console.error(`💥 Final error: Failed to fetch chunk ${chunkNumber} after ${maxRetries} attempts`)
    throw new Error(`Failed to fetch chunk ${chunkNumber} after ${maxRetries} attempts`)
  })()

  inflightChunkFetches.set(chunkNumber, promise)
  try {
    const result = await promise
    return result
  } finally {
    inflightChunkFetches.delete(chunkNumber)
  }
}

// Get orders for a specific page (chunk-based pagination)
export const getOrdersForPage = async (pageNumber: number, itemsPerPage: number = 500): Promise<{
  orders: Order[]
  totalChunks: number
  currentChunk: number
  hasMore: boolean
}> => {
  console.log(`🔄 Getting orders for page ${pageNumber} (${itemsPerPage} items per page)...`)
  
  try {
    // Calculate which chunk this page corresponds to
    const chunkNumber = pageNumber - 1 // Page 1 = chunk 0, Page 2 = chunk 1, etc.
    console.log(`📊 Page ${pageNumber} corresponds to chunk ${chunkNumber}`)
    
    // Get total chunks for pagination info
    const totalChunks = await getTotalChunks()
    console.log(`📊 Total chunks available: ${totalChunks}`)
    
    // Check if chunk exists
    if (chunkNumber >= totalChunks) {
      console.log(`⚠️ Chunk ${chunkNumber} does not exist (max: ${totalChunks - 1})`)
      return {
        orders: [],
        totalChunks,
        currentChunk: chunkNumber,
        hasMore: false
      }
    }
    
    // Fetch the specific chunk
    const orders = await fetchChunk(chunkNumber)
    
    // Determine if there are more pages
    const hasMore = chunkNumber < totalChunks - 1
    
    console.log(`✅ Successfully loaded ${orders.length} orders for page ${pageNumber} (chunk ${chunkNumber})`)
    console.log(`📊 Has more pages: ${hasMore}`)
    
    return {
      orders,
      totalChunks,
      currentChunk: chunkNumber,
      hasMore
    }
    
  } catch (error: any) {
    console.error('💥 Error in getOrdersForPage:', error)
    // Ensure the error is properly thrown so the fallback can be triggered
    throw new Error(`Failed to load orders for page ${pageNumber}: ${error.message}`)
  }
}



// Get all orders from all chunks for comprehensive filtering
export const getAllOrdersForFiltering = async (): Promise<{
  orders: Order[]
  totalChunks: number
  totalOrders: number
}> => {
  console.log('🔄 Fetching all orders from all chunks for comprehensive filtering...')
  
  try {
    const totalChunks = await getTotalChunks()
    console.log(`📊 Total chunks to fetch: ${totalChunks}`)
    
    const allOrders: Order[] = []
    const errors: string[] = []
    
    // Fetch all chunks in parallel with controlled concurrency
    const batchSize = 10 // Process 10 chunks at a time to avoid overwhelming the server
    for (let batchStart = 0; batchStart < totalChunks; batchStart += batchSize) {
      const batchEnd = Math.min(batchStart + batchSize, totalChunks)
      console.log(`📦 Fetching chunks ${batchStart} to ${batchEnd - 1}...`)
      
      const batchPromises = []
      for (let chunkNumber = batchStart; chunkNumber < batchEnd; chunkNumber++) {
        batchPromises.push(
          fetchChunk(chunkNumber).catch(error => {
            console.warn(`⚠️ Failed to fetch chunk ${chunkNumber}:`, error)
            errors.push(`Chunk ${chunkNumber}: ${error.message}`)
            return [] // Return empty array for failed chunks
          })
        )
      }
      
      const batchResults = await Promise.all(batchPromises)
      
      // Flatten and add to allOrders
      batchResults.forEach(chunkOrders => {
        allOrders.push(...chunkOrders)
      })
      
      // Small delay between batches to be respectful to the server
      if (batchEnd < totalChunks) {
        await new Promise(resolve => setTimeout(resolve, 100))
      }
    }
    
    // Remove duplicates based on order ID
    const seenIds = new Set<string>()
    const deduplicatedOrders = allOrders.filter(order => {
      if (seenIds.has(order.id)) {
        return false
      }
      seenIds.add(order.id)
      return true
    })
    
    // Sort by date (newest first)
    const sortedOrders = deduplicatedOrders.sort((a, b) => {
      const dateA = new Date(a.createdAt || a.updatedAt || 0)
      const dateB = new Date(b.createdAt || b.updatedAt || 0)
      return dateB.getTime() - dateA.getTime()
    })
    
    console.log(`✅ Successfully loaded ${sortedOrders.length} orders from ${totalChunks} chunks`)
    if (errors.length > 0) {
      console.warn(`⚠️ Encountered ${errors.length} errors while fetching chunks:`, errors.slice(0, 3))
    }
    
    return {
      orders: sortedOrders,
      totalChunks,
      totalOrders: sortedOrders.length
    }
    
  } catch (error: any) {
    console.error('💥 Error in getAllOrdersForFiltering:', error)
    throw new Error(`Failed to fetch all orders: ${error.message}`)
  }
}

// Legacy function for backward compatibility (now fetches only chunk 0)
export const getTransformedOrders = async (): Promise<Order[]> => {
  console.log('🔄 Legacy getTransformedOrders called - fetching only chunk 0...')
  
  try {
    const result = await getOrdersForPage(1, 500)
    console.log('✅ Legacy function completed successfully')
    return result.orders
  } catch (error: any) {
    console.error('💥 Error in legacy getTransformedOrders:', error)
    throw error
  }
}
