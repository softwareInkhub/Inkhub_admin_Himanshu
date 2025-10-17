"use client";

import { useEffect, useRef } from "react";
import { create } from "zustand";
import { persist, createJSONStorage, subscribeWithSelector, devtools } from "zustand/middleware";
import { immer } from "zustand/middleware/immer";
import { z } from "zod";
import { sessionStorageSafe } from "../persist-storage";

// ============================================================================
// TYPES & SCHEMAS
// ============================================================================

/**
 * Saved View - represents a complete filter/sort/search configuration
 * that users can save and restore later
 */
export type SavedView = {
  id: string;
  name: string;
  description?: string;
  createdAt: string;
  updatedAt: string;
  // Snapshot of the state when view was saved
  filters: {
    globalFilter: string;
    columnFilters: Record<string, unknown>;
    sorting: { id: string; desc: boolean }[];
    activeFilter?: string;
  };
};

/**
 * Complete Products Page State
 * This is the in-memory state shape (before serialization)
 */
export type ProductsPageState = {
  // === Table State ===
  pageIndex: number;                                    // 0-based page index
  pageSize: number;                                     // Items per page
  sorting: { id: string; desc: boolean }[];            // Sort configuration
  columnFilters: Record<string, unknown>;               // Column-level filters
  globalFilter: string;                                 // Search query

  // === UI State ===
  moreActionsOpen: boolean;                             // Dropdown state
  selectedRowIds: Set<string>;                          // Selected products (Set for O(1) lookup)
  scrollY: number;                                      // Scroll position for restoration

  // === Saved Views ===
  views: Record<string, SavedView>;                     // Saved filter configurations
  activeViewId: string | null;                          // Currently active saved view

  // === Derived State ===
  hasActiveFilters: boolean;                            // Computed: true if any filters active

  // === Actions ===
  // Page actions
  setPageIndex: (index: number) => void;
  setPageSize: (size: number) => void;
  goToPage: (page: number) => void;                    // Helper: 1-based page navigation
  nextPage: () => void;
  prevPage: () => void;

  // Sorting actions
  setSorting: (sorting: ProductsPageState["sorting"]) => void;
  toggleSort: (columnId: string) => void;               // Toggle: asc → desc → none
  clearSorting: () => void;

  // Filter actions
  setColumnFilters: (filters: ProductsPageState["columnFilters"]) => void;
  setColumnFilter: (column: string, value: unknown) => void; // Set single filter
  removeColumnFilter: (column: string) => void;          // Remove single filter
  clearColumnFilters: () => void;
  setGlobalFilter: (filter: string) => void;
  clearGlobalFilter: () => void;
  clearAllFilters: () => void;                          // Clear all filters + search

  // Selection actions
  setSelectedRowIds: (ids: Set<string> | string[]) => void;
  toggleRow: (id: string) => void;                      // Toggle single row selection
  selectAll: (ids: string[]) => void;
  clearSelection: () => void;

  // UI actions
  setMoreActionsOpen: (open: boolean) => void;
  setScrollY: (y: number) => void;

  // Saved Views actions
  saveView: (name: string, description?: string) => void;
  loadView: (viewId: string) => void;
  deleteView: (viewId: string) => void;
  updateView: (viewId: string, updates: Partial<SavedView>) => void;
  setActiveView: (viewId: string | null) => void;

  // Utility actions
  reset: () => void;                                     // Reset to defaults
  resetView: () => void;                                 // Reset filters/search only
};

// ============================================================================
// ZOD SCHEMAS FOR VALIDATION
// ============================================================================

/**
 * Schema for persisted state validation
 * Ensures data integrity when loading from storage
 */
const SortingSchema = z.object({
  id: z.string(),
  desc: z.boolean(),
});

const SavedViewSchema = z.object({
  id: z.string(),
  name: z.string(),
  description: z.string().optional(),
  createdAt: z.string(),
  updatedAt: z.string(),
  filters: z.object({
    globalFilter: z.string(),
    columnFilters: z.record(z.unknown()),
    sorting: z.array(SortingSchema),
    activeFilter: z.string().optional(),
  }),
});

