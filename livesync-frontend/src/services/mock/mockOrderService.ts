import {
  Order,
  OrderStatus,
  OrderItem,
  Customer,
  DeliveryPartner,
  ActivityLog,
  AnalyticsData,
  UserRole,
} from '../../types';
import {
  INITIAL_ORDERS,
  INITIAL_CUSTOMERS,
  INITIAL_DELIVERY_PARTNERS,
  INITIAL_ACTIVITY_LOGS,
} from '../../data/mockInitialData';
import { getItem, setItem } from '../../utils/storage';
import { mockSubscriptionService } from './mockSubscriptionService';
import { formatCurrency } from '../../utils/formatters';

const STORAGE_ORDERS_KEY = 'livesync_orders';
const STORAGE_CUSTOMERS_KEY = 'livesync_customers';
const STORAGE_PARTNERS_KEY = 'livesync_partners';
const STORAGE_LOGS_KEY = 'livesync_activity_logs';

class MockOrderService {
  constructor() {
    this.seedInitialData();
  }

  private seedInitialData(): void {
    if (getItem<Order[]>(STORAGE_ORDERS_KEY, []).length === 0) {
      setItem(STORAGE_ORDERS_KEY, INITIAL_ORDERS);
    }
    if (getItem<Customer[]>(STORAGE_CUSTOMERS_KEY, []).length === 0) {
      setItem(STORAGE_CUSTOMERS_KEY, INITIAL_CUSTOMERS);
    }
    if (getItem<DeliveryPartner[]>(STORAGE_PARTNERS_KEY, []).length === 0) {
      setItem(STORAGE_PARTNERS_KEY, INITIAL_DELIVERY_PARTNERS);
    }
    if (getItem<ActivityLog[]>(STORAGE_LOGS_KEY, []).length === 0) {
      setItem(STORAGE_LOGS_KEY, INITIAL_ACTIVITY_LOGS);
    }
  }

  public async getOrders(): Promise<Order[]> {
    await new Promise((r) => setTimeout(r, 150));
    return getItem<Order[]>(STORAGE_ORDERS_KEY, INITIAL_ORDERS);
  }

  public async getMyOrders(customerId: string): Promise<Order[]> {
    await new Promise((r) => setTimeout(r, 120));
    const all = getItem<Order[]>(STORAGE_ORDERS_KEY, INITIAL_ORDERS);
    return all.filter((o) => o.customerId === customerId);
  }

  public async getAssignedOrders(deliveryPartnerId: string): Promise<Order[]> {
    await new Promise((r) => setTimeout(r, 120));
    const all = getItem<Order[]>(STORAGE_ORDERS_KEY, INITIAL_ORDERS);
    return all.filter((o) => o.deliveryPartnerId === deliveryPartnerId);
  }

  public async getOrderById(orderId: string): Promise<Order | null> {
    await new Promise((r) => setTimeout(r, 100));
    const all = getItem<Order[]>(STORAGE_ORDERS_KEY, INITIAL_ORDERS);
    return all.find((o) => o.orderId === orderId) || null;
  }

  public async createOrder(params: {
    customerId: string;
    customerName: string;
    customerPhone?: string;
    customerEmail?: string;
    restaurant?: string;
    items: OrderItem[];
    subtotal?: number;
    deliveryFee?: number;
    totalAmount: number;
    deliveryAddress: string;
    contactNumber: string;
    paymentMethod?: string;
    specialInstructions?: string;
  }): Promise<Order> {
    await new Promise((r) => setTimeout(r, 300));
    const orders = getItem<Order[]>(STORAGE_ORDERS_KEY, INITIAL_ORDERS);
    const partners = getItem<DeliveryPartner[]>(STORAGE_PARTNERS_KEY, INITIAL_DELIVERY_PARTNERS);
    const activeCourier = partners[0] || INITIAL_DELIVERY_PARTNERS[0];

    // Generate next clean order ID: e.g. ORD-1001 or sequential based on existing
    const nextNum = 1000 + orders.length + 1;
    const orderId = `ORD-${nextNum}`;

    const newOrder: Order = {
      orderId,
      customerId: params.customerId,
      customerName: params.customerName,
      customerPhone: params.contactNumber || params.customerPhone,
      customerEmail: params.customerEmail,
      restaurant: params.restaurant || 'Bella Napoli Trattoria',
      deliveryPartnerId: activeCourier.deliveryPartnerId,
      deliveryPartnerName: activeCourier.name,
      deliveryPartnerPhone: activeCourier.phone,
      items: params.items,
      subtotal: params.subtotal || params.totalAmount,
      deliveryFee: params.deliveryFee || 4.99,
      totalAmount: params.totalAmount,
      paymentMethod: params.paymentMethod || 'Card',
      paymentStatus: 'PENDING',
      orderStatus: 'PLACED',
      deliveryAddress: params.deliveryAddress,
      contactNumber: params.contactNumber,
      specialInstructions: params.specialInstructions || '',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      estimatedDeliveryTime: '30-40 mins',
    };

    const updatedOrders = [newOrder, ...orders];
    setItem(STORAGE_ORDERS_KEY, updatedOrders);

    // Update customer stats
    const customers = getItem<Customer[]>(STORAGE_CUSTOMERS_KEY, INITIAL_CUSTOMERS);
    const customerIdx = customers.findIndex((c) => c.customerId === params.customerId);
    if (customerIdx >= 0) {
      customers[customerIdx].totalOrders += 1;
      customers[customerIdx].totalSpent += params.totalAmount;
      setItem(STORAGE_CUSTOMERS_KEY, customers);
    }

    // Add activity log
    this.addActivityLog({
      userId: params.customerId,
      userName: params.customerName,
      userRole: 'CUSTOMER',
      action: 'Created order via GraphQL mutation createOrder',
      orderId,
      status: 'PLACED',
      details: `Order created with ${params.items.length} items for ${formatCurrency(params.totalAmount)}`,
    });

    // Broadcast GraphQL Subscription event!
    mockSubscriptionService.emitEvent('ORDER_CREATED', orderId, `New order ${orderId} created by ${params.customerName}`, {
      newStatus: 'PLACED',
      payload: newOrder as unknown as Record<string, unknown>,
    });

    return newOrder;
  }

