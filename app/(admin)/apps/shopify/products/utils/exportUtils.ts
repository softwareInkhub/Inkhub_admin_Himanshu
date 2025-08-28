import { Product } from '../types'

// Export format types
export type ExportFormat = 'csv' | 'json' | 'pdf'

// Field mapping for exports
export interface ExportField {
  key: keyof Product
  label: string
  type: 'string' | 'number' | 'date' | 'array' | 'object' | 'image'
}

export const EXPORT_FIELDS: ExportField[] = [
  { key: 'id', label: 'ID', type: 'string' },
  { key: 'title', label: 'Product Name', type: 'string' },
  { key: 'images', label: 'Images', type: 'image' },
  { key: 'vendor', label: 'Vendor', type: 'string' },
  { key: 'productType', label: 'Product Type', type: 'string' },
  { key: 'price', label: 'Price', type: 'number' },
  { key: 'compareAtPrice', label: 'Compare Price', type: 'number' },
  { key: 'cost', label: 'Cost', type: 'number' },
  { key: 'inventoryQuantity', label: 'Inventory', type: 'number' },
  { key: 'status', label: 'Status', type: 'string' },
  { key: 'category', label: 'Category', type: 'string' },
  { key: 'tags', label: 'Tags', type: 'array' },
  { key: 'createdAt', label: 'Created Date', type: 'date' },
  { key: 'updatedAt', label: 'Updated Date', type: 'date' },
  { key: 'publishedAt', label: 'Published Date', type: 'date' },
  { key: 'salesChannels', label: 'Sales Channels', type: 'number' }
]

// Format value for export
const formatValue = (value: any, type: string): string => {
  if (value === null || value === undefined) return ''
  
  switch (type) {
    case 'date':
      return value ? new Date(value).toLocaleDateString() : ''
    case 'array':
      return Array.isArray(value) ? value.join(', ') : String(value)
    case 'number':
      return typeof value === 'number' ? value.toString() : String(value)
    case 'object':
      return typeof value === 'object' ? JSON.stringify(value) : String(value)
    case 'image':
      return Array.isArray(value) && value.length > 0 ? value[0] : ''
    default:
      return String(value)
  }
}

// Helper function to get optimized image URL
const getOptimizedImageUrl = (imageUrl: string, width: number = 100, height: number = 100): string => {
  if (!imageUrl) return ''
  
  // If it's already an S3 URL with parameters, return as is
  if (imageUrl.includes('?') && imageUrl.includes('w=')) {
    return imageUrl
  }
  
  // Add S3 optimization parameters
  const separator = imageUrl.includes('?') ? '&' : '?'
  return `${imageUrl}${separator}w=${width}&h=${height}&fit=crop&auto=format&q=80`
}

// Load image as base64
const loadImageAsBase64 = async (imageUrl: string): Promise<string> => {
  return new Promise((resolve, reject) => {
    const img = new Image()
    img.crossOrigin = 'anonymous'
    
    // Set timeout for image loading
    const timeout = setTimeout(() => {
      reject(new Error('Image loading timeout'))
    }, 10000) // 10 second timeout
    
    img.onload = () => {
      clearTimeout(timeout)
      const canvas = document.createElement('canvas')
      const ctx = canvas.getContext('2d')
      
      // Set canvas size
      canvas.width = img.width
      canvas.height = img.height
      
      // Draw image
      ctx?.drawImage(img, 0, 0)
      
      // Convert to base64
      const dataURL = canvas.toDataURL('image/jpeg', 0.8)
      resolve(dataURL)
    }
    
    img.onerror = () => {
      clearTimeout(timeout)
      reject(new Error(`Failed to load image: ${imageUrl}`))
    }
    
    img.src = imageUrl
  })
}

// Export to CSV
export const exportToCSV = (products: Product[], selectedFields: string[]): void => {
  // Filter fields based on selection
  const fields = EXPORT_FIELDS.filter(field => selectedFields.includes(field.key))
  
  // Create CSV header
  const headers = fields.map(field => field.label)
  const csvHeader = headers.join(',')
  
  // Create CSV rows
  const csvRows = products.map(product => {
    const row = fields.map(field => {
      const value = product[field.key]
      const formattedValue = formatValue(value, field.type)
      // Escape commas and quotes in CSV
      return `"${formattedValue.replace(/"/g, '""')}"`
    })
    return row.join(',')
  })
  
  // Combine header and rows
  const csvContent = [csvHeader, ...csvRows].join('\n')
  
  // Create and download file
  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' })
  const link = document.createElement('a')
  const url = URL.createObjectURL(blob)
  link.setAttribute('href', url)
  link.setAttribute('download', `products_export_${new Date().toISOString().split('T')[0]}.csv`)
  link.style.visibility = 'hidden'
  document.body.appendChild(link)
  link.click()
  document.body.removeChild(link)
  URL.revokeObjectURL(url)
}

// Export to JSON
export const exportToJSON = (products: Product[], selectedFields: string[]): void => {
  // Filter fields based on selection
  const fields = EXPORT_FIELDS.filter(field => selectedFields.includes(field.key))
  
  // Create JSON data
  const jsonData = products.map(product => {
    const exportProduct: any = {}
    fields.forEach(field => {
      exportProduct[field.label] = product[field.key]
    })
    return exportProduct
  })
  
  // Create and download file
  const jsonContent = JSON.stringify(jsonData, null, 2)
  const blob = new Blob([jsonContent], { type: 'application/json;charset=utf-8;' })
  const link = document.createElement('a')
  const url = URL.createObjectURL(blob)
  link.setAttribute('href', url)
  link.setAttribute('download', `products_export_${new Date().toISOString().split('T')[0]}.json`)
  link.style.visibility = 'hidden'
  document.body.appendChild(link)
  link.click()
  document.body.removeChild(link)
  URL.revokeObjectURL(url)
}

