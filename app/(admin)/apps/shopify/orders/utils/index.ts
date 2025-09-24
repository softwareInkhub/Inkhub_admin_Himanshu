import { format } from 'date-fns'
import { cn } from '@/lib/utils'
import { Order, KPIMetric } from '../types'

// Utility functions for Advanced Filters
export const getUniqueValuesForField = (orders: Order[], field: keyof Order): string[] => {
  const values = new Set<string>()
  orders.forEach(order => {
    const value = order[field]
    if (value !== null && value !== undefined && value !== '') {
      if (Array.isArray(value)) {
        value.forEach(item => values.add(String(item)))
      } else {
        values.add(String(value))
      }
    }
  })
  return Array.from(values).sort()
}

export const getUniqueTagsFromOrders = (orders: Order[]): string[] => {
  const tags = new Set<string>()
  const seenLowercase = new Set<string>()
  
  orders.forEach(order => {
    if (order.tags && Array.isArray(order.tags)) {
      order.tags.forEach(tag => {
        const lowercaseTag = tag.toLowerCase()
        // Only add if we haven't seen this tag in lowercase before
        if (!seenLowercase.has(lowercaseTag)) {
          seenLowercase.add(lowercaseTag)
          tags.add(tag) // Keep original case for display
        }
      })
    }
  })
  return Array.from(tags).sort()
}

export const getUniqueChannelsFromOrders = (orders: Order[]): string[] => {
  const channels = new Set<string>()
  const seenLowercase = new Set<string>()
  
  orders.forEach(order => {
    if (order.channel) {
      const lowercaseChannel = order.channel.toLowerCase()
      // Only add if we haven't seen this channel in lowercase before
      if (!seenLowercase.has(lowercaseChannel)) {
        seenLowercase.add(lowercaseChannel)
        channels.add(order.channel) // Keep original case for display
      }
    }
  })
  return Array.from(channels).sort()
}

export const getUniqueDeliveryMethodsFromOrders = (orders: Order[]): string[] => {
  const methods = new Set<string>()
  orders.forEach(order => {
    if (order.deliveryMethod) {
      methods.add(order.deliveryMethod)
    }
  })
  return Array.from(methods).sort()
}

