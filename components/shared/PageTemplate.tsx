'use client'

import { useState, useEffect, useCallback, useMemo } from 'react'
import { LucideIcon, Package, ShoppingCart, Image, Palette, X } from 'lucide-react'
import { cn } from '@/lib/utils'
import { thinScrollbarStyles } from './styles/scrollbarStyles'
// Local generic types to avoid external coupling
type BaseEntity = { id: string; [key: string]: any }
type ViewMode = 'table' | 'grid' | 'card'
type KPIMetrics = Record<string, any>
type PageConfig = { title: string; description?: string; icon: string; columns?: Array<{ key: string; label?: string }>; kpis: Array<{ key: string; [k: string]: any }>; }
import { 
  KPIGrid,
  Pagination,
  ExportModal,
  EnhancedDetailModal,
  SearchControls
} from './index'
import CardsPerRowDropdown from './CardsPerRowDropdown'
import TablePreferencesModal from './TablePreferencesModal'
import UnifiedDataTable from './UnifiedDataTable'
import DataTable from './DataTable'
import GridCardFilterHeader from './GridCardFilterHeader'
import GridColumnHeader from './GridColumnHeader'
import SaveViewModal from './SaveViewModal'
import AdvancedFiltersPanel from './AdvancedFiltersPanel'
import { useSavedViews } from './hooks/useSavedViews'
// Note: using UnifiedDataTable below instead of a custom hook

// Reusable props contract for grid/card header components
interface GridHeaderComponentProps {
  selectedProducts: string[]
  currentProducts: any[]
  onSelectAll: () => void
  activeColumnFilter: string | null
  columnFilters: Record<string, any>
  onFilterClick: (column: string) => void
  onColumnFilterChange: (column: string, value: any) => void
  getUniqueValues: (field: string) => string[]
  cardsPerRow?: number
  onCardsPerRowChange?: (value: number) => void
}

interface PageTemplateProps<T extends BaseEntity> {
  config: PageConfig
  data: T[]
  loading?: boolean
  error?: string | null
  // Optional custom headers for grid and card views
  GridHeaderComponent?: React.ComponentType<GridHeaderComponentProps>
  CardHeaderComponent?: React.ComponentType<GridHeaderComponentProps>
  searchQuery?: string
  setSearchQuery?: (query: string) => void
  searchConditions?: any[]
  setSearchConditions?: (conditions: any[]) => void
  selectedItems?: string[]
  setSelectedItems?: (items: string[]) => void
  viewMode?: ViewMode
  setViewMode?: (mode: ViewMode) => void
  currentPage?: number
  setCurrentPage?: (page: number) => void
  itemsPerPage?: number
  setItemsPerPage?: (items: number) => void
  sortColumn?: string | null
  setSortColumn?: (column: string | null) => void
  sortDirection?: 'asc' | 'desc'
  setSortDirection?: (direction: 'asc' | 'desc') => void
  columnFilters?: Record<string, any>
  setColumnFilters?: (filters: Record<string, any>) => void
  customFilters?: any[]
  setCustomFilters?: (filters: any[]) => void
  advancedFilters?: any
  setAdvancedFilters?: (filters: any) => void
  totalPages?: number
  handleSelectItem?: (id: string, selected: boolean) => void
  handleSelectAll?: () => void
  handlePageChange?: (page: number) => void
  handleItemsPerPageChange?: (items: number) => void
  handleSort?: (column: string) => void
  handleSearch?: (query: string) => void
  handleAdvancedSearch?: () => void
  handleColumnFilter?: (column: string, value: any) => void
  handleCustomFilter?: (filter: any) => void
  handleAdvancedFilter?: (filters: any) => void
  clearAllFilters?: () => void
  clearSearch?: () => void
  clearColumnFilters?: () => void
  clearCustomFilters?: () => void
  clearAdvancedFilters?: () => void
  cardsPerRow?: number
  onCardsPerRowChange?: (value: number) => void
  // Optional actions to render inside the KPI container (top-right)
  KPIHeaderRight?: React.ReactNode
}

// Icon mapping function
const getIconComponent = (iconName: string): LucideIcon => {
  switch (iconName.toLowerCase()) {
    case 'package':
    case 'products':
      return Package
    case 'shopping-cart':
    case 'orders':
      return ShoppingCart
    case 'image':
    case 'pins':
    case 'boards':
      return Image
    case 'palette':
    case 'designs':
      return Palette
    default:
      return Package
  }
}

// Helper function to auto-generate column header configuration from table columns
const generateColumnHeadersFromConfig = (columns: any[] = []) => {
  return columns
    .filter((col: any) => col.key !== 'actions' && col.key !== 'select') // Skip action columns
    .map((col: any) => {
      const key = col.key
      const label = (col.label || key).toUpperCase()
      
      // Auto-detect filter type based on column key and configuration
      let filterType: 'text' | 'select' | 'multi-select' | 'numeric' | 'date' = 'text'
      let options: string[] | undefined = undefined
      
      // Numeric fields
      if (['price', 'quantity', 'inventory', 'inventoryQuantity', 'stock', 'total', 'totalPrice', 
           'likes', 'comments', 'repins', 'pinCount', 'followerCount', 'collaborators', 
           'fileSize', 'size', 'views', 'downloads'].includes(key)) {
        filterType = 'numeric'
      }
      // Date fields
      else if (['createdAt', 'updatedAt', 'publishedAt', 'date', 'created', 'updated'].includes(key)) {
        filterType = 'date'
      }
      // Status fields (single select)
      else if (key === 'status') {
        filterType = 'select'
        options = ['active', 'draft', 'archived']
      }
      else if (key === 'privacy') {
        filterType = 'select'
        options = ['public', 'private', 'protected']
      }
      else if (key === 'paymentStatus') {
        filterType = 'select'
        options = ['pending', 'paid', 'refunded', 'failed']
      }
      else if (key === 'fulfillmentStatus') {
        filterType = 'select'
        options = ['pending', 'fulfilled', 'shipped', 'delivered']
      }
      else if (key === 'type' && !key.includes('product')) {
        filterType = 'select'
        options = ['image', 'video', 'document', 'audio']
      }
      // Multi-select fields
      else if (['productType', 'vendor', 'category', 'tags', 'board', 'channel'].includes(key)) {
        filterType = 'multi-select'
      }
      
      return {
        key,
        label,
        hasFilter: true,
        sortable: true,
        filterType,
        options
      }
    })
}

