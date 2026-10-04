import React from 'react';
import { useNotifications } from '../../hooks';
import { Radio, X, CheckCircle, AlertTriangle, Info, AlertOctagon } from 'lucide-react';

export const NotificationToastContainer: React.FC = () => {
  const { activeToasts, dismissToast } = useNotifications();

  if (activeToasts.length === 0) return null;

  return (
    <div className="fixed bottom-4 right-4 z-50 flex flex-col gap-2.5 max-w-sm w-full pointer-events-none sm:bottom-6 sm:right-6">
      {activeToasts.map((toast) => {
        const getIcon = () => {
          switch (toast.type) {
            case 'success':
              return <CheckCircle className="w-5 h-5 text-emerald-500 shrink-0" />;
            case 'warning':
              return <AlertTriangle className="w-5 h-5 text-amber-500 shrink-0" />;
            case 'alert':
              return <AlertOctagon className="w-5 h-5 text-rose-500 shrink-0" />;
            default:
              return <Radio className="w-5 h-5 text-indigo-500 shrink-0 animate-pulse" />;
          }
        };

        return (
          <div
            key={toast.id}
            className="pointer-events-auto bg-slate-900 text-white rounded-xl p-4 shadow-xl border border-slate-700/80 flex items-start gap-3 transform transition-all duration-300 animate-slide-in-right"
          >
            <div className="mt-0.5">{getIcon()}</div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-1.5">
                <h4 className="text-xs font-semibold text-white tracking-tight">{toast.title}</h4>
              </div>
              <p className="text-xs text-slate-300 mt-1 leading-snug">{toast.message}</p>
              <div className="mt-2 flex items-center justify-between text-[10px] text-slate-400">
                <span className="font-mono text-amber-300/90">{toast.source}</span>
                <span>Just now</span>
              </div>
            </div>
            <button
              onClick={() => dismissToast(toast.id)}
              className="text-slate-400 hover:text-white p-1 rounded-md hover:bg-slate-800 transition-colors"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
        );
      })}
    </div>
  );
};
