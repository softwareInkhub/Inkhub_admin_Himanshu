import { Product, KPIMetrics } from '../types'
import { parseAdvancedSearchQuery, applyAdvancedSearch } from './advancedSearch'

// Generate optimized image URLs with compression
export const getOptimizedImageUrl = (baseUrl: string, width: number, height: number, quality: number = 80) => {
  // For Picsum, we can add compression parameters
  if (baseUrl.includes('picsum.photos')) {
    return `${baseUrl}?compress=1&quality=${quality}`
  }
  return baseUrl
}

// Generate sample products data with more realistic Shopify data
export const generateProducts = (count: number): Product[] => {
  const productTypes = ['Clothing', 'Electronics', 'Home & Garden', 'Beauty', 'Sports', 'Books', 'Food', 'Other']
  const vendors = ['INKHUB', 'Nike', 'Apple', 'Samsung', 'Adidas', 'Sony', 'LG', 'Canon', 'Dell', 'HP', 'Microsoft']
  const statuses: Product['status'][] = ['active', 'draft', 'archived']
  const tags = ['featured', 'new', 'sale', 'trending', 'limited', 'exclusive', 'bestseller', 'popular']
  const categories = ['Uncategorized', 'Tattoos', 'Accessories', 'Clothing', 'Home Decor']
  
  // Use a fixed base date for deterministic date generation
  const baseDate = new Date('2024-01-01T00:00:00Z').getTime()
  
  return Array.from({ length: count }, (_, i) => {
    const seed = i + 1
    const price = ((seed * 123) % 1000) + 10
    // Use deterministic logic instead of Math.random()
    const compareAtPrice = (seed % 3 === 0) ? price * 1.3 : undefined
    const cost = price * 0.6
    const inventoryQuantity = ((seed * 456) % 200) + 1
    const statusIndex = seed % statuses.length
    const productTypeIndex = seed % productTypes.length
    const vendorIndex = seed % vendors.length
    const categoryIndex = seed % categories.length
    
    // Generate variants with deterministic logic
    const variantCount = (seed % 3) + 1
    const variants = Array.from({ length: variantCount }, (_, vIndex) => ({
      id: `variant-${i}-${vIndex}`,
      title: `Variant ${vIndex + 1}`,
      price: price + (vIndex * 10),
      compareAtPrice: compareAtPrice ? compareAtPrice + (vIndex * 10) : undefined,
      inventoryQuantity: ((seed * (vIndex + 1) * 789) % 50) + 1,
      sku: `SKU-${i}-${vIndex}`,
      barcode: `123456789${i}${vIndex}`,
      weight: ((seed * (vIndex + 1) * 321) % 200) / 100 + 0.1,
      weightUnit: 'kg'
    }))
    
    // Generate deterministic tags
    const productTags = tags.filter((_, tagIndex) => (seed + tagIndex) % 2 === 0).slice(0, 3)
    
    // Generate deterministic collections
    const collections = ['Featured', 'New Arrivals', 'Best Sellers'].filter((_, colIndex) => (seed + colIndex) % 2 === 0)
    
    // Generate realistic product titles for first 20 products
    let title = `Product ${i + 1}`
    if (i < 20) {
      const titles = [
        'Balance Tattoo - medium - 3 inch',
        'Bajarangbali Tattoo - medium - 3 inch',
        'Baddie Drip - Small - 2inch',
        'Astronaut Tattoo - large - 4 inch',
        'A Great Feather Tattoo - medium - 4 inch',
        '11:11 manifestation tattoo - small - 2 inch',
        'Freespirit Collection (pack of 4)',
        'Vision Pack (Pack of 4)',
        'Alpha Pack (Pack of 4)',
        'Heal Pack (Pack of 5)',
        'Samurai Pack (Pack of 3)',
        'Dragon Tattoo - large - 5 inch',
        'Phoenix Tattoo - medium - 4 inch',
        'Rose Tattoo - small - 2 inch',
        'Skull Tattoo - large - 6 inch',
        'Butterfly Tattoo - medium - 3 inch',
        'Snake Tattoo - large - 5 inch',
        'Wolf Tattoo - medium - 4 inch',
        'Eagle Tattoo - large - 6 inch',
        'Lion Tattoo - medium - 4 inch'
      ]
      title = titles[i] || title
    }
    
    return {
      id: `product-${i + 1}`,
      title,
      handle: `product-${i + 1}`,
      vendor: vendors[vendorIndex],
      productType: productTypes[productTypeIndex],
      price,
      compareAtPrice,
      cost,
      inventoryQuantity,
      status: statuses[statusIndex],
      publishedAt: statuses[statusIndex] === 'active' ? new Date(baseDate - (seed * 24 * 60 * 60 * 1000)).toISOString() : undefined,
      createdAt: new Date(baseDate - (seed * 24 * 60 * 60 * 1000)).toISOString(),
      updatedAt: new Date(baseDate - (seed * 7 * 24 * 60 * 60 * 1000)).toISOString(),
      tags: productTags,
      images: [
        getOptimizedImageUrl(`https://picsum.photos/40/40?random=${i}`, 40, 40, 70), // Thumbnail for table
        getOptimizedImageUrl(`https://picsum.photos/300/300?random=${i}`, 300, 300, 85) // Full size for modal
      ],
      description: `This is a sample product description for ${title}. It includes various features and benefits.`,
      variants,
      collections,
      salesChannels: (seed % 2 === 0) ? 11 : 1,
      category: categories[categoryIndex]
    }
  })
}

