'use client'

import { useAppStore } from './store'

/**
 * Utility hook to notify dashboard when data changes in individual pages
 * Usage: const { notifyDashboard } = useDashboardSync()
 * Call notifyDashboard('orders') when orders data changes
 */
export function useDashboardSync() {
  const { triggerDataRefresh } = useAppStore()

  const notifyDashboard = (dataType: 'orders' | 'products' | 'pins' | 'boards' | 'designs') => {
    console.log(`📢 Notifying dashboard of ${dataType} data change`)
    triggerDataRefresh(dataType)
  }

  return { notifyDashboard }
}

/**
 * Simple function to notify dashboard without hooks (for use in non-React contexts)
 */
export function notifyDashboardChange(dataType: 'orders' | 'products' | 'pins' | 'boards' | 'designs') {
  console.log(`📢 Notifying dashboard of ${dataType} data change`)
  
  // Update localStorage for cross-tab communication
  localStorage.setItem(`data-refresh-${dataType}`, Date.now().toString())
  
  // Dispatch storage event for same-tab communication
  window.dispatchEvent(new StorageEvent('storage', {
    key: `data-refresh-${dataType}`,
    newValue: Date.now().toString()
  }))
}

