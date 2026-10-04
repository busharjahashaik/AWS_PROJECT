import React, { createContext, useContext, useState, useCallback } from 'react';
import { NotificationItem, UserRole } from '../types';

interface NotificationContextType {
  notifications: NotificationItem[];
  activeToasts: NotificationItem[];
  addNotification: (item: Omit<NotificationItem, 'id' | 'timestamp' | 'read'>) => void;
  dismissToast: (id: string) => void;
  markAsRead: (id: string) => void;
  markAllAsRead: () => void;
  unreadCount: number;
}

const NotificationContext = createContext<NotificationContextType | undefined>(undefined);

export const NotificationProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [notifications, setNotifications] = useState<NotificationItem[]>([
    {
      id: 'notif-init-1',
      title: 'AppSync Subscription Active',
      message: 'Real-time WebSocket subscription established successfully.',
      type: 'info',
      read: true,
      timestamp: new Date(Date.now() - 1000 * 60 * 15).toISOString(),
      source: 'AWS AppSync Subscription',
    },
    {
      id: 'notif-init-2',
      title: 'Order Status Update',
      message: 'Order ORD-1050 transitioned to OUT_FOR_DELIVERY.',
      type: 'success',
      read: false,
      timestamp: new Date(Date.now() - 1000 * 60 * 5).toISOString(),
      orderId: 'ORD-1050',
      source: 'AWS AppSync Subscription',
    },
  ]);

  const [activeToasts, setActiveToasts] = useState<NotificationItem[]>([]);

  const addNotification = useCallback((item: Omit<NotificationItem, 'id' | 'timestamp' | 'read'>) => {
    const newItem: NotificationItem = {
      ...item,
      id: `notif-${Date.now()}-${Math.random().toString(36).substring(2, 5)}`,
      timestamp: new Date().toISOString(),
      read: false,
    };

    setNotifications((prev) => [newItem, ...prev].slice(0, 50));
    setActiveToasts((prev) => [newItem, ...prev].slice(0, 4));

    // Auto dismiss toast after 6 seconds
    setTimeout(() => {
      setActiveToasts((current) => current.filter((t) => t.id !== newItem.id));
    }, 6000);
  }, []);

  const dismissToast = useCallback((id: string) => {
    setActiveToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  const markAsRead = useCallback((id: string) => {
    setNotifications((prev) =>
      prev.map((n) => (n.id === id ? { ...n, read: true } : n))
    );
  }, []);

  const markAllAsRead = useCallback(() => {
    setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
  }, []);

  const unreadCount = notifications.filter((n) => !n.read).length;

  return (
    <NotificationContext.Provider
      value={{
        notifications,
        activeToasts,
        addNotification,
        dismissToast,
        markAsRead,
        markAllAsRead,
        unreadCount,
      }}
    >
      {children}
    </NotificationContext.Provider>
  );
};

export const useNotifications = (): NotificationContextType => {
  const context = useContext(NotificationContext);
  if (!context) {
    throw new Error('useNotifications must be used within a NotificationProvider');
  }
  return context;
};