  public async updateOrderStatus(
    orderId: string,
    newStatus: OrderStatus,
    updatedBy: { id: string; name: string; role: UserRole }
  ): Promise<Order> {
    await new Promise((r) => setTimeout(r, 200));
    const orders = getItem<Order[]>(STORAGE_ORDERS_KEY, INITIAL_ORDERS);
    const orderIdx = orders.findIndex((o) => o.orderId === orderId);

    if (orderIdx === -1) {
      throw new Error(`Order ${orderId} not found.`);
    }

    const order = orders[orderIdx];
    const prevStatus = order.orderStatus;
    order.orderStatus = newStatus;
    order.updatedAt = new Date().toISOString();

    if (newStatus === 'OUT_FOR_DELIVERY') {
      order.estimatedDeliveryTime = '15-20 mins';
    } else if (newStatus === 'DELIVERED') {
      order.estimatedDeliveryTime = 'Delivered';
      order.paymentStatus = 'PAID'; // Finalize payment if pending
    }

    orders[orderIdx] = order;
    setItem(STORAGE_ORDERS_KEY, orders);

    // Add activity log
    this.addActivityLog({
      userId: updatedBy.id,
      userName: updatedBy.name,
      userRole: updatedBy.role,
      action: `Updated order status to ${newStatus}`,
      orderId,
      status: newStatus,
      details: `Status transitioned from ${prevStatus} to ${newStatus}`,
    });

    // Broadcast real-time subscription update event
    mockSubscriptionService.emitEvent(
      'ORDER_STATUS_CHANGED',
      orderId,
      `Order ${orderId} status updated: ${prevStatus} → ${newStatus}`,
      {
        previousStatus: prevStatus,
        newStatus,
        payload: order as unknown as Record<string, unknown>,
      }
    );

    return order;
  }

  public async assignDeliveryPartner(
    orderId: string,
    partnerId: string,
    adminUser: { id: string; name: string }
  ): Promise<Order> {
    await new Promise((r) => setTimeout(r, 200));
    const orders = getItem<Order[]>(STORAGE_ORDERS_KEY, INITIAL_ORDERS);
    const partners = getItem<DeliveryPartner[]>(STORAGE_PARTNERS_KEY, INITIAL_DELIVERY_PARTNERS);

    const order = orders.find((o) => o.orderId === orderId);
    if (!order) throw new Error(`Order ${orderId} not found`);

    const partner = partners.find((p) => p.deliveryPartnerId === partnerId);
    if (!partner) throw new Error(`Delivery partner not found`);

    order.deliveryPartnerId = partner.deliveryPartnerId;
    order.deliveryPartnerName = partner.name;
    order.deliveryPartnerPhone = partner.phone;
    if (order.orderStatus === 'PLACED') {
      order.orderStatus = 'CONFIRMED';
    }
    order.updatedAt = new Date().toISOString();
    setItem(STORAGE_ORDERS_KEY, orders);

    // Update partner stats
    partner.activeOrders += 1;
    partner.status = 'BUSY';
    setItem(STORAGE_PARTNERS_KEY, partners);

    // Log activity
    this.addActivityLog({
      userId: adminUser.id,
      userName: adminUser.name,
      userRole: 'ADMIN',
      action: `Assigned delivery partner ${partner.name}`,
      orderId,
      status: order.orderStatus,
      details: `AppSync mutation executeAssignDeliveryPartner to partner ${partner.name}`,
    });

    // Emit real-time subscription event
    mockSubscriptionService.emitEvent(
      'DELIVERY_ASSIGNED',
      orderId,
      `Delivery partner ${partner.name} assigned to order ${orderId}`,
      {
        newStatus: order.orderStatus,
        payload: { order, partner },
      }
    );

    return order;
  }

