'use client'

import { useState, useEffect, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { 
  Bell, 
  User, 
  ChevronDown,
  Sun,
  Moon,
  LogOut
} from 'lucide-react'
import { useAppStore } from '@/lib/store'
import { useNotificationStore } from '@/lib/notificationStore'
import { cn } from '@/lib/utils'
import { Logo } from './Logo'
import { NotificationDropdown } from './NotificationDropdown'
import { useHydration } from '@/hooks/useHydration'

export function Navbar() {
  const router = useRouter()
  const { theme, setTheme, currentUser, setCurrentUser } = useAppStore()
  const { 
    notifications, 
    markAsRead, 
    markAllAsRead, 
    deleteNotification, 
    clearAll 
  } = useNotificationStore()
  const [showProfileDropdown, setShowProfileDropdown] = useState(false)
  const profileDropdownRef = useRef<HTMLDivElement>(null)
  const isHydrated = useHydration()

  // Toggle between light and dark themes
  const toggleTheme = () => {
    setTheme(theme === 'light' ? 'dark' : 'light')
  }

  // Handle profile navigation
  const handleProfileClick = () => {
    setShowProfileDropdown(false)
    router.push('/profile')
  }

  // Handle logout
  const handleLogout = () => {
    // Clear all authentication tokens
    localStorage.removeItem('access_token')
    localStorage.removeItem('id_token')
    localStorage.removeItem('refresh_token')
    localStorage.removeItem('token_expires')
    
    // Clear authentication cookie
    document.cookie = 'auth=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT'
    
    // Clear current user from store
    setCurrentUser(null)
    
    // Close dropdown
    setShowProfileDropdown(false)
    
    // Redirect to auth page
    router.push('/auth')
  }

  // Close dropdowns when clicking outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (profileDropdownRef.current && !profileDropdownRef.current.contains(event.target as Node)) {
        setShowProfileDropdown(false)
      }
    }

    document.addEventListener('mousedown', handleClickOutside)
    return () => {
      document.removeEventListener('mousedown', handleClickOutside)
    }
  }, [])

  return (
    <nav className="flex h-16 items-center justify-between border-b border-secondary-200 bg-white/95 backdrop-blur-sm px-6 dark:border-secondary-700 dark:bg-secondary-800/95 shadow-sm relative z-50">
      {/* Brand */}
      <div className="flex items-center space-x-3">
        <div className="transition-all duration-300 hover:scale-105">
          <Logo size="lg" />
        </div>
        <div className="flex items-center space-x-2">
          <span className="text-lg font-semibold text-secondary-700 dark:text-secondary-300 transition-all duration-300 hover:text-primary-600 dark:hover:text-primary-400">Admin</span>
        </div>
      </div>

      {/* Right side icons */}
      <div className="flex items-center space-x-4">
        {/* Notifications */}
        <NotificationDropdown
          notifications={notifications}
          onMarkAsRead={markAsRead}
          onMarkAllAsRead={markAllAsRead}
          onDelete={deleteNotification}
          onClearAll={clearAll}
        />

        {/* Theme Toggle */}
        <button
          onClick={toggleTheme}
          className="group rounded-lg p-2 text-yellow-600 hover:bg-yellow-100 hover:text-yellow-700 dark:text-yellow-400 dark:hover:bg-yellow-900/20 dark:hover:text-yellow-300 transition-all duration-300 hover:scale-110 hover:rotate-12 hover:shadow-lg hover:shadow-yellow-500/25"
          title={theme === 'light' ? 'Switch to dark mode' : 'Switch to light mode'}
        >
          {theme === 'light' ? (
            <Moon className="h-5 w-5 transition-all duration-300 group-hover:scale-110" />
          ) : (
            <Sun className="h-5 w-5 transition-all duration-300 group-hover:scale-110 group-hover:rotate-45" />
          )}
        </button>

        {/* Profile Dropdown */}
        <div className="relative z-[99999]" ref={profileDropdownRef}>
          <button
            onClick={() => setShowProfileDropdown(!showProfileDropdown)}
            className="group flex items-center space-x-2 rounded-lg p-2 text-blue-600 hover:bg-blue-100 hover:text-blue-700 dark:text-blue-400 dark:hover:bg-blue-900/20 dark:hover:text-blue-300 transition-all duration-300 hover:scale-105 hover:shadow-lg hover:shadow-blue-500/25"
          >
            <div className="flex h-8 w-8 items-center justify-center rounded-full bg-gradient-to-br from-blue-100 to-blue-200 text-sm font-medium text-blue-700 dark:from-blue-900 dark:to-blue-800 dark:text-blue-300 shadow-sm transition-all duration-300 group-hover:scale-110 group-hover:rotate-3">
              {!isHydrated ? '•' : (currentUser?.name?.charAt(0)?.toUpperCase() || 'U')}
            </div>
            <ChevronDown className="h-4 w-4 transition-all duration-300 group-hover:rotate-180" />
          </button>

          {showProfileDropdown && (
            <div className="profile-dropdown-fix w-56 rounded-lg border border-secondary-200 bg-white/95 backdrop-blur-sm py-3 shadow-xl dark:border-secondary-700 dark:bg-secondary-800/95 animate-fade-in">
              <div className="px-4 py-2 text-xs font-medium text-secondary-500 dark:text-secondary-400 uppercase tracking-wide">
                Signed in as
              </div>
              <div className="px-4 py-1 text-sm font-semibold text-secondary-900 dark:text-secondary-100">
                {!isHydrated ? '...' : (currentUser?.name || 'Admin User')}
              </div>
              <div className="px-4 py-1 text-xs text-secondary-500 dark:text-secondary-400">
                {!isHydrated ? '...' : (currentUser?.email || 'admin@inkhub.com')}
              </div>
              <div className="my-3 border-t border-secondary-200 dark:border-secondary-700" />
              <button 
                onClick={handleProfileClick}
                className="group flex w-full items-center space-x-3 px-4 py-2.5 text-sm text-blue-600 hover:bg-blue-50 dark:text-blue-400 dark:hover:bg-blue-900/20 transition-all duration-300 hover:translate-x-1"
              >
                <User className="h-4 w-4 transition-all duration-300 group-hover:scale-110 group-hover:rotate-12" />
                <span>Profile</span>
              </button>
              <button 
                onClick={handleLogout}
                className="group flex w-full items-center space-x-3 px-4 py-2.5 text-sm text-red-600 hover:bg-red-50 dark:text-red-400 dark:hover:bg-red-900/20 transition-all duration-300 hover:translate-x-1"
              >
                <LogOut className="h-4 w-4 transition-all duration-300 group-hover:scale-110 group-hover:rotate-12" />
                <span>Sign out</span>
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Overlay to close dropdowns */}
      {showProfileDropdown && (
        <div
          className="fixed inset-0 z-[99998]"
          onClick={() => {
            setShowProfileDropdown(false)
          }}
        />
      )}
    </nav>
  )
} 