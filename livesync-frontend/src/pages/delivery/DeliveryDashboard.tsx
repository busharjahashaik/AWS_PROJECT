import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth, useOrders } from '../../hooks';
import { StatCard } from '../../components/common/StatCard';
import { Button } from '../../components/common/Button';
import { formatCurrency, formatRelativeTime, getOrderStatusBadge } from '../../utils/formatters';
import { OrderStatus } from '../../types';
import { 
  Truck, 
  MapPin, 
  Phone, 
  CheckCircle2, 
  Clock, 
  Navigation, 
  PackageCheck,
  Package,
  Store,
  ArrowRight,
  ShoppingBag
} from 'lucide-react';

export const DeliveryDashboard: React.FC = () => {
  const { user } = useAuth();
  const { orders, updateOrderStatus } = useOrders();
  const [updatingOrderId, setUpdatingOrderId] = useState<string | null>(null);
  const [actionSuccess, setActionSuccess] = useState<string | null>(null);

  // Orders assigned to this courier (or unassigned/open orders)
  const myAssignedOrders = orders.filter(
    (o) =>
      o.deliveryPartnerId === user?.id ||
      o.deliveryPartnerName?.toLowerCase() === (user?.name || '').toLowerCase() ||
      o.deliveryPartnerId === 'usr-deliv-01' || // Default demo courier
      !o.deliveryPartnerId
  );

  const activeDeliveries = myAssignedOrders.filter(
    (o) => o.orderStatus !== 'DELIVERED' && o.orderStatus !== 'CANCELLED'
  );

  const pendingPickup = myAssignedOrders.filter(
    (o) => o.orderStatus === 'CONFIRMED' || o.orderStatus === 'READY_FOR_PICKUP' || o.orderStatus === 'PLACED'
  );

  const outForDelivery = myAssignedOrders.filter((o) => o.orderStatus === 'OUT_FOR_DELIVERY');
  const completedDeliveries = myAssignedOrders.filter((o) => o.orderStatus === 'DELIVERED');

  // Currently active delivery run
  const currentRun = activeDeliveries[0];

  const handleStatusTransition = async (orderId: string, nextStatus: OrderStatus) => {
    setUpdatingOrderId(orderId);
    setActionSuccess(null);
    try {
      await updateOrderStatus(orderId, nextStatus);
      setActionSuccess(`Order ${orderId} updated to ${nextStatus.replace(/_/g, ' ')}! Real-time mutation broadcasted.`);
      setTimeout(() => setActionSuccess(null), 4500);
    } catch (err: any) {
      alert(err.message || 'Failed to update order status');
    } finally {
      setUpdatingOrderId(null);
    }
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto animate-fade-in font-sans">
      {/* Top Banner */}
      <div className="bg-slate-900 text-white rounded-2xl p-6 sm:p-8 shadow-sm border border-slate-800 flex flex-col md:flex-row md:items-center md:justify-between gap-6">
        <div>
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-amber-500/20 text-amber-300 text-xs font-medium mb-3 border border-amber-500/30">
            <Truck className="w-3.5 h-3.5 text-amber-400" />
            <span>Delivery Partner Console</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-white">
            Courier: {user?.name || 'Courier Partner'}
          </h1>
          <p className="text-xs sm:text-sm text-slate-400 mt-1 max-w-xl">
            Manage your assigned dispatch routes, navigate to recipient drop-offs, and broadcast live status updates in real time.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <span className="inline-flex items-center gap-2 px-3.5 py-2 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-300 text-xs font-semibold">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
            Active On Fleet
          </span>
        </div>
      </div>

      {actionSuccess && (
        <div className="p-3.5 bg-emerald-50 border border-emerald-200 rounded-xl text-emerald-800 text-xs flex items-center gap-2 animate-fade-in">
          <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
          <span>{actionSuccess}</span>
        </div>
      )}

      {/* Exactly 4 Dashboard KPI Cards (Section 14 Specification) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          label="Assigned Orders"
          value={activeDeliveries.length}
          icon={<ShoppingBag className="w-5 h-5 text-indigo-600" />}
          subtext="total active assignments"
        />
        <StatCard
          label="Pending Pickup"
          value={pendingPickup.length}
          icon={<Store className="w-5 h-5 text-amber-600" />}
          subtext="ready at restaurants"
        />
        <StatCard
          label="Out for Delivery"
          value={outForDelivery.length}
          icon={<Truck className="w-5 h-5 text-purple-600" />}
          subtext="on road right now"
        />
        <StatCard
          label="Completed Today"
          value={completedDeliveries.length}
          icon={<CheckCircle2 className="w-5 h-5 text-emerald-600" />}
          subtext="successfully delivered"
        />
      </div>

      {/* Current Delivery Card (Section 14 & 15 Specification) */}
      {currentRun ? (
        <div className="bg-white border-2 border-indigo-200 rounded-2xl p-6 shadow-sm">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-4 border-b border-slate-100 gap-3">
            <div>
              <div className="flex items-center gap-2">
                <span className="text-[10px] font-bold uppercase tracking-wider text-indigo-600 bg-indigo-50 px-2.5 py-0.5 rounded-full border border-indigo-100">
                  Current Delivery
                </span>
                <span className="font-mono text-xs font-bold text-slate-900">
                  {currentRun.orderId}
                </span>
              </div>
              <h3 className="text-lg font-bold text-slate-900 mt-1">
                {currentRun.restaurant || 'Pickup Location'} → {currentRun.customerName}
              </h3>
            </div>
            <div>
              {(() => {
                const b = getOrderStatusBadge(currentRun.orderStatus);
                return (
                  <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold border ${b.bg} ${b.text} ${b.border}`}>
                    <span className={`w-2 h-2 rounded-full ${b.dot} animate-pulse`} />
                    {b.label}
                  </span>
                );
              })()}
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 my-5 text-xs">
            {/* Customer Delivery Area */}
            <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-100 flex items-start gap-3">
              <MapPin className="w-5 h-5 text-indigo-600 shrink-0 mt-0.5" />
              <div>
                <span className="text-[10px] text-slate-400 font-semibold uppercase block">Customer Delivery Area</span>
                <span className="font-semibold text-slate-800 text-sm">{currentRun.deliveryAddress}</span>
                {currentRun.specialInstructions && (
                  <p className="text-[11px] text-slate-500 mt-1">Note: {currentRun.specialInstructions}</p>
                )}
              </div>
            </div>

            {/* Items */}
            <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-100 flex items-start gap-3">
              <Package className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
              <div>
                <span className="text-[10px] text-slate-400 font-semibold uppercase block">Items ({currentRun.items.length})</span>
                <p className="font-semibold text-slate-800 text-xs mt-0.5">
                  {currentRun.items.map((i) => `${i.name} (x${i.quantity})`).join(', ')}
                </p>
              </div>
            </div>

            {/* Amount & Contact */}
            <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-100 flex items-start gap-3">
              <Phone className="w-5 h-5 text-emerald-600 shrink-0 mt-0.5" />
              <div>
                <span className="text-[10px] text-slate-400 font-semibold uppercase block">Amount & Customer Contact</span>
                <p className="font-mono font-bold text-slate-900 text-sm">{formatCurrency(currentRun.totalAmount)}</p>
                <p className="text-slate-600 text-xs mt-0.5">{currentRun.contactNumber}</p>
              </div>
            </div>
          </div>

          {/* Delivery Status Flow Actions (Section 15 Specification) */}
          {/* CONFIRMED / PLACED -> READY_FOR_PICKUP -> PICKED_UP -> OUT_FOR_DELIVERY -> DELIVERED */}
          <div className="pt-4 border-t border-slate-100 flex flex-wrap items-center justify-between gap-3">
            <span className="text-xs font-semibold text-slate-600">
              Next Action for Courier:
            </span>

            <div className="flex items-center gap-2">
              {(currentRun.orderStatus === 'PLACED' || currentRun.orderStatus === 'CONFIRMED') && (
                <Button
                  variant="primary"
                  size="sm"
                  isLoading={updatingOrderId === currentRun.orderId}
                  onClick={() => handleStatusTransition(currentRun.orderId, 'READY_FOR_PICKUP')}
                  leftIcon={<Store className="w-3.5 h-3.5" />}
                >
                  Accept Delivery
                </Button>
              )}

              {currentRun.orderStatus === 'READY_FOR_PICKUP' && (
                <Button
                  variant="primary"
                  size="sm"
                  isLoading={updatingOrderId === currentRun.orderId}
                  onClick={() => handleStatusTransition(currentRun.orderId, 'PICKED_UP')}
                  leftIcon={<PackageCheck className="w-3.5 h-3.5" />}
                >
                  Mark as Picked Up
                </Button>
              )}

              {currentRun.orderStatus === 'PICKED_UP' && (
                <Button
                  variant="primary"
                  size="sm"
                  className="bg-purple-600 hover:bg-purple-700"
                  isLoading={updatingOrderId === currentRun.orderId}
                  onClick={() => handleStatusTransition(currentRun.orderId, 'OUT_FOR_DELIVERY')}
                  leftIcon={<Navigation className="w-3.5 h-3.5" />}
                >
                  Start Delivery (Out for Delivery)
                </Button>
              )}

              {currentRun.orderStatus === 'OUT_FOR_DELIVERY' && (
                <Button
                  variant="primary"
                  size="sm"
                  className="bg-emerald-600 hover:bg-emerald-700"
                  isLoading={updatingOrderId === currentRun.orderId}
                  onClick={() => handleStatusTransition(currentRun.orderId, 'DELIVERED')}
                  leftIcon={<CheckCircle2 className="w-3.5 h-3.5" />}
                >
                  Mark as Delivered
                </Button>
              )}

              <Link to={`/delivery/orders/${currentRun.orderId}`}>
                <Button variant="outline" size="sm">
                  View Full Details
                </Button>
              </Link>
            </div>
          </div>
        </div>
      ) : (
        <div className="p-8 text-center bg-white border border-slate-200 rounded-2xl shadow-xs">
          <CheckCircle2 className="w-10 h-10 text-emerald-500 mx-auto mb-2" />
          <h3 className="text-sm font-bold text-slate-800">All deliveries complete!</h3>
          <p className="text-xs text-slate-500 mt-1">No active delivery assignments at this moment.</p>
        </div>
      )}

      {/* Driver Assigned Orders Table */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="p-5 border-b border-slate-100 flex items-center justify-between">
          <div>
            <h2 className="text-sm font-bold text-slate-900 tracking-tight">Assigned Deliveries Pipeline</h2>
            <p className="text-xs text-slate-500">Orders designated for your delivery run</p>
          </div>
          <Link to="/delivery/orders" className="text-xs font-semibold text-indigo-600 hover:text-indigo-800 flex items-center gap-1">
            <span>View All</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 text-slate-500 uppercase tracking-wider font-semibold border-b border-slate-100">
              <tr>
                <th className="py-3 px-4">Order ID</th>
                <th className="py-3 px-4">Restaurant</th>
                <th className="py-3 px-4">Customer</th>
                <th className="py-3 px-4">Delivery Area</th>
                <th className="py-3 px-4">Amount</th>
                <th className="py-3 px-4">Status</th>
                <th className="py-3 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {myAssignedOrders.slice(0, 6).map((order) => {
                const badgeInfo = getOrderStatusBadge(order.orderStatus);
                return (
                  <tr key={order.orderId} className="hover:bg-slate-50/70 transition-colors">
                    <td className="py-3 px-4 font-mono font-semibold text-indigo-600">
                      {order.orderId}
                    </td>
                    <td className="py-3 px-4 font-medium text-slate-800">
                      {order.restaurant || 'LiveSync Kitchen'}
                    </td>
                    <td className="py-3 px-4 text-slate-700">
                      {order.customerName}
                    </td>
                    <td className="py-3 px-4 text-slate-600 max-w-xs truncate">
                      {order.deliveryAddress}
                    </td>
                    <td className="py-3 px-4 font-semibold text-slate-800 font-mono">
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
                        to={`/delivery/orders/${order.orderId}`}
                        className="inline-flex items-center gap-1 text-xs font-semibold text-indigo-600 hover:text-indigo-800 bg-indigo-50 hover:bg-indigo-100 px-2.5 py-1 rounded-lg transition-colors"
                      >
                        <span>Manage</span>
                        <ArrowRight className="w-3 h-3" />
                      </Link>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