  public async getCustomers(): Promise<Customer[]> {
    await new Promise((r) => setTimeout(r, 100));
    return getItem<Customer[]>(STORAGE_CUSTOMERS_KEY, INITIAL_CUSTOMERS);
  }

  public async getDeliveryPartners(): Promise<DeliveryPartner[]> {
    await new Promise((r) => setTimeout(r, 100));
    return getItem<DeliveryPartner[]>(STORAGE_PARTNERS_KEY, INITIAL_DELIVERY_PARTNERS);
  }

  public async getActivityLogs(): Promise<ActivityLog[]> {
    await new Promise((r) => setTimeout(r, 100));
    return getItem<ActivityLog[]>(STORAGE_LOGS_KEY, INITIAL_ACTIVITY_LOGS);
  }

  public addActivityLog(log: Omit<ActivityLog, 'id' | 'timestamp'>): void {
    const logs = getItem<ActivityLog[]>(STORAGE_LOGS_KEY, INITIAL_ACTIVITY_LOGS);
    const newLog: ActivityLog = {
      ...log,
      id: `log-${Date.now()}-${Math.random().toString(36).substring(2, 5)}`,
      timestamp: new Date().toISOString(),
    };
    setItem(STORAGE_LOGS_KEY, [newLog, ...logs].slice(0, 100));
  }

  public async getAnalytics(): Promise<AnalyticsData> {
    const orders = await this.getOrders();
    const partners = await this.getDeliveryPartners();
    const events = mockSubscriptionService.getEvents();

    const processing = orders.filter((o) => o.orderStatus === 'CONFIRMED' || o.orderStatus === 'PLACED').length;
    const preparing = orders.filter((o) => o.orderStatus === 'PREPARING' || o.orderStatus === 'READY_FOR_PICKUP').length;
    const outForDelivery = orders.filter((o) => o.orderStatus === 'OUT_FOR_DELIVERY').length;
    const delivered = orders.filter((o) => o.orderStatus === 'DELIVERED').length;
    const cancelled = orders.filter((o) => o.orderStatus === 'CANCELLED').length;
    const activePartners = partners.filter((p) => p.status === 'AVAILABLE' || p.status === 'BUSY').length;

    const totalRevenue = orders.reduce((sum, o) => sum + o.totalAmount, 0);
    const averageOrderValue = orders.length > 0 ? totalRevenue / orders.length : 0;
    const deliveryCompletionRate = orders.length > 0 ? (delivered / orders.length) * 100 : 0;

    const statuses: OrderStatus[] = [
      'PLACED',
      'CONFIRMED',
      'PREPARING',
      'READY_FOR_PICKUP',
      'OUT_FOR_DELIVERY',
      'DELIVERED',
      'CANCELLED',
    ];

    const statusDistribution = statuses.map((status) => {
      const count = orders.filter((o) => o.orderStatus === status).length;
      return {
        status,
        count,
        percentage: orders.length > 0 ? Math.round((count / orders.length) * 100) : 0,
      };
    });

    const hourlyTrends = [
      { hour: '08:00', orders: 4, completed: 2 },
      { hour: '10:00', orders: 12, completed: 8 },
      { hour: '12:00', orders: 28, completed: 21 },
      { hour: '14:00', orders: 19, completed: 17 },
      { hour: '16:00', orders: 24, completed: 20 },
      { hour: '18:00', orders: 31, completed: 25 },
      { hour: '20:00', orders: 15, completed: 14 },
    ];

    const topDeliveryPartners = partners.map((p) => ({
      id: p.deliveryPartnerId,
      name: p.name,
      completed: p.completedOrders,
      rating: p.rating,
    }));

    return {
      totalOrders: orders.length,
      processingOrders: processing,
      preparingOrders: preparing,
      outForDeliveryOrders: outForDelivery,
      deliveredOrders: delivered,
      cancelledOrders: cancelled,
      activeDeliveryPartners: activePartners,
      totalRevenue,
      averageOrderValue,
      deliveryCompletionRate,
      realTimeEventsCount: events.length,
      hourlyTrends,
      statusDistribution,
      topDeliveryPartners,
    };
  }
}

export const mockOrderService = new MockOrderService();
