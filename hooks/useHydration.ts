import { useEffect, useState } from 'react'
import { useAppStore } from '@/lib/store'

/**
 * Hook to ensure Zustand store is properly hydrated before rendering
 * Prevents flickering on page refresh by waiting for store rehydration
 */
export function useHydration() {
  const [isHydrated, setIsHydrated] = useState(false)
  const hasHydrated = useAppStore((state) => state.hasHydrated)

  useEffect(() => {
    // Set hydrated to true when Zustand store has rehydrated
    if (hasHydrated) {
      setIsHydrated(true)
    }
  }, [hasHydrated])

  // For client-side rendering, we need to wait for hydration
  // For server-side rendering, we assume it's not hydrated initially
  return typeof window !== 'undefined' ? isHydrated : false
}


