# JSON Column Customization - Integration Guide

## Step-by-Step Integration into Orders Page

### Step 1: Import Required Components and Hooks

Add these imports at the top of `page.tsx`:

```tsx
// JSON Column Customization
import { useJsonColumns } from './hooks/useJsonColumns'
import ColumnManager from './components/ColumnManager'
import ColumnsQuickToggle from './components/ColumnsQuickToggle'
import { generateEnhancedCellRenderer } from './utils/columnGenerator'
import { VisibleField } from './utils/jsonColumnUtils'
```

### Step 2: Add Hook in OrdersClientContent Component

Inside the `OrdersClientContent` function, add the hook after the existing state declarations (around line 80):

```tsx
// JSON Column Customization
const {
  selectedFields,
  showJsonKeys,
  customLabels,
  columns: jsonColumns,
  toggleField,
  saveColumnConfig,
  resetToDefault: resetJsonColumns,
  setShowJsonKeys,
  isLoading: isLoadingColumns,
  showColumnManager,
  openColumnManager,
  closeColumnManager
} = useJsonColumns({ 
  userId: useAppStore.getState().currentUser?.id || 'anonymous',
  searchQuery: debouncedSearchQuery 
})
```

### Step 3: Replace Static Column Definitions

Find the existing `allOrderColumns` array (around line 2027) and replace it with this dynamic version:

```tsx
// Generate columns from JSON customization
const allOrderColumns = useMemo(() => {
  return jsonColumns.map((col, idx) => ({
    key: col.key,
    label: col.label,
    sortable: col.sortable,
    render: col.render
  }))
}, [jsonColumns])

// Also keep serial number column if needed
const serialNumberColumn = {
  key: 'serialNumber',
  label: 'S.NO',
  sortable: true,
  render: (order: Order, index?: number) => {
    const serialNumber = startIndex + (index || 0) + 1
    return <span className="text-sm font-medium text-gray-900">#{serialNumber}</span>
  }
}

// Combine if serial number should always be first
const finalOrderColumns = [serialNumberColumn, ...allOrderColumns]
```

### Step 4: Add Column Customization UI to Toolbar

Find the "Persistent Actions Row" section (around line 2322) and add the column customization controls:

```tsx
{/* Persistent Actions Row - always visible between search and table */}
<div className="px-0 py-1 bg-white border-b border-gray-200">
  <div className="flex items-center justify-between gap-2 flex-wrap">
    {/* Left action group */}
    <div className="flex items-center justify-start gap-2 flex-wrap">
      {/* Selection counter */}
      <div className="mr-2 text-xs sm:text-sm text-gray-600">
        {selectedRowIds.length}/{totalItemsForPagination} selected
      </div>
      
      {/* Existing buttons (Import, Print, etc.) */}
      {/* ... */}
      
      {/* NEW: Column Customization Button */}
      <button
        onClick={openColumnManager}
        className={cn(
          "px-3 py-1 text-xs sm:text-sm rounded-md transition-all duration-200 bg-white shadow-sm hover:shadow-md",
          "text-purple-700 border border-purple-400 hover:bg-gradient-to-r hover:from-purple-50 hover:to-purple-100"
        )}
        title="Customize Columns"
      >
        <span className="inline-flex items-center gap-1">
          <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 17V7m0 10a2 2 0 01-2 2H5a2 2 0 01-2-2V7a2 2 0 012-2h2a2 2 0 012 2m0 10a2 2 0 002 2h2a2 2 0 002-2M9 7a2 2 0 012-2h2a2 2 0 012 2m0 10V7m0 10a2 2 0 002 2h2a2 2 0 002-2V7a2 2 0 00-2-2h-2a2 2 0 00-2 2" />
          </svg>
          <span>Columns</span>
        </span>
      </button>
    </div>
    
    {/* Right side actions */}
    <div className="flex items-center gap-2">
      {/* NEW: Quick Column Toggle */}
      <ColumnsQuickToggle
        selectedFields={selectedFields}
        onToggleField={toggleField}
        onOpenManager={openColumnManager}
        className="hidden md:block"
      />
      
      {/* NEW: Show JSON Keys Toggle */}
      <label className="hidden md:flex items-center space-x-2 text-xs text-gray-700 cursor-pointer">
        <input
          type="checkbox"
          checked={showJsonKeys}
          onChange={(e) => setShowJsonKeys(e.target.checked)}
          className="rounded border-gray-300 text-purple-600 focus:ring-purple-500"
        />
        <span>Show JSON paths</span>
      </label>
      
      {/* NEW: Reset Columns Button */}
      <button
        onClick={resetJsonColumns}
        className="hidden md:block px-3 py-1 text-xs text-gray-600 border border-gray-300 rounded-md hover:bg-gray-50 transition-colors"
        title="Reset to default columns"
      >
        Reset Columns
      </button>
      
      {/* Existing Settings button */}
      {/* ... */}
    </div>
  </div>
</div>
```

