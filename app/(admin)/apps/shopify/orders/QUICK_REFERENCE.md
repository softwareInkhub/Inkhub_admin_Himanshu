# JSON Column Customization - Quick Reference Card

## 🚀 Quick Start (Copy-Paste Ready)

### 1. Import
```tsx
import { useJsonColumns } from './hooks/useJsonColumns'
import ColumnManager from './components/ColumnManager'
import ColumnsQuickToggle from './components/ColumnsQuickToggle'
```

### 2. Hook Usage
```tsx
const {
  selectedFields,      // Current selected fields
  showJsonKeys,        // Show JSON paths toggle
  customLabels,        // Custom field labels
  columns,             // Generated table columns
  toggleField,         // Toggle field on/off
  saveColumnConfig,    // Save full config
  resetToDefault,      // Reset to defaults
  setShowJsonKeys,     // Toggle JSON paths
  isLoading,           // Loading state
  showColumnManager,   // Modal open state
  openColumnManager,   // Open modal
  closeColumnManager   // Close modal
} = useJsonColumns({ 
  userId: currentUser?.id || 'anonymous',
  searchQuery: debouncedSearchQuery 
})
```

### 3. UI Components
```tsx
{/* Toolbar */}
<button onClick={openColumnManager}>Customize Columns</button>
<ColumnsQuickToggle 
  selectedFields={selectedFields}
  onToggleField={toggleField}
  onOpenManager={openColumnManager}
/>
<label>
  <input type="checkbox" checked={showJsonKeys} onChange={(e) => setShowJsonKeys(e.target.checked)} />
  Show JSON paths
</label>
<button onClick={resetToDefault}>Reset</button>

{/* Modal */}
<ColumnManager
  isOpen={showColumnManager}
  onClose={closeColumnManager}
  selectedFields={selectedFields}
  showJsonKeys={showJsonKeys}
  customLabels={customLabels}
  onSave={saveColumnConfig}
  onReset={resetToDefault}
/>

{/* Table */}
<OrderTable columns={columns} data={orderData} />
```

---

## 📋 Common Use Cases

### Add a New JSON Field
```tsx
// Edit: utils/jsonColumnUtils.ts
export const ALL_JSON_FIELDS: VisibleField[] = [
  // ... existing fields
  { 
    key: 'my_custom_field', 
    label: 'My Custom Field', 
    path: 'my_custom_field', 
    type: 'string', 
    sortable: true 
  }
]
```

### Get Value from Nested Path
```tsx
import { getValueFromPath } from './utils/jsonColumnUtils'

const city = getValueFromPath(order, 'shipping_address.city')
const firstItem = getValueFromPath(order, 'line_items.0.title')
```

### Format Value for Display
```tsx
import { formatValue } from './utils/jsonColumnUtils'

formatValue(123, 'number')         // "123"
formatValue(true, 'boolean')       // "Yes"
formatValue([1,2,3], 'array')      // "[3 items]"
formatValue(new Date(), 'date')    // "Oct 10, 2024"
```

### Copy JSON Path to Clipboard
```tsx
import { copyToClipboard } from './utils/jsonColumnUtils'

const success = await copyToClipboard('shipping_address.city')
if (success) console.log('Copied!')
```

### Export Configuration
```tsx
import { exportColumnConfig } from './utils/jsonColumnUtils'

exportColumnConfig(config, 'my-columns.json')
// Downloads "my-columns.json"
```

### Import Configuration
```tsx
import { importColumnConfig } from './utils/jsonColumnUtils'

const file = event.target.files[0]
const config = await importColumnConfig(file)
saveColumnConfig(config)
```

---

## 🔧 API Reference

### `useJsonColumns(options)`

**Options:**
```tsx
{
  userId?: string        // User ID for persistence
  searchQuery?: string   // Search query for highlighting
}
```

**Returns:**
```tsx
{
  selectedFields: VisibleField[]
  showJsonKeys: boolean
  customLabels: Record<string, string>
  columns: ColumnDef<Order>[]
  toggleField: (field: VisibleField) => void
  saveColumnConfig: (config: ColumnConfig) => void
  resetToDefault: () => void
  setShowJsonKeys: (show: boolean) => void
  isLoading: boolean
  showColumnManager: boolean
  openColumnManager: () => void
  closeColumnManager: () => void
}
```

### `VisibleField` Type
```tsx
{
  key: string           // Unique identifier
  label: string         // Display label
  path: string          // JSON dot-notation path
  type: 'string' | 'number' | 'boolean' | 'array' | 'object' | 'date'
  sortable?: boolean    // Optional: can column be sorted
  width?: number        // Optional: column width in px
}
```

### `ColumnConfig` Type
```tsx
{
  selectedFields: VisibleField[]
  showJsonKeys: boolean
  customLabels: Record<string, string>
  columnWidths: Record<string, number>
}
```

---

