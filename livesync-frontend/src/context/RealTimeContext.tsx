import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { ConnectionStatus, RealTimeEvent, OrderStatus } from '../types';
import { subscriptionService } from '../services/subscriptionService';
import { isAppSyncConfigured } from '../api/appSyncClient';

interface RealTimeContextType {
  connectionStatus: ConnectionStatus;
  isSubscriptionActive: boolean;
  eventsReceivedCount: number;
  lastEvent: RealTimeEvent | null;
  liveEvents: RealTimeEvent[];
  isMockMode: boolean;
  endpoint: string;
  region: string;
  latencyMs: number;
  reconnect: () => Promise<void>;
  simulateMutationEvent: (
    type: RealTimeEvent['type'],
    orderId?: string,
    message?: string,
    options?: { previousStatus?: OrderStatus; newStatus?: OrderStatus; payload?: Record<string, unknown> }
  ) => void;
  clearEvents: () => void;
}

const RealTimeContext = createContext<RealTimeContextType | undefined>(undefined);

export const RealTimeProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [connectionStatus, setConnectionStatus] = useState<ConnectionStatus>('CONNECTING');
  const [isSubscriptionActive, setIsSubscriptionActive] = useState<boolean>(false);
  const [eventsReceivedCount, setEventsReceivedCount] = useState<number>(0);
  const [lastEvent, setLastEvent] = useState<RealTimeEvent | null>(null);
  const [liveEvents, setLiveEvents] = useState<RealTimeEvent[]>([]);
  const [latencyMs, setLatencyMs] = useState<number>(24);

  const isMockMode = import.meta.env.VITE_USE_MOCK_DATA !== 'false' || !isAppSyncConfigured();
  const endpoint = import.meta.env.VITE_APPSYNC_ENDPOINT || 'https://mock-appsync-api.us-east-1.amazonaws.com/graphql';
  const region = import.meta.env.VITE_AWS_REGION || 'us-east-1';

  // Initialize and connect subscription listener
  useEffect(() => {
    setConnectionStatus('CONNECTING');

    const connectTimer = setTimeout(() => {
      setConnectionStatus('CONNECTED');
      setIsSubscriptionActive(true);
    }, 600);

    // Initial events history
    const initialEvents = subscriptionService.getRecentEvents();
    setLiveEvents(initialEvents);
    if (initialEvents.length > 0) {
      setLastEvent(initialEvents[0]);
      setEventsReceivedCount(initialEvents.length);
    }

    // Subscribe to live events
    const unsubscribe = subscriptionService.subscribeToLiveEvents((event: RealTimeEvent) => {
      setLastEvent(event);
      setEventsReceivedCount((prev) => prev + 1);
      setLiveEvents((prev) => [event, ...prev].slice(0, 100));
      // jitter latency slightly between 16ms and 38ms
      setLatencyMs(Math.floor(Math.random() * 22) + 16);
    });

    return () => {
      clearTimeout(connectTimer);
      unsubscribe();
    };
  }, []);

  const reconnect = useCallback(async () => {
    setConnectionStatus('RECONNECTING');
    setIsSubscriptionActive(false);

    await new Promise((resolve) => setTimeout(resolve, 800));

    setConnectionStatus('CONNECTED');
    setIsSubscriptionActive(true);
  }, []);

  const simulateMutationEvent = useCallback(
    (
      type: RealTimeEvent['type'],
      orderId?: string,
      message?: string,
      options?: { previousStatus?: OrderStatus; newStatus?: OrderStatus; payload?: Record<string, unknown> }
    ) => {
      subscriptionService.triggerSimulatedEvent(type, orderId, message, options);
    },
    []
  );

  const clearEvents = useCallback(() => {
    setLiveEvents([]);
    setEventsReceivedCount(0);
    setLastEvent(null);
  }, []);

  return (
    <RealTimeContext.Provider
      value={{
        connectionStatus,
        isSubscriptionActive,
        eventsReceivedCount,
        lastEvent,
        liveEvents,
        isMockMode,
        endpoint,
        region,
        latencyMs,
        reconnect,
        simulateMutationEvent,
        clearEvents,
      }}
    >
      {children}
    </RealTimeContext.Provider>
  );
};

export const useRealTime = (): RealTimeContextType => {
  const context = useContext(RealTimeContext);
  if (!context) {
    throw new Error('useRealTime must be used within a RealTimeProvider');
  }
  return context;
};
