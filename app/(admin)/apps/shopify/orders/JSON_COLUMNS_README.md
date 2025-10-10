# JSON Column Customization Feature

## Overview

This feature allows users to fully customize which JSON fields appear as columns in the Orders table. Users can select from any nested JSON field in the Order object, rename column labels, show/hide JSON paths, and persist their preferences per-user.

## Features

### 1. **Comprehensive Field Selection**
- Access to 50+ fields from the Order JSON structure
- Nested path support (e.g., `shipping_address.city`, `customer.firstName`)
- Array index support (e.g., `shipping_lines.0.title`)
- Automatic snake_case/camelCase conversion

### 2. **Column Manager Modal**
- Organized by categories (Core, Financial, Status, Customer, Shipping, etc.)
- Collapsible category sections
- Search/filter fields by name or JSON path
- Quick actions: Select All, Deselect All, Reset to Default
- Custom label input for each selected field
- Type badges for each field (string, number, boolean, array, object, date)
- Copy JSON path to clipboard
- Field count indicators

### 3. **JSON Path Display**
- Toggle to show/hide JSON paths next to column headers
- Inline display format: `Label · (json.path)`
- Copy button for each JSON path in headers
- Monospace font for paths with subtle styling

### 4. **Persistence**
- Per-user localStorage persistence
- Storage key format: `inkhub:orders:columns:v1:{userId}:{setting}`
- Separate storage for:
  - Selected fields
  - Show JSON keys toggle
  - Custom labels
  - Column widths (future enhancement)
- Automatic de-duplication of fields
- Validation before saving

### 5. **Export/Import**
- Export current configuration as JSON file
- Import configuration from JSON file
- Configuration validation on import
- Preview count before applying import
- Useful for backing up settings or sharing configs

### 6. **Quick Toggle Dropdown**
- Fast access to turn columns on/off
- Shows currently selected columns only
- Displays field type badges
- Link to full Column Manager
- Auto-closes on outside click or Escape key

### 7. **Smart Value Formatting**
- **Strings**: Truncated with ellipsis after 50 chars, full text in tooltip
- **Numbers**: Localized formatting, currency symbol for price fields
- **Booleans**: "Yes/No" or status badges
- **Arrays**: `[N items]` with full JSON in tooltip
- **Objects**: `[Object]` with full JSON in tooltip
- **Dates**: Formatted as "Mon DD, YYYY" with optional time
- **null/undefined**: Shows "N/A" in muted style

### 8. **Enhanced Rendering**
- Status badges for fulfillment_status, financial_status, delivery_status
- Color-coded badges (green for success, red for error, yellow for pending, etc.)
- Tags displayed as inline chips (max 2 visible + count)
- Search term highlighting in cell values

## File Structure

```
app/(admin)/apps/shopify/orders/
├── utils/
│   ├── jsonColumnUtils.ts       # Core utilities (path extraction, formatting, validation)
│   └── columnGenerator.tsx      # Column definition generation and cell rendering
├── hooks/
│   ├── useColumnPersistence.ts  # LocalStorage persistence management
│   └── useJsonColumns.ts        # Main hook for column customization
├── components/
│   ├── ColumnManager.tsx        # Full column customization modal
│   └── ColumnsQuickToggle.tsx   # Quick dropdown for fast column toggle
└── JSON_COLUMNS_README.md       # This file
```

## Usage in Orders Page

### Basic Integration

```tsx
import { useJsonColumns } from './hooks/useJsonColumns'
import ColumnManager from './components/ColumnManager'
import ColumnsQuickToggle from './components/ColumnsQuickToggle'

function OrdersPage() {
  const {
    selectedFields,
    showJsonKeys,
    customLabels,
    columns,
    toggleField,
    saveColumnConfig,
    resetToDefault,
    setShowJsonKeys,
    isLoading,
    showColumnManager,
    openColumnManager,
    closeColumnManager
  } = useJsonColumns({ userId: currentUser?.id, searchQuery })

  return (
    <>
      {/* Toolbar */}
      <div className="flex items-center gap-2">
        <ColumnsQuickToggle
          selectedFields={selectedFields}
          onToggleField={toggleField}
          onOpenManager={openColumnManager}
        />
        
        <button onClick={openColumnManager}>
          Customize Columns
        </button>
        
        <label>
          <input
            type="checkbox"
            checked={showJsonKeys}
            onChange={(e) => setShowJsonKeys(e.target.checked)}
          />
          Show JSON paths
        </label>
        
        <button onClick={resetToDefault}>
          Reset to Default
        </button>
      </div>

      {/* Table */}
      <OrderTable
        columns={columns}
        data={orderData}
        showJsonKeys={showJsonKeys}
      />

      {/* Column Manager Modal */}
      <ColumnManager
        isOpen={showColumnManager}
        onClose={closeColumnManager}
        selectedFields={selectedFields}
        showJsonKeys={showJsonKeys}
        customLabels={customLabels}
        onSave={saveColumnConfig}
        onReset={resetToDefault}
      />
    </>
  )
}
```

