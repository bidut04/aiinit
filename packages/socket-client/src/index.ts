import { io, Socket } from 'socket.io-client';

export class OrderSocketClient {
  private socket: Socket | null = null;
  private reconnectAttempts = 0;
  private maxReconnectAttempts = 5;

  constructor(
    private serverUrl: string,
    private token: string
  ) {}

  // FIXED: Added closing parenthesis for userType parameter and proper string template
  connect(userType: 'CUSTOMER' | 'RESTAURANT_OWNER' | 'SUPERADMIN' | 'DELIVERY_PARTNER') {
    this.socket = io(`${this.serverUrl}/orders`, {
      auth: { token: this.token },
      reconnection: true,
      reconnectionDelay: 1000,
      reconnectionDelayMax: 5000,
      reconnectionAttempts: this.maxReconnectAttempts,
    });

    this.setupListeners();
    return this.socket;
  }

  private setupListeners() {
    if (!this.socket) return;

    this.socket.on('connect', () => {
      console.log('Socket connected');
      this.reconnectAttempts = 0;
    });

    this.socket.on('disconnect', (reason) => {
      console.log('Socket disconnected:', reason);
    });

    this.socket.on('connect_error', (error) => {
      console.error('Connection error:', error);
      this.reconnectAttempts++;
      
      if (this.reconnectAttempts >= this.maxReconnectAttempts) {
        console.error('Max reconnection attempts reached');
      }
    });
  }

  // Customer methods
  placeOrder(orderData: any) {
    this.socket?.emit('order:placed', orderData);
  }

  onOrderConfirmed(callback: (data: any) => void) {
    this.socket?.on('order:confirmed', callback);
  }

  onOrderAccepted(callback: (data: any) => void) {
    this.socket?.on('order:accepted', callback);
  }

  onOrderRejected(callback: (data: any) => void) {
    this.socket?.on('order:rejected', callback);
  }

  onOrderStatusUpdate(callback: (data: any) => void) {
    this.socket?.on('order:status_update', callback);
  }

  // Restaurant methods
  onNewOrder(callback: (data: any) => void) {
    this.socket?.on('order:new', callback);
  }

  acceptOrder(orderId: string, userId: string, estimatedTime: number) {
    this.socket?.emit('order:accept', { orderId, userId, estimatedTime });
  }

  rejectOrder(orderId: string, userId: string, reason?: string) {
    this.socket?.emit('order:reject', { orderId, userId, reason });
  }

  updateOrderStatus(orderId: string, userId: string, status: string, details?: any) {
    this.socket?.emit('order:update_status', { orderId, userId, status, details });
  }

  onActionConfirmed(callback: (data: any) => void) {
    this.socket?.on('order:action_confirmed', callback);
  }

  // Error handling
  onError(callback: (data: any) => void) {
    this.socket?.on('order:error', callback);
  }

  // Cleanup
  disconnect() {
    this.socket?.removeAllListeners();
    this.socket?.disconnect();
    this.socket = null;
  }
}