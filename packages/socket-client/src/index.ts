// packages/socket-client/src/index.ts
import { io, Socket } from 'socket.io-client';

// Types
export type UserType = 'CUSTOMER' | 'RESTAURANT_OWNER' | 'SUPERADMIN' | 'DELIVERY_PARTNER';

export interface OrderData {
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
}

export interface OrderStatusUpdate {
  orderId: string;
  status: string;
  details?: any;
  timestamp: string;
}

export interface OrderConfirmation {
  orderId: string;
  message: string;
  status: string;
  timestamp: string;
}

export interface OrderAcceptance {
  orderId: string;
  status: string;
  estimatedTime: number;
  message: string;
  timestamp: string;
}

export interface OrderRejection {
  orderId: string;
  status: string;
  reason: string;
  message: string;
  timestamp: string;
}

export class OrderSocketClient {
  private socket: Socket | null = null;
  private reconnectAttempts = 0;
  private maxReconnectAttempts = 5;
  private isConnecting = false;
  private connectionPromise: Promise<Socket> | null = null;

  constructor(
    private serverUrl: string,
    private token: string
  ) {}

  /**
   * Connect to socket server with async/await support
   */
  async connect(userType: UserType): Promise<Socket> {
    // Prevent multiple simultaneous connection attempts
    if (this.isConnecting && this.connectionPromise) {
      return this.connectionPromise;
    }

    // If already connected, return existing socket
    if (this.socket?.connected) {
      return this.socket;
    }

    this.isConnecting = true;

    this.connectionPromise = new Promise((resolve, reject) => {
      this.socket = io(`${this.serverUrl}/orders`, {
        auth: { token: this.token },
        reconnection: true,
        reconnectionDelay: 1000,
        reconnectionDelayMax: 5000,
        reconnectionAttempts: this.maxReconnectAttempts,
        timeout: 10000,
        transports: ['websocket', 'polling'],
      });

      this.setupListeners();

      // Resolve promise on successful connection
      this.socket.once('connect', () => {
        console.log('Socket connected successfully');
        this.reconnectAttempts = 0;
        this.isConnecting = false;
        resolve(this.socket!);
      });

      // Reject promise on connection error
      this.socket.once('connect_error', (error) => {
        console.error('Initial connection error:', error);
        this.isConnecting = false;
        reject(error);
      });

      // Timeout fallback
      setTimeout(() => {
        if (!this.socket?.connected) {
          this.isConnecting = false;
          reject(new Error('Connection timeout'));
        }
      }, 15000);
    });

    return this.connectionPromise;
  }

  /**
   * Set up socket event listeners
   */
  private setupListeners() {
    if (!this.socket) return;

    this.socket.on('connect', () => {
      console.log('Socket connected');
      this.reconnectAttempts = 0;
    });

    this.socket.on('disconnect', (reason) => {
      console.log('Socket disconnected:', reason);
      
      // Auto-reconnect logic for certain disconnection reasons
      if (reason === 'io server disconnect') {
        // Server disconnected the client, try to reconnect
        this.socket?.connect();
      }
    });

    this.socket.on('connect_error', (error) => {
      console.error('Connection error:', error.message);
      this.reconnectAttempts++;
      
      if (this.reconnectAttempts >= this.maxReconnectAttempts) {
        console.error('Max reconnection attempts reached');
        this.handleMaxReconnectAttemptsReached();
      }
    });

    this.socket.on('reconnect', (attemptNumber) => {
      console.log(`Reconnected after ${attemptNumber} attempts`);
      this.reconnectAttempts = 0;
    });

    this.socket.on('reconnect_failed', () => {
      console.error('Reconnection failed');
      this.handleMaxReconnectAttemptsReached();
    });
  }

  /**
   * Handle max reconnection attempts reached
   */
  private handleMaxReconnectAttemptsReached() {
    console.error('Unable to reconnect to server. Please refresh the page.');
    // You can emit a custom event here that your app can listen to
  }

  /**
   * Check if socket is connected
   */
  isConnected(): boolean {
    return this.socket?.connected ?? false;
  }

  // ===== CUSTOMER METHODS =====
  
  /**
   * Place a new order
   */
  placeOrder(orderData: OrderData): void {
    if (!this.socket?.connected) {
      console.error('Socket not connected. Cannot place order.');
      return;
    }
    this.socket.emit('order:placed', orderData);
  }

  /**
   * Cancel an order
   */
  cancelOrder(orderId: string): void {
    if (!this.socket?.connected) {
      console.error('Socket not connected. Cannot cancel order.');
      return;
    }
    this.socket.emit('order:cancel', { orderId });
  }

