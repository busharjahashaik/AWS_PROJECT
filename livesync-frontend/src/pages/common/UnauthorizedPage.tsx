import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../hooks';
import { UserRole } from '../../types';
import { ShieldAlert, ArrowLeft, LayoutDashboard } from 'lucide-react';
import { Button } from '../../components/common/Button';
import { Badge } from '../../components/common/Badge';

interface UnauthorizedPageProps {
  requiredRoles?: UserRole[];
}

export const UnauthorizedPage: React.FC<UnauthorizedPageProps> = ({ requiredRoles = [] }) => {
  const { user } = useAuth();
  const navigate = useNavigate();

  const userDashboardPath = user?.role
    ? `/${user.role.toLowerCase()}/dashboard`
    : '/login';

  return (
    <div className="min-h-screen bg-slate-900 text-white flex items-center justify-center p-6 selection:bg-indigo-500 selection:text-white">
      <div className="max-w-lg w-full bg-slate-800/90 border border-slate-700/80 rounded-2xl p-8 shadow-2xl backdrop-blur-md text-center">
        <div className="w-16 h-16 bg-rose-500/10 border border-rose-500/20 text-rose-400 rounded-2xl flex items-center justify-center mx-auto mb-6 shadow-inner">
          <ShieldAlert className="w-8 h-8" />
        </div>

        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-rose-500/10 border border-rose-500/30 text-rose-300 text-xs font-mono font-medium mb-3">
          HTTP 403 &bull; ACCESS FORBIDDEN
        </div>

        <h1 className="text-2xl font-bold text-white tracking-tight mb-2">
          Role-Based Access Restricted
        </h1>

        <p className="text-sm text-slate-400 mb-6 leading-relaxed">
          You do not have the required permissions to view this resource. 
          {requiredRoles.length > 0 && (
            <span className="block mt-2">
              Required role(s):{' '}
              <span className="font-semibold text-slate-200">
                {requiredRoles.join(' or ')}
              </span>
            </span>
          )}
        </p>

        {user && (
          <div className="bg-slate-900/70 border border-slate-700/60 rounded-xl p-4 mb-6 text-left flex items-center justify-between">
            <div>
              <p className="text-xs text-slate-400">Authenticated As</p>
              <p className="text-sm font-semibold text-slate-200">{user.name}</p>
              <p className="text-xs text-slate-400 font-mono">{user.email}</p>
            </div>
            <div className="text-right">
              <span className="text-[10px] text-slate-400 block mb-1">Current Role</span>
              <Badge
                variant={user.role === 'ADMIN' ? 'indigo' : user.role === 'DELIVERY' ? 'amber' : 'emerald'}
                dot
              >
                {user.role}
              </Badge>
            </div>
          </div>
        )}


        <div className="flex flex-col sm:flex-row gap-3 justify-center">
          <Button
            variant="outline"
            onClick={() => navigate(-1)}
            leftIcon={<ArrowLeft className="w-4 h-4" />}
          >
            Go Back
          </Button>
          <Button
            variant="primary"
            onClick={() => navigate(userDashboardPath)}
            leftIcon={<LayoutDashboard className="w-4 h-4" />}
          >
            Go to My Dashboard
          </Button>
        </div>
      </div>
    </div>
  );
};
