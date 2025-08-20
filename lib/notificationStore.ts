import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import { Notification } from '@/components/NotificationDropdown'

interface NotificationState {
  notifications: Notification[]
  addNotification: (notification: Omit<Notification, 'id' | 'timestamp' | 'read'>) => void
  markAsRead: (id: string) => void
  markAllAsRead: () => void
  deleteNotification: (id: string) => void
  clearAll: () => void
  getUnreadCount: () => number
}

export const useNotificationStore = create<NotificationState>()(
  persist(
    (set, get) => ({
      notifications: [
        {
          id: '1',
          title: 'Welcome to INKHUB Admin',
          message: 'Your admin panel is ready. Start managing your data efficiently.',
          type: 'success',
          timestamp: new Date(Date.now() - 1000 * 60 * 30), // 30 minutes ago
          read: false,
          action: {
            label: 'Get Started',
            onClick: () => console.log('Get Started clicked')
          }
        },
        {
          id: '2',
          title: 'System Update Available',
          message: 'A new version of INKHUB Admin is available. Update to get the latest features.',
          type: 'info',
          timestamp: new Date(Date.now() - 1000 * 60 * 60 * 2), // 2 hours ago
          read: false,
          action: {
            label: 'Update Now',
            onClick: () => console.log('Update clicked')
          }
        },
        {
          id: '3',
          title: 'High Memory Usage',
          message: 'System memory usage is at 85%. Consider optimizing your data.',
          type: 'warning',
          timestamp: new Date(Date.now() - 1000 * 60 * 60 * 4), // 4 hours ago
          read: true
        },
        {
          id: '4',
          title: 'Backup Completed',
          message: 'Daily backup has been completed successfully.',
          type: 'success',
          timestamp: new Date(Date.now() - 1000 * 60 * 60 * 6), // 6 hours ago
          read: true
        },
        {
          id: '5',
          title: 'New User Registration',
          message: 'A new user has registered: john.doe@example.com',
          type: 'info',
          timestamp: new Date(Date.now() - 1000 * 60 * 60 * 8), // 8 hours ago
          read: false,
          action: {
            label: 'View User',
            onClick: () => console.log('View User clicked')
          }
        }
      ],

      addNotification: (notification) => {
        const newNotification: Notification = {
          ...notification,
          id: Date.now().toString(),
          timestamp: new Date(),
          read: false
        }
        set((state) => ({
          notifications: [newNotification, ...state.notifications]
        }))
      },

      markAsRead: (id) => {
        set((state) => ({
          notifications: state.notifications.map((notification) =>
            notification.id === id ? { ...notification, read: true } : notification
          )
        }))
      },

      markAllAsRead: () => {
        set((state) => ({
          notifications: state.notifications.map((notification) => ({
            ...notification,
            read: true
          }))
        }))
      },

      deleteNotification: (id) => {
        set((state) => ({
          notifications: state.notifications.filter((notification) => notification.id !== id)
        }))
      },

      clearAll: () => {
        set({ notifications: [] })
      },

      getUnreadCount: () => {
        return get().notifications.filter((notification) => !notification.read).length
      }
    }),
    {
      name: 'notification-storage',
      // Custom rehydration to convert string timestamps back to Date objects
      onRehydrateStorage: () => (state) => {
        if (state) {
          state.notifications = state.notifications.map(notification => {
            let timestamp: Date
            if (typeof notification.timestamp === 'string') {
              try {
                timestamp = new Date(notification.timestamp)
                // If the date is invalid, use current time
                if (isNaN(timestamp.getTime())) {
                  timestamp = new Date()
                }
              } catch (error) {
                timestamp = new Date()
              }
            } else {
              timestamp = notification.timestamp
            }
            
            return {
              ...notification,
              timestamp
            }
          })
        }
      }
    }
  )
)