  /**
   * Listen for order confirmation
   */
  onOrderConfirmed(callback: (data: OrderConfirmation) => void): void {
    this.socket?.on('order:confirmed', callback);
  }

  /**
   * Listen for order acceptance by restaurant
   */
  onOrderAccepted(callback: (data: OrderAcceptance) => void): void {
    this.socket?.on('order:accepted', callback);
  }

  /**
   * Listen for order rejection by restaurant
   */
  onOrderRejected(callback: (data: OrderRejection) => void): void {
    this.socket?.on('order:rejected', callback);
  }

  /**
   * Listen for order status updates
   */
  onOrderStatusUpdate(callback: (data: OrderStatusUpdate) => void): void {
    this.socket?.on('order:status_update', callback);
  }

  /**
   * Listen for order cancellation
   */
  onOrderCancelled(callback: (data: any) => void): void {
    this.socket?.on('order:cancelled', callback);
  }

  /**
   * Listen for cancel confirmation
   */
  onOrderCancelConfirmed(callback: (data: any) => void): void {
    this.socket?.on('order:cancel_confirmed', callback);
  }

  // ===== RESTAURANT METHODS =====
  
  /**
   * Listen for new orders (restaurant owner)
   */
  onNewOrder(callback: (data: any) => void): void {
    this.socket?.on('order:new', callback);
  }

  /**
   * Accept an order (restaurant owner)
   */
  acceptOrder(orderId: string, userId: string, estimatedTime: number): void {
    if (!this.socket?.connected) {
      console.error('Socket not connected. Cannot accept order.');
      return;
    }
    this.socket.emit('order:accept', { orderId, userId, estimatedTime });
  }

  /**
   * Reject an order (restaurant owner)
   */
  rejectOrder(orderId: string, userId: string, reason?: string): void {
    if (!this.socket?.connected) {
      console.error('Socket not connected. Cannot reject order.');
      return;
    }
    this.socket.emit('order:reject', { orderId, userId, reason });
  }

  /**
   * Update order status (restaurant owner)
   */
  updateOrderStatus(
    orderId: string, 
    userId: string, 
    status: 'preparing' | 'ready' | 'out_for_delivery' | 'delivered', 
    details?: any
  ): void {
    if (!this.socket?.connected) {
      console.error('Socket not connected. Cannot update order status.');
      return;
    }
    this.socket.emit('order:update_status', { orderId, userId, status, details });
  }

  /**
   * Listen for action confirmation (restaurant owner)
   */
  onActionConfirmed(callback: (data: any) => void): void {
    this.socket?.on('order:action_confirmed', callback);
  }

  /**
   * Listen for update confirmation (restaurant owner)
   */
  onUpdateConfirmed(callback: (data: any) => void): void {
    this.socket?.on('order:update_confirmed', callback);
  }

  // ===== DELIVERY PARTNER METHODS =====
  
  /**
   * Update delivery location (delivery partner)
   */
  updateDeliveryLocation(orderId: string, location: { lat: number; lng: number }): void {
    if (!this.socket?.connected) {
      console.error('Socket not connected. Cannot update location.');
      return;
    }
    this.socket.emit('delivery:location_update', { orderId, location });
  }

  /**
   * Listen for delivery location updates
   */
  onDeliveryLocation(callback: (data: any) => void): void {
    this.socket?.on('delivery:location', callback);
  }

  // ===== COMMON METHODS =====
  
  /**
   * Listen for order status changes (all parties)
   */
  onOrderStatusChanged(callback: (data: OrderStatusUpdate) => void): void {
    this.socket?.on('order:status_changed', callback);
  }

  /**
   * Listen for errors
   */
  onError(callback: (data: { message: string; error?: string }) => void): void {
    this.socket?.on('order:error', callback);
  }

  /**
   * Remove a specific event listener
   */
  off(event: string, callback?: (...args: any[]) => void): void {
    if (callback) {
      this.socket?.off(event, callback);
    } else {
      this.socket?.off(event);
    }
  }

  /**
   * Disconnect and cleanup
   */
  disconnect(): void {
    if (this.socket) {
      this.socket.removeAllListeners();
      this.socket.disconnect();
      this.socket = null;
      this.connectionPromise = null;
      this.isConnecting = false;
      this.reconnectAttempts = 0;
    }
  }

  /**
   * Get raw socket instance for advanced usage
   */
  getSocket(): Socket | null {
    return this.socket;
  }

  /**
   * Manually trigger reconnection
   */
  reconnect(): void {
    if (this.socket && !this.socket.connected) {
      this.reconnectAttempts = 0;
      this.socket.connect();
    }
  }
}