## 🎨 Styling Guide

### Custom Field Type Colors
```tsx
// Edit: ColumnManager.tsx
const typeColors = {
  string: 'bg-green-100 text-green-800',
  number: 'bg-blue-100 text-blue-800',
  boolean: 'bg-purple-100 text-purple-800',
  array: 'bg-orange-100 text-orange-800',
  object: 'bg-gray-100 text-gray-800',
  date: 'bg-indigo-100 text-indigo-800'
}
```

### Custom Status Badge Colors
```tsx
// Edit: utils/columnGenerator.tsx
const statusMap = {
  fulfilled: { className: 'bg-green-100 text-green-800', text: 'Fulfilled' },
  unfulfilled: { className: 'bg-red-100 text-red-800', text: 'Unfulfilled' },
  // ... add more
}
```

### JSON Path Style
```tsx
// Current: Monospace, small, gray
<code className="text-[11px] font-mono text-gray-500 bg-gray-100 px-1.5 py-0.5 rounded">
  {field.path}
</code>
```

---

## 🔍 Debugging

### Enable Debug Logging
```tsx
localStorage.setItem('inkhub:debug:columns', 'true')
// Reload page
```

### Check Persisted Config
```tsx
// In browser console:
localStorage.getItem('inkhub:orders:columns:v1:anonymous:selectedFields')
```

### Clear All Saved Data
```tsx
import { clearColumnPersistence } from './hooks/useColumnPersistence'

clearColumnPersistence('userId', 'orders')
```

### Validate Config
```tsx
import { validateColumnConfig } from './utils/jsonColumnUtils'

const isValid = validateColumnConfig(config)
if (!isValid) console.error('Invalid config!')
```

---

## 📦 Default Fields (7)

1. `orderNumber` - Order Number
2. `customerName` - Customer Name
3. `fulfillmentStatus` - Fulfillment Status
4. `total` - Total
5. `createdAt` - Created At
6. `channel` - Channel
7. `financialStatus` - Financial Status

---

## 🚨 Common Errors & Fixes

| Error | Cause | Fix |
|-------|-------|-----|
| "Invalid column configuration" | Corrupt localStorage | `clearColumnPersistence()` |
| "Failed to parse configuration file" | Invalid JSON | Check file format |
| Columns not showing data | Wrong JSON path | Verify path exists in Order object |
| localStorage quota exceeded | Too much data | Export config, clear storage, re-import |
| "Cannot read property 'map'" | selectedFields is null | Check hook initialization |

---

## ⚡ Performance Tips

1. **Memoize columns**: Done automatically by `useJsonColumns`
2. **Limit selected fields**: Keep under 20 for best performance
3. **Avoid heavy object fields**: Objects/arrays are slower to render
4. **Use compact mode**: Pass `compact: true` to cell renderers
5. **Debounce search**: Already done in main page

---

## 📱 Mobile Responsiveness

```tsx
{/* Desktop */}
<div className="hidden md:flex gap-2">
  <ColumnsQuickToggle {...props} />
  <button onClick={openColumnManager}>Customize</button>
</div>

{/* Mobile */}
<div className="md:hidden">
  <button onClick={() => setShowMobileMenu(true)}>
    <MoreVertical />
  </button>
  {showMobileMenu && (
    <div className="mobile-menu">
      <button onClick={openColumnManager}>Customize Columns</button>
      <button onClick={resetToDefault}>Reset</button>
      {/* ... more options */}
    </div>
  )}
</div>
```

---

## 🔗 Related Files

| File | Purpose |
|------|---------|
| `utils/jsonColumnUtils.ts` | Core utilities |
| `utils/columnGenerator.tsx` | Column rendering |
| `hooks/useColumnPersistence.ts` | Storage management |
| `hooks/useJsonColumns.ts` | Main integration hook |
| `components/ColumnManager.tsx` | Full modal |
| `components/ColumnsQuickToggle.tsx` | Quick dropdown |

---

## 📞 Need Help?

1. Check `JSON_COLUMNS_README.md` for detailed docs
2. Review `INTEGRATION_GUIDE.md` for step-by-step
3. Read `FEATURE_SUMMARY.md` for overview
4. Enable debug mode and check console
5. Contact development team

---

## ✅ Pre-Integration Checklist

- [ ] Read `INTEGRATION_GUIDE.md`
- [ ] Import all required components
- [ ] Add `useJsonColumns` hook
- [ ] Replace static columns with `columns`
- [ ] Add toolbar UI (buttons, toggle, dropdown)
- [ ] Add `<ColumnManager>` modal
- [ ] Test in development
- [ ] Check mobile responsiveness
- [ ] Verify persistence works
- [ ] Test export/import
- [ ] Review linter warnings
- [ ] Deploy to staging

---

**Last Updated**: October 10, 2025  
**Version**: 1.0.0  
**Status**: Production Ready ✅

