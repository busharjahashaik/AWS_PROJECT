import React, { useState, useEffect } from 'react';
import { ActivityLog, UserRole } from '../../types';
import { orderService } from '../../services/orderService';
import { formatDate, formatRelativeTime } from '../../utils/formatters';
import { 
  ClipboardList, 
  Search, 
  Filter, 
  RefreshCw, 
  ShieldCheck, 
  ShoppingBag, 
  Truck, 
  Clock, 
  ArrowUpRight,
  Info
} from 'lucide-react';
import { Button } from '../../components/common/Button';
import { Badge } from '../../components/common/Badge';

export const AdminActivityLogs: React.FC = () => {
  const [logs, setLogs] = useState<ActivityLog[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [roleFilter, setRoleFilter] = useState<'ALL' | UserRole>('ALL');

  const fetchLogs = async () => {
    setIsLoading(true);
    try {
      const data = await orderService.getActivityLogs();
      setLogs(data);
    } catch (err) {
      console.error('Failed to load activity logs', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchLogs();
  }, []);

  const filteredLogs = logs.filter((log) => {
    const q = searchQuery.toLowerCase();
    const matchesSearch =
      log.userName.toLowerCase().includes(q) ||
      (log.orderId || '').toLowerCase().includes(q) ||
      log.action.toLowerCase().includes(q) ||
      (log.details || '').toLowerCase().includes(q);

    const matchesRole = roleFilter === 'ALL' || log.userRole === roleFilter;
    return matchesSearch && matchesRole;
  });

  const getRoleIcon = (role: UserRole) => {
    switch (role) {
      case 'ADMIN':
        return <ShieldCheck className="w-3.5 h-3.5 text-indigo-600" />;
      case 'DELIVERY':
        return <Truck className="w-3.5 h-3.5 text-amber-600" />;
      case 'CUSTOMER':
      default:
        return <ShoppingBag className="w-3.5 h-3.5 text-emerald-600" />;
    }
  };

  const getRoleBadgeVariant = (role: UserRole) => {
    switch (role) {
      case 'ADMIN':
        return 'indigo';
      case 'DELIVERY':
        return 'amber';
      case 'CUSTOMER':
      default:
        return 'emerald';
    }
  };

  return (
    <div className="max-w-7xl mx-auto space-y-6 animate-fade-in font-sans">
      {/* Header */}
      <div className="pb-2 border-b border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-slate-100 text-slate-700 text-xs font-medium border border-slate-200 mb-1.5">
            <ClipboardList className="w-3.5 h-3.5 text-slate-600" />
            <span>Audit & Governance Trail</span>
          </div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight">System Activity Logs</h1>
          <p className="text-xs text-slate-500">
            Chronological audit records of order lifecycle mutations, dispatches, and user role operations.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <Button
            variant="outline"
            size="sm"
            onClick={fetchLogs}
            disabled={isLoading}
            className="flex items-center gap-1.5"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isLoading ? 'animate-spin' : ''}`} />
            <span>Refresh</span>
          </Button>
          <div className="px-3 py-1.5 bg-white border border-slate-200 rounded-xl text-xs font-medium text-slate-700">
            Total Logs: <strong className="text-indigo-600 font-mono">{logs.length}</strong>
          </div>
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
            placeholder="Search by user, action, order ID, details..."
            className="w-full text-xs pl-9 pr-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:bg-white"
          />
        </div>

        <div className="flex items-center gap-2 w-full md:w-auto overflow-x-auto pb-1 md:pb-0">
          <span className="text-xs text-slate-400 font-medium flex items-center gap-1 shrink-0">
            <Filter className="w-3.5 h-3.5" /> Role:
          </span>
          {(['ALL', 'ADMIN', 'CUSTOMER', 'DELIVERY'] as const).map((role) => (
            <button
              key={role}
              onClick={() => setRoleFilter(role)}
              className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-all ${
                roleFilter === role
                  ? 'bg-indigo-600 text-white shadow-xs'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              {role === 'ALL' ? 'All Roles' : role}
            </button>
          ))}
        </div>
      </div>

      {/* Table Container */}
      <div className="bg-white border border-slate-200 rounded-2xl shadow-xs overflow-hidden">
        {isLoading ? (
          <div className="p-12 text-center">
            <div className="w-8 h-8 rounded-full border-2 border-indigo-600 border-t-transparent animate-spin mx-auto mb-3" />
            <p className="text-sm font-medium text-slate-600">Loading audit records...</p>
          </div>
        ) : filteredLogs.length === 0 ? (
          <div className="p-12 text-center">
            <div className="w-12 h-12 rounded-2xl bg-slate-100 flex items-center justify-center mx-auto mb-3 text-slate-400">
              <ClipboardList className="w-6 h-6" />
            </div>
            <h3 className="text-base font-bold text-slate-900 mb-1">No Activity Logs Found</h3>
            <p className="text-xs text-slate-500 max-w-sm mx-auto">
              No matching activity records found for your filter criteria. Logs are automatically captured when orders or statuses are mutated.
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-200 text-slate-500 font-semibold uppercase tracking-wider">
                  <th className="py-3 px-4">Timestamp</th>
                  <th className="py-3 px-4">Actor</th>
                  <th className="py-3 px-4">Action</th>
                  <th className="py-3 px-4">Target Order</th>
                  <th className="py-3 px-4">Status / Event</th>
                  <th className="py-3 px-4">Mutation Details</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 font-sans">
                {filteredLogs.map((log) => (
                  <tr key={log.id} className="hover:bg-slate-50/75 transition-colors">
                    <td className="py-3.5 px-4 whitespace-nowrap text-slate-500">
                      <div className="flex items-center gap-1.5 font-mono text-[11px]">
                        <Clock className="w-3 h-3 text-slate-400" />
                        <span>{formatDate(log.timestamp)}</span>
                      </div>
                      <span className="text-[10px] text-slate-400">
                        {formatRelativeTime(log.timestamp)}
                      </span>
                    </td>

                    <td className="py-3.5 px-4 whitespace-nowrap">
                      <div className="flex items-center gap-2">
                        <div className="p-1.5 rounded-lg bg-slate-100">
                          {getRoleIcon(log.userRole)}
                        </div>
                        <div>
                          <p className="font-semibold text-slate-900">{log.userName}</p>
                          <Badge variant={getRoleBadgeVariant(log.userRole)} size="sm">
                            {log.userRole}
                          </Badge>
                        </div>
                      </div>
                    </td>

                    <td className="py-3.5 px-4">
                      <p className="font-medium text-slate-800">{log.action}</p>
                    </td>

                    <td className="py-3.5 px-4 whitespace-nowrap font-mono">
                      {log.orderId ? (
                        <span className="inline-flex items-center px-2 py-0.5 rounded-md bg-indigo-50 text-indigo-700 font-bold border border-indigo-100">
                          {log.orderId}
                        </span>
                      ) : (
                        <span className="text-slate-400 italic">None</span>
                      )}
                    </td>

                    <td className="py-3.5 px-4 whitespace-nowrap">
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-slate-100 text-slate-700 font-semibold border border-slate-200">
                        {log.status}
                      </span>
                    </td>

                    <td className="py-3.5 px-4 text-slate-600 max-w-xs truncate" title={log.details || ''}>
                      {log.details ? (
                        <div className="flex items-center gap-1">
                          <Info className="w-3 h-3 text-slate-400 shrink-0" />
                          <span className="truncate">{log.details}</span>
                        </div>
                      ) : (
                        <span className="text-slate-400 italic">—</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};
