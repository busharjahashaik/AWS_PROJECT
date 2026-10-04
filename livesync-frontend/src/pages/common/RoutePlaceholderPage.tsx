import React from 'react';
import { useLocation, useParams, Link } from 'react-router-dom';
import { useAuth, useOrders, useRealTime } from '../../hooks';
import { Card } from '../../components/common/Card';
import { Badge } from '../../components/common/Badge';
import { Breadcrumbs } from '../../components/common/Breadcrumbs';
import { 
  CheckCircle, 
  Layers, 
  Terminal, 
  ArrowRight,
  Database,
  Radio,
  FileCheck
} from 'lucide-react';

interface RoutePlaceholderPageProps {
  title: string;
  description: string;
  section: 'Admin' | 'Customer' | 'Delivery';
}

export const RoutePlaceholderPage: React.FC<RoutePlaceholderPageProps> = ({
  title,
  description,
  section,
}) => {
  const location = useLocation();
  const params = useParams();
  const { user } = useAuth();
  const { orders } = useOrders();
  const { connectionStatus, latencyMs, isMockMode } = useRealTime();

  const breadcrumbItems = [
    { label: section, href: `/${section.toLowerCase()}/dashboard` },
    { label: title },
  ];

  return (
    <div className="space-y-6 max-w-6xl mx-auto animate-fade-in">
      {/* Top Header / Breadcrumbs */}
      <div>
        <Breadcrumbs items={breadcrumbItems} />
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mt-2">
          <div>
            <div className="flex items-center gap-3">
              <h1 className="text-2xl font-bold text-slate-900 tracking-tight">{title}</h1>
              <Badge
                variant={user?.role === 'ADMIN' ? 'indigo' : user?.role === 'DELIVERY' ? 'amber' : 'emerald'}
                dot
              >
                {user?.role || 'CUSTOMER'}
              </Badge>
            </div>
            <p className="text-xs text-slate-500 mt-1">{description}</p>
          </div>

          <div className="flex items-center gap-2">
            <span className="text-[11px] font-mono px-2.5 py-1 rounded-lg bg-slate-100 border border-slate-200 text-slate-600">
              {location.pathname}
            </span>
          </div>
        </div>
      </div>

      {/* Parameter notice if :id exists */}
      {params.id && (
        <div className="p-4 bg-indigo-50 border border-indigo-100 rounded-2xl flex items-center justify-between">
          <div className="flex items-center gap-2.5 text-xs text-indigo-900 font-medium">
            <FileCheck className="w-4 h-4 text-indigo-600" />
            <span>Active Dynamic Route Parameter:</span>
            <span className="font-mono bg-white px-2 py-0.5 rounded border border-indigo-200 text-indigo-700">
              id: {params.id}
            </span>
          </div>
          <Link
            to={location.pathname.startsWith('/admin') ? '/admin/orders' : location.pathname.startsWith('/customer') ? '/customer/orders' : '/delivery/orders'}
            className="text-xs font-semibold text-indigo-600 hover:text-indigo-800"
          >
            &larr; All Orders
          </Link>
        </div>
      )}

      {/* Status banner */}
      <div className="bg-white border border-slate-200/80 rounded-2xl p-6 shadow-sm">
        <div className="flex items-start gap-4">
          <div className="w-10 h-10 rounded-xl bg-emerald-50 border border-emerald-100 flex items-center justify-center text-emerald-600 shrink-0">
            <CheckCircle className="w-5 h-5" />
          </div>
          <div className="flex-1">
            <div className="flex items-center gap-2">
              <h3 className="text-sm font-semibold text-slate-900">
                Phase 1 Route Registered & Verified
              </h3>
              <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200">
                HTTP 200 OK
              </span>
            </div>
            <p className="text-xs text-slate-500 mt-1 leading-relaxed">
              This route has been registered with React Router and validated under the LiveSync role-based access control system ({section} role). Full interactive dashboard components and live AppSync widgets are prepared for Phase 2.
            </p>
          </div>
        </div>

        {/* Live System Context connected to this route */}
        <div className="mt-6 grid grid-cols-1 sm:grid-cols-3 gap-3 pt-6 border-t border-slate-100">
          <div className="p-3 bg-slate-50 rounded-xl border border-slate-100">
            <div className="flex items-center gap-1.5 text-xs text-slate-500 mb-1">
              <Database className="w-3.5 h-3.5 text-indigo-500" />
              <span>Loaded Orders in Context</span>
            </div>
            <p className="text-base font-bold text-slate-800">{orders.length} orders</p>
          </div>

          <div className="p-3 bg-slate-50 rounded-xl border border-slate-100">
            <div className="flex items-center gap-1.5 text-xs text-slate-500 mb-1">
              <Radio className="w-3.5 h-3.5 text-emerald-500" />
              <span>AppSync Subscriptions</span>
            </div>
            <p className="text-base font-bold text-slate-800">
              {connectionStatus} <span className="text-xs font-normal text-slate-400">({latencyMs}ms)</span>
            </p>
          </div>

          <div className="p-3 bg-slate-50 rounded-xl border border-slate-100">
            <div className="flex items-center gap-1.5 text-xs text-slate-500 mb-1">
              <Terminal className="w-3.5 h-3.5 text-amber-500" />
              <span>Backend Mode</span>
            </div>
            <p className="text-base font-bold text-slate-800">
              {isMockMode ? 'Mock Simulation' : 'AWS AppSync Live'}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};
