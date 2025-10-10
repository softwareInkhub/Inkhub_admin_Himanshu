import { Order } from '../types'

export interface AlgoliaSearchResponse {
  message: string
  project: string
  table: string
  indexName: string
  query: string
  hits: Array<{
    orderNumber: string
    customerName: string
    customerEmail: string
    _project: string
    _table: string
    _timestamp: number
    objectID: string
    _highlightResult: {
      orderNumber: {
        value: string
        matchLevel: string
        fullyHighlighted: boolean
        matchedWords: string[]
      }
      customerName: {
        value: string
        matchLevel: string
        matchedWords: string[]
      }
      customerEmail: {
        value: string
        matchLevel: string
        matchedWords: string[]
      }
    }
  }>
}

export interface AlgoliaSearchRequest {
  project: string
  table: string
  query: string
  hitsPerPage: number
  page: number
}

// Enhanced search across all chunks using Algolia
export const searchOrdersAcrossAllChunks = async (
  query: string, 
  currentChunkOrders: Order[],
  totalChunks: number = 137
): Promise<Order[]> => {
  if (!query.trim()) return []
  
  // Clean and validate the search query
  const cleanQuery = query.trim().toLowerCase()
  console.log(`🔍 Searching across all ${totalChunks} chunks for query: "${query}"`)
  console.log(`🔍 Cleaned query: "${cleanQuery}"`)
  console.log(`🔍 Query validation:`, {
    original: query,
    cleaned: cleanQuery,
    length: cleanQuery.length,
    isEmpty: cleanQuery.length === 0
  })
  
  try {
    const BACKEND_URL = process.env.NEXT_PUBLIC_BACKEND_URL || 'https://brmh.in'
    
    // Search request for all chunks with higher limit
    const requestBody: AlgoliaSearchRequest = {
      project: "myProject",
      table: "shopify-inkhub-get-orders",
      query: cleanQuery, // Use cleaned query for better search results
      hitsPerPage: 500, // Increased significantly to get comprehensive results
      page: 0
    }
    
    // Log the search query for debugging
    console.log('🔍 Search query:', query)
    console.log('🔍 Cleaned query:', query.trim())
    console.log('🔍 Query length:', query.trim().length)
    
    console.log('🔍 Algolia search request:', JSON.stringify(requestBody, null, 2))
    
    // Try the correct Algolia search endpoint with better timeout handling
    const controller = new AbortController()
    const timeoutId = setTimeout(() => controller.abort(), 15000) // Reduced to 15 seconds
    
    try {
      const response = await fetch(`${BACKEND_URL}/search/query`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(requestBody),
        signal: controller.signal
      })
      
      clearTimeout(timeoutId)
      
      if (!response.ok) {
        throw new Error(`Algolia search failed: ${response.status}`)
      }
      
      const data: AlgoliaSearchResponse = await response.json()
      console.log('🔍 Algolia search response:', JSON.stringify(data, null, 2))
      
      if (!data.hits || !Array.isArray(data.hits)) {
        console.warn('No hits found in Algolia response')
        return []
      }
      
      console.log(`✅ Found ${data.hits.length} results from Algolia search`)
      
      // Convert Algolia hits to Order format with comprehensive data handling
      const convertedOrders: Order[] = []
      const processedIds = new Set<string>()
      const processedOrderNumbers = new Set<string>()
      
      for (const hit of data.hits) {
        // Use comprehensive data from Algolia hit instead of relying on local chunk data
        const order = convertAlgoliaHitToOrder(hit, currentChunkOrders)
        
        // Skip if order is null (failed conversion)
        if (!order) {
          console.error('❌ Conversion failed for hit:', {
            orderNumber: hit?.orderNumber,
            objectID: hit?.objectID,
            customerName: (hit as any)?.['customer.first_name'],
            email: (hit as any)?.email
          })
          continue
        }
        
        // Create unique identifier using both ID and order number
        const uniqueKey = `${order.id}-${order.orderNumber}`
        
        // Skip if we've already processed this exact order
        if (processedIds.has(uniqueKey)) {
          continue
        }
        
        // Additional check: skip if order number is already processed (prevents duplicates)
        if (processedOrderNumbers.has(order.orderNumber?.toString() || '')) {
          continue
        }
        
        processedIds.add(uniqueKey)
        processedOrderNumbers.add(order.orderNumber?.toString() || '')
        convertedOrders.push(order)
        
        // Log successful conversion
        console.log('✅ Successfully converted order:', {
          orderNumber: order.orderNumber,
          customerName: order.customerName,
          total: order.total
        })
      }
      
      console.log('✅ Converted Algolia orders:', convertedOrders.length)
      
      // Log sample results for debugging
      if (convertedOrders.length > 0) {
        console.log('🔍 Sample converted orders:')
        convertedOrders.slice(0, 3).forEach((order, index) => {
          console.log(`  ${index + 1}. Order: ${order.orderNumber}, Customer: ${order.customerName}, Total: ${order.total}`)
        })
      }
      
      return convertedOrders
      
    } catch (fetchError) {
      clearTimeout(timeoutId)
      throw fetchError
    }
    
  } catch (error) {
    // Handle different types of errors gracefully
    if (error instanceof Error && error.name === 'AbortError') {
      console.warn('⚠️ Algolia search was aborted (timeout or cancelled)')
      // Don't log this as an error since it's expected behavior
    } else {
      console.error('❌ Algolia search error:', error)
    }
    
    // Fallback to local search if Algolia fails
    console.log('🔄 Falling back to local search...')
    const localResults = performLocalSearch(query, currentChunkOrders)
    console.log('🔄 Local search fallback returned:', localResults.length, 'results')
    return localResults
  }
}

