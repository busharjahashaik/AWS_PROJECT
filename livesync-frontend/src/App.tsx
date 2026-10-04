import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import { NotificationProvider } from './context/NotificationContext';
import { RealTimeProvider } from './context/RealTimeContext';
import { OrderProvider } from './context/OrderContext';
import { NotificationToastContainer } from './components/realtime/NotificationToast';
import { RoleRoute } from './components/auth/RoleRoute';
import { DashboardLayout } from './layouts/DashboardLayout';

// Public & Auth Pages
import { LandingPage } from './pages/public/LandingPage';
import { RoleSelectionPage } from './pages/public/RoleSelectionPage';
import { Login } from './pages/auth/Login';
import { Register } from './pages/auth/Register';
import { ForgotPasswordPage } from './pages/public/ForgotPasswordPage';

// Admin Pages
import { AdminDashboard } from './pages/admin/AdminDashboard';
import { AdminLiveOrders } from './pages/admin/AdminLiveOrders';
import { AdminCustomers } from './pages/admin/AdminCustomers';
import { AdminDeliveryFleet } from './pages/admin/AdminDeliveryFleet';
import { AdminAnalytics } from './pages/admin/AdminAnalytics';
import { AdminLiveEvents } from './pages/admin/AdminLiveEvents';
import { AdminActivityLogs } from './pages/admin/AdminActivityLogs';
import { AdminAppSyncMonitor } from './pages/admin/AdminAppSyncMonitor';
import { AdminSettings } from './pages/admin/AdminSettings';

// Customer Pages
import { CustomerDashboard } from './pages/customer/CustomerDashboard';
import { CustomerCreateOrder } from './pages/customer/CustomerCreateOrder';
import { CustomerMyOrders } from './pages/customer/CustomerMyOrders';
import { CustomerOrderTracking } from './pages/customer/CustomerOrderTracking';
import { CustomerProfile } from './pages/customer/CustomerProfile';

// Delivery Partner Pages
import { DeliveryDashboard } from './pages/delivery/DeliveryDashboard';
import { DeliveryAssignedOrders } from './pages/delivery/DeliveryAssignedOrders';
import { DeliveryOrderDetails } from './pages/delivery/DeliveryOrderDetails';
import { DeliveryHistory } from './pages/delivery/DeliveryHistory';
import { DeliveryProfile } from './pages/delivery/DeliveryProfile';

// Common Pages
import { NotFoundPage } from './pages/common/NotFoundPage';

export const App: React.FC = () => {
  return (
    <AuthProvider>
      <NotificationProvider>
        <RealTimeProvider>
          <OrderProvider>
            <BrowserRouter>
              <Routes>
                {/* Public Routes */}
                <Route path="/" element={<LandingPage />} />
                <Route path="/select-role" element={<RoleSelectionPage />} />
                <Route path="/login" element={<Login />} />
                <Route path="/register" element={<Register />} />
                <Route path="/forgot-password" element={<ForgotPasswordPage />} />

                {/* Admin Routes (Role: ADMIN) */}
                <Route element={<RoleRoute allowedRoles={['ADMIN']} />}>
                  <Route element={<DashboardLayout />}>
                    <Route path="/admin/dashboard" element={<AdminDashboard />} />
                    <Route path="/admin/orders" element={<AdminLiveOrders />} />
                    <Route path="/admin/customers" element={<AdminCustomers />} />
                    <Route path="/admin/delivery" element={<AdminDeliveryFleet />} />
                    <Route path="/admin/analytics" element={<AdminAnalytics />} />
                    <Route path="/admin/events" element={<AdminLiveEvents />} />
                    <Route path="/admin/activity" element={<AdminActivityLogs />} />
                    <Route path="/admin/appsync" element={<AdminAppSyncMonitor />} />
                    <Route path="/admin/api-monitor" element={<AdminAppSyncMonitor />} />
                    <Route path="/admin/settings" element={<AdminSettings />} />
                  </Route>
                </Route>

                {/* Customer Routes (Role: CUSTOMER) */}
                <Route element={<RoleRoute allowedRoles={['CUSTOMER']} />}>
                  <Route element={<DashboardLayout />}>
                    <Route path="/customer/dashboard" element={<CustomerDashboard />} />
                    <Route path="/customer/orders/create" element={<CustomerCreateOrder />} />
                    <Route path="/customer/create-order" element={<CustomerCreateOrder />} />
                    <Route path="/customer/orders" element={<CustomerMyOrders />} />
                    <Route path="/customer/orders/:id" element={<CustomerOrderTracking />} />
                    <Route path="/customer/track" element={<CustomerOrderTracking />} />
                    <Route path="/customer/history" element={<CustomerMyOrders />} />
                    <Route path="/customer/profile" element={<CustomerProfile />} />
                  </Route>
                </Route>

                {/* Delivery Routes (Role: DELIVERY) */}
                <Route element={<RoleRoute allowedRoles={['DELIVERY']} />}>
                  <Route element={<DashboardLayout />}>
                    <Route path="/delivery/dashboard" element={<DeliveryDashboard />} />
                    <Route path="/delivery/orders" element={<DeliveryAssignedOrders />} />
                    <Route path="/delivery/orders/:id" element={<DeliveryOrderDetails />} />
                    <Route path="/delivery/active" element={<DeliveryOrderDetails />} />
                    <Route path="/delivery/history" element={<DeliveryHistory />} />
                    <Route path="/delivery/profile" element={<DeliveryProfile />} />
                  </Route>
                </Route>

                {/* 404 Catch-All */}
                <Route path="*" element={<NotFoundPage />} />
              </Routes>

              {/* Real-time subscription notification toast container */}
              <NotificationToastContainer />
            </BrowserRouter>
          </OrderProvider>
        </RealTimeProvider>
      </NotificationProvider>
    </AuthProvider>
  );
};