// Calculate KPI metrics from products data
export const calculateKPIMetrics = (products: Product[]): KPIMetrics => {
  const totalProducts = products.length
  const activeProducts = products.filter(p => p.status === 'active').length
  const draftProducts = products.filter(p => p.status === 'draft').length
  const totalValue = products.reduce((sum, p) => sum + (p.price * p.inventoryQuantity), 0)
  const averagePrice = products.length > 0 ? products.reduce((sum, p) => sum + p.price, 0) / products.length : 0
  const lowStock = products.filter(p => p.inventoryQuantity < 10).length

  // Calculate realistic percentage changes based on data distribution
  const totalProductsChange = totalProducts > 0 ? Math.min(50, Math.max(-30, ((totalProducts % 50) - 25))) : 0
  const activeProductsChange = activeProducts > 0 ? Math.min(40, Math.max(-20, ((activeProducts % 40) - 20))) : 0
  const draftProductsChange = draftProducts > 0 ? Math.min(-5, Math.max(-25, -((draftProducts % 20) + 5))) : 0
  const totalValueChange = totalValue > 0 ? Math.min(25, Math.max(-15, ((totalValue % 5000000) / 500000) + 5)) : 0
  const averagePriceChange = averagePrice > 0 ? Math.min(15, Math.max(-10, ((averagePrice % 200) / 20) + 2)) : 0
  const lowStockChange = lowStock > 0 ? Math.min(-2, Math.max(-20, -((lowStock % 15) + 5))) : 0

  return {
    totalProducts: {
      value: totalProducts,
      change: totalProductsChange,
      trend: totalProductsChange >= 0 ? 'up' : 'down'
    },
    activeProducts: {
      value: activeProducts,
      change: activeProductsChange,
      trend: activeProductsChange >= 0 ? 'up' : 'down'
    },
    draftProducts: {
      value: draftProducts,
      change: draftProductsChange,
      trend: draftProductsChange >= 0 ? 'up' : 'down'
    },
    totalValue: {
      value: totalValue,
      change: totalValueChange,
      trend: totalValueChange >= 0 ? 'up' : 'down'
    },
    averagePrice: {
      value: averagePrice,
      change: averagePriceChange,
      trend: averagePriceChange >= 0 ? 'up' : 'down'
    },
    lowStock: {
      value: lowStock,
      change: lowStockChange,
      trend: lowStockChange >= 0 ? 'up' : 'down'
    }
  }
}

