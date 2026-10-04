import React, { useEffect, useState } from 'react';
import { useOrders } from '../../hooks';
import { DeliveryPartner } from '../../types';
import { deliveryService } from '../../services/deliveryService';
import { Truck, Phone, MapPin, CheckCircle2, AlertCircle, Radio, Clock, ShieldCheck } from 'lucide-react';
import { Button } from '../../components/common/Button';

const USE_MOCK_DATA = import.meta.env.VITE_USE_MOCK_DATA !== 'false';

export const AdminDeliveryFleet: React.FC = () => {
  const { orders } = useOrders();
  const [couriers, setCouriers] = useState<DeliveryPartner[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [loadError, setLoadError] = useState('');
  const [updatingPartnerId, setUpdatingPartnerId] = useState('');

  useEffect(() => {
    let active = true;
    const loadCouriers = async () => {
      try {
        const partners = await deliveryService.getDeliveryPartners();
        if (active) {
          setCouriers(partners);
          setLoadError('');
        }
      } catch (err) {
        if (active) setLoadError(err instanceof Error ? err.message : 'Could not load delivery partners.');
      } finally {
        if (active) setIsLoading(false);
      }
    };
    void loadCouriers();
    const interval = USE_MOCK_DATA ? undefined : window.setInterval(loadCouriers, 5000);
    return () => {
      active = false;
      if (interval !== undefined) window.clearInterval(interval);
    };
  }, []);

  const handleToggleAvailability = async (id: string) => {
    const courier = couriers.find((partner) => partner.deliveryPartnerId === id);
    if (!courier) return;
    const nextStatus = courier.status === 'AVAILABLE' ? 'BUSY' : courier.status === 'BUSY' ? 'OFFLINE' : 'AVAILABLE';
    setUpdatingPartnerId(id);
    try {
      const availability = await deliveryService.updatePartnerAvailability(id, nextStatus);
      setCouriers((previous) =>
        previous.map((partner) =>
          partner.deliveryPartnerId === id ? { ...partner, status: availability } : partner
        )
      );
      setLoadError('');
    } catch (err) {
      setLoadError(err instanceof Error ? err.message : 'Could not update delivery partner availability.');
    } finally {
      setUpdatingPartnerId('');
    }
  };

  return (
    <div className="max-w-7xl mx-auto space-y-6 animate-fade-in font-sans">
      <div className="pb-2 border-b border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-emerald-50 text-emerald-700 text-xs font-medium border border-emerald-200 mb-1.5">
            <Truck className="w-3.5 h-3.5" />
            <span>Master Operations • Courier Fleet</span>
          </div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Delivery Fleet Management</h1>
          <p className="text-xs text-slate-500">
            Real-time courier fleet statuses, assigned orders in-transit, and availability routing.
          </p>
        </div>

        <div className="flex items-center gap-3 text-xs font-semibold text-slate-600">
          <span className="flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-emerald-500" />
            Available: {couriers.filter((c) => c.status === 'AVAILABLE').length}
          </span>
          <span className="flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-amber-500" />
            Busy: {couriers.filter((c) => c.status === 'BUSY').length}
          </span>
          <span className="flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-slate-400" />
            Offline: {couriers.filter((c) => c.status === 'OFFLINE').length}
          </span>
        </div>
      </div>

      {/* Fleet Table (Section 17 Specification) */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 text-slate-500 uppercase tracking-wider font-semibold border-b border-slate-100">
              <tr>
                <th className="py-3 px-4">Delivery Partner</th>
                <th className="py-3 px-4">Phone</th>
                <th className="py-3 px-4">Status</th>
                <th className="py-3 px-4">Current Order</th>
                <th className="py-3 px-4">Completed Deliveries</th>
                <th className="py-3 px-4">Vehicle / Zone</th>
                <th className="py-3 px-4 text-right">Availability Toggle</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {isLoading && (
                <tr><td colSpan={7} className="py-8 text-center text-slate-500">Loading delivery partners…</td></tr>
              )}
              {!isLoading && loadError && (
                <tr><td colSpan={7} role="alert" className="py-8 text-center text-rose-600">{loadError}</td></tr>
              )}
              {!isLoading && !loadError && couriers.length === 0 && (
                <tr><td colSpan={7} className="py-8 text-center text-slate-500">No registered delivery partners found.</td></tr>
              )}
              {couriers.map((courier) => {
                // Find currently active assigned order
                const currentOrder = orders.find(
                  (o) =>
                    (o.deliveryPartnerId === courier.deliveryPartnerId ||
                      o.deliveryPartnerName?.toLowerCase() === courier.name.toLowerCase()) &&
                    o.orderStatus !== 'DELIVERED' &&
                    o.orderStatus !== 'CANCELLED'
                );

                const completedCount = orders.filter(
                  (o) =>
                    (o.deliveryPartnerId === courier.deliveryPartnerId ||
                      o.deliveryPartnerName?.toLowerCase() === courier.name.toLowerCase()) &&
                    o.orderStatus === 'DELIVERED'
                ).length;

                return (
                  <tr key={courier.deliveryPartnerId} className="hover:bg-slate-50/70 transition-colors">
                    <td className="py-3 px-4">
                      <div className="font-bold text-slate-900">{courier.name}</div>
                      <div className="text-[10px] text-slate-400 font-mono">ID: {courier.deliveryPartnerId}</div>
                    </td>
                    <td className="py-3 px-4 text-slate-600 font-mono">
                      {courier.phone}
                    </td>
                    <td className="py-3 px-4">
                      <span
                        className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[10px] font-bold border ${
                          courier.status === 'AVAILABLE'
                            ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                            : courier.status === 'BUSY'
                            ? 'bg-amber-50 text-amber-700 border-amber-200'
                            : 'bg-slate-100 text-slate-600 border-slate-200'
                        }`}
                      >
                        <span
                          className={`w-1.5 h-1.5 rounded-full ${
                            courier.status === 'AVAILABLE'
                              ? 'bg-emerald-500'
                              : courier.status === 'BUSY'
                              ? 'bg-amber-500'
                              : 'bg-slate-400'
                          }`}
                        />
                        {courier.status}
                      </span>
                    </td>
                    <td className="py-3 px-4">
                      {currentOrder ? (
                        <div>
                          <span className="font-mono font-bold text-indigo-600 bg-indigo-50 px-1.5 py-0.5 rounded">
                            {currentOrder.orderId}
                          </span>
                          <span className="text-[11px] text-slate-600 block mt-0.5">
                            {currentOrder.orderStatus.replace(/_/g, ' ')}
                          </span>
                        </div>
                      ) : (
                        <span className="text-slate-400 italic">No Active Order</span>
                      )}
                    </td>
                    <td className="py-3 px-4 font-bold text-slate-900">
                      {Math.max(courier.completedOrders, completedCount)} fulfilled
                    </td>
                    <td className="py-3 px-4 text-slate-600">
                      <div className="font-medium text-slate-800">{courier.vehicleType}</div>
                      <div className="text-[10px] text-slate-400">{courier.zone}</div>
                    </td>
                    <td className="py-3 px-4 text-right">
                      <Button
                        variant="outline"
                        size="sm"
                        disabled={updatingPartnerId === courier.deliveryPartnerId}
                        onClick={() => handleToggleAvailability(courier.deliveryPartnerId)}
                      >
                        Cycle Status
                      </Button>
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
