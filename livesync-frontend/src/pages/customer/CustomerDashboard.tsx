import React from 'react';
import { Link } from 'react-router-dom';
import { useAuth, useOrders } from '../../hooks';
import { StatCard } from '../../components/common/StatCard';
import { Button } from '../../components/common/Button';
import { formatCurrency, formatRelativeTime, getOrderStatusBadge } from '../../utils/formatters';
import { 
  ShoppingBag, 
  PlusCircle, 
  Clock, 
  Truck, 
  CheckCircle2, 
  MapPin, 
  ArrowRight,
  Package,
  Calendar
} from 'lucide-react';

export const CustomerDashboard: React.FC = () => {
  const { user } = useAuth();
  const { orders } = useOrders();

  // Filter orders strictly for this logged-in customer
  const myOrders = orders.filter(
    (o) =>
      o.customerId === user?.id ||
      (user?.email && o.customerEmail?.toLowerCase() === user.email.toLowerCase()) ||
      o.customerName.toLowerCase() === (user?.name || '').toLowerCase()
  );

  const activeOrders = myOrders.filter(
    (o) => o.orderStatus !== 'DELIVERED' && o.orderStatus !== 'CANCELLED'
  );
  const outForDeliveryOrders = myOrders.filter((o) => o.orderStatus === 'OUT_FOR_DELIVERY');
  const deliveredOrders = myOrders.filter((o) => o.orderStatus === 'DELIVERED');
  const totalSpent = myOrders.reduce((sum, o) => sum + o.totalAmount, 0);

  const currentActiveOrder = activeOrders[0] || myOrders[0];

  return (
    <div className="space-y-6 max-w-7xl mx-auto animate-fade-in">
      {/* Welcome Banner */}
      <div className="bg-gradient-to-r from-indigo-900 to-slate-900 text-white rounded-2xl p-6 sm:p-8 shadow-sm border border-slate-800 flex flex-col md:flex-row md:items-center md:justify-between gap-6">
        <div>
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-500/20 text-emerald-300 text-xs font-medium mb-3 border border-emerald-500/30">
            <ShoppingBag className="w-3.5 h-3.5 text-emerald-400" />
            <span>Customer Portal</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-white">
            Welcome back, {user?.name || 'Customer'}!
          </h1>
          <p className="text-xs sm:text-sm text-slate-300 mt-1 max-w-xl">
            Track your order deliveries in real time with live status updates pushed directly via AWS AppSync WebSocket subscriptions.
          </p>
        </div>

        <div>
          <Link to="/customer/orders/create">
            <Button variant="primary" size="md" leftIcon={<PlusCircle className="w-4 h-4" />}>
              Create New Order
            </Button>
          </Link>
        </div>
      </div>

      {/* Customer KPI Metric Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          label="My Total Orders"
          value={myOrders.length}
          icon={<ShoppingBag className="w-5 h-5 text-indigo-600" />}
          subtext="all-time orders"
        />
        <StatCard
          label="Active In-Progress"
          value={activeOrders.length}
          icon={<Clock className="w-5 h-5 text-amber-600" />}
          subtext="currently processing"
        />
        <StatCard
          label="Out For Delivery"
          value={outForDeliveryOrders.length}
          icon={<Truck className="w-5 h-5 text-indigo-600" />}
          subtext="on route to your address"
        />
        <StatCard
          label="Total Order Value"
          value={formatCurrency(totalSpent)}
          icon={<CheckCircle2 className="w-5 h-5 text-emerald-600" />}
          subtext="fulfilled orders"
        />
      </div>

      {/* Live Order Tracker Banner (If customer has an active order) */}
      {currentActiveOrder && (
        <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-4 border-b border-slate-100 gap-3">
            <div>
              <div className="flex items-center gap-2">
                <span className="text-xs font-semibold uppercase tracking-wider text-slate-400">
                  Latest Order Status
                </span>
                <span className="font-mono text-xs font-bold text-indigo-600 bg-indigo-50 px-2 py-0.5 rounded">
                  {currentActiveOrder.orderId}
                </span>
              </div>
              <p className="text-sm font-semibold text-slate-800 mt-1">
                Estimated Delivery: <span className="text-indigo-600">{currentActiveOrder.estimatedDeliveryTime || 'In transit'}</span>
              </p>
            </div>

            <div>
              {(() => {
                const b = getOrderStatusBadge(currentActiveOrder.orderStatus);
                return (
                  <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium border ${b.bg} ${b.text} ${b.border}`}>
                    <span className={`w-2 h-2 rounded-full ${b.dot} animate-pulse`} />
                    {b.label}
                  </span>
                );
              })()}
            </div>
          </div>

          {/* Stepper Progress Visualizer */}
          <div className="pt-6 pb-2">
            <div className="grid grid-cols-4 gap-2 text-center text-xs">
              {[
                { key: 'PLACED', label: 'Placed' },
                { key: 'PREPARING', label: 'Preparing' },
                { key: 'OUT_FOR_DELIVERY', label: 'On Route' },
                { key: 'DELIVERED', label: 'Delivered' },
              ].map((step, idx) => {
                const statusOrder = ['PLACED', 'CONFIRMED', 'PREPARING', 'READY_FOR_PICKUP', 'OUT_FOR_DELIVERY', 'DELIVERED'];
                const currentIdx = statusOrder.indexOf(currentActiveOrder.orderStatus);
                const stepIdx = statusOrder.indexOf(step.key);
                const isPassed = currentIdx >= stepIdx;

                return (
                  <div key={step.key} className="flex flex-col items-center">
                    <div
                      className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-xs mb-2 transition-all ${
                        isPassed
                          ? 'bg-indigo-600 text-white shadow-md shadow-indigo-500/20'
                          : 'bg-slate-100 text-slate-400 border border-slate-200'
                      }`}
                    >
                      {idx + 1}
                    </div>
                    <span className={`font-medium ${isPassed ? 'text-slate-900 font-semibold' : 'text-slate-400'}`}>
                      {step.label}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* My Orders Table */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="p-5 border-b border-slate-100 flex items-center justify-between">
          <div>
            <h2 className="text-sm font-bold text-slate-900 tracking-tight">My Orders History</h2>
            <p className="text-xs text-slate-500">Live order items, delivery addresses, and payment statuses</p>
          </div>
          <Link to="/customer/orders" className="text-xs font-semibold text-indigo-600 hover:text-indigo-800 flex items-center gap-1">
            View All <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>

        {myOrders.length === 0 ? (
          <div className="p-12 text-center">
            <ShoppingBag className="w-12 h-12 text-slate-300 mx-auto mb-3" />
            <h3 className="text-base font-semibold text-slate-800">No orders yet</h3>
            <p className="text-xs text-slate-500 mt-1 max-w-sm mx-auto">
              You haven't placed any orders yet. Select a restaurant and place your first order!
            </p>
            <div className="mt-5">
              <Link to="/customer/orders/create">
                <Button variant="primary" size="sm" leftIcon={<PlusCircle className="w-4 h-4" />}>
                  Create Your First Order
                </Button>
              </Link>
            </div>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 text-slate-500 uppercase tracking-wider font-semibold border-b border-slate-100">
                <tr>
                  <th className="py-3 px-4">Order ID</th>
                  <th className="py-3 px-4">Restaurant</th>
                  <th className="py-3 px-4">Items Summary</th>
                  <th className="py-3 px-4">Amount</th>
                  <th className="py-3 px-4">Status</th>
                  <th className="py-3 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {myOrders.map((order) => {
                  const badgeInfo = getOrderStatusBadge(order.orderStatus);
                  return (
                    <tr key={order.orderId} className="hover:bg-slate-50/70 transition-colors">
                      <td className="py-3 px-4 font-mono font-semibold text-indigo-600">
                        {order.orderId}
                      </td>
                      <td className="py-3 px-4 font-medium text-slate-800">
                        {order.restaurant || 'LiveSync Kitchen'}
                      </td>
                      <td className="py-3 px-4 text-slate-600 max-w-xs truncate">
                        {order.items.map((i) => `${i.name} (x${i.quantity})`).join(', ')}
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
                      <td className="py-3 px-4 text-right">
                        <Link
                          to={`/customer/orders/${order.orderId}`}
                          className="inline-flex items-center gap-1 text-xs font-semibold text-indigo-600 hover:text-indigo-800 bg-indigo-50 hover:bg-indigo-100 px-2.5 py-1 rounded-lg transition-colors"
                        >
                          <span>Track Order</span>
                          <ArrowRight className="w-3 h-3" />
                        </Link>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};
