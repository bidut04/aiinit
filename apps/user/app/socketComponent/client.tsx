// apps/user/app/socketComponent/client.ts
'use client';
import { 
  OrderSocketClient, 
  OrderAcceptance, 
  OrderRejection, 
  OrderStatusUpdate 
} from '@workspace/socket-client';
import { toast } from 'react-hot-toast';

let socketClient: OrderSocketClient | null = null;

// Callback registry for order updates
type OrderUpdateCallback = (orderId: string, status: string, data: any) => void;
const orderUpdateCallbacks: OrderUpdateCallback[] = [];

/**
 * Initialize socket connection for user
 */
export async function initUserSocket(token: string): Promise<OrderSocketClient> {
  // If already connected, return existing client
  if (socketClient?.isConnected()) {
    console.log('Socket already connected');
    return socketClient;
  }

  // Clean up existing connection if any
  if (socketClient) {
    socketClient.disconnect();
  }

  const socketUrl = process.env.NEXT_PUBLIC_SOCKET_URL || 'http://localhost:4000';
  
  console.log('Initializing user socket connection...');
  socketClient = new OrderSocketClient(socketUrl, token);

  try {
    // Connect to socket server (async)
    await socketClient.connect('CUSTOMER');
    console.log('✅ User socket initialized successfully');
    
    // Set up event listeners
    setupSocketListeners();
    
    return socketClient;
  } catch (error) {
    console.error('❌ Failed to connect socket:', error);
    socketClient = null; // Clear failed connection
    throw error;
  }
}

/**
 * Set up socket event listeners
 */
function setupSocketListeners() {
  if (!socketClient) return;

  // Order confirmed by socket server
  socketClient.onOrderConfirmed((data) => {
    console.log('📦 Order confirmed:', data);
    toast.success(`Order #${data.orderId} sent to restaurant!`, {
      icon: '✅',
    });
  });

  // Order accepted by restaurant
  socketClient.onOrderAccepted((data: OrderAcceptance) => {
    console.log('✅ Order accepted:', data);
    toast.success(
      `${data.message}\nEstimated time: ${data.estimatedTime} minutes`, 
      {
        duration: 5000,
        icon: '🎉',
      }
    );
    
    // Trigger callbacks for UI updates
    notifyOrderUpdate(data.orderId, 'accepted', data);
  });

  // Order rejected by restaurant
  socketClient.onOrderRejected((data: OrderRejection) => {
    console.log('❌ Order rejected:', data);
    toast.error(
      `Order Declined\n${data.reason || 'Restaurant is unable to fulfill your order'}`, 
      {
        duration: 6000,
        icon: '😞',
      }
    );
    
    // Trigger callbacks for UI updates
    notifyOrderUpdate(data.orderId, 'rejected', data);
  });

  // Order status updates (preparing, ready, out_for_delivery, delivered)
  socketClient.onOrderStatusUpdate((data: OrderStatusUpdate) => {
    console.log('📊 Order status update:', data);
    
    // Map status to user-friendly messages with emojis
    const statusMessages: Record<string, string> = {
      preparing: '👨‍🍳 Your order is being prepared',
      ready: '✅ Your order is ready for pickup/delivery',
      out_for_delivery: '🚗 Your order is out for delivery',
      delivered: '🎉 Your order has been delivered!',
    };

    const message = statusMessages[data.status] || `Order status: ${data.status}`;
    
    // Show different toast types based on status
    if (data.status === 'delivered') {
      toast.success(message, { duration: 6000 });
    } else {
      toast(message, { duration: 4000, icon: '📦' });
    }
    
    // Trigger callbacks for UI updates
    notifyOrderUpdate(data.orderId, data.status, data);
  });

  // Order cancelled (by customer or restaurant)
  socketClient.onOrderCancelled((data) => {
    console.log('🚫 Order cancelled:', data);
    
    const message = data.cancelledBy === 'customer' 
      ? 'Your order has been cancelled'
      : 'Order was cancelled by the restaurant';
    
    toast.info(message, {
      duration: 5000,
      icon: '🚫',
    });
    
    // Trigger callbacks for UI updates
    notifyOrderUpdate(data.orderId, 'cancelled', data);
  });

  // Delivery location updates (for real-time tracking)
  socketClient.onDeliveryLocation((data) => {
    console.log('📍 Delivery location update:', data);
    // This is used for map/tracking UI - no toast needed
    notifyOrderUpdate(data.orderId, 'location_update', data);
  });

  // Error handling
  socketClient.onError((error) => {
    console.error('⚠️ Socket error:', error);
    toast.error(error.message || 'An error occurred with your connection', {
      duration: 5000,
    });
  });
}

