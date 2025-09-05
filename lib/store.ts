import { create } from 'zustand'
import { persist } from 'zustand/middleware'

export interface Tab {
  id: string
  title: string
  path: string
  pinned: boolean
  closable: boolean
}

// Product data caching interface
export interface ProductDataCache {
  products: any[]
  chunkData: { [key: string]: any[] }
  chunkKeys: string[]
  totalProducts: number
  lastFetched: number
  isDataLoaded: boolean
  error: string | null
  cacheKey: string // Unique identifier for cache invalidation
}

export interface User {
  id: string
  name: string
  email: string
  role: 'admin' | 'editor' | 'viewer'
  permissions: {
    shopify: {
      orders: string[]
      products: string[]
    }
    pinterest: {
      pins: string[]
      boards: string[]
    }
    designLibrary: {
      designs: string[]
    }
  }
}

interface AppState {
  // Theme
  theme: 'light' | 'dark'
  setTheme: (theme: 'light' | 'dark') => void
  
  // Sidebar
  sidebarCollapsed: boolean
  toggleSidebar: () => void
  
  // Tabs
  tabs: Tab[]
  activeTabId: string | null
  addTab: (tab: Omit<Tab, 'id'>) => void
  removeTab: (id: string) => void
  setActiveTab: (id: string) => void
  toggleTabPin: (id: string) => void
  renameTab: (id: string, newTitle: string) => void
  duplicateTab: (id: string) => void
  ensureDashboardTab: () => void
  clearStorage: () => void

  // Persisted page index for Orders (pagination)
  ordersPage: number
  setOrdersPage: (page: number) => void

  // Persisted scroll position for Orders page
  ordersScroll: number
  setOrdersScroll: (y: number) => void

  // Persisted page index for Products (pagination)
  productsPage: number
  setProductsPage: (page: number) => void

  
  // User management
  users: User[]
  currentUser: User | null
  addUser: (user: Omit<User, 'id'>) => void
  updateUser: (id: string, updates: Partial<User>) => void
  deleteUser: (id: string) => void
  setCurrentUser: (user: User | null) => void
}

