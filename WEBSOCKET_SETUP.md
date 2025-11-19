# 🚀 WebSocket Setup Guide - Real-time Order Updates

This guide will help you set up WebSocket for real-time order updates in your InkHub Admin dashboard.

## ✅ Prerequisites

All required packages are already installed:
- ✅ `socket.io` - WebSocket server
- ✅ `socket.io-client` - WebSocket client
- ✅ `ws` - WebSocket library
- ✅ `express` - HTTP server

## 📁 Files Created

1. **WebSocket Hook** (Client-side)
   - `app/(admin)/apps/shopify/orders/hooks/useOrdersWebSocket.ts`
   - Handles WebSocket connections and real-time updates

2. **WebSocket Server** (Server-side)
   - `server/websocket-server.js`
   - Standalone WebSocket server with Socket.IO

3. **Test Script**
   - `server/test-websocket.js`
   - Send test order updates to verify everything works

4. **Documentation**
   - `server/README.md`
   - Detailed WebSocket server documentation

## 🔧 Configuration

### Step 1: Set Environment Variables

Add these to your `.env.local` file (create if it doesn't exist):

```env
# WebSocket Server URL (where the WebSocket server runs)
NEXT_PUBLIC_WS_URL=http://localhost:3001

# Optional: Custom WebSocket port
WS_PORT=3001

# Frontend URL (for CORS in WebSocket server)
FRONTEND_URL=http://localhost:3000
```

## 🚀 Quick Start

### Option 1: Run Everything Together (Recommended)

Install concurrently (if not already installed):
```bash
npm install -D concurrently
```

Then run both the Next.js app and WebSocket server together:
```bash
npm run dev:all
```

### Option 2: Run Separately

**Terminal 1:** Start your Next.js application
```bash
npm run dev
```

**Terminal 2:** Start the WebSocket server
```bash
npm run ws
```

You should see:
```
🚀 WebSocket Server started
📡 Socket.IO listening on http://localhost:3001
🏥 Health check: http://localhost:3001/health
📊 Status: http://localhost:3001/status
```

## 🎮 How to Use

### 1. Enable Live Mode

1. Open the Orders page in your browser
2. Look for the **"Cached"** button in the top-right corner
3. Click it to enable **"LIVE"** mode (the dot turns red and pulses)

### 2. Switch to WebSocket Mode

When Live mode is enabled, you'll see:
- **Poll** button - Click it to switch to **WS** (WebSocket)
- **Connection Status** - Shows "Connected", "Connecting...", or "Error"

### 3. Configure Settings

1. Click the **Settings** ⚙️ button
2. Scroll to **"Live Mode Settings"**
3. Check ✅ **"Prefer WebSocket"**
4. Choose your refresh interval (for fallback polling)
5. Click **"Save Changes"**

## 🧪 Testing

### Test with the automated script:

```bash
npm run ws:test
```

This will:
1. Check server status
2. Send a new order
3. Update an order
4. Send bulk updates
5. Delete an order

### Manual Testing with curl:

**Send a new order:**
```bash
curl -X POST http://localhost:3001/api/orders/new \
  -H "Content-Type: application/json" \
  -d '{"order":{"id":"test-123","orderNumber":"TEST1001","customerName":"John Doe","total":299.99,"status":"paid","createdAt":"2024-01-01T00:00:00Z"}}'
```

**Update an order:**
```bash
curl -X POST http://localhost:3001/api/orders/update \
  -H "Content-Type: application/json" \
  -d '{"order":{"id":"test-123","orderNumber":"TEST1001","customerName":"John Doe","total":399.99,"status":"processing"}}'
```

**Check server status:**
```bash
curl http://localhost:3001/status
```

## 📊 Visual Indicators

### Live Mode Status

| Indicator | Meaning |
|-----------|---------|
| **⚪ Cached** | Normal mode - data loaded from cache |
| **🔴 LIVE** | Live mode enabled - real-time updates active |
| **WS** (green) | Using WebSocket connection |
| **Poll** (blue) | Using polling method |
| **Connected** (green) | WebSocket connected |
| **Connecting...** (yellow) | WebSocket attempting connection |
| **Error** (red) | WebSocket connection failed |

### Real-time Updates

When WebSocket is working, you'll see:
- 🆕 **New orders** appear instantly at the top
- 📦 **Updated orders** refresh automatically
- 🗑️ **Deleted orders** disappear immediately
- ⏱️ **Last update timestamp** shows when data was refreshed

## 🔄 How It Works

### Client-side (Frontend)

1. **Hook:** `useOrdersWebSocket` manages the Socket.IO connection
2. **Auto-reconnect:** Automatically reconnects if connection drops
3. **Event handlers:** Listens for order updates and applies them to the UI
4. **Fallback:** Switches to polling if WebSocket fails

### Server-side (Backend)

1. **Socket.IO Server:** Handles WebSocket connections
2. **Rooms:** Clients join "orders" room for targeted updates
3. **Events:** Broadcasts order changes to all connected clients
4. **Keep-alive:** Ping/pong mechanism keeps connections alive

### Event Types

| Event | Description | When It Fires |
|-------|-------------|---------------|
| `order:new` | New order created | Order added to system |
| `order:update` | Order modified | Order details changed |
| `order:delete` | Order removed | Order deleted |
| `orders:bulk_update` | Multiple orders changed | Bulk operation performed |

## 🔗 Integration with Your Backend

To send real-time updates from your backend:

### Method 1: Import the WebSocket server

```javascript
const { io } = require('./server/websocket-server')

// When an order changes
io.to('orders').emit('order:update', {
  order: updatedOrder,
  timestamp: new Date().toISOString()
})
```

### Method 2: HTTP API calls

```javascript
// From any service/API
await fetch('http://localhost:3001/api/orders/update', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ order: updatedOrder })
})
```

### Method 3: Shopify Webhooks

Configure Shopify webhooks to call your backend, then broadcast to WebSocket:

```javascript
// In your webhook handler
app.post('/webhooks/shopify/orders/update', async (req, res) => {
  const order = req.body
  
  // Process order...
  
  // Broadcast to all connected clients
  io.to('orders').emit('order:update', { order })
  
  res.status(200).send('OK')
})
```

## 🛠️ Troubleshooting

### Issue: "Connection Refused"

**Solution:**
1. Verify WebSocket server is running: `npm run ws`
2. Check URL: `http://localhost:3001/health`
3. Ensure port 3001 is not blocked

### Issue: "CORS Error"

**Solution:**
1. Update `FRONTEND_URL` in `.env.local`
2. Restart WebSocket server
3. Clear browser cache

### Issue: "Not Receiving Updates"

**Solution:**
1. Check connection status (should show "Connected")
2. Verify client subscribed: Check browser console
3. Test with: `npm run ws:test`
4. Check WebSocket server logs

### Issue: "Connection Keeps Dropping"

**Solution:**
1. Check network stability
2. Increase reconnection attempts in settings
3. Look for firewall/proxy interference
4. Review server logs for errors

## 📈 Performance Tips

1. **Use WebSocket for real-time needs** - More efficient than polling
2. **Use Polling for stable data** - Better for periodic updates
3. **Adjust refresh interval** - Balance between freshness and load
4. **Monitor connections** - Use `/status` endpoint

## 🔐 Security (Production)

For production deployment:

1. **Use WSS (secure WebSocket)**
   ```env
   NEXT_PUBLIC_WS_URL=wss://your-domain.com
   ```

2. **Add authentication**
   ```javascript
   io.use((socket, next) => {
     const token = socket.handshake.auth.token
     if (isValid(token)) {
       next()
     } else {
       next(new Error('Authentication error'))
     }
   })
   ```

3. **Rate limiting**
4. **CORS configuration**
5. **SSL/TLS certificates**

## 📚 Additional Resources

- **Socket.IO Docs:** https://socket.io/docs/
- **WebSocket API:** https://developer.mozilla.org/en-US/docs/Web/API/WebSocket
- **Server README:** `server/README.md`

## 🆘 Need Help?

1. Check server logs: `server/websocket-server.js` console
2. Check client logs: Browser DevTools > Console
3. Test connection: `curl http://localhost:3001/health`
4. Run test suite: `npm run ws:test`

## ✨ Features Implemented

- ✅ Real-time order updates via WebSocket
- ✅ Automatic reconnection on disconnect
- ✅ Fallback to polling when WebSocket unavailable
- ✅ Visual connection status indicators
- ✅ Manual refresh button
- ✅ Configurable refresh intervals
- ✅ Settings persistence
- ✅ Test scripts included
- ✅ Full documentation

---

**Enjoy real-time order updates! 🎉**





