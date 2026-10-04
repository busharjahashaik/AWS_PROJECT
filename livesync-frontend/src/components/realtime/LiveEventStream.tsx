import React, { useState } from 'react';
import { useRealTime } from '../../hooks';
import { LiveEventCard } from './LiveEventCard';
import { EmptyState } from '../common/EmptyState';
import { Radio, Search, Trash2, Filter, Sparkles } from 'lucide-react';
import { Button } from '../common/Button';

export const LiveEventStream: React.FC<{
  maxItems?: number;
  showControls?: boolean;
  filterOrderId?: string;
}> = ({ maxItems = 10, showControls = true, filterOrderId }) => {
  const { liveEvents, clearEvents, simulateMutationEvent } = useRealTime();
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedType, setSelectedType] = useState<string>('ALL');

  let filtered = liveEvents;

  if (filterOrderId) {
    filtered = filtered.filter((e) => e.orderId === filterOrderId);
  }

  if (searchTerm) {
    filtered = filtered.filter(
      (e) =>
        e.message.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (e.orderId && e.orderId.toLowerCase().includes(searchTerm.toLowerCase()))
    );
  }

  if (selectedType !== 'ALL') {
    filtered = filtered.filter((e) => e.type === selectedType);
  }

  const displayed = filtered.slice(0, maxItems);

  return (
    <div className="space-y-3">
      {showControls && (
        <div className="flex flex-col sm:flex-row gap-2 items-center justify-between pb-2 border-b border-slate-100">
          <div className="relative w-full sm:w-64">
            <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              placeholder="Filter events..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-8 pr-3 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-indigo-500"
            />
          </div>

          <div className="flex items-center gap-2 w-full sm:w-auto justify-end">
            <select
              value={selectedType}
              onChange={(e) => setSelectedType(e.target.value)}
              className="text-xs bg-slate-50 border border-slate-200 rounded-lg px-2.5 py-1.5 text-slate-600 focus:outline-none"
            >
              <option value="ALL">All Event Types</option>
              <option value="ORDER_CREATED">Order Created</option>
              <option value="ORDER_STATUS_CHANGED">Status Changed</option>
              <option value="DELIVERY_ASSIGNED">Delivery Assigned</option>
            </select>

            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                simulateMutationEvent(
                  'ORDER_STATUS_CHANGED',
                  'ORD-1050',
                  'Simulated status change: OUT_FOR_DELIVERY',
                  { previousStatus: 'READY_FOR_PICKUP', newStatus: 'OUT_FOR_DELIVERY' }
                );
              }}
              leftIcon={<Sparkles className="w-3 h-3 text-amber-500" />}
              title="Broadcast test subscription event"
            >
              Demo Ping
            </Button>

            {liveEvents.length > 0 && (
              <button
                onClick={clearEvents}
                title="Clear event stream"
                className="p-1.5 text-slate-400 hover:text-rose-600 rounded-lg hover:bg-slate-100 transition-colors"
              >
                <Trash2 className="w-3.5 h-3.5" />
              </button>
            )}
          </div>
        </div>
      )}

      {displayed.length === 0 ? (
        <EmptyState
          icon={<Radio className="w-6 h-6 text-slate-400 animate-pulse" />}
          title="No Subscription Events Yet"
          description="Listening to AWS AppSync GraphQL real-time event stream. Mutations trigger instantaneous broadcasts here."
        />
      ) : (
        <div className="space-y-2.5">
          {displayed.map((event) => (
            <LiveEventCard key={event.id} event={event} />
          ))}
        </div>
      )}
    </div>
  );
};
