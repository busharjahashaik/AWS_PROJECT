import React from 'react';
import { RealTimeEvent } from '../../types';
import { formatRelativeTime } from '../../utils/formatters';
import { ArrowRight, Radio, Package, Truck, UserCheck, AlertCircle } from 'lucide-react';

interface LiveEventCardProps {
  event: RealTimeEvent;
}

export const LiveEventCard: React.FC<LiveEventCardProps> = ({ event }) => {
  const getEventIcon = () => {
    switch (event.type) {
      case 'ORDER_CREATED':
        return <Package className="w-4 h-4 text-blue-500" />;
      case 'ORDER_STATUS_CHANGED':
        return <Truck className="w-4 h-4 text-purple-500" />;
      case 'DELIVERY_ASSIGNED':
        return <UserCheck className="w-4 h-4 text-emerald-500" />;
      default:
        return <AlertCircle className="w-4 h-4 text-amber-500" />;
    }
  };

  return (
    <div className="bg-white border border-slate-200/90 rounded-xl p-4 shadow-2xs hover:shadow-xs transition-shadow relative overflow-hidden group">
      {/* Top event tag and timestamp */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-1.5">
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-bold tracking-wider uppercase bg-amber-50 text-amber-800 border border-amber-200">
            <Radio className="w-2.5 h-2.5 animate-pulse text-amber-600" />
            LIVE EVENT
          </span>
          {event.orderId && (
            <span className="font-mono text-xs font-semibold text-slate-800">
              {event.orderId}
            </span>
          )}
        </div>
        <span className="text-[11px] text-slate-400 font-medium">
          {formatRelativeTime(event.timestamp)}
        </span>
      </div>

      {/* Transition or Main description */}
      <div className="mt-2.5 flex items-center gap-2">
        <div className="w-7 h-7 rounded-lg bg-slate-50 border border-slate-100 flex items-center justify-center shrink-0">
          {getEventIcon()}
        </div>

        {event.previousStatus && event.newStatus ? (
          <div className="flex items-center gap-1.5 text-xs font-semibold">
            <span className="px-2 py-0.5 rounded bg-slate-100 text-slate-700 font-mono text-[11px]">
              {event.previousStatus}
            </span>
            <ArrowRight className="w-3.5 h-3.5 text-slate-400 shrink-0" />
            <span className="px-2 py-0.5 rounded bg-indigo-50 text-indigo-700 font-mono text-[11px] border border-indigo-200">
              {event.newStatus}
            </span>
          </div>
        ) : (
          <p className="text-xs text-slate-700 font-medium leading-relaxed">{event.message}</p>
        )}
      </div>

      {/* Footer metadata */}
      <div className="mt-3 pt-2.5 border-t border-slate-100 flex items-center justify-between text-[11px] text-slate-400">
        <span className="flex items-center gap-1">
          <span>Source:</span>
          <span className="font-medium text-slate-600 font-mono text-[10px]">{event.source}</span>
        </span>
        <span className="text-[10px] text-slate-400">WebSocket Push</span>
      </div>
    </div>
  );
};
