'use client'

import React from 'react'
import { cn } from '@/lib/utils'

interface StatusBadgeProps {
  status: string
  type?: 'status' | 'inventory' | 'payment' | 'fulfillment'
  size?: 'sm' | 'md' | 'lg'
}

export default function StatusBadge({ 
  status, 
  type = 'status',
  size = 'md'
}: StatusBadgeProps) {
  const getStatusConfig = (status: string, type: string) => {
    const statusLower = status.toLowerCase()
    
    switch (type) {
      case 'status':
        switch (statusLower) {
          case 'active':
            return {
              label: 'Active',
              color: 'bg-green-100 text-green-800 border-green-200',
              icon: '●'
            }
          case 'draft':
            return {
              label: 'Draft',
              color: 'bg-gray-100 text-gray-800 border-gray-200',
              icon: '○'
            }
          case 'archived':
            return {
              label: 'Archived',
              color: 'bg-red-100 text-red-800 border-red-200',
              icon: '●'
            }
          case 'paid':
            return {
              label: 'Paid',
              color: 'bg-green-100 text-green-800 border-green-200',
              icon: '●'
            }
          case 'unpaid':
            return {
              label: 'Unpaid',
              color: 'bg-red-100 text-red-800 border-red-200',
              icon: '●'
            }
          case 'pending':
            return {
              label: 'Pending',
              color: 'bg-yellow-100 text-yellow-800 border-yellow-200',
              icon: '●'
            }
          case 'processing':
            return {
              label: 'Processing',
              color: 'bg-blue-100 text-blue-800 border-blue-200',
              icon: '●'
            }
          case 'shipped':
            return {
              label: 'Shipped',
              color: 'bg-purple-100 text-purple-800 border-purple-200',
              icon: '●'
            }
          case 'delivered':
            return {
              label: 'Delivered',
              color: 'bg-green-100 text-green-800 border-green-200',
              icon: '●'
            }
          case 'cancelled':
            return {
              label: 'Cancelled',
              color: 'bg-red-100 text-red-800 border-red-200',
              icon: '●'
            }
          case 'refunded':
            return {
              label: 'Refunded',
              color: 'bg-orange-100 text-orange-800 border-orange-200',
              icon: '●'
            }
          default:
            return {
              label: status,
              color: 'bg-gray-100 text-gray-800 border-gray-200',
              icon: '●'
            }
        }
      
      case 'inventory':
        const quantity = parseInt(status)
        if (quantity === 0) {
          return {
            label: 'Out of Stock',
            color: 'bg-red-100 text-red-800 border-red-200',
            icon: '●'
          }
        } else if (quantity <= 10) {
          return {
            label: 'Low Stock',
            color: 'bg-yellow-100 text-yellow-800 border-yellow-200',
            icon: '●'
          }
        } else {
          return {
            label: 'In Stock',
            color: 'bg-green-100 text-green-800 border-green-200',
            icon: '●'
          }
        }
      
      case 'payment':
        switch (statusLower) {
          case 'paid':
            return {
              label: 'Paid',
              color: 'bg-green-100 text-green-800 border-green-200',
              icon: '●'
            }
          case 'pending':
            return {
              label: 'Pending',
              color: 'bg-yellow-100 text-yellow-800 border-yellow-200',
              icon: '●'
            }
          case 'refunded':
            return {
              label: 'Refunded',
              color: 'bg-orange-100 text-orange-800 border-orange-200',
              icon: '●'
            }
          default:
            return {
              label: status,
              color: 'bg-gray-100 text-gray-800 border-gray-200',
              icon: '●'
            }
        }
      
      case 'fulfillment':
        switch (statusLower) {
          case 'fulfilled':
            return {
              label: 'Fulfilled',
              color: 'bg-green-100 text-green-800 border-green-200',
              icon: '●'
            }
          case 'unfulfilled':
            return {
              label: 'Unfulfilled',
              color: 'bg-red-100 text-red-800 border-red-200',
              icon: '●'
            }
          case 'partial':
            return {
              label: 'Partial',
              color: 'bg-yellow-100 text-yellow-800 border-yellow-200',
              icon: '●'
            }
          default:
            return {
              label: status,
              color: 'bg-gray-100 text-gray-800 border-gray-200',
              icon: '●'
            }
        }
      
      default:
        return {
          label: status,
          color: 'bg-gray-100 text-gray-800 border-gray-200',
          icon: '●'
        }
    }
  }

  const config = getStatusConfig(status, type)
  
  const sizeClasses = {
    sm: 'px-2 py-0.5 text-xs',
    md: 'px-2.5 py-1 text-sm',
    lg: 'px-3 py-1.5 text-base'
  }

  return (
    <span className={cn(
      'inline-flex items-center space-x-1 rounded-full border font-medium',
      config.color,
      sizeClasses[size]
    )}>
      <span className="text-xs">{config.icon}</span>
      <span>{config.label}</span>
    </span>
  )
}