// Generate sample orders data matching Shopify's structure
export const generateOrders = (count: number): Order[] => {
  const statuses: Order['status'][] = ['paid', 'unpaid', 'refunded', 'pending', 'processing', 'shipped', 'delivered', 'cancelled']
  const fulfillmentStatuses: Order['fulfillmentStatus'][] = ['unfulfilled', 'fulfilled', 'partial']
  const financialStatuses: Order['financialStatus'][] = ['paid', 'pending', 'refunded']
  const channels = ['Gokwik', 'Interakt - Sell on WhatsApp', 'Shopify', 'Manual', 'Instagram', 'Facebook', 'TikTok']
  const deliveryMethods = ['Free Shipping', 'Standard Shipping', 'Express Free Shipping', 'Express Shipping', 'Same Day Delivery', 'Next Day Delivery']
  const tags = ['bank-offer', 'GoKwik', 'UPI', 'Cards', 'COD', 'premium', 'influencer', 'custom', 'color-issue', 'rush-order', 'bulk-order', 'wholesale', 'retail', 'discount-applied', 'first-time-customer', 'vip-customer', 'returning-customer', 'international', 'domestic', 'express-delivery']
  
  const customerNames = [
    'Rahul Sharma', 'Priya Patel', 'Amit Kumar', 'Neha Singh', 'Vikram Malhotra',
    'Anjali Gupta', 'Rajesh Verma', 'Sneha Reddy', 'Arjun Kapoor', 'Meera Iyer',
    'Karan Johar', 'Zara Khan', 'Aditya Roy', 'Ishita Sharma', 'Rohan Mehta',
    'Tanvi Desai', 'Vivek Oberoi', 'Kavya Nair', 'Siddharth Malhotra', 'Ananya Pandey',
    'Deepika Padukone', 'Ranbir Kapoor', 'Alia Bhatt', 'Shah Rukh Khan', 'Aishwarya Rai',
    'Hrithik Roshan', 'Katrina Kaif', 'Salman Khan', 'Priyanka Chopra', 'Akshay Kumar',
    'Kareena Kapoor', 'Saif Ali Khan', 'Madhuri Dixit', 'Aamir Khan', 'Juhi Chawla',
    'Ajay Devgn', 'Kajol', 'Rani Mukerji', 'Preity Zinta', 'Abhishek Bachchan',
    'Raveena Tandon', 'Govinda', 'Karisma Kapoor', 'Sunny Deol', 'Tabu'
  ]
  
  const productNames = [
    'Sacred Mandala Tattoo', 'Mahadev Tattoo Design', '11:11 Manifestation Tattoo',
    'Beyond Death Tattoo', 'Shooting Stars Tattoo', 'Mother\'s Garden Tattoo',
    'Equilibrium Tattoo', 'Angry Tiger Tattoo', 'Mirror Ball Tattoo',
    'Diva Energy Tattoo Pack', 'Monarch Butterfly Tattoo', 'Midnight Wolf Tattoo',
    'Karma Maze Armband Tattoo', 'Sinister Mask Tattoo', 'KALKI Forward Tattoo',
    'Phoenix Rising Tattoo', 'Dragon Scale Tattoo', 'Celestial Moon Tattoo',
    'Ocean Wave Tattoo', 'Mountain Peak Tattoo', 'Forest Spirit Tattoo',
    'Sun and Moon Tattoo', 'Geometric Pattern Tattoo', 'Minimalist Line Tattoo',
    'Watercolor Rose Tattoo', 'Tribal Design Tattoo', 'Japanese Wave Tattoo',
    'Skull and Roses Tattoo', 'Butterfly Wings Tattoo', 'Snake Coil Tattoo',
    'Eagle Feather Tattoo', 'Lotus Flower Tattoo', 'Yin Yang Tattoo',
    'Infinity Symbol Tattoo', 'Heart Lock Tattoo', 'Compass Rose Tattoo'
  ]

  const cities = [
    'Mumbai', 'Delhi', 'Bangalore', 'Hyderabad', 'Chennai', 'Kolkata', 'Pune', 'Ahmedabad',
    'Jaipur', 'Surat', 'Lucknow', 'Kanpur', 'Nagpur', 'Indore', 'Thane', 'Bhopal',
    'Visakhapatnam', 'Pimpri-Chinchwad', 'Patna', 'Vadodara', 'Ghaziabad', 'Ludhiana',
    'Agra', 'Nashik', 'Faridabad', 'Meerut', 'Rajkot', 'Kalyan-Dombivali', 'Vasai-Virar',
    'Varanasi', 'Srinagar', 'Aurangabad', 'Dhanbad', 'Amritsar', 'Allahabad', 'Ranchi',
    'Howrah', 'Coimbatore', 'Jabalpur', 'Gwalior', 'Vijayawada', 'Jodhpur', 'Madurai'
  ]
  
  return Array.from({ length: count }, (_, i) => {
    const seed = i + 1
    const total = Math.floor(Math.random() * 15000) + 500 // More realistic price range
    const statusIndex = seed % statuses.length
    const fulfillmentIndex = seed % fulfillmentStatuses.length
    const financialIndex = seed % financialStatuses.length
    const channelIndex = seed % channels.length
    const deliveryIndex = seed % deliveryMethods.length
    
    // Add some orders with warnings and documents
    const hasWarning = seed % 7 === 0
    const hasDocument = seed % 11 === 0
    
    // Generate realistic customer data
    const customerName = customerNames[seed % customerNames.length]
    const customerEmail = customerName.toLowerCase().replace(' ', '.') + '@example.com'
    const phone = `+91 ${Math.floor(Math.random() * 9000000000) + 1000000000}`
    
    // Generate realistic product data with more variety
    const numItems = Math.floor(Math.random() * 4) + 1 // 1-4 items per order
    const items: any[] = []
    const line_items: any[] = []
    
    for (let j = 0; j < numItems; j++) {
      const productName = productNames[(seed + j) % productNames.length]
      const quantity = Math.floor(Math.random() * 3) + 1
      const price = Math.floor(Math.random() * 2000) + 500
      
      items.push({
        title: productName,
        quantity,
        price,
        variant_title: j % 3 === 0 ? 'Small' : j % 3 === 1 ? 'Medium' : 'Large',
        sku: `SKU-${Math.floor(Math.random() * 10000)}`,
        vendor: 'INKHUB Tattoos'
      })
      
      line_items.push({
        title: productName,
        quantity,
        price,
        variant_title: j % 3 === 0 ? 'Small' : j % 3 === 1 ? 'Medium' : 'Large',
        sku: `SKU-${Math.floor(Math.random() * 10000)}`,
        vendor: 'INKHUB Tattoos'
      })
    }
    
    // Generate realistic dates
    const daysAgo = Math.floor(Math.random() * 365) + 1
    const createdAt = new Date(Date.now() - (daysAgo * 24 * 60 * 60 * 1000)).toISOString()
    const updatedAt = new Date(Date.now() - (Math.floor(Math.random() * daysAgo) * 24 * 60 * 60 * 1000)).toISOString()
    
    // Generate realistic tags with more variety
    const orderTags: string[] = []
    const numTags = Math.floor(Math.random() * 4) + 1 // 1-4 tags per order
    for (let j = 0; j < numTags; j++) {
      const tag = tags[(seed + j) % tags.length]
      if (!orderTags.includes(tag)) {
        orderTags.push(tag)
      }
    }
    
    // Generate realistic addresses
    const city = cities[seed % cities.length]
    const shippingAddress = {
      firstName: customerName.split(' ')[0],
      lastName: customerName.split(' ')[1] || '',
      address1: `${Math.floor(Math.random() * 999) + 1} Main Street`,
      address2: `Apartment ${Math.floor(Math.random() * 999) + 1}`,
      city,
      province: 'Maharashtra',
      country: 'India',
      zip: `${Math.floor(Math.random() * 900000) + 100000}`,
      phone
    }
    
    const billingAddress = {
      firstName: customerName.split(' ')[0],
      lastName: customerName.split(' ')[1] || '',
      address1: `${Math.floor(Math.random() * 999) + 1} Billing Street`,
      address2: `Office ${Math.floor(Math.random() * 999) + 1}`,
      city,
      province: 'Maharashtra',
      country: 'India',
      zip: `${Math.floor(Math.random() * 900000) + 100000}`,
      phone
    }
    
    // Generate customer object
    const customer = {
      firstName: customerName.split(' ')[0],
      lastName: customerName.split(' ')[1] || '',
      email: customerEmail
    }
    
    return {
      id: `order-${i + 1}`,
      orderNumber: `INK${String(64800 + i).padStart(5, '0')}`,
      customerName,
      customerEmail,
      phone,
      total,
      currency: 'INR',
      status: statuses[statusIndex],
      fulfillmentStatus: fulfillmentStatuses[fulfillmentIndex],
      financialStatus: financialStatuses[financialIndex],
      paymentStatus: financialStatuses[financialIndex],
      items,
      line_items,
      lineItems: line_items,
      createdAt,
      updatedAt,
      totalPrice: total.toFixed(2),
      tags: orderTags.length > 0 ? orderTags : [tags[seed % tags.length]],
      channel: channels[channelIndex],
      deliveryMethod: deliveryMethods[deliveryIndex],
      deliveryStatus: fulfillmentStatuses[fulfillmentIndex] === 'fulfilled' ? 'Tracking added' : fulfillmentStatuses[fulfillmentIndex] === 'partial' ? 'Partially shipped' : 'Pending',
      hasWarning,
      hasDocument,
      shippingAddress,
      billingAddress,
      customer
    }
  })
}

