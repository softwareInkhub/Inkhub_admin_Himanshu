'use client'

import React from 'react'

interface ImageDisplayProps {
  src: string
  alt?: string
  size?: 'sm' | 'md' | 'lg'
}

const sizeToClass: Record<NonNullable<ImageDisplayProps['size']>, string> = {
  sm: 'w-8 h-8',
  md: 'w-12 h-12',
  lg: 'w-16 h-16',
}

export default function ImageDisplay({ src, alt = '', size = 'md' }: ImageDisplayProps) {
  return (
    <div className={`rounded-md overflow-hidden bg-gray-100 flex-shrink-0 ${sizeToClass[size]}`}>
      {src ? (
        <img src={src} alt={alt} className="w-full h-full object-cover" />
      ) : (
        <div className="w-full h-full flex items-center justify-center text-gray-400">No image</div>
      )}
    </div>
  )
}

















