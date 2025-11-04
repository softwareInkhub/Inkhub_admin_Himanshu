'use client'

import { useState, useRef, useEffect } from 'react'
import { Image as ImageIcon } from 'lucide-react'
import { cn } from '@/lib/utils'

interface ProductImageProps {
  src: string
  alt: string
  className?: string
  fallbackIcon?: React.ReactNode
  size?: 'sm' | 'md' | 'lg' | 'full'
}

export default function ProductImage({
  src,
  alt,
  className = '',
  fallbackIcon,
  size = 'sm'
}: ProductImageProps) {
  const [isLoading, setIsLoading] = useState(true)
  const [hasError, setHasError] = useState(false)
  const [isInView, setIsInView] = useState(false)
  const imgRef = useRef<HTMLImageElement>(null)
  const containerRef = useRef<HTMLDivElement>(null)

  // Intersection Observer for lazy loading
  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsInView(true)
          observer.disconnect()
        }
      },
      {
        rootMargin: '50px', // Start loading 50px before the image comes into view
        threshold: 0.1
      }
    )

    if (containerRef.current) {
      observer.observe(containerRef.current)
    }

    return () => observer.disconnect()
  }, [])

  const handleLoad = () => {
    setIsLoading(false)
    setHasError(false)
  }

  const handleError = () => {
    setIsLoading(false)
    setHasError(true)
  }

  const sizeClasses = {
    sm: 'w-10 h-10',
    md: 'w-16 h-16',
    lg: 'w-24 h-24',
    full: 'w-full h-full'
  }

  const defaultFallback = <ImageIcon className="h-5 w-5 text-gray-400" />

  return (
    <div 
      ref={containerRef}
      className={cn(
        "bg-gray-200 rounded-md flex items-center justify-center overflow-hidden",
        sizeClasses[size],
        className
      )}
    >
      {isLoading && !hasError && (
        <div className="animate-pulse bg-gray-300 w-full h-full" />
      )}
      
      {isInView && !hasError && (
        <img
          ref={imgRef}
          src={src}
          alt={alt}
          className={cn(
            "object-cover transition-opacity duration-200",
            sizeClasses[size],
            isLoading ? "opacity-0" : "opacity-100"
          )}
          loading="lazy"
          decoding="async"
          onLoad={handleLoad}
          onError={handleError}
        />
      )}
      
      {hasError && (fallbackIcon || defaultFallback)}
    </div>
  )
}