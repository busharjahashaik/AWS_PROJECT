import React, { useState } from 'react';
import { useRealTime } from '../../hooks';
import { isAppSyncConfigured, getAppSyncConfig } from '../../api/appSyncClient';
import { formatDate, formatRelativeTime } from '../../utils/formatters';
import { 
  Radio, 
  Layers, 
  Activity, 
  Zap, 
  Server, 
  Database, 
  CheckCircle2, 
  Clock, 
  Code2, 
  ExternalLink,
  ShieldAlert,
  ArrowRight
} from 'lucide-react';
import { Button } from '../../components/common/Button';
import { Badge } from '../../components/common/Badge';

export const AdminAppSyncMonitor: React.FC = () => {
  const { liveEvents, isSubscriptionActive, latencyMs } = useRealTime();
  const [activeTab, setActiveTab] = useState<'overview' | 'schema' | 'topology'>('overview');

  const config = getAppSyncConfig();
  const isConfigured = isAppSyncConfigured();
  const lastEvent = liveEvents[0];

  return (
    <div className="max-w-7xl mx-auto space-y-6 animate-fade-in font-sans">
      {/* Header */}
      <div className="pb-2 border-b border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-indigo-50 text-indigo-700 text-xs font-medium border border-indigo-200 mb-1.5">
            <Radio className="w-3.5 h-3.5 text-indigo-600 animate-pulse" />
            <span>AWS AppSync Real-Time Topology</span>
          </div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight">AppSync Architecture Monitor</h1>
          <p className="text-xs text-slate-500">
            Real-time telemetry, GraphQL endpoint status, and WebSocket subscription protocol monitor.
          </p>
        </div>

        {/* Real-time State Badge - Strictly distinguishing Frontend Ready vs Connected to AWS */}
        <div className="p-3 bg-white border border-slate-200 rounded-xl flex items-center gap-3 text-xs shadow-xs">
          <div className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-ping" />
            <span className="font-semibold text-slate-800">Frontend Ready</span>
          </div>
          <span className="text-slate-300">|</span>
          <div className="flex items-center gap-1.5">
            {isConfigured ? (
              <span className="inline-flex items-center text-emerald-600 font-semibold gap-1">
                <CheckCircle2 className="w-3.5 h-3.5" /> Connected to AWS AppSync
              </span>
            ) : (
              <span className="inline-flex items-center text-amber-600 font-semibold gap-1">
                <Clock className="w-3.5 h-3.5" /> Awaiting backend connection
              </span>
            )}
          </div>
        </div>
      </div>

      {/* KPI Status Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white border border-slate-200 rounded-2xl p-4 shadow-xs">
          <div className="flex items-center justify-between text-slate-400 mb-2">
            <span className="text-xs font-semibold uppercase tracking-wider text-slate-500">GraphQL API Status</span>
            <div className="p-2 rounded-xl bg-indigo-50 text-indigo-600">
              <Zap className="w-4 h-4" />
            </div>
          </div>
          <div className="text-xl font-bold text-slate-900">
            {isConfigured ? 'AWS Live' : 'Frontend Ready'}
          </div>
          <p className="text-xs text-slate-500 mt-1 flex items-center gap-1">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
            {isConfigured ? 'Connected to AppSync' : 'Awaiting backend connection'}
          </p>
        </div>

        <div className="bg-white border border-slate-200 rounded-2xl p-4 shadow-xs">
          <div className="flex items-center justify-between text-slate-400 mb-2">
            <span className="text-xs font-semibold uppercase tracking-wider text-slate-500">Subscription Status</span>
            <div className="p-2 rounded-xl bg-emerald-50 text-emerald-600">
              <Radio className="w-4 h-4" />
            </div>
          </div>
          <div className="text-xl font-bold text-slate-900">
            {isSubscriptionActive ? 'Active Stream' : 'Idle'}
          </div>
          <p className="text-xs text-slate-500 mt-1 flex items-center gap-1">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
            Publish / Subscribe active
          </p>
        </div>

        <div className="bg-white border border-slate-200 rounded-2xl p-4 shadow-xs">
          <div className="flex items-center justify-between text-slate-400 mb-2">
            <span className="text-xs font-semibold uppercase tracking-wider text-slate-500">Events Received</span>
            <div className="p-2 rounded-xl bg-purple-50 text-purple-600">
              <Activity className="w-4 h-4" />
            </div>
          </div>
          <div className="text-xl font-bold font-mono text-purple-600">
            {liveEvents.length}
          </div>
          <p className="text-xs text-slate-500 mt-1">
            Real-time mutations logged
          </p>
        </div>

        <div className="bg-white border border-slate-200 rounded-2xl p-4 shadow-xs">
          <div className="flex items-center justify-between text-slate-400 mb-2">
            <span className="text-xs font-semibold uppercase tracking-wider text-slate-500">Connection State</span>
            <div className="p-2 rounded-xl bg-amber-50 text-amber-600">
              <Server className="w-4 h-4" />
            </div>
          </div>
          <div className="text-xl font-bold text-slate-900">
            {isConfigured ? 'AWS Managed' : 'Local Mock Layer'}
          </div>
          <p className="text-xs text-slate-500 mt-1 font-mono">
            {latencyMs}ms client latency
          </p>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex items-center gap-2 border-b border-slate-200 pb-2">
        <button
          onClick={() => setActiveTab('overview')}
          className={`px-4 py-2 text-xs font-semibold rounded-xl transition-all ${
            activeTab === 'overview'
              ? 'bg-indigo-600 text-white shadow-xs'
              : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-200'
          }`}
        >
          Connection Telemetry
        </button>
        <button
          onClick={() => setActiveTab('schema')}
          className={`px-4 py-2 text-xs font-semibold rounded-xl transition-all ${
            activeTab === 'schema'
              ? 'bg-indigo-600 text-white shadow-xs'
              : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-200'
          }`}
        >
          GraphQL Schema & Contracts
        </button>
        <button
          onClick={() => setActiveTab('topology')}
          className={`px-4 py-2 text-xs font-semibold rounded-xl transition-all ${
            activeTab === 'topology'
              ? 'bg-indigo-600 text-white shadow-xs'
              : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-200'
          }`}
        >
          Production AWS Topology
        </button>
      </div>

      {/* Tab 1: Overview */}
      {activeTab === 'overview' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Connection Details Card */}
          <div className="lg:col-span-1 bg-white border border-slate-200 rounded-2xl p-5 shadow-xs space-y-4">
            <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
              <Server className="w-4 h-4 text-indigo-600" />
              Endpoint Configuration
            </h3>

            <div className="space-y-3 text-xs">
              <div>
                <span className="text-slate-400 block text-[11px]">AWS AppSync Endpoint</span>
                <span className="font-mono text-slate-800 break-all bg-slate-50 p-2 rounded-lg block mt-0.5 border border-slate-100">
                  {config.endpoint || 'Awaiting backend connection (VITE_APPSYNC_ENDPOINT)'}
                </span>
              </div>

              <div>
                <span className="text-slate-400 block text-[11px]">AWS Region</span>
                <span className="font-mono text-slate-800 font-semibold">{config.region}</span>
              </div>

              <div>
                <span className="text-slate-400 block text-[11px]">Authentication Type</span>
                <Badge variant="indigo" size="sm">
                  {config.authType}
                </Badge>
              </div>

              <div className="pt-2 border-t border-slate-100">
                <span className="text-slate-400 block text-[11px]">Connection Status</span>
                <div className="mt-1 flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-emerald-500" />
                  <span className="font-medium text-slate-700">Frontend Ready</span>
                  <span className="text-slate-300">•</span>
                  <span className="text-amber-600 font-semibold">Awaiting backend connection</span>
                </div>
              </div>
            </div>

            <div className="p-3 rounded-xl bg-amber-50 border border-amber-200 text-xs text-amber-800 leading-relaxed">
              <p className="font-semibold mb-1 flex items-center gap-1.5">
                <ShieldAlert className="w-4 h-4 text-amber-600 shrink-0" />
                Backend Integration Notice
              </p>
              When your Node.js backend and AWS AppSync GraphQL API are deployed, provide <code className="font-mono bg-amber-100 px-1 py-0.5 rounded">VITE_APPSYNC_ENDPOINT</code> in your environment to seamlessly switch to direct live cloud execution without UI changes.
            </div>
          </div>

          {/* Last Event & Live Stream */}
          <div className="lg:col-span-2 bg-white border border-slate-200 rounded-2xl p-5 shadow-xs space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                <Activity className="w-4 h-4 text-purple-600" />
                Latest Subscription Stream Events
              </h3>
              <Badge variant="purple" size="sm">
                Live Broadcast
              </Badge>
            </div>

            {liveEvents.length === 0 ? (
              <div className="p-8 text-center bg-slate-50 rounded-xl border border-slate-100">
                <Radio className="w-8 h-8 text-slate-400 mx-auto mb-2" />
                <p className="text-xs font-semibold text-slate-700">No events received yet</p>
                <p className="text-[11px] text-slate-400 mt-0.5">
                  Events will appear here immediately as customer orders are created or couriers advance delivery statuses.
                </p>
              </div>
            ) : (
              <div className="space-y-2.5">
                {liveEvents.slice(0, 6).map((evt) => (
                  <div
                    key={evt.id}
                    className="p-3 bg-slate-50 border border-slate-200 rounded-xl flex items-center justify-between gap-3 text-xs"
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-2 h-2 rounded-full bg-indigo-500" />
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="font-bold text-slate-800 font-mono text-[11px]">
                            {evt.type}
                          </span>
                          {evt.orderId && (
                            <span className="px-1.5 py-0.5 rounded bg-indigo-100 text-indigo-700 font-mono text-[10px] font-semibold">
                              {evt.orderId}
                            </span>
                          )}
                        </div>
                        <p className="text-slate-500 text-[11px] mt-0.5">{evt.message}</p>
                      </div>
                    </div>
                    <div className="text-right text-[10px] text-slate-400 shrink-0 font-mono">
                      {formatRelativeTime(evt.timestamp)}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Tab 2: Schema */}
      {activeTab === 'schema' && (
        <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-xs space-y-6">
          <div>
            <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
              <Code2 className="w-4 h-4 text-indigo-600" />
              AWS AppSync GraphQL Schema Definition
            </h3>
            <p className="text-xs text-slate-500 mt-1">
              Exact types, queries, mutations, and subscription directives configured for LiveSync.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="p-4 bg-slate-900 text-slate-200 rounded-xl font-mono text-xs overflow-x-auto space-y-2">
              <span className="text-indigo-400 font-bold block mb-1"># Queries</span>
              <p className="text-slate-400">type Query &#123;</p>
              <p className="pl-4 text-emerald-400">getOrders: OrderConnection</p>
              <p className="pl-4 text-emerald-400">getOrderById(orderId: ID!): Order</p>
              <p className="pl-4 text-emerald-400">getMyOrders(customerId: ID!): [Order]</p>
              <p className="pl-4 text-emerald-400">getAssignedOrders(deliveryPartnerId: ID!): [Order]</p>
              <p className="pl-4 text-emerald-400">getAnalytics: AnalyticsData</p>
              <p className="text-slate-400">&#125;</p>
            </div>

            <div className="p-4 bg-slate-900 text-slate-200 rounded-xl font-mono text-xs overflow-x-auto space-y-2">
              <span className="text-purple-400 font-bold block mb-1"># Mutations</span>
              <p className="text-slate-400">type Mutation &#123;</p>
              <p className="pl-4 text-purple-300">createOrder(input: CreateOrderInput!): Order</p>
              <p className="pl-4 text-purple-300">updateOrderStatus(orderId: ID!, status: OrderStatus!): Order</p>
              <p className="pl-4 text-purple-300">assignDeliveryPartner(orderId: ID!, partnerId: ID!): Order</p>
              <p className="text-slate-400">&#125;</p>
            </div>

            <div className="p-4 bg-slate-900 text-slate-200 rounded-xl font-mono text-xs overflow-x-auto space-y-2">
              <span className="text-amber-400 font-bold block mb-1"># Subscriptions (Real-Time)</span>
              <p className="text-slate-400">type Subscription &#123;</p>
              <p className="pl-4 text-amber-300">onOrderCreated: Order</p>
              <p className="pl-4 text-amber-300">onOrderStatusChanged(orderId: ID): Order</p>
              <p className="pl-4 text-amber-300">onDeliveryAssigned(deliveryPartnerId: ID): Order</p>
              <p className="text-slate-400">&#125;</p>
            </div>
          </div>
        </div>
      )}

      {/* Tab 3: Topology */}
      {activeTab === 'topology' && (
        <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-xs space-y-6">
          <div>
            <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
              <Layers className="w-4 h-4 text-indigo-600" />
              LiveSync End-to-End AWS Architecture
            </h3>
            <p className="text-xs text-slate-500 mt-1">
              Clean separation of frontend UI, GraphQL real-time pub/sub, Node.js resolvers, and Amazon DynamoDB storage.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 text-center">
            <div className="p-5 rounded-2xl bg-indigo-50/60 border border-indigo-200">
              <div className="w-10 h-10 rounded-xl bg-indigo-600 text-white flex items-center justify-center mx-auto mb-3">
                <Zap className="w-5 h-5" />
              </div>
              <h4 className="font-bold text-slate-900 text-sm">Frontend Client</h4>
              <p className="text-[11px] text-slate-500 mt-1">
                Vue.js / React + Tailwind CSS client with reactive stores and role-based views.
              </p>
              <div className="mt-3 inline-flex items-center px-2 py-0.5 rounded text-[10px] font-semibold bg-emerald-100 text-emerald-800">
                Active & Ready
              </div>
            </div>

            <div className="p-5 rounded-2xl bg-purple-50/60 border border-purple-200">
              <div className="w-10 h-10 rounded-xl bg-purple-600 text-white flex items-center justify-center mx-auto mb-3">
                <Radio className="w-5 h-5" />
              </div>
              <h4 className="font-bold text-slate-900 text-sm">AWS AppSync</h4>
              <p className="text-[11px] text-slate-500 mt-1">
                Managed GraphQL with WebSocket push subscriptions for instant order tracking.
              </p>
              <div className="mt-3 inline-flex items-center px-2 py-0.5 rounded text-[10px] font-semibold bg-amber-100 text-amber-800">
                Awaiting Backend
              </div>
            </div>

            <div className="p-5 rounded-2xl bg-blue-50/60 border border-blue-200">
              <div className="w-10 h-10 rounded-xl bg-blue-600 text-white flex items-center justify-center mx-auto mb-3">
                <Server className="w-5 h-5" />
              </div>
              <h4 className="font-bold text-slate-900 text-sm">Node.js Resolvers</h4>
              <p className="text-[11px] text-slate-500 mt-1">
                AWS Lambda / ECS resolvers executing business logic, notifications, and auth.
              </p>
              <div className="mt-3 inline-flex items-center px-2 py-0.5 rounded text-[10px] font-semibold bg-amber-100 text-amber-800">
                Awaiting Backend
              </div>
            </div>

            <div className="p-5 rounded-2xl bg-emerald-50/60 border border-emerald-200">
              <div className="w-10 h-10 rounded-xl bg-emerald-600 text-white flex items-center justify-center mx-auto mb-3">
                <Database className="w-5 h-5" />
              </div>
              <h4 className="font-bold text-slate-900 text-sm">Amazon DynamoDB</h4>
              <p className="text-[11px] text-slate-500 mt-1">
                Single-table design with sub-second latency and stream-triggered state updates.
              </p>
              <div className="mt-3 inline-flex items-center px-2 py-0.5 rounded text-[10px] font-semibold bg-amber-100 text-amber-800">
                Awaiting Backend
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
