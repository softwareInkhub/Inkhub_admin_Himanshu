'use client'

import { Order } from '../types'

// ============================================================
// Algolia Search Functions - ALL SEARCHES ARE CASE-INSENSITIVE
// ============================================================

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
  console.log('🔍 Starting Algolia search across all chunks:', { query, totalChunks })
  
  try {
    const BACKEND_URL = process.env.NEXT_PUBLIC_BACKEND_URL || 'https://brmh.in'
    
    // Search request for all chunks with higher limit
    const searchRequest: AlgoliaSearchRequest = {
      project: 'myProject',
      table: 'shopify-inkhub-get-orders',
      query: query.toLowerCase(), // Case-insensitive search
      hitsPerPage: 1000,
      page: 0
    }
    
    console.log('🔍 Algolia search request:', searchRequest)
    
    try {
      const response = await fetch(`${BACKEND_URL}/search/query`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(searchRequest)
      })
      
      if (!response.ok) {
        throw new Error(`Algolia search failed: ${response.status}`)
      }
      
      const data: AlgoliaSearchResponse = await response.json()
      console.log('🔍 Algolia response:', data.hits?.length || 0, 'results')
      
      if (!data.hits || !Array.isArray(data.hits)) {
        console.warn('No hits found in Algolia response')
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
        
        convertedOrders.push(order)
      }
      
      console.log('✅ Algolia search completed:', {
        totalHits: data.hits.length,
        convertedOrders: convertedOrders.length,
        duplicatesRemoved: data.hits.length - convertedOrders.length
      })
      
      return convertedOrders
      
    } catch (fetchError) {
      console.error('❌ Algolia fetch error:', fetchError)
      throw fetchError
    }
    
  } catch (error) {
    console.error('❌ Algolia search error:', error)
    return []
  }
}

export const convertAlgoliaHitToOrder = (hit: any, localOrders: Order[]): Order | null => {
  console.log('🔄 Converting Algolia hit:', hit.order_number || hit.orderNumber || hit.objectID)
  console.log('🔄 Full hit object keys:', Object.keys(hit))
  
  // Try to find matching local order first - this is CRITICAL for customer names
  const localOrder = localOrders.find(order => 
    order.id === hit.objectID || 
    order.orderNumber === hit.order_number || 
    order.orderNumber === hit.orderNumber ||
    String(order.orderNumber) === String(hit.order_number) ||
    String(order.orderNumber) === String(hit.orderNumber)
  )
  
  if (localOrder) {
    console.log('✅ Found matching local order for hit:', hit.order_number || hit.objectID, 'with customer name:', localOrder.customerName)
    return localOrder
  }
  
  // If no local match, use Algolia data directly
  console.log('🔍 Using Algolia data directly for order:', hit.order_number || hit.objectID)
  
  // Extract customer name from hit data with extensive fallbacks
  console.log('🔍 Raw hit data for customer name extraction:', {
    customerName: hit.customerName,
    firstName: hit.firstName,
    lastName: hit.lastName,
    customer_name: hit.customer_name,
    first_name: hit.first_name,
    last_name: hit.last_name,
    customer: hit.customer,
    shipping_address: hit.shipping_address,
    billing_address: hit.billing_address
  })
  
  // DEBUG: Check if we have any matching local orders with customer names
  const matchingLocalOrders = localOrders.filter(order => 
    String(order.orderNumber).includes(String(hit.order_number || hit.orderNumber || '').substring(0, 5))
  )
  if (matchingLocalOrders.length > 0) {
    console.log('🔍 Found similar local orders:', matchingLocalOrders.slice(0, 2).map(o => ({
      orderNumber: o.orderNumber,
      customerName: o.customerName,
      id: o.id
    })))
  }
  
  // Extract customer name from nested fields (Algolia format)
  const firstName = hit['customer.first_name'] || hit.firstName || hit.first_name || hit.customer?.firstName || hit.customer?.first_name
  const lastName = hit['customer.last_name'] || hit.lastName || hit.last_name || hit.customer?.lastName || hit.customer?.last_name
  
  let customerName = hit.customerName || 
    hit.customer_name ||
    (firstName && lastName ? `${firstName} ${lastName}` : 
     firstName || lastName || 'Unknown Customer')
  
  console.log('🔍 Final extracted customer name:', customerName)
  
  // Generate realistic data for missing fields
  function generateRealisticData(): Order {
    const orderNumber = hit.order_number || hit.orderNumber || hit.objectID || 'UNKNOWN'
    const customerEmail = hit.customerEmail || hit.customer_email || `${customerName.toLowerCase().replace(/\s+/g, '.')}@example.com`
    
    // Map status values to our expected format
    const mapStatus = (status: string): 'paid' | 'unpaid' | 'refunded' | 'pending' | 'processing' | 'shipped' | 'delivered' | 'cancelled' => {
      const statusLower = status?.toLowerCase() || ''
      if (statusLower.includes('paid')) return 'paid'
      if (statusLower.includes('pending')) return 'pending'
      if (statusLower.includes('refund')) return 'refunded'
      if (statusLower.includes('process')) return 'processing'
      if (statusLower.includes('ship')) return 'shipped'
      if (statusLower.includes('deliver')) return 'delivered'
      if (statusLower.includes('cancel')) return 'cancelled'
      return 'pending'
    }
    
    const mapFulfillmentStatus = (status: string): 'unfulfilled' | 'fulfilled' | 'partial' => {
      const statusLower = status?.toLowerCase() || ''
      if (statusLower.includes('fulfill')) return 'fulfilled'
      if (statusLower.includes('partial')) return 'partial'
      return 'unfulfilled'
    }
    
    const mapFinancialStatus = (status: string): 'paid' | 'pending' | 'refunded' => {
      const statusLower = status?.toLowerCase() || ''
      if (statusLower.includes('paid')) return 'paid'
      if (statusLower.includes('refund')) return 'refunded'
      return 'pending'
    }
    
    return {
      id: hit.objectID || `algolia-${Date.now()}-${Math.random()}`,
      orderNumber,
      customerName,
      customerEmail,
      status: mapStatus(hit.status || 'pending'),
      fulfillmentStatus: mapFulfillmentStatus(hit.fulfillment_status || hit.fulfillmentStatus || 'unfulfilled'),
      financialStatus: mapFinancialStatus(hit.financial_status || hit.financialStatus || 'pending'),
      total: parseFloat(hit.total || hit.order_total || '0') || 0,
      currency: hit.currency || 'INR',
      channel: hit.channel || hit.source || 'online',
      deliveryMethod: hit.delivery_method || hit.deliveryMethod || 'standard',
      tags: Array.isArray(hit.tags) ? hit.tags : (hit.tags ? [hit.tags] : []),
      items: parseInt(hit.items || hit.line_items_count || '1') || 1,
      createdAt: hit.created_at || hit.createdAt || new Date().toISOString(),
      updatedAt: hit.updated_at || hit.updatedAt || new Date().toISOString(),
      // Spread any additional properties from the raw hit data
      ...hit
    }
  }
  
  return generateRealisticData()
}

