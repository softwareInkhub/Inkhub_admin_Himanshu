'use client'

import { format } from 'date-fns'
import { cn } from '@/lib/utils'
import GridColumnHeader from './GridColumnHeader'
import { generateProductColumnHeaders } from './utils/columnHeaderUtils'
import ProductImage from './ProductImage'
import HighlightedText from './HighlightedText'
import { useImagePreloader } from './hooks'

interface Product {
  id: string
  title: string
  handle: string
  vendor: string
  productType: string
  price: number
  compareAtPrice?: number
  cost: number
  inventoryQuantity: number
  status: 'active' | 'draft' | 'archived'
  publishedAt?: string
  createdAt: string
  updatedAt: string
  tags: string[]
  images: string[]
  variants: ProductVariant[]
  collections: string[]
  selected?: boolean
  salesChannels?: number
  category?: string
  seoTitle?: string
  seoDescription?: string
  _highlightResult?: {
    title: {
      value: string
      matchLevel: string
      fullyHighlighted: boolean
      matchedWords: string[]
    }
    vendor: {
      value: string
      matchLevel: string
      matchedWords: string[]
    }
    product_type: {
      value: string
      matchLevel: string
      matchedWords: string[]
    }
  }
}

interface ProductVariant {
  id: string
  title: string
  price: number
  compareAtPrice?: number
  inventoryQuantity: number
  sku: string
  barcode?: string
  weight?: number
  weightUnit: string
}

interface ProductTableProps {
  currentProducts: Product[]
  selectedProducts: string[]
  onSelectProduct: (productId: string) => void
  onSelectAll: () => void
  onProductClick: (product: Product, event: React.MouseEvent) => void
  getStatusBadge: (status: string, type: 'status' | 'inventory') => { className: string; text: string }
  activeColumnFilter: string | null
  columnFilters: Record<string, any>
  onFilterClick: (column: string) => void
  onColumnFilterChange: (column: string, value: any) => void
  getUniqueValues: (field: string) => string[]
  isFullScreen?: boolean
  searchQuery?: string
  showImages?: boolean
}

export default function ProductTable({
  currentProducts,
  selectedProducts,
  onSelectProduct,
  onSelectAll,
  onProductClick,
  getStatusBadge,
  activeColumnFilter,
  columnFilters,
  onFilterClick,
  onColumnFilterChange,
  getUniqueValues,
  isFullScreen = false,
  searchQuery = '',
  showImages = true
}: ProductTableProps) {
  // Preload first 5 images for better perceived performance (reduced from 10 to avoid overwhelming)
  const firstImages = (currentProducts || []).slice(0, 5).map(p => p.images?.[0]).filter(Boolean) as string[]
  useImagePreloader(firstImages)

  return (
    <>
      {/* Global CSS fix for table filter dropdowns */}
      <style jsx global>{`
        .column-filter-dropdown {
          z-index: 999999 !important;
          position: fixed !important;
        }
        
        /* Ensure dropdowns are always above other elements */
        .column-filter-dropdown * {
          z-index: inherit;
        }
        
        /* Fix for table view only */
        table .column-filter-dropdown {
          z-index: 999999 !important;
        }
        
        /* Ensure dropdowns are not clipped by parent containers */
        .column-filter-dropdown {
          position: fixed !important;
          transform: translateZ(0);
        }
      `}</style>
      
      {/* Column Header - Same as Grid/Card View */}
      <div className={cn(
          isFullScreen ? "sticky top-0 z-10" : ""
        )}>
        <GridColumnHeader
          columns={generateProductColumnHeaders()}
              activeColumnFilter={activeColumnFilter}
              columnFilters={columnFilters}
              onFilterClick={onFilterClick}
              onColumnFilterChange={onColumnFilterChange}
          getUniqueValues={getUniqueValues}
          allSelected={selectedProducts.length === (currentProducts || []).length && (currentProducts || []).length > 0}
          onSelectAll={onSelectAll}
            />
      </div>

      <table className="min-w-full divide-y divide-gray-200">
        <thead className="hidden">
          {/* Hidden thead for table structure, actual header is above */}
          <tr>
            <th></th>
          </tr>
        </thead>
        <tbody className="bg-white">
          {(currentProducts || []).map((product, index) => (
            <tr 
              key={`${product.id}-${index}`} 
              onClick={(e) => onProductClick(product, e)}
              className={cn(
                "hover:bg-gray-50 transition-colors cursor-pointer",
                index < (currentProducts || []).length - 1 ? "border-b border-gray-200" : ""
              )}
            >
              <td className="px-2 py-1.5 whitespace-nowrap border-r border-gray-200">
                <input
                  type="checkbox"
                  checked={selectedProducts.includes(product.id)}
                  onChange={() => onSelectProduct(product.id)}
                  className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                />
              </td>
              <td className="px-2 py-1.5 whitespace-nowrap border-r border-gray-200">
                <div className="flex items-center justify-center">
                  <span className="text-sm font-medium text-gray-600">#{index + 1}</span>
                </div>
              </td>
              <td className="px-2 py-1.5 whitespace-nowrap border-r border-gray-200">
                <div className="flex items-center space-x-3">
                  {showImages && (
                    <ProductImage
                      src={product.images?.[0] || ''}
                      alt={product.title}
                      size="sm"
                    />
                  )}
                  <div>
                    <div className="text-sm font-medium text-gray-900">
                      {searchQuery && product._highlightResult?.title?.value ? (
                        <HighlightedText 
                          text={product._highlightResult.title.value}
                          className="text-gray-900"
                        />
                      ) : (
                        product.title
                      )}
                    </div>
                  </div>
                </div>
              </td>
              <td className="px-2 py-1.5 whitespace-nowrap border-r border-gray-200">
                {(() => {
                  const badge = getStatusBadge(product.status, 'status')
                  return <span className={badge.className}>{badge.text}</span>
                })()}
              </td>
              <td className="px-2 py-1.5 whitespace-nowrap border-r border-gray-200">
                {(() => {
                  const badge = getStatusBadge((product.inventoryQuantity || 0).toString(), 'inventory')
                  return <span className={badge.className}>{badge.text}</span>
                })()}
              </td>
              <td className="px-2 py-1.5 whitespace-nowrap border-r border-gray-200">
                <div>
                  <span className="text-sm font-medium text-green-600">₹{(product.price || 0).toFixed(2)}</span>
                  {product.compareAtPrice && (
                    <div className="text-xs text-gray-500 line-through">₹{(product.compareAtPrice || 0).toFixed(2)}</div>
                  )}
                </div>
              </td>
              <td className="px-2 py-1.5 whitespace-nowrap border-r border-gray-200">
                <span className="text-sm text-gray-900">{product.productType || 'N/A'}</span>
              </td>
              <td className="px-2 py-1.5 whitespace-nowrap border-r border-gray-200">
                <span className="text-sm text-gray-900">{product.vendor}</span>
              </td>
              <td className="px-2 py-1.5 whitespace-nowrap border-r border-gray-200">
                <span className="text-sm text-gray-900">{product.category || 'Uncategorized'}</span>
              </td>

              <td className="px-2 py-1.5 whitespace-nowrap border-r border-gray-200">
                <span className="text-sm text-gray-500">
                  {product.createdAt ? format(new Date(product.createdAt), 'MMM dd, yyyy') : 'N/A'}
                </span>
              </td>
              <td className="px-2 py-1.5 whitespace-nowrap">
                <span className="text-sm text-gray-500">
                  {product.updatedAt ? format(new Date(product.updatedAt), 'MMM dd, yyyy') : 'N/A'}
                </span>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </>
  )
}