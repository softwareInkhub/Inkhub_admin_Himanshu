# Persistent Route UI State Implementation

This implementation provides session-scoped state persistence for route UI components, ensuring that when users navigate away and return (or switch tabs), pages restore exactly as before with pagination, filters, sorting, global search, "More actions" panel state, selected rows, and scroll position.

## 🏗️ Architecture Overview

### Core Components

1. **Session Storage Helper** (`lib/persist-storage.ts`)
   - SSR-safe sessionStorage wrapper
   - Prevents hydration mismatches
   - Each browser tab maintains its own state

2. **Route-Scoped Stores** (`lib/stores/`)
   - Individual Zustand stores per route
   - Unique storage keys prevent conflicts
   - Lightweight, serializable state only

3. **URL State Sync** (`lib/url-state.ts`)
   - Optional URL parameter synchronization
   - Shareable links with minimal params (p, sz)
   - Router integration without scroll interference

4. **Persistent Layouts** (`app/(admin)/apps/shopify/layout.tsx`)
   - Prevents shell components from unmounting
   - Maintains common UI state across child routes

## 📁 File Structure

```
lib/
├── persist-storage.ts                    # SSR-safe sessionStorage wrapper
├── url-state.ts                         # URL parameter sync helper
└── stores/
    ├── orders-page-store.ts             # Orders page state management
    ├── products-page-store.ts           # Products page state management
    ├── design-library-page-store.ts     # Design Library page state management
    └── __tests__/
        ├── orders-page-store.test.ts    # Unit tests for orders store
        ├── products-page-store.test.ts  # Unit tests for products store
        └── design-library-page-store.test.ts # Unit tests for design library store

app/(admin)/apps/shopify/
├── layout.tsx                           # Persistent layout wrapper
└── orders/
    └── page-new.tsx                     # Example implementation with persistent state
```

## 🔧 Implementation Details

### Store State Structure

Each route store maintains the following state:

```typescript
type PageState = {
  // Table state
  pageIndex: number;
  pageSize: number;
  sorting: { id: string; desc: boolean }[];
  columnFilters: Record<string, unknown>;
  globalFilter: string;

  // UI state
  moreActionsOpen: boolean;
  selectedRowIds: string[];
  scrollY: number;

  // Actions
  setPageIndex: (n: number) => void;
  setPageSize: (n: number) => void;
  setSorting: (s: SortingState) => void;
  setColumnFilters: (f: ColumnFilters) => void;
  setGlobalFilter: (v: string) => void;
  setMoreActionsOpen: (v: boolean) => void;
  setSelectedRowIds: (ids: string[]) => void;
  setScrollY: (y: number) => void;
  reset: () => void;
}
```

### Storage Keys

Each route uses a unique storage key to prevent conflicts:

- Orders: `"page:/apps/shopify/orders"`
- Products: `"page:/apps/shopify/products"`
- Design Library: `"page:/design-library/designs"`

### Scroll Position Management

- **Restore**: Scroll position is restored after component mount
- **Save**: Scroll position is saved on:
  - Page unmount
  - Tab visibility change (hidden)
  - Before page unload

### URL Synchronization

Optional URL parameters for shareable links:
- `p`: Page index (0-based)
- `sz`: Page size

Example URL: `/apps/shopify/orders?p=3&sz=50`

## 🚀 Usage Example

### Basic Implementation

```typescript
"use client";

import { useEffect } from "react";
import { useOrdersPageStore } from "@/lib/stores/orders-page-store";
import { useUrlState } from "@/lib/url-state";

export default function OrdersPage() {
  const {
    pageIndex, pageSize, sorting, columnFilters, globalFilter,
    setPageIndex, setPageSize, setSorting, setColumnFilters, setGlobalFilter,
    moreActionsOpen, setMoreActionsOpen,
    scrollY, setScrollY,
  } = useOrdersPageStore();

  const { setParams } = useUrlState();

  // Hydrate from URL on first mount
  useEffect(() => {
    if (typeof window === "undefined") return;
    const sp = new URLSearchParams(window.location.search);
    const p = sp.get("p");
    const sz = sp.get("sz");
    if (p) setPageIndex(Number(p));
    if (sz) setPageSize(Number(sz));
    window.history.scrollRestoration = "manual";
  }, []);

  // Restore scroll position
  useEffect(() => {
    if (scrollY > 0) window.scrollTo({ top: scrollY, behavior: "instant" });
  }, [scrollY]);

  // Persist scroll on navigation
  useEffect(() => {
    const save = () => useOrdersPageStore.getState().setScrollY(window.scrollY);
    window.addEventListener("beforeunload", save);
    document.addEventListener("visibilitychange", () => {
      if (document.visibilityState === "hidden") save();
    });
    return () => {
      save();
      window.removeEventListener("beforeunload", save);
    };
  }, []);

  // Sync to URL
  useEffect(() => {
    setParams({ p: pageIndex, sz: pageSize });
  }, [pageIndex, pageSize, setParams]);

  return (
    <div>
      {/* Your page content */}
    </div>
  );
}
```

