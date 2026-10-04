export type UserRole = 'ADMIN' | 'CUSTOMER' | 'DELIVERY';

export interface User {
  id: string;
  name: string;
  email: string;
  phone: string;
  role: UserRole;
  availability?: 'AVAILABLE' | 'BUSY' | 'OFFLINE';
  avatarUrl?: string;
  createdAt: string;
}

export type OrderStatus =
  | 'PLACED'
  | 'CONFIRMED'
  | 'PREPARING'
  | 'READY_FOR_PICKUP'
  | 'PICKED_UP'
  | 'OUT_FOR_DELIVERY'
  | 'DELIVERED'
  | 'CANCELLED';

export type PaymentStatus = 'PENDING' | 'PAID' | 'FAILED' | 'REFUNDED';

export interface Restaurant {
  restaurantId: string;
  name: string;
  location?: string;
  address?: string;
  description?: string;
  image?: string;
  latitude?: number;
  longitude?: number;
  isActive: boolean;
  distanceKm?: number;
}

export interface MenuItem {
  itemId: string;
  restaurantId: string;
  name: string;
  description?: string;
  category?: string;
  price: number;
  image?: string;
  isAvailable: boolean;
}

export interface OrderItem {
  id: string;
  name: string;
  quantity: number;
  price: number;
  category?: string;
  emoji?: string;
}

export interface Order {
  orderId: string;
  customerId: string;
  customerName: string;
  customerPhone?: string;
  customerEmail?: string;
  restaurantId?: string;
  restaurant?: string;
  deliveryPartnerId?: string | null;
  deliveryPartnerName?: string | null;
  deliveryPartnerPhone?: string | null;
  items: OrderItem[];
  subtotal?: number;
  deliveryFee?: number;
  totalAmount: number;
  paymentMethod?: string;
  paymentStatus: PaymentStatus;
  orderStatus: OrderStatus;
  deliveryAddress: string;
  contactNumber: string;
  specialInstructions?: string;
  createdAt: string;
  updatedAt: string;
  estimatedDeliveryTime?: string;
}

export interface Customer {
  customerId: string;
  name: string;
  email: string;
  phone: string;
  totalOrders: number;
  totalSpent: number;
  address: string;
  joinedDate: string;
  status: 'ACTIVE' | 'INACTIVE';
}

export interface DeliveryPartner {
  deliveryPartnerId: string;
  name: string;
  phone: string;
  email: string;
  status: 'AVAILABLE' | 'BUSY' | 'OFFLINE';
  activeOrders: number;
  completedOrders: number;
  vehicleType: string;
  rating: number;
  zone: string;
  joinedDate: string;
}

export type ConnectionStatus = 'CONNECTING' | 'CONNECTED' | 'DISCONNECTED' | 'RECONNECTING';

export type RealTimeEventType =
  | 'ORDER_CREATED'
  | 'ORDER_UPDATED'
  | 'ORDER_STATUS_CHANGED'
  | 'DELIVERY_ASSIGNED'
  | 'PAYMENT_UPDATED'
  | 'SYSTEM_ALERT';

export interface RealTimeEvent {
  id: string;
  type: RealTimeEventType;
  orderId?: string;
  previousStatus?: OrderStatus;
  newStatus?: OrderStatus;
  source: string;
  timestamp: string;
  message: string;
  payload?: Record<string, unknown>;
}

export interface ActivityLog {
  id: string;
  timestamp: string;
  userId: string;
  userName: string;
  userRole: UserRole;
  action: string;
  orderId?: string;
  status: string;
  ipAddress?: string;
  details?: string;
}

export interface NotificationItem {
  id: string;
  userId?: string;
  targetRole?: UserRole | 'ALL';
  title: string;
  message: string;
  type: 'info' | 'success' | 'warning' | 'alert';
  read: boolean;
  timestamp: string;
  orderId?: string;
  source: string;
}

export interface AnalyticsData {
  totalOrders: number;
  processingOrders: number;
  preparingOrders: number;
  outForDeliveryOrders: number;
  deliveredOrders: number;
  cancelledOrders: number;
  activeDeliveryPartners: number;
  totalRevenue: number;
  averageOrderValue: number;
  deliveryCompletionRate: number;
  realTimeEventsCount: number;
  hourlyTrends: { hour: string; orders: number; completed: number }[];
  statusDistribution: { status: OrderStatus; count: number; percentage: number }[];
  topDeliveryPartners: { id: string; name: string; completed: number; rating: number }[];
}

export interface AppSyncMonitorMetrics {
  endpoint: string;
  region: string;
  mode: 'MOCK_SIMULATION' | 'AWS_APPSYNC_LIVE';
  connectionStatus: ConnectionStatus;
  subscriptionActive: boolean;
  activeSubscriptionsCount: number;
  eventsReceivedCount: number;
  lastEventTimestamp: string | null;
  lastEventSummary: string | null;
  latencyMs: number;
  uptimeSeconds: number;
}
