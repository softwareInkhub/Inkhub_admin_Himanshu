'use client'

import React from 'react'
import { Pin } from '../types'
import { getStatusBadge } from '../utils'

interface PinsGridProps {
  pins: Pin[]
  selectedPins: string[]
  onSelectPin: (id: string) => void
  onPinClick: (pin: Pin) => void
  cardsPerRow: number
  searchQuery?: string
  showImages?: boolean
}

export default function PinsGrid({
  pins,
  selectedPins,
  onSelectPin,
  onPinClick,
  cardsPerRow,
  searchQuery = '',
  showImages = true
}: PinsGridProps) {
  const getGridClasses = () => {
    const columnClasses = {
      1: 'grid-cols-1',
      2: 'grid-cols-1 sm:grid-cols-2',
      3: 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-3',
      4: 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-4',
      5: 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5',
      6: 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6',
    }
    return `grid ${columnClasses[cardsPerRow as keyof typeof columnClasses] || columnClasses[3]} gap-4`
  }

  const handlePinClick = (e: React.MouseEvent, pin: Pin) => {
    e.stopPropagation()
    onPinClick(pin)
  }

  const handleSelectPin = (e: React.ChangeEvent<HTMLInputElement>, pinId: string) => {
    e.stopPropagation()
    onSelectPin(pinId)
  }

  return (
    <div className={getGridClasses()}>
      {pins.map((pin) => (
        <div
          key={pin.id}
          className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow cursor-pointer"
          onClick={(e) => handlePinClick(e, pin)}
        >
          <div className="flex items-center space-x-3 mb-3">
            <input
              type="checkbox"
              checked={selectedPins.includes(pin.id)}
              onChange={(e) => handleSelectPin(e, pin.id)}
              className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
              onClick={(e) => e.stopPropagation()}
            />
            {showImages ? (
              <div className="w-12 h-12 rounded-md overflow-hidden bg-gray-100 flex-shrink-0">
                {pin.image ? (
                  <img 
                    src={pin.image} 
                    alt={pin.title || 'Pin'}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="w-full h-full bg-gray-200 flex items-center justify-center">
                    <svg className="w-6 h-6 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                    </svg>
                  </div>
                )}
              </div>
            ) : (
              <div className="w-12 h-12 flex items-center justify-center bg-gray-200 rounded-lg">
                <svg className="w-6 h-6 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                </svg>
              </div>
            )}
          </div>
          
          <h3 className="font-medium text-gray-900 mb-1 line-clamp-2">
            {pin.title || 'Untitled Pin'}
          </h3>
          
          <p className="text-sm text-gray-500 mb-2">{pin.board || 'No Board'}</p>
          
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm text-gray-500">{pin.owner || 'Unknown'}</span>
            {(() => {
              const badge = getStatusBadge(pin.type || 'image', 'type')
              return <span className={badge.className}>{badge.text}</span>
            })()}
          </div>
          
          <div className="flex items-center justify-between text-sm text-gray-500">
            <span>❤️ {pin.likes?.toLocaleString() || '0'}</span>
            <span>💬 {pin.comments?.toLocaleString() || '0'}</span>
            <span>📌 {pin.repins?.toLocaleString() || '0'}</span>
          </div>
        </div>
      ))}
    </div>
  )
}
