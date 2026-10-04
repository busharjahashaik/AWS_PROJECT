import React, { useEffect, useState } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { useAuth, useOrders } from '../../hooks';
import { formatCurrency, formatDate, getOrderStatusBadge } from '../../utils/formatters';
import { OrderStatus, Restaurant } from '../../types';
import { restaurantService } from '../../services/customerService';
import { 
  ArrowLeft, 
  MapPin, 
  Phone, 
  Store, 
  CheckCircle2, 
  Truck, 
  Navigation, 
  PackageCheck, 
  CreditCard, 
  FileText,
  AlertCircle
} from 'lucide-react';
import { Button } from '../../components/common/Button';

export const DeliveryOrderDetails: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const { user } = useAuth();
  const { orders, updateOrderStatus } = useOrders();
  const navigate = useNavigate();

  const [isUpdating, setIsUpdating] = useState(false);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  const [restaurantDetails, setRestaurantDetails] = useState<Restaurant | null>(null);
  const [isLoadingRestaurant, setIsLoadingRestaurant] = useState(false);
  const [restaurantDetailsError, setRestaurantDetailsError] = useState(false);

  // If no ID passed (e.g. /delivery/active), find the first active delivery
  const targetId = id || orders.find((o) => o.orderStatus !== 'DELIVERED' && o.orderStatus !== 'CANCELLED')?.orderId;
  const order = orders.find((o) => o.orderId === targetId);

  useEffect(() => {
    if (!order?.restaurantId) {
      setRestaurantDetails(null);
      setRestaurantDetailsError(false);
      setIsLoadingRestaurant(false);
      return;
    }

    let isCurrentRequest = true;
    setIsLoadingRestaurant(true);
    setRestaurantDetailsError(false);
    restaurantService
      .getRestaurant(order.restaurantId)
      .then((restaurant) => {
        if (isCurrentRequest) setRestaurantDetails(restaurant);
      })
      .catch(() => {
        if (isCurrentRequest) setRestaurantDetailsError(true);
      })
      .finally(() => {
        if (isCurrentRequest) setIsLoadingRestaurant(false);
      });

    return () => {
      isCurrentRequest = false;
    };
  }, [order?.restaurantId]);

  const handleStatusTransition = async (nextStatus: OrderStatus) => {
    if (!order) return;
    setIsUpdating(true);
    setSuccessMsg(null);
    try {
      await updateOrderStatus(order.orderId, nextStatus);
      setSuccessMsg(`Status updated to ${nextStatus.replace(/_/g, ' ')}! Real-time mutation broadcasted.`);
      setTimeout(() => setSuccessMsg(null), 4000);
    } catch (err: any) {
      alert(err.message || 'Failed to update order status');
    } finally {
      setIsUpdating(false);
    }
  };

  if (!order) {
    return (
      <div className="max-w-4xl mx-auto py-12 text-center animate-fade-in font-sans">
        <div className="bg-white border border-slate-200 rounded-2xl p-12 shadow-xs">
          <AlertCircle className="w-12 h-12 text-amber-500 mx-auto mb-3" />
          <h2 className="text-xl font-bold text-slate-800">No Active Delivery Assignment</h2>
          <p className="text-xs text-slate-500 mt-1 max-w-sm mx-auto">
            You currently have no active deliveries in transit.
          </p>
          <div className="mt-6">
            <Link to="/delivery/orders">
              <Button variant="primary" size="sm">
                View Assigned Orders
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
      <div className="flex items-center justify-between">
        <Link
          to="/delivery/orders"
          className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-600 hover:text-slate-900 transition-colors"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          <span>Back to Assigned Orders</span>
        </Link>
      </div>

      {successMsg && (
        <div className="p-3.5 bg-emerald-50 border border-emerald-200 rounded-xl text-xs text-emerald-800 flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
          <span>{successMsg}</span>
        </div>
      )}

      {/* Main Order Info */}
      <div className="bg-white border border-slate-200 rounded-2xl p-6 sm:p-8 shadow-xs">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-slate-100">
          <div>
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold uppercase tracking-wider text-slate-400">
                Delivery Run
              </span>
              <span className="font-mono text-base font-extrabold text-indigo-600 bg-indigo-50 px-2.5 py-0.5 rounded-lg border border-indigo-100">
                {order.orderId}
              </span>
            </div>
            <h1 className="text-xl font-bold text-slate-900 mt-1">
              {order.restaurant || 'LiveSync Kitchen'} → {order.customerName}
            </h1>
            <p className="text-xs text-slate-400 mt-0.5">
              Assigned to courier: <strong className="text-slate-700">{order.deliveryPartnerName || user?.name}</strong>
            </p>
          </div>

          <div>
            <span
              className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold border ${badge.bg} ${badge.text} ${badge.border}`}
            >
              <span className={`w-2 h-2 rounded-full ${badge.dot} animate-pulse`} />
              {badge.label}
            </span>
          </div>
        </div>

        {/* Courier Status Transition Bar */}
        <div className="my-6 p-4 rounded-xl bg-slate-50 border border-slate-200/80 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h4 className="text-xs font-bold text-slate-900 uppercase tracking-wider">
              Courier Action Flow
            </h4>
            <p className="text-[11px] text-slate-500 mt-0.5">
              Advance the fulfillment lifecycle to broadcast live event updates to customer & admin.
            </p>
          </div>

          <div className="flex items-center gap-2">
            {(order.orderStatus === 'PLACED' || order.orderStatus === 'CONFIRMED') && (
              <Button
                variant="primary"
                size="md"
                isLoading={isUpdating}
                onClick={() => handleStatusTransition('READY_FOR_PICKUP')}
                leftIcon={<Store className="w-4 h-4" />}
              >
                Accept Delivery
              </Button>
            )}

            {order.orderStatus === 'READY_FOR_PICKUP' && (
              <Button
                variant="primary"
                size="md"
                isLoading={isUpdating}
                onClick={() => handleStatusTransition('PICKED_UP')}
                leftIcon={<PackageCheck className="w-4 h-4" />}
              >
                Mark as Picked Up
              </Button>
            )}

            {order.orderStatus === 'PICKED_UP' && (
              <Button
                variant="primary"
                size="md"
                className="bg-purple-600 hover:bg-purple-700"
                isLoading={isUpdating}
                onClick={() => handleStatusTransition('OUT_FOR_DELIVERY')}
                leftIcon={<Navigation className="w-4 h-4" />}
              >
                Start Delivery (Out for Delivery)
              </Button>
            )}

            {order.orderStatus === 'OUT_FOR_DELIVERY' && (
              <Button
                variant="primary"
                size="md"
                className="bg-emerald-600 hover:bg-emerald-700"
                isLoading={isUpdating}
                onClick={() => handleStatusTransition('DELIVERED')}
                leftIcon={<CheckCircle2 className="w-4 h-4" />}
              >
                Mark as Delivered
              </Button>
            )}

            {order.orderStatus === 'DELIVERED' && (
              <div className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-emerald-50 text-emerald-700 text-xs font-semibold border border-emerald-200">
                <CheckCircle2 className="w-4 h-4" />
                <span>Delivery Completed</span>
              </div>
            )}
          </div>
        </div>

        {/* Addresses and Contact */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 text-xs">
          {/* Pickup */}
          <div className="p-4 rounded-xl border border-slate-200 bg-white">
            <span className="text-[10px] font-bold uppercase text-slate-400 block mb-1">
              1. Pickup Location
            </span>
            <h4 className="font-bold text-slate-900 text-sm mb-1">
              {order.restaurant || 'LiveSync Kitchen'}
            </h4>
            <p className="text-slate-600">
              {isLoadingRestaurant
                ? 'Loading restaurant location...'
                : restaurantDetailsError
                ? 'Unable to load data. Please try again.'
                : restaurantDetails
                ? `${restaurantDetails.location}, ${restaurantDetails.address}`
                : 'Restaurant location unavailable.'}
            </p>
          </div>

          {/* Drop-off */}
          <div className="p-4 rounded-xl border border-slate-200 bg-white">
            <span className="text-[10px] font-bold uppercase text-slate-400 block mb-1">
              2. Drop-off Destination
            </span>
            <h4 className="font-bold text-slate-900 text-sm mb-1">
              {order.customerName}
            </h4>
            <p className="text-slate-600 font-semibold">{order.deliveryAddress}</p>
            <p className="text-[11px] text-indigo-600 mt-2 font-semibold">
              Recipient Phone: {order.contactNumber}
            </p>
            {order.specialInstructions && (
              <p className="text-[11px] text-slate-500 mt-1.5 p-2 bg-slate-50 rounded border border-slate-100">
                <strong>Instructions:</strong> {order.specialInstructions}
              </p>
            )}
          </div>
        </div>

        {/* Items Checklist */}
        <div className="mt-6 pt-6 border-t border-slate-100">
          <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-3">
            Package Items Checklist ({order.items.length})
          </h3>
          <div className="divide-y divide-slate-100">
            {order.items.map((item) => (
              <div key={item.id} className="py-2.5 flex items-center justify-between text-xs">
                <div className="flex items-center gap-3">
                  <span className="text-xl">{item.emoji || '📦'}</span>
                  <div>
                    <span className="font-semibold text-slate-800">{item.name}</span>
                    <span className="text-slate-400 ml-2">x{item.quantity}</span>
                  </div>
                </div>
                <span className="font-mono text-slate-700 font-semibold">
                  {formatCurrency(item.price * item.quantity)}
                </span>
              </div>
            ))}
          </div>

          <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between text-xs font-bold text-slate-900">
            <span>Payment Collection ({order.paymentMethod}):</span>
            <span className="font-mono text-sm text-indigo-600">
              {order.paymentStatus === 'PAID' ? 'PAID (No Collection)' : `Collect ${formatCurrency(order.totalAmount)}`}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};
