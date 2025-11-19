/**
 * Test script for WebSocket Server
 * 
 * This script sends test messages to the WebSocket server
 * Run: node server/test-websocket.js
 */

const fetch = require('node-fetch')

const SERVER_URL = process.env.WS_URL || 'http://localhost:3001'

// Test data
const testOrder = {
  id: `test-${Date.now()}`,
  orderNumber: `TEST${Math.floor(Math.random() * 10000)}`,
  name: `#TEST${Math.floor(Math.random() * 10000)}`,
  customerName: 'Test Customer',
  customerEmail: 'test@example.com',
  status: 'paid',
  fulfillmentStatus: 'fulfilled',
  financialStatus: 'paid',
  total: 299.99,
  currency: 'INR',
  items: 3,
  deliveryStatus: 'Tracking added',
  tags: ['test', 'websocket'],
  channel: 'Online Store',
  deliveryMethod: 'Standard Shipping',
  paymentStatus: 'paid',
  createdAt: new Date().toISOString(),
  updatedAt: new Date().toISOString()
}

async function testNewOrder() {
  console.log('📤 Testing: New Order Broadcast')
  try {
    const response = await fetch(`${SERVER_URL}/api/orders/new`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ order: testOrder })
    })
    const result = await response.json()
    console.log('✅ New Order Response:', result)
  } catch (error) {
    console.error('❌ Error:', error.message)
  }
}

async function testUpdateOrder() {
  console.log('📤 Testing: Update Order Broadcast')
  try {
    const updatedOrder = {
      ...testOrder,
      total: 399.99,
      status: 'processing',
      updatedAt: new Date().toISOString()
    }
    const response = await fetch(`${SERVER_URL}/api/orders/update`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ order: updatedOrder })
    })
    const result = await response.json()
    console.log('✅ Update Order Response:', result)
  } catch (error) {
    console.error('❌ Error:', error.message)
  }
}

async function testDeleteOrder() {
  console.log('📤 Testing: Delete Order Broadcast')
  try {
    const response = await fetch(`${SERVER_URL}/api/orders/delete`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ orderId: testOrder.id })
    })
    const result = await response.json()
    console.log('✅ Delete Order Response:', result)
  } catch (error) {
    console.error('❌ Error:', error.message)
  }
}

async function testBulkUpdate() {
  console.log('📤 Testing: Bulk Update Broadcast')
  try {
    const orders = Array.from({ length: 5 }, (_, i) => ({
      ...testOrder,
      id: `bulk-test-${Date.now()}-${i}`,
      orderNumber: `BULK${Math.floor(Math.random() * 10000) + i}`,
      total: Math.floor(Math.random() * 1000)
    }))
    
    const response = await fetch(`${SERVER_URL}/api/orders/bulk-update`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ orders })
    })
    const result = await response.json()
    console.log('✅ Bulk Update Response:', result)
  } catch (error) {
    console.error('❌ Error:', error.message)
  }
}

async function checkServerStatus() {
  console.log('📡 Checking server status...')
  try {
    const response = await fetch(`${SERVER_URL}/status`)
    const result = await response.json()
    console.log('✅ Server Status:', result)
  } catch (error) {
    console.error('❌ Server not running or error:', error.message)
    console.log('💡 Make sure to start the WebSocket server first: node server/websocket-server.js')
    process.exit(1)
  }
}

async function runTests() {
  console.log('🧪 WebSocket Server Test Suite')
  console.log('================================')
  console.log(`Server URL: ${SERVER_URL}`)
  console.log('')

  await checkServerStatus()
  console.log('')

  console.log('Running tests in 2 seconds...')
  await new Promise(resolve => setTimeout(resolve, 2000))
  
  await testNewOrder()
  await new Promise(resolve => setTimeout(resolve, 1000))
  
  await testUpdateOrder()
  await new Promise(resolve => setTimeout(resolve, 1000))
  
  await testBulkUpdate()
  await new Promise(resolve => setTimeout(resolve, 1000))
  
  await testDeleteOrder()
  
  console.log('')
  console.log('✅ All tests completed!')
  console.log('💡 Check your frontend application to see if the orders updated in real-time')
}

// Run tests
runTests().catch(console.error)





