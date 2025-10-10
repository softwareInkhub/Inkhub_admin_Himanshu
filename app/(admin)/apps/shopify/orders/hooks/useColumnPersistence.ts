import { useState, useEffect, useCallback } from 'react'
import {
  ColumnConfig,
  VisibleField,
  getDefaultColumnConfig,
  validateColumnConfig,
  deduplicateFields,
  ALL_JSON_FIELDS
} from '../utils/jsonColumnUtils'

interface UseColumnPersistenceOptions {
  userId?: string
  tableName?: string
}

interface UseColumnPersistenceReturn {
  config: ColumnConfig
  isLoading: boolean
  updateConfig: (newConfig: Partial<ColumnConfig>) => void
  resetToDefault: () => void
  saveConfig: (config: ColumnConfig) => void
}

const STORAGE_VERSION = 'v1'

/**
 * Hook to manage column configuration persistence
 * Stores configuration in localStorage per user
 */
export function useColumnPersistence(
  options: UseColumnPersistenceOptions = {}
): UseColumnPersistenceReturn {
  const { userId = 'anonymous', tableName = 'orders' } = options

  const getStorageKey = useCallback((suffix: string) => {
    return `inkhub:${tableName}:columns:${STORAGE_VERSION}:${userId}:${suffix}`
  }, [userId, tableName])

  const [config, setConfig] = useState<ColumnConfig>(() => {
    // Return default config for SSR/initial render
    return getDefaultColumnConfig()
  })

  const [isLoading, setIsLoading] = useState(true)

  // Load configuration from localStorage on mount
  useEffect(() => {
    if (typeof window === 'undefined') return

    try {
      const selectedFieldsKey = getStorageKey('selectedFields')
      const showJsonKeysKey = getStorageKey('showJsonKeys')
      const customLabelsKey = getStorageKey('customLabels')
      const columnWidthsKey = getStorageKey('columnWidths')

      const savedFields = localStorage.getItem(selectedFieldsKey)
      const savedShowKeys = localStorage.getItem(showJsonKeysKey)
      const savedLabels = localStorage.getItem(customLabelsKey)
      const savedWidths = localStorage.getItem(columnWidthsKey)

      if (savedFields) {
        try {
          const parsed = JSON.parse(savedFields)
          let resolvedFields: VisibleField[] = []

          // New compact format: array of keys
          if (Array.isArray(parsed) && parsed.every((v: any) => typeof v === 'string')) {
            const keys = parsed as string[]
            resolvedFields = keys
              .map(k => ALL_JSON_FIELDS.find(f => f.key === k))
              .filter(Boolean) as VisibleField[]
          }

          // Legacy format: array of field objects
          if (Array.isArray(parsed) && parsed.some((v: any) => typeof v === 'object')) {
            const objFields = parsed as VisibleField[]
            const validFields = objFields.filter(field => field.key && field.label && field.path && field.type)
            resolvedFields = deduplicateFields(validFields)
          }
          
          // Validate and set if we have any
          if (resolvedFields.length > 0) {
            const dedupedFields = deduplicateFields(resolvedFields)

            setConfig({
              selectedFields: dedupedFields,
              showJsonKeys: savedShowKeys ? JSON.parse(savedShowKeys) : false,
              customLabels: savedLabels ? JSON.parse(savedLabels) : {},
              columnWidths: savedWidths ? JSON.parse(savedWidths) : {}
            })
            setIsLoading(false)
            return
          }
        } catch (error) {
          console.warn('Failed to parse saved column configuration:', error)
        }
      }

      // No saved config or invalid, use default
      setConfig(getDefaultColumnConfig())
      setIsLoading(false)
    } catch (error) {
      console.error('Error loading column configuration:', error)
      setConfig(getDefaultColumnConfig())
      setIsLoading(false)
    }
  }, [getStorageKey])

  // Save configuration to localStorage with safe, non-recursive retry
  const saveConfig = useCallback((newConfig: ColumnConfig) => {
    if (typeof window === 'undefined') return

    try {
      // Validate before saving
      if (!validateColumnConfig(newConfig)) {
        console.error('Invalid column configuration, not saving')
        return
      }

      // De-duplicate before saving
      const dedupedConfig = {
        ...newConfig,
        selectedFields: deduplicateFields(newConfig.selectedFields)
      }

      const selectedFieldsKey = getStorageKey('selectedFields')
      const showJsonKeysKey = getStorageKey('showJsonKeys')
      const customLabelsKey = getStorageKey('customLabels')
      const columnWidthsKey = getStorageKey('columnWidths')

      // Store compactly: only field keys instead of full objects
      const selectedKeys = Array.from(new Set((dedupedConfig.selectedFields || []).map(f => f.key)))
      // Attempt save (first try) with compact data
      localStorage.setItem(selectedFieldsKey, JSON.stringify(selectedKeys))
      localStorage.setItem(showJsonKeysKey, JSON.stringify(dedupedConfig.showJsonKeys))
      localStorage.setItem(customLabelsKey, JSON.stringify(dedupedConfig.customLabels || {}))
      localStorage.setItem(columnWidthsKey, JSON.stringify(dedupedConfig.columnWidths || {}))

      setConfig(dedupedConfig)
    } catch (error) {
      console.error('Error saving column configuration:', error)
      
      // Check if it's a quota exceeded error
      if (error instanceof Error && error.name === 'QuotaExceededError') {
        console.warn('LocalStorage quota exceeded, clearing old data...')
        
        // Non-recursive retry once: clear older versions and current user keys if needed
        try {
          const oldVersionPrefix = `inkhub:${tableName}:columns:`
          const currentUserPrefix = `inkhub:${tableName}:columns:${STORAGE_VERSION}:${userId}`

          const keysToRemove: string[] = []
          for (let i = 0; i < localStorage.length; i++) {
            const key = localStorage.key(i)
            if (!key) continue
            // Remove any older versions for any user
            if (key.startsWith(oldVersionPrefix) && !key.includes(`:${STORAGE_VERSION}:`)) {
              keysToRemove.push(key)
            }
            // If still too big, we'll also remove current user's keys to make space
            if (key.startsWith(currentUserPrefix)) {
              keysToRemove.push(key)
            }
          }
          // Deduplicate keys
          Array.from(new Set(keysToRemove)).forEach(k => localStorage.removeItem(k))

          // Try a single retry save after cleanup
          try {
            const selectedFieldsKey = getStorageKey('selectedFields')
            const showJsonKeysKey = getStorageKey('showJsonKeys')
            const customLabelsKey = getStorageKey('customLabels')
            const columnWidthsKey = getStorageKey('columnWidths')

            const dedupedConfig = {
              ...newConfig,
              selectedFields: deduplicateFields(newConfig.selectedFields)
            }

            const selectedKeys = Array.from(new Set((dedupedConfig.selectedFields || []).map(f => f.key)))
            localStorage.setItem(selectedFieldsKey, JSON.stringify(selectedKeys))
            localStorage.setItem(showJsonKeysKey, JSON.stringify(dedupedConfig.showJsonKeys))
            localStorage.setItem(customLabelsKey, JSON.stringify(dedupedConfig.customLabels || {}))
            localStorage.setItem(columnWidthsKey, JSON.stringify(dedupedConfig.columnWidths || {}))

            setConfig(dedupedConfig)
          } catch (retryError) {
            console.error('Failed to save even after clearing old data:', retryError)
          }
        } catch (cleanupError) {
          console.error('Failed during cleanup for quota handling:', cleanupError)
        }
      }
    }
  }, [getStorageKey, tableName, userId])

  // Update partial configuration
  const updateConfig = useCallback((newConfig: Partial<ColumnConfig>) => {
    setConfig(prev => {
      const updated = { ...prev, ...newConfig }
      saveConfig(updated)
      return updated
    })
  }, [saveConfig])

  // Reset to default configuration
  const resetToDefault = useCallback(() => {
    const defaultConfig = getDefaultColumnConfig()
    saveConfig(defaultConfig)
    setConfig(defaultConfig)
  }, [saveConfig])

  return {
    config,
    isLoading,
    updateConfig,
    resetToDefault,
    saveConfig
  }
}

