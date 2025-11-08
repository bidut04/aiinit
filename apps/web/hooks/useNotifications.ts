'use client';

import { useEffect, useState } from 'react';
import { useSession } from 'next-auth/react';

interface Notification {
  type: string;
  applicationId?: string;
  restaurantName?: string;
  ownerName?: string;
  submittedAt?: string;
}

export function useNotifications() {
  const { data: session } = useSession();
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [connected, setConnected] = useState(false);

  useEffect(() => {
    if (!session?.user?.id || session.user.role !== 'SUPER_ADMIN') return;

    const eventSource = new EventSource('/api/notifications/stream');

    eventSource.onopen = () => {
      console.log('✅ SSE connected');
      setConnected(true);
    };

    eventSource.onmessage = (event) => {
      const data = JSON.parse(event.data);
      
      if (data.type === 'new-application') {
        setNotifications(prev => [data, ...prev]);
        
        // Play sound
        const audio = new Audio('/notification.mp3');
        audio.play().catch(() => {});
        
        // Browser notification
        if ('Notification' in window && Notification.permission === 'granted') {
          new Notification('New Restaurant Application', {
            body: `${data.restaurantName} by ${data.ownerName}`,
            icon: '/logo.png',
            tag: data.applicationId
          });
        }
      }
    };

    eventSource.onerror = () => {
      console.log('❌ SSE disconnected');
      setConnected(false);
      eventSource.close();
    };

    return () => {
      eventSource.close();
    };
  }, [session]);

  return { notifications, connected };
}