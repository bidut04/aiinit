// apps/user/app/providers/SocketProvider.tsx
'use client';

import { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { useSession } from 'next-auth/react';
import { 
  initUserSocket, 
  disconnectUserSocket, 
  isSocketConnected,
  getConnectionStatus,
  reconnectSocket 
} from '@/app/socketComponent/client';
import { OrderSocketClient } from '@workspace/socket-client';

interface SocketContextType {
  socket: OrderSocketClient | null;
  isConnected: boolean;
  isConnecting: boolean;
  reconnect: () => Promise<void>;
}

const SocketContext = createContext<SocketContextType>({
  socket: null,
  isConnected: false,
  isConnecting: false,
  reconnect: async () => {},
});

export function useSocket() {
  const context = useContext(SocketContext);
  if (!context) {
    throw new Error('useSocket must be used within SocketProvider');
  }
  return context;
}

interface SocketProviderProps {
  children: ReactNode;
}

export function SocketProvider({ children }: SocketProviderProps) {
  const { data: session, status } = useSession();
  const [socket, setSocket] = useState<OrderSocketClient | null>(null);
  const [isConnected, setIsConnected] = useState(false);
  const [isConnecting, setIsConnecting] = useState(false);

  // Initialize socket when user is authenticated
  useEffect(() => {
    async function connectSocket() {
      // Only connect if user is authenticated and has a token
      if (status === 'authenticated' && session?.user?.token) {
        try {
          setIsConnecting(true);
          console.log('🔌 Initializing socket connection...');
          
          const client = await initUserSocket(session.user.token);
          setSocket(client);
          setIsConnected(true);
          
          console.log('✅ Socket connection established');
        } catch (error) {
          console.error('❌ Socket connection failed:', error);
          setIsConnected(false);
        } finally {
          setIsConnecting(false);
        }
      }
    }

    connectSocket();

    // Cleanup on unmount or logout
    return () => {
      if (status !== 'authenticated') {
        console.log('🔌 Disconnecting socket (user logged out)');
        disconnectUserSocket();
        setSocket(null);
        setIsConnected(false);
      }
    };
  }, [session?.user?.token, status]);

  // Check connection status periodically
  useEffect(() => {
    if (!socket) return;

    const interval = setInterval(() => {
      const connected = isSocketConnected();
      if (connected !== isConnected) {
        console.log(`🔌 Socket status changed: ${connected ? 'connected' : 'disconnected'}`);
        setIsConnected(connected);
      }
    }, 5000); // Check every 5 seconds

    return () => clearInterval(interval);
  }, [socket, isConnected]);

  // Manual reconnect function
  const handleReconnect = async () => {
    if (!session?.user?.token) {
      console.error('Cannot reconnect: No auth token available');
      return;
    }

    try {
      setIsConnecting(true);
      await reconnectSocket(session.user.token);
      setIsConnected(true);
    } catch (error) {
      console.error('Reconnection failed:', error);
    } finally {
      setIsConnecting(false);
    }
  };

  return (
    <SocketContext.Provider
      value={{
        socket,
        isConnected,
        isConnecting,
        reconnect: handleReconnect,
      }}
    >
      {children}
    </SocketContext.Provider>
  );
}

// Connection Status Indicator Component (optional)
export function SocketConnectionIndicator() {
  const { isConnected, isConnecting, reconnect } = useSocket();

  // Don't show anything if connected
  if (isConnected) return null;

  return (
    <div className="fixed bottom-4 right-4 z-50">
      <div className="bg-yellow-500 text-white px-4 py-2 rounded-lg shadow-lg flex items-center gap-3">
        {isConnecting ? (
          <>
            <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent" />
            <span>Connecting...</span>
          </>
        ) : (
          <>
            <div className="h-2 w-2 bg-red-500 rounded-full animate-pulse" />
            <span>Disconnected</span>
            <button
              onClick={reconnect}
              className="ml-2 px-3 py-1 bg-white text-yellow-600 rounded hover:bg-gray-100"
            >
              Reconnect
            </button>
          </>
        )}
      </div>
    </div>
  );
}
