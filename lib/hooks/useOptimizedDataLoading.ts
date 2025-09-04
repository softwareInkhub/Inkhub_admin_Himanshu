'use client'

import { useState, useEffect, useCallback, useRef } from 'react'
import { useQueryClient } from '@tanstack/react-query'

// Configuration for optimized data loading
const LOADING_CONFIG = {
  INITIAL_CHUNK_SIZE: 500,        // Load first 500 records immediately
  BACKGROUND_CHUNK_SIZE: 1000,    // Load additional chunks in background
  MAX_CONCURRENT_CHUNKS: 3,       // Limit concurrent chunk loading
  PRELOAD_DELAY: 2000,           // Start background loading after 2 seconds
  CACHE_TTL: 10 * 60 * 1000,     // 10 minutes cache TTL
}

interface ChunkData<T> {
  data: T[]
  totalCount: number
  chunkIndex: number
  timestamp: number
}

interface LoadingState {
  isLoading: boolean
  isBackgroundLoading: boolean
  loadedChunks: number
  totalChunks: number
  progress: number
  error: string | null
}

export function useOptimizedDataLoading<T>(
  dataType: 'orders' | 'products' | 'designs',
  initialData?: T[],
  totalCount?: number
) {
  const queryClient = useQueryClient()
  const [loadingState, setLoadingState] = useState<LoadingState>({
    isLoading: false,
    isBackgroundLoading: false,
    loadedChunks: 0,
    totalChunks: 0,
    progress: 0,
    error: null
  })
  
  const [data, setData] = useState<T[]>(initialData || [])
  const [isInitialized, setIsInitialized] = useState(false)
  const backgroundLoadingRef = useRef(false)
  const chunkCacheRef = useRef<Map<number, ChunkData<T>>>(new Map())

  // Initialize with first chunk for immediate display
  const initializeData = useCallback(async () => {
    if (isInitialized || !initialData) return

    setLoadingState(prev => ({ ...prev, isLoading: true }))
    
    try {
      // Load first chunk immediately for instant UI response
      const firstChunk = await loadChunk(0, LOADING_CONFIG.INITIAL_CHUNK_SIZE)
      
      if (firstChunk) {
        setData(firstChunk.data)
        chunkCacheRef.current.set(0, firstChunk)
        setLoadingState(prev => ({
          ...prev,
          isLoading: false,
          loadedChunks: 1,
          totalChunks: Math.ceil((totalCount || 0) / LOADING_CONFIG.INITIAL_CHUNK_SIZE),
          progress: 100 / Math.ceil((totalCount || 0) / LOADING_CONFIG.INITIAL_CHUNK_SIZE)
        }))
        setIsInitialized(true)
        
        // Start background loading after a delay
        setTimeout(() => {
          startBackgroundLoading()
        }, LOADING_CONFIG.PRELOAD_DELAY)
      }
    } catch (error) {
      setLoadingState(prev => ({
        ...prev,
        isLoading: false,
        error: error instanceof Error ? error.message : 'Failed to load initial data'
      }))
    }
  }, [initialData, totalCount, isInitialized])

  // Load individual chunk
  const loadChunk = useCallback(async (chunkIndex: number, chunkSize: number): Promise<ChunkData<T> | null> => {
    const cacheKey = `${dataType}-chunk-${chunkIndex}`
    
    // Check cache first
    const cached = queryClient.getQueryData([cacheKey])
    if (cached) {
      return cached as ChunkData<T>
    }

    try {
      // Simulate chunk loading (replace with your actual API call)
      const chunkData = await fetchChunkData(dataType, chunkIndex, chunkSize)
      
      const chunkResult: ChunkData<T> = {
        data: chunkData.data as T[],
        totalCount: chunkData.totalCount,
        chunkIndex,
        timestamp: Date.now()
      }

      // Cache the chunk
      queryClient.setQueryData([cacheKey], chunkResult)
      chunkCacheRef.current.set(chunkIndex, chunkResult)
      
      return chunkResult
    } catch (error) {
      console.warn(`Failed to load chunk ${chunkIndex}:`, error)
      return null
    }
  }, [dataType, queryClient])

  // Background loading of additional chunks
  const startBackgroundLoading = useCallback(async () => {
    if (backgroundLoadingRef.current) return
    
    backgroundLoadingRef.current = true
    setLoadingState(prev => ({ ...prev, isBackgroundLoading: true }))
    
    const totalChunks = Math.ceil((totalCount || 0) / LOADING_CONFIG.BACKGROUND_CHUNK_SIZE)
    const chunksToLoad = Array.from({ length: totalChunks - 1 }, (_, i) => i + 1)
    
    // Load chunks in batches to avoid overwhelming the system
    const batchSize = LOADING_CONFIG.MAX_CONCURRENT_CHUNKS
    for (let i = 0; i < chunksToLoad.length; i += batchSize) {
      const batch = chunksToLoad.slice(i, i + batchSize)
      
      await Promise.allSettled(
        batch.map(async (chunkIndex) => {
          const chunk = await loadChunk(chunkIndex, LOADING_CONFIG.BACKGROUND_CHUNK_SIZE)
          if (chunk) {
            setLoadingState(prev => ({
              ...prev,
              loadedChunks: prev.loadedChunks + 1,
              progress: ((prev.loadedChunks + 1) / totalChunks) * 100
            }))
          }
        })
      )
      
      // Small delay between batches to prevent blocking
      await new Promise(resolve => setTimeout(resolve, 100))
    }
    
    backgroundLoadingRef.current = false
    setLoadingState(prev => ({ ...prev, isBackgroundLoading: false }))
  }, [totalCount, loadChunk])

  // Merge all loaded chunks into complete dataset
  const getCompleteData = useCallback(() => {
    const allChunks = Array.from(chunkCacheRef.current.values())
    const sortedChunks = allChunks.sort((a, b) => a.chunkIndex - b.chunkIndex)
    
    return sortedChunks.reduce((acc, chunk) => {
      acc.push(...chunk.data)
      return acc
    }, [] as T[])
  }, [])

  // Refresh data
  const refreshData = useCallback(async () => {
    // Clear cache and reload
    chunkCacheRef.current.clear()
    queryClient.removeQueries({ queryKey: [dataType] })
    setIsInitialized(false)
    setData([])
    setLoadingState({
      isLoading: false,
      isBackgroundLoading: false,
      loadedChunks: 0,
      totalChunks: 0,
      progress: 0,
      error: null
    })
    
    // Reinitialize
    await initializeData()
  }, [dataType, queryClient, initializeData])

  // Preload specific chunk
  const preloadChunk = useCallback(async (chunkIndex: number) => {
    if (chunkCacheRef.current.has(chunkIndex)) return
    
    await loadChunk(chunkIndex, LOADING_CONFIG.BACKGROUND_CHUNK_SIZE)
  }, [loadChunk])

  // Initialize on mount
  useEffect(() => {
    initializeData()
  }, [initializeData])

  return {
    // Data
    data,
    completeData: getCompleteData(),
    
    // Loading state
    ...loadingState,
    
    // Actions
    refreshData,
    preloadChunk,
    
    // Cache info
    cachedChunks: chunkCacheRef.current.size,
    isFullyLoaded: chunkCacheRef.current.size > 0 && 
                   loadingState.loadedChunks === loadingState.totalChunks
  }
}

