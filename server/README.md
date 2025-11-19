# WebSocket Server for Real-time Order Updates

This WebSocket server provides real-time order updates using Socket.IO.

## Setup

### 1. Environment Variables

Create a `.env` file in the project root or set these environment variables:

```env
# WebSocket Server URL (for frontend)
NEXT_PUBLIC_WS_URL=http://localhost:3001

# WebSocket Server Port
WS_PORT=3001

# Frontend URL (for CORS)
FRONTEND_URL=http://localhost:3000
```

### 2. Install Dependencies

Dependencies are already installed. If needed, run:

```bash
npm install express socket.io socket.io-client ws @types/ws
```

### 3. Start the WebSocket Server

```bash
node server/websocket-server.js
```

You should see:

```
🚀 WebSocket Server started
📡 Socket.IO listening on http://localhost:3001
🏥 Health check: http://localhost:3001/health
📊 Status: http://localhost:3001/status
```

## Testing

### Test with the test script:

```bash
node server/test-websocket.js
```

This will send test order updates to all connected clients.

### Manual Testing with curl:

**New Order:**
```bash
curl -X POST http://localhost:3001/api/orders/new \
  -H "Content-Type: application/json" \
  -d '{
    "order": {
      "id": "test-123",
      "orderNumber": "TEST1001",
      "customerName": "John Doe",
      "total": 299.99,
      "status": "paid"
    }
  }'
```

**Update Order:**
```bash
curl -X POST http://localhost:3001/api/orders/update \
  -H "Content-Type: application/json" \
  -d '{
    "order": {
      "id": "test-123",
      "orderNumber": "TEST1001",
      "customerName": "John Doe",
      "total": 399.99,
      "status": "processing"
    }
  }'
```

**Delete Order:**
```bash
curl -X POST http://localhost:3001/api/orders/delete \
  -H "Content-Type: application/json" \
  -d '{
    "orderId": "test-123"
  }'
```

**Bulk Update:**
```bash
curl -X POST http://localhost:3001/api/orders/bulk-update \
  -H "Content-Type: application/json" \
  -d '{
    "orders": [
      {"id": "1", "orderNumber": "1001", "total": 100},
      {"id": "2", "orderNumber": "1002", "total": 200}
    ]
  }'
```

## Using in the Frontend

### Enable Live Mode with WebSocket

1. Navigate to the Orders page
2. Click the **"Cached"** button in the top-right to enable **"LIVE"** mode
3. Click **"Poll"** to switch to **"WS"** (WebSocket mode)
4. You should see **"Connected"** status indicator
5. Any order updates sent to the WebSocket server will appear in real-time!

### Configure in Settings

1. Click the **Settings** button
2. In **Live Mode Settings**, check **"Prefer WebSocket"**
3. Save changes

## WebSocket Events

The server emits the following events to subscribed clients:

| Event | Description | Data |
|-------|-------------|------|
| `order:update` | An existing order was updated | `{ order: Order }` |
| `order:new` | A new order was created | `{ order: Order }` |
| `order:delete` | An order was deleted | `{ orderId: string }` |
| `orders:bulk_update` | Multiple orders were updated | `{ orders: Order[] }` |
| `ping` | Keep-alive ping | `{ timestamp: string }` |

## API Endpoints

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/health` | GET | Health check |
| `/status` | GET | Server status and connected clients |
| `/api/orders/new` | POST | Broadcast new order |
| `/api/orders/update` | POST | Broadcast order update |
| `/api/orders/delete` | POST | Broadcast order deletion |
| `/api/orders/bulk-update` | POST | Broadcast bulk update |

## Integration with Your Backend

To integrate this with your actual backend:

1. **Import the WebSocket server** in your backend:

```javascript
const { io } = require('./server/websocket-server')
```

2. **Emit events when orders change**:

```javascript
// When an order is created
io.to('orders').emit('order:new', { 
  order: newOrder,
  timestamp: new Date().toISOString()
})

// When an order is updated
io.to('orders').emit('order:update', { 
  order: updatedOrder,
  timestamp: new Date().toISOString()
})

// When an order is deleted
io.to('orders').emit('order:delete', { 
  orderId: deletedOrderId,
  timestamp: new Date().toISOString()
})
```

3. **Or use the HTTP endpoints** from your backend:

```javascript
fetch('http://localhost:3001/api/orders/update', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ order: updatedOrder })
})
```

## Production Deployment

For production, consider:

1. **Use environment variables** for all configuration
2. **Enable SSL/TLS** for wss:// connections
3. **Add authentication** to verify clients
4. **Scale horizontally** using Redis adapter:

```javascript
const { createAdapter } = require('@socket.io/redis-adapter')
const { createClient } = require('redis')

const pubClient = createClient({ url: 'redis://localhost:6379' })
const subClient = pubClient.duplicate()

io.adapter(createAdapter(pubClient, subClient))
```

5. **Monitor connections** and handle reconnection gracefully
6. **Use a process manager** like PM2:

```bash
npm install -g pm2
pm2 start server/websocket-server.js --name orders-websocket
pm2 save
pm2 startup
```

## Troubleshooting

### Connection Refused
- Make sure the WebSocket server is running
- Check the `NEXT_PUBLIC_WS_URL` environment variable
- Verify firewall/port settings

### CORS Errors
- Update `FRONTEND_URL` in the server configuration
- Check browser console for specific CORS errors

### Events Not Received
- Verify client is connected (check status indicator)
- Ensure client subscribed to 'orders' channel
- Check server logs for errors

### Multiple Clients Not Syncing
- Verify all clients are connected to the same server instance
- For multiple servers, use Redis adapter (see Production section)

## Development Tips

- Use the browser console to see WebSocket connection logs
- Check the server console for real-time event broadcasting
- Use the `/status` endpoint to see connected clients
- Test with multiple browser tabs to verify multi-client sync

## Support

For issues or questions:
- Check server logs: `server/websocket-server.js`
- Review client hook: `app/(admin)/apps/shopify/orders/hooks/useOrdersWebSocket.ts`
- Test with: `node server/test-websocket.js`





