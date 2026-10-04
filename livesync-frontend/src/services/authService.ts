import { User, UserRole } from '../types';
import { mockAuthService } from './mock/mockAuthService';
import { apiRequest, setToken, clearSession, getToken, isTokenExpired, USER_KEY } from '../api/httpClient';
import { getItem, setItem } from '../utils/storage';

const USE_MOCK_DATA = import.meta.env.VITE_USE_MOCK_DATA !== 'false';

export interface RegisterInput {
  name: string;
  email: string;
  phone?: string;
  password: string;
  role: UserRole;
}

export const authService = {
  async login(email: string, password: string, role?: UserRole): Promise<User> {
    if (USE_MOCK_DATA) {
      return mockAuthService.login(email, password, role);
    }
    const { token, user } = await apiRequest<{ token: string; user: User }>('/auth/login', {
      method: 'POST',
      body: { email, password, role },
      auth: false,
    });
    setToken(token);
    setItem(USER_KEY, user);
    return user;
  },

  async register(params: RegisterInput): Promise<User> {
    if (USE_MOCK_DATA) {
      return mockAuthService.register(params);
    }
    const { user } = await apiRequest<{ user: User }>('/auth/register', {
      method: 'POST',
      body: params,
      auth: false,
    });
    return user;
  },

  async requestPasswordReset(email: string): Promise<boolean> {
    if (USE_MOCK_DATA) {
      return mockAuthService.requestPasswordReset(email);
    }
    await apiRequest('/auth/forgot-password', { method: 'POST', body: { email }, auth: false });
    return true;
  },

  getCurrentUser(): User | null {
    if (USE_MOCK_DATA) {
      return mockAuthService.getCurrentUser();
    }
    const token = getToken();
    if (!token || isTokenExpired(token)) {
      clearSession();
      return null;
    }
    return getItem<User | null>(USER_KEY, null);
  },

  async logout(): Promise<void> {
    if (USE_MOCK_DATA) {
      return mockAuthService.logout();
    }
    clearSession();
  },
};