const PersistedStateSchema = z.object({
  pageIndex: z.number().min(0).default(0),
  pageSize: z.number().min(1).max(1000).default(25),
  sorting: z.array(SortingSchema).default([]),
  columnFilters: z.record(z.unknown()).default({}),
  globalFilter: z.string().default(""),
  moreActionsOpen: z.boolean().default(false),
  selectedRowIds: z.array(z.string()).default([]),          // Persisted as array
  scrollY: z.number().min(0).default(0),
  views: z.record(SavedViewSchema).default({}),
  activeViewId: z.string().nullable().default(null),
});

type PersistedState = z.infer<typeof PersistedStateSchema>;

// ============================================================================
// STORE CONFIGURATION
// ============================================================================

const STORAGE_KEY = "page:/apps/shopify/products";
const CURRENT_VERSION = 2; // Increment when making breaking changes

/**
 * Initial state - used for reset and defaults
 */
const initialState = {
      pageIndex: 0,
      pageSize: 25,
      sorting: [],
      columnFilters: {},
      globalFilter: "",
      moreActionsOpen: false,
  selectedRowIds: new Set<string>(),
      scrollY: 0,
  views: {},
  activeViewId: null,
  hasActiveFilters: false,
};

/**
 * Migration function for handling version upgrades
 * Ensures backward compatibility when store schema changes
 */
const migratePersistedState = (persistedState: any, version: number): PersistedState => {
  // Version 1 → Version 2 migration example
  if (version === 1) {
    console.log("📦 Migrating products store from v1 to v2");
    // Add new fields with defaults
    persistedState.views = persistedState.views || {};
    persistedState.activeViewId = persistedState.activeViewId || null;
  }

  // Validate with Zod and provide safe defaults for any missing/invalid fields
  try {
    return PersistedStateSchema.parse(persistedState);
  } catch (error) {
    console.warn("⚠️ Products store validation failed, using defaults:", error);
    // Return safe defaults if validation fails
    return PersistedStateSchema.parse({});
  }
};

/**
 * Helper to compute if any filters are active
 */
const computeHasActiveFilters = (state: Pick<ProductsPageState, "globalFilter" | "columnFilters" | "sorting">): boolean => {
  return !!(
    state.globalFilter.trim() ||
    Object.keys(state.columnFilters).length > 0 ||
    state.sorting.length > 0
  );
};

// ============================================================================
// ZUSTAND STORE
// ============================================================================

/**
 * Enhanced Products Page Store
 * 
 * Features:
 * - ✅ Versioned persistence with migrations
 * - ✅ Zod schema validation for data integrity
 * - ✅ Immer for immutable updates
 * - ✅ subscribeWithSelector for fine-grained subscriptions
 * - ✅ Redux DevTools integration
 * - ✅ Set-based selection for O(1) operations
 * - ✅ Saved Views feature
 * - ✅ SSR-safe with sessionStorage
 * 
 * Usage Examples:
 * 
 * // Subscribe to specific slices (prevents unnecessary re-renders)
 * const pageIndex = useProductsPageStore(state => state.pageIndex)
 * const sorting = useProductsPageStore(state => state.sorting, shallow)
 * 
 * // Call actions
 * const toggleSort = useProductsPageStore(state => state.toggleSort)
 * toggleSort('price')
 * 
 * // Access store outside React
 * useProductsPageStore.getState().setPageIndex(5)
 */
