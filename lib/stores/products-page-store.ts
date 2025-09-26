"use client";

import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";
import { sessionStorageSafe } from "../persist-storage";

// Shape of all persisted UI & table state for the Products page.
export type ProductsPageState = {
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
  setSorting: (s: ProductsPageState["sorting"]) => void;
  setColumnFilters: (f: ProductsPageState["columnFilters"]) => void;
  setGlobalFilter: (v: string) => void;
  setMoreActionsOpen: (v: boolean) => void;
  setSelectedRowIds: (ids: string[]) => void;
  setScrollY: (y: number) => void;
  reset: () => void;
};

// IMPORTANT: unique storage key per route to avoid clashes.
const STORAGE_KEY = "page:/apps/shopify/products";

export const useProductsPageStore = create<ProductsPageState>()(
  persist(
    (set) => ({
      pageIndex: 0,
      pageSize: 25,
      sorting: [],
      columnFilters: {},
      globalFilter: "",
      moreActionsOpen: false,
      selectedRowIds: [],
      scrollY: 0,

      setPageIndex: (n) => set({ pageIndex: n }),
      setPageSize: (n) => set({ pageSize: n }),
      setSorting: (s) => set({ sorting: s }),
      setColumnFilters: (f) => set({ columnFilters: f }),
      setGlobalFilter: (v) => set({ globalFilter: v }),
      setMoreActionsOpen: (v) => set({ moreActionsOpen: v }),
      setSelectedRowIds: (ids) => set({ selectedRowIds: ids }),
      setScrollY: (y) => set({ scrollY: y }),

      reset: () =>
        set({
          pageIndex: 0,
          pageSize: 25,
          sorting: [],
          columnFilters: {},
          globalFilter: "",
          moreActionsOpen: false,
          selectedRowIds: [],
          scrollY: 0,
        }),
    }),
    {
      name: STORAGE_KEY,
      version: 1,
      storage: createJSONStorage(() => sessionStorageSafe),
      // Store only lightweight, serializable state
      partialize: (state) => ({
        pageIndex: state.pageIndex,
        pageSize: state.pageSize,
        sorting: state.sorting,
        columnFilters: state.columnFilters,
        globalFilter: state.globalFilter,
        moreActionsOpen: state.moreActionsOpen,
        selectedRowIds: state.selectedRowIds,
        scrollY: state.scrollY,
      }),
    }
  )
);
