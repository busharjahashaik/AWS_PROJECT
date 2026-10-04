import 'dotenv/config';

const bool = (v, d) => (v === undefined || v === '' ? d : String(v).toLowerCase() === 'true');

export const config = {
  port: Number(process.env.PORT) || 5000,
  corsOrigin: (process.env.CORS_ORIGIN || 'http://localhost:3000,http://127.0.0.1:3000,http://localhost:5173').split(',').map((s) => s.trim()),
  jwtSecret: process.env.JWT_SECRET || 'dev-only-secret-change-me',
  jwtExpiresIn: process.env.JWT_EXPIRES_IN || '7d',
  store: (process.env.STORE || 'memory').toLowerCase(),
  region: process.env.AWS_REGION || 'us-east-1',
  tables: {
    users: process.env.USERS_TABLE || 'LiveSyncUsers',
    orders: process.env.ORDERS_TABLE || 'LiveSyncOrders',
    logs: process.env.LOGS_TABLE || 'LiveSyncActivity',
    restaurants: process.env.RESTAURANTS_TABLE || 'LiveSyncRestaurants',
    menuItems: process.env.MENU_ITEMS_TABLE || 'LiveSyncMenuItems',
  },
  appsync: {
    endpoint: process.env.APPSYNC_ENDPOINT || '',
    apiKey: process.env.APPSYNC_API_KEY || '',
  },
  seedDemoUsers: bool(process.env.SEED_DEMO_USERS, true),
  autoAssign: bool(process.env.AUTO_ASSIGN, true),
  allowAdminRegister: bool(process.env.ALLOW_ADMIN_REGISTER, true),
};
