import React, { useEffect, useState } from 'react';
import { useOrders } from '../../hooks';
import { formatCurrency, formatDate, formatRelativeTime, getOrderStatusBadge, getPaymentStatusBadge } from '../../utils/formatters';
import { DeliveryPartner, Order, OrderItem, OrderStatus } from '../../types';
import { deliveryService } from '../../services/deliveryService';
import { 
  ShoppingBag, 
  Search, 
  Filter, 
  MapPin, 
  Phone, 
  CreditCard, 
  Store, 
  Truck, 
  CheckCircle2, 
  Eye, 
  X, 
  ChevronRight,
  UserCheck
} from 'lucide-react';
import { Button } from '../../components/common/Button';
import { Modal } from '../../components/common/Modal';

const USE_MOCK_DATA = import.meta.env.VITE_USE_MOCK_DATA !== 'false';

const isOrderItem = (value: unknown): value is OrderItem =>
  typeof value === 'object' &&
  value !== null &&
  typeof (value as OrderItem).id === 'string' &&
  typeof (value as OrderItem).name === 'string' &&
  typeof (value as OrderItem).quantity === 'number' &&
  typeof (value as OrderItem).price === 'number';

function normalizeOrderItems(value: unknown): OrderItem[] {
  if (Array.isArray(value)) return value;
  if (typeof value === 'string') {
    try {
      return normalizeOrderItems(JSON.parse(value) as unknown);
    } catch {
      return [];
    }
  }
  if (isOrderItem(value)) return [value];
  if (typeof value === 'object' && value !== null) {
    return Object.values(value).filter(isOrderItem);
  }
  return [];
}