export default function PageTemplate<T extends BaseEntity>({
  config,
  data,
  loading = false,
  error = null,
  GridHeaderComponent,
  CardHeaderComponent,
  searchQuery = '',
  setSearchQuery = () => {},
  searchConditions = [],
  setSearchConditions = () => {},
  selectedItems = [],
  setSelectedItems = () => {},
  viewMode = 'table',
  setViewMode = () => {},
  currentPage = 1,
  setCurrentPage = () => {},
  itemsPerPage = 25,
  setItemsPerPage = () => {},
  sortColumn = null,
  setSortColumn = () => {},
  sortDirection = 'desc',
  setSortDirection = () => {},
  columnFilters: _unusedColumnFilters = {},
  setColumnFilters: _unusedSetColumnFilters = () => {},
  customFilters = [],
  setCustomFilters = () => {},
  advancedFilters = {},
  setAdvancedFilters = () => {},
  totalPages = 1,
  handleSelectItem = () => {},
  handleSelectAll = () => {},
  handlePageChange = () => {},
  handleItemsPerPageChange = () => {},
  handleSort = () => {},
  handleSearch = () => {},
  handleAdvancedSearch = () => {},
  handleColumnFilter = () => {},
  handleCustomFilter = () => {},
  handleAdvancedFilter = () => {},
  clearAllFilters = () => {},
  clearSearch = () => {},
  clearColumnFilters = () => {},
  clearCustomFilters = () => {},
  clearAdvancedFilters = () => {},
  cardsPerRow,
  onCardsPerRowChange
  ,KPIHeaderRight
}: PageTemplateProps<T>) {
  // Modal states
  const [showExportModal, setShowExportModal] = useState(false)
  const [showImportModal, setShowImportModal] = useState(false)
  const [showPrintModal, setShowPrintModal] = useState(false)
  const [showSettingsModal, setShowSettingsModal] = useState(false)

  // Saved Views functionality (generic for all pages)
  const storageKey = `${config.title.toLowerCase().replace(/\s+/g, '-')}-saved-views`
  const savedViews = useSavedViews({
    storageKey,
    currentState: {
      searchQuery,
      searchConditions,
      columnFilters: _unusedColumnFilters,
      customFilters,
      advancedFilters,
      sortColumn: sortColumn || undefined,
      sortDirection,
      viewMode,
      itemsPerPage
    },
    onApply: (state) => {
      // Apply saved view state
      if (state.searchQuery !== undefined && setSearchQuery) setSearchQuery(state.searchQuery)
      if (state.searchConditions !== undefined && setSearchConditions) setSearchConditions(state.searchConditions)
      if (state.columnFilters !== undefined && _unusedSetColumnFilters) _unusedSetColumnFilters(state.columnFilters)
      if (state.customFilters !== undefined && setCustomFilters) setCustomFilters(state.customFilters)
      if (state.advancedFilters !== undefined && setAdvancedFilters) setAdvancedFilters(state.advancedFilters)
      if (state.sortColumn !== undefined && setSortColumn) setSortColumn(state.sortColumn)
      if (state.sortDirection !== undefined && setSortDirection) setSortDirection(state.sortDirection)
      if (state.viewMode !== undefined && setViewMode) setViewMode(state.viewMode as ViewMode)
      if (state.itemsPerPage !== undefined && setItemsPerPage) setItemsPerPage(state.itemsPerPage)
    }
  })

  // Get the icon component
  const IconComponent = getIconComponent(config.icon)
  const [hoveredItemId, setHoveredItemId] = useState<string | null>(null)
  // Cards-per-row controls for grid and card views
  const [gridCardsPerRow, setGridCardsPerRow] = useState<number>(4)
  const [cardCardsPerRow, setCardCardsPerRow] = useState<number>(6)
  const [kpiOverridesTick, setKpiOverridesTick] = useState(0)
  
  // Use prop values if provided, otherwise use internal state
  // React to KPI updates coming from header actions (localStorage-backed)
  useEffect(() => {
    const onUpdate = () => setKpiOverridesTick(t => t + 1)
    window.addEventListener('kpi-cards-updated', onUpdate as any)
    return () => window.removeEventListener('kpi-cards-updated', onUpdate as any)
  }, [])

  const computedKpiMap = useMemo(() => {
    // Base KPIs from config
    const base: any = (config.kpis || []).reduce((acc: any, k) => { acc[k.key] = { ...k }; return acc }, {})
    // DON'T delete invisible cards - KPIGrid will handle filtering
    // This ensures CardManagerModal can show ALL cards including hidden ones
    
    // Merge in custom cards
    try {
      const ccRaw = localStorage.getItem('shared-custom-cards')
      if (ccRaw) {
        const custom = JSON.parse(ccRaw)
        if (Array.isArray(custom)) {
          for (const c of custom) {
            const key = `custom:${c.id || c.title}`
            base[key] = { key, label: c.title || c.name || 'Custom', custom: true, icon: c.icon || '⭐', operation: c.operation }
          }
        }
      }
    } catch {}

    // Normalize to KPIGrid schema: ensure metric object exists
    const title = String(config.title || '').toLowerCase()
    const primary = ['pins', 'boards', 'designs', 'orders', 'products'].find(w => title.includes(w)) || ''
    for (const k of Object.keys(base)) {
      const item: any = base[k]
      const label = String(item.label || k).toLowerCase()
      if (!item.metric) {
        const value = item.value ?? undefined
        const change = item.change ?? 0
        const trend = item.trend ?? 'neutral'
        item.metric = { value: value as any, change, trend }
      }
      // Fallbacks: if value is undefined/null, populate sensible defaults from data length
      if (item.metric.value == null) {
        const isTotal = label.includes('total')
        const mentionsPrimary = primary && (label.includes(primary) || k.toLowerCase().includes(primary))
        if (isTotal && mentionsPrimary) {
          item.metric.value = Array.isArray(data) ? data.length : 0
        }
      }
      // Ensure numeric
      if (typeof item.metric.value !== 'number') {
        item.metric.value = Number(item.metric.value || 0)
      }
    }
    return base
    // tick dependency ensures recompute on header actions
  }, [config.kpis, config.title, data, kpiOverridesTick])
  const effectiveGridCardsPerRow = cardsPerRow ?? gridCardsPerRow
  const effectiveCardCardsPerRow = cardsPerRow ?? cardCardsPerRow

  // Auto-generate column headers configuration from table columns
  const autoGeneratedColumnHeaders = useMemo(() => {
    return generateColumnHeadersFromConfig(config.columns || [])
  }, [config.columns])

  // Client-side export helper (CSV/JSON)
  const handleClientExport = useCallback(async (exportConfig: any) => {
    try {
      const rows = exportConfig?.selectedOnly
        ? (data || []).filter((item: any) => selectedItems.includes(String(item.id)))
        : (data || [])

      if (!rows || rows.length === 0) {
        alert('No data to export')
        return
      }

      const filenameBase = (config?.title || 'export').toLowerCase().replace(/\s+/g, '-')

      // PDF: try html2pdf (via CDN); fallback to printable window
      if (exportConfig?.format === 'pdf') {
        const ensureHtml2Pdf = async (): Promise<any | null> => {
          // If already loaded
          if (typeof (window as any).html2pdf !== 'undefined') return (window as any).html2pdf
          // Inject script tag from CDN
          await new Promise<void>((resolve, reject) => {
            const s = document.createElement('script')
            s.src = 'https://cdnjs.cloudflare.com/ajax/libs/html2pdf.js/0.10.1/html2pdf.bundle.min.js'
            s.async = true
            s.onload = () => resolve()
            s.onerror = () => resolve() // resolve to allow fallback
            document.body.appendChild(s)
          })
          return (window as any).html2pdf || null
        }

        const collectKeys = (items: any[]) => {
          const keySet = new Set<string>()
          items.forEach((it) => {
            Object.keys(it || {}).forEach((k) => keySet.add(k))
          })
          return Array.from(keySet)
        }
        // Prefer provided columns, then page config columns, else infer keys
        const pageColumns: any[] = Array.isArray((config as any)?.columns) ? (config as any).columns as any[] : []
        const pageKeys: string[] = pageColumns.map((c: any) => String(c.key))
        let keyToLabel: Record<string, string> = Object.fromEntries(pageColumns.map((c: any) => [String(c.key), String(c.label || c.key)]))
        let headers: string[] = (exportConfig?.columns && exportConfig.columns.length > 0)
          ? exportConfig.columns
          : (pageKeys.length > 0 ? pageKeys : collectKeys(rows))

        // Special-case: Design Library – ensure stable, meaningful columns
        if (String((config as any)?.title || '').toLowerCase() === 'design library') {
          headers = [
            'image','name','type','category','price','size','status','designer','client','tags','views','downloads','createdAt','updatedAt'
          ]
          keyToLabel = {
            image: 'Image',
            name: 'Design Name',
            type: 'Type',
            category: 'Category',
            price: 'Price',
            size: 'Size',
            status: 'Status',
            designer: 'Designer',
            client: 'Client',
            tags: 'Tags',
            views: 'Views',
            downloads: 'Downloads',
            createdAt: 'Created',
            updatedAt: 'Updated'
          }
        }

        const escapeHtml = (val: any) => {
          if (val == null) return ''
          const str = typeof val === 'object' ? JSON.stringify(val) : String(val)
          return str
            .replace(/&/g, '&amp;')
            .replace(/</g, '&lt;')
            .replace(/>/g, '&gt;')
            .replace(/"/g, '&quot;')
            .replace(/'/g, '&#39;')
        }

        const includeImages = !!exportConfig?.includeImages
        const imageHeader = includeImages ? `<th style=\"padding:8px;border:1px solid #e5e7eb;text-align:left;background:#f9fafb;font-size:12px;\">Image</th>` : ''
        const headerCells = headers.map((h: string) => `<th style=\"padding:8px;border:1px solid #e5e7eb;text-align:left;background:#f9fafb;font-size:12px;\">${escapeHtml(keyToLabel[h] || h)}</th>`).join('')
        const tableHead = `<tr>${imageHeader}${headerCells}</tr>`

        const getImageUrl = (row: any): string | undefined => {
          const cand = row?.image || (Array.isArray(row?.images) ? row.images[0] : undefined) || row?.thumbnail || row?.cover || row?.preview
          return typeof cand === 'string' ? cand : undefined
        }

        // Pre-fetch images as data URLs to avoid cross-origin canvas taint
        const toDataUrl = async (url?: string): Promise<string | undefined> => {
          if (!url) return undefined
          try {
            const res = await fetch(url, { mode: 'cors' })
            const blob = await res.blob()
            return await new Promise<string>((resolve) => {
              const fr = new FileReader()
              fr.onloadend = () => resolve(String(fr.result || ''))
              fr.readAsDataURL(blob)
            })
          } catch {
            return url // fallback to direct URL; may work if CORS permits
          }
        }

        let imageDataUrls: (string | undefined)[] = []
        const buildBody = async () => {
          if (includeImages) {
            imageDataUrls = await Promise.all(rows.map((r: any) => toDataUrl(getImageUrl(r))))
          }
          return rows.map((row: any, idx: number) => {
          const imgSrc = includeImages ? imageDataUrls[idx] : undefined
          const imgCell = includeImages ? `<td style=\"padding:8px;border:1px solid #e5e7eb;font-size:12px;\">${imgSrc ? `<img src=\"${imgSrc}\" style=\"width:64px;height:64px;object-fit:cover;border-radius:6px;\" />` : ''}</td>` : ''
          const formatValue = (key: string, value: any) => {
            if (value == null) return ''
            if (key === 'price') return typeof value === 'number' ? `$${value.toFixed(2)}` : String(value)
            if (key === 'createdAt' || key === 'updatedAt') {
              const d = new Date(value)
              return isNaN(d.getTime()) ? String(value) : d.toLocaleDateString()
            }
            if (Array.isArray(value)) return value.slice(0, 10).join(', ')
            if (typeof value === 'object') return JSON.stringify(value)
            return String(value)
          }
          const cells = headers.map((h: string) => {
            const raw = (row as any)?.[h]
            const val = formatValue(h, raw)
            return `<td style=\"padding:8px;border:1px solid #e5e7eb;font-size:12px;\">${escapeHtml(val)}</td>`
          }).join('')
          return `<tr>${imgCell}${cells}</tr>`
          }).join('')
        }
        const tableBody = await buildBody()

        const container = document.createElement('div')
        container.style.position = 'fixed'
        container.style.top = '0'
        container.style.left = '0'
        container.style.visibility = 'hidden'
        container.style.pointerEvents = 'none'
        container.style.width = '1120px'
        container.style.minHeight = '400px'
        container.style.background = '#ffffff'
        container.innerHTML = `
          <div style="font-family:ui-sans-serif,system-ui,-apple-system,Segoe UI,Roboto,Arial,Noto Sans;color:#111827;">
            <h1 style="font-size:16px;margin:0 0 12px;">${config?.title || 'Export'}</h1>
            <table style="border-collapse:collapse;width:100%;">
              <thead>${tableHead}</thead>
              <tbody>${tableBody}</tbody>
            </table>
          </div>
        `
        document.body.appendChild(container)

        // Give the browser a tick to layout the hidden content
        await new Promise(resolve => setTimeout(resolve, 50))

        ensureHtml2Pdf().then(async (html2pdf) => {
          if (html2pdf) {
            // Wait a frame and for images to load to avoid blank output
            await new Promise(requestAnimationFrame)
            const imgs = Array.from(container.querySelectorAll('img')) as HTMLImageElement[]
            await Promise.all(imgs.map(img => img.complete ? Promise.resolve() : new Promise<void>(res => { img.onload = () => res(); img.onerror = () => res() })))
            const opt = {
              margin:       10,
              filename:     `${filenameBase}.pdf`,
              image:        { type: 'jpeg', quality: 0.98 },
              html2canvas:  { scale: 2, useCORS: true, allowTaint: true },
              jsPDF:        { unit: 'mm', format: 'a4', orientation: 'landscape' }
            }
            html2pdf().set(opt).from(container).save().finally(() => {
              container.remove()
            })
          } else {
            // Fallback: open print window
            const html = `<!doctype html><html><head><meta charset="utf-8" /><title>${filenameBase}</title>
              <style>@media print { @page { size: A4 landscape; margin: 12mm; } } body{font-family:ui-sans-serif,system-ui,-apple-system,Segoe UI,Roboto,Arial,Noto Sans;color:#111827;} h1{font-size:16px;margin:0 0 12px;} table{border-collapse:collapse;width:100%;}</style>
              <script>window.onload = () => { window.print(); setTimeout(() => window.close(), 300); };</script>
            </head><body>
              <h1>${config?.title || 'Export'}</h1>
              <table><thead>${tableHead}</thead><tbody>${tableBody}</tbody></table>
            </body></html>`
            const w = window.open('', '_blank')
            if (w) {
              w.document.open(); w.document.write(html); w.document.close()
            } else {
              alert('Popup blocked. Please allow popups to export as PDF.')
            }
            container.remove()
          }
        })
        return
      }

      if (exportConfig?.format === 'json') {
        const blob = new Blob([JSON.stringify(rows, null, 2)], { type: 'application/json;charset=utf-8' })
        const url = URL.createObjectURL(blob)
        const a = document.createElement('a')
        a.href = url
        a.download = `${filenameBase}.json`
        document.body.appendChild(a)
        a.click()
        a.remove()
        URL.revokeObjectURL(url)
        return
      }

      // Default to CSV
      const collectKeys = (items: any[]) => {
        const keySet = new Set<string>()
        items.forEach((it) => {
          Object.keys(it || {}).forEach((k) => keySet.add(k))
        })
        return Array.from(keySet)
      }

      const headers = exportConfig?.columns && exportConfig.columns.length > 0
        ? exportConfig.columns
        : collectKeys(rows)

      const escapeCell = (val: any) => {
        if (val == null) return ''
        const str = typeof val === 'object' ? JSON.stringify(val) : String(val)
        if (/[",\n]/.test(str)) {
          return `"${str.replace(/"/g, '""')}"`
        }
        return str
      }

      const csvLines: string[] = []
      csvLines.push(headers.map(escapeCell).join(','))
      rows.forEach((row: any) => {
        const line = headers.map((h: string) => escapeCell((row as any)[h]))
        csvLines.push(line.join(','))
      })

      const blob = new Blob([csvLines.join('\n')], { type: 'text/csv;charset=utf-8' })
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `${filenameBase}.csv`
      document.body.appendChild(a)
      a.click()
      a.remove()
      URL.revokeObjectURL(url)
    } catch (e) {
      console.error('Export failed:', e)
      alert('Export failed. See console for details.')
    }
  }, [data, selectedItems, config?.title])
  // Advanced filter visibility
  const [showAdvancedFilter, setShowAdvancedFilter] = useState<boolean>(false)

  // Table settings: page size and column visibility (persisted per page)
  const tableStorageKey = `table-settings:${config.title.toLowerCase().replace(/\s+/g, '-')}`
  const [columnVisibility, setColumnVisibility] = useState<Record<string, boolean>>(() => {
    try {
      const saved = typeof window !== 'undefined' ? localStorage.getItem(tableStorageKey) : null
      if (saved) {
        const parsed = JSON.parse(saved)
        return parsed.columnVisibility || {}
      }
    } catch {}
    // default: all visible
    const allVisible: Record<string, boolean> = {}
    ;(config.columns || []).forEach((c: any) => { allVisible[c.key] = true })
    return allVisible
  })
  const [settingsDraft, setSettingsDraft] = useState<{ pageSize: number; columnVisibility: Record<string, boolean> }>({
    pageSize: itemsPerPage || 25,
    columnVisibility
  })

  // Update settingsDraft when itemsPerPage changes
  useEffect(() => {
    setSettingsDraft(prev => ({
      ...prev,
      pageSize: itemsPerPage || 25
    }))
  }, [itemsPerPage])

  // Preview modal state for generic entities
  const [showPreviewModal, setShowPreviewModal] = useState<boolean>(false)
  const [previewItem, setPreviewItem] = useState<T | null>(null)

  // Column filter state (shared across views)
  const [activeColumnFilter, setActiveColumnFilter] = useState<string | null>(null)
  const [localColumnFilters, setLocalColumnFilters] = useState<Record<string, any>>({})
  const [showHeaderDropdown, setShowHeaderDropdown] = useState<boolean>(false)
  const [showCustomFilterDropdown, setShowCustomFilterDropdown] = useState<boolean>(false)

  const onFilterClickHeader = (column: string) => {
    setActiveColumnFilter(prev => (prev === column ? null : column))
  }

  const onColumnFilterChangeHeader = (column: string, value: any) => {
    setLocalColumnFilters(prev => ({ ...prev, [column]: value }))
  }

  const getUniqueValues = (field: string): string[] => {
    const values = (data as any[]).map((item) => item?.[field]).filter(Boolean)
    const flat = ([] as any[]).concat(...values.map(v => Array.isArray(v) ? v : [v]))
    return Array.from(new Set(flat.map(v => String(v))))
  }

  // Helper functions for Advanced Filters
  const getAvailableTags = (): string[] => {
    // Try different field names that might contain tags
    const tagsFromField = getUniqueValues('tags')
    if (tagsFromField.length > 0) return tagsFromField
    
    // Try 'tag' (singular)
    const tagFromField = getUniqueValues('tag')
    if (tagFromField.length > 0) return tagFromField
    
    // Try 'categories' as fallback
    const categoriesFromField = getUniqueValues('categories')
    if (categoriesFromField.length > 0) return categoriesFromField
    
    return []
  }

  const getAvailableVendors = (): string[] => {
    const title = String(config.title || '').toLowerCase()
    
    // For Pins: use 'board' and 'owner'
    if (title.includes('pin')) {
      const boards = getUniqueValues('board')
      const owners = getUniqueValues('owner')
      // Combine both
      const combined = new Set([...boards, ...owners])
      return Array.from(combined).filter(v => v && v !== 'No Board' && v !== 'Unknown')
    }
    
    // For Boards: use 'owner' or 'creator'
    if (title.includes('board')) {
      const owners = getUniqueValues('owner')
      const creators = getUniqueValues('creator')
      const combined = new Set([...owners, ...creators])
      return Array.from(combined).filter(Boolean)
    }
    
    // For Designs: use 'designer' or 'creator'
    if (title.includes('design')) {
      const designers = getUniqueValues('designer')
      const creators = getUniqueValues('creator')
      const artists = getUniqueValues('artist')
      const combined = new Set([...designers, ...creators, ...artists])
      return Array.from(combined).filter(Boolean)
    }
    
    // For Content Library: use 'source' or 'author'
    if (title.includes('content')) {
      const sources = getUniqueValues('source')
      const authors = getUniqueValues('author')
      const creators = getUniqueValues('creator')
      const combined = new Set([...sources, ...authors, ...creators])
      return Array.from(combined).filter(Boolean)
    }
    
    // Default: try 'vendor'
    return getUniqueValues('vendor').filter(Boolean)
  }

  const getAvailableStatuses = (): string[] => {
    // First, try to get actual statuses from data
    const statusesFromData = getUniqueValues('status')
    if (statusesFromData.length > 0) return statusesFromData
    
    // Fallback to defaults based on entity type
    const title = String(config.title || '').toLowerCase()
    if (title.includes('product')) {
      return ['active', 'draft', 'archived']
    } else if (title.includes('order')) {
      return ['paid', 'unpaid', 'refunded', 'pending', 'processing', 'shipped', 'delivered', 'cancelled']
    } else if (title.includes('pin')) {
      return ['active', 'pending', 'failed']
    } else if (title.includes('board')) {
      return ['active', 'draft', 'archived']
    } else if (title.includes('design')) {
      return ['active', 'draft', 'archived', 'published']
    } else if (title.includes('content')) {
      return ['published', 'draft', 'archived']
    }
    return ['active', 'inactive']
  }

  const getAvailableTypes = (): string[] => {
    // For Pins
    const types = getUniqueValues('type')
    return types.length > 0 ? types : ['image', 'video', 'article']
  }

  const getAvailablePrivacy = (): string[] => {
    // For Boards
    const privacy = getUniqueValues('privacy')
    return privacy.length > 0 ? privacy : ['public', 'private', 'secret']
  }

  const getAvailableCategories = (): string[] => {
    // For all entities
    return getUniqueValues('category').filter(Boolean)
  }

  const applyColumnFilters = (items: T[]): T[] => {
    const filters = localColumnFilters
    const entries = Object.entries(filters).filter(([key, v]) => {
      if (['minPrice', 'maxPrice', 'startDate', 'endDate', 'entity'].includes(key)) return false
      if (Array.isArray(v)) return v.length > 0
      return v !== '' && v !== undefined && v !== null
    })

    // Check if advanced filters are active
    const advFilters = advancedFilters || {}
    
    // Debug log (only when filters are active)
    if (Object.keys(advFilters).length > 0 && process.env.NODE_ENV === 'development') {
      console.log('🔍 PageTemplate Advanced Filters Active:', {
        advFilters,
        itemsCount: items.length,
        page: config.title
      })
    }
    const hasAdvancedFilters = Boolean(
      (advFilters.status?.length > 0) ||
      (advFilters.productStatus?.length > 0) ||
      (advFilters.orderStatus?.length > 0) ||
      (advFilters.tags?.length > 0) ||
      (advFilters.vendors?.length > 0) ||
      (advFilters.channels?.length > 0) ||
      advFilters.priceRange?.min ||
      advFilters.priceRange?.max ||
      advFilters.dateRange?.start ||
      advFilters.dateRange?.end
    )

    // Fast path when nothing to filter
    const hasSpecial = Boolean(filters.minPrice || filters.maxPrice || filters.startDate || filters.endDate || (Array.isArray(filters.entity) && filters.entity.length > 0))
    if (!hasSpecial && entries.length === 0 && !hasAdvancedFilters) return items

    const matches = (item: any, key: string, value: any) => {
      const raw = item?.[key]
      if (raw == null) return false
      if (Array.isArray(value)) {
        if (Array.isArray(raw)) {
          return raw.some((r: any) => value.includes(String(r)))
        }
        return value.includes(String(raw))
      }
      const str = String(value).trim()
      const numMatch = str.match(/^[<>~=]\s?\d+(\.\d+)?$/)
      if (numMatch && typeof raw === 'number') {
        const op = str[0]
        const num = parseFloat(str.slice(1))
        if (op === '>') return raw > num
        if (op === '<') return raw < num
        if (op === '=') return raw === num
      }
      if (/^\d{4}-\d{2}-\d{2}$/.test(str)) {
        const d1 = new Date(raw).toISOString().slice(0, 10)
        return d1 === str
      }
      return String(raw).toLowerCase().includes(str.toLowerCase())
    }

    return (items as any[]).filter((item) => {
      // Apply generic filters
      const genericPass = entries.every(([k, v]) => matches(item, k, v))
      if (!genericPass) return false

      // Special: price range (if price exists on item)
      if ((filters.minPrice || filters.maxPrice) && typeof item.price === 'number') {
        const min = filters.minPrice ? parseFloat(String(filters.minPrice)) : -Infinity
        const max = filters.maxPrice ? parseFloat(String(filters.maxPrice)) : Infinity
        if (!(item.price >= min && item.price <= max)) return false
      }

      // Special: date range on createdAt if present
      if (filters.startDate || filters.endDate) {
        const created = item.createdAt ? new Date(item.createdAt).getTime() : null
        if (created != null) {
          const start = filters.startDate ? new Date(String(filters.startDate)).getTime() : -Infinity
          const end = filters.endDate ? new Date(String(filters.endDate)).getTime() : Infinity
          if (!(created >= start && created <= end)) return false
        }
      }

      // Special: entity list (matches vendor/owner/client/designer)
      if (Array.isArray(filters.entity) && filters.entity.length > 0) {
        const entities = [item.vendor, item.owner, item.client, item.designer].filter(Boolean).map(String)
        const anyMatch = entities.some((e) => filters.entity.includes(e))
        if (!anyMatch) return false
      }

      // Advanced Filters - Status
      const statusFilter = advFilters.status || advFilters.productStatus || advFilters.orderStatus
      if (statusFilter && statusFilter.length > 0) {
        const itemStatus = String(item.status || '').toLowerCase()
        const matchesStatus = statusFilter.some((s: string) => String(s).toLowerCase() === itemStatus)
        if (!matchesStatus) return false
      }

      // Advanced Filters - Tags
      if (advFilters.tags && advFilters.tags.length > 0) {
        const itemTags = Array.isArray(item.tags) ? item.tags : []
        const hasSomeTag = itemTags.some((tag: any) => 
          advFilters.tags.includes(String(tag))
        )
        if (!hasSomeTag && itemTags.length === 0) return false
        if (!hasSomeTag) return false
      }

      // Advanced Filters - Vendors/Boards/Owners/Creators
      const vendorsFilter = advFilters.vendors || advFilters.channels
      if (vendorsFilter && vendorsFilter.length > 0) {
        const itemVendor = String(item.vendor || item.board || item.owner || item.creator || item.designer || item.source || item.author || '')
        const matchesVendor = vendorsFilter.some((v: string) => 
          itemVendor.toLowerCase().includes(String(v).toLowerCase())
        )
        if (!matchesVendor) return false
      }

      // Advanced Filters - Price Range
      if (advFilters.priceRange) {
        const itemPrice = Number(item.price || item.total || 0)
        if (advFilters.priceRange.min) {
          const minPrice = parseFloat(advFilters.priceRange.min)
          if (itemPrice < minPrice) return false
        }
        if (advFilters.priceRange.max) {
          const maxPrice = parseFloat(advFilters.priceRange.max)
          if (itemPrice > maxPrice) return false
        }
      }

      // Advanced Filters - Date Range
      if (advFilters.dateRange) {
        const itemDate = new Date(item.createdAt || item.updatedAt || 0).getTime()
        if (advFilters.dateRange.start) {
          const startDate = new Date(advFilters.dateRange.start).getTime()
          if (itemDate < startDate) return false
        }
        if (advFilters.dateRange.end) {
          const endDate = new Date(advFilters.dateRange.end).getTime()
          if (itemDate > endDate) return false
        }
      }

      return true
    })
  }

  // Helper to mirror Products page responsive grid behavior
  const getGridClasses = (cardsPerRow: number) => {
    const baseClasses = "grid gap-4 p-6"
    const getCols = (cols: number) => (cols <= 6 ? `grid-cols-${cols}` : `grid-cols-6`)
    const mdCols = Math.min(cardsPerRow, 4)
    const lgCols = Math.min(cardsPerRow, 5)
    const xlCols = cardsPerRow
    const responsive = `grid-cols-2 sm:grid-cols-3 md:${getCols(mdCols)} lg:${getCols(lgCols)} xl:${getCols(xlCols)}`
    const customStyle = cardsPerRow > 6 ? { gridTemplateColumns: `repeat(${cardsPerRow}, minmax(0, 1fr))` } : {}
    return { className: `${baseClasses} ${responsive}`, style: customStyle as React.CSSProperties }
  }

  if (loading && data.length === 0) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-gray-500">Loading...</div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="text-red-600 text-lg font-semibold mb-2">Error</div>
          <div className="text-gray-600 mb-4">{error}</div>
          <button 
            onClick={() => window.location.reload()}
            className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700"
          >
            Retry
          </button>
        </div>
      </div>
    )
  }

  // Apply all filters (column filters + advanced filters)
  const filteredData = useMemo(() => {
    return applyColumnFilters(data)
  }, [data, localColumnFilters, advancedFilters])

  // Apply sorting based on selected column and direction
  const sortedFilteredData = useMemo(() => {
    const arr = Array.isArray(filteredData) ? [...filteredData] : []
    
    // If no sort column specified, default to newest first (createdAt desc)
    if (!sortColumn) {
      return arr.sort((a: any, b: any) => {
        const da = new Date(a.createdAt || a.updatedAt || 0).getTime()
        const db = new Date(b.createdAt || b.updatedAt || 0).getTime()
        return db - da
      })
    }
    
    // Sort by the selected column
    return arr.sort((a: any, b: any) => {
      const aValue = a[sortColumn]
      const bValue = b[sortColumn]
      
      // Handle null/undefined values
      if (aValue === undefined || aValue === null) return 1
      if (bValue === undefined || bValue === null) return -1
      
      let comparison = 0
      
      // String comparison
      if (typeof aValue === 'string' && typeof bValue === 'string') {
        comparison = aValue.localeCompare(bValue)
      }
      // Number comparison
      else if (typeof aValue === 'number' && typeof bValue === 'number') {
        comparison = aValue - bValue
      }
      // Date comparison
      else if (sortColumn.includes('At') || sortColumn.includes('date') || sortColumn.includes('Date')) {
        const da = new Date(aValue).getTime()
        const db = new Date(bValue).getTime()
        comparison = da - db
      }
      // Default: convert to string and compare
      else {
        comparison = String(aValue).localeCompare(String(bValue))
      }
      
      // Apply sort direction
      return sortDirection === 'asc' ? comparison : -comparison
    })
  }, [filteredData, sortColumn, sortDirection])
  const visibleColumns = (config.columns || []).filter((c: any) => columnVisibility[c.key] !== false)

  const [isFullScreen, setIsFullScreen] = useState<boolean>(false)

  const handleItemClick = (item: T, event?: React.MouseEvent) => {
    // Guard against clicks on checkboxes or buttons
    if (event) {
      const target = event.target as HTMLElement
      if (target.closest('input[type="checkbox"]') || target.closest('button')) {
        return
      }
    }
    setPreviewItem(item)
    setShowPreviewModal(true)
  }

  // Helper to get column min width (same logic as GridColumnHeader)
  const getColumnMinWidth = (key: string) => {
    if (key === 'title' || key === 'product' || key === 'name' || key === 'board') return '130px'
    if (key === 'description' || key === 'notes') return '160px'
    if (key === 'category' || key === 'vendor' || key === 'owner') return '95px'
    if (key === 'tags' || key === 'productType') return '95px'
    if (key === 'orderNumber' || key === 'customer') return '110px'
    if (key === 'status' || key === 'privacy' || key === 'type') return '80px'
    if (key === 'channel' || key === 'paymentStatus' || key === 'fulfillmentStatus') return '90px'
    if (key === 'price' || key === 'total' || key === 'totalPrice') return '75px'
    if (key === 'inventory' || key === 'inventoryQuantity' || key === 'stock') return '80px'
    if (key === 'likes' || key === 'comments' || key === 'repins' || key === 'pins' || key === 'pinCount') return '70px'
    if (key === 'followers' || key === 'followerCount' || key === 'collaborators') return '80px'
    if (key === 'fileSize' || key === 'size' || key === 'dimensions') return '75px'
    if (key === 'createdAt' || key === 'updatedAt' || key === 'created' || key === 'updated') return '90px'
    return '80px'
  }

  const getItemTypeFromConfig = (config: PageConfig) => {
    if (config.title.toLowerCase().includes('product')) return 'product'
    if (config.title.toLowerCase().includes('order')) return 'order'
    if (config.title.toLowerCase().includes('pin')) return 'pin'
    if (config.title.toLowerCase().includes('board')) return 'board'
    if (config.title.toLowerCase().includes('design')) return 'design'
    return 'product' // Default fallback instead of 'item'
  }

  return (
    <div className={cn(
      "h-full bg-white flex flex-col overflow-hidden",
      isFullScreen ? "fixed inset-0 z-50" : ""
    )}>
      {/* Full Screen Header - Fixed at top */}
      {isFullScreen && (
        <div className="flex-shrink-0 bg-white border-b border-gray-200 p-4 flex justify-between items-center">
          <h2 className="text-lg font-semibold text-gray-900">{config.title} - Full Screen View</h2>
          <button
            onClick={() => setIsFullScreen(false)}
            className="p-2 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-md transition-colors"
            title="Exit Full Screen"
          >
            <X className="h-5 w-5" />
          </button>
        </div>
      )}

      {/* Unified Header Section - KPI, Search, and Actions in one container */}
      <div className="flex-shrink-0 bg-white">
        {/* Header right actions inside KPI container */}
        {KPIHeaderRight && (
          <div className="px-4 pt-2">
            <div className="flex justify-end">
              {KPIHeaderRight}
            </div>
          </div>
        )}
        {/* KPI Grid */}
        <div className="px-4 py-3">
          <KPIGrid 
            kpiMetrics={computedKpiMap as any}
            items={data}
            loading={loading}
            onRefresh={(kpiKey) => {
              console.log(`Refreshing ${kpiKey} KPI...`)
              // Here you can implement actual refresh logic
              // For now, we'll just log the action
            }}
            onConfigure={(kpiKey, config) => {
              console.log(`Configuring ${kpiKey} KPI:`, config)
              // Here you can implement configuration saving logic
              // For now, we'll just log the configuration
            }}
          />
        </div>

        {/* Search Controls */}
        <div className={cn(
          "px-4 pb-2", 
          isFullScreen ? "sticky top-0 z-20 border-b border-gray-200" : ""
        )}>
          <SearchControls
            searchQuery={searchQuery}
            setSearchQuery={setSearchQuery}
            searchConditions={searchConditions}
            showSearchBuilder={false}
            setShowSearchBuilder={() => {}}
            showAdditionalControls={false}
            setShowAdditionalControls={() => {}}
            activeFilter=""
            setActiveFilter={() => {}}
            customFilters={customFilters}
            onAddCustomFilter={handleCustomFilter}
            onRemoveCustomFilter={() => {}}
            hiddenDefaultFilters={new Set()}
            onShowAllFilters={() => {}}
            onClearSearch={clearSearch}
            onClearSearchConditions={() => {}}
            selectedProducts={selectedItems}
            onBulkEdit={() => {}}
            onExportSelected={() => setShowExportModal(true)}
            onBulkDelete={() => {}}
            currentProducts={filteredData}
            onSelectAll={handleSelectAll}
            activeColumnFilter={activeColumnFilter}
            columnFilters={localColumnFilters}
            onFilterClick={(c) => onFilterClickHeader(c || '')}
            onColumnFilterChange={onColumnFilterChangeHeader}
            getUniqueValues={getUniqueValues}
            viewMode={viewMode}
            setViewMode={setViewMode}
            showAdvancedFilter={showAdvancedFilter}
            setShowAdvancedFilter={setShowAdvancedFilter}
            isFullScreen={isFullScreen}
            onToggleFullScreen={() => setIsFullScreen(!isFullScreen)}
            isAlgoliaSearching={false}
            useAlgoliaSearch={false}
            showHeaderDropdown={showHeaderDropdown}
            setShowHeaderDropdown={setShowHeaderDropdown}
            showCustomFilterDropdown={showCustomFilterDropdown}
            setShowCustomFilterDropdown={setShowCustomFilterDropdown}
            onExport={() => setShowExportModal(true)}
            onImport={() => setShowImportModal(true)}
            onPrint={() => setShowPrintModal(true)}
            onSettings={() => setShowSettingsModal(true)}
            onSaveToSearchViews={savedViews.handleSaveView}
            savedSearches={savedViews.savedViews.map(view => ({
              id: view.id,
              viewName: view.viewName,
              searchQuery: view.searchState.searchQuery || '',
              searchConditions: view.searchState.searchConditions || [],
              columnFilters: view.searchState.columnFilters || {},
              customFilters: view.searchState.customFilters || [],
              sortColumn: view.searchState.sortColumn || '',
              sortDirection: view.searchState.sortDirection || 'desc',
              viewMode: view.searchState.viewMode || 'table',
              itemsPerPage: view.searchState.itemsPerPage || 25,
              updatedAt: view.updatedAt ? new Date(view.updatedAt).toISOString() : undefined
            }))}
            onApplySavedSearch={savedViews.handleApplyView}
            onDeleteSavedSearch={savedViews.handleDeleteView}
          />
        </div>

        {/* Advanced Filters Panel - Generic for all pages */}
        <AdvancedFiltersPanel
          isOpen={showAdvancedFilter}
          onClose={() => setShowAdvancedFilter(false)}
          filters={{
            status: (advancedFilters as any)?.status || (advancedFilters as any)?.productStatus || (advancedFilters as any)?.orderStatus || [],
            priceRange: (advancedFilters as any)?.priceRange || { min: '', max: '' },
            dateRange: (advancedFilters as any)?.dateRange || { min: '', max: '' },
            tags: (advancedFilters as any)?.tags || [],
            vendors: (advancedFilters as any)?.vendors || (advancedFilters as any)?.channels || []
          }}
          onFiltersChange={(newFilters) => {
            if (setAdvancedFilters) {
              // Map back to the format expected by the page
              const title = String(config.title || '').toLowerCase()
              if (title.includes('product')) {
                setAdvancedFilters({
                  productStatus: newFilters.status || [],
                  priceRange: newFilters.priceRange || { min: '', max: '' },
                  dateRange: newFilters.dateRange || { start: '', end: '' },
                  tags: newFilters.tags || [],
                  vendors: newFilters.vendors || []
                })
              } else if (title.includes('order')) {
                setAdvancedFilters({
                  orderStatus: newFilters.status || [],
                  priceRange: newFilters.priceRange || { min: '', max: '' },
                  dateRange: newFilters.dateRange || { start: '', end: '' },
                  tags: newFilters.tags || [],
                  channels: newFilters.vendors || []
                })
              } else {
                // Generic format for other pages
                setAdvancedFilters({
                  status: newFilters.status || [],
                  priceRange: newFilters.priceRange || { min: '', max: '' },
                  dateRange: newFilters.dateRange || { start: '', end: '' },
                  tags: newFilters.tags || [],
                  vendors: newFilters.vendors || []
                })
              }
            }
          }}
          onClearAll={() => {
            if (clearAdvancedFilters) clearAdvancedFilters()
          }}
          availableTags={getAvailableTags()}
          availableVendors={getAvailableVendors()}
          availableStatuses={getAvailableStatuses()}
          availableTypes={getAvailableTypes()}
          availablePrivacy={getAvailablePrivacy()}
          availableCategories={getAvailableCategories()}
          statusLabel={config.title?.toLowerCase().includes('product') ? 'Product Status' : 
                      config.title?.toLowerCase().includes('order') ? 'Order Status' :
                      config.title?.toLowerCase().includes('pin') ? 'Pin Status' :
                      config.title?.toLowerCase().includes('board') ? 'Board Status' :
                      'Status'}
          vendorsLabel={
            config.title?.toLowerCase().includes('order') ? 'Channels' : 
            config.title?.toLowerCase().includes('pin') ? 'Boards & Owners' :
            config.title?.toLowerCase().includes('board') ? 'Owners' :
            config.title?.toLowerCase().includes('design') ? 'Creators' :
            config.title?.toLowerCase().includes('content') ? 'Sources' :
            'Vendors'
          }
          isFiltering={false}
        />

        {/* Persistent Actions Row */}
        <div className="px-4 py-1 border-b border-gray-200">
        <div className="flex items-center justify-between gap-2 flex-wrap">
          {/* Left action group */}
          <div className="flex items-center justify-start gap-2 flex-wrap">
            {/* Selection counter */}
            <div className="mr-2 text-xs sm:text-sm text-gray-600">
              {selectedItems.length}/{data.length} selected
            </div>
            <button
              onClick={() => setShowImportModal(true)}
              className={cn(
                "px-3 py-1 text-xs sm:text-sm rounded-md transition-all duration-200 bg-white shadow-sm hover:shadow-md",
                "text-blue-700 border border-blue-400 hover:bg-gradient-to-r hover:from-blue-50 hover:to-blue-100"
              )}
              title={`Import ${config.title}`}
            >
              <span className="inline-flex items-center gap-1">
                <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12"/></svg>
                <span>Import</span>
              </span>
            </button>
            <button
              onClick={() => setShowPrintModal(true)}
              className={cn(
                "px-3 py-1 text-xs sm:text-sm rounded-md transition-all duration-200 bg-white shadow-sm hover:shadow-md",
                "text-indigo-700 border border-indigo-400 hover:bg-gradient-to-r hover:from-indigo-50 hover:to-indigo-100"
              )}
              title={`Print ${config.title}`}
            >
              <span className="inline-flex items-center gap-1">
                <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z"/></svg>
                <span>Print</span>
              </span>
            </button>
            <button
              onClick={() => {}}
              className={cn(
                "px-3 py-1 text-xs sm:text-sm rounded-md bg-white transition-all duration-200 shadow-sm hover:shadow-md",
                "text-blue-700 border border-blue-500"
              )}
              title="Bulk Edit selected rows"
            >
              <span className="inline-flex items-center gap-1">
                <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"/></svg>
                <span>Bulk Edit</span>
              </span>
            </button>
            <button
              onClick={() => setShowExportModal(true)}
              className={cn(
                "px-3 py-1 text-xs sm:text-sm rounded-md transition-all duration-200 bg-white shadow-sm hover:shadow-md",
                "text-green-700 border border-green-400 hover:bg-gradient-to-r hover:from-green-50 hover:to-green-100"
              )}
              title="Export"
            >
              <span className="inline-flex items-center gap-1">
                <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"/></svg>
                <span>Export</span>
              </span>
            </button>
            <button
              onClick={() => {}}
              className={cn(
                "px-3 py-1 text-xs sm:text-sm rounded-md bg-white transition-all duration-200 shadow-sm hover:shadow-md",
                "text-red-700 border border-red-500"
              )}
              title="Delete selected rows"
            >
              <span className="inline-flex items-center gap-1">
                <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"/></svg>
                <span>Delete</span>
              </span>
            </button>
          </div>

          {/* Right side controls */}
          <div className="flex items-center gap-2">
            {/* Cards-per-row control near Settings (grid/card views) */}
            {(viewMode === 'grid' || viewMode === 'card') && (
              <CardsPerRowDropdown 
                value={viewMode === 'grid' ? effectiveGridCardsPerRow : effectiveCardCardsPerRow}
                onChange={(n) => {
                  if (viewMode === 'grid') {
                    if (onCardsPerRowChange) onCardsPerRowChange(n); else setGridCardsPerRow(n)
                  } else {
                    if (onCardsPerRowChange) onCardsPerRowChange(n); else setCardCardsPerRow(n)
                  }
                }}
              />
            )}
            <button
              onClick={() => setShowSettingsModal(true)}
              className="px-3 py-1 text-xs sm:text-sm text-gray-700 hover:text-purple-700 border border-gray-300 rounded-md hover:bg-gradient-to-r hover:from-purple-50 hover:to-purple-100 transition-all duration-200 bg-white shadow-sm hover:shadow-md"
              title="Settings"
            >
              <span className="inline-flex items-center gap-1">
                <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z"/><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"/></svg>
              <span>Settings</span>
            </span>
            </button>
          </div>
        </div>
      </div>
      </div>

      {/* BulkActionsBar removed - duplicate of main action buttons */}

      {/* Main Content Area - Takes remaining space */}
      <div className="flex-1 min-h-0 overflow-hidden">
        <div className="h-full flex flex-col bg-white">
        {viewMode === 'table' && (
          <>
            {/* Table Header - Fixed */}
            <div className="flex-shrink-0 bg-white">
              {autoGeneratedColumnHeaders.length > 0 && (
                <GridColumnHeader
                  columns={autoGeneratedColumnHeaders}
                  activeColumnFilter={activeColumnFilter}
                  columnFilters={localColumnFilters}
                  onFilterClick={(c) => onFilterClickHeader(c as any)}
                  onColumnFilterChange={onColumnFilterChangeHeader}
                  getUniqueValues={getUniqueValues}
                  sortColumn={sortColumn || undefined}
                  sortDirection={sortDirection}
                  onSortClick={handleSort}
                  allSelected={selectedItems.length === sortedFilteredData.length && sortedFilteredData.length > 0}
                  onSelectAll={handleSelectAll}
                />
              )}
            </div>
            {/* Table Body - Scrollable */}
            <div className="flex-1 min-h-0 overflow-y-auto" style={thinScrollbarStyles}>
              <DataTable
                data={sortedFilteredData as any}
                selectedItems={selectedItems}
                onSelectItem={(id: string) => handleSelectItem(id, !selectedItems.includes(id))}
                onSelectAll={handleSelectAll}
                onRowClick={(item: any) => handleItemClick(item as T)}
                columns={visibleColumns as any[]}
                searchQuery={searchQuery}
                isFullScreen={isFullScreen}
                activeColumnFilter={activeColumnFilter}
                columnFilters={localColumnFilters}
                onFilterClick={(c: string) => onFilterClickHeader(c as any)}
                onColumnFilterChange={onColumnFilterChangeHeader}
                getUniqueValues={getUniqueValues}
                hideHeader={true}
              />
            </div>
            {/* Pagination - Sticky at bottom */}
            <div className="flex-shrink-0">
              <Pagination
                currentPage={currentPage}
                totalPages={totalPages}
                itemsPerPage={itemsPerPage}
                totalItems={data.length}
                onPageChange={handlePageChange}
                onItemsPerPageChange={handleItemsPerPageChange}
                itemType={getItemTypeFromConfig(config)}
              />
            </div>
          </>
        )}

        {viewMode === 'grid' && (
            <>
              {/* Grid Header - Fixed */}
              <div className="flex-shrink-0 bg-white">
                {GridHeaderComponent ? (
                  <GridHeaderComponent
                    selectedProducts={selectedItems}
                    currentProducts={sortedFilteredData}
                    onSelectAll={handleSelectAll}
                    activeColumnFilter={activeColumnFilter}
                    columnFilters={localColumnFilters}
                    onFilterClick={(c) => onFilterClickHeader(c as any)}
                    onColumnFilterChange={onColumnFilterChangeHeader}
                    getUniqueValues={getUniqueValues}
                    cardsPerRow={effectiveGridCardsPerRow}
                    onCardsPerRowChange={onCardsPerRowChange ?? ((v: number) => setGridCardsPerRow(v))}
                  />
                ) : (
                  <>
                    {/* Auto-generated Column Headers Only */}
                    {autoGeneratedColumnHeaders.length > 0 && (
                      <GridColumnHeader
                        columns={autoGeneratedColumnHeaders}
                        activeColumnFilter={activeColumnFilter}
                        columnFilters={localColumnFilters}
                        onFilterClick={(c) => onFilterClickHeader(c as any)}
                        onColumnFilterChange={onColumnFilterChangeHeader}
                        getUniqueValues={getUniqueValues}
                        sortColumn={sortColumn || undefined}
                        sortDirection={sortDirection}
                        onSortClick={handleSort}
                        allSelected={selectedItems.length === sortedFilteredData.length && sortedFilteredData.length > 0}
                        onSelectAll={handleSelectAll}
                      />
                    )}
                  </>
                )}
              </div>
            {/* Grid Content - Scrollable */}
            <div className={cn(
              getGridClasses(effectiveGridCardsPerRow).className, 
              "flex-1 min-h-0 overflow-y-auto px-4"
            )} style={{
              ...getGridClasses(effectiveGridCardsPerRow).style,
              ...thinScrollbarStyles
            }}>
              {sortedFilteredData.map((item: T) => (
                <div
                  key={item.id}
                  className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow cursor-pointer"
                  onClick={(e) => handleItemClick(item, e)}
                >
                  <div className="flex items-center space-x-3 mb-3">
                    <input
                      type="checkbox"
                      checked={selectedItems.includes(item.id)}
                      onChange={() => handleSelectItem(item.id, !selectedItems.includes(item.id))}
                      className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                      onClick={(e) => e.stopPropagation()}
                    />
                    {/* Image display */}
                    {(item as any).image && (
                      <div className="w-12 h-12 rounded-md overflow-hidden bg-gray-100 flex-shrink-0">
                        <img 
                          src={(item as any).image} 
                          alt={(item as any).title || (item as any).name || 'Item'}
                          className="w-full h-full object-cover"
                        />
                      </div>
                    )}
                  </div>
                  
                  <h3 className="font-medium text-gray-900 mb-1 line-clamp-2">
                    {(item as any).title || (item as any).name || 'Untitled'}
                  </h3>
                  
                  {(item as any).description && (
                    <p className="text-sm text-gray-500 mb-2 line-clamp-2">{(item as any).description}</p>
                  )}
                  
                  <div className="flex items-center justify-between mb-2">
                    {(item as any).price && (
                      <span className="text-lg font-semibold text-gray-900">₹{(item as any).price}</span>
                    )}
                    {(item as any).status && (
                      <span className="px-2 py-1 bg-gray-100 text-gray-800 text-xs rounded-full">
                        {(item as any).status}
                      </span>
                    )}
                  </div>
                  
                  <div className="flex items-center justify-between text-sm text-gray-500">
                    {(item as any).inventoryQuantity && (
                      <span>Stock: {(item as any).inventoryQuantity}</span>
                    )}
                    {(item as any).type && (
                      <span>{(item as any).type}</span>
                    )}
                  </div>
                </div>
              ))}
            </div>
            {/* Pagination - Sticky at bottom */}
            <div className="flex-shrink-0">
              <Pagination
                currentPage={currentPage}
                totalPages={totalPages}
                itemsPerPage={itemsPerPage}
                totalItems={data.length}
                onPageChange={handlePageChange}
                onItemsPerPageChange={handleItemsPerPageChange}
                itemType={getItemTypeFromConfig(config)}
              />
            </div>
          </>
        )}

        {viewMode === 'card' && (
            <>
              {/* Card Header - Fixed */}
              <div className="flex-shrink-0 bg-white">
                {(CardHeaderComponent || GridHeaderComponent) ? (
                  (() => {
                    const HeaderComp = CardHeaderComponent || GridHeaderComponent
                    if (!HeaderComp) return null
                    return (
                      <HeaderComp
                        selectedProducts={selectedItems}
                        currentProducts={sortedFilteredData}
                        onSelectAll={handleSelectAll}
                        activeColumnFilter={activeColumnFilter}
                        columnFilters={localColumnFilters}
                        onFilterClick={(c: string) => onFilterClickHeader(c as any)}
                        onColumnFilterChange={onColumnFilterChangeHeader}
                        getUniqueValues={getUniqueValues}
                        cardsPerRow={effectiveCardCardsPerRow}
                        onCardsPerRowChange={onCardsPerRowChange ?? ((v: number) => setCardCardsPerRow(v))}
                      />
                    )
                  })()
                ) : (
                  <>
                    {/* Auto-generated Column Headers Only */}
                    {autoGeneratedColumnHeaders.length > 0 && (
                      <GridColumnHeader
                        columns={autoGeneratedColumnHeaders}
                        activeColumnFilter={activeColumnFilter}
                        columnFilters={localColumnFilters}
                        onFilterClick={(c) => onFilterClickHeader(c as any)}
                        onColumnFilterChange={onColumnFilterChangeHeader}
                        getUniqueValues={getUniqueValues}
                        sortColumn={sortColumn || undefined}
                        sortDirection={sortDirection}
                        onSortClick={handleSort}
                        allSelected={selectedItems.length === sortedFilteredData.length && sortedFilteredData.length > 0}
                        onSelectAll={handleSelectAll}
                      />
                    )}
                  </>
                )}
              </div>
            {/* Card Content - Scrollable */}
            <div className={cn(
              getGridClasses(effectiveCardCardsPerRow).className, 
              "flex-1 min-h-0 overflow-y-auto px-4"
            )} style={{
              ...getGridClasses(effectiveCardCardsPerRow).style,
              ...thinScrollbarStyles
            }}>
              {sortedFilteredData.map((item: T) => {
                const anyItem: any = item as any
                const title = anyItem.title || anyItem.name || 'Untitled'
                const subtitle = anyItem.vendor || anyItem.board || anyItem.owner || anyItem.client || anyItem.designer || ''
                const leftInfo =
                  anyItem.inventoryQuantity != null ? `Stock: ${anyItem.inventoryQuantity}` :
                  anyItem.pinCount != null ? `Pins: ${anyItem.pinCount}` :
                  anyItem.views != null ? `Views: ${anyItem.views}` : ''
                const rightInfo = anyItem.type || anyItem.category || ''
                return (
                  <div
                    key={item.id}
                    className="relative group cursor-pointer transition-all duration-200 hover:scale-105 hover:shadow-lg border border-gray-300 rounded-lg"
                    onClick={(e) => handleItemClick(item, e)}
                    onMouseEnter={() => setHoveredItemId(item.id)}
                    onMouseLeave={() => setHoveredItemId(null)}
                  >
                    {/* Checkbox overlay */}
                    <div className="absolute top-2 left-2 z-10">
                      <input
                        type="checkbox"
                        checked={selectedItems.includes(item.id)}
                        onChange={() => handleSelectItem(item.id, !selectedItems.includes(item.id))}
                        className="rounded border-gray-300 text-blue-600 focus:ring-blue-500 bg-white/80 backdrop-blur-sm"
                        onClick={(e) => e.stopPropagation()}
                      />
                    </div>

                    {/* Image */}
                    <div className="relative aspect-square rounded-lg overflow-hidden bg-gray-100">
                      {anyItem.image ? (
                        <img 
                          src={anyItem.image} 
                          alt={title}
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center bg-gray-200">
                          <svg className="w-12 h-12 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                          </svg>
                        </div>
                      )}

                      {/* Hover overlay with info */}
                      <div className={cn(
                        "absolute inset-0 bg-black/60 text-white p-3 flex flex-col justify-end transition-opacity duration-200",
                        hoveredItemId === item.id ? "opacity-100" : "opacity-0"
                      )}>
                        <div className="space-y-1">
                          <h3 className="text-sm font-medium line-clamp-2">{title}</h3>
                          {subtitle && <p className="text-xs text-gray-300">{subtitle}</p>}
                          <div className="flex items-center justify-between">
                            {anyItem.price != null && (
                              <span className="text-sm font-semibold">₹{anyItem.price}</span>
                            )}
                            {anyItem.status && (
                              <span className="text-xs px-1.5 py-0.5 rounded-full bg-gray-500/20 text-gray-200">
                                {String(anyItem.status)}
                              </span>
                            )}
                          </div>
                          {(leftInfo || rightInfo) && (
                            <div className="flex items-center justify-between text-xs text-gray-300">
                              <span>{leftInfo}</span>
                              <span>{rightInfo}</span>
                            </div>
                          )}
                        </div>
                      </div>

                      {/* Status indicator dot */}
                      {anyItem.status && (
                        <div className={cn(
                          "absolute top-2 right-2 w-3 h-3 rounded-full border-2 border-white",
                          String(anyItem.status).toLowerCase().includes('active') || String(anyItem.status).toLowerCase().includes('completed') || String(anyItem.status).toLowerCase().includes('approved')
                            ? "bg-green-500" :
                          String(anyItem.status).toLowerCase().includes('draft') || String(anyItem.status).toLowerCase().includes('in_progress')
                            ? "bg-blue-500" :
                          String(anyItem.status).toLowerCase().includes('archived') || String(anyItem.status).toLowerCase().includes('rejected')
                            ? "bg-gray-500" : "bg-gray-400"
                        )} />
                      )}
                    </div>

                    {/* No sticky footer: below-image info fully removed */}
                  </div>
                )
              })}
            </div>
            {/* Pagination - Sticky at bottom */}
            <div className="flex-shrink-0">
              <Pagination
                currentPage={currentPage}
                totalPages={totalPages}
                itemsPerPage={itemsPerPage}
                totalItems={data.length}
                onPageChange={handlePageChange}
                onItemsPerPageChange={handleItemsPerPageChange}
                itemType={getItemTypeFromConfig(config)}
              />
            </div>
          </>
        )}
        </div>
      </div>

      {/* Modals */}
      {showPreviewModal && previewItem && (
        <EnhancedDetailModal
          isOpen={showPreviewModal}
          onClose={() => setShowPreviewModal(false)}
          item={previewItem}
          itemType={getItemTypeFromConfig(config)}
          onEdit={async (id: string, data: any) => {
            // Implement edit logic - PATCH/PUT request
            console.log('Edit item:', id, data)
            try {
              // Example API call:
              // await fetch(`/api/${config.title.toLowerCase()}/${id}`, {
              //   method: 'PATCH',
              //   headers: { 'Content-Type': 'application/json' },
              //   body: JSON.stringify(data)
              // })
              console.log('Item updated successfully')
            } catch (error) {
              console.error('Error updating item:', error)
              throw error
            }
          }}
          onDelete={async (id: string) => {
            // Implement delete logic - DELETE request
            console.log('Delete item:', id)
            try {
              // Example API call:
              // await fetch(`/api/${config.title.toLowerCase()}/${id}`, {
              //   method: 'DELETE'
              // })
              console.log('Item deleted successfully')
            } catch (error) {
              console.error('Error deleting item:', error)
              throw error
            }
          }}
          onSave={async (id: string, data: any) => {
            // Implement save logic - PATCH/PUT request
            console.log('Save item:', id, data)
            try {
              // Example API call:
              // await fetch(`/api/${config.title.toLowerCase()}/${id}`, {
              //   method: 'PATCH',
              //   headers: { 'Content-Type': 'application/json' },
              //   body: JSON.stringify(data)
              // })
              console.log('Item saved successfully')
            } catch (error) {
              console.error('Error saving item:', error)
              throw error
            }
          }}
        />
      )}
      {showExportModal && (
        <ExportModal
          isOpen={showExportModal}
          onClose={() => setShowExportModal(false)}
          data={filteredData}
          selectedItems={selectedItems}
          onExport={(config: any) => {
            // Client-side export (CSV/JSON). Replace with API call if needed.
            handleClientExport(config)
            setShowExportModal(false)
          }}
        />
      )}

      {/* Import modal can be integrated here if available */}

      {showPrintModal && (
        <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/50">
          <div className="bg-white rounded-lg shadow-lg w-full max-w-xl mx-4">
            <div className="flex items-start justify-between p-4 border-b border-gray-200">
              <div>
                <h3 className="text-lg font-semibold text-gray-900">Print {config.title}</h3>
                <p className="text-sm text-gray-500">Configure your print settings</p>
              </div>
              <button onClick={() => setShowPrintModal(false)} className="text-gray-400 hover:text-gray-600 transition-colors">
                <X className="h-5 w-5" />
              </button>
            </div>
            <div className="p-4 space-y-4">
              <div>
                <div className="text-sm font-medium text-gray-700 mb-2">Print Options</div>
                <div className="space-y-2">
                  <label className="flex items-center space-x-2 text-sm text-gray-700">
                    <input type="radio" name="printScope" defaultChecked className="text-blue-600" />
                    <span>All {config.title.toLowerCase()}</span>
                  </label>
                  <label className="flex items-center space-x-2 text-sm text-gray-700">
                    <input type="radio" name="printScope" className="text-blue-600" />
                    <span>Selected ({selectedItems.length})</span>
                  </label>
                </div>
              </div>
              <div>
                <div className="text-sm font-medium text-gray-700 mb-2">Layout</div>
                <select className="w-full border border-gray-300 rounded-md p-2 text-sm">
                  <option>Table Layout - Compact list format</option>
                  <option>Grid Layout - Cards format</option>
                  <option>Card Layout - Image focused</option>
                </select>
              </div>
              <div>
                <div className="text-sm font-medium text-gray-700 mb-2">Content Options</div>
                <label className="flex items-center space-x-2 text-sm text-gray-700 mb-1">
                  <input type="checkbox" defaultChecked className="text-blue-600" />
                  <span>Include images</span>
                </label>
                <label className="flex items-center space-x-2 text-sm text-gray-700">
                  <input type="checkbox" defaultChecked className="text-blue-600" />
                  <span>Include detailed information</span>
                </label>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <div className="text-sm font-medium text-gray-700 mb-2">Page Size</div>
                  <select className="w-full border border-gray-300 rounded-md p-2 text-sm">
                    <option>A4</option>
                    <option>Letter</option>
                    <option>Legal</option>
                  </select>
                </div>
                <div>
                  <div className="text-sm font-medium text-gray-700 mb-2">Orientation</div>
                  <select className="w-full border border-gray-300 rounded-md p-2 text-sm">
                    <option>Portrait</option>
                    <option>Landscape</option>
                  </select>
                </div>
              </div>
              <div className="text-xs text-gray-500 border rounded-md p-2">
                {data.length} items will be printed
              </div>
            </div>
            <div className="p-4 border-t border-gray-200 flex justify-end space-x-2">
              <button onClick={() => setShowPrintModal(false)} className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 rounded-md hover:bg-gray-200">Cancel</button>
              <button onClick={() => { setShowPrintModal(false); window.print() }} className="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-md hover:bg-blue-700">Print</button>
            </div>
          </div>
        </div>
      )}

      {showSettingsModal && (
        <TablePreferencesModal
          isOpen={showSettingsModal}
          title={`${config.title}`}
          pageSize={settingsDraft.pageSize}
          onChangePageSize={(n) => setSettingsDraft(s => ({ ...s, pageSize: n }))}
          columns={(config.columns || []).map((c: any) => ({ key: c.key, label: c.label || c.key }))}
          columnVisibility={settingsDraft.columnVisibility}
          onToggleColumn={(key, v) => setSettingsDraft(s => ({ ...s, columnVisibility: { ...s.columnVisibility, [key]: v } }))}
          onSelectAll={() => setSettingsDraft(s => ({ ...s, columnVisibility: Object.fromEntries((config.columns || []).map((c: any) => [c.key, true])) }))}
          onDeselectAll={() => setSettingsDraft(s => ({ ...s, columnVisibility: Object.fromEntries((config.columns || []).map((c: any) => [c.key, false])) }))}
          onClose={() => setShowSettingsModal(false)}
          onSave={() => {
            setColumnVisibility(settingsDraft.columnVisibility)
            handleItemsPerPageChange(settingsDraft.pageSize)
            try {
              if (typeof window !== 'undefined') {
                localStorage.setItem(tableStorageKey, JSON.stringify({ columnVisibility: settingsDraft.columnVisibility, pageSize: settingsDraft.pageSize }))
              }
            } catch {}
            setShowSettingsModal(false)
          }}
        />
      )}

      {/* Bulk edit modal placeholder */}

      {/* Bulk delete modal placeholder */}

      {/* Save View Modal */}
      <SaveViewModal
        isOpen={savedViews.showSaveModal}
        onClose={() => savedViews.setShowSaveModal(false)}
        viewName={savedViews.viewName}
        setViewName={savedViews.setViewName}
        onSave={savedViews.handleConfirmSave}
        currentState={{
          searchQuery,
          columnFiltersCount: Object.keys(localColumnFilters).filter(k => localColumnFilters[k]).length,
          viewMode
        }}
      />
    </div>
  )
}