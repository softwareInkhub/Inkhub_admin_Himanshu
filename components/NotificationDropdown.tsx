'use client'

import { useState, useEffect, useRef } from 'react'
import { Bell, Check, X, AlertCircle, Info, CheckCircle } from 'lucide-react'
import { cn } from '@/lib/utils'

export interface Notification {
  id: string
  title: string
  message: string
  type: 'info' | 'success' | 'warning' | 'error'
  timestamp: Date | string
  read: boolean
  action?: {
    label: string
    onClick: () => void
  }
}

interface NotificationDropdownProps {
  notifications: Notification[]
  onMarkAsRead: (id: string) => void
  onMarkAllAsRead: () => void
  onDelete: (id: string) => void
  onClearAll: () => void
}

export function NotificationDropdown({
  notifications,
  onMarkAsRead,
  onMarkAllAsRead,
  onDelete,
  onClearAll
}: NotificationDropdownProps) {
  const [isOpen, setIsOpen] = useState(false)
  const dropdownRef = useRef<HTMLDivElement>(null)
  const unreadCount = notifications.filter(n => !n.read).length

  // Handle click outside to close dropdown
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false)
      }
    }

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside)
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside)
    }
  }, [isOpen])

  // Handle escape key to close dropdown
  useEffect(() => {
    const handleEscapeKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        setIsOpen(false)
      }
    }

    if (isOpen) {
      document.addEventListener('keydown', handleEscapeKey)
    }

    return () => {
      document.removeEventListener('keydown', handleEscapeKey)
    }
  }, [isOpen])

  const getNotificationIcon = (type: Notification['type']) => {
    switch (type) {
      case 'success':
        return <CheckCircle className="h-4 w-4 text-green-500" />
      case 'warning':
        return <AlertCircle className="h-4 w-4 text-yellow-500" />
      case 'error':
        return <AlertCircle className="h-4 w-4 text-red-500" />
      default:
        return <Info className="h-4 w-4 text-blue-500" />
    }
  }

  const getNotificationColor = (type: Notification['type']) => {
    switch (type) {
      case 'success':
        return 'border-l-green-500 bg-green-50 dark:bg-green-900/20'
      case 'warning':
        return 'border-l-yellow-500 bg-yellow-50 dark:bg-yellow-900/20'
      case 'error':
        return 'border-l-red-500 bg-red-50 dark:bg-red-900/20'
      default:
        return 'border-l-blue-500 bg-blue-50 dark:bg-blue-900/20'
    }
  }

  const formatTimestamp = (timestamp: Date | string) => {
    const now = new Date()
    // Handle both Date objects and string timestamps
    let timestampDate: Date
    try {
      timestampDate = timestamp instanceof Date ? timestamp : new Date(timestamp)
      // Check if the date is valid
      if (isNaN(timestampDate.getTime())) {
        return 'Unknown time'
      }
    } catch (error) {
      return 'Unknown time'
    }
    
    const diff = now.getTime() - timestampDate.getTime()
    const minutes = Math.floor(diff / 60000)
    const hours = Math.floor(diff / 3600000)
    const days = Math.floor(diff / 86400000)

    if (minutes < 1) return 'Just now'
    if (minutes < 60) return `${minutes}m ago`
    if (hours < 24) return `${hours}h ago`
    return `${days}d ago`
  }

  return (
    <div className="relative" ref={dropdownRef}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="group relative rounded-lg p-2 text-orange-600 hover:bg-orange-100 hover:text-orange-700 dark:text-orange-400 dark:hover:bg-orange-900/20 dark:hover:text-orange-300 transition-all duration-300 hover:scale-110 hover:rotate-6 hover:shadow-lg hover:shadow-orange-500/25"
        title="Notifications"
      >
        <Bell className="h-5 w-5 transition-all duration-300 group-hover:scale-110" />
        {unreadCount > 0 && (
          <span className="absolute -right-1 -top-1 flex h-4 w-4 items-center justify-center rounded-full bg-primary-500 text-xs text-white font-medium shadow-sm animate-pulse transition-all duration-300 group-hover:scale-125 group-hover:animate-bounce">
            {unreadCount > 99 ? '99+' : unreadCount}
          </span>
        )}
      </button>

      {isOpen && (
        <div className="absolute right-0 top-full mt-2 w-80 max-w-[calc(100vw-2rem)] sm:max-w-none rounded-lg border border-secondary-200 bg-white/95 backdrop-blur-sm py-3 shadow-xl dark:border-secondary-700 dark:bg-secondary-800/95 animate-fade-in z-[999999]">
          {/* Header */}
          <div className="flex items-center justify-between px-4 pb-2 border-b border-secondary-200 dark:border-secondary-700">
            <h3 className="text-sm font-semibold text-secondary-900 dark:text-secondary-100">
              Notifications
            </h3>
            <div className="flex items-center space-x-1">
              {unreadCount > 0 && (
                <button
                  onClick={onMarkAllAsRead}
                  className="text-xs text-primary-600 hover:text-primary-700 dark:text-primary-400 dark:hover:text-primary-300 transition-all duration-300 hover:scale-110 hover:translate-y-0.5"
                >
                  Mark all read
                </button>
              )}
              {notifications.length > 0 && (
                <button
                  onClick={onClearAll}
                  className="text-xs text-red-600 hover:text-red-700 dark:text-red-400 dark:hover:text-red-300 transition-all duration-300 hover:scale-110 hover:translate-y-0.5"
                >
                  Clear all
                </button>
              )}
            </div>
          </div>

          {/* Notifications List */}
          <div className="max-h-96 overflow-y-auto overflow-x-hidden">
            {notifications.length === 0 ? (
              <div className="px-4 py-8 text-center">
                <Bell className="h-8 w-8 text-secondary-400 mx-auto mb-2 transition-all duration-300 hover:scale-110 hover:rotate-12" />
                <p className="text-sm text-secondary-500 dark:text-secondary-400">
                  No notifications
                </p>
              </div>
            ) : (
              <div className="space-y-1">
                {notifications.map((notification, index) => (
                  <div
                    key={notification.id}
                    className={cn(
                      'group relative px-4 py-3 border-l-4 hover:bg-secondary-50 dark:hover:bg-secondary-700/50 transition-all duration-300 hover:translate-x-1 hover:shadow-md',
                      getNotificationColor(notification.type),
                      !notification.read && 'bg-secondary-50 dark:bg-secondary-700/30'
                    )}
                    style={{ animationDelay: `${index * 50}ms` }}
                  >
                    <div className="flex items-start space-x-3">
                      <div className="flex-shrink-0 mt-0.5 transition-all duration-300 group-hover:scale-110 group-hover:rotate-12">
                        {getNotificationIcon(notification.type)}
                      </div>
                      <div className="flex-1 min-w-0 overflow-hidden">
                        <div className="flex items-start justify-between">
                          <p className={cn(
                            'text-sm font-medium transition-all duration-300 group-hover:translate-x-1',
                            notification.read 
                              ? 'text-secondary-700 dark:text-secondary-300' 
                              : 'text-secondary-900 dark:text-secondary-100'
                          )}>
                            {notification.title}
                          </p>
                          <button
                            onClick={() => onDelete(notification.id)}
                            className="flex-shrink-0 ml-2 text-secondary-400 hover:text-secondary-600 dark:hover:text-secondary-300 transition-all duration-300 hover:scale-110 hover:rotate-90"
                          >
                            <X className="h-3 w-3" />
                          </button>
                        </div>
                        <p className="text-xs text-secondary-600 dark:text-secondary-400 mt-1 transition-all duration-300 group-hover:translate-x-1 break-words">
                          {notification.message}
                        </p>
                        <div className="flex items-center justify-between mt-2 flex-wrap gap-1">
                          <span className="text-xs text-secondary-500 dark:text-secondary-400">
                            {formatTimestamp(notification.timestamp)}
                          </span>
                          <div className="flex items-center space-x-1">
                            {notification.action && (
                              <button
                                onClick={notification.action.onClick}
                                className="text-xs text-primary-600 hover:text-primary-700 dark:text-primary-400 dark:hover:text-primary-300 font-medium transition-all duration-300 hover:scale-110 hover:translate-y-0.5"
                              >
                                {notification.action.label}
                              </button>
                            )}
                            {!notification.read && (
                              <button
                                onClick={() => onMarkAsRead(notification.id)}
                                className="text-xs text-secondary-500 hover:text-secondary-700 dark:text-secondary-400 dark:hover:text-secondary-300 transition-all duration-300 hover:scale-110 hover:rotate-12"
                              >
                                <Check className="h-3 w-3" />
                              </button>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  )
}
