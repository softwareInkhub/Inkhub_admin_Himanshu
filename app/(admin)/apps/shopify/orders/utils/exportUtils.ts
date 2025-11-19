import { Order } from '../types'

export type ExportFormat = 'csv' | 'json' | 'pdf'

export interface ExportField {
  key: keyof Order | string
  label: string
  type: 'string' | 'number' | 'date' | 'array' | 'object'
}

export const EXPORT_FIELDS: ExportField[] = [
  { key: 'orderNumber', label: 'Order #', type: 'string' },
  { key: 'name', label: 'Name', type: 'string' },
  { key: 'customerName', label: 'Customer Name', type: 'string' },
  { key: 'customerEmail', label: 'Customer Email', type: 'string' },
  { key: 'phone', label: 'Phone', type: 'string' },
  { key: 'status', label: 'Status', type: 'string' },
  { key: 'fulfillmentStatus', label: 'Fulfillment Status', type: 'string' },
  { key: 'financialStatus', label: 'Financial Status', type: 'string' },
  { key: 'total', label: 'Total', type: 'number' },
  { key: 'currency', label: 'Currency', type: 'string' },
  { key: 'channel', label: 'Channel', type: 'string' },
  { key: 'deliveryMethod', label: 'Delivery Method', type: 'string' },
  { key: 'deliveryStatus', label: 'Delivery Status', type: 'string' },
  { key: 'tags', label: 'Tags', type: 'array' },
  { key: 'createdAt', label: 'Created Date', type: 'date' },
  { key: 'updatedAt', label: 'Updated Date', type: 'date' }
]

const formatValue = (value: any, type: ExportField['type']): string => {
  if (value === null || value === undefined) return ''

  switch (type) {
    case 'date':
      return value ? new Date(value).toLocaleString() : ''
    case 'array':
      return Array.isArray(value) ? value.join(', ') : String(value)
    case 'number':
      return typeof value === 'number' ? value.toString() : String(value)
    case 'object':
      return typeof value === 'object' ? JSON.stringify(value) : String(value)
    default:
      return String(value)
  }
}

const downloadFile = (content: string | Blob, filename: string, mimeType: string) => {
  const blob = content instanceof Blob ? content : new Blob([content], { type: mimeType })
  const url = URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.href = url
  link.download = filename
  document.body.appendChild(link)
  link.click()
  document.body.removeChild(link)
  URL.revokeObjectURL(url)
}

const exportToCSV = (orders: Order[], selectedFields: string[]) => {
  const fields = EXPORT_FIELDS.filter(field => selectedFields.includes(field.key as string))
  const headers = fields.map(field => field.label)
  const csvRows = orders.map(order => {
    const row = fields.map(field => {
      const value = order[field.key]
      const formattedValue = formatValue(value, field.type)
      return `"${formattedValue.replace(/"/g, '""')}"`
    })
    return row.join(',')
  })
  const csvContent = [headers.join(','), ...csvRows].join('\n')
  downloadFile(csvContent, `orders_export_${new Date().toISOString().split('T')[0]}.csv`, 'text/csv;charset=utf-8;')
}

const exportToJSON = (orders: Order[], selectedFields: string[]) => {
  const fields = EXPORT_FIELDS.filter(field => selectedFields.includes(field.key as string))
  const jsonData = orders.map(order => {
    const exportOrder: Record<string, any> = {}
    fields.forEach(field => {
      exportOrder[field.label] = order[field.key]
    })
    return exportOrder
  })
  const jsonContent = JSON.stringify(jsonData, null, 2)
  downloadFile(jsonContent, `orders_export_${new Date().toISOString().split('T')[0]}.json`, 'application/json;charset=utf-8;')
}

const exportToPDF = async (orders: Order[], selectedFields: string[]) => {
  try {
    if (typeof window === 'undefined') {
      throw new Error('PDF export is only available in the browser')
    }
    const { jsPDF } = await import('jspdf')
    const doc = new jsPDF('p', 'mm', 'a4')
    const margin = 15
    const pageWidth = doc.internal.pageSize.getWidth()
    const availableWidth = pageWidth - margin * 2

    doc.setFontSize(18)
    doc.setFont('helvetica', 'bold')
    doc.text('Orders Export', margin, margin + 5)

    doc.setFontSize(10)
    doc.setFont('helvetica', 'normal')
    doc.text(`Generated on: ${new Date().toLocaleString()}`, margin, margin + 12)
    doc.text(`Total Orders: ${orders.length}`, margin, margin + 17)

    let currentY = margin + 27
    const fields = EXPORT_FIELDS.filter(field => selectedFields.includes(field.key as string))

    orders.forEach((order, index) => {
      if (currentY > 270) {
        doc.addPage()
        currentY = margin + 10
      }

      doc.setFontSize(12)
      doc.setFont('helvetica', 'bold')
      doc.text(`Order ${index + 1}: #${order.orderNumber}`, margin, currentY)
      currentY += 6

      doc.setFontSize(10)
      doc.setFont('helvetica', 'normal')
      fields.forEach(field => {
        const value = formatValue(order[field.key], field.type)
        const label = field.label
        const wrapped = doc.splitTextToSize(`${label}: ${value}`, availableWidth)
        wrapped.forEach((line: string) => {
          doc.text(line, margin, currentY)
          currentY += 5
        })
      })

      doc.setDrawColor(230, 230, 230)
      doc.line(margin, currentY, pageWidth - margin, currentY)
      currentY += 8
    })

    doc.save(`orders_export_${new Date().toISOString().split('T')[0]}.pdf`)
  } catch (error) {
    console.error('PDF export failed:', error)
    alert('PDF export failed. Please try CSV or JSON instead.')
  }
}

export const exportOrders = async (orders: Order[], format: ExportFormat, selectedFields: string[]) => {
  switch (format) {
    case 'csv':
      exportToCSV(orders, selectedFields)
      return
    case 'json':
      exportToJSON(orders, selectedFields)
      return
    case 'pdf':
      await exportToPDF(orders, selectedFields)
      return
    default:
      throw new Error(`Unsupported export format: ${format}`)
  }
}