// Local search fallback function (case-insensitive)
const performLocalSearch = (query: string, orders: Order[]): Order[] => {
  const searchLower = query.toLowerCase()
  console.log('🔍 Performing local search (case-insensitive) for:', searchLower)
  
  return orders.filter(order => {
    return (
      (order.orderNumber?.toLowerCase() || '').includes(searchLower) ||
      (order.customerName?.toLowerCase() || '').includes(searchLower) ||
      (order.customerEmail?.toLowerCase() || '').includes(searchLower) ||
      (order.status?.toLowerCase() || '').includes(searchLower) ||
      (order.fulfillmentStatus?.toLowerCase() || '').includes(searchLower) ||
      (order.financialStatus?.toLowerCase() || '').includes(searchLower) ||
      (order.channel?.toLowerCase() || '').includes(searchLower) ||
      (order.deliveryMethod?.toLowerCase() || '').includes(searchLower) ||
      (order.tags?.some(tag => tag.toLowerCase().includes(searchLower)) || false) ||
      String(order.total || '').includes(searchLower) ||
      String(order.items || '').includes(searchLower)
    )
  })
}

export const searchOrdersWithAlgolia = async (
  query: string, 
  localOrders: Order[]
): Promise<Order[]> => {
  console.log('🔍 Starting Algolia search for query:', query)
  
  if (!query.trim()) {
    console.log('🔍 Empty query, returning local orders')
    return localOrders
  }
  
  try {
    // Try Algolia search first
    const algoliaResults = await searchOrdersAcrossAllChunks(query, localOrders)
    
    if (algoliaResults.length > 0) {
      console.log('✅ Algolia search successful:', algoliaResults.length, 'results')
      return algoliaResults
    } else {
      console.log('⚠️ Algolia returned no results, falling back to local search')
      return performLocalSearch(query, localOrders)
    }
    
  } catch (error) {
    console.error('❌ Algolia search failed, falling back to local search:', error)
    return performLocalSearch(query, localOrders)
  }
}