export const useProductsPageStore = create<ProductsPageState>()(
  // Apply middleware in order: devtools → subscribeWithSelector → persist → immer
  devtools(
    subscribeWithSelector(
      persist(
        immer((set, get) => ({
          // === Initial State ===
          ...initialState,

          // === Page Actions ===
          setPageIndex: (index: number) =>
            set(
              (state) => {
                state.pageIndex = Math.max(0, index);
              },
              false,
              "products/setPageIndex"
            ),

          setPageSize: (size: number) =>
            set(
              (state) => {
                state.pageSize = Math.max(1, Math.min(1000, size));
                state.pageIndex = 0; // Reset to first page
              },
              false,
              "products/setPageSize"
            ),

          goToPage: (page: number) =>
            set(
              (state) => {
                // Convert 1-based to 0-based
                state.pageIndex = Math.max(0, page - 1);
              },
              false,
              "products/goToPage"
            ),

          nextPage: () =>
            set(
              (state) => {
                state.pageIndex += 1;
              },
              false,
              "products/nextPage"
            ),

          prevPage: () =>
            set(
              (state) => {
                state.pageIndex = Math.max(0, state.pageIndex - 1);
              },
              false,
              "products/prevPage"
            ),

          // === Sorting Actions ===
          setSorting: (sorting) =>
            set(
              (state) => {
                state.sorting = sorting;
                state.hasActiveFilters = computeHasActiveFilters({
                  globalFilter: state.globalFilter,
                  columnFilters: state.columnFilters,
                  sorting: sorting,
                });
              },
              false,
              "products/setSorting"
            ),

          toggleSort: (columnId: string) =>
            set(
              (state) => {
                const existing = state.sorting.find((s) => s.id === columnId);
                if (!existing) {
                  // No sort → ascending
                  state.sorting = [{ id: columnId, desc: false }];
                } else if (!existing.desc) {
                  // Ascending → descending
                  state.sorting = [{ id: columnId, desc: true }];
                } else {
                  // Descending → remove sort
                  state.sorting = [];
                }
                state.hasActiveFilters = computeHasActiveFilters(state);
              },
              false,
              "products/toggleSort"
            ),

          clearSorting: () =>
            set(
              (state) => {
                state.sorting = [];
                state.hasActiveFilters = computeHasActiveFilters(state);
              },
              false,
              "products/clearSorting"
            ),

          // === Filter Actions ===
          setColumnFilters: (filters) =>
            set(
              (state) => {
                state.columnFilters = filters;
                state.pageIndex = 0; // Reset to first page
                state.hasActiveFilters = computeHasActiveFilters({
                  globalFilter: state.globalFilter,
                  columnFilters: filters,
                  sorting: state.sorting,
                });
              },
              false,
              "products/setColumnFilters"
            ),

          setColumnFilter: (column: string, value: unknown) =>
            set(
              (state) => {
                if (value === undefined || value === null || value === "") {
                  // Remove filter if value is empty
                  delete state.columnFilters[column];
                } else {
                  state.columnFilters[column] = value;
                }
                state.pageIndex = 0; // Reset to first page
                state.hasActiveFilters = computeHasActiveFilters(state);
              },
              false,
              `products/setColumnFilter:${column}`
            ),

          removeColumnFilter: (column: string) =>
            set(
              (state) => {
                delete state.columnFilters[column];
                state.hasActiveFilters = computeHasActiveFilters(state);
              },
              false,
              `products/removeColumnFilter:${column}`
            ),

          clearColumnFilters: () =>
            set(
              (state) => {
                state.columnFilters = {};
                state.hasActiveFilters = computeHasActiveFilters(state);
              },
              false,
              "products/clearColumnFilters"
            ),

          setGlobalFilter: (filter: string) =>
            set(
              (state) => {
                state.globalFilter = filter;
                state.pageIndex = 0; // Reset to first page when searching
                state.hasActiveFilters = computeHasActiveFilters({
                  globalFilter: filter,
                  columnFilters: state.columnFilters,
                  sorting: state.sorting,
                });
              },
              false,
              "products/setGlobalFilter"
            ),

          clearGlobalFilter: () =>
            set(
              (state) => {
                state.globalFilter = "";
                state.hasActiveFilters = computeHasActiveFilters(state);
              },
              false,
              "products/clearGlobalFilter"
            ),

          clearAllFilters: () =>
            set(
              (state) => {
                state.globalFilter = "";
                state.columnFilters = {};
                state.sorting = [];
                state.pageIndex = 0;
                state.hasActiveFilters = false;
              },
              false,
              "products/clearAllFilters"
            ),

          // === Selection Actions ===
          setSelectedRowIds: (ids: Set<string> | string[]) =>
            set(
              (state) => {
                state.selectedRowIds = Array.isArray(ids) ? new Set(ids) : ids;
              },
              false,
              "products/setSelectedRowIds"
            ),

          toggleRow: (id: string) =>
            set(
              (state) => {
                if (state.selectedRowIds.has(id)) {
                  state.selectedRowIds.delete(id);
                } else {
                  state.selectedRowIds.add(id);
                }
              },
              false,
              `products/toggleRow:${id.slice(0, 8)}`
            ),

          selectAll: (ids: string[]) =>
            set(
              (state) => {
                state.selectedRowIds = new Set(ids);
              },
              false,
              "products/selectAll"
            ),

          clearSelection: () =>
            set(
              (state) => {
                state.selectedRowIds = new Set();
              },
              false,
              "products/clearSelection"
            ),

          // === UI Actions ===
          setMoreActionsOpen: (open: boolean) =>
            set(
              (state) => {
                state.moreActionsOpen = open;
              },
              false,
              "products/setMoreActionsOpen"
            ),

          setScrollY: (y: number) =>
            set(
              (state) => {
                state.scrollY = Math.max(0, y);
              },
              false,
              "products/setScrollY"
            ),

          // === Saved Views Actions ===
          saveView: (name: string, description?: string) =>
            set(
              (state) => {
                const id = `view-${Date.now()}`;
                const now = new Date().toISOString();
                
                state.views[id] = {
                  id,
                  name,
                  description,
                  createdAt: now,
                  updatedAt: now,
                  filters: {
                    globalFilter: state.globalFilter,
                    columnFilters: { ...state.columnFilters },
                    sorting: [...state.sorting],
                  },
                };
                state.activeViewId = id;
              },
              false,
              `products/saveView:${name}`
            ),

          loadView: (viewId: string) =>
            set(
              (state) => {
                const view = state.views[viewId];
                if (!view) {
                  console.warn(`View ${viewId} not found`);
                  return;
                }

                // Restore the saved state
                state.globalFilter = view.filters.globalFilter;
                state.columnFilters = { ...view.filters.columnFilters };
                state.sorting = [...view.filters.sorting];
                state.pageIndex = 0; // Reset to first page
                state.activeViewId = viewId;
                state.hasActiveFilters = computeHasActiveFilters({
                  globalFilter: view.filters.globalFilter,
                  columnFilters: view.filters.columnFilters,
                  sorting: view.filters.sorting,
                });
              },
              false,
              `products/loadView:${viewId}`
            ),

          deleteView: (viewId: string) =>
            set(
              (state) => {
                delete state.views[viewId];
                if (state.activeViewId === viewId) {
                  state.activeViewId = null;
                }
              },
              false,
              `products/deleteView:${viewId}`
            ),

          updateView: (viewId: string, updates: Partial<SavedView>) =>
            set(
              (state) => {
                const view = state.views[viewId];
                if (!view) return;

                state.views[viewId] = {
                  ...view,
                  ...updates,
                  updatedAt: new Date().toISOString(),
                };
              },
              false,
              `products/updateView:${viewId}`
            ),

          setActiveView: (viewId: string | null) =>
            set(
              (state) => {
                state.activeViewId = viewId;
              },
              false,
              "products/setActiveView"
            ),

          // === Utility Actions ===
      reset: () =>
            set(
              (state) => {
                // Reset all state to initial values
                Object.assign(state, {
                  ...initialState,
                  selectedRowIds: new Set<string>(), // Recreate Set
                });
              },
              false,
              "products/reset"
            ),

          resetView: () =>
            set(
              (state) => {
                // Reset only filters and search, keep pagination/selection
                state.globalFilter = "";
                state.columnFilters = {};
                state.sorting = [];
                state.activeViewId = null;
                state.hasActiveFilters = false;
              },
              false,
              "products/resetView"
            ),
        })),
    {
      name: STORAGE_KEY,
          version: CURRENT_VERSION,
      storage: createJSONStorage(() => sessionStorageSafe),

          // Migration handler for version upgrades
          migrate: (persistedState: any, version: number) => {
            const migrated = migratePersistedState(persistedState, version);
            
            // Convert selectedRowIds array → Set after migration
            return {
              ...migrated,
              selectedRowIds: new Set(migrated.selectedRowIds || []),
            };
          },

          // Partialize: Only persist essential keys (exclude computed/transient state)
      partialize: (state) => ({
        pageIndex: state.pageIndex,
        pageSize: state.pageSize,
        sorting: state.sorting,
        columnFilters: state.columnFilters,
        globalFilter: state.globalFilter,
        moreActionsOpen: state.moreActionsOpen,
            selectedRowIds: Array.from(state.selectedRowIds), // Convert Set → Array for JSON
        scrollY: state.scrollY,
            views: state.views,
            activeViewId: state.activeViewId,
            // hasActiveFilters is NOT persisted (derived state)
          }),

          // onRehydrateStorage: Called after state is rehydrated from storage
          onRehydrateStorage: () => (state) => {
            if (state) {
              // Recompute derived state after hydration
              state.hasActiveFilters = computeHasActiveFilters(state);
              console.log("✅ Products store rehydrated from sessionStorage");
            }
          },
        }
      )
    ),
    {
      name: "ProductsPageStore", // Name for Redux DevTools
      enabled: process.env.NODE_ENV === "development", // Enable only in dev
    }
  )
);

