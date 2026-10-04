import React, { createContext, useContext, useState, useEffect } from 'react';
import { User, UserRole } from '../types';
import { authService, RegisterInput } from '../services/authService';

interface AuthContextType {
  user: User | null;
  isLoading: boolean;
  error: string | null;
  login: (email: string, password: string, role?: UserRole) => Promise<User>;
  register: (params: RegisterInput) => Promise<User>;
  logout: () => Promise<void>;
  clearError: () => void;
  isAdmin: boolean;
  isCustomer: boolean;
  isDelivery: boolean;
  switchUserRoleForDemo: (role: UserRole) => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    // Check initial auth state
    try {
      const stored = authService.getCurrentUser();
      setUser(stored);
    } catch (e) {
      console.error('Failed to load authenticated user:', e);
    } finally {
      setIsLoading(false);
    }
  }, []);

  // The API client fires this when the server rejects our token (expired / invalid).
  useEffect(() => {
    const onExpired = () => setUser(null);
    window.addEventListener('livesync:session-expired', onExpired);
    return () => window.removeEventListener('livesync:session-expired', onExpired);
  }, []);

  const login = async (email: string, password: string, role?: UserRole): Promise<User> => {
    setIsLoading(true);
    setError(null);
    try {
      const loggedIn = await authService.login(email, password, role);
      setUser(loggedIn);
      return loggedIn;
    } catch (err: any) {
      const msg = err.message || 'Authentication failed. Please verify your credentials.';
      setError(msg);
      throw new Error(msg);
    } finally {
      setIsLoading(false);
    }
  };

  const register = async (params: RegisterInput): Promise<User> => {
    setIsLoading(true);
    setError(null);
    try {
      const newUser = await authService.register(params);
      return newUser;
    } catch (err: any) {
      const msg = err.message || 'Registration failed.';
      setError(msg);
      throw new Error(msg);
    } finally {
      setIsLoading(false);
    }
  };

  const logout = async (): Promise<void> => {
    setIsLoading(true);
    try {
      await authService.logout();
      setUser(null);
      setError(null);
      if (typeof window !== 'undefined') {
        try {
          localStorage.removeItem('livesync_auth_current_user');
          sessionStorage.clear();
        } catch (e) {
          // ignore storage error
        }
      }
    } finally {
      setIsLoading(false);
    }
  };

  const clearError = () => setError(null);

  // Fast demo role switcher helper for hackathon judges & presenters
  const switchUserRoleForDemo = async (role: UserRole) => {
    if (role === 'ADMIN') {
      await login('admin@livesync.io', 'admin123');
    } else if (role === 'CUSTOMER') {
      await login('customer@gmail.com', 'customer123');
    } else if (role === 'DELIVERY') {
      await login('delivery@express.com', 'delivery123');
    }
  };

  const value: AuthContextType = {
    user,
    isLoading,
    error,
    login,
    register,
    logout,
    clearError,
    isAdmin: user?.role === 'ADMIN',
    isCustomer: user?.role === 'CUSTOMER',
    isDelivery: user?.role === 'DELIVERY',
    switchUserRoleForDemo,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