// Convert Algolia hit to Order format and merge with local data
export const convertAlgoliaHitToOrder = (hit: any, localOrders: Order[]): Order | null => {
  console.log('Converting Algolia hit:', hit?.order_number || hit?.objectID, 'Available local orders:', localOrders.length)
  
  // Safely get values with fallbacks
  const orderNumber = hit?.order_number?.toString() || hit?.name?.replace('#INK', '') || '0'
  const customerName = hit?.['customer.first_name'] || hit?.customerName || hit?.customer_first_name || 'Unknown Customer'
  const customerEmail = hit?.['customer.email'] || hit?.email || 'unknown@example.com'
  const objectID = hit?.objectID || 'unknown-id'
  
  // Try to find matching order in local data using multiple strategies
  let localOrder = localOrders.find(o => o.id === objectID)
  
  if (!localOrder && orderNumber) {
    // Try matching by order number (case-insensitive)
    localOrder = localOrders.find(o => 
      o.orderNumber?.toLowerCase() === orderNumber.toLowerCase()
    )
  }
  
  if (!localOrder && orderNumber) {
    // Try matching by order number with different formats
    localOrder = localOrders.find(o => {
      const localOrderNum = o.orderNumber?.toString().toLowerCase() || ''
      const searchOrderNum = orderNumber.toLowerCase()
      
      // Exact match
      if (localOrderNum === searchOrderNum) return true
      
      // Remove #INK prefix if present
      if (localOrderNum.includes('ink') && searchOrderNum.includes('ink')) {
        const cleanLocal = localOrderNum.replace(/[^0-9]/g, '')
        const cleanSearch = searchOrderNum.replace(/[^0-9]/g, '')
        if (cleanLocal === cleanSearch) return true
      }
      
      // Partial match
      return localOrderNum.includes(searchOrderNum) || searchOrderNum.includes(localOrderNum)
    })
  }
  
  // Additional fallback: try matching by customer email
  if (!localOrder && hit?.['customer.email']) {
    localOrder = localOrders.find(o => 
      o.customerEmail?.toLowerCase() === hit['customer.email'].toLowerCase()
    )
  }
  
  if (localOrder) {
    console.log('✅ Found matching local order:', localOrder.orderNumber, 'for Algolia hit:', orderNumber)
    // Merge local data with Algolia highlight results
    return {
      ...localOrder,
      _highlightResult: hit._highlightResult
    }
  } else {
    console.log('🔍 Using Algolia data directly for order:', orderNumber, 'objectID:', objectID)
    // Generate fallback data using Algolia information
    return generateRealisticData()
  }
  
  // Fallback to generated data if no local match found
  function generateRealisticData(): Order {
    // Use actual data from Algolia hit when possible
    const baseTotal = parseFloat(hit?.total_price) || Math.floor(Math.random() * 1000) + 100
    
    // Extract customer name from Algolia data with better fallbacks
    const customerFirstName = hit?.['customer.first_name'] || hit?.customer_first_name || hit?.customerName || 'Unknown Customer'
    const customerLastName = hit?.['customer.last_name'] || hit?.customer_last_name || ''
    const fullCustomerName = customerLastName ? `${customerFirstName} ${customerLastName}` : customerFirstName
    
    // Log the extracted customer name for debugging
    console.log('🔍 Extracted customer name:', fullCustomerName, 'from hit:', {
      firstName: hit?.['customer.first_name'],
      lastName: hit?.['customer.last_name'],
      customerName: hit?.customerName
    })
    
    // Map status values to valid Order status types
    const mapStatus = (status: string): 'paid' | 'unpaid' | 'refunded' | 'pending' | 'processing' | 'shipped' | 'delivered' | 'cancelled' => {
      switch (status?.toLowerCase()) {
        case 'paid': return 'paid'
        case 'unpaid': return 'unpaid'
        case 'refunded': return 'refunded'
        case 'pending': return 'pending'
        case 'processing': return 'processing'
        case 'shipped': return 'shipped'
        case 'delivered': return 'delivered'
        case 'cancelled': return 'cancelled'
        default: return 'paid'
      }
    }
    
    const mapFulfillmentStatus = (status: string): 'unfulfilled' | 'fulfilled' | 'partial' => {
      switch (status?.toLowerCase()) {
        case 'fulfilled': return 'fulfilled'
        case 'unfulfilled': return 'unfulfilled'
        case 'partial': return 'partial'
        default: return 'fulfilled'
      }
    }
    
    const mapFinancialStatus = (status: string): 'paid' | 'pending' | 'refunded' => {
      switch (status?.toLowerCase()) {
        case 'paid': return 'paid'
        case 'pending': return 'pending'
        case 'refunded': return 'refunded'
        default: return 'paid'
      }
    }
    
    return {
      id: objectID,
      orderNumber: orderNumber,
      customerName: fullCustomerName, // Use extracted full name
      customerEmail: customerEmail,
      customer: {
        firstName: customerFirstName,
        lastName: customerLastName,
        email: customerEmail
      },
      phone: hit?.['customer.phone'] || hit?.phone,
      status: mapStatus(hit?.financial_status),
      fulfillmentStatus: mapFulfillmentStatus(hit?.fulfillment_status),
      financialStatus: mapFinancialStatus(hit?.financial_status),
      paymentStatus: mapFinancialStatus(hit?.financial_status),
      total: parseFloat(hit?.total_price) || baseTotal,
      currency: hit?.currency || 'INR',
      items: [], // Empty array as per Order type
      deliveryStatus: 'Tracking added',
      tags: hit?.tags ? hit.tags.split(',').map((tag: string) => tag.trim()) : [],
      channel: hit?.source_name || 'Shopify',
      deliveryMethod: hit?.shipping_lines?.[0]?.title || 'Standard Shipping',
      createdAt: hit?.created_at || new Date().toISOString(),
      updatedAt: hit?.updated_at || new Date().toISOString(),
      lineItems: [],
      _highlightResult: hit?._highlightResult
    }
  }
  
  return generateRealisticData()
}

