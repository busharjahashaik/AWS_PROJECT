import React from 'react';
import { Navigate, useLocation, Outlet } from 'react-router-dom';
import { useAuth } from '../../hooks';
import { UserRole } from '../../types';
import { Loader2 } from 'lucide-react';

interface RoleRouteProps {
  allowedRoles: UserRole[];
  children?: React.ReactNode;
}

export const RoleRoute: React.FC<RoleRouteProps> = ({ allowedRoles, children }) => {
  const { user, isLoading } = useAuth();
  const location = useLocation();

  if (isLoading) {
    return (
      <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center p-4">
        <div className="flex items-center gap-3 bg-white px-6 py-4 rounded-xl shadow-sm border border-slate-200">
          <Loader2 className="w-5 h-5 text-indigo-600 animate-spin" />
          <span className="text-sm font-medium text-slate-700">Verifying authorization...</span>
        </div>
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/" replace />;
  }

  if (!allowedRoles.includes(user.role)) {
    // Redirect authenticated user to their own role's designated dashboard
    const roleDashboardPath =
      user.role === 'ADMIN'
        ? '/admin/dashboard'
        : user.role === 'DELIVERY'
        ? '/delivery/dashboard'
        : '/customer/dashboard';

    return <Navigate to={roleDashboardPath} replace />;
  }

  return children ? <>{children}</> : <Outlet />;
};