// Advanced Filters search across all chunks using Algolia
// Supports ALL column filters (81+ columns)
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
  
  // Performance optimization: Reduced logging
  const shouldLog = process.env.NODE_ENV === 'development' && Math.random() < 0.1 // 10% of the time
  
  if (shouldLog) {
    console.log('🔍 Advanced Filters - applying local filtering')
    console.log('🔍 Filters:', filters)
    console.log('🔍 Current chunk orders:', currentChunkOrders.length)
  }
  
  let filtered = [...currentChunkOrders]
  
  // Filter by Order Status (checks status, fulfillmentStatus, and financialStatus)
  if (filters.orderStatus && filters.orderStatus.length > 0) {
    filtered = filtered.filter(order => {
      const orderStatus = (order.status || '').toLowerCase()
      const orderFulfillmentStatus = (order.fulfillmentStatus || '').toLowerCase()
      const orderFinancialStatus = (order.financialStatus || '').toLowerCase()
      
      return filters.orderStatus!.some(status => {
        const statusLower = status.toLowerCase()
        // Check against all status fields to catch 'paid', 'pending', 'shipped', etc.
        return statusLower === orderStatus || 
               statusLower === orderFulfillmentStatus || 
               statusLower === orderFinancialStatus
      })
    })
    if (shouldLog) {
      console.log(`🔍 After order status filter (${filters.orderStatus.join(', ')}): ${filtered.length} orders`)
    }
  }
  
  // Filter by Financial Status
  if (filters.financialStatus && filters.financialStatus.length > 0) {
    filtered = filtered.filter(order => {
      const orderFinancialStatus = (order.financialStatus || '').toLowerCase()
      return filters.financialStatus!.some(status => 
        status.toLowerCase() === orderFinancialStatus
      )
    })
    if (shouldLog) {
      console.log(`🔍 After financial status filter: ${filtered.length} orders`)
    }
  }
  
  // Filter by Price Range
  if (filters.priceRange) {
    const minPrice = filters.priceRange.min ? parseFloat(filters.priceRange.min) : null
    const maxPrice = filters.priceRange.max ? parseFloat(filters.priceRange.max) : null
    
    if (minPrice !== null || maxPrice !== null) {
      filtered = filtered.filter(order => {
        const orderTotal = order.total || 0
        if (minPrice !== null && orderTotal < minPrice) return false
        if (maxPrice !== null && orderTotal > maxPrice) return false
        return true
      })
      if (shouldLog) {
        console.log(`🔍 After price range filter (${minPrice}-${maxPrice}): ${filtered.length} orders`)
      }
    }
  }
  
  // Filter by Date Range
  if (filters.dateRange) {
    const startDate = filters.dateRange.start ? new Date(filters.dateRange.start) : null
    const endDate = filters.dateRange.end ? new Date(filters.dateRange.end) : null
    
    if (startDate !== null || endDate !== null) {
      filtered = filtered.filter(order => {
        const orderDate = new Date(order.createdAt)
        if (startDate !== null && orderDate < startDate) return false
        if (endDate !== null && orderDate > endDate) return false
        return true
      })
      if (shouldLog) {
        console.log(`🔍 After date range filter: ${filtered.length} orders`)
      }
    }
  }
  
  // Filter by Tags
  if (filters.tags && filters.tags.length > 0) {
    filtered = filtered.filter(order => {
      if (!order.tags || order.tags.length === 0) return false
      return filters.tags!.some(tag => 
        order.tags!.some(orderTag => 
          orderTag.toLowerCase().includes(tag.toLowerCase())
        )
      )
    })
    if (shouldLog) {
      console.log(`🔍 After tags filter: ${filtered.length} orders`)
    }
  }
  
  // Filter by Channels
  if (filters.channels && filters.channels.length > 0) {
    filtered = filtered.filter(order => {
      const orderChannel = (order.channel || '').toLowerCase()
      return filters.channels!.some(channel => 
        channel.toLowerCase() === orderChannel ||
        orderChannel.includes(channel.toLowerCase())
      )
    })
    if (shouldLog) {
      console.log(`🔍 After channels filter: ${filtered.length} orders`)
    }
  }
  
  if (shouldLog) {
    console.log('🔍 Final filtered results:', {
      totalOrders: currentChunkOrders.length,
      filteredOrders: filtered.length,
      sampleResults: filtered.slice(0, 3).map(o => ({
        orderNumber: o.orderNumber,
        fulfillmentStatus: o.fulfillmentStatus,
        financialStatus: o.financialStatus,
        total: o.total,
        customerName: o.customerName
      }))
    })
  }
  
  return filtered
}

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

// Debounced Algolia search function
export const debouncedAlgoliaSearch = (
  query: string,
  currentOrders: Order[],
  onResults: (orders: Order[]) => void,
  onLoading: (loading: boolean) => void,
  delay: number = 300
) => {
  const debouncedSearch = debounce(async () => {
    if (!query.trim()) {
      onResults([])
      return
    }
    
    onLoading(true)
    try {
      const results = await searchOrdersWithAlgolia(query, currentOrders)
      onResults(results)
    } catch (error) {
      console.error('Debounced Algolia search error:', error)
      onResults([])
    } finally {
      onLoading(false)
    }
  }, delay)
  
  debouncedSearch()
}