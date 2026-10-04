import { RealTimeEvent, OrderStatus } from '../../types';
import { INITIAL_REALTIME_EVENTS } from '../../data/mockInitialData';
import { getItem, setItem } from '../../utils/storage';

const STORAGE_EVENTS_KEY = 'livesync_events';

type EventListener = (event: RealTimeEvent) => void;

class MockSubscriptionService {
  private listeners: Set<EventListener> = new Set();
  private broadcastChannel: BroadcastChannel | null = null;
  private isConnected: boolean = true;

  constructor() {
    // Initialize events from storage if available
    const existing = getItem<RealTimeEvent[]>(STORAGE_EVENTS_KEY, []);
    if (existing.length === 0) {
      setItem(STORAGE_EVENTS_KEY, INITIAL_REALTIME_EVENTS);
    }

    // Set up cross-tab real-time communication via BroadcastChannel
    try {
      if (typeof window !== 'undefined' && 'BroadcastChannel' in window) {
        this.broadcastChannel = new BroadcastChannel('livesync_appsync_mock_bus');
        this.broadcastChannel.onmessage = (messageEvent) => {
          if (messageEvent.data && messageEvent.data.type === 'APPSYNC_SUBSCRIPTION_EVENT') {
            const event: RealTimeEvent = messageEvent.data.payload;
            this.notifyListenersLocally(event);
          }
        };
      }
    } catch (e) {
      console.warn('BroadcastChannel not supported or failed to initialize:', e);
    }

    // Also listen to window CustomEvent for in-memory same-window events
    if (typeof window !== 'undefined') {
      window.addEventListener('livesync:local_event', (e: Event) => {
        const customEvent = e as CustomEvent<RealTimeEvent>;
        if (customEvent.detail) {
          this.notifyListenersLocally(customEvent.detail);
        }
      });
    }
  }

  public getEvents(): RealTimeEvent[] {
    return getItem<RealTimeEvent[]>(STORAGE_EVENTS_KEY, INITIAL_REALTIME_EVENTS);
  }

  public subscribeToLiveEvents(callback: EventListener): () => void {
    this.listeners.add(callback);
    return () => {
      this.listeners.delete(callback);
    };
  }

  public subscribeToOrderUpdates(orderId: string | null, callback: (event: RealTimeEvent) => void): () => void {
    const orderListener: EventListener = (evt) => {
      if (!orderId || evt.orderId === orderId) {
        callback(evt);
      }
    };
    this.listeners.add(orderListener);
    return () => {
      this.listeners.delete(orderListener);
    };
  }

  public emitEvent(
    type: RealTimeEvent['type'],
    orderId?: string,
    message?: string,
    options?: {
      previousStatus?: OrderStatus;
      newStatus?: OrderStatus;
      payload?: Record<string, unknown>;
    }
  ): RealTimeEvent {
    const newEvent: RealTimeEvent = {
      id: `evt-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
      type,
      orderId,
      previousStatus: options?.previousStatus,
      newStatus: options?.newStatus,
      source: 'AWS AppSync GraphQL Subscription',
      timestamp: new Date().toISOString(),
      message: message || `Real-time event for order ${orderId}`,
      payload: options?.payload,
    };

    // Store in event history (keep last 50)
    const currentEvents = this.getEvents();
    const updated = [newEvent, ...currentEvents].slice(0, 50);
    setItem(STORAGE_EVENTS_KEY, updated);

    // Broadcast cross-tab
    if (this.broadcastChannel) {
      try {
        this.broadcastChannel.postMessage({
          type: 'APPSYNC_SUBSCRIPTION_EVENT',
          payload: newEvent,
        });
      } catch (err) {
        console.warn('Failed to postMessage on BroadcastChannel:', err);
      }
    }

    // Broadcast local in-page
    this.notifyListenersLocally(newEvent);

    return newEvent;
  }

  private notifyListenersLocally(event: RealTimeEvent): void {
    this.listeners.forEach((listener) => {
      try {
        listener(event);
      } catch (err) {
        console.error('Error in subscription callback:', err);
      }
    });
  }

  public isSubscriptionActive(): boolean {
    return this.isConnected;
  }

  public setConnectionState(active: boolean): void {
    this.isConnected = active;
  }
}

export const mockSubscriptionService = new MockSubscriptionService();
