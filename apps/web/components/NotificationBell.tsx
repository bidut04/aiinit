'use client';

import { useEffect, useState } from 'react';
import { Bell } from 'lucide-react';
import { useNotifications } from '@/hooks/useNotifications';
import { useRouter } from 'next/navigation';

export function NotificationBell() {
  const router = useRouter();
  const { notifications, connected } = useNotifications();
  const [unreadCount, setUnreadCount] = useState(0);
  const [showDropdown, setShowDropdown] = useState(false);

  useEffect(() => {
    // Fetch initial unread count
    fetch('/api/notifications/count')
      .then(res => res.json())
      .then(data => setUnreadCount(data.count));
  }, []);

  useEffect(() => {
    setUnreadCount(prev => prev + notifications.length);
  }, [notifications]);

  const markAllAsRead = async () => {
    await fetch('/api/notifications/mark-read', { method: 'POST' });
    setUnreadCount(0);
    router.refresh();
  };

  return (
    <div className="relative">
      <button
        onClick={() => setShowDropdown(!showDropdown)}
        className="relative p-2 hover:bg-gray-100 rounded-full transition"
      >
        <Bell size={24} className="text-gray-600" />
        {unreadCount > 0 && (
          <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center font-semibold">
            {unreadCount > 9 ? '9+' : unreadCount}
          </span>
        )}
        {connected && (
          <span className="absolute bottom-0 right-0 w-3 h-3 bg-green-500 rounded-full border-2 border-white"></span>
        )}
      </button>

      {showDropdown && (
        <div className="absolute right-0 mt-2 w-96 bg-white rounded-lg shadow-xl border z-50 max-h-[500px] overflow-hidden flex flex-col">
          <div className="p-4 border-b flex items-center justify-between">
            <h3 className="font-semibold text-lg">Notifications</h3>
            {unreadCount > 0 && (
              <button
                onClick={markAllAsRead}
                className="text-sm text-blue-600 hover:text-blue-700"
              >
                Mark all read
              </button>
            )}
          </div>
          
          <div className="overflow-y-auto flex-1">
            {notifications.length === 0 ? (
              <div className="p-8 text-center text-gray-500">
                <Bell className="mx-auto mb-2 text-gray-300" size={48} />
                <p>No new notifications</p>
              </div>
            ) : (
              notifications.map((notif, idx) => (
                <div
                  key={idx}
                  onClick={() => {
                    router.push(`/admin/applications/${notif.applicationId}`);
                    setShowDropdown(false);
                  }}
                  className="p-4 border-b hover:bg-blue-50 cursor-pointer transition"
                >
                  <div className="flex items-start gap-3">
                    <div className="w-10 h-10 bg-orange-100 rounded-full flex items-center justify-center flex-shrink-0">
                      🏪
                    </div>
                    <div className="flex-1 min-w-0">
                      <h4 className="font-semibold text-sm">New Restaurant Application</h4>
                      <p className="text-sm text-gray-600 truncate">
                        {notif.restaurantName} by {notif.ownerName}
                      </p>
                      <p className="text-xs text-gray-400 mt-1">
                        {new Date(notif.submittedAt!).toLocaleString()}
                      </p>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
}