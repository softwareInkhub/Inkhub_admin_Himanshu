import { useEffect, useRef } from 'react'

export const useImagePreloader = (imageUrls: string[]) => {
  const preloadedImages = useRef<Set<string>>(new Set())

  useEffect(() => {
    const preloadImage = (url: string) => {
      // Skip invalid URLs
      if (!url || typeof url !== 'string' || url.trim() === '') return
      
      // Skip if already preloaded
      if (preloadedImages.current.has(url)) return

      // Skip if URL is not accessible (e.g., data URLs, blob URLs)
      if (url.startsWith('data:') || url.startsWith('blob:')) return

      const img = new Image()
      img.onload = () => {
        preloadedImages.current.add(url)
      }
      img.onerror = () => {
        // Silently handle errors for preloading - don't log to console to reduce noise
        // Failed images will still display normally when rendered
      }
      img.src = url
    }

    // Preload images with a small delay to avoid blocking initial render
    const timeoutId = setTimeout(() => {
      // Filter out invalid URLs before preloading
      const validUrls = imageUrls.filter(url => url && typeof url === 'string' && url.trim() !== '')
      validUrls.forEach(preloadImage)
    }, 100)

    return () => clearTimeout(timeoutId)
  }, [imageUrls])

  return preloadedImages.current
}
