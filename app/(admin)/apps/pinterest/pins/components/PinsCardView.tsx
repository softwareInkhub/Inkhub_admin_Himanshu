'use client'

import React from 'react'
import { Pin } from '../types'
import { getStatusBadge } from '../utils'

interface PinsCardViewProps {
  pins: Pin[]
  selectedPins: string[]
  onSelectPin: (id: string) => void
  onPinClick: (pin: Pin) => void
  searchQuery?: string
  showImages?: boolean
}

export default function PinsCardView({
  pins,
  selectedPins,
  onSelectPin,
  onPinClick,
  searchQuery = '',
  showImages = true
}: PinsCardViewProps) {
  const handlePinClick = (e: React.MouseEvent, pin: Pin) => {
    e.stopPropagation()
    onPinClick(pin)
  }

  const handleSelectPin = (e: React.ChangeEvent<HTMLInputElement>, pinId: string) => {
    e.stopPropagation()
    onSelectPin(pinId)
  }

  return (
    <div className="space-y-4">
      {pins.map((pin) => (
        <div
          key={pin.id}
          className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow cursor-pointer"
          onClick={(e) => handlePinClick(e, pin)}
        >
          <div className="flex items-start space-x-4">
            <div className="flex items-center space-x-3">
              <input
                type="checkbox"
                checked={selectedPins.includes(pin.id)}
                onChange={(e) => handleSelectPin(e, pin.id)}
                className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                onClick={(e) => e.stopPropagation()}
              />
              {showImages ? (
                <div className="w-16 h-16 rounded-md overflow-hidden bg-gray-100 flex-shrink-0">
                  {pin.image ? (
                    <img 
                      src={pin.image} 
                      alt={pin.title || 'Pin'}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="w-full h-full bg-gray-200 flex items-center justify-center">
                      <svg className="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                      </svg>
                    </div>
                  )}
                </div>
              ) : (
                <div className="w-16 h-16 flex items-center justify-center bg-gray-200 rounded-lg">
                  <svg className="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                  </svg>
                </div>
              )}
            </div>
            
            <div className="flex-1 min-w-0">
              <h3 className="font-medium text-gray-900 mb-1 line-clamp-2">
                {pin.title || 'Untitled Pin'}
              </h3>
              
              <p className="text-sm text-gray-500 mb-2">{pin.board || 'No Board'}</p>
              
              <div className="flex items-center space-x-4 mb-2">
                <span className="text-sm text-gray-500">Owner: {pin.owner || 'Unknown'}</span>
                {(() => {
                  const badge = getStatusBadge(pin.type || 'image', 'type')
                  return <span className={badge.className}>{badge.text}</span>
                })()}
              </div>
              
              <div className="flex items-center space-x-6 text-sm text-gray-500">
                <span>❤️ {pin.likes?.toLocaleString() || '0'} likes</span>
                <span>💬 {pin.comments?.toLocaleString() || '0'} comments</span>
                <span>📌 {pin.repins?.toLocaleString() || '0'} repins</span>
              </div>
              
              {pin.tags && pin.tags.length > 0 && (
                <div className="flex flex-wrap gap-1 mt-2">
                  {pin.tags.slice(0, 3).map((tag, index) => (
                    <span
                      key={index}
                      className="px-2 py-1 bg-blue-100 text-blue-800 text-xs rounded-full"
                    >
                      {tag}
                    </span>
                  ))}
                  {pin.tags.length > 3 && (
                    <span className="text-xs text-gray-500">
                      +{pin.tags.length - 3}
                    </span>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
      ))}
    </div>
  )
}
