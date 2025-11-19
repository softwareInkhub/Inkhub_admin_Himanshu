import { useEffect, useRef, useState, useCallback } from 'react'
import { io, Socket } from 'socket.io-client'
import { Order } from '../types'

export type WebSocketStatus = 'disconnected' | 'connecting' | 'connected' | 'error' | 'reconnecting'

interface UseOrdersWebSocketProps {
  enabled: boolean
  url?: string
  onOrderUpdate?: (order: Order) => void
  onOrdersUpdate?: (orders: Order[]) => void
  onNewOrder?: (order: Order) => void
  onOrderDelete?: (orderId: string) => void
  reconnectInterval?: number
  maxReconnectAttempts?: number
}

export const useOrdersWebSocket = ({
  enabled,
  url,
  onOrderUpdate,
  onOrdersUpdate,
  onNewOrder,
  onOrderDelete,
  reconnectInterval = 5000,
  maxReconnectAttempts = 10
}: UseOrdersWebSocketProps) => {
  const [status, setStatus] = useState<WebSocketStatus>('disconnected')
  const [lastMessage, setLastMessage] = useState<any>(null)
  const [reconnectAttempts, setReconnectAttempts] = useState(0)
  const [connectionTime, setConnectionTime] = useState<Date | null>(null)
  
  const socketRef = useRef<Socket | null>(null)

  // Default Socket.IO URL
  const socketUrl = url || process.env.NEXT_PUBLIC_WS_URL || 'http://localhost:3001'

  // Disconnect function
  const disconnect = useCallback(() => {
    console.log('🔌 Disconnecting Socket.IO...')
    
    if (socketRef.current) {
      socketRef.current.disconnect()
      socketRef.current = null
    }
    
    setStatus('disconnected')
    setConnectionTime(null)
  }, [])

  // Send message through Socket.IO
  const sendMessage = useCallback((event: string, data: any) => {
    if (socketRef.current && socketRef.current.connected) {
      socketRef.current.emit(event, data)
      return true
    }
    console.warn('⚠️ Socket.IO not connected, cannot send message')
    return false
  }, [])

  // Connect to Socket.IO server
  const connect = useCallback(() => {
    if (socketRef.current) {
      console.log('⚠️ Socket.IO already exists, disconnecting old connection')
      socketRef.current.disconnect()
    }

    console.log(`🔌 Connecting to Socket.IO: ${socketUrl}`)
    setStatus('connecting')

    try {
      const socket = io(socketUrl, {
        transports: ['websocket', 'polling'],
        reconnection: true,
        reconnectionDelay: reconnectInterval,
        reconnectionAttempts: maxReconnectAttempts,
        timeout: 20000,
        autoConnect: true
      })

      socketRef.current = socket

      // Connection events
      socket.on('connect', () => {
        console.log('✅ Socket.IO connected, ID:', socket.id)
        setStatus('connected')
        setReconnectAttempts(0)
        setConnectionTime(new Date())

        // Subscribe to orders updates
        socket.emit('subscribe:orders', { timestamp: new Date().toISOString() })
      })

      socket.on('disconnect', (reason) => {
        console.log('🔌 Socket.IO disconnected:', reason)
        setStatus('disconnected')
        setConnectionTime(null)
      })

      socket.on('connect_error', (error) => {
        console.error('❌ Socket.IO connection error:', error.message)
        setStatus('error')
      })

      socket.on('reconnect_attempt', (attemptNumber) => {
        console.log(`🔄 Reconnection attempt ${attemptNumber}/${maxReconnectAttempts}`)
        setStatus('reconnecting')
        setReconnectAttempts(attemptNumber)
      })

      socket.on('reconnect_failed', () => {
        console.error('❌ Socket.IO reconnection failed after max attempts')
        setStatus('error')
      })

      socket.on('reconnect', (attemptNumber) => {
        console.log(`✅ Socket.IO reconnected after ${attemptNumber} attempts`)
        setStatus('connected')
        setReconnectAttempts(0)
      })

      // Order events
      socket.on('order:update', (data: { order: Order }) => {
        console.log('📦 Order update received:', data.order.orderNumber)
        setLastMessage({ type: 'order:update', data })
        if (onOrderUpdate && data.order) {
          onOrderUpdate(data.order)
        }
      })

      socket.on('order:new', (data: { order: Order }) => {
        console.log('🆕 New order received:', data.order.orderNumber)
        setLastMessage({ type: 'order:new', data })
        if (onNewOrder && data.order) {
          onNewOrder(data.order)
        }
      })

      socket.on('order:delete', (data: { orderId: string }) => {
        console.log('🗑️ Order delete received:', data.orderId)
        setLastMessage({ type: 'order:delete', data })
        if (onOrderDelete && data.orderId) {
          onOrderDelete(data.orderId)
        }
      })

      socket.on('orders:bulk_update', (data: { orders: Order[] }) => {
        console.log('📦 Bulk update received:', data.orders.length, 'orders')
        setLastMessage({ type: 'orders:bulk_update', data })
        if (onOrdersUpdate && data.orders) {
          onOrdersUpdate(data.orders)
        }
      })

      // Ping/Pong for connection health
      socket.on('ping', () => {
        socket.emit('pong', { timestamp: new Date().toISOString() })
      })

    } catch (error) {
      console.error('❌ Failed to create Socket.IO connection:', error)
      setStatus('error')
    }
  }, [socketUrl, onOrderUpdate, onOrdersUpdate, onNewOrder, onOrderDelete, reconnectInterval, maxReconnectAttempts])

  // Effect to handle connection based on enabled state
  useEffect(() => {
    if (enabled) {
      connect()
    } else {
      disconnect()
    }

    // Cleanup on unmount
    return () => {
      disconnect()
    }
  }, [enabled, connect, disconnect])

  // Manual reconnect function
  const reconnect = useCallback(() => {
    console.log('🔄 Manual reconnect triggered')
    setReconnectAttempts(0)
    disconnect()
    if (enabled) {
      setTimeout(() => connect(), 100)
    }
  }, [enabled, disconnect, connect])

  return {
    status,
    lastMessage,
    reconnectAttempts,
    connectionTime,
    sendMessage,
    reconnect,
    disconnect,
    isConnected: status === 'connected',
    isConnecting: status === 'connecting' || status === 'reconnecting',
    hasError: status === 'error',
    socket: socketRef.current
  }
}
