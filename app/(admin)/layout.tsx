'use client'

import React, { useEffect, useRef } from 'react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { Navbar } from '@/components/navbar'
import { Sidebar } from '@/components/sidebar'
import { TabBar } from '@/components/tabbar'
import { useAppStore } from '@/lib/store'
import { usePathname } from 'next/navigation'

// Create a client
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 5 * 60 * 1000, // 5 minutes
      gcTime: 10 * 60 * 1000, // 10 minutes
    },
  },
})

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const { ensureDashboardTab } = useAppStore()
  const pathname = usePathname()
  const mainRef = useRef<HTMLDivElement>(null)
  const scrollPositionsRef = useRef<Map<string, number>>(new Map())
  const prevPathRef = useRef<string | null>(null)
  const tabContentCacheRef = useRef<Map<string, React.ReactNode>>(new Map())

  useEffect(() => {
    // Ensure Dashboard tab is always present
    ensureDashboardTab()
  }, [ensureDashboardTab])

  // Track scroll position per path (tab)
  useEffect(() => {
    const container = mainRef.current
    if (!container) return

    const handleScroll = () => {
      scrollPositionsRef.current.set(pathname, container.scrollTop)
    }

    // Restore when navigating to a path we've seen
    const saved = scrollPositionsRef.current.get(pathname)
    if (typeof saved === 'number') {
      // Defer to next frame to ensure content is rendered
      requestAnimationFrame(() => {
        if (mainRef.current) {
          mainRef.current.scrollTop = saved
        }
      })
    }

    container.addEventListener('scroll', handleScroll, { passive: true } as any)
    return () => {
      container.removeEventListener('scroll', handleScroll as any)
    }
  }, [pathname])

  // Cache tab content per route so components stay mounted
  useEffect(() => {
    // Save current route's children into cache (only set once per path)
    if (!tabContentCacheRef.current.has(pathname)) {
      tabContentCacheRef.current.set(pathname, children)
    }
  }, [pathname, children])

  return (
    <QueryClientProvider client={queryClient}>
      <div className="flex h-full">
        {/* Sidebar */}
        <Sidebar />
        
        {/* Main Content */}
        <div className="flex flex-1 flex-col overflow-hidden">
          {/* Navbar */}
          <Navbar />
          
          {/* Tab Bar */}
          <TabBar />
          
          {/* Page Content */}
          <main ref={mainRef} className="flex-1 overflow-auto bg-secondary-50 p-6 dark:bg-secondary-900">
            {Array.from(tabContentCacheRef.current.entries()).map(([path, node]) => (
              <div
                key={path}
                style={{ display: pathname === path ? 'block' : 'none' }}
              >
                {node}
              </div>
            ))}
            {!tabContentCacheRef.current.has(pathname) && (
              <div key={pathname} style={{ display: 'block' }}>
                {children}
              </div>
            )}
          </main>
        </div>
      </div>
    </QueryClientProvider>
  )
} 