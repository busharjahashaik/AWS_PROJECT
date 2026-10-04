import { RealTimeEvent, RealTimeEventType, OrderStatus, Order } from '../types';
import { mockSubscriptionService } from './mock/mockSubscriptionService';
import { AppSyncWebSocketSubscription, isAppSyncConfigured } from '../api/appSyncClient';
import { ON_ORDER_EVENT } from '../api/subscriptions';

const USE_MOCK_DATA = import.meta.env.VITE_USE_MOCK_DATA !== 'false';

type Listener = (event: RealTimeEvent) => void;

// --- Live mode: ONE shared AppSync WebSocket, fanned out to every listener --------------------

const listeners = new Set<Listener>();
let connection: AppSyncWebSocketSubscription | null = null;

/** Turn the AppSync "OrderEvent" into the RealTimeEvent shape the UI already understands. */
function toRealTimeEvent(raw: any): RealTimeEvent | null {
  const e = raw?.onOrderEvent;
  if (!e) return null;

  let order: Order | null = null;
  try {
    order = typeof e.orderJson === 'string' ? JSON.parse(e.orderJson) : e.orderJson;
  } catch {
    order = null;
  }

  const known: RealTimeEventType[] = ['ORDER_CREATED', 'ORDER_STATUS_CHANGED', 'DELIVERY_ASSIGNED'];
  const type: RealTimeEventType = known.includes(e.eventType) ? e.eventType : 'ORDER_UPDATED';
  const id = e.orderId as string;

  let message = `Order ${id} updated`;
  let payload: unknown = order;
  if (type === 'ORDER_CREATED') {
    message = `New order ${id} created by ${order?.customerName ?? 'a customer'}`;
  } else if (type === 'ORDER_STATUS_CHANGED') {
    message = `Order ${id} status updated: ${e.previousStatus ?? '?'} → ${e.orderStatus}`;
  } else if (type === 'DELIVERY_ASSIGNED') {
    message = `Delivery partner ${order?.deliveryPartnerName ?? ''} assigned to order ${id}`.replace('  ', ' ');
    payload = order
      ? {
          order,
          partner: {
            deliveryPartnerId: order.deliveryPartnerId,
            name: order.deliveryPartnerName,
            phone: order.deliveryPartnerPhone,
          },
        }
      : null;
  }

  return {
    id: `appsync-${id}-${Date.now()}`,
    type,
    orderId: id,
    previousStatus: (e.previousStatus ?? undefined) as OrderStatus | undefined,
    newStatus: e.orderStatus as OrderStatus,
    source: 'AWS AppSync GraphQL Subscription',
    timestamp: e.timestamp || new Date().toISOString(),
    message,
    payload: (payload ?? undefined) as Record<string, unknown> | undefined,
  };
}

function ensureConnection(): void {
  if (connection) return;
  connection = new AppSyncWebSocketSubscription(
    ON_ORDER_EVENT,
    {},
    (data: unknown) => {
      const event = toRealTimeEvent(data);
      if (event) listeners.forEach((l) => l(event));
    },
    (err) => console.warn('[AppSync]', err.message)
  );
  connection.connect();
}

function addLiveListener(listener: Listener): () => void {
  listeners.add(listener);
  ensureConnection();
  return () => {
    listeners.delete(listener);
    if (listeners.size === 0 && connection) {
      connection.unsubscribe();
      connection = null;
    }
  };
}

const useMock = () => USE_MOCK_DATA;
const liveReady = () => !USE_MOCK_DATA && isAppSyncConfigured();

export const subscriptionService = {
  /**
   * Subscribes to all real-time events across the platform (Live Events stream).
   * Mock mode: in-browser simulation. Live mode: AWS AppSync (if configured), otherwise a no-op
   * (the app then falls back to polling, see OrderContext).
   */
  subscribeToLiveEvents(callback: (event: RealTimeEvent) => void): () => void {
    if (useMock()) return mockSubscriptionService.subscribeToLiveEvents(callback);
    if (!liveReady()) return () => {};
    return addLiveListener(callback);
  },

  /**
   * Subscribes to updates for a specific order or any order
   */
  subscribeToOrderUpdates(orderId: string | null, callback: (event: RealTimeEvent) => void): () => void {
    if (useMock()) return mockSubscriptionService.subscribeToOrderUpdates(orderId, callback);
    if (!liveReady()) return () => {};
    return addLiveListener((event) => {
      if (!orderId || event.orderId === orderId) callback(event);
    });
  },

  getRecentEvents(): RealTimeEvent[] {
    if (useMock()) return mockSubscriptionService.getEvents();
    return [];
  },

  triggerSimulatedEvent(
    type: RealTimeEvent['type'],
    orderId?: string,
    message?: string,
    options?: { previousStatus?: OrderStatus; newStatus?: OrderStatus; payload?: Record<string, unknown> }
  ): RealTimeEvent {
    return mockSubscriptionService.emitEvent(type, orderId, message, options);
  },
};
