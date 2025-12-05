// src/index.ts
import { Server } from 'socket.io';
import { createServer } from 'http';
import express from 'express';

const app = express();
const httpServer = createServer(app);

console.log('🚀 Starting Socket.IO server...');

const io = new Server(httpServer, {
  cors: {
    origin: [
      'http://localhost:3000',
      'http://localhost:3001',
      'http://localhost:3002',
    ],
    credentials: true,
  },
});

console.log('✅ Socket.IO instance created');

// Create the /orders namespace (this is what your client connects to!)
const ordersNamespace = io.of('/orders');

console.log('✅ /orders namespace created');

// Authentication middleware for /orders namespace
ordersNamespace.use(async (socket, next) => {
  const token = socket.handshake.auth.token;
  console.log('🔐 /orders namespace auth attempt with token:', token);
  
  if (!token) {
    console.log('❌ No token provided');
    return next(new Error('Authentication required'));
  }
  
  // Use token as userId for development
  socket.data.userId = token;
  socket.data.userType = 'CUSTOMER';
  
  console.log('✅ Auth successful for /orders namespace:', token);
  next();
});

// Connection handler for /orders namespace
ordersNamespace.on('connection', (socket) => {
  const { userId, userType } = socket.data;
  console.log(`✅ ${userType} connected to /orders namespace: ${userId}`);

  // Join user-specific room
  socket.join(`user:${userId}`);
  console.log(`👤 Joined room: user:${userId}`);

  // Order placed event
  socket.on('order:placed', (orderData) => {
    console.log('📦 Order placed:', orderData);
    
    const { orderId, restaurantId } = orderData;
    
    // Join order-specific room
    socket.join(`order:${orderId}`);
    
    // Notify restaurant (if they're connected)
    ordersNamespace.to(`restaurant:${restaurantId}`).emit('order:new', {
      ...orderData,
      timestamp: new Date(),
      status: 'pending'
    });
    
    // Confirm to user
    socket.emit('order:confirmed', {
      orderId,
      message: 'Order sent to restaurant',
      status: 'pending',
      timestamp: new Date()
    });
    
    console.log('✅ Order confirmed and emitted:', orderId);
  });

  // Order accepted by restaurant
  socket.on('order:accept', ({ orderId, userId: customerId, estimatedTime }) => {
    console.log('✅ Order accepted:', { orderId, customerId, estimatedTime });
    
    ordersNamespace.to(`user:${customerId}`).emit('order:accepted', {
      orderId,
      status: 'accepted',
      estimatedTime,
      message: 'Your order has been accepted!',
      timestamp: new Date()
    });
    
    socket.emit('order:action_confirmed', {
      orderId,
      action: 'accepted'
    });
  });

  // Order rejected by restaurant
  socket.on('order:reject', ({ orderId, userId: customerId, reason }) => {
    console.log('❌ Order rejected:', { orderId, customerId, reason });
    
    ordersNamespace.to(`user:${customerId}`).emit('order:rejected', {
      orderId,
      status: 'rejected',
      reason: reason || 'Restaurant is unable to fulfill your order',
      message: 'Your order has been declined',
      timestamp: new Date()
    });
    
    socket.emit('order:action_confirmed', {
      orderId,
      action: 'rejected'
    });
  });

  // Order status updates
  socket.on('order:update_status', ({ orderId, userId: customerId, status, details }) => {
    console.log('📊 Status update:', { orderId, status });
    
    ordersNamespace.to(`user:${customerId}`).emit('order:status_update', {
      orderId,
      status,
      details,
      timestamp: new Date()
    });
    
    ordersNamespace.to(`order:${orderId}`).emit('order:status_changed', {
      orderId,
      status,
      details,
      timestamp: new Date()
    });
    
    socket.emit('order:update_confirmed', {
      orderId,
      status
    });
  });

  // Order cancelled
  socket.on('order:cancel', ({ orderId }) => {
    console.log('🚫 Order cancelled:', orderId);
    
    ordersNamespace.to(`order:${orderId}`).emit('order:cancelled', {
      orderId,
      cancelledBy: 'customer',
      timestamp: new Date()
    });
    
    socket.emit('order:cancel_confirmed', {
      orderId
    });
  });

  // Delivery location updates
  socket.on('delivery:location_update', ({ orderId, location }) => {
    console.log('📍 Location update:', { orderId, location });
    
    ordersNamespace.to(`order:${orderId}`).emit('delivery:location', {
      orderId,
      location,
      timestamp: new Date()
    });
  });

  // Handle errors
  socket.on('error', (error) => {
    console.error('Socket error:', error);
    socket.emit('order:error', {
      message: 'An error occurred',
      error: error.message
    });
  });

  // Disconnect
  socket.on('disconnect', (reason) => {
    console.log(`❌ ${userType} disconnected from /orders namespace: ${userId} (${reason})`);
  });
});

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({ 
    status: 'ok', 
    connections: io.engine.clientsCount,
    ordersNamespaceConnections: ordersNamespace.sockets.size,
    timestamp: new Date()
  });
});

const PORT = process.env.SOCKET_PORT || 4000;

httpServer.listen(PORT, () => {
  console.log(`\n🚀 Socket.IO server running on port ${PORT}`);
  console.log(`📊 Health check: http://localhost:${PORT}/health`);
  console.log(`🔌 Namespaces: / (main), /orders`);
  console.log(`\n`);
});