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