// Get unique values for filter options
export const getUniqueValues = (products: Product[], field: string): string[] => {
  const values = new Set<string>()
  products.forEach(product => {
    const value = product[field as keyof Product]
    if (value) {
      if (typeof value === 'string') {
        values.add(value)
      } else if (Array.isArray(value)) {
        value.forEach(item => {
          if (typeof item === 'string') {
            values.add(item)
          }
        })
      }
    }
  })
  return Array.from(values).sort()
}

// Get unique tags from all products
export const getUniqueTags = (products: Product[]): string[] => {
  const tags = new Set<string>()
  products.forEach(product => {
    product.tags?.forEach(tag => tags.add(tag))
  })
  return Array.from(tags).sort()
}

// Get status badge styling
export const getStatusBadge = (status: string, type: 'status' | 'inventory') => {
  if (type === 'status') {
    switch (status) {
      case 'active':
        return {
          className: "inline-flex px-2 py-1 text-xs font-medium rounded-full bg-green-100 text-green-800",
          text: "Active"
        }
      case 'draft':
        return {
          className: "inline-flex px-2 py-1 text-xs font-medium rounded-full bg-blue-100 text-blue-800",
          text: "Draft"
        }
      case 'archived':
        return {
          className: "inline-flex px-2 py-1 text-xs font-medium rounded-full bg-gray-100 text-gray-800",
          text: "Archived"
        }
      default:
        return {
          className: "inline-flex px-2 py-1 text-xs font-medium rounded-full bg-gray-100 text-gray-800",
          text: status
        }
    }
  } else {
    const quantity = parseInt(status)
    if (quantity === 0) {
      return {
        className: "inline-flex px-2 py-1 text-xs font-medium rounded-full bg-red-100 text-red-800",
        text: `${quantity} in stock`
      }
    } else if (quantity < 10) {
      return {
        className: "inline-flex px-2 py-1 text-xs font-medium rounded-full bg-yellow-100 text-yellow-800",
        text: `${quantity} in stock`
      }
    } else {
      return {
        className: "inline-flex px-2 py-1 text-xs font-medium rounded-full bg-green-100 text-green-800",
        text: `${quantity} in stock`
      }
    }
  }
  }

