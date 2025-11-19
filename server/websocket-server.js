/**
 * WebSocket Server for Real-time Order Updates
 * 
 * This server handles real-time order updates using Socket.IO
 * Run this server separately: node server/websocket-server.js
 */

const express = require('express')
const { createServer } = require('http')
const { Server } = require('socket.io')

const app = express()
const httpServer = createServer(app)

// Configure Socket.IO with CORS
const io = new Server(httpServer, {
  cors: {
    origin: process.env.FRONTEND_URL || 'http://localhost:3000',
    methods: ['GET', 'POST'],
    credentials: true
  },
  transports: ['websocket', 'polling']
})

// Store connected clients
const connectedClients = new Map()

// Middleware to log connections
io.use((socket, next) => {
  console.log('🔐 Client attempting to connect:', socket.id)
  next()
})

// Handle socket connections
io.on('connection', (socket) => {
  console.log('✅ Client connected:', socket.id)
  connectedClients.set(socket.id, {
    id: socket.id,
    connectedAt: new Date(),
    subscriptions: new Set()
  })

  // Subscribe to orders updates
  socket.on('subscribe:orders', (data) => {
    console.log('📧 Client subscribed to orders:', socket.id)
    const client = connectedClients.get(socket.id)
    if (client) {
      client.subscriptions.add('orders')
      socket.join('orders') // Join orders room
    }
    
    // Send confirmation
    socket.emit('subscribed', { 
      channel: 'orders', 
      timestamp: new Date().toISOString() 
    })
  })

  // Unsubscribe from orders
  socket.on('unsubscribe:orders', () => {
    console.log('📭 Client unsubscribed from orders:', socket.id)
    const client = connectedClients.get(socket.id)
    if (client) {
      client.subscriptions.delete('orders')
      socket.leave('orders')
    }
  })

  // Handle ping from client
  socket.on('ping', (data) => {
    socket.emit('pong', { timestamp: new Date().toISOString() })
  })

  // Handle pong from client
  socket.on('pong', (data) => {
    // Connection is alive
  })

  // Handle disconnection
  socket.on('disconnect', (reason) => {
    console.log('🔌 Client disconnected:', socket.id, 'Reason:', reason)
    connectedClients.delete(socket.id)
  })

  // Handle errors
  socket.on('error', (error) => {
    console.error('❌ Socket error:', socket.id, error)
  })
})

// API endpoint to trigger order updates (for testing)
app.use(express.json())

app.post('/api/orders/update', (req, res) => {
  const { order } = req.body
  
  if (!order) {
    return res.status(400).json({ error: 'Order data required' })
  }

  console.log('📤 Broadcasting order update:', order.orderNumber || order.id)
  
  // Broadcast to all clients in 'orders' room
  io.to('orders').emit('order:update', { order, timestamp: new Date().toISOString() })
  
  res.json({ 
    success: true, 
    message: 'Order update broadcasted',
    clients: connectedClients.size 
  })
})

app.post('/api/orders/new', (req, res) => {
  const { order } = req.body
  
  if (!order) {
    return res.status(400).json({ error: 'Order data required' })
  }

  console.log('📤 Broadcasting new order:', order.orderNumber || order.id)
  
  // Broadcast to all clients in 'orders' room
  io.to('orders').emit('order:new', { order, timestamp: new Date().toISOString() })
  
  res.json({ 
    success: true, 
    message: 'New order broadcasted',
    clients: connectedClients.size 
  })
})

app.post('/api/orders/delete', (req, res) => {
  const { orderId } = req.body
  
  if (!orderId) {
    return res.status(400).json({ error: 'Order ID required' })
  }

  console.log('📤 Broadcasting order delete:', orderId)
  
  // Broadcast to all clients in 'orders' room
  io.to('orders').emit('order:delete', { orderId, timestamp: new Date().toISOString() })
  
  res.json({ 
    success: true, 
    message: 'Order delete broadcasted',
    clients: connectedClients.size 
  })
})

app.post('/api/orders/bulk-update', (req, res) => {
  const { orders } = req.body
  
  if (!orders || !Array.isArray(orders)) {
    return res.status(400).json({ error: 'Orders array required' })
  }

  console.log('📤 Broadcasting bulk update:', orders.length, 'orders')
  
  // Broadcast to all clients in 'orders' room
  io.to('orders').emit('orders:bulk_update', { orders, timestamp: new Date().toISOString() })
  
  res.json({ 
    success: true, 
    message: 'Bulk update broadcasted',
    orders: orders.length,
    clients: connectedClients.size 
  })
})

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({ 
    status: 'ok', 
    connections: connectedClients.size,
    uptime: process.uptime(),
    timestamp: new Date().toISOString()
  })
})

// Status endpoint
app.get('/status', (req, res) => {
  const clients = Array.from(connectedClients.values()).map(client => ({
    id: client.id,
    connectedAt: client.connectedAt,
    subscriptions: Array.from(client.subscriptions)
  }))
  
  res.json({
    server: 'WebSocket Server for Orders',
    connections: connectedClients.size,
    clients,
    uptime: process.uptime(),
    timestamp: new Date().toISOString()
  })
})

// Start server
const PORT = process.env.WS_PORT || 3001

httpServer.listen(PORT, () => {
  console.log('🚀 WebSocket Server started')
  console.log(`📡 Socket.IO listening on http://localhost:${PORT}`)
  console.log(`🏥 Health check: http://localhost:${PORT}/health`)
  console.log(`📊 Status: http://localhost:${PORT}/status`)
  console.log('---')
  console.log('Test endpoints:')
  console.log(`  POST http://localhost:${PORT}/api/orders/update`)
  console.log(`  POST http://localhost:${PORT}/api/orders/new`)
  console.log(`  POST http://localhost:${PORT}/api/orders/delete`)
  console.log(`  POST http://localhost:${PORT}/api/orders/bulk-update`)
})

// Graceful shutdown
process.on('SIGINT', () => {
  console.log('\n🛑 Shutting down WebSocket server...')
  io.close(() => {
    console.log('✅ Server closed')
    process.exit(0)
  })
})

// Keep-alive ping to all clients every 30 seconds
setInterval(() => {
  io.to('orders').emit('ping', { timestamp: new Date().toISOString() })
}, 30000)

module.exports = { io, httpServer, app }





