import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { Order, OrderStatus, RealTimeEvent, User } from '../types';
import { orderService, CreateOrderDTO } from '../services/orderService';
import { subscriptionService } from '../services/subscriptionService';
import { isAppSyncConfigured } from '../api/appSyncClient';
import { useAuth } from './AuthContext';
import { useNotifications } from './NotificationContext';
import { formatCurrency } from '../utils/formatters';

const USE_MOCK_DATA = import.meta.env.VITE_USE_MOCK_DATA !== 'false';

// With AppSync connected, polling is only a safety net. Without it, polling IS the sync mechanism.
const POLL_INTERVAL_MS = isAppSyncConfigured() ? 30000 : 5000;

interface OrderContextType {
  orders: Order[];
  isLoading: boolean;
  error: string | null;
  fetchOrders: () => Promise<void>;
  createOrder: (input: Omit<CreateOrderDTO, 'customerId' | 'customerName'>) => Promise<Order>;
  updateOrderStatus: (orderId: string, newStatus: OrderStatus) => Promise<Order>;
  assignDeliveryPartner: (orderId: string, partnerId: string, partnerName: string) => Promise<Order>;
  getOrderById: (orderId: string) => Order | undefined;
}

const OrderContext = createContext<OrderContextType | undefined>(undefined);

/** The full order carried by a real-time event (plain order, or { order, partner }). */
const orderFromEvent = (event: RealTimeEvent): Order | undefined => {
  const p = event.payload as any;
  return (p?.order ?? p) as Order | undefined;
};

/** Live mode only: AppSync broadcasts every event, so each user keeps just the ones that concern them. */
const isRelevantTo = (user: User, order?: Order): boolean => {
  if (!order) return false;
  if (user.role === 'ADMIN') return true;
  if (user.role === 'CUSTOMER') return order.customerId === user.id;
  return order.deliveryPartnerId === user.id;
};

