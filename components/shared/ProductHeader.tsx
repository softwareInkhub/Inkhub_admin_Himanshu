'use client'

import { ChevronDown } from 'lucide-react'
import { cn } from '@/lib/utils'

interface ProductHeaderProps {
  onCreateProduct: () => void
}

export default function ProductHeader({
  onCreateProduct
}: ProductHeaderProps) {
  return (
    <div className="bg-gradient-to-r from-white to-gray-50 border-b border-gray-200 px-4 py-3 shadow-sm">
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-2">
          <div className="w-2 h-8 bg-gradient-to-b from-green-500 to-blue-600 rounded-full"></div>
          <h1 className="text-xl font-semibold text-gray-900 bg-gradient-to-r from-gray-900 to-gray-700 bg-clip-text text-transparent">
            Products
          </h1>
        </div>
        <div className="flex items-center space-x-2">
          <button 
            onClick={onCreateProduct}
            className="px-3 py-1.5 bg-gradient-to-r from-gray-900 to-gray-800 text-white rounded-md hover:from-gray-800 hover:to-gray-700 transition-all duration-200 hover:shadow-lg text-sm group transform hover:scale-105"
          >
            <span className="group-hover:scale-105 transition-transform duration-200">Add product</span>
          </button>
        </div>
      </div>
    </div>
  )
}