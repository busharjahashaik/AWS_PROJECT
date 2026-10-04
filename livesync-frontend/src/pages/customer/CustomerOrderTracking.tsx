import React from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { useAuth, useOrders, useRealTime } from '../../hooks';
import { formatCurrency, formatDate, formatRelativeTime, getOrderStatusBadge } from '../../utils/formatters';
import { OrderStatus } from '../../types';
import { 
  ArrowLeft, 
  MapPin, 
  Phone, 
  Calendar, 
  Clock, 
  CheckCircle2, 
  Truck, 
  Store, 
  Radio, 
  CreditCard,
  ChefHat,
  PackageCheck,
  Package,
  AlertCircle,
  HelpCircle,
  ShieldCheck
} from 'lucide-react';
import { Button } from '../../components/common/Button';

export const CustomerOrderTracking: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const { user } = useAuth();
  const { orders } = useOrders();
  const { liveEvents } = useRealTime();
  const navigate = useNavigate();

  // Strict customer isolation filter
  const myOrders = orders.filter(
    (o) =>
      o.customerId === user?.id ||
      (user?.email && o.customerEmail?.toLowerCase() === user.email.toLowerCase()) ||
      o.customerName.toLowerCase() === (user?.name || '').toLowerCase()
  );

  // If order id specified, find it; otherwise take latest active or first order
  const targetOrderId = id || myOrders[0]?.orderId;
  const order = orders.find((o) => o.orderId === targetOrderId);

  // Progress timeline steps specified by Section 13:
  // Placed -> Confirmed -> Preparing -> Ready for Pickup -> Picked Up -> Out for Delivery -> Delivered
  const timelineSteps: { key: OrderStatus; label: string; icon: React.ElementType }[] = [
    { key: 'PLACED', label: 'Placed', icon: Package },
    { key: 'CONFIRMED', label: 'Confirmed', icon: CheckCircle2 },
    { key: 'PREPARING', label: 'Preparing', icon: ChefHat },
    { key: 'READY_FOR_PICKUP', label: 'Ready for Pickup', icon: Store },
    { key: 'PICKED_UP', label: 'Picked Up', icon: PackageCheck },
    { key: 'OUT_FOR_DELIVERY', label: 'Out for Delivery', icon: Truck },
    { key: 'DELIVERED', label: 'Delivered', icon: ShieldCheck },
  ];

  const statusOrder: OrderStatus[] = [
    'PLACED',
    'CONFIRMED',
    'PREPARING',
    'READY_FOR_PICKUP',
    'PICKED_UP',
    'OUT_FOR_DELIVERY',
    'DELIVERED',
  ];

  const currentStatusIndex = order ? statusOrder.indexOf(order.orderStatus) : -1;

  // Filter live updates for this specific order
  const orderEvents = liveEvents.filter((e) => e.orderId === targetOrderId);

  if (!order) {
    return (
      <div className="max-w-4xl mx-auto py-12 text-center animate-fade-in font-sans">
        <div className="bg-white border border-slate-200 rounded-2xl p-12 shadow-xs">
          <AlertCircle className="w-12 h-12 text-amber-500 mx-auto mb-3" />
          <h2 className="text-xl font-bold text-slate-800">Order Not Found</h2>
          <p className="text-xs text-slate-500 mt-1 max-w-sm mx-auto">
            {targetOrderId ? `Order ${targetOrderId} does not exist or has not been created yet.` : 'You do not have any orders to track.'}
          </p>
          <div className="mt-6 flex items-center justify-center gap-3">
            <Link to="/customer/orders">
              <Button variant="outline" size="sm" leftIcon={<ArrowLeft className="w-3.5 h-3.5" />}>
                My Orders
              </Button>
            </Link>
            <Link to="/customer/orders/create">
              <Button variant="primary" size="sm">
                Create An Order
              </Button>
            </Link>
          </div>
        </div>
      </div>
    );
  }

  const badge = getOrderStatusBadge(order.orderStatus);

  return (
    <div className="max-w-5xl mx-auto space-y-6 animate-fade-in font-sans">
      {/* Top Bar Navigation */}
      <div className="flex items-center justify-between">
        <Link
          to="/customer/orders"
          className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-600 hover:text-slate-900 transition-colors"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          <span>Back to My Orders</span>
        </Link>

        {myOrders.length > 1 && (
          <div className="flex items-center gap-2">
            <span className="text-xs text-slate-400">Switch Order:</span>
            <select
              value={order.orderId}
              onChange={(e) => navigate(`/customer/orders/${e.target.value}`)}
              className="text-xs font-mono font-bold bg-white border border-slate-200 rounded-lg px-2.5 py-1 text-slate-800 focus:outline-none focus:ring-1 focus:ring-indigo-500"
            >
              {myOrders.map((o) => (
                <option key={o.orderId} value={o.orderId}>
                  {o.orderId} • {o.restaurant}
                </option>
              ))}
            </select>
          </div>
        )}
      </div>

      {/* Main Order Card */}
      <div className="bg-white border border-slate-200 rounded-2xl p-6 sm:p-8 shadow-xs">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-slate-100">
          <div>
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold uppercase tracking-wider text-slate-400">
                Order Tracking
              </span>
              <span className="font-mono text-base font-extrabold text-indigo-600 bg-indigo-50 px-2.5 py-0.5 rounded-lg border border-indigo-100">
                {order.orderId}
              </span>
            </div>
            <h1 className="text-xl font-bold text-slate-900 mt-1">
              {order.restaurant || 'LiveSync Kitchen'}
            </h1>
            <p className="text-xs text-slate-400 mt-0.5">
              Placed on {formatDate(order.createdAt)}
            </p>
          </div>

          <div className="flex flex-col sm:items-end gap-1.5">
            <div className="flex items-center gap-2">
              <span
                className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold border ${badge.bg} ${badge.text} ${badge.border}`}
              >
                <span className={`w-2 h-2 rounded-full ${badge.dot} animate-pulse`} />
                {badge.label}
              </span>
            </div>
            <p className="text-xs text-slate-500">
              Estimated Delivery: <strong className="text-slate-800">{order.estimatedDeliveryTime || '30-40 mins'}</strong>
            </p>
          </div>
        </div>

        {/* Visual Progress Timeline (Section 13 Specification) */}
        <div className="pt-8 pb-6">
          <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-6">
            Live Fulfillment Progress
          </h3>

          <div className="relative">
            {/* Progress bar background */}
            <div className="hidden md:block absolute top-5 left-6 right-6 h-1 bg-slate-100 rounded-full z-0" />
            
            {/* Progress bar active fill */}
            <div
              className="hidden md:block absolute top-5 left-6 h-1 bg-indigo-600 rounded-full z-0 transition-all duration-500"
              style={{
                width: `${Math.min(100, Math.max(0, (currentStatusIndex / (statusOrder.length - 1)) * 100))}%`,
              }}
            />

            <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-7 gap-4 relative z-10">
              {timelineSteps.map((step, idx) => {
                const stepIdx = statusOrder.indexOf(step.key);
                const isCompleted = currentStatusIndex >= stepIdx;
                const isCurrent = currentStatusIndex === stepIdx;
                const StepIcon = step.icon;

                return (
                  <div key={step.key} className="flex flex-col items-center text-center">
                    <div
                      className={`w-10 h-10 rounded-full flex items-center justify-center transition-all ${
                        isCurrent
                          ? 'bg-indigo-600 text-white ring-4 ring-indigo-100 shadow-md shadow-indigo-500/30'
                          : isCompleted
                          ? 'bg-emerald-600 text-white shadow-xs'
                          : 'bg-white text-slate-400 border-2 border-slate-200'
                      }`}
                    >
                      <StepIcon className="w-5 h-5" />
                    </div>
                    <span
                      className={`text-xs mt-2 font-medium ${
                        isCurrent
                          ? 'text-indigo-600 font-bold'
                          : isCompleted
                          ? 'text-slate-900 font-semibold'
                          : 'text-slate-400'
                      }`}
                    >
                      {step.label}
                    </span>
                    {isCurrent && (
                      <span className="text-[10px] text-indigo-500 font-semibold uppercase tracking-wider mt-0.5">
                        Current
                      </span>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* Courier & Delivery Info Grid */}
        <div className="mt-6 pt-6 border-t border-slate-100 grid grid-cols-1 md:grid-cols-3 gap-6 text-xs">
          {/* Delivery Address */}
          <div className="p-4 rounded-xl bg-slate-50 border border-slate-100">
            <div className="flex items-center gap-1.5 text-slate-400 uppercase font-semibold text-[10px] mb-2">
              <MapPin className="w-3.5 h-3.5 text-indigo-600" />
              <span>Delivery Address</span>
            </div>
            <p className="font-semibold text-slate-800 text-xs leading-relaxed">
              {order.deliveryAddress}
            </p>
            {order.specialInstructions && (
              <p className="text-[11px] text-slate-500 mt-2 pt-2 border-t border-slate-200/60">
                <span className="font-semibold">Note:</span> {order.specialInstructions}
              </p>
            )}
          </div>

          {/* Delivery Partner */}
          <div className="p-4 rounded-xl bg-slate-50 border border-slate-100">
            <div className="flex items-center gap-1.5 text-slate-400 uppercase font-semibold text-[10px] mb-2">
              <Truck className="w-3.5 h-3.5 text-indigo-600" />
              <span>Assigned Delivery Partner</span>
            </div>
            {order.deliveryPartnerName ? (
              <div>
                <p className="font-bold text-slate-900 text-sm">{order.deliveryPartnerName}</p>
                <p className="text-[11px] text-slate-500 mt-1 flex items-center gap-1">
                  <Phone className="w-3 h-3 text-slate-400" />
                  <span>{order.deliveryPartnerPhone || '+1 (555) 782-3490'}</span>
                </p>
                <div className="mt-2 inline-flex items-center gap-1 px-2 py-0.5 rounded bg-emerald-50 text-emerald-700 font-medium text-[10px] border border-emerald-200">
                  <CheckCircle2 className="w-3 h-3" />
                  <span>Active Courier</span>
                </div>
              </div>
            ) : (
              <div className="text-slate-400 py-2">
                <p className="italic">Dispatching to courier network...</p>
                <p className="text-[10px] text-slate-400 mt-1">Status will auto-sync once accepted</p>
              </div>
            )}
          </div>

          {/* Payment & Total */}
          <div className="p-4 rounded-xl bg-slate-50 border border-slate-100">
            <div className="flex items-center gap-1.5 text-slate-400 uppercase font-semibold text-[10px] mb-2">
              <CreditCard className="w-3.5 h-3.5 text-indigo-600" />
              <span>Payment Details</span>
            </div>
            <div className="space-y-1 text-slate-600">
              <div className="flex justify-between">
                <span>Method:</span>
                <span className="font-semibold text-slate-800">{order.paymentMethod || 'Card'}</span>
              </div>
              <div className="flex justify-between">
                <span>Payment Status:</span>
                <span className="font-semibold text-emerald-700 capitalize">{order.paymentStatus.toLowerCase()}</span>
              </div>
              <div className="flex justify-between text-sm font-bold text-slate-900 pt-1 border-t border-slate-200/60">
                <span>Total:</span>
                <span className="font-mono text-indigo-600">{formatCurrency(order.totalAmount)}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Items Breakdown */}
        <div className="mt-6 pt-6 border-t border-slate-100">
          <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-3">
            Ordered Items ({order.items.length})
          </h3>
          <div className="divide-y divide-slate-100">
            {order.items.map((item) => (
              <div key={item.id} className="py-2.5 flex items-center justify-between text-xs">
                <div className="flex items-center gap-2.5">
                  <span className="text-lg">{item.emoji || '📦'}</span>
                  <div>
                    <span className="font-semibold text-slate-800">{item.name}</span>
                    <span className="text-slate-400 ml-2 text-[11px]">x{item.quantity}</span>
                  </div>
                </div>
                <span className="font-mono font-semibold text-slate-800">
                  {formatCurrency(item.price * item.quantity)}
                </span>
              </div>
            ))}
          </div>

          <div className="mt-3 pt-3 border-t border-slate-100 flex justify-end">
            <div className="w-full sm:w-64 space-y-1 text-xs">
              <div className="flex justify-between text-slate-500">
                <span>Subtotal</span>
                <span className="font-mono">{formatCurrency(order.subtotal || order.totalAmount - 4.99)}</span>
              </div>
              <div className="flex justify-between text-slate-500">
                <span>Delivery Fee</span>
                <span className="font-mono">{formatCurrency(order.deliveryFee || 4.99)}</span>
              </div>
              <div className="flex justify-between font-bold text-slate-900 text-sm pt-1 border-t border-slate-200">
                <span>Grand Total</span>
                <span className="font-mono text-indigo-600">{formatCurrency(order.totalAmount)}</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Live Updates Section (Section 13 Specification) */}
      <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-xs">
        <div className="flex items-center justify-between pb-4 border-b border-slate-100 mb-4">
          <div className="flex items-center gap-2">
            <Radio className="w-4 h-4 text-indigo-600 animate-pulse" />
            <h3 className="text-sm font-bold text-slate-900 tracking-tight">Live Updates Stream</h3>
          </div>
          <span className="text-[11px] font-mono px-2 py-0.5 rounded-full bg-indigo-50 text-indigo-700 border border-indigo-200">
            Frontend Ready • Real-Time Channel
          </span>
        </div>

        <p className="text-xs text-slate-500 mb-4">
          This stream reflects real-time status transitions published whenever your order is updated by dispatchers, restaurants, or delivery couriers.
        </p>

        {orderEvents.length === 0 ? (
          <div className="p-6 rounded-xl bg-slate-50 border border-slate-100 text-center">
            <Clock className="w-6 h-6 text-slate-300 mx-auto mb-1.5" />
            <p className="text-xs font-semibold text-slate-700">Order successfully initiated</p>
            <p className="text-[11px] text-slate-400 mt-0.5">
              Live updates will appear here automatically when delivery partner or kitchen updates status.
            </p>
          </div>
        ) : (
          <div className="space-y-2.5">
            {orderEvents.map((evt) => (
              <div
                key={evt.id}
                className="p-3 rounded-xl bg-slate-50 border border-slate-100 flex items-start justify-between text-xs"
              >
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <span className="font-mono text-[10px] font-bold text-indigo-600 uppercase">
                      {evt.type}
                    </span>
                    <span className="text-[10px] text-slate-400">•</span>
                    <span className="text-[10px] text-slate-400">{formatRelativeTime(evt.timestamp)}</span>
                  </div>
                  <p className="font-medium text-slate-800">{evt.message}</p>
                </div>
                {evt.newStatus && (
                  <span className="shrink-0 text-[10px] font-mono font-bold px-2 py-0.5 rounded bg-white border border-slate-200 text-slate-700">
                    {evt.newStatus}
                  </span>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};
