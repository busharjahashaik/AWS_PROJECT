import React from 'react';
import { Link } from 'react-router-dom';
import { useAuth, useOrders, useRealTime } from '../../hooks';
import { StatCard } from '../../components/common/StatCard';
import { Badge } from '../../components/common/Badge';
import { Button } from '../../components/common/Button';
import { formatCurrency, formatRelativeTime, getOrderStatusBadge } from '../../utils/formatters';
import { 
  ShoppingBag, 
  Truck, 
  CheckCircle2, 
  Clock, 
  ArrowRight, 
  Radio, 
  Users, 
  BarChart3, 
  Cpu, 
  ShieldCheck 
} from 'lucide-react';

export const AdminDashboard: React.FC = () => {
  const { user } = useAuth();
  const { orders, isLoading } = useOrders();
  const { liveEvents, connectionStatus, latencyMs } = useRealTime();

  const totalOrders = orders.length;
  const activeOrders = orders.filter(
    (o) => o.orderStatus !== 'DELIVERED' && o.orderStatus !== 'CANCELLED'
  ).length;
  const outForDelivery = orders.filter((o) => o.orderStatus === 'OUT_FOR_DELIVERY').length;
  const deliveredOrders = orders.filter((o) => o.orderStatus === 'DELIVERED').length;
  const totalRevenue = orders
    .filter((o) => o.paymentStatus === 'PAID')
    .reduce((sum, o) => sum + o.totalAmount, 0);

  const recentOrders = orders.slice(0, 6);
  const recentEvents = liveEvents.slice(0, 4);

  return (
    <div className="space-y-6 max-w-7xl mx-auto animate-fade-in">
      {/* Top Banner */}
      <div className="bg-slate-900 text-white rounded-2xl p-6 sm:p-8 shadow-sm border border-slate-800 flex flex-col md:flex-row md:items-center md:justify-between gap-6">
        <div>
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-indigo-500/20 text-indigo-300 text-xs font-medium mb-3 border border-indigo-500/30">
            <ShieldCheck className="w-3.5 h-3.5 text-indigo-400" />
            <span>Master Operations Console</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-white">
            Welcome back, {user?.name || 'Administrator'}
          </h1>
          <p className="text-xs sm:text-sm text-slate-400 mt-1">
            Real-time operations overview powered by AWS AppSync GraphQL API & subscriptions.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <Link to="/admin/orders">
            <Button variant="primary" size="md">
              Manage Orders Matrix
            </Button>
          </Link>
          <Link to="/admin/appsync">
            <Button variant="outline" size="md" className="border-slate-700 bg-slate-800 text-slate-200 hover:bg-slate-700">
              AppSync Monitor
            </Button>
          </Link>
        </div>
      </div>

      {/* 8 Core Admin KPI Cards (Section 7 Specification) */}
      <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-4 gap-3 sm:gap-4">
        <StatCard
          label="Total Orders"
          value={totalOrders}
          subtext="all pipeline runs"
          icon={<ShoppingBag className="w-5 h-5 text-indigo-600" />}
        />
        <StatCard
          label="Pending Orders"
          value={orders.filter((o) => o.orderStatus === 'PLACED').length}
          subtext="awaiting kitchen"
          icon={<Clock className="w-5 h-5 text-blue-600" />}
        />
        <StatCard
          label="Processing Orders"
          value={orders.filter((o) => o.orderStatus === 'CONFIRMED' || o.orderStatus === 'PREPARING' || o.orderStatus === 'READY_FOR_PICKUP').length}
          subtext="prep & packaging"
          icon={<Cpu className="w-5 h-5 text-amber-600" />}
        />
        <StatCard
          label="Out for Delivery"
          value={orders.filter((o) => o.orderStatus === 'OUT_FOR_DELIVERY' || o.orderStatus === 'PICKED_UP').length}
          subtext="in-transit right now"
          icon={<Truck className="w-5 h-5 text-purple-600" />}
        />
        <StatCard
          label="Delivered Orders"
          value={deliveredOrders}
          subtext="fulfilled successfully"
          icon={<CheckCircle2 className="w-5 h-5 text-emerald-600" />}
        />
        <StatCard
          label="Total Customers"
          value={4}
          subtext="registered accounts"
          icon={<Users className="w-5 h-5 text-teal-600" />}
        />
        <StatCard
          label="Active Couriers"
          value={3}
          subtext="fleet available"
          icon={<Truck className="w-5 h-5 text-indigo-600" />}
        />
        <StatCard
          label="Live Events"
          value={liveEvents.length}
          subtext="real-time stream"
          icon={<Radio className="w-5 h-5 text-cyan-600" />}
        />
      </div>

      {/* Main Grid: Orders Matrix & Real-Time Event Feed */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Recent Orders Table (2 Cols) */}
        <div className="lg:col-span-2 bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden flex flex-col">
          <div className="p-5 border-b border-slate-100 flex items-center justify-between">
            <div>
              <h2 className="text-sm font-bold text-slate-900 tracking-tight">Recent Orders Pipeline</h2>
              <p className="text-xs text-slate-500">Live order status synchronization</p>
            </div>
            <Link to="/admin/orders" className="text-xs font-semibold text-indigo-600 hover:text-indigo-800 flex items-center gap-1">
              View All Orders <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>

          <div className="overflow-x-auto flex-1">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 text-slate-500 uppercase tracking-wider font-semibold border-b border-slate-100">
                <tr>
                  <th className="py-3 px-4">Order ID</th>
                  <th className="py-3 px-4">Customer</th>
                  <th className="py-3 px-4">Amount</th>
                  <th className="py-3 px-4">Status</th>
                  <th className="py-3 px-4">Courier</th>
                  <th className="py-3 px-4 text-right">Updated</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {recentOrders.map((order) => {
                  const badgeInfo = getOrderStatusBadge(order.orderStatus);
                  return (
                    <tr key={order.orderId} className="hover:bg-slate-50/70 transition-colors">
                      <td className="py-3 px-4 font-mono font-semibold text-indigo-600">
                        {order.orderId}
                      </td>
                      <td className="py-3 px-4">
                        <div className="font-medium text-slate-900">{order.customerName}</div>
                        <div className="text-[10px] text-slate-400">{order.contactNumber}</div>
                      </td>
                      <td className="py-3 px-4 font-semibold text-slate-800">
                        {formatCurrency(order.totalAmount)}
                      </td>
                      <td className="py-3 px-4">
                        <span className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[11px] font-medium border ${badgeInfo.bg} ${badgeInfo.text} ${badgeInfo.border}`}>
                          <span className={`w-1.5 h-1.5 rounded-full ${badgeInfo.dot}`} />
                          {badgeInfo.label}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-slate-600">
                        {order.deliveryPartnerName || <span className="text-slate-400 italic">Unassigned</span>}
                      </td>
                      <td className="py-3 px-4 text-right text-slate-400 font-mono text-[10px]">
                        {formatRelativeTime(order.updatedAt)}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>

        {/* Live AppSync Feed & Quick Links (1 Col) */}
        <div className="space-y-6">
          {/* Real-Time WebSocket Ticker */}
          <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-5">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 mb-3">
              <div className="flex items-center gap-2">
                <Radio className="w-4 h-4 text-indigo-600 animate-pulse" />
                <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider">Live Event Stream</h3>
              </div>
              <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-emerald-50 text-emerald-700 border border-emerald-200">
                {latencyMs}ms ping
              </span>
            </div>

            <div className="space-y-2.5">
              {recentEvents.length === 0 ? (
                <p className="text-xs text-slate-400 italic py-4 text-center">Awaiting live GraphQL events...</p>
              ) : (
                recentEvents.map((event) => (
                  <div key={event.id} className="p-2.5 rounded-xl bg-slate-50 border border-slate-100 text-xs">
                    <div className="flex items-center justify-between text-[10px] text-slate-400 mb-1">
                      <span className="font-mono text-indigo-600 font-semibold">{event.type}</span>
                      <span>{formatRelativeTime(event.timestamp)}</span>
                    </div>
                    <p className="text-slate-700 leading-snug font-medium text-[11px]">{event.message}</p>
                  </div>
                ))
              )}
            </div>

            <div className="mt-4 pt-3 border-t border-slate-100">
              <Link to="/admin/events" className="text-xs font-semibold text-indigo-600 hover:text-indigo-800 flex items-center justify-between">
                <span>View Full Event Stream</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </Link>
            </div>
          </div>

          {/* Quick Admin Modules */}
          <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-5">
            <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider mb-3">Administration Modules</h3>
            <div className="grid grid-cols-2 gap-2 text-xs">
              <Link to="/admin/customers" className="p-3 rounded-xl bg-slate-50 hover:bg-indigo-50/50 border border-slate-100 transition-colors flex items-center gap-2">
                <Users className="w-4 h-4 text-indigo-600" />
                <span className="font-medium text-slate-700">Customers</span>
              </Link>
              <Link to="/admin/delivery" className="p-3 rounded-xl bg-slate-50 hover:bg-indigo-50/50 border border-slate-100 transition-colors flex items-center gap-2">
                <Truck className="w-4 h-4 text-emerald-600" />
                <span className="font-medium text-slate-700">Delivery Fleet</span>
              </Link>
              <Link to="/admin/analytics" className="p-3 rounded-xl bg-slate-50 hover:bg-indigo-50/50 border border-slate-100 transition-colors flex items-center gap-2">
                <BarChart3 className="w-4 h-4 text-purple-600" />
                <span className="font-medium text-slate-700">Analytics</span>
              </Link>
              <Link to="/admin/api-monitor" className="p-3 rounded-xl bg-slate-50 hover:bg-indigo-50/50 border border-slate-100 transition-colors flex items-center gap-2">
                <Cpu className="w-4 h-4 text-amber-600" />
                <span className="font-medium text-slate-700">AppSync Monitor</span>
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
