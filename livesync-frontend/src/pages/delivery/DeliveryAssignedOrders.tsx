import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth, useOrders } from '../../hooks';
import { formatCurrency, formatDate, getOrderStatusBadge } from '../../utils/formatters';
import { OrderStatus } from '../../types';
import { 
  Truck, 
  MapPin, 
  Phone, 
  Search, 
  Store, 
  Navigation, 
  PackageCheck, 
  CheckCircle2, 
  ArrowRight,
  Filter
} from 'lucide-react';
import { Button } from '../../components/common/Button';

export const DeliveryAssignedOrders: React.FC = () => {
  const { user } = useAuth();
  const { orders, updateOrderStatus } = useOrders();
  const [updatingOrderId, setUpdatingOrderId] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('ALL');

  // Filter assigned orders
  const myAssignedOrders = orders.filter(
    (o) =>
      o.deliveryPartnerId === user?.id ||
      o.deliveryPartnerName?.toLowerCase() === (user?.name || '').toLowerCase() ||
      o.deliveryPartnerId === 'usr-deliv-01' ||
      !o.deliveryPartnerId
  );

  const handleStatusTransition = async (orderId: string, nextStatus: OrderStatus) => {
    setUpdatingOrderId(orderId);
    try {
      await updateOrderStatus(orderId, nextStatus);
    } catch (err: any) {
      alert(err.message || 'Failed to update order status');
    } finally {
      setUpdatingOrderId(null);
    }
  };

  const filteredOrders = myAssignedOrders.filter((order) => {
    const matchesSearch =
      order.orderId.toLowerCase().includes(searchQuery.toLowerCase()) ||
      order.customerName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (order.restaurant || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
      order.deliveryAddress.toLowerCase().includes(searchQuery.toLowerCase());

    const matchesStatus =
      statusFilter === 'ALL'
        ? true
        : statusFilter === 'ACTIVE'
        ? order.orderStatus !== 'DELIVERED' && order.orderStatus !== 'CANCELLED'
        : statusFilter === 'COMPLETED'
        ? order.orderStatus === 'DELIVERED'
        : order.orderStatus === statusFilter;

    return matchesSearch && matchesStatus;
  });

  return (
    <div className="max-w-7xl mx-auto space-y-6 animate-fade-in font-sans">
      <div className="pb-2 border-b border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-amber-50 text-amber-700 text-xs font-medium border border-amber-200 mb-1.5">
            <Truck className="w-3.5 h-3.5" />
            <span>Delivery Fleet • Assigned Route Queue</span>
          </div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Assigned Orders</h1>
          <p className="text-xs text-slate-500">
            Real-time delivery assignments and direct one-click status transitions.
          </p>
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
            placeholder="Search by order, customer, or address..."
            className="w-full text-xs pl-9 pr-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:bg-white"
          />
        </div>

        <div className="flex items-center gap-1 p-1 bg-slate-100 rounded-xl w-full md:w-auto overflow-x-auto">
          {[
            { id: 'ALL', label: 'All Assigned' },
            { id: 'ACTIVE', label: 'In Progress' },
            { id: 'COMPLETED', label: 'Delivered' },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setStatusFilter(tab.id)}
              className={`px-3 py-1.5 text-xs font-semibold rounded-lg whitespace-nowrap transition-all ${
                statusFilter === tab.id
                  ? 'bg-white text-indigo-700 shadow-xs'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200/60'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {/* Orders List */}
      {filteredOrders.length === 0 ? (
        <div className="bg-white border border-slate-200 rounded-2xl p-12 text-center shadow-xs">
          <Truck className="w-12 h-12 text-slate-300 mx-auto mb-3" />
          <h3 className="text-base font-bold text-slate-800">No deliveries found</h3>
          <p className="text-xs text-slate-500 mt-1">No orders matched your current filter criteria.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {filteredOrders.map((order) => {
            const badge = getOrderStatusBadge(order.orderStatus);
            const isBusy = updatingOrderId === order.orderId;

            return (
              <div
                key={order.orderId}
                className="bg-white border border-slate-200 hover:border-slate-300 rounded-2xl p-5 shadow-xs transition-all"
              >
                <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 pb-4 border-b border-slate-100">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-amber-50 border border-amber-100 flex items-center justify-center font-mono font-bold text-xs text-amber-700">
                      DEL
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-mono text-sm font-bold text-slate-900">
                          {order.orderId}
                        </span>
                        <span className="text-slate-300">•</span>
                        <span className="text-xs font-semibold text-slate-800">
                          {order.restaurant || 'LiveSync Kitchen'}
                        </span>
                      </div>
                      <p className="text-[11px] text-slate-400 mt-0.5">
                        Customer: <strong className="text-slate-700">{order.customerName}</strong> ({order.contactNumber})
                      </p>
                    </div>
                  </div>

                  <div className="flex flex-wrap items-center gap-3">
                    <span
                      className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold border ${badge.bg} ${badge.text} ${badge.border}`}
                    >
                      <span className={`w-2 h-2 rounded-full ${badge.dot}`} />
                      {badge.label}
                    </span>

                    <span className="font-mono text-sm font-bold text-slate-900">
                      {formatCurrency(order.totalAmount)}
                    </span>

                    {/* Quick Status Action Buttons */}
                    {(order.orderStatus === 'PLACED' || order.orderStatus === 'CONFIRMED') && (
                      <Button
                        variant="primary"
                        size="sm"
                        isLoading={isBusy}
                        onClick={() => handleStatusTransition(order.orderId, 'READY_FOR_PICKUP')}
                        leftIcon={<Store className="w-3.5 h-3.5" />}
                      >
                        Accept Delivery
                      </Button>
                    )}

                    {order.orderStatus === 'READY_FOR_PICKUP' && (
                      <Button
                        variant="primary"
                        size="sm"
                        isLoading={isBusy}
                        onClick={() => handleStatusTransition(order.orderId, 'PICKED_UP')}
                        leftIcon={<PackageCheck className="w-3.5 h-3.5" />}
                      >
                        Mark as Picked Up
                      </Button>
                    )}

                    {order.orderStatus === 'PICKED_UP' && (
                      <Button
                        variant="primary"
                        size="sm"
                        className="bg-purple-600 hover:bg-purple-700"
                        isLoading={isBusy}
                        onClick={() => handleStatusTransition(order.orderId, 'OUT_FOR_DELIVERY')}
                        leftIcon={<Navigation className="w-3.5 h-3.5" />}
                      >
                        Start Delivery
                      </Button>
                    )}

                    {order.orderStatus === 'OUT_FOR_DELIVERY' && (
                      <Button
                        variant="primary"
                        size="sm"
                        className="bg-emerald-600 hover:bg-emerald-700"
                        isLoading={isBusy}
                        onClick={() => handleStatusTransition(order.orderId, 'DELIVERED')}
                        leftIcon={<CheckCircle2 className="w-3.5 h-3.5" />}
                      >
                        Mark as Delivered
                      </Button>
                    )}

                    <Link to={`/delivery/orders/${order.orderId}`}>
                      <Button variant="outline" size="sm" rightIcon={<ArrowRight className="w-3.5 h-3.5" />}>
                        Details
                      </Button>
                    </Link>
                  </div>
                </div>

                <div className="pt-3 grid grid-cols-1 md:grid-cols-2 gap-3 text-xs">
                  <div className="flex items-center gap-1.5 text-slate-600">
                    <MapPin className="w-3.5 h-3.5 text-indigo-600 shrink-0" />
                    <span className="font-medium text-slate-800">Drop-off:</span>
                    <span className="truncate">{order.deliveryAddress}</span>
                  </div>

                  <div className="flex items-center gap-1.5 text-slate-600 truncate">
                    <span className="font-medium text-slate-800">Items ({order.items.length}):</span>
                    <span className="truncate">{order.items.map((i) => `${i.name} (x${i.quantity})`).join(', ')}</span>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};
