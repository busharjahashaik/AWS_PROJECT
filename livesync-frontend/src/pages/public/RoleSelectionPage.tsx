import React from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { Zap, ShieldCheck, ShoppingBag, Truck, ArrowRight, ArrowLeft } from 'lucide-react';
import { Button } from '../../components/common/Button';

export const RoleSelectionPage: React.FC = () => {
  const navigate = useNavigate();

  const roles = [
    {
      role: 'ADMIN' as const,
      title: 'Admin',
      tagline: 'System Administration',
      description:
        'Monitor orders, customers, delivery operations and real-time system activity.',
      icon: ShieldCheck,
      iconBg: 'bg-indigo-500/10 text-indigo-400 border border-indigo-500/20',
      badgeColor: 'border-indigo-500/30 bg-indigo-500/10 text-indigo-300',
      targetLoginRole: 'ADMIN',
    },
    {
      role: 'CUSTOMER' as const,
      title: 'Customer',
      tagline: 'Consumer Ordering',
      description:
        'Create orders, view your orders and track delivery status in real time.',
      icon: ShoppingBag,
      iconBg: 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20',
      badgeColor: 'border-emerald-500/30 bg-emerald-500/10 text-emerald-300',
      targetLoginRole: 'CUSTOMER',
    },
    {
      role: 'DELIVERY' as const,
      title: 'Delivery Partner',
      tagline: 'Courier Operations',
      description:
        'Manage assigned deliveries and update delivery status in real time.',
      icon: Truck,
      iconBg: 'bg-amber-500/10 text-amber-400 border border-amber-500/20',
      badgeColor: 'border-amber-500/30 bg-amber-500/10 text-amber-300',
      targetLoginRole: 'DELIVERY',
    },
  ];

  const handleSelectRole = (role: 'ADMIN' | 'CUSTOMER' | 'DELIVERY') => {
    navigate(`/login?role=${role}`);
  };

  return (
    <div className="min-h-screen bg-slate-900 text-white flex flex-col justify-between selection:bg-indigo-500 selection:text-white">
      {/* Top Header */}
      <header className="border-b border-slate-800 bg-slate-900/80 backdrop-blur-md sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <Link to="/" className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-indigo-600 to-indigo-400 flex items-center justify-center shadow-lg shadow-indigo-500/20">
              <Zap className="w-5 h-5 text-white" />
            </div>
            <div className="flex items-center gap-2">
              <span className="font-bold text-lg text-white tracking-tight">LiveSync</span>
              <span className="text-[10px] font-mono uppercase px-2 py-0.5 rounded-full bg-indigo-500/20 text-indigo-300 border border-indigo-500/30">
                AWS AppSync
              </span>
            </div>
          </Link>

          <Link to="/" className="flex items-center gap-1.5 text-xs text-slate-400 hover:text-white transition-colors">
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>Back to Home</span>
          </Link>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-12 sm:py-20 flex flex-col justify-center">
        <div className="text-center max-w-2xl mx-auto mb-12">
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-indigo-500/10 border border-indigo-500/20 text-indigo-300 text-xs font-medium mb-4">
            <span>Role-Based Access Control</span>
          </div>
          <h1 className="text-3xl sm:text-5xl font-extrabold text-white tracking-tight">
            Select Your Role
          </h1>
          <p className="mt-3 text-sm sm:text-base text-slate-400">
            Choose your role to continue to the designated portal. Each role provides a specialized real-time experience.
          </p>
        </div>

        {/* Exactly 3 Role Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 lg:gap-8">
          {roles.map((item) => {
            const Icon = item.icon;
            return (
              <div
                key={item.role}
                className="bg-slate-800/80 border border-slate-700/80 hover:border-indigo-500/60 rounded-2xl p-6 sm:p-8 flex flex-col justify-between transition-all duration-200 hover:shadow-xl hover:shadow-indigo-500/10 group"
              >
                <div>
                  <div className="flex items-center justify-between mb-6">
                    <div className={`w-14 h-14 rounded-2xl flex items-center justify-center ${item.iconBg}`}>
                      <Icon className="w-7 h-7" />
                    </div>
                    <span className={`text-[11px] font-semibold uppercase tracking-wider px-2.5 py-1 rounded-full border ${item.badgeColor}`}>
                      {item.tagline}
                    </span>
                  </div>

                  <h3 className="text-xl font-bold text-white mb-2 group-hover:text-indigo-400 transition-colors">
                    {item.title}
                  </h3>

                  <p className="text-sm text-slate-400 leading-relaxed mb-6">
                    {item.description}
                  </p>
                </div>

                <div className="pt-4 border-t border-slate-700/60 space-y-2">
                  <Button
                    variant="primary"
                    size="md"
                    className="w-full justify-center group-hover:bg-indigo-500"
                    rightIcon={<ArrowRight className="w-4 h-4" />}
                    onClick={() => handleSelectRole(item.role)}
                  >
                    Continue as {item.title}
                  </Button>
                  <div className="text-center">
                    <Link
                      to={`/register?role=${item.role}`}
                      className="text-[11px] text-slate-400 hover:text-indigo-400 transition-colors inline-block pt-1"
                    >
                      New user? Register as {item.title}
                    </Link>
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        <div className="mt-12 text-center text-xs text-slate-500">
          Already know your credentials?{' '}
          <Link to="/login" className="text-indigo-400 hover:text-indigo-300 font-semibold transition-colors">
            Sign In Directly
          </Link>
        </div>
      </main>

      {/* Footer */}
      <footer className="border-t border-slate-800/80 py-6 text-center text-xs text-slate-500">
        <p>© 2026 LiveSync. Real-Time Order Management Architecture powered by AWS AppSync & DynamoDB.</p>
      </footer>
    </div>
  );
};