export const OrderProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [orders, setOrders] = useState<Order[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  const { user } = useAuth();
  const { addNotification } = useNotifications();

  const loadOrders = useCallback(
    async (silent: boolean) => {
      // Live mode: the backend needs a signed-in user to know which orders to return.
      if (!USE_MOCK_DATA && !user) {
        setOrders([]);
        setIsLoading(false);
        return;
      }
      if (!silent) setIsLoading(true);
      try {
        const data = await orderService.getOrders();
        setOrders(data);
        setError(null);
      } catch (err: any) {
        console.error('Failed to load orders:', err);
        if (!silent) setError(err.message || 'Failed to fetch orders.');
      } finally {
        if (!silent) setIsLoading(false);
      }
    },
    [user?.id] // eslint-disable-line react-hooks/exhaustive-deps
  );

  const fetchOrders = useCallback(() => loadOrders(false), [loadOrders]);

  // Load on start and whenever a different user signs in.
  useEffect(() => {
    loadOrders(false);
  }, [loadOrders]);

  // Live mode: keep shared order state fresh (fast poll without AppSync, slow safety poll with it).
  useEffect(() => {
    if (USE_MOCK_DATA || !user) return;
    const timer = setInterval(() => loadOrders(true), POLL_INTERVAL_MS);
    return () => clearInterval(timer);
  }, [user?.id, loadOrders]); // eslint-disable-line react-hooks/exhaustive-deps

  // Real-time synchronization via GraphQL subscription
  useEffect(() => {
    if (!USE_MOCK_DATA && !user) return;

    const unsubscribe = subscriptionService.subscribeToLiveEvents((event: RealTimeEvent) => {
      if (!USE_MOCK_DATA && user && !isRelevantTo(user, orderFromEvent(event))) return;

      if (event.type === 'ORDER_CREATED' && event.payload) {
        const createdOrder = event.payload as unknown as Order;
        setOrders((prev) => {
          if (prev.some((o) => o.orderId === createdOrder.orderId)) return prev;
          return [createdOrder, ...prev];
        });

        addNotification({
          title: `New Order Created (${createdOrder.orderId})`,
          message: `${createdOrder.customerName} placed an order for ${formatCurrency(createdOrder.totalAmount)}.`,
          type: 'info',
          orderId: createdOrder.orderId,
          source: event.source,
          targetRole: 'ALL',
        });
      } else if (event.type === 'ORDER_STATUS_CHANGED' && event.orderId) {
        const fullOrder = !USE_MOCK_DATA ? orderFromEvent(event) : undefined;

        setOrders((prev) => {
          // Live mode: the server sends the complete, authoritative order.
          if (fullOrder) {
            return prev.some((o) => o.orderId === fullOrder.orderId)
              ? prev.map((o) => (o.orderId === fullOrder.orderId ? fullOrder : o))
              : [fullOrder, ...prev];
          }
          return prev.map((order) => {
            if (order.orderId === event.orderId) {
              const updatedStatus = event.newStatus || order.orderStatus;
              return {
                ...order,
                orderStatus: updatedStatus,
                updatedAt: event.timestamp,
                estimatedDeliveryTime:
                  updatedStatus === 'OUT_FOR_DELIVERY'
                    ? '15-20 mins'
                    : updatedStatus === 'DELIVERED'
                    ? 'Delivered'
                    : order.estimatedDeliveryTime,
                paymentStatus: updatedStatus === 'DELIVERED' ? 'PAID' : order.paymentStatus,
              };
            }
            return order;
          });
        });

        addNotification({
          title: `🔔 Live Update: Order ${event.orderId}`,
          message: `Status transitioned to ${event.newStatus?.replace(/_/g, ' ')}.`,
          type: event.newStatus === 'DELIVERED' ? 'success' : 'info',
          orderId: event.orderId,
          source: event.source,
          targetRole: 'ALL',
        });
      } else if (event.type === 'DELIVERY_ASSIGNED' && event.orderId && event.payload) {
        const { order: assignedOrder, partner } = event.payload as { order: Order; partner: any };
        setOrders((prev) => {
          if (!USE_MOCK_DATA && assignedOrder) {
            return prev.some((o) => o.orderId === assignedOrder.orderId)
              ? prev.map((o) => (o.orderId === assignedOrder.orderId ? assignedOrder : o))
              : [assignedOrder, ...prev];
          }
          return prev.map((o) => {
            if (o.orderId === event.orderId) {
              return {
                ...o,
                deliveryPartnerId: partner.deliveryPartnerId,
                deliveryPartnerName: partner.name,
                deliveryPartnerPhone: partner.phone,
                orderStatus: o.orderStatus === 'PLACED' ? 'CONFIRMED' : o.orderStatus,
                updatedAt: event.timestamp,
              };
            }
            return o;
          });
        });

        addNotification({
          title: `Delivery Assigned (${event.orderId})`,
          message: `${partner.name} was assigned to deliver order ${event.orderId}.`,
          type: 'info',
          orderId: event.orderId,
          source: event.source,
          targetRole: 'ALL',
        });
      }
    });

    return () => unsubscribe();
  }, [addNotification, user]);

  const createOrder = async (input: Omit<CreateOrderDTO, 'customerId' | 'customerName'>): Promise<Order> => {
    if (!user) {
      throw new Error('Must be logged in as a customer to create an order.');
    }

    const payload: CreateOrderDTO = {
      ...input,
      customerId: user.id,
      customerName: user.name,
      customerEmail: user.email,
      customerPhone: user.phone || input.contactNumber,
    };

    const newOrder = await orderService.createOrder(payload);
    setOrders((prev) => [newOrder, ...prev.filter((o) => o.orderId !== newOrder.orderId)]);
    return newOrder;
  };

  const updateOrderStatus = async (orderId: string, newStatus: OrderStatus): Promise<Order> => {
    if (!user) throw new Error('Authentication required.');

    const updated = await orderService.updateOrderStatus(orderId, newStatus, {
      id: user.id,
      name: user.name,
      role: user.role,
    });
    setOrders((prev) => prev.map((o) => (o.orderId === orderId ? updated : o)));
    return updated;
  };

  const assignDeliveryPartner = async (
    orderId: string,
    partnerId: string,
    partnerName: string
  ): Promise<Order> => {
    if (!user) throw new Error('Authentication required.');

    const updated = await orderService.assignDeliveryPartner(orderId, partnerId, partnerName, {
      id: user.id,
      name: user.name,
    });
    setOrders((prev) => prev.map((o) => (o.orderId === orderId ? updated : o)));
    return updated;
  };

  const getOrderById = (orderId: string): Order | undefined => {
    return orders.find((o) => o.orderId === orderId);
  };

  return (
    <OrderContext.Provider
      value={{
        orders,
        isLoading,
        error,
        fetchOrders,
        createOrder,
        updateOrderStatus,
        assignDeliveryPartner,
        getOrderById,
      }}
    >
      {children}
    </OrderContext.Provider>
  );
};

export const useOrders = (): OrderContextType => {
  const context = useContext(OrderContext);
  if (!context) {
    throw new Error('useOrders must be used within an OrderProvider');
  }
  return context;
};