// Calculate KPI metrics
export const calculateKPIMetrics = (filteredOrders: Order[]) => {
  const total = filteredOrders.length
  const itemsOrdered = filteredOrders.reduce((sum, order) => 
    sum + (order.items?.length || 0), 0)
  const returns = filteredOrders.filter(order => 
    order.status === 'refunded').length
  const fulfilled = filteredOrders.filter(order => 
    order.fulfillmentStatus === 'fulfilled').length
  const delivered = filteredOrders.filter(order => 
    order.deliveryStatus === 'Tracking added').length
  const totalValue = filteredOrders.reduce((sum, order) => sum + (order.total || 0), 0)
  const avgOrderValue = total > 0 ? totalValue / total : 0
  const avgFulfillmentTime = 12 // Mock data

  return {
    orders: { value: total, change: 6, trend: 'up' as const },
    itemsOrdered: { value: itemsOrdered, change: 11, trend: 'up' as const },
    returns: { value: returns, change: 0, trend: 'neutral' as const },
    fulfilled: { value: fulfilled, change: 7, trend: 'up' as const },
    delivered: { value: delivered, change: 67, trend: 'up' as const },
    fulfillmentTime: { value: avgFulfillmentTime, change: 14, trend: 'up' as const },
    totalValue: { value: totalValue, change: 8, trend: 'up' as const },
    avgOrderValue: { value: avgOrderValue, change: 3, trend: 'up' as const }
  }
}

// Get status badge classes
export const getStatusBadge = (status: string, type: 'fulfillment' | 'payment') => {
  const baseClasses = 'px-2 py-0.5 rounded-full text-xs font-medium'
  
  if (type === 'fulfillment') {
    switch (status) {
      case 'unfulfilled':
        return cn(baseClasses, 'bg-yellow-100 text-yellow-800')
      case 'fulfilled':
        return cn(baseClasses, 'bg-gray-100 text-gray-800')
      case 'partial':
        return cn(baseClasses, 'bg-orange-100 text-orange-800')
      default:
        return cn(baseClasses, 'bg-gray-100 text-gray-800')
    }
  } else {
    switch (status) {
      case 'paid':
        return cn(baseClasses, 'bg-gray-100 text-gray-800')
      case 'pending':
        return cn(baseClasses, 'bg-yellow-100 text-yellow-800')
      case 'refunded':
        return cn(baseClasses, 'bg-red-100 text-red-800')
      default:
        return cn(baseClasses, 'bg-gray-100 text-gray-800')
    }
  }
}

