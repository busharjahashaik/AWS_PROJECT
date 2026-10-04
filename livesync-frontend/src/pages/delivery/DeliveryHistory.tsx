import React from 'react';
import { Link } from 'react-router-dom';
import { useAuth, useOrders } from '../../hooks';
import { formatCurrency, formatDate, getOrderStatusBadge } from '../../utils/formatters';
import { Truck, CheckCircle2, Calendar, MapPin, ArrowRight } from 'lucide-react';
import { Button } from '../../components/common/Button';

export const DeliveryHistory: React.FC = () => {
  const { user } = useAuth();
  const { orders } = useOrders();

  // Completed deliveries for this courier
  const completedOrders = orders.filter(
    (o) =>
      o.orderStatus === 'DELIVERED' &&
      (o.deliveryPartnerId === user?.id ||
        o.deliveryPartnerName?.toLowerCase() === (user?.name || '').toLowerCase() ||
        o.deliveryPartnerId === 'usr-deliv-01')
  );

  const totalEarnings = completedOrders.length * 8.50; // Estimated driver payout per delivery

  return (
    <div className="max-w-7xl mx-auto space-y-6 animate-fade-in font-sans">
      <div className="pb-2 border-b border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-emerald-50 text-emerald-700 text-xs font-medium border border-emerald-200 mb-1.5">
            <CheckCircle2 className="w-3.5 h-3.5" />
            <span>Fulfillment Archives</span>
          </div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Delivery History</h1>
          <p className="text-xs text-slate-500">Historical completed deliveries and fulfilled customer drop-offs.</p>
        </div>

        <div className="p-3 bg-white border border-slate-200 rounded-xl flex items-center gap-6 text-xs">
          <div>
            <span className="text-slate-400 block font-semibold text-[10px] uppercase">Delivered</span>
            <span className="text-lg font-bold text-slate-900">{completedOrders.length} orders</span>
          </div>
          <div className="border-l border-slate-100 pl-6">
            <span className="text-slate-400 block font-semibold text-[10px] uppercase">Estimated Payout</span>
            <span className="text-lg font-bold text-emerald-600 font-mono">{formatCurrency(totalEarnings)}</span>
          </div>
        </div>
      </div>

      {completedOrders.length === 0 ? (
        <div className="bg-white border border-slate-200 rounded-2xl p-12 text-center shadow-xs">
          <Truck className="w-12 h-12 text-slate-300 mx-auto mb-3" />
          <h3 className="text-base font-bold text-slate-800">No completed deliveries yet</h3>
          <p className="text-xs text-slate-500 mt-1">Completed orders will be logged here automatically.</p>
          <div className="mt-4">
            <Link to="/delivery/orders">
              <Button variant="primary" size="sm">
                View Active Runs
              </Button>
            </Link>
          </div>
        </div>
      ) : (
        <div className="space-y-3">
          {completedOrders.map((order) => {
            const badge = getOrderStatusBadge(order.orderStatus);
            return (
              <div
                key={order.orderId}
                className="bg-white border border-slate-200 rounded-2xl p-5 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4"
              >
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-mono text-xs font-bold text-indigo-600 bg-indigo-50 px-2 py-0.5 rounded">
                      {order.orderId}
                    </span>
                    <span className="text-slate-300">•</span>
                    <span className="text-xs font-bold text-slate-900">{order.restaurant}</span>
                    <span className="text-slate-300">→</span>
                    <span className="text-xs font-semibold text-slate-700">{order.customerName}</span>
                  </div>
                  <p className="text-[11px] text-slate-500 mt-1 flex items-center gap-1">
                    <MapPin className="w-3 h-3 text-slate-400" />
                    <span>{order.deliveryAddress}</span>
                  </p>
                  <p className="text-[10px] text-slate-400 mt-0.5 flex items-center gap-1">
                    <Calendar className="w-3 h-3" />
                    <span>Completed on {formatDate(order.updatedAt)}</span>
                  </p>
                </div>

                <div className="flex items-center gap-3">
                  <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold border ${badge.bg} ${badge.text} ${badge.border}`}>
                    <span className={`w-2 h-2 rounded-full ${badge.dot}`} />
                    {badge.label}
                  </span>

                  <span className="font-mono font-bold text-slate-900 text-sm">
                    {formatCurrency(order.totalAmount)}
                  </span>

                  <Link to={`/delivery/orders/${order.orderId}`}>
                    <Button variant="outline" size="sm" rightIcon={<ArrowRight className="w-3.5 h-3.5" />}>
                      Details
                    </Button>
                  </Link>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};
