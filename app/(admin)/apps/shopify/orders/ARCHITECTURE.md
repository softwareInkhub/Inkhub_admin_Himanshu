# JSON Column Customization - Architecture & Data Flow

## 🏗️ System Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                        Orders Page (page.tsx)                    │
│                                                                  │
│  ┌────────────────────────────────────────────────────────────┐│
│  │              useJsonColumns Hook                            ││
│  │  ┌──────────────────────────────────────────────────────┐ ││
│  │  │  useColumnPersistence                                 │ ││
│  │  │    ↓                                                  │ ││
│  │  │  localStorage (Per-User)                             │ ││
│  │  │    - selectedFields[]                                │ ││
│  │  │    - showJsonKeys                                    │ ││
│  │  │    - customLabels{}                                  │ ││
│  │  └──────────────────────────────────────────────────────┘ ││
│  │                                                             ││
│  │  ┌──────────────────────────────────────────────────────┐ ││
│  │  │  Column Generation                                    │ ││
│  │  │    generateColumns()                                  │ ││
│  │  │    generateEnhancedCellRenderer()                    │ ││
│  │  └──────────────────────────────────────────────────────┘ ││
│  └────────────────────────────────────────────────────────────┘│
│                              │                                  │
│              ┌───────────────┼───────────────┐                 │
│              ↓               ↓               ↓                 │
│   ┌──────────────┐  ┌─────────────┐  ┌─────────────────┐     │
│   │ ColumnManager│  │ColumnsQuick │  │  OrderTable     │     │
│   │    Modal     │  │   Toggle    │  │  (with columns) │     │
│   └──────────────┘  └─────────────┘  └─────────────────┘     │
│          │                                       │              │
│          ↓                                       ↓              │
│   ┌─────────────────────────────────────────────────────────┐ │
│   │              JSON Data Rendering                         │ │
│   │  • getValueFromPath() - Extract nested values           │ │
│   │  • formatValue() - Type-based formatting                │ │
│   │  • renderStatusBadge() - Status badges                  │ │
│   └─────────────────────────────────────────────────────────┘ │
└─────────────────────────────────────────────────────────────────┘
```

---

## 🔄 Data Flow Diagram

### 1. Initial Load
```
User opens page
      ↓
useJsonColumns() hook initializes
      ↓
useColumnPersistence() reads localStorage
      ↓
Load saved config OR use defaults
      ↓
Generate columns from config
      ↓
Render OrderTable with columns
      ↓
Display data using generated renderers
```

### 2. User Customizes Columns
```
User clicks "Customize Columns"
      ↓
ColumnManager modal opens
      ↓
Display ALL_JSON_FIELDS (50+)
      ↓
User selects/deselects fields
      ↓
User adds custom labels (optional)
      ↓
User clicks "Save Changes"
      ↓
saveColumnConfig() called
      ↓
Validate config
      ↓
Save to localStorage (per-user key)
      ↓
Update React state
      ↓
Re-generate columns (memoized)
      ↓
OrderTable re-renders with new columns
```

### 3. Quick Toggle
```
User clicks "Columns" dropdown
      ↓
ColumnsQuickToggle renders
      ↓
Shows currently selected fields
      ↓
User toggles a field on/off
      ↓
toggleField() called
      ↓
Update selectedFields in config
      ↓
Save to localStorage
      ↓
Re-generate columns
      ↓
Table updates instantly
```

### 4. Export/Import
```
EXPORT:
User clicks "Export" in ColumnManager
      ↓
exportColumnConfig(config, filename)
      ↓
JSON.stringify(config)
      ↓
Create download link
      ↓
Browser downloads JSON file

IMPORT:
User clicks "Import" in ColumnManager
      ↓
File input opens
      ↓
User selects JSON file
      ↓
importColumnConfig(file)
      ↓
FileReader reads file
      ↓
JSON.parse(content)
      ↓
validateColumnConfig(parsed)
      ↓
If valid: Apply config
      ↓
Save to localStorage
      ↓
