import { Product } from '../types'

export interface AlgoliaSearchResponse {
  message: string
  project: string
  table: string
  indexName: string
  query: string
  hits: Array<{
    title: string
    vendor: string
    product_type: string
    _project: string
    _table: string
    _timestamp: number
    objectID: string
    _highlightResult: {
      title: {
        value: string
        matchLevel: string
        fullyHighlighted: boolean
        matchedWords: string[]
      }
      vendor: {
        value: string
        matchLevel: string
        matchedWords: string[]
      }
      product_type: {
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

// Convert Algolia hit to Product format and merge with local data
export const convertAlgoliaHitToProduct = (hit: AlgoliaSearchResponse['hits'][0], localProducts: Product[]): Product => {
  console.log('Converting Algolia hit:', hit.title, 'Available local products:', localProducts.length)
  console.log('Sample local product titles:', localProducts.slice(0, 3).map(p => p.title))
  // Try to find matching product in local data using multiple strategies
  let localProduct = localProducts.find(p => p.id === hit.objectID)
  
  if (!localProduct) {
    // Try matching by title (case-insensitive)
    localProduct = localProducts.find(p => 
      p.title.toLowerCase() === hit.title.toLowerCase()
    )
  }
  
  if (!localProduct) {
    // Try partial title match
    localProduct = localProducts.find(p => 
      p.title.toLowerCase().includes(hit.title.toLowerCase()) ||
      hit.title.toLowerCase().includes(p.title.toLowerCase())
    )
  }
  
  if (localProduct) {
    console.log('Found matching local product:', localProduct.title, 'for Algolia hit:', hit.title)
    // Merge local data with Algolia highlight results
    return {
      ...localProduct,
      _highlightResult: hit._highlightResult
    }
  } else {
    console.log('No matching local product found for Algolia hit:', hit.title, 'objectID:', hit.objectID)
  }
  
  // Fallback to generated data if no local match found
  const generateRealisticData = () => {
    const basePrice = Math.floor(Math.random() * 1000) + 100 // 100-1100
    const inventory = Math.floor(Math.random() * 50) + 1 // 1-50
    const cost = Math.floor(basePrice * 0.6) // 60% of price
    const compareAtPrice = Math.random() > 0.7 ? basePrice * 1.3 : undefined // 30% chance of having compare price
    
    return {
      id: hit.objectID,
      title: hit.title,
      handle: hit.title.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, ''),
      vendor: hit.vendor,
      productType: hit.product_type || 'Tattoo',
      price: basePrice,
      compareAtPrice,
      cost,
      inventoryQuantity: inventory,
      status: 'active' as const,
      createdAt: new Date(hit._timestamp).toISOString(),
      updatedAt: new Date(hit._timestamp).toISOString(),
      tags: ['featured', 'new'],
      images: [`https://picsum.photos/400/400?random=${Math.floor(Math.random() * 1000)}`],
      variants: [{
        id: `variant-${hit.objectID}`,
        title: 'Default',
        price: basePrice,
        compareAtPrice,
        inventoryQuantity: inventory,
        sku: `SKU-${hit.objectID}`,
        barcode: `123456789${Math.floor(Math.random() * 1000)}`,
        weight: 0.1,
        weightUnit: 'kg'
      }],
      collections: ['Featured'],
      category: 'Tattoos',
      description: `High-quality ${hit.title} design. Perfect for temporary tattoos.`,
      seoTitle: hit.title,
      seoDescription: `Discover our amazing ${hit.title} design. Premium quality temporary tattoos.`,
      publishedAt: new Date(hit._timestamp).toISOString(),
      _highlightResult: hit._highlightResult
    }
  }
  
  return generateRealisticData()
}

// Search products using Algolia
export const searchProductsWithAlgolia = async (
  query: string,
  localProducts: Product[],
  page: number = 0,
  hitsPerPage: number = 20
): Promise<{ products: Product[], total: number }> => {
  // Prevent search for very short queries
  if (!query.trim() || query.trim().length < 2) {
    return { products: [], total: 0 }
  }

  try {
    const searchRequest: AlgoliaSearchRequest = {
      project: "myProject",
      table: "shopify-inkhub-get-products",
      query: query,
      hitsPerPage: hitsPerPage,
      page: page
    }

    console.log('Algolia search request:', JSON.stringify(searchRequest, null, 2))

    const BACKEND_URL = process.env.NEXT_PUBLIC_BACKEND_URL || 'https://brmh.in'
    const response = await fetch(`${BACKEND_URL}/search/query`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(searchRequest)
    })

    if (!response.ok) {
      console.warn(`Algolia search failed: ${response.status} ${response.statusText}`)
      // Return empty results instead of throwing error to prevent continuous failures
      return { products: [], total: 0 }
    }

    const data: AlgoliaSearchResponse = await response.json()
    console.log('Algolia search response:', JSON.stringify(data, null, 2))

    // Convert Algolia hits to Product format and merge with local data
    const products = data.hits.map(hit => convertAlgoliaHitToProduct(hit, localProducts))

    return {
      products,
      total: data.hits.length // Note: Algolia doesn't provide total count in this response
    }
  } catch (error) {
    console.error('Algolia search error:', error)
    throw error
  }
}

// Debounced search function to avoid too many API calls
export const debouncedAlgoliaSearch = (() => {
  let timeoutId: NodeJS.Timeout | null = null
  let lastQuery = ''
  let lastResults: Product[] = []
  
  return (query: string, localProducts: Product[], callback: (products: Product[]) => void, delay: number = 300) => {
    // Clear previous timeout
    if (timeoutId) {
      clearTimeout(timeoutId)
    }
    
    // Return cached results if query is the same
    if (query === lastQuery && lastResults.length > 0) {
      callback(lastResults)
      return
    }
    
    timeoutId = setTimeout(async () => {
      try {
        if (query.trim().length === 0) {
          lastQuery = ''
          lastResults = []
          callback([])
          return
        }
        
        const result = await searchProductsWithAlgolia(query, localProducts)
        lastQuery = query
        lastResults = result.products
        callback(result.products)
      } catch (error) {
        console.error('Debounced Algolia search error:', error)
        // Return empty results on error to prevent UI issues
        callback([])
      }
    }, delay)
  }
})()

// Advanced Filters search across all chunks using Algolia
export const searchProductsWithAdvancedFilters = async (
  filters: {
    productStatus?: string[]
    priceRange?: { min?: string; max?: string }
    dateRange?: { start?: string; end?: string }
    tags?: string[]
    vendors?: string[]
  },
  currentChunkProducts: Product[],
  totalChunks: number = 140
): Promise<Product[]> => {
  console.log('🔍 Advanced Filters Algolia search with filters:', filters)
  
  // Build search query based on filters (case-insensitive)
  const searchTerms: string[] = []
  
  console.log('🔍 Building case-insensitive search terms from filters:', {
    productStatus: filters.productStatus,
    tags: filters.tags,
    vendors: filters.vendors,
    priceRange: filters.priceRange,
    dateRange: filters.dateRange
  })
  
  // Add status filters (case-insensitive)
  if (filters.productStatus && filters.productStatus.length > 0) {
    const statusTerms = filters.productStatus.map(status => status.toLowerCase()).join(' OR ')
    searchTerms.push(statusTerms)
  }
  
  // Add tag filters (case-insensitive)
  if (filters.tags && filters.tags.length > 0) {
    const tagTerms = filters.tags.map(tag => tag.toLowerCase()).join(' OR ')
    searchTerms.push(tagTerms)
  }
  
  // Add vendor filters (case-insensitive)
  if (filters.vendors && filters.vendors.length > 0) {
    const vendorTerms = filters.vendors.map(vendor => vendor.toLowerCase()).join(' OR ')
    searchTerms.push(vendorTerms)
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
      table: "shopify-inkhub-get-products",
      query: combinedQuery,
      hitsPerPage: 1000, // Get more results for comprehensive filtering
      page: 0
    }
    
    console.log('🔍 Advanced Filters Algolia request:', JSON.stringify(requestBody, null, 2))
    
    const response = await fetch(`${BACKEND_URL}/search/query`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(requestBody),
      signal: AbortSignal.timeout(30000)
    })
    
    if (!response.ok) {
      throw new Error(`Algolia search failed: ${response.status}`)
    }
    
    const data: AlgoliaSearchResponse = await response.json()
    console.log('🔍 Advanced Filters Algolia response:', data.hits?.length || 0, 'results')
    
    if (!data.hits || !Array.isArray(data.hits)) {
      console.warn('No hits found in Advanced Filters Algolia response')
      return []
    }
    
    // Convert Algolia hits to Product format
    const convertedProducts: Product[] = []
    const processedIds = new Set<string>()
    
    for (const hit of data.hits) {
      const product = convertAlgoliaHitToProduct(hit, currentChunkProducts)
      
      if (!product) continue
      
      // Skip duplicates
      if (processedIds.has(product.id)) continue
      processedIds.add(product.id)
      
      // Apply additional filters that Algolia might not handle perfectly
      let passesFilters = true
      
      // Apply price range filter
      if (filters.priceRange && (filters.priceRange.min || filters.priceRange.max)) {
        const price = product.price || 0
        const min = filters.priceRange.min ? parseFloat(filters.priceRange.min) : 0
        const max = filters.priceRange.max ? parseFloat(filters.priceRange.max) : Infinity
        
        if (price < min || price > max) {
          passesFilters = false
        }
      }
      
      // Apply date range filter
      if (filters.dateRange && (filters.dateRange.start || filters.dateRange.end)) {
        const productDate = new Date(product.createdAt)
        const start = filters.dateRange.start ? new Date(filters.dateRange.start) : new Date(0)
        const end = filters.dateRange.end ? new Date(filters.dateRange.end) : new Date()
        
        if (productDate < start || productDate > end) {
          passesFilters = false
        }
      }
      
      if (passesFilters) {
        convertedProducts.push(product)
      }
    }
    
    // Sort by date (newest first)
    const sortedProducts = convertedProducts.sort((a, b) => {
      const dateA = new Date(a.createdAt || a.updatedAt || 0)
      const dateB = new Date(b.createdAt || b.updatedAt || 0)
      return dateB.getTime() - dateA.getTime()
    })
    
    console.log('✅ Advanced Filters Algolia search completed:', sortedProducts.length, 'filtered results')
    return sortedProducts
    
  } catch (error) {
    console.error('❌ Advanced Filters Algolia search error:', error)
    return []
  }
}