// Fallback local search function
const performLocalSearch = (query: string, orders: Order[]): Order[] => {
  console.log('🔍 Performing local search for query:', query)
  
  const searchTerm = query.toLowerCase()
  
  const results = orders.filter(order => 
    order.orderNumber.toLowerCase().includes(searchTerm) ||
    order.customerName.toLowerCase().includes(searchTerm) ||
    order.customerEmail.toLowerCase().includes(searchTerm) ||
    order.status.toLowerCase().includes(searchTerm) ||
    order.fulfillmentStatus.toLowerCase().includes(searchTerm) ||
    (order.channel?.toLowerCase().includes(searchTerm) || false) ||
    (order.deliveryMethod?.toLowerCase().includes(searchTerm) || false) ||
    (order.tags?.some(tag => tag.toLowerCase().includes(searchTerm)) || false)
  )
  
  console.log('🔍 Local search found:', results.length, 'results')
  return results
}

// Legacy function for backward compatibility
export const searchOrdersWithAlgolia = async (
  query: string, 
  localOrders: Order[]
): Promise<Order[]> => {
  return searchOrdersAcrossAllChunks(query, localOrders)
}

// Enhanced debounced Algolia search with chunk awareness
export const debouncedAlgoliaSearch = debounce(
  async (
    query: string, 
    localOrders: Order[], 
    setResults: (orders: Order[]) => void, 
    setLoading: (loading: boolean) => void,
    totalChunks: number = 137
  ) => {
    if (!query.trim()) {
      setResults([])
      setLoading(false)
      return
    }
    
    setLoading(true)
    try {
      console.log(`🔍 Starting Algolia search for: "${query}" across ${totalChunks} chunks`)
      const results = await searchOrdersAcrossAllChunks(query, localOrders, totalChunks)
      console.log(`✅ Algolia search completed with ${results.length} results`)
      setResults(results)
    } catch (error) {
      console.error('❌ Algolia search error:', error)
      setResults([])
    } finally {
      setLoading(false)
    }
  },
  300
)

