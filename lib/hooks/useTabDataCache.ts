'use client'

import { useQuery, useQueryClient, UseQueryOptions } from '@tanstack/react-query'
import { useCallback, useEffect, useRef } from 'react'

// Cache keys for different data types
export const CACHE_KEYS = {
  DASHBOARD: 'dashboard-data',
  DESIGN_LIBRARY: 'design-library-data',
  ORDERS: 'orders-data',
  PRODUCTS: 'products-data',
} as const

// Type definitions for each data structure
export interface DashboardData {
  metrics: {
    totalRevenue: number
    totalOrders: number
    totalProducts: number
    totalCustomers: number
  }
  recentActivity: Array<{
    id: number
    type: string
    message: string
    time: string
  }>
}

export interface DesignLibraryData {
  designs: Array<{
    id: string
    name: string
    type: string
    status: string
    createdAt: string
  }>
  totalCount: number
  categories: string[]
}

export interface OrdersData {
  orders: Array<{
    id: string
    orderNumber: string
    customer: string
    status: string
    total: number
    createdAt: string
  }>
  totalCount: number
  statuses: string[]
}

export interface ProductsData {
  products: Array<{
    id: string
    title: string
    vendor: string
    productType: string
    price: number
    status: string
    inventoryQuantity: number
    createdAt: string
  }>
  totalCount: number
  categories: string[]
}

// Union type for all possible data types
export type TabData = DashboardData | DesignLibraryData | OrdersData | ProductsData

// Type-safe data fetchers
const dataFetchers = {
  [CACHE_KEYS.DASHBOARD]: async (): Promise<DashboardData> => {
    // Simulate dashboard data fetch
    await new Promise(resolve => setTimeout(resolve, 100))
    return {
      metrics: {
        totalRevenue: 125000,
        totalOrders: 1247,
        totalProducts: 89,
        totalCustomers: 456
      },
      recentActivity: [
        { id: 1, type: 'order', message: 'New order #1234 received', time: '2 min ago' },
        { id: 2, type: 'product', message: 'Product "Design Tattoo" updated', time: '5 min ago' },
        { id: 3, type: 'customer', message: 'New customer registered', time: '10 min ago' }
      ]
    }
  },
  
  [CACHE_KEYS.DESIGN_LIBRARY]: async (): Promise<DesignLibraryData> => {
    // Simulate design library data fetch
    await new Promise(resolve => setTimeout(resolve, 150))
    return {
      designs: Array.from({ length: 50 }, (_, i) => ({
        id: `design-${i + 1}`,
        name: `Design ${i + 1}`,
        type: ['logo', 'banner', 'illustration'][i % 3],
        status: ['completed', 'in_progress', 'pending'][i % 3],
        createdAt: new Date(Date.now() - Math.random() * 30 * 24 * 60 * 60 * 1000).toISOString()
      })),
      totalCount: 50,
      categories: ['logo', 'banner', 'illustration', 'icon', 'mockup']
    }
  },
  
  [CACHE_KEYS.ORDERS]: async (): Promise<OrdersData> => {
    // Simulate orders data fetch
    await new Promise(resolve => setTimeout(resolve, 200))
    return {
      orders: Array.from({ length: 100 }, (_, i) => ({
        id: `order-${i + 1}`,
        orderNumber: `#${String(i + 1000).padStart(4, '0')}`,
        customer: `Customer ${i + 1}`,
        status: ['pending', 'processing', 'shipped', 'delivered'][i % 4],
        total: Math.floor(Math.random() * 1000) + 50,
        createdAt: new Date(Date.now() - Math.random() * 30 * 24 * 60 * 60 * 1000).toISOString()
      })),
      totalCount: 100,
      statuses: ['pending', 'processing', 'shipped', 'delivered', 'cancelled']
    }
  },
  
  [CACHE_KEYS.PRODUCTS]: async (): Promise<ProductsData> => {
    // Simulate products data fetch
    await new Promise(resolve => setTimeout(resolve, 180))
    return {
      products: Array.from({ length: 200 }, (_, i) => ({
        id: `product-${i + 1}`,
        title: `Product ${i + 1}`,
        vendor: 'INKHUB',
        productType: 'Tattoo Design',
        price: Math.floor(Math.random() * 1000) + 100,
        status: ['active', 'draft', 'archived'][i % 3],
        inventoryQuantity: Math.floor(Math.random() * 100) + 10,
        createdAt: new Date(Date.now() - Math.random() * 30 * 24 * 60 * 60 * 1000).toISOString()
      })),
      totalCount: 200,
      categories: ['Tattoo Design', 'Temporary Tattoo', 'Accessories']
    }
  }
}

