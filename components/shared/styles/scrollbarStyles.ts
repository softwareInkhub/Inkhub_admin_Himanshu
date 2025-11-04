/**
 * Reusable scrollbar styles for consistent appearance across all pages
 * Provides thin, light gray scrollbars for modern, clean UI
 */

export const thinScrollbarStyles = {
  scrollbarWidth: 'thin' as const,
  scrollbarColor: '#CBD5E0 #F7FAFC' // Light gray thumb on white track
}

/**
 * CSS class name for Tailwind scrollbar utilities (if using plugin)
 * Can be used as: className={thinScrollbarClass}
 */
export const thinScrollbarClass = 'scrollbar-thin scrollbar-thumb-gray-400 scrollbar-track-gray-50'

/**
 * Complete scrollbar configuration with overflow settings
 * Use for both horizontal and vertical scrolling areas
 */
export const scrollableAreaStyles = {
  ...thinScrollbarStyles,
  overflowY: 'auto' as const,
  overflowX: 'hidden' as const
}

/**
 * Horizontal scrollable area (e.g., for wide tables)
 */
export const horizontalScrollableStyles = {
  ...thinScrollbarStyles,
  overflowX: 'auto' as const,
  overflowY: 'hidden' as const
}

/**
 * Both directions scrollable (e.g., for data tables)
 */
export const bidirectionalScrollableStyles = {
  ...thinScrollbarStyles,
  overflowX: 'auto' as const,
  overflowY: 'auto' as const
}

