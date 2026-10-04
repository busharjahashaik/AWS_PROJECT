import React, { useState } from 'react';
import { Outlet, NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../hooks';
import { ConnectionIndicator } from '../components/realtime/ConnectionIndicator';
import { Badge } from '../components/common/Badge';
import {
  Zap,
  LayoutDashboard,
  ShoppingBag,
  Users,
  Truck,
  BarChart3,
  Radio,
  FileText,
  Cpu,
  Settings,
  PlusCircle,
  Clock,
  Bell,
  User,
  LogOut,
  Menu,
  X,
  MapPin,
  CheckCircle,
  ChevronRight
} from 'lucide-react';

export const DashboardLayout: React.FC = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const handleLogout = async () => {
    try {
      await logout();
    } finally {
      // Force replace history so pressing back will never expose the dashboard
      navigate('/', { replace: true });
    }
  };

  // Strict role-specific navigation links
  const adminLinks = [
    { to: '/admin/dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { to: '/admin/orders', label: 'Live Orders', icon: ShoppingBag },
    { to: '/admin/customers', label: 'Customers', icon: Users },
    { to: '/admin/delivery', label: 'Delivery Fleet', icon: Truck },
    { to: '/admin/analytics', label: 'Analytics', icon: BarChart3 },
    { to: '/admin/events', label: 'Live Events', icon: Radio },
    { to: '/admin/activity', label: 'Activity Logs', icon: FileText },
    { to: '/admin/appsync', label: 'AppSync Monitor', icon: Cpu },
    { to: '/admin/settings', label: 'Settings', icon: Settings },
  ];

  const customerLinks = [
    { to: '/customer/dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { to: '/customer/orders/create', label: 'Create Order', icon: PlusCircle },
    { to: '/customer/orders', label: 'My Orders', icon: ShoppingBag },
    { to: '/customer/track', label: 'Track Order', icon: MapPin },
    { to: '/customer/profile', label: 'Profile', icon: User },
  ];

  const deliveryLinks = [
    { to: '/delivery/dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { to: '/delivery/orders', label: 'Assigned Orders', icon: ShoppingBag },
    { to: '/delivery/active', label: 'Active Delivery', icon: MapPin },
    { to: '/delivery/history', label: 'Delivery History', icon: CheckCircle },
    { to: '/delivery/profile', label: 'Profile', icon: User },
  ];

  const currentLinks =
    user?.role === 'ADMIN'
      ? adminLinks
      : user?.role === 'DELIVERY'
      ? deliveryLinks
      : customerLinks;

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col font-sans">
      {/* Top Navbar */}
      <header className="sticky top-0 z-30 bg-slate-900 border-b border-slate-800 text-white shadow-sm">
        <div className="px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="lg:hidden p-2 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800"
              aria-label="Toggle navigation"
            >
              {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>

            <NavLink to={user?.role === 'ADMIN' ? '/admin/dashboard' : user?.role === 'DELIVERY' ? '/delivery/dashboard' : '/customer/dashboard'} className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-lg bg-gradient-to-tr from-indigo-600 to-indigo-400 flex items-center justify-center shadow-md shadow-indigo-500/20">
                <Zap className="w-4 h-4 text-white" />
              </div>
              <span className="font-bold text-base tracking-tight text-white hidden sm:inline">
                LiveSync
              </span>
            </NavLink>

            <div className="hidden md:flex items-center ml-2">
              <span className="text-[10px] font-mono uppercase px-2 py-0.5 rounded-full bg-indigo-500/20 text-indigo-300 border border-indigo-500/30">
                AWS AppSync
              </span>
            </div>
          </div>

          <div className="flex items-center gap-4">
            {/* Real-Time WebSocket Connection Indicator */}
            <ConnectionIndicator />

            {user && (
              <div className="flex items-center gap-3 pl-3 border-l border-slate-700/80">
                <div className="hidden sm:block text-right">
                  <p className="text-xs font-semibold text-white leading-tight">{user.name}</p>
                  <p className="text-[10px] text-slate-400 font-mono capitalize">{user.role.toLowerCase()}</p>
                </div>
                <Badge
                  variant={user.role === 'ADMIN' ? 'indigo' : user.role === 'DELIVERY' ? 'amber' : 'emerald'}
                  dot
                >
                  {user.role}
                </Badge>
                <button
                  onClick={handleLogout}
                  title="Sign Out"
                  className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-medium text-slate-300 hover:text-white hover:bg-rose-500/20 border border-slate-700/60 hover:border-rose-500/30 transition-all ml-1"
                >
                  <LogOut className="w-3.5 h-3.5 text-rose-400" />
                  <span className="hidden sm:inline">Logout</span>
                </button>
              </div>
            )}
          </div>
        </div>
      </header>

      {/* Main Workspace Layout */}
      <div className="flex-1 flex overflow-hidden">
        {/* Desktop Sidebar */}
        <aside className="hidden lg:flex flex-col w-64 bg-white border-r border-slate-200 shrink-0">
          <div className="p-4 border-b border-slate-100 flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
              {user?.role} PORTAL
            </span>
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" title="System Online"></span>
          </div>

          <nav className="flex-1 p-3 space-y-1 overflow-y-auto">
            {currentLinks.map((item) => {
              const Icon = item.icon;
              return (
                <NavLink
                  key={item.to}
                  to={item.to}
                  className={({ isActive }) =>
                    `flex items-center justify-between px-3 py-2 rounded-xl text-xs font-medium transition-all ${
                      isActive
                        ? 'bg-indigo-50 text-indigo-700 font-semibold shadow-xs'
                        : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'
                    }`
                  }
                >
                  <div className="flex items-center gap-2.5">
                    <Icon className="w-4 h-4 shrink-0" />
                    <span>{item.label}</span>
                  </div>
                  <ChevronRight className="w-3.5 h-3.5 text-slate-400 opacity-60" />
                </NavLink>
              );
            })}
          </nav>

          <div className="p-4 border-t border-slate-100 bg-slate-50/60">
            <div className="text-[11px] text-slate-500">
              <p className="font-semibold text-slate-700">AppSync Real-Time Active</p>
              <p className="text-slate-400 mt-0.5 font-mono text-[10px]">WebSocket push synchronization</p>
            </div>
          </div>
        </aside>

        {/* Mobile Sidebar Overlay */}
        {mobileMenuOpen && (
          <div className="fixed inset-0 z-50 lg:hidden flex">
            <div
              className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm"
              onClick={() => setMobileMenuOpen(false)}
            />
            <div className="relative w-64 max-w-[80%] bg-white h-full flex flex-col z-10 shadow-2xl">
              <div className="p-4 border-b border-slate-100 flex items-center justify-between">
                <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
                  {user?.role} Menu
                </span>
                <button
                  onClick={() => setMobileMenuOpen(false)}
                  className="p-1 rounded-lg text-slate-400 hover:text-slate-600"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <nav className="flex-1 p-3 space-y-1 overflow-y-auto">
                {currentLinks.map((item) => {
                  const Icon = item.icon;
                  return (
                    <NavLink
                      key={item.to}
                      to={item.to}
                      onClick={() => setMobileMenuOpen(false)}
                      className={({ isActive }) =>
                        `flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs font-medium transition-all ${
                          isActive
                            ? 'bg-indigo-50 text-indigo-700 font-semibold'
                            : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'
                        }`
                      }
                    >
                      <Icon className="w-4 h-4 shrink-0" />
                      <span>{item.label}</span>
                    </NavLink>
                  );
                })}
              </nav>

              <div className="p-3 border-t border-slate-100">
                <button
                  onClick={handleLogout}
                  className="w-full flex items-center justify-center gap-2 px-3 py-2 rounded-xl text-xs font-medium text-rose-600 bg-rose-50 hover:bg-rose-100 transition-colors"
                >
                  <LogOut className="w-4 h-4" />
                  Sign Out
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Content Area */}
        <main className="flex-1 overflow-y-auto p-4 sm:p-6 lg:p-8">
          <Outlet />
        </main>
      </div>
    </div>
  );
};
