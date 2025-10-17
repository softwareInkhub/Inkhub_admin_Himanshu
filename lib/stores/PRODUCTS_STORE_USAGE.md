# Enhanced Products Page Store - Usage Guide

## 🎯 Overview

The enhanced `useProductsPageStore` now includes:
- ✅ **Versioned persistence** with automatic migrations
- ✅ **Zod validation** for data integrity
- ✅ **Immer** for clean immutable updates
- ✅ **subscribeWithSelector** for optimal performance
- ✅ **Redux DevTools** integration
- ✅ **Set-based selection** for O(1) operations
- ✅ **Saved Views** feature
- ✅ **Custom hooks** for URL sync and scroll persistence

---

## 📝 Migration from Old Store

### Before (Old Store)
```typescript
const {
  pageIndex, pageSize, sorting, columnFilters, globalFilter,
  setPageIndex, setPageSize, setSorting, setColumnFilters, setGlobalFilter,
  selectedRowIds, setSelectedRowIds,
  scrollY, setScrollY,
} = useProductsPageStore()
```

### After (Enhanced Store)
```typescript
// Import the custom hooks
import { useProductsPageStore, useUrlSync, useScrollPersistence } from '@/lib/stores/products-page-store'

function ProductsPage() {
  // Use the custom hooks for automatic URL and scroll sync
  useUrlSync()
  useScrollPersistence()

  // Subscribe to specific slices (optimal performance)
  const pageIndex = useProductsPageStore(state => state.pageIndex)
  const pageSize = useProductsPageStore(state => state.pageSize)
  const globalFilter = useProductsPageStore(state => state.globalFilter)
  
  // Get actions (these never cause re-renders)
  const setPageIndex = useProductsPageStore(state => state.setPageIndex)
  const toggleSort = useProductsPageStore(state => state.toggleSort)
  const setColumnFilter = useProductsPageStore(state => state.setColumnFilter)
  
  // IMPORTANT: selectedRowIds is now a Set, not an array
  const selectedRowIds = useProductsPageStore(state => state.selectedRowIds)
  const toggleRow = useProductsPageStore(state => state.toggleRow)
  
  // ... rest of component
}
```

---

## 🔥 New Features

### 1. Fine-Grained Actions

```typescript
// Old way: Update entire sorting array
setSorting([{ id: 'price', desc: true }])

// New way: Toggle a single column
toggleSort('price') // asc → desc → none
```

```typescript
// Old way: Merge filters manually
setColumnFilters({ ...columnFilters, status: 'active' })

// New way: Set single filter
setColumnFilter('status', 'active')

// Remove single filter
removeColumnFilter('status')
```

### 2. Set-Based Selection (O(1) Performance)

```typescript
// ❌ OLD: Array operations (O(n))
const handleSelectProduct = (productId: string) => {
  const currentIds = useProductsPageStore.getState().selectedRowIds
  const newIds = currentIds.includes(productId) 
    ? currentIds.filter(id => id !== productId)
    : [...currentIds, productId]
  setSelectedRowIds(newIds)
}

// ✅ NEW: Set operations (O(1))
const toggleRow = useProductsPageStore(state => state.toggleRow)
const handleSelectProduct = (productId: string) => {
  toggleRow(productId) // Instant toggle!
}

// Convert Set to Array when needed for iteration
const selectedIds = Array.from(selectedRowIds)
```

### 3. Saved Views Feature

```typescript
// Save current filter configuration
const saveView = useProductsPageStore(state => state.saveView)
const loadView = useProductsPageStore(state => state.loadView)
const deleteView = useProductsPageStore(state => state.deleteView)

// Save a view
saveView('Active Products Filter', 'Shows only active products')

// Load a view
loadView('view-1234567890')

// Get all saved views
const views = useProductsPageStore(state => state.views)
const viewsList = Object.values(views)
```

### 4. Derived State

```typescript
// Check if any filters are active
const hasActiveFilters = useProductsPageStore(state => state.hasActiveFilters)

{hasActiveFilters && (
  <button onClick={clearAllFilters}>Clear All Filters</button>
)}
```

### 5. Helper Actions

```typescript
// Page navigation helpers
const goToPage = useProductsPageStore(state => state.goToPage)
const nextPage = useProductsPageStore(state => state.nextPage)
const prevPage = useProductsPageStore(state => state.prevPage)

// 1-based page navigation
goToPage(5) // Goes to page 5

// Next/Previous
nextPage()
prevPage()
```

---

## 🎨 Example: Complete Integration

