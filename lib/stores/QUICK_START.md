# ⚡ Quick Start - Enhanced Products Store

## 🎯 What You Need to Know (60 seconds)

### The 3 Key Changes

#### 1️⃣ Add Two Hooks (Auto-sync URL and scroll)
```typescript
function ProductsPage() {
  useUrlSync()           // ← Add this
  useScrollPersistence() // ← Add this
  
  // ... rest of code
}
```

#### 2️⃣ selectedRowIds is now a Set
```typescript
// OLD: Array
selectedRowIds.includes(id)  // ❌
selectedRowIds.length        // ❌

// NEW: Set  
selectedRowIds.has(id)       // ✅ O(1) performance
selectedRowIds.size          // ✅
Array.from(selectedRowIds)   // ✅ Convert when needed
```

#### 3️⃣ Use Fine-Grained Actions
```typescript
// OLD: Manual updates
const newIds = selectedRowIds.filter(id => id !== productId)
setSelectedRowIds(newIds)

// NEW: Single action
toggleRow(productId)
```

---

## 🔥 Copy-Paste Template

Replace your old store usage with this:

```typescript
'use client'

import { 
  useProductsPageStore, 
  useUrlSync, 
  useScrollPersistence 
} from '@/lib/stores/products-page-store'
import { shallow } from 'zustand/shallow'

function ProductsPage() {
  // 1. Auto-sync (add these at the top)
  useUrlSync()
  useScrollPersistence()

  // 2. State selectors (optimal performance)
  const pageIndex = useProductsPageStore(s => s.pageIndex)
  const pageSize = useProductsPageStore(s => s.pageSize)
  const globalFilter = useProductsPageStore(s => s.globalFilter)
  const selectedRowIds = useProductsPageStore(s => s.selectedRowIds) // Set!
  const hasActiveFilters = useProductsPageStore(s => s.hasActiveFilters)
  
  // 3. Actions (never re-render)
  const goToPage = useProductsPageStore(s => s.goToPage)
  const setGlobalFilter = useProductsPageStore(s => s.setGlobalFilter)
  const toggleRow = useProductsPageStore(s => s.toggleRow)
  const toggleSort = useProductsPageStore(s => s.toggleSort)
  const setColumnFilter = useProductsPageStore(s => s.setColumnFilter)
  const clearAllFilters = useProductsPageStore(s => s.clearAllFilters)

  // ... your component logic
}
```

---

## 🎯 Common Patterns

### Pattern 1: Row Selection
```typescript
<input
  type="checkbox"
  checked={selectedRowIds.has(product.id)}
  onChange={() => toggleRow(product.id)}
/>
```

### Pattern 2: Column Sorting
```typescript
<th onClick={() => toggleSort('price')}>
  Price {sorting.find(s => s.id === 'price')?.desc ? '↓' : '↑'}
</th>
```

### Pattern 3: Search
```typescript
<input
  value={globalFilter}
  onChange={(e) => setGlobalFilter(e.target.value)}
  placeholder="Search..."
/>
```

### Pattern 4: Pagination
```typescript
<button onClick={prevPage}>←</button>
<span>Page {pageIndex + 1}</span>
<button onClick={nextPage}>→</button>

<select value={pageSize} onChange={(e) => setPageSize(Number(e.target.value))}>
  <option value={25}>25</option>
  <option value={50}>50</option>
</select>
```

### Pattern 5: Active Filters Badge
```typescript
{hasActiveFilters && (
  <div className="badge">
    Filters Active
    <button onClick={clearAllFilters}>Clear</button>
  </div>
)}
```

---

## 🚨 Breaking Changes

### Change 1: selectedRowIds Type
```diff
- selectedRowIds: string[]
+ selectedRowIds: Set<string>
```

**Fix**: 
- `.includes(id)` → `.has(id)`
- `.length` → `.size`
- `.map(...)` → `Array.from(selectedRowIds).map(...)`

### Change 2: No Manual URL/Scroll Sync Needed
```diff
- useEffect(() => { /* URL sync code */ }, [])
- useEffect(() => { /* Scroll sync code */ }, [])
+ useUrlSync()
+ useScrollPersistence()
```

**Fix**: Delete manual sync useEffects, add hooks

---

## ✅ Migration Checklist

Copy this checklist and check off as you go:

```
Products Page Migration Checklist

[ ] 1. Import new hooks (useUrlSync, useScrollPersistence)
[ ] 2. Add useUrlSync() at top of component
[ ] 3. Add useScrollPersistence() at top of component
[ ] 4. Replace store destructuring with fine-grained selectors
[ ] 5. Remove manual URL sync useEffect
[ ] 6. Remove manual scroll sync useEffect
[ ] 7. Update handleSelectProduct to use toggleRow
[ ] 8. Update handleSelectAll to use selectAll/clearSelection
[ ] 9. Replace selectedRowIds.length with selectedRowIds.size
[ ] 10. Replace selectedRowIds.includes() with selectedRowIds.has()
[ ] 11. Convert Set to Array where needed: Array.from(selectedRowIds)
[ ] 12. Update handlePageChange to use goToPage
[ ] 13. Update column filter handler to use setColumnFilter
[ ] 14. Test: pagination, search, filters, sorting, selection
[ ] 15. Test: page refresh preserves state
[ ] 16. Test: URL sharing works
[ ] 17. Test: scroll position restores
[ ] 18. Check Redux DevTools for action labels (optional)
```

---

## 🎓 Where to Go Next

1. **Quick Reference**: See `PRODUCTS_STORE_USAGE.md`
2. **Detailed Migration**: See `PRODUCTS_STORE_MIGRATION.md`
3. **Code Examples**: See `PRODUCTS_STORE_EXAMPLE.tsx`
4. **Live Demo**: See `PRODUCTS_STORE_DEMO.tsx`
5. **Full Docs**: See `README_ENHANCED_STORE.md`

---

## 💡 Pro Tips

1. **Open Redux DevTools** to see all actions in real-time
2. **Use Set methods** for instant selection operations
3. **Subscribe to specific slices** to minimize re-renders
4. **Use hasActiveFilters** for conditional UI rendering
5. **Save views** for common filter configurations

---

## 🆘 Need Help?

- **Issue with Sets?** → Remember: `.has()`, `.size`, `Array.from()`
- **URL not syncing?** → Did you add `useUrlSync()`?
- **Scroll not working?** → Did you add `useScrollPersistence()`?
- **Re-renders too often?** → Use specific selectors, not whole store
- **DevTools not working?** → Only works in development mode

---

**You're ready to go! 🚀**