// Export to PDF with improved layout and images
export const exportToPDF = async (products: Product[], selectedFields: string[]): Promise<void> => {
  try {
    // Check if we're in a browser environment
    if (typeof window === 'undefined') {
      throw new Error('PDF generation is only available in browser environment')
    }

    // Dynamic import for PDF generation
    let jsPDF: any
    try {
      const { jsPDF: jsPDFClass } = await import('jspdf')
      jsPDF = jsPDFClass
    } catch (importError) {
      console.error('Failed to import jsPDF:', importError)
      throw new Error('jsPDF library not available')
    }
    
    // Filter fields based on selection
    const fields = EXPORT_FIELDS.filter(field => selectedFields.includes(field.key))
    const hasImages = fields.some(field => field.type === 'image')
    
    // Create PDF document
    const doc = new jsPDF('p', 'mm', 'a4')
    const pageWidth = doc.internal.pageSize.getWidth()
    const pageHeight = doc.internal.pageSize.getHeight()
    const margin = 15
    
    // Calculate available space
    const availableWidth = pageWidth - (2 * margin)
    
    // Add title and header
    doc.setFontSize(18)
    doc.setFont(undefined, 'bold')
    doc.text('Products Export', margin, margin + 10)
    
    doc.setFontSize(10)
    doc.setFont(undefined, 'normal')
    doc.text(`Generated on: ${new Date().toLocaleDateString()}`, margin, margin + 20)
    doc.text(`Total Products: ${products.length}`, margin, margin + 25)
    
    let currentY = margin + 35
    
    // Process each product
    for (let i = 0; i < products.length; i++) {
      const product = products[i]
      
      // Check if we need a new page
      if (currentY > pageHeight - 50) {
        doc.addPage()
        currentY = margin + 10
      }
      
      // Product header
      doc.setFontSize(14)
      doc.setFont(undefined, 'bold')
      doc.text(`Product ${i + 1}: ${product.title || 'Untitled'}`, margin, currentY)
      currentY += 8
      
      // Product content container
      const contentStartY = currentY
      let contentMaxY = currentY
      
      // Left column (text data)
      const leftColumnX = margin
      const leftColumnWidth = hasImages ? availableWidth * 0.6 : availableWidth
      
      // Right column (image)
      const rightColumnX = margin + leftColumnWidth + 10
      const rightColumnWidth = availableWidth * 0.35
      
      // Process text fields
      doc.setFontSize(10)
      doc.setFont(undefined, 'normal')
      
      let fieldY = currentY
      const lineHeight = 6
      const fieldSpacing = 2
      
      fields.forEach(field => {
        if (field.type === 'image') return // Handle images separately
        
        const value = product[field.key]
        const formattedValue = formatValue(value, field.type)
        
        if (formattedValue) {
          // Field label
          doc.setFont(undefined, 'bold')
          doc.text(`${field.label}:`, leftColumnX, fieldY)
          
          // Field value
          doc.setFont(undefined, 'normal')
          const valueX = leftColumnX + 40
          
          // Handle long text by wrapping
          const maxWidth = leftColumnWidth - 45
          const lines = doc.splitTextToSize(formattedValue, maxWidth)
          
          lines.forEach((line: string, lineIndex: number) => {
            doc.text(line, valueX, fieldY + (lineIndex * lineHeight))
          })
          
          fieldY += Math.max(lines.length * lineHeight, lineHeight) + fieldSpacing
          contentMaxY = Math.max(contentMaxY, fieldY)
        }
      })
      
      // Handle image if present
      if (hasImages) {
        const imageField = fields.find(f => f.type === 'image')
        if (imageField) {
          const images = product[imageField.key] as string[]
          if (images && images.length > 0) {
            try {
              const imageUrl = getOptimizedImageUrl(images[0], 150, 150)
              const base64Image = await loadImageAsBase64(imageUrl)
              
              // Add image to right column
              const imageSize = Math.min(rightColumnWidth, 60) // Max 60mm height
              doc.addImage(base64Image, 'JPEG', rightColumnX, contentStartY, imageSize, imageSize)
              
              // Update content max Y to account for image
              contentMaxY = Math.max(contentMaxY, contentStartY + imageSize)
            } catch (imageError) {
              console.warn('Failed to load image:', imageError)
              // Add placeholder text
              doc.setFontSize(8)
              doc.setFont(undefined, 'italic')
              doc.text('Image not available', rightColumnX, contentStartY + 30)
            }
          }
        }
      }
      
      // Add separator line
      currentY = contentMaxY + 10
      doc.setDrawColor(200, 200, 200)
      doc.line(margin, currentY, pageWidth - margin, currentY)
      currentY += 15
    }
    
    // Save PDF
    doc.save(`products_export_${new Date().toISOString().split('T')[0]}.pdf`)
  } catch (error) {
    console.error('Error generating PDF:', error)
    // Fallback: show error message
    alert('PDF generation failed. Please try again or use CSV/JSON export.')
  }
}

// Main export function
export const exportProducts = async (
  products: Product[], 
  format: ExportFormat, 
  selectedFields: string[]
): Promise<void> => {
  try {
    switch (format) {
      case 'csv':
        exportToCSV(products, selectedFields)
        break
      case 'json':
        exportToJSON(products, selectedFields)
        break
      case 'pdf':
        await exportToPDF(products, selectedFields)
        break
      default:
        throw new Error(`Unsupported format: ${format}`)
    }
  } catch (error) {
    console.error('Export failed:', error)
    alert(`Export failed: ${error instanceof Error ? error.message : 'Unknown error'}`)
  }
}
