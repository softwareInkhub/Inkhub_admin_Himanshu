'use client'

import { useEffect } from 'react'

export function useImagePreloader(imageUrls: string[]) {
  useEffect(() => {
    if (!Array.isArray(imageUrls) || imageUrls.length === 0) return
    const images: HTMLImageElement[] = []
    imageUrls.forEach((url) => {
      if (!url) return
      const img = new Image()
      img.src = url
      images.push(img)
    })
    return () => {
      images.forEach((img) => {
        // allow GC
        // @ts-ignore
        img.onload = null
      })
    }
  }, [JSON.stringify(imageUrls)])
}

















