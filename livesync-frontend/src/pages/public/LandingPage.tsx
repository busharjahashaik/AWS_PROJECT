import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../hooks';
import { ConnectionIndicator } from '../../components/realtime/ConnectionIndicator';
import { 
  Zap, 
  ShieldCheck, 
  ShoppingBag, 
  Truck, 
  Radio, 
  Activity,
  ArrowRight,
  Database,
  Lock,
  Layers
} from 'lucide-react';
import { Button } from '../../components/common/Button';
import { Badge } from '../../components/common/Badge';

export const LandingPage: React.FC = () => {
  const { user } = useAuth();
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-slate-900 text-white flex flex-col selection:bg-indigo-500 selection:text-white font-sans">
      {/* Top Navigation */}
      <header className="border-b border-slate-800 bg-slate-900/90 backdrop-blur-md sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-indigo-600 to-indigo-400 flex items-center justify-center shadow-lg shadow-indigo-500/20">
              <Zap className="w-5 h-5 text-white" />
            </div>
            <div className="flex items-center gap-2">
              <span className="font-bold text-lg text-white tracking-tight">LiveSync</span>
              <span className="hidden sm:inline-block text-[10px] font-mono uppercase px-2 py-0.5 rounded-full bg-indigo-500/20 text-indigo-300 border border-indigo-500/30">
                AWS AppSync
              </span>
            </div>
          </div>

          <div className="flex items-center gap-4">
            <ConnectionIndicator />
            {user ? (
              <div className="flex items-center gap-3">
                <span className="text-xs text-slate-300 hidden sm:inline">
                  Signed in as <strong className="text-white">{user.name}</strong>
                </span>
                <Badge
                  variant={user.role === 'ADMIN' ? 'indigo' : user.role === 'DELIVERY' ? 'amber' : 'emerald'}
                  dot
                >
                  {user.role}
                </Badge>
                <Button
                  variant="primary"
                  size="sm"
                  onClick={() => navigate(`/${user.role.toLowerCase()}/dashboard`)}
                >
                  Go to Dashboard
                </Button>
              </div>
            ) : (
              <div className="flex items-center gap-2">
                <Link to="/login">
                  <Button variant="ghost" size="sm">
                    Sign In
                  </Button>
                </Link>
                <Link to="/select-role">
                  <Button variant="primary" size="sm">
                    Get Started
                  </Button>
                </Link>
              </div>
            )}
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1">
        {/* Hero Section */}
        <section className="relative overflow-hidden py-16 sm:py-24 border-b border-slate-800/80">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center relative z-10">
            <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-indigo-500/10 border border-indigo-500/20 text-indigo-300 text-xs font-medium mb-6">
              <Radio className="w-3.5 h-3.5 text-indigo-400 animate-pulse" />
              <span>Real-time order management powered by AWS AppSync</span>
            </div>

            <h1 className="text-4xl sm:text-6xl font-extrabold text-white tracking-tight max-w-4xl mx-auto leading-tight">
              Enterprise Real-Time Order & Delivery Orchestration
            </h1>

            <p className="mt-6 text-base sm:text-lg text-slate-400 max-w-2xl mx-auto leading-relaxed">
              LiveSync connects customers, delivery couriers, and platform administrators through instant, push-based GraphQL subscriptions. Experience zero-latency status transitions across every phase of fulfillment.
            </p>

            {/* CTAs */}
            <div className="mt-8 flex flex-col sm:flex-row items-center justify-center gap-4">
              <Link to="/select-role" className="w-full sm:w-auto">
                <Button
                  variant="primary"
                  size="lg"
                  className="w-full sm:w-auto px-8 py-3.5 text-sm font-semibold shadow-lg shadow-indigo-600/30"
                  rightIcon={<ArrowRight className="w-4 h-4" />}
                >
                  Get Started
                </Button>
              </Link>
              <Link to="/login" className="w-full sm:w-auto">
                <Button
                  variant="outline"
                  size="lg"
                  className="w-full sm:w-auto px-8 py-3.5 text-sm font-semibold border-slate-700 bg-slate-800/80 text-slate-200 hover:bg-slate-700 hover:text-white"
                >
                  Sign In
                </Button>
              </Link>
            </div>
          </div>
        </section>

        {/* Platform Explanation & Features */}
        <section className="py-16 sm:py-20 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-3xl mx-auto mb-16">
            <h2 className="text-xs font-bold uppercase tracking-wider text-indigo-400 mb-2">
              Architecture & Capabilities
            </h2>
            <p className="text-2xl sm:text-3xl font-bold text-white tracking-tight">
              Built for Scale, Precision, and Real-Time Event Sync
            </p>
            <p className="mt-3 text-sm text-slate-400 leading-relaxed">
              Every order state update triggers an AWS AppSync GraphQL mutation that immediately broadcasts to all subscribed clients via WebSockets, ensuring seamless data parity.
            </p>
          </div>

          {/* 5 Core Feature Cards Required by Specification */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {/* 1. Real-time order tracking */}
            <div className="bg-slate-800/70 border border-slate-700/80 rounded-2xl p-6 hover:border-slate-600 transition-colors">
              <div className="w-12 h-12 rounded-xl bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center text-indigo-400 mb-4">
                <Radio className="w-6 h-6" />
              </div>
              <h3 className="text-base font-bold text-white mb-2">Real-Time Order Tracking</h3>
              <p className="text-xs text-slate-400 leading-relaxed">
                Customers and dispatchers track orders step-by-step with visual timelines—from Placed and Preparing to Ready for Pickup, Out for Delivery, and Delivered.
              </p>
            </div>

            {/* 2. Customer ordering */}
            <div className="bg-slate-800/70 border border-slate-700/80 rounded-2xl p-6 hover:border-slate-600 transition-colors">
              <div className="w-12 h-12 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400 mb-4">
                <ShoppingBag className="w-6 h-6" />
              </div>
              <h3 className="text-base font-bold text-white mb-2">Customer Ordering</h3>
              <p className="text-xs text-slate-400 leading-relaxed">
                Intuitive restaurant menus, multi-item basket builders, address routing, and payment methods including Cash on Delivery, Cards, and instant UPI.
              </p>
            </div>

            {/* 3. Delivery management */}
            <div className="bg-slate-800/70 border border-slate-700/80 rounded-2xl p-6 hover:border-slate-600 transition-colors">
              <div className="w-12 h-12 rounded-xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-amber-400 mb-4">
                <Truck className="w-6 h-6" />
              </div>
              <h3 className="text-base font-bold text-white mb-2">Delivery Management</h3>
              <p className="text-xs text-slate-400 leading-relaxed">
                Couriers receive instant delivery dispatch, manage active runs, update transit statuses with one click, and access complete delivery histories.
              </p>
            </div>

            {/* 4. Admin monitoring */}
            <div className="bg-slate-800/70 border border-slate-700/80 rounded-2xl p-6 hover:border-slate-600 transition-colors">
              <div className="w-12 h-12 rounded-xl bg-purple-500/10 border border-purple-500/20 flex items-center justify-center text-purple-400 mb-4">
                <ShieldCheck className="w-6 h-6" />
              </div>
              <h3 className="text-base font-bold text-white mb-2">Admin Monitoring</h3>
              <p className="text-xs text-slate-400 leading-relaxed">
                Centralized operational control with real-time KPI metrics, full order pipelines, customer management, delivery fleet tracking, and system audit logs.
              </p>
            </div>

            {/* 5. AWS AppSync real-time subscriptions */}
            <div className="bg-slate-800/70 border border-slate-700/80 rounded-2xl p-6 hover:border-slate-600 transition-colors md:col-span-2 lg:col-span-2">
              <div className="w-12 h-12 rounded-xl bg-cyan-500/10 border border-cyan-500/20 flex items-center justify-center text-cyan-400 mb-4">
                <Activity className="w-6 h-6" />
              </div>
              <h3 className="text-base font-bold text-white mb-2">AWS AppSync Real-Time Subscriptions</h3>
              <p className="text-xs text-slate-400 leading-relaxed">
                Push-based WebSocket architecture eliminates traditional polling overhead. System mutations are streamed instantly to all connected clients with deterministic consistency backed by Amazon DynamoDB.
              </p>
            </div>
          </div>

          {/* Technical Specs Strip */}
          <div className="mt-12 bg-slate-950/60 border border-slate-800 rounded-2xl p-6 grid grid-cols-2 md:grid-cols-4 gap-4 text-center">
            <div>
              <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Frontend</p>
              <p className="text-sm font-bold text-white mt-1">Single-Page Architecture</p>
              <p className="text-[11px] text-slate-400">Tailwind CSS + Modular Services</p>
            </div>
            <div>
              <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">API Layer</p>
              <p className="text-sm font-bold text-white mt-1">AWS AppSync GraphQL</p>
              <p className="text-[11px] text-slate-400">Mutations & Subscriptions</p>
            </div>
            <div>
              <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Persistence</p>
              <p className="text-sm font-bold text-white mt-1">Amazon DynamoDB</p>
              <p className="text-[11px] text-slate-400">Single-digit millisecond latency</p>
            </div>
            <div>
              <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Role Access</p>
              <p className="text-sm font-bold text-white mt-1">Strict RBAC Guards</p>
              <p className="text-[11px] text-slate-400">Admin, Customer & Delivery</p>
            </div>
          </div>
        </section>
      </main>

      {/* Professional Footer */}
      <footer className="border-t border-slate-800 bg-slate-950 py-10 text-xs text-slate-400">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2.5">
            <div className="w-6 h-6 rounded-lg bg-indigo-600 flex items-center justify-center">
              <Zap className="w-3.5 h-3.5 text-white" />
            </div>
            <span className="font-bold text-white">LiveSync</span>
            <span className="text-slate-600">|</span>
            <span>Real-time order management powered by AWS AppSync</span>
          </div>

          <div className="flex items-center gap-6">
            <Link to="/select-role" className="hover:text-white transition-colors">
              Role Selection
            </Link>
            <Link to="/login" className="hover:text-white transition-colors">
              Sign In
            </Link>
            <Link to="/register" className="hover:text-white transition-colors">
              Register
            </Link>
          </div>
        </div>

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mt-6 pt-6 border-t border-slate-900 text-center text-slate-600">
          <p>© 2026 LiveSync Platform. All rights reserved. Enterprise real-time order management.</p>
        </div>
      </footer>
    </div>
  );
};