/**
 * Hook to sync column width changes
 */
export function useColumnWidth(
  fieldKey: string,
  userId?: string,
  tableName: string = 'orders'
) {
  const getStorageKey = () => {
    return `inkhub:${tableName}:columns:${STORAGE_VERSION}:${userId || 'anonymous'}:columnWidths`
  }

  const [width, setWidth] = useState<number | undefined>(() => {
    if (typeof window === 'undefined') return undefined

    try {
      const saved = localStorage.getItem(getStorageKey())
      if (saved) {
        const widths = JSON.parse(saved) as Record<string, number>
        return widths[fieldKey]
      }
    } catch {
      return undefined
    }
  })

  const updateWidth = useCallback((newWidth: number) => {
    if (typeof window === 'undefined') return

    try {
      const key = getStorageKey()
      const saved = localStorage.getItem(key)
      const widths = saved ? JSON.parse(saved) : {}
      widths[fieldKey] = newWidth
      localStorage.setItem(key, JSON.stringify(widths))
      setWidth(newWidth)
    } catch (error) {
      console.error('Error saving column width:', error)
    }
  }, [fieldKey])

  return { width, updateWidth }
}

/**
 * Clear all saved column configurations for a user
 */
export function clearColumnPersistence(userId: string = 'anonymous', tableName: string = 'orders') {
  if (typeof window === 'undefined') return

  try {
    const prefix = `inkhub:${tableName}:columns:${STORAGE_VERSION}:${userId}`
    const keysToRemove: string[] = []
    
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i)
      if (key && key.startsWith(prefix)) {
        keysToRemove.push(key)
      }
    }
    
    keysToRemove.forEach(key => localStorage.removeItem(key))
    console.log(`Cleared ${keysToRemove.length} column configuration keys for user ${userId}`)
  } catch (error) {
    console.error('Error clearing column persistence:', error)
  }
}

/**
 * Export all column configurations for backup
 */
export function exportAllColumnConfigs(userId: string = 'anonymous'): Record<string, any> {
  if (typeof window === 'undefined') return {}

  const configs: Record<string, any> = {}
  const prefix = `inkhub:`

  try {
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i)
      if (key && key.startsWith(prefix) && key.includes(':columns:') && key.includes(userId)) {
        const value = localStorage.getItem(key)
        if (value) {
          configs[key] = JSON.parse(value)
        }
      }
    }
  } catch (error) {
    console.error('Error exporting column configs:', error)
  }

  return configs
}

/**
 * Import column configurations from backup
 */
export function importAllColumnConfigs(configs: Record<string, any>): boolean {
  if (typeof window === 'undefined') return false

  try {
    Object.entries(configs).forEach(([key, value]) => {
      if (key.startsWith('inkhub:') && key.includes(':columns:')) {
        localStorage.setItem(key, JSON.stringify(value))
      }
    })
    return true
  } catch (error) {
    console.error('Error importing column configs:', error)
    return false
  }
}

