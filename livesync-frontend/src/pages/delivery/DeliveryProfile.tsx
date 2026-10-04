import React, { useEffect, useState } from 'react';
import { useAuth } from '../../hooks';
import { Truck, Phone, Mail, User, ShieldCheck, CheckCircle2, Radio } from 'lucide-react';
import { Button } from '../../components/common/Button';
import { deliveryService } from '../../services/deliveryService';

export const DeliveryProfile: React.FC = () => {
  const { user } = useAuth();
  const [phone, setPhone] = useState(user?.phone || '');
  const [vehicle, setVehicle] = useState('Electric Cargo Van (EV-Pro #4)');
  const [zone, setZone] = useState('');
  const [availability, setAvailability] = useState<'AVAILABLE' | 'BUSY' | 'OFFLINE'>(user?.availability || 'AVAILABLE');
  const [isSavingAvailability, setIsSavingAvailability] = useState(false);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    let active = true;
    deliveryService
      .getMyAvailability()
      .then((current) => {
        if (active) setAvailability(current);
      })
      .catch((err: unknown) => {
        if (active) alert(err instanceof Error ? err.message : 'Could not load delivery availability.');
      });
    return () => {
      active = false;
    };
  }, []);

  const handleAvailabilityChange = async (status: 'AVAILABLE' | 'BUSY' | 'OFFLINE') => {
    setIsSavingAvailability(true);
    try {
      setAvailability(await deliveryService.updateMyAvailability(status));
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Could not update delivery availability.');
    } finally {
      setIsSavingAvailability(false);
    }
  };

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    setSaved(true);
    setTimeout(() => setSaved(false), 3000);
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6 animate-fade-in font-sans">
      <div className="pb-2 border-b border-slate-200">
        <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Driver Profile</h1>
        <p className="text-xs text-slate-500">Fleet credentials, vehicle designation, and availability toggle.</p>
      </div>

      {saved && (
        <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-xl text-xs text-emerald-700 flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4 text-emerald-600" />
          <span>Driver preferences updated successfully.</span>
        </div>
      )}

      {/* Driver Header Card */}
      <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-xs flex flex-col sm:flex-row items-start sm:items-center justify-between gap-6">
        <div className="flex items-center gap-4">
          <div className="w-16 h-16 rounded-2xl bg-amber-500 text-white font-bold text-xl flex items-center justify-center shadow-md shadow-amber-500/20">
            {user?.name?.slice(0, 2).toUpperCase() || 'DP'}
          </div>
          <div>
            <h2 className="text-lg font-bold text-slate-900">{user?.name}</h2>
            <p className="text-xs text-slate-500">{user?.email}</p>
            <div className="flex items-center gap-2 mt-1.5">
              <span className={`text-[10px] font-semibold uppercase px-2 py-0.5 rounded-full border ${
                availability === 'AVAILABLE'
                  ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                  : availability === 'BUSY'
                  ? 'bg-amber-50 text-amber-700 border-amber-200'
                  : 'bg-slate-100 text-slate-600 border-slate-200'
              }`}>
                {availability}
              </span>
              <span className="text-[10px] text-slate-400 font-mono">
                Fleet ID: {user?.id}
              </span>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <label className="text-xs text-slate-500 mr-2">Driver Status:</label>
          {(['AVAILABLE', 'BUSY', 'OFFLINE'] as const).map((status) => (
            <button
              key={status}
              type="button"
              onClick={() => handleAvailabilityChange(status)}
              disabled={isSavingAvailability}
              className={`px-3 py-1.5 text-xs font-semibold rounded-lg border transition-all ${
                availability === status
                  ? 'bg-slate-900 text-white border-slate-900'
                  : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-50'
              }`}
            >
              {status}
            </button>
          ))}
        </div>
      </div>

      {/* Driver Details Form */}
      <form onSubmit={handleSave} className="bg-white border border-slate-200 rounded-2xl p-6 shadow-xs space-y-4">
        <h3 className="text-sm font-bold text-slate-900 pb-3 border-b border-slate-100">
          Courier Credentials & Vehicle
        </h3>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">Full Name</label>
            <input
              type="text"
              disabled
              value={user?.name || ''}
              className="w-full text-xs p-2.5 bg-slate-100 border border-slate-200 rounded-xl text-slate-500 cursor-not-allowed"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">Contact Phone</label>
            <input
              type="tel"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              className="w-full text-xs p-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:bg-white"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">Assigned Vehicle</label>
            <input
              type="text"
              value={vehicle}
              onChange={(e) => setVehicle(e.target.value)}
              className="w-full text-xs p-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:bg-white"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">Operating Zone</label>
            <input
              type="text"
              value={zone}
              onChange={(e) => setZone(e.target.value)}
              className="w-full text-xs p-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:bg-white"
            />
          </div>
        </div>

        <div className="pt-4 border-t border-slate-100 flex justify-end">
          <Button type="submit" variant="primary" size="md">
            Save Driver Profile
          </Button>
        </div>
      </form>
    </div>
  );
};
