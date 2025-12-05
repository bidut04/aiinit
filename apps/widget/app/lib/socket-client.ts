import { OrderSocketClient } from '@workspace/socket-client';

let socketClient: OrderSocketClient | null = null;

export function initRestaurantSocket(token: string) {
  if (socketClient) return socketClient;

  socketClient = new OrderSocketClient(
    process.env.NEXT_PUBLIC_SOCKET_URL || 'http://localhost:4000',
    token
  );

  socketClient.connect('restaurant');

interface OrderData {
    orderId: string | number;
    [key: string]: unknown;
}

socketClient.onNewOrder((data: OrderData) => {
    console.log('New order received!', data);
    alert(`New order! #${data.orderId}`);
});

return socketClient;
}

export function getRestaurantSocket(): OrderSocketClient | null {
    return socketClient;
}
