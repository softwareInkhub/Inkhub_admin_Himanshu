'use client'

import { useState } from 'react'
import { cn } from '@/lib/utils'
import ProductImage from './ProductImage'
import HighlightedText from './HighlightedText'
import { Product } from '../types'

interface ProductCardViewProps {
  currentProducts: Product[]
  selectedProducts: string[]
  onSelectProduct: (productId: string) => void
  onProductClick: (product: Product, event: React.MouseEvent) => void
  getStatusBadge: (status: string, type: 'status' | 'inventory') => { className: string; text: string }
  cardsPerRow?: number
  searchQuery?: string
  showImages?: boolean
}

export default function ProductCardView({
  currentProducts,
  selectedProducts,
  onSelectProduct,
  onProductClick,
  getStatusBadge,
  cardsPerRow = 4,
  searchQuery = '',
  showImages = true
}: ProductCardViewProps) {
  const [hoveredProduct, setHoveredProduct] = useState<string | null>(null)
  
  // Generate grid classes based on cards per row
  const getGridClasses = (cardsPerRow: number) => {
    const baseClasses = "grid gap-4 p-6"
    
    // Handle cases where Tailwind doesn't have the class
    const getGridColsClass = (cols: number) => {
      if (cols <= 6) {
        return `grid-cols-${cols}`
      } else {
        // For 7 and 8 columns, use custom CSS
        return `grid-cols-6`
      }
    }
    
    const mdCols = Math.min(cardsPerRow, 4)
    const lgCols = Math.min(cardsPerRow, 5)
    const xlCols = cardsPerRow
    
    const responsiveClasses = `grid-cols-2 sm:grid-cols-3 md:${getGridColsClass(mdCols)} lg:${getGridColsClass(lgCols)} xl:${getGridColsClass(xlCols)}`
    
    // Add custom CSS for 7 and 8 columns
    const customStyle = cardsPerRow > 6 ? { gridTemplateColumns: `repeat(${cardsPerRow}, minmax(0, 1fr))` } : {}
    
    return {
      className: `${baseClasses} ${responsiveClasses}`,
      style: customStyle
    }
  }

  return (
    <div 
      className={getGridClasses(cardsPerRow).className}
      style={getGridClasses(cardsPerRow).style}
    >
        {currentProducts.map((product) => (
          <div
            key={product.id}
            className={cn(
              "relative group cursor-pointer transition-all duration-200",
              "hover:scale-105 hover:shadow-lg border border-gray-300 rounded-lg",
              selectedProducts.includes(product.id) && "ring-2 ring-blue-500 ring-offset-2"
            )}
            onClick={(e) => onProductClick(product, e)}
            onMouseEnter={() => setHoveredProduct(product.id)}
            onMouseLeave={() => setHoveredProduct(null)}
          >
            {/* Checkbox overlay */}
            <div className="absolute top-2 left-2 z-10">
              <input
                type="checkbox"
                checked={selectedProducts.includes(product.id)}
                onChange={(e) => {
                  e.stopPropagation()
                  onSelectProduct(product.id)
                }}
                className="rounded border-gray-300 text-blue-600 focus:ring-blue-500 bg-white/80 backdrop-blur-sm"
              />
            </div>

            {/* Product Image */}
            <div className="relative aspect-square rounded-lg overflow-hidden bg-gray-100">
              {showImages ? (
                <ProductImage
                  src={product.images?.[0] || ''}
                  alt={product.title}
                  size="full"
                  className="w-full h-full object-cover"
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center bg-gray-200">
                  <svg className="w-12 h-12 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                  </svg>
                </div>
              )}
              
              {/* Hover overlay with product info */}
              <div className={cn(
                "absolute inset-0 bg-black/60 text-white p-3 flex flex-col justify-end transition-opacity duration-200",
                hoveredProduct === product.id ? "opacity-100" : "opacity-0"
              )}>
                <div className="space-y-1">
                  <h3 className="text-sm font-medium line-clamp-2">
                    {searchQuery && product._highlightResult?.title?.value ? (
                      <HighlightedText 
                        text={product._highlightResult.title.value}
                        className="text-white"
                      />
                    ) : (
                      product.title
                    )}
                  </h3>
                  <p className="text-xs text-gray-300">{product.vendor}</p>
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-semibold">₹{product.price}</span>
                    {(() => {
                      const badge = getStatusBadge(product.status, 'status')
                      return (
                        <span className={cn(
                          "text-xs px-1.5 py-0.5 rounded-full",
                          badge.className.includes('green') ? "bg-green-500/20 text-green-200" :
                          badge.className.includes('blue') ? "bg-blue-500/20 text-blue-200" :
                          "bg-gray-500/20 text-gray-200"
                        )}>
                          {badge.text}
                        </span>
                      )
                    })()}
                  </div>
                  <div className="flex items-center justify-between text-xs text-gray-300">
                    <span>Stock: {product.inventoryQuantity}</span>
                    <span>{product.productType}</span>
                  </div>
                </div>
              </div>

              {/* Status indicator dot */}
              <div className={cn(
                "absolute top-2 right-2 w-3 h-3 rounded-full border-2 border-white",
                product.status === 'active' ? "bg-green-500" :
                product.status === 'draft' ? "bg-blue-500" :
                "bg-gray-500"
              )} />
            </div>


          </div>
        ))}
      </div>
  )
}
