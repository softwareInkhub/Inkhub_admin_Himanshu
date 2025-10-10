import { useMemo, useCallback, useState } from 'react'
import { useColumnPersistence } from './useColumnPersistence'
import { VisibleField, ColumnConfig, ALL_JSON_FIELDS } from '../utils/jsonColumnUtils'
import { generateColumns, generateEnhancedCellRenderer } from '../utils/columnGenerator'
import { Order } from '../types'

interface UseJsonColumnsOptions {
  userId?: string
  searchQuery?: string
}

interface UseJsonColumnsReturn {
  // Column configuration
  selectedFields: VisibleField[]
  showJsonKeys: boolean
  customLabels: Record<string, string>
  
  // Column management
  columns: Array<{
    key: string
    label: string
    sortable: boolean
    render: (order: Order, index?: number) => React.ReactNode
  }>
  
  // Actions
  toggleField: (field: VisibleField) => void
  saveColumnConfig: (config: ColumnConfig) => void
  resetToDefault: () => void
  setShowJsonKeys: (show: boolean) => void
  
  // State
  isLoading: boolean
  
  // Modal control
  showColumnManager: boolean
  openColumnManager: () => void
  closeColumnManager: () => void
}

/**
 * Comprehensive hook to manage JSON column customization
 */
export function useJsonColumns(options: UseJsonColumnsOptions = {}): UseJsonColumnsReturn {
  const { userId, searchQuery } = options
  
  const {
    config,
    isLoading,
    updateConfig,
    resetToDefault: resetPersistence,
    saveConfig
  } = useColumnPersistence({ userId })
  
  const [showColumnManager, setShowColumnManager] = useState(false)

  // Generate table columns from configuration
  const columns = useMemo(() => {
    const seen = new Set<string>()
    return config.selectedFields.filter(f => {
      if (seen.has(f.key)) return false
      seen.add(f.key)
      return true
    }).map(field => {
      const customLabel = config.customLabels[field.key]
      
      return {
        key: field.key,
        label: customLabel || field.label,
        sortable: field.sortable || false,
        render: (order: Order, index?: number) => {
          return generateEnhancedCellRenderer(order, field, {
            compact: false,
            showTooltip: true,
            highlightSearch: searchQuery
          })
        }
      }
    })
  }, [config.selectedFields, config.customLabels, searchQuery])

  // Toggle a single field on/off
  const toggleField = useCallback((field: VisibleField) => {
    const newFields = config.selectedFields.some(f => f.key === field.key)
      ? config.selectedFields.filter(f => f.key !== field.key)
      : [...config.selectedFields, field]
    
    updateConfig({ selectedFields: newFields })
  }, [config.selectedFields, updateConfig])

  // Save complete column configuration
  const saveColumnConfig = useCallback((newConfig: ColumnConfig) => {
    saveConfig(newConfig)
  }, [saveConfig])

  // Reset to default columns
  const resetToDefault = useCallback(() => {
    resetPersistence()
  }, [resetPersistence])

  // Toggle JSON keys display
  const setShowJsonKeys = useCallback((show: boolean) => {
    updateConfig({ showJsonKeys: show })
  }, [updateConfig])

  // Modal controls
  const openColumnManager = useCallback(() => {
    setShowColumnManager(true)
  }, [])

  const closeColumnManager = useCallback(() => {
    setShowColumnManager(false)
  }, [])

  return {
    // Configuration
    selectedFields: config.selectedFields,
    showJsonKeys: config.showJsonKeys,
    customLabels: config.customLabels,
    
    // Columns
    columns,
    
    // Actions
    toggleField,
    saveColumnConfig,
    resetToDefault,
    setShowJsonKeys,
    
    // State
    isLoading,
    
    // Modal
    showColumnManager,
    openColumnManager,
    closeColumnManager
  }
}

/**
 * Hook to search/filter available fields
 */
export function useFieldSearch() {
  const [searchQuery, setSearchQuery] = useState('')
  
  const filteredFields = useMemo(() => {
    if (!searchQuery.trim()) return ALL_JSON_FIELDS
    
    const query = searchQuery.toLowerCase()
    return ALL_JSON_FIELDS.filter(field =>
      field.label.toLowerCase().includes(query) ||
      field.path.toLowerCase().includes(query) ||
      field.key.toLowerCase().includes(query)
    )
  }, [searchQuery])
  
  return {
    searchQuery,
    setSearchQuery,
    filteredFields
  }
}

