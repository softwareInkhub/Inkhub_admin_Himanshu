'use client'

import { useState, useRef, useEffect } from 'react'
import { X, Edit, Trash, Save, Upload, Eye, Image as ImageIcon, Braces, Clipboard } from 'lucide-react'
import JsonViewer from './JsonViewer'
import { cn } from '@/lib/utils'

interface EnhancedDetailModalProps {
  isOpen: boolean
  onClose: () => void
  item: any
  itemType: 'pin' | 'board' | 'design' | 'product' | 'order'
  onEdit?: (id: string, data: any) => Promise<void>
  onDelete?: (id: string) => Promise<void>
  onSave?: (id: string, data: any) => Promise<void>
}

export default function EnhancedDetailModal({
  isOpen,
  onClose,
  item,
  itemType,
  onEdit,
  onDelete,
  onSave
}: EnhancedDetailModalProps) {
  const [isEditing, setIsEditing] = useState(false)
  const [isDeleting, setIsDeleting] = useState(false)
  const [isSaving, setIsSaving] = useState(false)
  const [editedData, setEditedData] = useState<any>({})
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false)
  const [imageLoading, setImageLoading] = useState(false)
  const [imageError, setImageError] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [showJson, setShowJson] = useState(false)
  const [copied, setCopied] = useState(false)

  const copyJsonToClipboard = async () => {
    try {
      const text = JSON.stringify(isEditing ? editedData : item, null, 2)
      if (typeof navigator !== 'undefined' && navigator.clipboard && window.isSecureContext) {
        await navigator.clipboard.writeText(text)
      } else {
        const textarea = document.createElement('textarea')
        textarea.value = text
        textarea.style.position = 'fixed'
        textarea.style.left = '-9999px'
        document.body.appendChild(textarea)
        textarea.focus()
        textarea.select()
        try { document.execCommand('copy') } catch {}
        document.body.removeChild(textarea)
      }
      setCopied(true)
      setTimeout(() => setCopied(false), 1500)
    } catch (e) {
      console.error('Copy failed:', e)
    }
  }

  // Keyboard shortcuts: Esc = close, J = toggle JSON, C = copy JSON
  useEffect(() => {
    if (!isOpen) return
    const handler = async (e: KeyboardEvent) => {
      // Ignore when focused inside inputs/textareas/selects/contenteditable
      const target = e.target as HTMLElement | null
      const tag = (target?.tagName || '').toLowerCase()
      const isTyping = tag === 'input' || tag === 'textarea' || tag === 'select' || target?.isContentEditable
      if (isTyping) return

      // Escape closes modal
      if (e.key === 'Escape') {
        e.preventDefault()
        onClose()
        return
      }

      // Ignore if any modifier is pressed
      if (e.altKey || e.ctrlKey || e.metaKey || e.shiftKey) return

      // J toggles JSON view
      if (e.key.toLowerCase() === 'j') {
        e.preventDefault()
        setShowJson(prev => !prev)
        return
      }

      // C copies JSON
      if (e.key.toLowerCase() === 'c') {
        await copyJsonToClipboard()
        return
      }
    }
    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  }, [isOpen, showJson, isEditing, editedData, item, onClose])

  // Initialize edited data when modal opens
  useEffect(() => {
    if (isOpen && item) {
      setEditedData({ ...item })
      
      // Preload image if available
      if (item.image || item.designImageUrl) {
        setImageLoading(true)
        setImageError(false)
        const img = new Image()
        img.onload = () => {
          setImageLoading(false)
          setImageError(false)
        }
        img.onerror = () => {
          setImageLoading(false)
          setImageError(true)
        }
        img.src = getOptimizedImageUrl(item.image || item.designImageUrl)
      }
    }
  }, [isOpen, item])

  const handleEdit = () => {
    setIsEditing(true)
  }

  const handleSave = async () => {
    if (!onSave) return
    
    setIsSaving(true)
    try {
      await onSave(item.id, editedData)
      setIsEditing(false)
      // Refresh the item data
      Object.assign(item, editedData)
    } catch (error) {
      console.error('Error saving item:', error)
    } finally {
      setIsSaving(false)
    }
  }

  const handleDelete = async () => {
    if (!onDelete) return
    
    setIsDeleting(true)
    try {
      await onDelete(item.id)
      onClose()
    } catch (error) {
      console.error('Error deleting item:', error)
    } finally {
      setIsDeleting(false)
      setShowDeleteConfirm(false)
    }
  }

  const handleImageUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (file) {
      const reader = new FileReader()
      reader.onload = (e) => {
        setEditedData((prev: any) => ({
          ...prev,
          image: e.target?.result as string
        }))
      }
      reader.readAsDataURL(file)
    }
  }

  const handleInputChange = (field: string, value: any) => {
    setEditedData((prev: any) => ({
      ...prev,
      [field]: value
    }))
  }

  const handleImageLoad = () => {
    setImageLoading(false)
    setImageError(false)
  }

  const handleImageError = () => {
    setImageLoading(false)
    setImageError(true)
  }

  const handleImageLoadStart = () => {
    setImageLoading(true)
    setImageError(false)
  }

  // Optimize image URL for better loading performance
  const getOptimizedImageUrl = (url: string) => {
    if (!url) return url
    
    // For S3 URLs, add optimization parameters
    if (url.includes('s3.amazonaws.com')) {
      const separator = url.includes('?') ? '&' : '?'
      return `${url}${separator}w=800&h=600&fit=crop&auto=format&q=80`
    }
    
    return url
  }

  const getItemTypeConfig = () => {
    switch (itemType) {
      case 'pin':
        return {
          title: 'Pin Details',
          imageField: 'image',
          fields: [
            { key: 'title', label: 'Title', type: 'text' },
            { key: 'description', label: 'Description', type: 'textarea' },
            { key: 'board', label: 'Board', type: 'text' },
            { key: 'owner', label: 'Owner', type: 'text' },
            { key: 'type', label: 'Type', type: 'select', options: ['image', 'video', 'article'] },
            { key: 'status', label: 'Status', type: 'select', options: ['active', 'archived'] },
            { key: 'likes', label: 'Likes', type: 'number' },
            { key: 'comments', label: 'Comments', type: 'number' },
            { key: 'repins', label: 'Repins', type: 'number' },
            { key: 'tags', label: 'Tags', type: 'tags' }
          ]
        }
      case 'board':
        return {
          title: 'Board Details',
          imageField: 'image',
          fields: [
            { key: 'name', label: 'Name', type: 'text' },
            { key: 'description', label: 'Description', type: 'textarea' },
            { key: 'owner', label: 'Owner', type: 'text' },
            { key: 'category', label: 'Category', type: 'text' },
            { key: 'privacy', label: 'Privacy', type: 'select', options: ['public', 'private'] },
            { key: 'status', label: 'Status', type: 'select', options: ['active', 'archived'] },
            { key: 'pinCount', label: 'Pin Count', type: 'number' },
            { key: 'followers', label: 'Followers', type: 'number' },
            { key: 'tags', label: 'Tags', type: 'tags' }
          ]
        }
      case 'design':
        return {
          title: 'Design Details',
          imageField: 'image',
          fields: [
            { key: 'name', label: 'Name', type: 'text' },
            { key: 'description', label: 'Description', type: 'textarea' },
            { key: 'type', label: 'Type', type: 'select', options: ['logo', 'banner', 'social_media', 'print', 'web', 'illustration'] },
            { key: 'category', label: 'Category', type: 'text' },
            { key: 'status', label: 'Status', type: 'select', options: ['completed', 'in_progress', 'pending', 'approved', 'rejected'] },
            { key: 'price', label: 'Price', type: 'number' },
            { key: 'size', label: 'Size', type: 'text' },
            { key: 'views', label: 'Views', type: 'number' },
            { key: 'downloads', label: 'Downloads', type: 'number' },
            { key: 'tags', label: 'Tags', type: 'tags' }
          ]
        }
      case 'product':
        return {
          title: 'Product Details',
          imageField: 'images',
          fields: [
            { key: 'title', label: 'Title', type: 'text' },
            { key: 'description', label: 'Description', type: 'textarea' },
            { key: 'price', label: 'Price', type: 'number' },
            { key: 'status', label: 'Status', type: 'select', options: ['active', 'draft', 'archived'] },
            { key: 'productType', label: 'Product Type', type: 'text' },
            { key: 'category', label: 'Category', type: 'text' },
            { key: 'vendor', label: 'Vendor', type: 'text' },
            { key: 'inventoryQuantity', label: 'Inventory Quantity', type: 'number' },
            { key: 'sku', label: 'SKU', type: 'text' },
            { key: 'createdAt', label: 'Created At', type: 'date' },
            { key: 'updatedAt', label: 'Updated At', type: 'date' },
            { key: 'tags', label: 'Tags', type: 'tags' }
          ]
        }
      case 'order':
        return {
          title: 'Order Details',
          imageField: 'image',
          fields: [
            { key: 'orderNumber', label: 'Order Number', type: 'text' },
            { key: 'customerName', label: 'Customer Name', type: 'text' },
            { key: 'customerEmail', label: 'Customer Email', type: 'text' },
            { key: 'status', label: 'Status', type: 'select', options: ['pending', 'processing', 'shipped', 'delivered', 'cancelled'] },
            { key: 'fulfillmentStatus', label: 'Fulfillment Status', type: 'select', options: ['unfulfilled', 'partial', 'fulfilled'] },
            { key: 'financialStatus', label: 'Financial Status', type: 'select', options: ['pending', 'paid', 'refunded'] },
            { key: 'total', label: 'Total', type: 'number' },
            { key: 'items', label: 'Items', type: 'number' },
            { key: 'channel', label: 'Channel', type: 'text' },
            { key: 'deliveryMethod', label: 'Delivery Method', type: 'text' },
            { key: 'createdAt', label: 'Created At', type: 'date' },
            { key: 'updatedAt', label: 'Updated At', type: 'date' },
            { key: 'tags', label: 'Tags', type: 'tags' }
          ]
        }
      default:
        return { title: 'Item Details', imageField: 'image', fields: [] }
    }
  }

  const config = getItemTypeConfig()
  const currentData = isEditing ? editedData : item

  if (!isOpen || !item) return null

  const renderField = (field: any) => {
    const value = currentData[field.key] || ''
    
    if (!isEditing) {
      return (
        <div key={field.key} className="mb-4">
          <label className="block text-sm font-medium text-gray-700 mb-1">
            {field.label}
          </label>
          <div className="text-sm text-gray-900">
            {field.type === 'textarea' ? (
              <p className="whitespace-pre-wrap">{value}</p>
            ) : field.type === 'tags' && Array.isArray(value) ? (
              <div className="flex flex-wrap gap-1">
                {value.map((tag: string, index: number) => (
                  <span
                    key={index}
                    className="px-2 py-1 bg-blue-100 text-blue-800 text-xs rounded-full"
                  >
                    {tag}
                  </span>
                ))}
              </div>
            ) : field.type === 'date' ? (
              <span>{new Date(value).toLocaleDateString()}</span>
            ) : (
              <span>{value}</span>
            )}
          </div>
        </div>
      )
    }

    return (
      <div key={field.key} className="mb-4">
        <label className="block text-sm font-medium text-gray-700 mb-1">
          {field.label}
        </label>
        {field.type === 'textarea' ? (
          <textarea
            value={value}
            onChange={(e) => handleInputChange(field.key, e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
            rows={3}
          />
        ) : field.type === 'select' ? (
          <select
            value={value}
            onChange={(e) => handleInputChange(field.key, e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          >
            {field.options?.map((option: string) => (
              <option key={option} value={option}>
                {option.charAt(0).toUpperCase() + option.slice(1)}
              </option>
            ))}
          </select>
        ) : field.type === 'tags' ? (
          <input
            type="text"
            value={Array.isArray(value) ? value.join(', ') : value}
            onChange={(e) => handleInputChange(field.key, e.target.value.split(',').map(tag => tag.trim()))}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            placeholder="Enter tags separated by commas"
          />
        ) : field.type === 'date' ? (
          <input
            type="date"
            value={value ? new Date(value).toISOString().split('T')[0] : ''}
            onChange={(e) => handleInputChange(field.key, e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
        ) : (
          <input
            type={field.type === 'number' ? 'number' : 'text'}
            value={value}
            onChange={(e) => handleInputChange(field.key, field.type === 'number' ? Number(e.target.value) : e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
        )}
      </div>
    )
  }

  return (
    <>
      {/* Main Modal */}
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
        <div className="bg-white rounded-2xl shadow-xl max-w-4xl w-full max-h-[90vh] overflow-hidden flex flex-col">
          {/* Header */}
          <div className="flex items-center justify-between p-4 border-b border-gray-200 flex-shrink-0">
            <h2 className="text-xl font-semibold text-gray-900">{config.title}</h2>
            <button
              onClick={onClose}
              className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
            >
              <X className="h-5 w-5" />
            </button>
          </div>

          {/* Content */}
          <div className="p-4 overflow-y-auto flex-1 min-h-0">
            {/* Page 1: Details */}
            {!showJson && (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Left Column - Large Image */}
              <div className="space-y-4">
                {/* Large Image Display */}
                <div className="relative">
                  <div className="w-full h-64 rounded-lg overflow-hidden bg-gray-100 flex items-center justify-center">
                    {(() => {
                      // Handle different image field types
                      let imageUrl = null
                      if (config.imageField === 'images' && Array.isArray(currentData[config.imageField])) {
                        imageUrl = currentData[config.imageField][0] // Get first image from array
                      } else if (currentData[config.imageField]) {
                        imageUrl = currentData[config.imageField] // Direct image field
                      }
                      return imageUrl
                    })() ? (
                      <>
                        {/* Loading State */}
                        {imageLoading && (
                          <div className="w-full h-full flex items-center justify-center">
                            <div className="text-center">
                              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
                              <p className="text-gray-500 text-sm">Loading image...</p>
                            </div>
                          </div>
                        )}
                        
                        {/* Error State */}
                        {imageError && (
                          <div className="w-full h-full flex items-center justify-center">
                            <div className="text-center">
                              <div className="w-24 h-24 bg-gray-200 rounded-full flex items-center justify-center mx-auto mb-4">
                                <ImageIcon className="h-12 w-12 text-gray-400" />
                              </div>
                              <p className="text-gray-500 text-sm">Failed to load image</p>
                              <button 
                                onClick={() => {
                                  setImageError(false)
                                  setImageLoading(true)
                                  // Force reload with optimized URL
                                  const img = new Image()
                                  img.onload = () => {
                                    setImageLoading(false)
                                    setImageError(false)
                                  }
                                  img.onerror = () => {
                                    setImageLoading(false)
                                    setImageError(true)
                                  }
                                  const imageUrl = config.imageField === 'images' && Array.isArray(currentData[config.imageField]) 
                                    ? currentData[config.imageField][0] 
                                    : currentData[config.imageField]
                                  img.src = getOptimizedImageUrl(imageUrl)
                                }}
                                className="mt-2 text-blue-600 hover:text-blue-800 text-xs underline"
                                disabled={imageLoading}
                              >
                                {imageLoading ? 'Loading...' : 'Retry'}
                              </button>
                            </div>
                          </div>
                        )}
                        
                        {/* Image */}
                        {!imageLoading && !imageError && (() => {
                          const imageUrl = config.imageField === 'images' && Array.isArray(currentData[config.imageField]) 
                            ? currentData[config.imageField][0] 
                            : currentData[config.imageField]
                          return (
                            <img
                              src={getOptimizedImageUrl(imageUrl)}
                              alt={currentData.title || currentData.name || 'Item'}
                              className="w-full h-full object-cover"
                              loading="lazy"
                              onLoad={handleImageLoad}
                              onError={handleImageError}
                              onLoadStart={handleImageLoadStart}
                            />
                          )
                        })()}
                      </>
                    ) : (
                      <div className="w-full h-full flex items-center justify-center">
                        <div className="text-center">
                          <div className="w-24 h-24 bg-gray-200 rounded-full flex items-center justify-center mx-auto mb-4">
                            <span className="text-gray-500 text-2xl font-semibold">
                              {itemType === 'order' ? `#${currentData.orderNumber}` : 
                               itemType === 'product' ? currentData.title?.charAt(0)?.toUpperCase() : 
                               currentData.name?.charAt(0)?.toUpperCase() || '#'}
                            </span>
                          </div>
                          <p className="text-gray-500 text-sm">No image available</p>
                        </div>
                      </div>
                    )}
                  </div>
                  
                  {isEditing && (
                    <button
                      onClick={() => fileInputRef.current?.click()}
                      className="absolute top-4 right-4 p-3 bg-blue-500 text-white rounded-full hover:bg-blue-600 transition-colors shadow-lg"
                      title="Change image"
                    >
                      <Upload className="h-5 w-5" />
                    </button>
                  )}
                  
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/*"
                    onChange={handleImageUpload}
                    className="hidden"
                  />
                </div>

                {/* Image Info */}
                <div className="bg-gray-50 rounded-lg p-4">
                  <h5 className="font-medium text-gray-900 mb-3">Image Information</h5>
                  <div className="space-y-2 text-sm">
                    <div><span className="font-medium text-gray-600">Type:</span><div>{currentData.type || '-'}</div></div>
                    <div><span className="font-medium text-gray-600">Status:</span><div>{currentData.status || '-'}</div></div>
                    {currentData.category && (
                      <div><span className="font-medium text-gray-600">Category:</span><div>{currentData.category}</div></div>
                    )}
                  </div>
                </div>
              </div>

              {/* Right Column - Details */}
              <div className="space-y-4">
                {/* Header with Basic Info */}
                <div className="space-y-3">
                  <div>
                    <h4 className="text-xl font-semibold text-gray-900 mb-2">
                      {itemType === 'order' ? currentData.customerName : 
                       itemType === 'product' ? currentData.title : 
                       currentData.name || currentData.title}
                    </h4>
                    <p className="text-gray-600">
                      {itemType === 'order' ? currentData.customerEmail : 
                       itemType === 'product' ? currentData.vendor : 
                       currentData.owner || currentData.description}
                    </p>
                  </div>
                </div>

                {/* Basic Information Card */}
                <div className="bg-gray-50 rounded-lg p-4">
                  <h5 className="font-medium text-gray-900 mb-3">Basic Information</h5>
                  <div className="grid grid-cols-2 gap-3 text-sm">
                    {itemType === 'order' ? (
                      <>
                        <div><span className="font-medium text-gray-600">Total:</span><div className="text-green-600 font-semibold">₹{(currentData.total || 0).toFixed(2)}</div></div>
                        <div><span className="font-medium text-gray-600">Items:</span><div>{currentData.items?.length || 0}</div></div>
                        <div><span className="font-medium text-gray-600">Fulfillment:</span><div>{currentData.fulfillmentStatus}</div></div>
                        <div><span className="font-medium text-gray-600">Payment:</span><div>{currentData.financialStatus}</div></div>
                      </>
                    ) : itemType === 'product' ? (
                      <>
                        <div><span className="font-medium text-gray-600">Price:</span><div className="text-green-600 font-semibold">₹{(currentData.price || 0).toFixed(2)}</div></div>
                        <div><span className="font-medium text-gray-600">Status:</span><div>{currentData.status}</div></div>
                        <div><span className="font-medium text-gray-600">Inventory:</span><div>{currentData.inventoryQuantity || 0}</div></div>
                        <div><span className="font-medium text-gray-600">SKU:</span><div>{currentData.sku || '-'}</div></div>
                      </>
                    ) : (
                      <>
                        <div><span className="font-medium text-gray-600">Type:</span><div>{currentData.type}</div></div>
                        <div><span className="font-medium text-gray-600">Status:</span><div>{currentData.status}</div></div>
                        <div><span className="font-medium text-gray-600">Category:</span><div>{currentData.category}</div></div>
                        <div><span className="font-medium text-gray-600">Price:</span><div className="text-green-600 font-semibold">₹{(currentData.price || 0).toFixed(2)}</div></div>
                      </>
                    )}
                  </div>
                </div>

                {/* Dates Card */}
                <div className="bg-gray-50 rounded-lg p-4">
                  <h5 className="font-medium text-gray-900 mb-3">Dates</h5>
                  <div className="space-y-2 text-sm">
                    <div><span className="font-medium text-gray-600">Created:</span><div>{currentData.createdAt ? new Date(currentData.createdAt).toLocaleDateString() : '-'}</div></div>
                    {currentData.updatedAt && (<div><span className="font-medium text-gray-600">Updated:</span><div>{new Date(currentData.updatedAt).toLocaleDateString()}</div></div>)}
                  </div>
                </div>

                {/* Tags Card */}
                {currentData.tags && currentData.tags.length > 0 && (
                  <div className="bg-gray-50 rounded-lg p-4">
                    <h5 className="font-medium text-gray-900 mb-3">Tags</h5>
                    <div className="flex flex-wrap gap-2">
                      {currentData.tags.map((tag: string, idx: number) => (
                        <span key={idx} className="px-2 py-1 bg-blue-100 text-blue-800 text-xs rounded-full">{tag}</span>
                      ))}
                    </div>
                  </div>
                )}

                {/* Channel & Delivery Card (for orders) */}
                {itemType === 'order' && (
                  <div className="bg-gray-50 rounded-lg p-4">
                    <h5 className="font-medium text-gray-900 mb-3">Channel & Delivery</h5>
                    <div className="grid grid-cols-2 gap-3 text-sm">
                      <div><span className="font-medium text-gray-600">Channel:</span><div>{currentData.channel || '-'}</div></div>
                      <div><span className="font-medium text-gray-600">Delivery:</span><div>{currentData.deliveryMethod || '-'}</div></div>
                    </div>
                  </div>
                )}

                {/* Product Details Card (for products) */}
                {itemType === 'product' && (
                  <div className="bg-gray-50 rounded-lg p-4">
                    <h5 className="font-medium text-gray-900 mb-3">Product Details</h5>
                    <div className="space-y-2 text-sm">
                      <div><span className="font-medium text-gray-600">Type:</span><div>{currentData.productType || '-'}</div></div>
                      <div><span className="font-medium text-gray-600">Category:</span><div>{currentData.category || '-'}</div></div>
                      <div><span className="font-medium text-gray-600">Vendor:</span><div>{currentData.vendor || '-'}</div></div>
                      <div><span className="font-medium text-gray-600">Description:</span><div className="text-gray-600">{currentData.description || '-'}</div></div>
                    </div>
                  </div>
                )}

                {/* Addresses Card (for orders) */}
                {itemType === 'order' && (currentData.shippingAddress || currentData.billingAddress) && (
                  <div className="bg-gray-50 rounded-lg p-4">
                    <h5 className="font-medium text-gray-900 mb-3">Addresses</h5>
                    <div className="grid grid-cols-1 gap-4 text-sm">
                      {currentData.shippingAddress && (
                        <div>
                          <div className="font-medium text-gray-700 mb-1">Shipping</div>
                          <div className="text-gray-600">{currentData.shippingAddress.address1} {currentData.shippingAddress.address2}</div>
                          <div className="text-gray-600">{currentData.shippingAddress.city}, {currentData.shippingAddress.province}</div>
                          <div className="text-gray-600">{currentData.shippingAddress.country} {currentData.shippingAddress.zip}</div>
                        </div>
                      )}
                      {currentData.billingAddress && (
                        <div>
                          <div className="font-medium text-gray-700 mb-1">Billing</div>
                          <div className="text-gray-600">{currentData.billingAddress.address1} {currentData.billingAddress.address2}</div>
                          <div className="text-gray-600">{currentData.billingAddress.city}, {currentData.billingAddress.province}</div>
                          <div className="text-gray-600">{currentData.billingAddress.country} {currentData.billingAddress.zip}</div>
                        </div>
                      )}
                    </div>
                  </div>
                )}

                {/* Line Items Card (for orders) */}
                {itemType === 'order' && currentData.lineItems && currentData.lineItems.length > 0 && (
                  <div className="bg-gray-50 rounded-lg p-4">
                    <h5 className="font-medium text-gray-900 mb-3">Line Items ({currentData.lineItems.length})</h5>
                    <div className="space-y-2">
                      {currentData.lineItems.map((li: any, index: number) => (
                        <div key={index} className="border border-gray-200 rounded p-3 bg-white text-sm">
                          <div className="flex justify-between"><span className="font-medium">{li.title}</span><span className="text-gray-700">× {li.quantity}</span></div>
                          <div className="text-xs text-gray-600">SKU: {li.sku || '-'} {li.variantId ? ` • Variant: ${li.variantId}` : ''}</div>
                          <div className="text-xs text-gray-700">Price: ₹{li.price}</div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Additional Fields (for editing mode) */}
                {isEditing && (
                  <div className="bg-gray-50 rounded-lg p-4">
                    <h5 className="font-medium text-gray-900 mb-3">Edit Details</h5>
                    <div className="space-y-4">
                      {config.fields.slice(0, 6).map(renderField)}
                    </div>
                  </div>
                )}
              </div>
            </div>
            )}

            {/* Page 2: JSON */}
            {showJson && (
              <div className="h-full flex flex-col">
                <div className="flex items-center justify-between mb-2">
                  <h5 className="text-sm font-medium text-gray-900">Raw JSON</h5>
                  <button
                    onClick={copyJsonToClipboard}
                    className="inline-flex items-center gap-1 px-2.5 py-1.5 text-xs font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-100 hover:border-gray-400 transition-colors"
                    title="Copy JSON"
                  >
                    <Clipboard className="h-4 w-4" />
                    {copied ? 'Copied!' : 'Copy JSON'}
                  </button>
                </div>
                <div className="flex-1 min-h-0 overflow-auto border border-gray-200 rounded-lg p-3 bg-gray-50">
                  <JsonViewer
                    data={currentData}
                    collapsed={2}
                  />
                </div>
              </div>
            )}
          </div>

          {/* Footer - Action Buttons */}
          <div className="flex items-center justify-between p-4 border-t border-gray-200 bg-gray-50 flex-shrink-0">
            <div className="flex space-x-3">
              {!isEditing ? (
                <>
                  {!showJson && (
                    <>
                      <button
                        onClick={handleEdit}
                        className="flex items-center space-x-2 px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors"
                      >
                        <Edit className="h-4 w-4" />
                        <span>Edit</span>
                      </button>
                      <button
                        onClick={() => setShowDeleteConfirm(true)}
                        className="flex items-center space-x-2 px-4 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 transition-colors"
                      >
                        <Trash className="h-4 w-4" />
                        <span>Delete</span>
                      </button>
                    </>
                  )}
                  <button
                    onClick={() => setShowJson(prev => !prev)}
                    className="flex items-center space-x-2 px-4 py-2 bg-gray-800 text-white rounded-lg hover:bg-gray-900 transition-colors"
                  >
                    <Braces className="h-4 w-4" />
                    <span>{showJson ? 'Back to Details' : 'View JSON'}</span>
                  </button>
                  {showJson && (
                  <button
                    onClick={copyJsonToClipboard}
                      className="flex items-center space-x-2 px-4 py-2 bg-white text-gray-800 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
                      title="Copy JSON"
                    >
                      <Clipboard className="h-4 w-4" />
                    <span>{copied ? 'Copied!' : 'Copy JSON'}</span>
                    </button>
                  )}
                </>
              ) : (
                <>
                  <button
                    onClick={handleSave}
                    disabled={isSaving}
                    className="flex items-center space-x-2 px-4 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600 transition-colors disabled:opacity-50"
                  >
                    <Save className="h-4 w-4" />
                    <span>{isSaving ? 'Saving...' : 'Save'}</span>
                  </button>
                  <button
                    onClick={() => {
                      setIsEditing(false)
                      setEditedData({ ...item })
                    }}
                    className="px-4 py-2 bg-gray-200 text-gray-800 rounded-lg hover:bg-gray-300 transition-colors"
                  >
                    Cancel
                  </button>
                </>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Delete Confirmation Modal */}
      {showDeleteConfirm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-[60] p-4">
          <div className="bg-white rounded-lg shadow-xl max-w-md w-full">
            <div className="p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-2">Confirm Delete</h3>
              <p className="text-sm text-gray-600 mb-6">
                Are you sure you want to delete this {itemType}? This action cannot be undone.
              </p>
              <div className="flex justify-end space-x-3">
                <button
                  onClick={() => setShowDeleteConfirm(false)}
                  className="px-4 py-2 bg-gray-200 text-gray-800 rounded-lg hover:bg-gray-300 transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={handleDelete}
                  disabled={isDeleting}
                  className="px-4 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 transition-colors disabled:opacity-50"
                >
                  {isDeleting ? 'Deleting...' : 'Delete'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  )
}
