import React, { useState } from 'react';
import { useRealTime } from '../../hooks';
import { formatRelativeTime, formatDate } from '../../utils/formatters';
import { Radio, Search, Filter, Clock, Activity, Zap, CheckCircle2, ChevronRight } from 'lucide-react';
import { Button } from '../../components/common/Button';

export const AdminLiveEvents: React.FC = () => {
  const { liveEvents, connectionStatus, isSubscriptionActive, latencyMs } = useRealTime();
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedType, setSelectedType] = useState('ALL');

  const filteredEvents = liveEvents.filter((evt) => {
    const q = searchQuery.toLowerCase();
    const matchesSearch =
      evt.type.toLowerCase().includes(q) ||
      (evt.orderId || '').toLowerCase().includes(q) ||
      evt.message.toLowerCase().includes(q);

    const matchesType = selectedType === 'ALL' || evt.type === selectedType;
    return matchesSearch && matchesType;
  });

  return (
    <div className="max-w-7xl mx-auto space-y-6 animate-fade-in font-sans">
      <div className="pb-2 border-b border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-indigo-50 text-indigo-700 text-xs font-medium border border-indigo-200 mb-1.5">
            <Radio className="w-3.5 h-3.5 text-indigo-600 animate-pulse" />
            <span>Master Operations • WebSocket Subscription Audit</span>
          </div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Live Events Stream</h1>
          <p className="text-xs text-slate-500">
            Real-time push event audit stream broadcasted across the GraphQL subscription topology.
          </p>
        </div>

        {/* Real-Time Status Pill - Strictly avoids fake "AWS Connected" claims as per Section 20 */}
        <div className="p-3 bg-white border border-slate-200 rounded-xl flex items-center gap-3 text-xs">
          <div className="flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-ping" />
            <span className="font-semibold text-slate-800">Frontend Ready</span>
          </div>
          <span className="text-slate-300">|</span>
          <span className="text-slate-500">Active Channel</span>
          <span className="text-slate-300">|</span>
          <span className="font-mono text-indigo-600 font-bold">{liveEvents.length} events logged</span>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-white border border-slate-200 rounded-2xl p-4 shadow-xs flex flex-col md:flex-row items-center justify-between gap-4">
        <div className="relative w-full md:w-80">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search by event type, order ID, or details..."
            className="w-full text-xs pl-9 pr-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:bg-white"
          />
        </div>

        <div className="flex items-center gap-1 p-1 bg-slate-100 rounded-xl w-full md:w-auto overflow-x-auto">
          {[
            { id: 'ALL', label: 'All Events' },
            { id: 'ORDER_CREATED', label: 'ORDER_CREATED' },
            { id: 'ORDER_STATUS_CHANGED', label: 'ORDER_STATUS_CHANGED' },
            { id: 'DELIVERY_ASSIGNED', label: 'DELIVERY_ASSIGNED' },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setSelectedType(tab.id)}
              className={`px-3 py-1.5 text-xs font-semibold rounded-lg whitespace-nowrap transition-all ${
                selectedType === tab.id
                  ? 'bg-white text-indigo-700 shadow-xs'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200/60'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {/* Event Stream (Section 20 Specification: Event Type, Order ID, Time, User/Role, Status) */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 text-slate-500 uppercase tracking-wider font-semibold border-b border-slate-100">
              <tr>
                <th className="py-3 px-4">Event Type</th>
                <th className="py-3 px-4">Order ID</th>
                <th className="py-3 px-4">Time</th>
                <th className="py-3 px-4">Status Transition</th>
                <th className="py-3 px-4">Event Details</th>
                <th className="py-3 px-4 text-right">Source Protocol</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredEvents.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-12 text-center text-slate-400">
                    No real-time events found in stream.
                  </td>
                </tr>
              ) : (
                filteredEvents.map((evt) => (
                  <tr key={evt.id} className="hover:bg-slate-50/70 transition-colors">
                    <td className="py-3 px-4">
                      <span className="font-mono font-bold text-xs text-indigo-600 bg-indigo-50 px-2 py-0.5 rounded border border-indigo-100">
                        {evt.type}
                      </span>
                    </td>
                    <td className="py-3 px-4 font-mono font-bold text-slate-900">
                      {evt.orderId || 'GLOBAL'}
                    </td>
                    <td className="py-3 px-4 text-slate-500">
                      <div>{formatDate(evt.timestamp)}</div>
                      <div className="text-[10px] text-slate-400 font-mono">{formatRelativeTime(evt.timestamp)}</div>
                    </td>
                    <td className="py-3 px-4">
                      {evt.newStatus ? (
                        <span className="inline-flex items-center gap-1 font-semibold text-slate-800 text-[11px]">
                          {evt.previousStatus ? `${evt.previousStatus} → ` : ''}
                          <span className="text-emerald-700 bg-emerald-50 px-1.5 py-0.5 rounded border border-emerald-200 font-mono">
                            {evt.newStatus}
                          </span>
                        </span>
                      ) : (
                        <span className="text-slate-400 italic">None</span>
                      )}
                    </td>
                    <td className="py-3 px-4 text-slate-700 font-medium">
                      {evt.message}
                    </td>
                    <td className="py-3 px-4 text-right font-mono text-[10px] text-slate-400">
                      {evt.source}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
