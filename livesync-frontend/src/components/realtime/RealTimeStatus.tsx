import React from 'react';
import { useRealTime } from '../../hooks';
import { Radio, RefreshCw, Activity, ShieldCheck, Clock, Server } from 'lucide-react';
import { formatRelativeTime } from '../../utils/formatters';

export const RealTimeStatus: React.FC = () => {
  const {
    connectionStatus,
    isSubscriptionActive,
    eventsReceivedCount,
    lastEvent,
    isMockMode,
    region,
    latencyMs,
    reconnect,
  } = useRealTime();

  return (
    <div className="bg-gradient-to-br from-slate-900 via-slate-800 to-indigo-950 text-white rounded-xl p-5 shadow-md border border-slate-700/60 relative overflow-hidden">
      {/* Background subtle mesh glow */}
      <div className="absolute -top-12 -right-12 w-48 h-48 bg-indigo-500/10 rounded-full blur-2xl pointer-events-none" />
      <div className="absolute -bottom-12 -left-12 w-48 h-48 bg-amber-500/10 rounded-full blur-2xl pointer-events-none" />

      {/* Top Header */}
      <div className="flex items-start justify-between relative z-10">
        <div>
          <div className="flex items-center gap-2">
            <span className="text-[11px] font-mono tracking-widest text-amber-400 uppercase font-semibold">
              AWS APPSYNC GRAPHQL
            </span>
            <span className="text-[10px] px-1.5 py-0.5 rounded bg-slate-800 text-slate-300 font-mono">
              {region}
            </span>
          </div>
          <h3 className="text-xl font-bold mt-1 text-white tracking-tight flex items-center gap-2">
            Real-Time Engine
            <span
              className={`inline-flex items-center text-xs px-2 py-0.5 rounded-full font-semibold ${
                connectionStatus === 'CONNECTED'
                  ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40'
                  : 'bg-amber-500/20 text-amber-300 border border-amber-500/40'
              }`}
            >
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-ping mr-1.5" />
              {connectionStatus}
            </span>
          </h3>
        </div>

        <button
          onClick={() => reconnect()}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-medium border border-slate-600 transition-colors shadow-xs"
        >
          <RefreshCw className="w-3.5 h-3.5" />
          <span>Sync Subscriptions</span>
        </button>
      </div>

      {/* Status Details Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mt-5 relative z-10">
        {/* Metric 1: Subscription Status */}
        <div className="bg-slate-800/80 border border-slate-700/80 rounded-lg p-3">
          <div className="flex items-center gap-1.5 text-xs text-slate-400">
            <Radio className="w-3.5 h-3.5 text-indigo-400" />
            <span>Subscription</span>
          </div>
          <div className="mt-1 text-sm font-semibold text-emerald-400 flex items-center gap-1">
            <span className="w-2 h-2 rounded-full bg-emerald-400 inline-block animate-pulse" />
            {isSubscriptionActive ? 'ACTIVE' : 'IDLE'}
          </div>
          <div className="text-[10px] text-slate-500 mt-0.5">WebSocket channel</div>
        </div>

        {/* Metric 2: Events Received */}
        <div className="bg-slate-800/80 border border-slate-700/80 rounded-lg p-3">
          <div className="flex items-center gap-1.5 text-xs text-slate-400">
            <Activity className="w-3.5 h-3.5 text-amber-400" />
            <span>Events Streamed</span>
          </div>
          <div className="mt-1 text-base font-bold text-white">{eventsReceivedCount}</div>
          <div className="text-[10px] text-slate-500 mt-0.5">Without page refresh</div>
        </div>

        {/* Metric 3: Latency */}
        <div className="bg-slate-800/80 border border-slate-700/80 rounded-lg p-3">
          <div className="flex items-center gap-1.5 text-xs text-slate-400">
            <Clock className="w-3.5 h-3.5 text-sky-400" />
            <span>Round-Trip</span>
          </div>
          <div className="mt-1 text-base font-bold text-white">{latencyMs} ms</div>
          <div className="text-[10px] text-slate-500 mt-0.5">Push delivery speed</div>
        </div>

        {/* Metric 4: Engine Mode */}
        <div className="bg-slate-800/80 border border-slate-700/80 rounded-lg p-3">
          <div className="flex items-center gap-1.5 text-xs text-slate-400">
            <Server className="w-3.5 h-3.5 text-purple-400" />
            <span>Transport</span>
          </div>
          <div className="mt-1 text-xs font-semibold text-slate-200 truncate">
            {isMockMode ? 'AppSync Simulator' : 'AppSync Live'}
          </div>
          <div className="text-[10px] text-slate-500 mt-0.5">
            {isMockMode ? 'PubSub Bus' : 'WSS / GraphQL'}
          </div>
        </div>
      </div>

      {/* Last Event Summary */}
      <div className="mt-4 pt-3.5 border-t border-slate-800 flex items-center justify-between text-xs relative z-10">
        <div className="flex items-center gap-2 text-slate-300">
          <ShieldCheck className="w-4 h-4 text-emerald-400 shrink-0" />
          <span className="text-slate-400">Last Broadcast:</span>
          <span className="font-mono text-slate-200 font-medium truncate max-w-md">
            {lastEvent ? lastEvent.message : 'Awaiting incoming AppSync subscription events...'}
          </span>
        </div>
        <span className="text-[11px] text-slate-400 font-mono shrink-0 ml-2">
          {lastEvent ? formatRelativeTime(lastEvent.timestamp) : 'Ready'}
        </span>
      </div>
    </div>
  );
};