```typescript
'use client'

import { useProductsPageStore, useUrlSync, useScrollPersistence } from '@/lib/stores/products-page-store'
import { shallow } from 'zustand/shallow'

export default function ProductsPage() {
  // 1. Enable automatic URL and scroll sync
  useUrlSync()
  useScrollPersistence()

  // 2. Subscribe to required state (fine-grained for performance)
  const pageIndex = useProductsPageStore(state => state.pageIndex)
  const pageSize = useProductsPageStore(state => state.pageSize)
  const globalFilter = useProductsPageStore(state => state.globalFilter)
  const selectedRowIds = useProductsPageStore(state => state.selectedRowIds)
  const hasActiveFilters = useProductsPageStore(state => state.hasActiveFilters)
  
  // 3. Get actions (never re-render)
  const goToPage = useProductsPageStore(state => state.goToPage)
  const setPageSize = useProductsPageStore(state => state.setPageSize)
  const setGlobalFilter = useProductsPageStore(state => state.setGlobalFilter)
  const toggleRow = useProductsPageStore(state => state.toggleRow)
  const toggleSort = useProductsPageStore(state => state.toggleSort)
  const setColumnFilter = useProductsPageStore(state => state.setColumnFilter)
  const clearAllFilters = useProductsPageStore(state => state.clearAllFilters)
  const saveView = useProductsPageStore(state => state.saveView)
  const loadView = useProductsPageStore(state => state.loadView)

  // 4. Use multiple values with shallow comparison
  const { sorting, columnFilters } = useProductsPageStore(
    state => ({ sorting: state.sorting, columnFilters: state.columnFilters }),
    shallow
  )

  return (
    <div>
      {/* Search */}
      <input 
        value={globalFilter}
        onChange={(e) => setGlobalFilter(e.target.value)}
        placeholder="Search products..."
      />

      {/* Active filters indicator */}
      {hasActiveFilters && (
        <div className="badge">
          Filters Active
          <button onClick={clearAllFilters}>Clear All</button>
        </div>
      )}

      {/* Products table */}
      <table>
        <thead>
          <tr>
            <th onClick={() => toggleSort('title')}>
              Title {sorting.find(s => s.id === 'title')?.desc ? '↓' : '↑'}
            </th>
            <th onClick={() => toggleSort('price')}>
              Price {sorting.find(s => s.id === 'price')?.desc ? '↓' : '↑'}
            </th>
          </tr>
        </thead>
        <tbody>
          {products.map(product => (
            <tr key={product.id}>
              <td>
                <input
                  type="checkbox"
                  checked={selectedRowIds.has(product.id)}
                  onChange={() => toggleRow(product.id)}
                />
              </td>
              <td>{product.title}</td>
              <td>${product.price}</td>
            </tr>
          ))}
        </tbody>
      </table>

      {/* Pagination */}
      <div>
        <button onClick={() => goToPage(pageIndex)}>Previous</button>
        <span>Page {pageIndex + 1}</span>
        <button onClick={() => goToPage(pageIndex + 2)}>Next</button>
        
        <select value={pageSize} onChange={(e) => setPageSize(Number(e.target.value))}>
          <option value={25}>25</option>
          <option value={50}>50</option>
          <option value={100}>100</option>
        </select>
      </div>

      {/* Saved Views */}
      <button onClick={() => saveView('My Filter', 'Custom view')}>
        Save Current View
      </button>
    </div>
  )
}
```

---

## 🚀 Performance Tips

### 1. Use Specific Selectors
```typescript
// ❌ BAD: Subscribes to entire store (re-renders on ANY change)
const store = useProductsPageStore()

// ✅ GOOD: Subscribes only to pageIndex
const pageIndex = useProductsPageStore(state => state.pageIndex)
```

### 2. Use Shallow Comparison for Multiple Values
```typescript
import { shallow } from 'zustand/shallow'

// ✅ Only re-renders when pageIndex OR pageSize changes
const { pageIndex, pageSize } = useProductsPageStore(
  state => ({ pageIndex: state.pageIndex, pageSize: state.pageSize }),
  shallow
)
```

### 3. Actions Never Re-render
```typescript
// ✅ This never causes re-renders (functions are stable)
const setPageIndex = useProductsPageStore(state => state.setPageIndex)
```

### 4. Use subscribeWithSelector Outside React
```typescript
// Subscribe to specific changes outside components
useProductsPageStore.subscribe(
  state => state.selectedRowIds.size,
  (count, prevCount) => {
    console.log(`Selection changed from ${prevCount} to ${count}`)
  }
)
```

---

## 🐛 Debugging with Redux DevTools

1. Install **Redux DevTools** browser extension
2. Open DevTools → Redux tab
3. See all actions with labels: `products/setPageIndex`, `products/toggleSort`, etc.
4. Time-travel debugging available!

---

## 🔄 Migration & Versioning

The store automatically handles version upgrades:

```typescript
// When you need to make breaking changes:
// 1. Update CURRENT_VERSION in products-page-store.ts
// 2. Add migration logic in migratePersistedState()

const migratePersistedState = (persistedState: any, version: number) => {
  if (version === 1) {
    // Add new fields for v2
    persistedState.newField = defaultValue
  }
  
  if (version === 2) {
    // Transform data for v3
    persistedState.oldField = transformOldField(persistedState.oldField)
  }
  
  return PersistedStateSchema.parse(persistedState)
}
```

---

## 📊 Key Changes Summary

| Feature | Old Store | Enhanced Store |
|---------|-----------|----------------|
| Selection | `string[]` (O(n)) | `Set<string>` (O(1)) |
| Actions | Basic setters | Fine-grained + helpers |
| Validation | None | Zod schemas |
| Versioning | None | Automatic migration |
| DevTools | No | Yes |
| Derived State | Manual | Automatic (`hasActiveFilters`) |
| Saved Views | Manual implementation | Built-in |
| URL Sync | Manual | `useUrlSync()` hook |
| Scroll | Manual | `useScrollPersistence()` hook |

---

## 💡 Best Practices

1. **Always use custom hooks** (`useUrlSync`, `useScrollPersistence`) in your page component
2. **Subscribe to specific slices** to prevent unnecessary re-renders
3. **Use Set methods** for selection operations (`.has()`, `.add()`, `.delete()`)
4. **Convert Set to Array** only when needed for rendering: `Array.from(selectedRowIds)`
5. **Use DevTools labels** to track state changes during development
6. **Validate persisted data** with Zod to prevent corruption

---

## 🔧 Troubleshooting

### Issue: "selectedRowIds is not iterable"
**Solution**: Convert Set to Array:
```typescript
const selectedIds = Array.from(selectedRowIds)
{selectedIds.map(id => ...)}
```

### Issue: URL not syncing
**Solution**: Ensure `useUrlSync()` is called at the top of your component

### Issue: Scroll not restoring
**Solution**: Ensure `useScrollPersistence()` is called at the top of your component

### Issue: State not persisting
**Solution**: Check sessionStorage is enabled in browser and not in incognito mode