// Get unique values for filter options
export const getUniqueValues = (orders: Order[], field: keyof Order): string[] => {
  const values = orders
    .map(order => order[field])
    .filter((value): value is string => typeof value === 'string' && value !== undefined)
    .filter((value, index, arr) => arr.indexOf(value) === index)
    .sort()
  
  return values
}

// Get unique tags from orders
export const getUniqueTags = (orders: Order[]): string[] => {
  const allTags = orders
    .flatMap(order => order.tags || [])
    .filter((tag, index, arr) => arr.indexOf(tag) === index)
    .sort()
  
  return allTags
}

// Filter orders based on multiple criteria
export const filterOrders = (
  orders: Order[],
  activeFilter: string,
  searchQuery: string,
  columnFilters: Record<string, any>,
  advancedFilters?: any
): Order[] => {
  let filtered = orders

  // Apply search query
  if (searchQuery) {
    const searchLower = searchQuery.toLowerCase()
    filtered = filtered.filter(order => {
      const searchableText = [
        order.orderNumber,
        order.customerName,
        order.customerEmail,
        order.phone,
        order.total?.toString(),
        order.status,
        order.fulfillmentStatus,
        order.financialStatus,
        order.channel,
        order.deliveryMethod,
        order.deliveryStatus,
        order.tags?.join(' '),
        order.items?.map((item: any) => item.title || item.name).join(' ')
      ].join(' ').toLowerCase()
      
      return searchableText.includes(searchLower)
    })
  }

  // Apply column filters
  Object.entries(columnFilters).forEach(([column, filterValue]) => {
    if (!filterValue || (Array.isArray(filterValue) && filterValue.length === 0)) return

    filtered = filtered.filter(order => {
      const productValue = order[column as keyof Order]
      
      if (Array.isArray(filterValue)) {
        // Multi-select filter
        if (Array.isArray(productValue)) {
          return filterValue.some((fv: string) => productValue.includes(fv))
        }
        return filterValue.includes(String(productValue))
      } else if (typeof filterValue === 'object' && filterValue.min !== undefined) {
        // Numeric range filter
        const numValue = Number(productValue)
        const min = Number(filterValue.min)
        const max = Number(filterValue.max)
        return (min === 0 || numValue >= min) && (max === 0 || numValue <= max)
      } else if (typeof filterValue === 'string') {
        // Text filter
        const productValueStr = String(productValue || '').toLowerCase()
        const filterValueStr = filterValue.toLowerCase()
        
        // Handle date filtering
        if (column === 'createdAt' || column === 'updatedAt') {
          const productDate = new Date(productValueStr)
          const filterDate = new Date(filterValueStr)
          return productDate.getFullYear() === filterDate.getFullYear() &&
                 productDate.getMonth() === filterDate.getMonth() &&
                 productDate.getDate() === filterDate.getDate()
        }
        
        return productValueStr.includes(filterValueStr)
      }
      
      return true
    })
  })

  // Apply active filter
  if (activeFilter && activeFilter !== 'all') {
    switch (activeFilter) {
      case 'rto':
        filtered = filtered.filter(order => order.deliveryStatus === 'RTO')
        break
      case 'influencer':
        filtered = filtered.filter(order => order.tags?.includes('influencer'))
        break
      case 'open':
        filtered = filtered.filter(order => order.fulfillmentStatus === 'unfulfilled')
        break
      case 'color-issue':
        filtered = filtered.filter(order => order.tags?.includes('color-issue'))
        break
      case 'custom':
        filtered = filtered.filter(order => order.tags?.includes('custom'))
        break
      case 'partial-paid':
        filtered = filtered.filter(order => order.financialStatus === 'pending')
        break
      case 'unfulfilled':
        filtered = filtered.filter(order => order.fulfillmentStatus === 'unfulfilled')
        break
      default:
        // Handle custom filters
        break
    }
  }

  return filtered
}

// Get page numbers for pagination
export const getPageNumbers = (currentPage: number, totalPages: number): (number | string)[] => {
  const pages: (number | string)[] = []
  
  if (totalPages <= 7) {
    for (let i = 1; i <= totalPages; i++) {
      pages.push(i)
    }
  } else {
    if (currentPage <= 4) {
      for (let i = 1; i <= 5; i++) {
        pages.push(i)
      }
      pages.push('...')
      pages.push(totalPages)
    } else if (currentPage >= totalPages - 3) {
      pages.push(1)
      pages.push('...')
      for (let i = totalPages - 4; i <= totalPages; i++) {
        pages.push(i)
      }
    } else {
      pages.push(1)
      pages.push('...')
      for (let i = currentPage - 1; i <= currentPage + 1; i++) {
        pages.push(i)
      }
      pages.push('...')
      pages.push(totalPages)
    }
  }
  
  return pages
}