// Simulated chunk fetching (replace with your actual API)
async function fetchChunkData<T>(
  dataType: string, 
  chunkIndex: number, 
  chunkSize: number
): Promise<{ data: T[], totalCount: number }> {
  // Simulate API delay
  await new Promise(resolve => setTimeout(resolve, 100 + Math.random() * 200))
  
  // Generate mock data for demonstration
  const startIndex = chunkIndex * chunkSize
  const mockData = Array.from({ length: chunkSize }, (_, i) => ({
    id: `${dataType}-${startIndex + i + 1}`,
    name: `${dataType.charAt(0).toUpperCase() + dataType.slice(1)} ${startIndex + i + 1}`,
    // Add other properties based on dataType
  })) as T[]
  
  return {
    data: mockData,
    totalCount: 50000 // Mock total count
  }
}

// Hook for preloading data on tab hover
export function useTabPreloader() {
  const preloadQueue = useRef<Set<string>>(new Set())
  const isPreloading = useRef(false)
  
  const preloadTab = useCallback(async (tabPath: string) => {
    if (preloadQueue.current.has(tabPath) || isPreloading.current) return
    
    preloadQueue.current.add(tabPath)
    
    // Start preloading after a short delay
    setTimeout(async () => {
      if (preloadQueue.current.has(tabPath)) {
        isPreloading.current = true
        
        try {
          // Preload logic here - this will be called when hovering over tabs
          console.log(`🔄 Preloading tab: ${tabPath}`)
          
          // Simulate preloading
          await new Promise(resolve => setTimeout(resolve, 500))
          
        } catch (error) {
          console.warn(`Failed to preload tab ${tabPath}:`, error)
        } finally {
          preloadQueue.current.delete(tabPath)
          isPreloading.current = false
        }
      }
    }, 300) // 300ms delay before starting preload
  }, [])
  
  return { preloadTab }
}