// ============================================================================
// CUSTOM HOOKS
// ============================================================================

/**
 * Hook: useUrlSync
 * 
 * Two-way sync between Zustand store and URL params
 * - Reads URL params on mount and updates store
 * - Writes store changes to URL (debounced 200ms)
 * 
 * SSR-safe: Only runs on client-side
 * 
 * Usage:
 * ```tsx
 * function MyPage() {
 *   useUrlSync()
 *   // ... rest of component
 * }
 * ```
 */
export const useUrlSync = () => {
  const pageIndex = useProductsPageStore((state) => state.pageIndex);
  const pageSize = useProductsPageStore((state) => state.pageSize);
  const globalFilter = useProductsPageStore((state) => state.globalFilter);
  const setPageIndex = useProductsPageStore((state) => state.setPageIndex);
  const setPageSize = useProductsPageStore((state) => state.setPageSize);
  const setGlobalFilter = useProductsPageStore((state) => state.setGlobalFilter);
  
  const hasHydratedRef = useRef(false);
  const debounceTimeoutRef = useRef<NodeJS.Timeout>();

  // 1) Read URL params on mount and update store
  useEffect(() => {
    if (typeof window === "undefined") return; // SSR safety
    if (hasHydratedRef.current) return;
    hasHydratedRef.current = true;

    const params = new URLSearchParams(window.location.search);
    const p = params.get("p");
    const sz = params.get("sz");
    const s = params.get("s");

    if (p) setPageIndex(Number(p));
    if (sz) setPageSize(Number(sz));
    if (s) setGlobalFilter(s);
  }, [setPageIndex, setPageSize, setGlobalFilter]);

  // 2) Write store changes to URL (debounced 200ms)
  useEffect(() => {
    if (typeof window === "undefined") return; // SSR safety
    if (!hasHydratedRef.current) return;

    // Clear previous timeout
    if (debounceTimeoutRef.current) {
      clearTimeout(debounceTimeoutRef.current);
    }

    // Debounce URL updates by 200ms
    debounceTimeoutRef.current = setTimeout(() => {
      const params = new URLSearchParams(window.location.search);
      
      // Update params
      if (pageIndex > 0) {
        params.set("p", String(pageIndex));
      } else {
        params.delete("p");
      }

      if (pageSize !== 25) {
        params.set("sz", String(pageSize));
      } else {
        params.delete("sz");
      }

      if (globalFilter) {
        params.set("s", globalFilter);
      } else {
        params.delete("s");
      }

      // Update URL without reload
      const newUrl = `${window.location.pathname}?${params.toString()}`;
      window.history.replaceState(null, "", newUrl);
    }, 200);

    return () => {
      if (debounceTimeoutRef.current) {
        clearTimeout(debounceTimeoutRef.current);
      }
    };
  }, [pageIndex, pageSize, globalFilter]);
};