/**
 * Get the current socket client instance
 */
export function getUserSocket(): OrderSocketClient | null {
  return socketClient;
}

/**
 * Register a callback for order updates
 * Returns an unsubscribe function
 */
export function onOrderUpdate(callback: OrderUpdateCallback): () => void {
  orderUpdateCallbacks.push(callback);
  
  // Return unsubscribe function
  return () => {
    const index = orderUpdateCallbacks.indexOf(callback);
    if (index > -1) {
      orderUpdateCallbacks.splice(index, 1);
    }
  };
}

/**
 * Notify all registered callbacks about order updates
 */
function notifyOrderUpdate(orderId: string, status: string, data: any) {
  orderUpdateCallbacks.forEach(callback => {
    try {
      callback(orderId, status, data);
    } catch (error) {
      console.error('Error in order update callback:', error);
    }
  });
}

/**
 * Place a new order (emit socket event after API call)
 */
export function placeOrder(orderData: {
  orderId: string;
  restaurantId: string;
  userId: string;
  items: Array<{
    id: string;
    name: string;
    quantity: number;
    price: number;
  }>;
  total: number;
  deliveryAddress?: {
    street: string;
    city: string;
    zipCode: string;
  };
}): void {
  if (!socketClient?.isConnected()) {
    console.error('❌ Socket not connected. Cannot send order notification.');
    toast.error('Not connected to server. Order placed but restaurant may not be notified immediately.', {
      duration: 3000,
    });
    return;
  }

  console.log('📤 Sending order notification to restaurant...');
  socketClient.placeOrder(orderData);
}

/**
 * Cancel an order
 */
export function cancelOrder(orderId: string): void {
  if (!socketClient?.isConnected()) {
    console.error('❌ Socket not connected. Cannot send cancellation notification.');
    toast.error('Not connected to server. Please refresh and try again.', {
      duration: 3000,
    });
    return;
  }

  console.log('📤 Sending order cancellation...');
  socketClient.cancelOrder(orderId);
}

/**
 * Disconnect socket (call on logout)
 */
export function disconnectUserSocket(): void {
  if (socketClient) {
    console.log('Disconnecting user socket...');
    socketClient.disconnect();
    socketClient = null;
    orderUpdateCallbacks.length = 0;
  }
}

/**
 * Check if socket is connected
 */
export function isSocketConnected(): boolean {
  return socketClient?.isConnected() ?? false;
}

/**
 * Get connection status details
 */
export function getConnectionStatus(): {
  connected: boolean;
  reconnectAttempts: number;
  isConnecting: boolean;
} | null {
  return socketClient?.getConnectionStatus() ?? null;
}

/**
 * Manually reconnect socket
 */
export async function reconnectSocket(token: string): Promise<void> {
  console.log('Manual reconnection requested...');
  
  // Disconnect existing connection
  if (socketClient) {
    socketClient.disconnect();
    socketClient = null;
  }
  
  // Reconnect
  try {
    await initUserSocket(token);
    toast.success('Reconnected to server', { duration: 2000 });
  } catch (error) {
    toast.error('Failed to reconnect. Please refresh the page.', {
      duration: 5000,
    });
    throw error;
  }
}