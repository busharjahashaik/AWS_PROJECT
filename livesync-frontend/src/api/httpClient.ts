/**
 * Small fetch wrapper for the LiveSync REST API (Express backend).
 * Sends the JWT on every request and turns server errors into readable messages.
 */

export const API_URL = (import.meta.env.VITE_API_URL || 'http://localhost:5001/api').replace(/\/+$/, '');

const TOKEN_KEY = 'livesync_token';
export const USER_KEY = 'livesync_auth_current_user';

export const getToken = (): string | null => {
  try {
    return localStorage.getItem(TOKEN_KEY);
  } catch {
    return null;
  }
};

export const setToken = (token: string): void => {
  try {
    localStorage.setItem(TOKEN_KEY, token);
  } catch {
    /* storage unavailable */
  }
};

export const clearSession = (): void => {
  try {
    localStorage.removeItem(TOKEN_KEY);
    localStorage.removeItem(USER_KEY);
  } catch {
    /* storage unavailable */
  }
};

/** True when the JWT's "exp" claim is in the past (or the token is unreadable). */
export const isTokenExpired = (token: string): boolean => {
  try {
    const part = token.split('.')[1].replace(/-/g, '+').replace(/_/g, '/');
    const payload = JSON.parse(atob(part));
    return typeof payload.exp !== 'number' || payload.exp * 1000 < Date.now();
  } catch {
    return true;
  }
};

export class ApiError extends Error {
  status: number;
  constructor(message: string, status: number) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
  }
}

interface RequestOptions {
  method?: 'GET' | 'POST' | 'PATCH' | 'PUT' | 'DELETE';
  body?: unknown;
  /** Set false for login/register, which must not send or clear a token. */
  auth?: boolean;
}

export async function apiRequest<T = unknown>(path: string, options: RequestOptions = {}): Promise<T> {
  const { method = 'GET', body, auth = true } = options;
  const headers: Record<string, string> = { 'Content-Type': 'application/json' };
  const token = auth ? getToken() : null;
  if (token) headers['Authorization'] = `Bearer ${token}`;

  let response: Response;
  try {
    response = await fetch(`${API_URL}${path}`, {
      method,
      headers,
      body: body === undefined ? undefined : JSON.stringify(body),
    });
  } catch {
    throw new ApiError(`Cannot reach the LiveSync server at ${API_URL}. Is the backend running?`, 0);
  }

  let data: any = null;
  try {
    data = await response.json();
  } catch {
    /* empty or non-JSON body */
  }

  if (!response.ok) {
    if (response.status === 401 && token) {
      // Token rejected or expired: drop the session and tell the app.
      clearSession();
      window.dispatchEvent(new Event('livesync:session-expired'));
    }
    throw new ApiError(data?.message || `Request failed (${response.status})`, response.status);
  }
  return data as T;
}