Table updates with imported columns
```

---

## 🗂️ Component Hierarchy

```
page.tsx (OrdersClientContent)
├── SearchControls
│   └── (existing search/filter UI)
├── [NEW] Toolbar with Column Controls
│   ├── Button: "Customize Columns" → openColumnManager()
│   ├── ColumnsQuickToggle
│   │   ├── Dropdown with current fields
│   │   └── Link to ColumnManager
│   ├── Checkbox: "Show JSON paths" → setShowJsonKeys()
│   └── Button: "Reset Columns" → resetToDefault()
├── OrderKPIGrid
├── AdvancedFilter (if shown)
├── [MODIFIED] OrderTable
│   └── columns={jsonColumns}  ← Generated dynamically
└── [NEW] ColumnManager Modal
    ├── Header
    │   ├── Title + Close button
    │   └── Selected count
    ├── Search + Controls
    │   ├── Search input
    │   ├── Select All / Deselect All
    │   ├── Reset to Default
    │   └── Show JSON paths toggle
    ├── Category Sections (collapsible)
    │   ├── Core Fields
    │   ├── Financial Fields
    │   ├── Status Fields
    │   ├── Date Fields
    │   ├── Customer Fields
    │   ├── Shipping Address
    │   ├── Billing Address
    │   ├── Items & Line Items
    │   └── Other Fields
    └── Footer
        ├── Export button
        ├── Import button
        ├── Cancel button
        └── Save Changes button
```

---

## 💾 Data Storage Schema

### LocalStorage Structure
```
Key Format: inkhub:orders:columns:v1:{userId}:{setting}

Keys:
├── selectedFields     → VisibleField[]
├── showJsonKeys       → boolean
├── customLabels       → Record<string, string>
└── columnWidths       → Record<string, number> (future)
```

### Example Stored Data
```javascript
// selectedFields
[
  {
    "key": "orderNumber",
    "label": "Order Number",
    "path": "orderNumber",
    "type": "string",
    "sortable": true
  },
  {
    "key": "shipping_address.city",
    "label": "Shipping City",
    "path": "shipping_address.city",
    "type": "string",
    "sortable": false
  }
]

// showJsonKeys
true

// customLabels
{
  "shipping_address.city": "Ship To City",
  "customer.firstName": "First Name"
}
```

---

## 🔧 Function Call Chain

### Opening Column Manager
```
User clicks "Customize Columns" button
      ↓
onClick={openColumnManager}
      ↓
openColumnManager() from useJsonColumns
      ↓
setShowColumnManager(true)
      ↓
<ColumnManager isOpen={true} />
      ↓
Modal renders with selectedFields prop
```

### Saving Configuration
```
User clicks "Save Changes" in modal
      ↓
handleSave() in ColumnManager
      ↓
onSave(config) → prop from page
      ↓
saveColumnConfig(config) from useJsonColumns
      ↓
saveConfig(config) from useColumnPersistence
      ↓
validateColumnConfig(config)
      ↓
deduplicateFields(config.selectedFields)
      ↓
localStorage.setItem(key, JSON.stringify(value))
      ↓
setConfig(newConfig) → React state update
      ↓
useJsonColumns re-generates columns (useMemo)
      ↓
page.tsx re-renders OrderTable with new columns
```

### Rendering Cell Data
```
OrderTable renders row
      ↓
column.render(order, index)
      ↓
generateEnhancedCellRenderer(order, field, options)
      ↓
Check if special field (status, tags)
  ├─ YES → renderStatusBadge() or custom render
  └─ NO  → renderCellValue()
           ↓
           getValueFromPath(order, field.path)
           ↓
           formatValue(value, field.type)
           ↓
           Return JSX with styling
```

---

## 🧩 Module Dependencies

```
useJsonColumns (Integration Hook)
├── useColumnPersistence (Storage)
│   └── jsonColumnUtils (Utilities)
│       ├── ALL_JSON_FIELDS
│       ├── getValueFromPath()
│       ├── formatValue()
│       ├── validateColumnConfig()
│       ├── exportColumnConfig()
│       └── importColumnConfig()
└── columnGenerator (Rendering)
    ├── generateColumns()
    ├── renderCellValue()
    ├── renderStatusBadge()
    └── generateEnhancedCellRenderer()

ColumnManager (UI Component)
├── Depends on: jsonColumnUtils
└── Callbacks: onSave, onReset

