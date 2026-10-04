import React from 'react';
import { useRealTime } from '../../hooks';
import { Radio, RefreshCw, Zap } from 'lucide-react';

export const ConnectionIndicator: React.FC<{ compact?: boolean }> = ({ compact = false }) => {
  const { connectionStatus, isSubscriptionActive, isMockMode, latencyMs, reconnect } = useRealTime();

  const getStatusConfig = () => {
    switch (connectionStatus) {
      case 'CONNECTED':
        return {
          label: 'AppSync Connected',
          dotBg: 'bg-emerald-500',
          pulseBg: 'bg-emerald-400',
          badgeBg: 'bg-emerald-50 text-emerald-700 border-emerald-200',
        };
      case 'CONNECTING':
        return {
          label: 'Connecting...',
          dotBg: 'bg-amber-500',
          pulseBg: 'bg-amber-400',
          badgeBg: 'bg-amber-50 text-amber-700 border-amber-200',
        };
      case 'RECONNECTING':
        return {
          label: 'Reconnecting...',
          dotBg: 'bg-amber-500',
          pulseBg: 'bg-amber-400',
          badgeBg: 'bg-amber-50 text-amber-700 border-amber-200',
        };
      case 'DISCONNECTED':
      default:
        return {
          label: 'Disconnected',
          dotBg: 'bg-rose-500',
          pulseBg: 'bg-rose-400',
          badgeBg: 'bg-rose-50 text-rose-700 border-rose-200',
        };
    }
  };

  const status = getStatusConfig();

  if (compact) {
    return (
      <div
        className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs border ${status.badgeBg} cursor-pointer transition-colors`}
        title={`AWS AppSync Subscription: ${connectionStatus} (${latencyMs}ms)`}
        onClick={() => reconnect()}
      >
        <span className="relative flex h-2 w-2">
          {connectionStatus === 'CONNECTED' && (
            <span className={`animate-ping absolute inline-flex h-full w-full rounded-full opacity-75 ${status.pulseBg}`} />
          )}
          <span className={`relative inline-flex rounded-full h-2 w-2 ${status.dotBg}`} />
        </span>
        <span className="font-semibold tracking-tight text-[11px]">Frontend Ready</span>
      </div>
    );
  }

  return (
    <div className="flex items-center gap-2">
      <div
        className={`flex items-center gap-2 px-3 py-1.5 rounded-lg border text-xs ${status.badgeBg} transition-all`}
      >
        <div className="flex items-center gap-1.5">
          <span className="relative flex h-2.5 w-2.5">
            {connectionStatus === 'CONNECTED' && (
              <span className={`animate-ping absolute inline-flex h-full w-full rounded-full opacity-75 ${status.pulseBg}`} />
            )}
            <span className={`relative inline-flex rounded-full h-2.5 w-2.5 ${status.dotBg}`} />
          </span>
          <span className="font-semibold text-slate-800">
            {isMockMode ? 'Frontend Ready' : 'AWS AppSync Live'}
          </span>
        </div>

        <span className="text-slate-300">|</span>

        <div className="flex items-center gap-1 text-[11px] font-medium text-slate-600">
          <Zap className="w-3 h-3 text-amber-500" />
          <span>{isMockMode ? 'Awaiting backend connection' : `${latencyMs}ms`}</span>
        </div>

        {isSubscriptionActive && (
          <>
            <span className="text-slate-300">|</span>
            <div className="flex items-center gap-1 text-[11px] font-medium text-emerald-700">
              <Radio className="w-3 h-3 text-emerald-600 animate-pulse" />
              <span>Subscription Active</span>
            </div>
          </>
        )}

        <button
          onClick={() => reconnect()}
          title="Reconnect AppSync Subscription"
          className="ml-1 text-slate-400 hover:text-slate-700 p-0.5 rounded transition-colors"
        >
          <RefreshCw className="w-3 h-3 hover:rotate-180 transition-transform duration-500" />
        </button>
      </div>
    </div>
  );
};