export const useAppStore = create<AppState>()(
  persist(
    (set, get) => ({
      // Theme
      theme: 'light',
      setTheme: (theme) => set({ theme }),
      
      // Sidebar
      sidebarCollapsed: false,
      toggleSidebar: () => set((state) => ({ sidebarCollapsed: !state.sidebarCollapsed })),
      
      // Tabs
      tabs: [],
      activeTabId: null,
      addTab: (tabData) => {
        // Special handling for Dashboard tab
        if (tabData.path === '/dashboard') {
          const dashboardTab = get().tabs.find(tab => tab.path === '/dashboard')
          if (dashboardTab) {
            // If dashboard tab exists, just set it as active
            set({ activeTabId: dashboardTab.id })
            return
          } else {
            // Create dashboard tab with special properties
            const timestamp = Date.now()
            const randomSuffix = Math.random().toString(36).substring(2, 8)
            const id = `/dashboard-${timestamp}-${randomSuffix}`
            const dashboardTab: Tab = {
              id,
              title: 'Dashboard',
              path: '/dashboard',
              pinned: false, // Dashboard cannot be pinned
              closable: false, // Dashboard cannot be closed
            }
            set((state) => ({
              tabs: [dashboardTab, ...state.tabs], // Dashboard always first
              activeTabId: id,
            }))
            return
          }
        }

        // Check for existing tab with same path and title
        const existingTab = get().tabs.find(tab => 
          tab.path === tabData.path && tab.title === tabData.title
        )
        if (existingTab) {
          // If tab already exists, just set it as active
          set({ activeTabId: existingTab.id })
          return
        }
        
        // Generate unique ID with better uniqueness
        const timestamp = Date.now()
        const randomSuffix = Math.random().toString(36).substring(2, 8)
        const id = `${tabData.path}-${timestamp}-${randomSuffix}`
        const newTab: Tab = { ...tabData, id }
        set((state) => ({
          tabs: [...state.tabs, newTab],
          activeTabId: id,
        }))
      },
      removeTab: (id) => {
        const tabToRemove = get().tabs.find(tab => tab.id === id)
        
        // Prevent closing Dashboard tab
        if (tabToRemove?.path === '/dashboard') {
          return
        }
        
        set((state) => {
          const newTabs = state.tabs.filter((tab) => tab.id !== id)
          
          // If we're closing the active tab, find the next active tab
          let newActiveTabId = state.activeTabId
          if (state.activeTabId === id) {
            if (newTabs.length > 0) {
              // Try to find the next tab in the same position, or the first available
              const currentIndex = state.tabs.findIndex(tab => tab.id === id)
              const nextTab = newTabs[currentIndex] || newTabs[0]
              newActiveTabId = nextTab.id
            } else {
              // If no tabs left, set to null (will be handled by component)
              newActiveTabId = null
            }
          }
          
          return {
            tabs: newTabs,
            activeTabId: newActiveTabId,
          }
        })
      },
      setActiveTab: (id) => set({ activeTabId: id }),
      toggleTabPin: (id) => {
        const tab = get().tabs.find(t => t.id === id)
        
        // Prevent pinning/unpinning Dashboard tab
        if (tab?.path === '/dashboard') {
          return
        }
        
        set((state) => ({
          tabs: state.tabs.map((tab) =>
            tab.id === id ? { ...tab, pinned: !tab.pinned } : tab
          ),
        }))
      },
      renameTab: (id, newTitle) => {
        // Ensure title is always valid
        const validatedTitle = newTitle && newTitle.trim() ? newTitle.trim() : 'Untitled Tab'
        
        set((state) => ({
          tabs: state.tabs.map((tab) =>
            tab.id === id ? { ...tab, title: validatedTitle } : tab
          ),
        }))
      },
      duplicateTab: (id) => {
        const tab = get().tabs.find(t => t.id === id)
        if (tab) {
          const newId = `${tab.path}-${Date.now()}`
          const newTab: Tab = {
            ...tab,
            id: newId,
            title: `${tab.title} (Copy)`,
            pinned: false
          }
          set((state) => ({
            tabs: [...state.tabs, newTab],
            activeTabId: newId,
          }))
        }
      },
      
      // Orders pagination persistence
      ordersPage: 1,
      setOrdersPage: (page) => set({ ordersPage: page }),

      // Orders scroll persistence
      ordersScroll: 0,
      setOrdersScroll: (y) => set({ ordersScroll: y }),

      // Products pagination persistence
      productsPage: 1,
      setProductsPage: (page) => set({ productsPage: page }),

  
      
      // User management
      users: [
        {
          id: '1',
          name: 'Admin User',
          email: 'admin@inkhub.com',
          role: 'admin',
          permissions: {
            shopify: {
              orders: ['view', 'create', 'edit', 'delete'],
              products: ['view', 'create', 'edit', 'delete'],
            },
            pinterest: {
              pins: ['view', 'create', 'edit', 'delete'],
              boards: ['view', 'create', 'edit', 'delete'],
            },
            designLibrary: {
              designs: ['view', 'create', 'edit', 'delete'],
            },
          },
        },
      ],
      currentUser: null,
      addUser: (userData) => {
        const id = `user-${Date.now()}`
        const newUser: User = { ...userData, id }
        set((state) => ({
          users: [...state.users, newUser],
        }))
      },
      updateUser: (id, updates) => {
        set((state) => ({
          users: state.users.map((user) =>
            user.id === id ? { ...user, ...updates } : user
          ),
        }))
      },
      deleteUser: (id) => {
        set((state) => ({
          users: state.users.filter((user) => user.id !== id),
        }))
      },
      setCurrentUser: (user) => set({ currentUser: user }),
      
      // Ensure Dashboard tab is always present
      ensureDashboardTab: () => {
        const state = get()
        const dashboardTab = state.tabs.find(tab => tab.path === '/dashboard')
        
        if (!dashboardTab) {
          const timestamp = Date.now()
          const randomSuffix = Math.random().toString(36).substring(2, 8)
          const id = `/dashboard-${timestamp}-${randomSuffix}`
          const newDashboardTab: Tab = {
            id,
            title: 'Dashboard',
            path: '/dashboard',
            pinned: false,
            closable: false,
          }
          set({
            tabs: [newDashboardTab, ...state.tabs],
            activeTabId: state.activeTabId || id,
          })
        }
      },
      
      // Clear localStorage for testing
      clearStorage: () => {
        localStorage.removeItem('inkhub-admin-storage')
        set({ tabs: [], activeTabId: null })
      },
    }),
    {
      name: 'inkhub-admin-storage',
      partialize: (state) => ({
        theme: state.theme,
        sidebarCollapsed: state.sidebarCollapsed,
        tabs: state.tabs, // Save all tabs, not just pinned ones
        users: state.users,
        ordersPage: state.ordersPage,
        ordersScroll: state.ordersScroll,
        productsPage: state.productsPage,
      }),
    }
  )
) 