### Step 5: Add Column Manager Modal

Add this before the closing `</div>` tags at the end of the return statement (around line 3608):

```tsx
      {/* Column Manager Modal */}
      <ColumnManager
        isOpen={showColumnManager}
        onClose={closeColumnManager}
        selectedFields={selectedFields}
        showJsonKeys={showJsonKeys}
        customLabels={customLabels}
        onSave={saveColumnConfig}
        onReset={resetJsonColumns}
      />
      
      {/* Close other divs */}
      </div>
    </div>
  )
}
```

### Step 6: Add Mobile Menu Support (Optional but Recommended)

For responsive design, add a mobile menu that contains the column controls:

```tsx
{/* Mobile More Menu */}
<div className="md:hidden">
  <button
    onClick={() => setShowMobileMenu(!showMobileMenu)}
    className="p-2 text-gray-600 hover:text-gray-900"
  >
    <MoreVertical className="h-5 w-5" />
  </button>
  
  {showMobileMenu && (
    <div className="absolute right-0 mt-2 w-56 bg-white border border-gray-200 rounded-lg shadow-lg z-50">
      <div className="p-2 space-y-2">
        <button
          onClick={() => {
            openColumnManager()
            setShowMobileMenu(false)
          }}
          className="w-full text-left px-3 py-2 text-sm text-gray-700 hover:bg-gray-100 rounded-md"
        >
          Customize Columns
        </button>
        
        <button
          onClick={() => {
            resetJsonColumns()
            setShowMobileMenu(false)
          }}
          className="w-full text-left px-3 py-2 text-sm text-gray-700 hover:bg-gray-100 rounded-md"
        >
          Reset Columns
        </button>
        
        <label className="flex items-center justify-between px-3 py-2 text-sm text-gray-700 cursor-pointer hover:bg-gray-100 rounded-md">
          <span>Show JSON paths</span>
          <input
            type="checkbox"
            checked={showJsonKeys}
            onChange={(e) => setShowJsonKeys(e.target.checked)}
            className="rounded border-gray-300 text-purple-600 focus:ring-purple-500"
          />
        </label>
      </div>
    </div>
  )}
</div>
```

### Step 7: Update OrderTable Component (if needed)

If your OrderTable component needs to display JSON path headers, pass the `showJsonKeys` prop:

```tsx
<OrderTable
  currentOrders={currentData}
  columns={finalOrderColumns}
  showJsonKeys={showJsonKeys}  // NEW
  // ... other props
/>
```

Then in OrderTable, render headers with JSON paths:

```tsx
{/* In table header */}
<th key={column.key}>
  <div className="flex items-center gap-2">
    <span>{column.label}</span>
    {showJsonKeys && (
      <code className="text-[11px] font-mono text-gray-500 bg-gray-100 px-1.5 py-0.5 rounded">
        {/* Get the field from selectedFields */}
        {selectedFields.find(f => f.key === column.key)?.path}
      </code>
    )}
  </div>
</th>
```

## Testing Checklist

After integration, test the following:

- [ ] Open Column Manager modal
- [ ] Search for fields
- [ ] Select/deselect fields
- [ ] Add custom labels
- [ ] Toggle "Show JSON paths"
- [ ] Export configuration
- [ ] Import configuration
- [ ] Reset to defaults
- [ ] Quick toggle dropdown works
- [ ] Columns persist across page refresh
- [ ] Columns show correct data
- [ ] Status badges render correctly
- [ ] Date formatting works
- [ ] Array/Object fields show count/placeholder
- [ ] Copy JSON path to clipboard works
- [ ] Mobile menu shows all options
- [ ] No console errors

## Troubleshooting

### Columns not showing data
- Verify the JSON paths match your Order object structure
- Check console for errors in `getValueFromPath`
- Ensure Order data includes the nested fields

### Performance issues
- Reduce number of selected columns
- Check if `useMemo` is wrapping expensive computations
- Verify `jsonColumns` is properly memoized

### Persistence not working
- Check localStorage is enabled
- Verify userId is being passed correctly
- Check browser console for storage errors

### Import/Export not working
- Verify file has `.json` extension
- Check file content is valid JSON
- Ensure configuration validates correctly

## Next Steps

1. Test thoroughly in development
2. Review mobile responsiveness
3. Add keyboard shortcuts (optional)
4. Add column reordering (future enhancement)
5. Consider server-side persistence (future enhancement)
6. Deploy to staging for user testing

## Support

For questions or issues, refer to `JSON_COLUMNS_README.md` or contact the development team.