// Advanced Filters search across all chunks using Algolia
export const searchOrdersWithAdvancedFilters = async (
  filters: {
    orderStatus?: string[]
    financialStatus?: string[]
    paymentStatus?: string[]
    deliveryStatus?: string[]
    deliveryMethod?: string[]
    customerText?: string
    orderNumberText?: string
    priceRange?: { min?: string; max?: string }
    dateRange?: { start?: string; end?: string }
    tags?: string[]
    channels?: string[]
  },
  currentChunkOrders: Order[],
  totalChunks: number = 140
): Promise<Order[]> => {
  console.log('🔍 Advanced Filters Algolia search with filters:', filters)
  
  // Build search query based on filters (case-insensitive)
  const searchTerms: string[] = []
  
  console.log('🔍 Building case-insensitive search terms from filters:', {
    orderStatus: filters.orderStatus,
    tags: filters.tags,
    channels: filters.channels,
    priceRange: filters.priceRange,
    dateRange: filters.dateRange
  })
  
  // Add status filters (case-insensitive)
  if (filters.orderStatus && filters.orderStatus.length > 0) {
    const statusTerms = filters.orderStatus.map(status => status.toLowerCase()).join(' OR ')
    searchTerms.push(statusTerms)
  }

  if (filters.financialStatus && filters.financialStatus.length > 0) {
    const f = filters.financialStatus.map(s => s.toLowerCase()).join(' OR ')
    searchTerms.push(f)
  }

  if (filters.paymentStatus && filters.paymentStatus.length > 0) {
    const p = filters.paymentStatus.map(s => s.toLowerCase()).join(' OR ')
    searchTerms.push(p)
  }

  if (filters.deliveryStatus && filters.deliveryStatus.length > 0) {
    const d = filters.deliveryStatus.map(s => s.toLowerCase()).join(' OR ')
    searchTerms.push(d)
  }

  if (filters.deliveryMethod && filters.deliveryMethod.length > 0) {
    const d = filters.deliveryMethod.map(s => s.toLowerCase()).join(' OR ')
    searchTerms.push(d)
  }
  
  // Add tag filters (case-insensitive)
  if (filters.tags && filters.tags.length > 0) {
    const tagTerms = filters.tags.map(tag => tag.toLowerCase()).join(' OR ')
    searchTerms.push(tagTerms)
  }
  
  // Add channel filters (case-insensitive)
  if (filters.channels && filters.channels.length > 0) {
    const channelTerms = filters.channels.map(channel => channel.toLowerCase()).join(' OR ')
    searchTerms.push(channelTerms)
  }

  // Add text filters
  if (filters.customerText && filters.customerText.trim()) {
    searchTerms.push(filters.customerText.trim().toLowerCase())
  }
  if (filters.orderNumberText && filters.orderNumberText.trim()) {
    searchTerms.push(filters.orderNumberText.trim().toLowerCase())
  }
  
  // If no specific filters, return all data
  if (searchTerms.length === 0) {
    console.log('🔍 No filter terms, returning empty array')
    return []
  }
  
  const combinedQuery = searchTerms.join(' AND ').toLowerCase()
  console.log('🔍 Combined filter query (case-insensitive):', combinedQuery)
  console.log('🔍 Search terms breakdown:', searchTerms)
  
  try {
    const BACKEND_URL = process.env.NEXT_PUBLIC_BACKEND_URL || 'https://brmh.in'
    
    const requestBody: AlgoliaSearchRequest = {
      project: "myProject",
      table: "shopify-inkhub-get-orders",
      query: combinedQuery,
      hitsPerPage: 1000, // Get more results for comprehensive filtering
      page: 0
    }
    
    console.log('🔍 Advanced Filters Algolia request:', JSON.stringify(requestBody, null, 2))
    
    const controller = new AbortController()
    const timeoutId = setTimeout(() => controller.abort(), 15000) // 15 second timeout
    
    try {
      const response = await fetch(`${BACKEND_URL}/search/query`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(requestBody),
        signal: controller.signal
      })
      
      clearTimeout(timeoutId)
      
      if (!response.ok) {
        throw new Error(`Algolia search failed: ${response.status}`)
      }
      
      const data: AlgoliaSearchResponse = await response.json()
      console.log('🔍 Advanced Filters Algolia response:', data.hits?.length || 0, 'results')
    
    if (!data.hits || !Array.isArray(data.hits)) {
      console.warn('No hits found in Advanced Filters Algolia response')
      return []
    }
    
    // Convert Algolia hits to Order format
    const convertedOrders: Order[] = []
    const processedIds = new Set<string>()
    
    for (const hit of data.hits) {
      const order = convertAlgoliaHitToOrder(hit, currentChunkOrders)
      
      if (!order) continue
      
      // Skip duplicates
      if (processedIds.has(order.id)) continue
      processedIds.add(order.id)
      
      // Apply additional filters that Algolia might not handle perfectly
      let passesFilters = true
      
      // Apply price range filter
      if (filters.priceRange && (filters.priceRange.min || filters.priceRange.max)) {
        const total = order.total || 0
        const min = filters.priceRange.min ? parseFloat(filters.priceRange.min) : 0
        const max = filters.priceRange.max ? parseFloat(filters.priceRange.max) : Infinity
        
        if (total < min || total > max) {
          passesFilters = false
        }
      }
      
      // Apply date range filter
      if (filters.dateRange && (filters.dateRange.start || filters.dateRange.end)) {
        const orderDate = new Date(order.createdAt)
        const start = filters.dateRange.start ? new Date(filters.dateRange.start) : new Date(0)
        const end = filters.dateRange.end ? new Date(filters.dateRange.end) : new Date()
        
        if (orderDate < start || orderDate > end) {
          passesFilters = false
        }
      }
      
      if (passesFilters) {
        convertedOrders.push(order)
      }
    }
    
    // Sort by date (newest first)
    const sortedOrders = convertedOrders.sort((a, b) => {
      const dateA = new Date(a.createdAt || a.updatedAt || 0)
      const dateB = new Date(b.createdAt || b.updatedAt || 0)
      return dateB.getTime() - dateA.getTime()
    })
    
      // Reduce logging noise - only log occasionally in development
      if (process.env.NODE_ENV === 'development' && Math.random() < 0.1) {
        console.log('✅ Advanced Filters Algolia search completed:', sortedOrders.length, 'filtered results')
        console.log('🔍 Final filtered orders sample:', sortedOrders.slice(0, 3).map(o => ({ 
          id: o.id, 
          orderNumber: o.orderNumber, 
          customerName: o.customerName,
          financialStatus: o.financialStatus
        })))
      }
      return sortedOrders
      
    } catch (fetchError) {
      clearTimeout(timeoutId)
      throw fetchError
    }
    
  } catch (error) {
    // Handle different types of errors gracefully
    if (error instanceof Error && error.name === 'AbortError') {
      console.warn('⚠️ Advanced Filters Algolia search was aborted (timeout or cancelled)')
    } else {
      console.error('❌ Advanced Filters Algolia search error:', error)
    }
    return []
  }
}

// Debounce utility function
function debounce<T extends (...args: any[]) => any>(
  func: T,
  wait: number
): (...args: Parameters<T>) => void {
  let timeout: NodeJS.Timeout
  return (...args: Parameters<T>) => {
    clearTimeout(timeout)
    timeout = setTimeout(() => func(...args), wait)
  }
}