### Responsive Mobile Menu

For mobile devices, wrap controls in a "More" menu:

```tsx
<div className="md:hidden">
  <button onClick={() => setShowMobileMenu(true)}>
    <MoreVertical />
  </button>
  
  {showMobileMenu && (
    <div className="mobile-menu">
      <button onClick={openColumnManager}>Customize Columns</button>
      <button onClick={resetToDefault}>Reset Columns</button>
      <label>
        <input type="checkbox" checked={showJsonKeys} onChange={...} />
        Show JSON paths
      </label>
    </div>
  )}
</div>

<div className="hidden md:flex gap-2">
  <ColumnsQuickToggle {...props} />
  <button onClick={openColumnManager}>Customize Columns</button>
</div>
```

## API Reference

### `useJsonColumns(options)`

Main hook for column customization.

**Options:**
- `userId?: string` - User ID for persistence (default: 'anonymous')
- `searchQuery?: string` - Current search query for highlighting

**Returns:**
```ts
{
  // Configuration
  selectedFields: VisibleField[]
  showJsonKeys: boolean
  customLabels: Record<string, string>
  
  // Generated columns for table
  columns: ColumnDef<Order>[]
  
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
```

### Utility Functions

#### `getValueFromPath(obj, path)`
Safely extracts value from nested object using dot notation.

```ts
const value = getValueFromPath(order, 'shipping_address.city')
// Handles both snake_case and camelCase automatically
```

#### `formatValue(value, type)`
Formats value for display based on type.

```ts
formatValue(true, 'boolean') // "Yes"
formatValue([1, 2, 3], 'array') // "[3 items]"
formatValue(new Date(), 'date') // "Oct 10, 2024"
```

#### `copyToClipboard(text)`
Copies text to clipboard with fallback for older browsers.

```ts
const success = await copyToClipboard('shipping_address.city')
```

## Default Columns

The following columns are shown by default:
1. Order Number
2. Customer Name
3. Fulfillment Status
4. Total
5. Created At
6. Channel
7. Financial Status

Users can reset to these defaults at any time.

## Storage Schema

### Selected Fields
```json
{
  "key": "shipping_address.city",
  "label": "Shipping City",
  "path": "shipping_address.city",
  "type": "string",
  "sortable": false
}
```

### Custom Labels
```json
{
  "shipping_address.city": "Ship To City",
  "customer.firstName": "First Name"
}
```

### Show JSON Keys
```json
true
```

## Performance Considerations

1. **Memoization**: Column definitions are memoized and only regenerate when config or search query changes
2. **Lazy Loading**: Column Manager only renders when opened
3. **Efficient Storage**: Each setting stored separately to minimize localStorage writes
4. **De-duplication**: Automatic de-duplication prevents duplicate fields
5. **Validation**: Config validation prevents corrupt data from being saved

## Future Enhancements

- [ ] Column reordering via drag-and-drop
- [ ] Column width persistence
- [ ] Column pinning (freeze columns)
- [ ] Preset column configurations
- [ ] Server-side persistence (sync across devices)
- [ ] Column grouping (e.g., group related address fields)
- [ ] Conditional formatting rules per column
- [ ] Column-level sorting and filtering
- [ ] Export visible columns only

## Troubleshooting

### Columns not persisting
- Check localStorage quota (may be exceeded)
- Verify userId is consistent across sessions
- Check browser console for validation errors

### Invalid JSON path
- Verify path exists in Order object
- Check for typos in nested paths
- Use snake_case for API fields, camelCase for transformed fields

### Performance issues
- Reduce number of selected columns
- Avoid selecting heavy object/array fields
- Clear old localStorage data

## Support

For issues or feature requests, please contact the development team or create an issue in the project repository.