export const AdminLiveOrders: React.FC = () => {
  const { orders, updateOrderStatus, assignDeliveryPartner } = useOrders();
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('ALL');
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [isUpdatingStatus, setIsUpdatingStatus] = useState(false);
  const [selectedCourierId, setSelectedCourierId] = useState('');
  const [deliveryPartners, setDeliveryPartners] = useState<DeliveryPartner[]>([]);
  const [isLoadingDeliveryPartners, setIsLoadingDeliveryPartners] = useState(true);
  const [deliveryPartnersError, setDeliveryPartnersError] = useState('');
  const selectedOrderItems = normalizeOrderItems(selectedOrder?.items);

  useEffect(() => {
    let active = true;
    const loadDeliveryPartners = async () => {
      try {
        const partners = await deliveryService.getDeliveryPartners();
        if (active) {
          setDeliveryPartners(partners);
          setDeliveryPartnersError('');
        }
      } catch (err) {
        if (active) setDeliveryPartnersError(err instanceof Error ? err.message : 'Could not load delivery partners.');
      } finally {
        if (active) setIsLoadingDeliveryPartners(false);
      }
    };
    void loadDeliveryPartners();
    const interval = USE_MOCK_DATA ? undefined : window.setInterval(loadDeliveryPartners, 5000);
    return () => {
      active = false;
      if (interval !== undefined) window.clearInterval(interval);
    };
  }, []);

  const filteredOrders = orders.filter((order) => {
    const query = searchQuery.toLowerCase();
    const matchesSearch =
      order.orderId.toLowerCase().includes(query) ||
      order.customerName.toLowerCase().includes(query) ||
      (order.restaurant || '').toLowerCase().includes(query) ||
      (order.deliveryPartnerName || '').toLowerCase().includes(query);

    const matchesStatus =
      statusFilter === 'ALL'
        ? true
        : statusFilter === 'ACTIVE'
        ? order.orderStatus !== 'DELIVERED' && order.orderStatus !== 'CANCELLED'
        : order.orderStatus === statusFilter;

    return matchesSearch && matchesStatus;
  });

  const handleUpdateStatus = async (newStatus: OrderStatus) => {
    if (!selectedOrder) return;
    setIsUpdatingStatus(true);
    try {
      const updated = await updateOrderStatus(selectedOrder.orderId, newStatus);
      setSelectedOrder(updated);
    } catch (err: any) {
      alert(err.message || 'Failed to update status');
    } finally {
      setIsUpdatingStatus(false);
    }
  };

  const handleAssignCourier = async () => {
    if (!selectedOrder || !selectedCourierId) return;
    const courier = deliveryPartners.find((p) => p.deliveryPartnerId === selectedCourierId);
    if (!courier || courier.status === 'OFFLINE') return;

    setIsUpdatingStatus(true);
    try {
      const updated = await assignDeliveryPartner(selectedOrder.orderId, courier.deliveryPartnerId, courier.name);
      setSelectedOrder(updated);
      setSelectedCourierId('');
    } catch (err: any) {
      alert(err.message || 'Failed to assign courier');
    } finally {
      setIsUpdatingStatus(false);
    }
  };

  return (
    <div className="max-w-7xl mx-auto space-y-6 animate-fade-in font-sans">
      {/* Header */}
      <div className="pb-2 border-b border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-indigo-50 text-indigo-700 text-xs font-medium border border-indigo-200 mb-1.5">
            <ShoppingBag className="w-3.5 h-3.5" />
            <span>Master Operations • Live Orders Pipeline</span>
          </div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Live Orders Matrix</h1>
          <p className="text-xs text-slate-500">
            Real-time fulfillment oversight, courier dispatch assignment, and status mutations.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <span className="text-xs font-semibold text-slate-500">
            Total In System: <strong className="text-slate-900">{orders.length}</strong>
          </span>
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
            placeholder="Search by Order ID, customer, store, courier..."
            className="w-full text-xs pl-9 pr-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:bg-white"
          />
        </div>

        <div className="flex items-center gap-1 p-1 bg-slate-100 rounded-xl w-full md:w-auto overflow-x-auto">
          {[
            { id: 'ALL', label: 'All Orders' },
            { id: 'ACTIVE', label: 'In Progress' },
            { id: 'PLACED', label: 'Placed' },
            { id: 'PREPARING', label: 'Preparing' },
            { id: 'OUT_FOR_DELIVERY', label: 'Out for Delivery' },
            { id: 'DELIVERED', label: 'Delivered' },
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

      {/* Live Orders Table (Section 16 Specification) */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 text-slate-500 uppercase tracking-wider font-semibold border-b border-slate-100">
              <tr>
                <th className="py-3 px-4">Order ID</th>
                <th className="py-3 px-4">Customer</th>
                <th className="py-3 px-4">Restaurant</th>
                <th className="py-3 px-4">Amount</th>
                <th className="py-3 px-4">Payment</th>
                <th className="py-3 px-4">Delivery Partner</th>
                <th className="py-3 px-4">Status</th>
                <th className="py-3 px-4">Created At</th>
                <th className="py-3 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredOrders.length === 0 ? (
                <tr>
                  <td colSpan={9} className="py-12 text-center text-slate-400">
                    No orders match your search criteria.
                  </td>
                </tr>
              ) : (
                filteredOrders.map((order) => {
                  const badge = getOrderStatusBadge(order.orderStatus);
                  const payBadge = getPaymentStatusBadge(order.paymentStatus);

                  return (
                    <tr key={order.orderId} className="hover:bg-slate-50/70 transition-colors">
                      <td className="py-3 px-4 font-mono font-bold text-indigo-600">
                        {order.orderId}
                      </td>
                      <td className="py-3 px-4">
                        <div className="font-semibold text-slate-900">{order.customerName}</div>
                        <div className="text-[10px] text-slate-400">{order.contactNumber}</div>
                      </td>
                      <td className="py-3 px-4 font-medium text-slate-800">
                        {order.restaurant || 'LiveSync Kitchen'}
                      </td>
                      <td className="py-3 px-4 font-mono font-bold text-slate-900">
                        {formatCurrency(order.totalAmount)}
                      </td>
                      <td className="py-3 px-4">
                        <span className={`inline-block px-2 py-0.5 rounded text-[10px] font-semibold border ${payBadge.bg}`}>
                          {order.paymentMethod || 'Card'} • {payBadge.label}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-slate-700">
                        {order.deliveryPartnerName ? (
                          <span className="font-medium text-slate-900">{order.deliveryPartnerName}</span>
                        ) : (
                          <span className="text-slate-400 italic">Unassigned</span>
                        )}
                      </td>
                      <td className="py-3 px-4">
                        <span className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[11px] font-medium border ${badge.bg} ${badge.text} ${badge.border}`}>
                          <span className={`w-1.5 h-1.5 rounded-full ${badge.dot}`} />
                          {badge.label}
                        </span>
                      </td>
                      <td className="py-3 px-4 font-mono text-[10px] text-slate-400">
                        {formatDate(order.createdAt)}
                      </td>
                      <td className="py-3 px-4 text-right">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => setSelectedOrder(order)}
                          leftIcon={<Eye className="w-3 h-3" />}
                        >
                          Details
                        </Button>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Order Details Modal (Section 16 Specification) */}
      {selectedOrder && (
        <Modal
          isOpen={true}
          onClose={() => setSelectedOrder(null)}
          title={`Order Management Matrix: ${selectedOrder.orderId}`}
        >
          <div className="space-y-4 text-xs font-sans">
            <div className="p-3 bg-slate-50 rounded-xl border border-slate-100 flex items-center justify-between">
              <div>
                <span className="text-[10px] font-bold uppercase text-slate-400 block">Restaurant</span>
                <span className="text-sm font-bold text-slate-900">{selectedOrder.restaurant || 'LiveSync Central Kitchen'}</span>
              </div>
              <div className="text-right">
                <span className="text-[10px] font-bold uppercase text-slate-400 block">Grand Total</span>
                <span className="text-sm font-mono font-bold text-indigo-600">{formatCurrency(selectedOrder.totalAmount)}</span>
              </div>
            </div>

            {/* Customer & Address */}
            <div className="grid grid-cols-2 gap-3">
              <div className="p-3 rounded-lg border border-slate-100">
                <span className="text-[10px] font-semibold text-slate-400 uppercase block mb-1">Customer Info</span>
                <p className="font-bold text-slate-800">{selectedOrder.customerName}</p>
                <p className="text-slate-500 mt-0.5">{selectedOrder.contactNumber}</p>
                <p className="text-slate-400 font-mono text-[10px] mt-0.5">ID: {selectedOrder.customerId}</p>
              </div>

              <div className="p-3 rounded-lg border border-slate-100">
                <span className="text-[10px] font-semibold text-slate-400 uppercase block mb-1">Delivery Destination</span>
                <p className="text-slate-700 leading-relaxed">{selectedOrder.deliveryAddress}</p>
                {selectedOrder.specialInstructions && (
                  <p className="text-[10px] text-slate-400 mt-1 italic">Note: {selectedOrder.specialInstructions}</p>
                )}
              </div>
            </div>

            {/* Items */}
            <div>
              <span className="text-[10px] font-bold text-slate-400 uppercase block mb-2">Order Items Breakdown</span>
              <div className="divide-y divide-slate-100 border border-slate-100 rounded-lg p-2 max-h-36 overflow-y-auto">
                {selectedOrderItems.map((i) => (
                  <div key={i.id} className="py-1.5 flex justify-between">
                    <span>{i.name} <strong className="text-slate-500">x{i.quantity}</strong></span>
                    <span className="font-mono font-semibold">{formatCurrency(i.price * i.quantity)}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Courier Assignment */}
            <div className="p-3 rounded-xl bg-slate-50 border border-slate-100 space-y-2">
              <span className="text-[10px] font-bold text-slate-500 uppercase block">Assign Delivery Courier</span>
              <div className="flex gap-2">
                <select
                  value={selectedCourierId}
                  onChange={(e) => setSelectedCourierId(e.target.value)}
                  className="flex-1 text-xs p-2 bg-white border border-slate-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-indigo-500"
                >
                  <option value="">Select courier to dispatch...</option>
                  {[...deliveryPartners]
                    .sort((a, b) => Number(a.status !== 'AVAILABLE') - Number(b.status !== 'AVAILABLE'))
                    .map((p) => (
                    <option key={p.deliveryPartnerId} value={p.deliveryPartnerId} disabled={p.status === 'OFFLINE'}>
                      {p.name} ({p.status} - {p.vehicleType})
                    </option>
                    ))}
                </select>
                <Button
                  variant="primary"
                  size="sm"
                  disabled={!selectedCourierId}
                  isLoading={isUpdatingStatus}
                  onClick={handleAssignCourier}
                >
                  Assign
                </Button>
              </div>
              {isLoadingDeliveryPartners && <p className="text-[11px] text-slate-500">Loading delivery partners…</p>}
              {!isLoadingDeliveryPartners && !deliveryPartnersError && deliveryPartners.length === 0 && (
                <p className="text-[11px] text-slate-500">No registered delivery partners found.</p>
              )}
              {deliveryPartnersError && <p role="alert" className="text-[11px] text-rose-600">{deliveryPartnersError}</p>}
              {selectedOrder.deliveryPartnerName && (
                <p className="text-[11px] text-slate-600 mt-1">
                  Currently Assigned: <strong className="text-slate-900">{selectedOrder.deliveryPartnerName}</strong> ({selectedOrder.deliveryPartnerPhone || 'Active'})
                </p>
              )}
            </div>

            {/* Manual Status Override */}
            <div>
              <span className="text-[10px] font-bold text-slate-400 uppercase block mb-2">Override Status Transition</span>
              <div className="grid grid-cols-3 sm:grid-cols-4 gap-1.5">
                {(['PLACED', 'CONFIRMED', 'PREPARING', 'READY_FOR_PICKUP', 'PICKED_UP', 'OUT_FOR_DELIVERY', 'DELIVERED', 'CANCELLED'] as OrderStatus[]).map((st) => (
                  <button
                    key={st}
                    disabled={selectedOrder.orderStatus === st || isUpdatingStatus}
                    onClick={() => handleUpdateStatus(st)}
                    className={`py-1.5 px-1 text-[10px] font-bold rounded-lg border transition-all ${
                      selectedOrder.orderStatus === st
                        ? 'bg-indigo-600 text-white border-indigo-600 shadow-xs'
                        : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50'
                    }`}
                  >
                    {st.replace(/_/g, ' ')}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
};
