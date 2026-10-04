import { User, UserRole } from '../../types';
import { INITIAL_USERS } from '../../data/mockInitialData';
import { getItem, setItem, removeItem } from '../../utils/storage';

const STORAGE_USERS_KEY = 'livesync_auth_users';
const STORAGE_CURRENT_USER_KEY = 'livesync_auth_current_user';

interface StoredUser extends User {
  passwordHash: string;
}

// Default password for pre-seeded users is 'password123' or '<role>123'
const createDefaultUser = (user: User, pass: string): StoredUser => ({
  ...user,
  passwordHash: pass,
});

class MockAuthService {
  constructor() {
    this.seedDefaultUsers();
  }

  private seedDefaultUsers(): void {
    const existing = getItem<StoredUser[]>(STORAGE_USERS_KEY, []);
    if (existing.length === 0) {
      const seeded: StoredUser[] = [
        createDefaultUser(INITIAL_USERS[0], 'admin123'), // admin@livesync.io / admin123
        createDefaultUser(INITIAL_USERS[1], 'customer123'), // customer@gmail.com / customer123
        createDefaultUser(INITIAL_USERS[2], 'delivery123'), // delivery@express.com / delivery123
        createDefaultUser(INITIAL_USERS[3], 'partner123'), // partner2@express.com / partner123
      ];
      setItem(STORAGE_USERS_KEY, seeded);
    }
  }

  public async login(email: string, password: string, role?: UserRole): Promise<User> {
    // Artificial slight delay for realistic enterprise feel
    await new Promise((resolve) => setTimeout(resolve, 250));

    const users = getItem<StoredUser[]>(STORAGE_USERS_KEY, []);
    const user = users.find((u) => u.email.toLowerCase() === email.trim().toLowerCase());

    if (!user) {
      throw new Error('No account found with this email address.');
    }

    if (role && user.role !== role) {
      throw new Error(`This account is registered as ${user.role}, not ${role}. Please select the ${user.role} tab.`);
    }

    // Allow predefined password or fallback check
    if (user.passwordHash !== password && password !== 'password123') {
      throw new Error('Invalid password. Please check your credentials.');
    }

    const { passwordHash: _, ...userSafe } = user;
    setItem(STORAGE_CURRENT_USER_KEY, userSafe);
    return userSafe;
  }

  public async register(params: {
    name: string;
    email: string;
    phone?: string;
    password: string;
    role: UserRole;
  }): Promise<User> {
    await new Promise((resolve) => setTimeout(resolve, 300));

    const users = getItem<StoredUser[]>(STORAGE_USERS_KEY, []);
    const existing = users.find((u) => u.email.toLowerCase() === params.email.trim().toLowerCase());

    if (existing) {
      throw new Error('An account with this email already exists. Please log in.');
    }

    const newUser: StoredUser = {
      id: `usr-${params.role.toLowerCase()}-${Date.now().toString().slice(-4)}`,
      name: params.name.trim(),
      email: params.email.trim().toLowerCase(),
      phone: (params.phone || '+1 555-0100').trim(),
      role: params.role,
      passwordHash: params.password,
      createdAt: new Date().toISOString(),
    };

    users.push(newUser);
    setItem(STORAGE_USERS_KEY, users);

    const { passwordHash: _, ...safeUser } = newUser;
    return safeUser;
  }

  public async requestPasswordReset(email: string): Promise<boolean> {
    await new Promise((resolve) => setTimeout(resolve, 350));
    const users = getItem<StoredUser[]>(STORAGE_USERS_KEY, []);
    const user = users.find((u) => u.email.toLowerCase() === email.trim().toLowerCase());
    if (!user) {
      throw new Error('If an account exists with this email, a reset link will be sent.');
    }
    return true;
  }

  public getCurrentUser(): User | null {
    return getItem<User | null>(STORAGE_CURRENT_USER_KEY, null);
  }

  public async logout(): Promise<void> {
    removeItem(STORAGE_CURRENT_USER_KEY);
    if (typeof window !== 'undefined') {
      try {
        localStorage.removeItem(STORAGE_CURRENT_USER_KEY);
        sessionStorage.clear();
      } catch (e) {
        // ignore storage errors
      }
    }
  }
}

export const mockAuthService = new MockAuthService();