// Type-safe hook for managing tab data cache
export function useTabDataCache<T extends TabData>(
  cacheKey: (typeof CACHE_KEYS)[keyof typeof CACHE_KEYS],
  options?: Omit<UseQueryOptions<T>, 'queryKey' | 'queryFn'>
) {
  const queryClient = useQueryClient()
  const isPreloaded = useRef(false)

  // Main data query
  const query = useQuery({
    queryKey: [cacheKey],
    queryFn: dataFetchers[cacheKey] as () => Promise<T>,
    staleTime: 5 * 60 * 1000, // 5 minutes
    gcTime: 10 * 60 * 1000, // 10 minutes (formerly cacheTime)
    ...options
  })

  // Preload data function
  const preloadData = useCallback(async () => {
    if (isPreloaded.current) return
    
    try {
      await queryClient.prefetchQuery({
        queryKey: [cacheKey],
        queryFn: dataFetchers[cacheKey] as () => Promise<T>,
        staleTime: 5 * 60 * 1000,
        gcTime: 10 * 60 * 1000
      })
      isPreloaded.current = true
      console.log(`✅ Preloaded ${cacheKey}`)
    } catch (error) {
      console.warn(`❌ Failed to preload ${cacheKey}:`, error)
    }
  }, [cacheKey, queryClient])

  // Invalidate cache function
  const invalidateCache = useCallback(async () => {
    try {
      await queryClient.invalidateQueries({ queryKey: [cacheKey] })
      isPreloaded.current = false
      console.log(`🔄 Invalidated ${cacheKey}`)
    } catch (error) {
      console.warn(`❌ Failed to invalidate ${cacheKey}:`, error)
    }
  }, [cacheKey, queryClient])

  // Reset cache function
  const resetCache = useCallback(() => {
    queryClient.removeQueries({ queryKey: [cacheKey] })
    isPreloaded.current = false
    console.log(`🗑️ Reset ${cacheKey}`)
  }, [cacheKey, queryClient])

  return {
    ...query,
    preloadData,
    invalidateCache,
    resetCache,
    isPreloaded: isPreloaded.current
  }
}

// Hook for preloading all tab data
export function usePreloadAllTabData() {
  const queryClient = useQueryClient()
  const preloadStatus = useRef<Record<string, boolean>>({})

  const preloadAllData = useCallback(async () => {
    const preloadPromises = Object.values(CACHE_KEYS).map(async (cacheKey) => {
      if (preloadStatus.current[cacheKey]) return
      
      try {
        await queryClient.prefetchQuery({
          queryKey: [cacheKey],
          queryFn: dataFetchers[cacheKey] as any,
          staleTime: 5 * 60 * 1000,
          gcTime: 10 * 60 * 1000
        })
        preloadStatus.current[cacheKey] = true
        console.log(`✅ Preloaded ${cacheKey}`)
      } catch (error) {
        console.warn(`❌ Failed to preload ${cacheKey}:`, error)
      }
    })

    await Promise.allSettled(preloadPromises)
  }, [queryClient])

  const getPreloadStatus = useCallback(() => {
    return preloadStatus.current
  }, [])

  const resetPreloadStatus = useCallback(() => {
    preloadStatus.current = {}
  }, [])

  return {
    preloadAllData,
    getPreloadStatus,
    resetPreloadStatus
  }
}

// Hook for managing tab-specific data operations
export function useTabDataOperations<T = any>(cacheKey: (typeof CACHE_KEYS)[keyof typeof CACHE_KEYS]) {
  const queryClient = useQueryClient()

  const updateItem = useCallback((itemId: string, updates: Partial<T>) => {
    queryClient.setQueryData([cacheKey], (oldData: any) => {
      if (!oldData) return oldData
      
      if (oldData.items || oldData.products || oldData.designs || oldData.orders) {
        const itemsKey = oldData.items ? 'items' : 
                        oldData.products ? 'products' : 
                        oldData.designs ? 'designs' : 
                        oldData.orders ? 'orders' : null
        
        if (itemsKey) {
          return {
            ...oldData,
            [itemsKey]: oldData[itemsKey].map((item: any) => 
              item.id === itemId ? { ...item, ...updates } : item
            )
          }
        }
      }
      
      return oldData
    })
  }, [cacheKey, queryClient])

  const addItem = useCallback((newItem: T) => {
    queryClient.setQueryData([cacheKey], (oldData: any) => {
      if (!oldData) return oldData
      
      if (oldData.items || oldData.products || oldData.designs || oldData.orders) {
        const itemsKey = oldData.items ? 'items' : 
                        oldData.products ? 'products' : 
                        oldData.designs ? 'designs' : 
                        oldData.orders ? 'orders' : null
        
        if (itemsKey) {
          return {
            ...oldData,
            [itemsKey]: [newItem, ...oldData[itemsKey]],
            totalCount: (oldData.totalCount || 0) + 1
          }
        }
      }
      
      return oldData
    })
  }, [cacheKey, queryClient])

  const removeItem = useCallback((itemId: string) => {
    queryClient.setQueryData([cacheKey], (oldData: any) => {
      if (!oldData) return oldData
      
      if (oldData.items || oldData.products || oldData.designs || oldData.orders) {
        const itemsKey = oldData.items ? 'items' : 
                        oldData.products ? 'products' : 
                        oldData.designs ? 'designs' : 
                        oldData.orders ? 'orders' : null
        
        if (itemsKey) {
          return {
            ...oldData,
            [itemsKey]: oldData[itemsKey].filter((item: any) => item.id !== itemId),
            totalCount: Math.max(0, (oldData.totalCount || 0) - 1)
          }
        }
      }
      
      return oldData
    })
  }, [cacheKey, queryClient])

  return {
    updateItem,
    addItem,
    removeItem
  }
}