### TanStack Table Integration

```typescript
import { useReactTable, getCoreRowModel } from "@tanstack/react-table";

const table = useReactTable({
  data: filteredData,
  columns: yourColumns,
  state: {
    pagination: { pageIndex, pageSize },
    sorting,
    columnFilters: Object.entries(columnFilters).map(([id, value]) => ({ id, value })),
    globalFilter,
  },
  onPaginationChange: (updater) => {
    const prev = { pageIndex, pageSize };
    const next = typeof updater === "function" ? updater(prev) : updater;
    setPageIndex(next.pageIndex);
    setPageSize(next.pageSize);
  },
  onSortingChange: setSorting,
  onColumnFiltersChange: (updater) => {
    const prev = Object.entries(columnFilters).map(([id, value]) => ({ id, value }));
    const next = typeof updater === "function" ? updater(prev) : updater;
    const obj: Record<string, unknown> = {};
    next.forEach((f: any) => { obj[f.id] = f.value; });
    setColumnFilters(obj);
  },
  onGlobalFilterChange: setGlobalFilter,
  manualPagination: true,
  getCoreRowModel: getCoreRowModel(),
});
```

## ✅ Acceptance Criteria

### ✅ Implemented Features

- [x] **Session-scoped persistence**: Each browser tab maintains its own state
- [x] **Route-specific storage**: Unique storage keys prevent conflicts
- [x] **Complete state restoration**: Pagination, filters, sorting, search, UI state
- [x] **Scroll position persistence**: Restored on navigation return
- [x] **URL synchronization**: Shareable links with minimal parameters
- [x] **Persistent layouts**: Shell components don't unmount
- [x] **SSR safety**: No hydration mismatches
- [x] **TypeScript strict**: Full type safety
- [x] **Unit tests**: Comprehensive test coverage
- [x] **Production ready**: Clean, documented code

### ✅ Test Scenarios

1. **Navigation Test**: Navigate to Orders → change page to 3, set page size 50, add filter, open "More actions", scroll down → Navigate away → Return → All state restored

2. **Tab Isolation Test**: Open Orders in new browser tab → State doesn't leak between tabs

3. **Refresh Test**: Refresh Orders tab → State persists within same tab

4. **URL Test**: URL shows `?p=3&sz=50` and updates on pagination

## 🧪 Testing

Run the unit tests:

```bash
npm test -- lib/stores/__tests__/
```

Test coverage includes:
- Initial state verification
- Setter function behavior
- Reset functionality
- Multiple state updates
- View mode transitions (Design Library)

## 🔄 Adding New Routes

To add persistent state to a new route:

1. **Create a new store** in `lib/stores/`:
```typescript
const STORAGE_KEY = "page:/your/route/path";
export const useYourPageStore = create<YourPageState>()(
  persist(
    (set) => ({
      // Your state and actions
    }),
    {
      name: STORAGE_KEY,
      version: 1,
      storage: createJSONStorage(() => sessionStorageSafe),
      partialize: (state) => ({
        // Only serialize what you need
      }),
    }
  )
);
```

2. **Update your page component** to use the store
3. **Add unit tests** for the new store
4. **Create persistent layout** if needed

## 🎯 Performance Benefits

- **Instant state restoration**: No loading states for previously visited pages
- **Reduced API calls**: Cached data and filters reduce server load
- **Better UX**: Seamless navigation experience
- **Memory efficient**: Only lightweight, serializable state persisted

## 🔒 Security Considerations

- **No sensitive data**: Only UI state is persisted, no user data
- **Session scoped**: State doesn't persist across browser sessions
- **Route isolated**: No cross-route state leakage
- **SSR safe**: No client-server mismatches

## 📝 Notes

- **State size**: Keep persisted state minimal for performance
- **Serialization**: Only store serializable data
- **Version management**: Increment version when changing state structure
- **Migration**: Handle state migration for version updates if needed

This implementation provides a robust, production-ready solution for persistent route UI state that enhances user experience while maintaining clean architecture and performance.