// Filter products based on various criteria
export const filterProducts = (
  products: Product[],
  activeFilter: string,
  searchQuery: string,
  columnFilters: Record<string, any>,
  advancedFilters?: {
    productStatus: string[]
    priceRange: { min: string; max: string }
    dateRange: { start: string; end: string }
    tags: string[]
    vendors: string[]
  }
): Product[] => {
  let filtered = products

  // Filter by status
  if (activeFilter !== 'all' && activeFilter !== 'custom') {
    filtered = filtered.filter(product => product.status === activeFilter)
  }

  // Filter by search query - simplified for performance
  if (searchQuery) {
    const searchLower = searchQuery.toLowerCase()
    filtered = filtered.filter(product => {
      return (
        product.title.toLowerCase().includes(searchLower) ||
        product.vendor.toLowerCase().includes(searchLower) ||
        product.productType.toLowerCase().includes(searchLower) ||
        product.category?.toLowerCase().includes(searchLower) ||
        product.tags?.some(tag => tag.toLowerCase().includes(searchLower))
      )
    })
  }

  // Filter by column filters - optimized
  Object.entries(columnFilters).forEach(([column, value]) => {
    if (!value || (typeof value === 'string' ? value === '' : Array.isArray(value) ? value.length === 0 : false)) {
      return
    }
    
    filtered = filtered.filter(product => {
      const productValue = product[column as keyof Product]
      
      if (column === 'title') {
        return typeof value === 'string' && String(productValue || '').toLowerCase().includes(value.toLowerCase())
      } else if (column === 'status') {
        if (typeof value === 'string') {
          return String(productValue || '') === value
        } else if (Array.isArray(value)) {
          return value.includes(String(productValue || ''))
        }
      } else if (column === 'productType' || column === 'vendor' || column === 'category') {
        if (Array.isArray(value)) {
          return value.includes(String(productValue || ''))
        } else if (typeof value === 'string') {
          return String(productValue || '').toLowerCase().includes(value.toLowerCase())
        }
      } else if (column === 'price' || column === 'inventoryQuantity') {
        if (typeof value === 'string') {
          const numValue = Number(productValue || 0)
          const filterValue = value.trim()
          
          if (filterValue.startsWith('>=')) {
            const compareValue = parseFloat(filterValue.substring(2))
            return !isNaN(compareValue) && numValue >= compareValue
          } else if (filterValue.startsWith('<=')) {
            const compareValue = parseFloat(filterValue.substring(2))
            return !isNaN(compareValue) && numValue <= compareValue
          } else if (filterValue.startsWith('>')) {
            const compareValue = parseFloat(filterValue.substring(1))
            return !isNaN(compareValue) && numValue > compareValue
          } else if (filterValue.startsWith('<')) {
            const compareValue = parseFloat(filterValue.substring(1))
            return !isNaN(compareValue) && numValue < compareValue
          } else if (filterValue.startsWith('=')) {
            const compareValue = parseFloat(filterValue.substring(1))
            return !isNaN(compareValue) && numValue === compareValue
          } else {
            const searchValue = parseFloat(filterValue)
            return !isNaN(searchValue) && numValue === searchValue
          }
        }
      } else if (column === 'createdAt' || column === 'updatedAt') {
        if (typeof value === 'string' && value) {
          try {
            const filterDate = value.includes('T') ? new Date(value) : new Date(value + 'T00:00:00')
            const productValueStr = typeof productValue === 'string' ? productValue : 
                                  typeof productValue === 'number' ? productValue.toString() :
                                  productValue instanceof Date ? productValue.toISOString() : ''
            const productDate = new Date(productValueStr)
            
            if (!isNaN(filterDate.getTime()) && !isNaN(productDate.getTime())) {
              return filterDate.getFullYear() === productDate.getFullYear() && 
                     filterDate.getMonth() === productDate.getMonth() && 
                     filterDate.getDate() === productDate.getDate()
            }
          } catch (error) {
            // Ignore date parsing errors
          }
        }
      } else {
        return typeof value === 'string' && String(productValue || '').toLowerCase().includes(value.toLowerCase())
      }
      
      return false
    })
  })

  // Apply advanced filters
  if (advancedFilters) {
    if (advancedFilters.productStatus.length > 0) {
      filtered = filtered.filter(product => 
        advancedFilters.productStatus.includes(product.status)
      )
    }

    if (advancedFilters.priceRange.min) {
      filtered = filtered.filter(product => 
        product.price >= parseFloat(advancedFilters.priceRange.min)
      )
    }

    if (advancedFilters.priceRange.max) {
      filtered = filtered.filter(product => 
        product.price <= parseFloat(advancedFilters.priceRange.max)
      )
    }

    if (advancedFilters.dateRange.start) {
      const startDate = new Date(advancedFilters.dateRange.start)
      filtered = filtered.filter(product => 
        new Date(product.createdAt) >= startDate
      )
    }

    if (advancedFilters.dateRange.end) {
      const endDate = new Date(advancedFilters.dateRange.end)
      filtered = filtered.filter(product => 
        new Date(product.createdAt) <= endDate
      )
    }

    if (advancedFilters.tags.length > 0) {
      filtered = filtered.filter(product => 
        advancedFilters.tags.some(tag => product.tags?.includes(tag))
      )
    }

    if (advancedFilters.vendors.length > 0) {
      filtered = filtered.filter(product => 
        advancedFilters.vendors.includes(product.vendor)
      )
    }
  }

  return filtered
}
