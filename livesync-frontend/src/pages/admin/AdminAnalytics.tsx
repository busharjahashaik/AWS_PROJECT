import React from 'react';
import { useOrders } from '../../hooks';
import { formatCurrency } from '../../utils/formatters';
import { BarChart3, TrendingUp, ShoppingBag, DollarSign, CheckCircle2, XCircle, Truck, Layers } from 'lucide-react';
import { StatCard } from '../../components/common/StatCard';

export const AdminAnalytics: React.FC = () => {
  const { orders } = useOrders();

  const totalOrders = orders.length;
  const deliveredOrders = orders.filter((o) => o.orderStatus === 'DELIVERED').length;
  const cancelledOrders = orders.filter((o) => o.orderStatus === 'CANCELLED').length;
  const activeDeliveries = orders.filter(
    (o) => o.orderStatus === 'OUT_FOR_DELIVERY' || o.orderStatus === 'PICKED_UP'
  ).length;

  const totalRevenue = orders
    .filter((o) => o.paymentStatus === 'PAID')
    .reduce((sum, o) => sum + o.totalAmount, 0);

  // Status Distribution
  const statuses = [
    { key: 'PLACED', label: 'Placed', color: 'bg-blue-500' },
    { key: 'CONFIRMED', label: 'Confirmed', color: 'bg-sky-500' },
    { key: 'PREPARING', label: 'Preparing', color: 'bg-amber-500' },
    { key: 'READY_FOR_PICKUP', label: 'Ready for Pickup', color: 'bg-indigo-500' },
    { key: 'PICKED_UP', label: 'Picked Up', color: 'bg-teal-500' },
    { key: 'OUT_FOR_DELIVERY', label: 'Out for Delivery', color: 'bg-purple-500' },
    { key: 'DELIVERED', label: 'Delivered', color: 'bg-emerald-500' },
    { key: 'CANCELLED', label: 'Cancelled', color: 'bg-rose-500' },
  ];

  const distribution = statuses.map((st) => {
    const count = orders.filter((o) => o.orderStatus === st.key).length;
    const percentage = totalOrders > 0 ? Math.round((count / totalOrders) * 100) : 0;
    return { ...st, count, percentage };
  });

  return (
    <div className="max-w-7xl mx-auto space-y-6 animate-fade-in font-sans">
      <div className="pb-2 border-b border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-indigo-50 text-indigo-700 text-xs font-medium border border-indigo-200 mb-1.5">
            <BarChart3 className="w-3.5 h-3.5" />
            <span>Platform Intelligence</span>
          </div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Performance Analytics</h1>
          <p className="text-xs text-slate-500">
            Real-time revenue metrics, order velocity, and status distribution across the pipeline.
          </p>
        </div>
      </div>

      {/* KPI Cards (Section 19 Specification: Orders, Revenue, Delivered, Cancelled, Active Deliveries) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
        <StatCard
          label="Total Orders"
          value={totalOrders}
          subtext="lifecycle volume"
          icon={<ShoppingBag className="w-5 h-5 text-indigo-600" />}
        />
        <StatCard
          label="Total Revenue"
          value={formatCurrency(totalRevenue)}
          subtext="settled transactions"
          icon={<DollarSign className="w-5 h-5 text-emerald-600" />}
        />
        <StatCard
          label="Delivered Orders"
          value={deliveredOrders}
          subtext={`${totalOrders > 0 ? Math.round((deliveredOrders / totalOrders) * 100) : 0}% success rate`}
          icon={<CheckCircle2 className="w-5 h-5 text-emerald-600" />}
        />
        <StatCard
          label="Active Deliveries"
          value={activeDeliveries}
          subtext="couriers on road"
          icon={<Truck className="w-5 h-5 text-purple-600" />}
        />
        <StatCard
          label="Cancelled Orders"
          value={cancelledOrders}
          subtext="churn volume"
          icon={<XCircle className="w-5 h-5 text-rose-600" />}
        />
      </div>

      {/* Status Distribution Visualizer */}
      <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-xs space-y-6">
        <div>
          <h3 className="text-sm font-bold text-slate-900">Order Status Distribution</h3>
          <p className="text-xs text-slate-500 mt-0.5">Real-time breakdown of current orders across lifecycle stages</p>
        </div>

        {/* Stacked bar visual */}
        <div className="h-4 w-full bg-slate-100 rounded-full flex overflow-hidden">
          {distribution.map((d) => (
            <div
              key={d.key}
              style={{ width: `${d.percentage}%` }}
              className={`${d.color} transition-all duration-500`}
              title={`${d.label}: ${d.count} (${d.percentage}%)`}
            />
          ))}
        </div>

        {/* Detailed Breakdown Grid */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 pt-2">
          {distribution.map((d) => (
            <div key={d.key} className="p-3 rounded-xl bg-slate-50 border border-slate-100 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className={`w-3 h-3 rounded-full ${d.color}`} />
                <span className="text-xs font-semibold text-slate-700">{d.label}</span>
              </div>
              <div className="text-right">
                <span className="text-xs font-bold text-slate-900 block">{d.count}</span>
                <span className="text-[10px] text-slate-400 font-mono">{d.percentage}%</span>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Hourly Trends Mock-ready Data Table */}
      <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-xs">
        <h3 className="text-sm font-bold text-slate-900 mb-3">Delivery Velocity Insights</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs">
          <div className="p-4 rounded-xl border border-slate-100 bg-slate-50/50">
            <span className="text-slate-400 font-semibold block uppercase text-[10px]">Average Fulfillment Time</span>
            <span className="text-xl font-bold text-slate-900 mt-1 block">34.2 mins</span>
            <span className="text-emerald-600 text-[11px] font-medium">9.4% faster than benchmark</span>
          </div>
          <div className="p-4 rounded-xl border border-slate-100 bg-slate-50/50">
            <span className="text-slate-400 font-semibold block uppercase text-[10px]">Average Order Value</span>
            <span className="text-xl font-bold text-slate-900 mt-1 block">
              {formatCurrency(totalOrders > 0 ? totalRevenue / totalOrders : 0)}
            </span>
            <span className="text-slate-500 text-[11px] font-medium">Per checkout ticket</span>
          </div>
          <div className="p-4 rounded-xl border border-slate-100 bg-slate-50/50">
            <span className="text-slate-400 font-semibold block uppercase text-[10px]">Real-Time Event Throughput</span>
            <span className="text-xl font-bold text-slate-900 mt-1 block">Sub-Second</span>
            <span className="text-indigo-600 text-[11px] font-medium">AWS AppSync WebSocket Push</span>
          </div>
        </div>
      </div>
    </div>
  );
};
