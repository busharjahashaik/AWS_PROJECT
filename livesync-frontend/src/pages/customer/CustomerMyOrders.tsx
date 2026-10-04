import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth, useOrders } from '../../hooks';
import { formatCurrency, formatDate, getOrderStatusBadge } from '../../utils/formatters';
import { OrderStatus } from '../../types';
import { 
  ShoppingBag, 
  PlusCircle, 
  ArrowRight, 
  Search, 
  Filter, 
  MapPin, 
  Calendar, 
  Clock, 
  CheckCircle, 
  ExternalLink 
} from 'lucide-react';
import { Button } from '../../components/common/Button';

export const CustomerMyOrders: React.FC = () => {
  const { user } = useAuth();
  const { orders } = useOrders();

  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('ALL');

  // Strict Customer Isolation: only orders belonging to currently logged-in customer
  const customerOrders = orders.filter(
    (o) =>
      o.customerId === user?.id ||
      (user?.email && o.customerEmail?.toLowerCase() === user.email.toLowerCase()) ||
      o.customerName.toLowerCase() === (user?.name || '').toLowerCase()
  );

  // Filtered orders
  const filteredOrders = customerOrders.filter((order) => {
    const matchesSearch =
      order.orderId.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (order.restaurant || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
      order.items.some((i) => i.name.toLowerCase().includes(searchQuery.toLowerCase()));

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
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b border-slate-200">
        <div>
          <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-indigo-50 text-indigo-700 text-xs font-medium border border-indigo-200 mb-1.5">
            <ShoppingBag className="w-3.5 h-3.5" />
            <span>Customer Portal</span>
          </div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight">My Orders</h1>
          <p className="text-xs text-slate-500">
            View all your past and live orders with synchronized real-time fulfillment status.
          </p>
        </div>

        <Link to="/customer/orders/create">
          <Button variant="primary" size="md" leftIcon={<PlusCircle className="w-4 h-4" />}>
            Create Order
          </Button>
        </Link>
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-white border border-slate-200 rounded-2xl p-4 shadow-xs flex flex-col md:flex-row items-center justify-between gap-4">
        {/* Search */}
        <div className="relative w-full md:w-80">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search by Order ID, restaurant, or item..."
            className="w-full text-xs pl-9 pr-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:bg-white transition-all"
          />
        </div>

        {/* Filter Tabs */}
        <div className="flex items-center gap-1 p-1 bg-slate-100 rounded-xl w-full md:w-auto overflow-x-auto">
          {[
            { id: 'ALL', label: 'All Orders' },
            { id: 'ACTIVE', label: 'In Progress' },
            { id: 'COMPLETED', label: 'Delivered' },
            { id: 'CANCELLED', label: 'Cancelled' },
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
          <ShoppingBag className="w-12 h-12 text-slate-300 mx-auto mb-3" />
          <h3 className="text-base font-bold text-slate-800">No orders found</h3>
          <p className="text-xs text-slate-500 mt-1 max-w-sm mx-auto">
            {customerOrders.length === 0
              ? "You haven't created any orders yet. Place your first order today!"
              : 'No orders matched your current search or filter.'}
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
        <div className="space-y-3">
          {filteredOrders.map((order) => {
            const badge = getOrderStatusBadge(order.orderStatus);
            return (
              <div
                key={order.orderId}
                className="bg-white border border-slate-200 hover:border-indigo-200 rounded-2xl p-5 shadow-xs hover:shadow-sm transition-all"
              >
                <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 pb-4 border-b border-slate-100">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-indigo-50 border border-indigo-100 flex items-center justify-center font-mono font-bold text-xs text-indigo-600">
                      ORD
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-mono text-sm font-bold text-slate-900">
                          {order.orderId}
                        </span>
                        <span className="text-slate-300">•</span>
                        <span className="text-xs font-semibold text-slate-700">
                          {order.restaurant || 'LiveSync Kitchen'}
                        </span>
                      </div>
                      <p className="text-[11px] text-slate-400 mt-0.5 flex items-center gap-1">
                        <Calendar className="w-3 h-3" />
                        <span>Placed on {formatDate(order.createdAt)}</span>
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-3">
                    <span
                      className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold border ${badge.bg} ${badge.text} ${badge.border}`}
                    >
                      <span className={`w-2 h-2 rounded-full ${badge.dot}`} />
                      {badge.label}
                    </span>

                    <span className="font-mono text-sm font-bold text-slate-900">
                      {formatCurrency(order.totalAmount)}
                    </span>

                    <Link to={`/customer/orders/${order.orderId}`}>
                      <Button
                        variant="primary"
                        size="sm"
                        rightIcon={<ArrowRight className="w-3.5 h-3.5" />}
                      >
                        Track Order
                      </Button>
                    </Link>
                  </div>
                </div>

                {/* Details Row */}
                <div className="pt-3 grid grid-cols-1 md:grid-cols-3 gap-3 text-xs">
                  <div>
                    <span className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider">
                      Ordered Items
                    </span>
                    <p className="text-slate-700 font-medium truncate mt-0.5">
                      {order.items.map((i) => `${i.name} (x${i.quantity})`).join(', ')}
                    </p>
                  </div>

                  <div>
                    <span className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider">
                      Delivery Address
                    </span>
                    <p className="text-slate-700 font-medium truncate mt-0.5 flex items-center gap-1">
                      <MapPin className="w-3 h-3 text-slate-400 shrink-0" />
                      <span className="truncate">{order.deliveryAddress}</span>
                    </p>
                  </div>

                  <div>
                    <span className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider">
                      Delivery Partner
                    </span>
                    <p className="text-slate-700 font-medium truncate mt-0.5">
                      {order.deliveryPartnerName ? (
                        <span className="text-emerald-700 font-semibold">{order.deliveryPartnerName}</span>
                      ) : (
                        <span className="text-slate-400 italic">Dispatched / Pending Assignment</span>
                      )}
                    </p>
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