ColumnsQuickToggle (UI Component)
├── Depends on: jsonColumnUtils (VisibleField type)
└── Callbacks: onToggleField, onOpenManager
```

---

## 🎯 Key Design Decisions

### 1. Why LocalStorage?
- ✅ **Instant**: No network latency
- ✅ **Offline**: Works without connection
- ✅ **Simple**: No backend API needed
- ✅ **Per-user**: Isolated by userId
- ❌ **Limitation**: No cross-device sync (future: add server persistence)

### 2. Why Per-Setting Keys?
Instead of one big config object:
```
❌ ONE KEY: inkhub:orders:columns:v1:user123
✅ SEPARATE: inkhub:orders:columns:v1:user123:selectedFields
✅ SEPARATE: inkhub:orders:columns:v1:user123:showJsonKeys
```
**Reason**: Minimizes localStorage writes, easier to update individual settings

### 3. Why Memoization?
```tsx
const columns = useMemo(() => 
  generateColumns(selectedFields, { showJsonKeys }),
  [selectedFields, showJsonKeys]
)
```
**Reason**: Column generation is expensive (50+ fields), only regenerate when config changes

### 4. Why Validation?
```tsx
if (!validateColumnConfig(config)) {
  console.error('Invalid config')
  return
}
```
**Reason**: Prevent corrupt data from crashing the app

### 5. Why De-duplication?
```tsx
const dedupedFields = deduplicateFields(config.selectedFields)
```
**Reason**: Handle edge cases from imports or old versions

---

## 🔒 Security & Privacy

### Data Storage
- ✅ **User-scoped**: Each user's config is isolated by userId
- ✅ **No PII**: Only field names and preferences stored
- ✅ **Client-side**: No server transmission (yet)
- ✅ **Versioned**: Storage key includes version (`v1`)

### Input Validation
- ✅ All imported configs validated before applying
- ✅ JSON paths sanitized (no eval or dangerous code)
- ✅ File uploads restricted to `.json` extension
- ✅ Config schema strictly typed (TypeScript)

### XSS Prevention
- ✅ All user input escaped (React does this by default)
- ✅ JSON paths never executed as code
- ✅ Custom labels displayed as text, not HTML

---

## 📊 State Management

### React State (Component)
```tsx
// Local state in page.tsx
const [showColumnManager, setShowColumnManager] = useState(false)
```

### Hook State (useJsonColumns)
```tsx
// Managed by useColumnPersistence
const [config, setConfig] = useState<ColumnConfig>(...)
```

### Persisted State (localStorage)
```tsx
// Synchronized automatically
localStorage.setItem(key, JSON.stringify(value))
```

### Derived State (useMemo)
```tsx
// Computed from config
const columns = useMemo(() => generateColumns(...), [config])
```

---

## 🚀 Performance Optimizations

1. **Lazy Modal**: ColumnManager only renders when `isOpen={true}`
2. **Memoized Columns**: `useMemo` prevents unnecessary regeneration
3. **Debounced Search**: Search input debounced in ColumnManager
4. **Virtualization Ready**: Can add react-window for 1000+ fields (future)
5. **Chunked Storage**: Separate localStorage keys reduce write overhead
6. **Validation Caching**: Config validation result cached during session

---

## 🧪 Testing Strategy

### Unit Tests (Future)
- `getValueFromPath()` with various JSON structures
- `formatValue()` for each type
- `validateColumnConfig()` with valid/invalid configs
- `deduplicateFields()` with duplicate keys

### Integration Tests (Future)
- Full save → reload → verify cycle
- Export → import → verify equivalence
- Quick toggle → verify table updates
- Reset → verify defaults restored

### Manual Testing (Current)
- See `FEATURE_SUMMARY.md` for checklist

---

## 🐛 Error Handling

### localStorage Errors
```tsx
try {
  localStorage.setItem(key, value)
} catch (error) {
  if (error.name === 'QuotaExceededError') {
    // Clear old versions
    clearOldStorageKeys()
    // Retry
  }
}
```

### Import Errors
```tsx
try {
  const config = await importColumnConfig(file)
} catch (error) {
  setImportError(error.message)  // Show to user
  return
}
```

### Missing JSON Paths
```tsx
const value = getValueFromPath(order, path)
if (value === undefined) {
  return <span>N/A</span>  // Graceful fallback
}
```

---

## 📈 Future Architecture (Phase 2)

```
┌─────────────────────────────────────────────────────────────────┐
│                        Backend API (NEW)                         │
│  ┌────────────────────────────────────────────────────────────┐ │
│  │  POST /api/users/{userId}/column-configs                   │ │
│  │  GET  /api/users/{userId}/column-configs                   │ │
│  │  PUT  /api/users/{userId}/column-configs                   │ │
│  │  GET  /api/teams/{teamId}/column-templates                 │ │
│  └────────────────────────────────────────────────────────────┘ │
└─────────────────────────────────────────────────────────────────┘
                              ↕
┌─────────────────────────────────────────────────────────────────┐
│                  useColumnPersistence (Enhanced)                 │
│  ┌────────────────────────────────────────────────────────────┐ │
│  │  Hybrid Storage:                                            │ │
│  │    1. Try server sync                                       │ │
│  │    2. Fallback to localStorage                             │ │
│  │    3. Conflict resolution                                  │ │
│  └────────────────────────────────────────────────────────────┘ │
└─────────────────────────────────────────────────────────────────┘
```

---

**Last Updated**: October 10, 2025  
**Version**: 1.0.0  
**Complexity**: Medium  
**Lines of Code**: ~2,000