/**
 * Hook: useScrollPersistence
 * 
 * Automatically saves and restores scroll position
 * - Restores scroll on mount (from Zustand store)
 * - Saves scroll on unmount and visibility change (throttled 150ms)
 * 
 * SSR-safe: Only runs on client-side
 * 
 * Usage:
 * ```tsx
 * function MyPage() {
 *   useScrollPersistence()
 *   // ... rest of component
 * }
 * ```
 */
export const useScrollPersistence = () => {
  const scrollY = useProductsPageStore((state) => state.scrollY);
  const setScrollY = useProductsPageStore((state) => state.setScrollY);
  
  const throttleTimeoutRef = useRef<NodeJS.Timeout>();
  const lastSaveRef = useRef(0);

  // 1) Restore scroll position on mount
  useEffect(() => {
    if (typeof window === "undefined") return; // SSR safety
    
    if (scrollY > 0) {
      // Use instant behavior for seamless restoration
      window.scrollTo({ top: scrollY, behavior: "instant" as ScrollBehavior });
    }

    // Disable browser's default scroll restoration
    if ("scrollRestoration" in window.history) {
      window.history.scrollRestoration = "manual";
    }
  }, [scrollY]);

  // 2) Save scroll position (throttled 150ms)
  useEffect(() => {
    if (typeof window === "undefined") return; // SSR safety
    
    const saveScrollPosition = () => {
      const now = Date.now();
      
      // Throttle: only save if 150ms has passed since last save
      if (now - lastSaveRef.current < 150) {
        // Schedule save after throttle period
        if (throttleTimeoutRef.current) {
          clearTimeout(throttleTimeoutRef.current);
        }
        throttleTimeoutRef.current = setTimeout(() => {
          setScrollY(window.scrollY);
          lastSaveRef.current = Date.now();
        }, 150);
        return;
      }

      // Save immediately
      setScrollY(window.scrollY);
      lastSaveRef.current = now;
    };

    // Save on scroll (throttled)
    window.addEventListener("scroll", saveScrollPosition, { passive: true });
    
    // Save on page unload
    window.addEventListener("beforeunload", saveScrollPosition);
    
    // Save on visibility change (tab switch)
    const handleVisibilityChange = () => {
      if (document.visibilityState === "hidden") {
        saveScrollPosition();
      }
    };
    document.addEventListener("visibilitychange", handleVisibilityChange);

    return () => {
      // Save on unmount
      saveScrollPosition();
      
      // Cleanup
      window.removeEventListener("scroll", saveScrollPosition);
      window.removeEventListener("beforeunload", saveScrollPosition);
      document.removeEventListener("visibilitychange", handleVisibilityChange);
      
      if (throttleTimeoutRef.current) {
        clearTimeout(throttleTimeoutRef.current);
      }
    };
  }, [setScrollY]);
};

