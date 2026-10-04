import React, { useState } from 'react';
import { useAuth } from '../../hooks';
import { 
  Settings, 
  Save, 
  Server, 
  Database, 
  ShieldCheck, 
  RefreshCw, 
  Sliders, 
  CheckCircle2, 
  AlertTriangle,
  Download
} from 'lucide-react';
import { Button } from '../../components/common/Button';
import { Badge } from '../../components/common/Badge';

export const AdminSettings: React.FC = () => {
  const { user } = useAuth();
  const [endpoint, setEndpoint] = useState(import.meta.env.VITE_APPSYNC_ENDPOINT || '');
  const [apiKey, setApiKey] = useState(import.meta.env.VITE_APPSYNC_API_KEY || '');
  const [region, setRegion] = useState(import.meta.env.VITE_AWS_REGION || 'us-east-1');
  const [autoDispatch, setAutoDispatch] = useState(true);
  const [defaultDeliveryFee, setDefaultDeliveryFee] = useState('4.99');
  const [isSaved, setIsSaved] = useState(false);
  const [resetConfirm, setResetConfirm] = useState(false);

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaved(true);
    setTimeout(() => setIsSaved(false), 3000);
  };

  const handleResetData = () => {
    localStorage.removeItem('livesync_orders');
    localStorage.removeItem('livesync_activity_logs');
    localStorage.removeItem('livesync_customers');
    localStorage.removeItem('livesync_partners');
    window.location.reload();
  };

  const handleExportState = () => {
    const orders = localStorage.getItem('livesync_orders') || '[]';
    const logs = localStorage.getItem('livesync_activity_logs') || '[]';
    const blob = new Blob([JSON.stringify({ orders: JSON.parse(orders), logs: JSON.parse(logs) }, null, 2)], {
      type: 'application/json',
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `livesync-state-${Date.now()}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6 animate-fade-in font-sans">
      {/* Header */}
      <div className="pb-2 border-b border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-slate-100 text-slate-700 text-xs font-medium border border-slate-200 mb-1.5">
            <Settings className="w-3.5 h-3.5 text-slate-600" />
            <span>Platform Configuration</span>
          </div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight">System Settings</h1>
          <p className="text-xs text-slate-500">
            Configure AWS AppSync connectivity, default dispatch rules, and application maintenance.
          </p>
        </div>

        {isSaved && (
          <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-emerald-50 text-emerald-700 text-xs font-semibold border border-emerald-200">
            <CheckCircle2 className="w-4 h-4 text-emerald-600" />
            Settings saved successfully
          </div>
        )}
      </div>

      <form onSubmit={handleSave} className="space-y-6">
        {/* AWS AppSync Connection Settings */}
        <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-xs space-y-4">
          <div className="flex items-center gap-2 pb-3 border-b border-slate-100">
            <Server className="w-4 h-4 text-indigo-600" />
            <h3 className="text-sm font-bold text-slate-900">AWS AppSync Configuration</h3>
          </div>

          <p className="text-xs text-slate-500">
            Configure AWS AppSync endpoint details to transition from frontend mock state to live GraphQL API.
          </p>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="md:col-span-2">
              <label className="block text-xs font-medium text-slate-700 mb-1">
                GraphQL Endpoint URL
              </label>
              <input
                type="text"
                value={endpoint}
                onChange={(e) => setEndpoint(e.target.value)}
                placeholder="https://xxxxxxxx.appsync-api.us-east-1.amazonaws.com/graphql"
                className="w-full text-xs font-mono px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:bg-white"
              />
              <span className="text-[11px] text-slate-400 mt-1 block">
                Leave blank to keep Frontend Ready local service active.
              </span>
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-700 mb-1">
                API Key / Auth Header
              </label>
              <input
                type="password"
                value={apiKey}
                onChange={(e) => setApiKey(e.target.value)}
                placeholder="da2-xxxxxxxxxxxxxxxxxxxxxxxx"
                className="w-full text-xs font-mono px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:bg-white"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-700 mb-1">
                AWS Region
              </label>
              <select
                value={region}
                onChange={(e) => setRegion(e.target.value)}
                className="w-full text-xs px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:bg-white"
              >
                <option value="us-east-1">US East (N. Virginia) [us-east-1]</option>
                <option value="us-east-2">US East (Ohio) [us-east-2]</option>
                <option value="us-west-2">US West (Oregon) [us-west-2]</option>
                <option value="eu-west-1">Europe (Ireland) [eu-west-1]</option>
                <option value="ap-south-1">Asia Pacific (Mumbai) [ap-south-1]</option>
              </select>
            </div>
          </div>
        </div>

        {/* Dispatch & Order Parameters */}
        <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-xs space-y-4">
          <div className="flex items-center gap-2 pb-3 border-b border-slate-100">
            <Sliders className="w-4 h-4 text-emerald-600" />
            <h3 className="text-sm font-bold text-slate-900">Order Management & Dispatch Rules</h3>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-medium text-slate-700 mb-1">
                Standard Delivery Fee ($)
              </label>
              <input
                type="number"
                step="0.01"
                value={defaultDeliveryFee}
                onChange={(e) => setDefaultDeliveryFee(e.target.value)}
                className="w-full text-xs px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:bg-white"
              />
            </div>

            <div className="flex items-center justify-between p-3 bg-slate-50 border border-slate-200 rounded-xl">
              <div>
                <p className="text-xs font-semibold text-slate-800">Auto-Courier Dispatch</p>
                <p className="text-[11px] text-slate-500">Automatically assign an available delivery partner to new orders</p>
              </div>
              <input
                type="checkbox"
                checked={autoDispatch}
                onChange={(e) => setAutoDispatch(e.target.checked)}
                className="w-4 h-4 text-indigo-600 rounded focus:ring-indigo-500"
              />
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center justify-end gap-3 pt-2">
          <Button type="submit" variant="primary" size="md" className="flex items-center gap-2">
            <Save className="w-4 h-4" />
            <span>Save Settings</span>
          </Button>
        </div>
      </form>

      {/* Data Management & Maintenance */}
      <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-xs space-y-4">
        <div className="flex items-center gap-2 pb-3 border-b border-slate-100">
          <Database className="w-4 h-4 text-slate-600" />
          <h3 className="text-sm font-bold text-slate-900">Data Management</h3>
        </div>

        <p className="text-xs text-slate-500">
          Manage local order data store, export system audit records, or reset to initial defaults.
        </p>

        <div className="flex flex-wrap items-center gap-3 pt-2">
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={handleExportState}
            className="flex items-center gap-1.5"
          >
            <Download className="w-3.5 h-3.5" />
            <span>Export Orders & Logs JSON</span>
          </Button>

          {!resetConfirm ? (
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => setResetConfirm(true)}
              className="text-rose-600 border-rose-200 hover:bg-rose-50"
            >
              Reset Application State
            </Button>
          ) : (
            <div className="flex items-center gap-2">
              <span className="text-xs text-rose-600 font-medium">Are you sure?</span>
              <Button
                type="button"
                variant="danger"
                size="sm"
                onClick={handleResetData}
              >
                Yes, Reset Everything
              </Button>
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={() => setResetConfirm(false)}
              >
                Cancel
              </Button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
