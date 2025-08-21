'use client'

import { useState } from 'react'
import { format } from 'date-fns'
import { Order } from '../types'

interface OrderCardViewProps {
  data: Order[]
  columns: any[]
  selectedItems: string[]
  onSelectItem: (id: string) => void
  onOrderClick?: (order: Order, event: React.MouseEvent) => void
  viewMode: 'table' | 'grid' | 'card'
  cardsPerRow?: number
  onCardsPerRowChange?: (count: number) => void
  loading?: boolean
  error?: string | null
  searchQuery?: string
  isFullScreen?: boolean
}

export default function OrderCardView({
  data,
  columns,
  selectedItems,
  onSelectItem,
  onOrderClick,
  viewMode,
  cardsPerRow = 4,
  onCardsPerRowChange,
  loading = false,
  error = null,
  searchQuery = '',
  isFullScreen = false
}: OrderCardViewProps) {
  // Note: This component now displays as a List View instead of Card Grid View
  const [hoveredCard, setHoveredCard] = useState<string | null>(null)

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-gray-500">Loading orders...</div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-red-500">Error: {error}</div>
      </div>
    )
  }

  if (data.length === 0) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-gray-500">No orders found</div>
      </div>
    )
  }



  return (
    <div>
      <div className="space-y-2">
        {data.map((order) => (
          <div
            key={order.id}
            className={`bg-white border rounded-lg p-3 cursor-pointer transition-all duration-200 ${
              hoveredCard === order.id ? 'shadow-md border-blue-300' : 'border-gray-200 hover:border-gray-300'
            }`}
            onMouseEnter={() => setHoveredCard(order.id)}
            onMouseLeave={() => setHoveredCard(null)}
            onClick={(e) => {
              if ((e.target as HTMLElement).closest('input,button')) return
              if (onOrderClick) {
                onOrderClick(order, e)
              } else {
                onSelectItem(order.id)
              }
            }}
          >
            {/* List Item Header */}
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <input
                  type="checkbox"
                  checked={selectedItems.includes(order.id)}
                  onChange={() => onSelectItem(order.id)}
                  onClick={(e: React.MouseEvent) => e.stopPropagation()}
                  className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                />
                <div className="flex items-center space-x-2">
                  <span className="text-sm font-medium text-gray-900">#{order.orderNumber}</span>
                  {order.hasWarning && (
                    <div className="w-3 h-3 bg-yellow-500 rounded-full flex items-center justify-center">
                      <span className="text-xs text-white">!</span>
                    </div>
                  )}
                  {order.hasDocument && (
                    <div className="w-3 h-3 bg-blue-500 rounded-full flex items-center justify-center">
                      <span className="text-xs text-white">D</span>
                    </div>
                  )}
                </div>
              </div>
              <span className="text-sm font-medium text-green-600">₹{(order.total || 0).toFixed(2)}</span>
            </div>

            {/* List Item Content */}
            <div className="flex items-center space-x-6 mt-2">
              {/* Customer Info */}
              <div className="flex-1 min-w-0">
                <div className="text-sm font-medium text-gray-900 truncate">{order.customerName}</div>
                <div className="text-xs text-gray-500 truncate">{order.customerEmail}</div>
              </div>

              {/* Status */}
              <div className="flex-shrink-0">
                <span className={`inline-flex px-2 py-1 text-xs font-medium rounded-full ${
                  order.fulfillmentStatus === 'fulfilled' ? 'bg-green-100 text-green-800' :
                  order.fulfillmentStatus === 'unfulfilled' ? 'bg-red-100 text-red-800' :
                  'bg-yellow-100 text-yellow-800'
                }`}>
                  {order.fulfillmentStatus}
                </span>
              </div>

              {/* Items */}
              <div className="flex-shrink-0 text-xs text-gray-500">
                {order.items?.length || 0} item{(order.items?.length || 0) !== 1 ? 's' : ''}
              </div>

              {/* Date */}
              <div className="flex-shrink-0 text-xs text-gray-500">
                {order.createdAt ? format(new Date(order.createdAt), 'MMM dd, yyyy') : 'No date'}
              </div>

              {/* Tags */}
              <div className="flex-shrink-0">
                {order.tags && order.tags.length > 0 && (
                  <div className="flex gap-1">
                    {order.tags.slice(0, 2).map((tag, index) => (
                      <span key={index} className="px-1 py-0.5 bg-blue-100 text-blue-700 text-xs rounded">
                        {tag}
                      </span>
                    ))}
                    {order.tags.length > 2 && (
                      <span className="px-1 py-0.5 bg-gray-100 text-gray-700 text-xs rounded">
                        +{order.tags.length - 2}
                      </span>
                    )}
                  </div>
                )}
              </div>

              {/* Channel & Delivery */}
              <div className="flex-shrink-0 text-xs text-gray-500">
                <div className="truncate max-w-32">{order.channel}</div>
                <div className="truncate max-w-32">{order.deliveryMethod}</div>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