// ============================================================================
// SELECTORS (for reference)
// ============================================================================

/**
 * Example selectors for optimal re-render performance
 * 
 * Use these patterns in your components:
 * 
 * // Single value (automatically shallow compared)
 * const pageIndex = useProductsPageStore(state => state.pageIndex)
 * 
 * // Multiple values (use shallow comparison)
 * import { shallow } from 'zustand/shallow'
 * const { pageIndex, pageSize } = useProductsPageStore(
 *   state => ({ pageIndex: state.pageIndex, pageSize: state.pageSize }),
 *   shallow
 * )
 * 
 * // Action only (never re-renders)
 * const setPageIndex = useProductsPageStore(state => state.setPageIndex)
 * 
 * // Derived selector
 * const hasFilters = useProductsPageStore(state => state.hasActiveFilters)
 * 
 * // Subscribe outside React
 * useProductsPageStore.subscribe(
 *   state => state.pageIndex,
 *   (pageIndex) => console.log('Page changed to:', pageIndex)
 * )
 */

// ============================================================================
// UTILITY FUNCTIONS
// ============================================================================

/**
 * Get current state snapshot (outside React components)
 */
export const getProductsPageState = () => useProductsPageStore.getState();

/**
 * Subscribe to specific state changes (outside React components)
 */
export const subscribeToProductsPage = useProductsPageStore.subscribe;

/**
 * Reset store to initial state (useful for testing or logout)
 */
export const resetProductsPageStore = () => useProductsPageStore.getState().reset();
