import {
  Order,
  OrderStatus,
  OrderItem,
  UserRole,
  ActivityLog,
  AnalyticsData,
} from '../types';
import { mockOrderService } from './mock/mockOrderService';
import { apiRequest, ApiError } from '../api/httpClient';

const USE_MOCK_DATA = import.meta.env.VITE_USE_MOCK_DATA !== 'false';

export interface CreateOrderDTO {
  customerId: string;
  customerName: string;
  customerPhone?: string;
  customerEmail?: string;
  restaurantId: string;
  restaurant: string;
  items: OrderItem[];
  subtotal: number;
  deliveryFee: number;
  totalAmount: number;
  deliveryAddress: string;
  contactNumber: string;
  paymentMethod: string;
  specialInstructions?: string;
}

export const orderService = {
  /** Orders visible to the signed-in user (admin: all, customer: own, delivery: assigned). */
  async getOrders(): Promise<Order[]> {
    if (USE_MOCK_DATA) {
      return mockOrderService.getOrders();
    }
    return apiRequest<Order[]>('/orders');
  },

  // Alias for getAllOrders required by specification
  async getAllOrders(): Promise<Order[]> {
    return this.getOrders();
  },

  async getMyOrders(customerId: string): Promise<Order[]> {
    if (USE_MOCK_DATA) {
      return mockOrderService.getMyOrders(customerId);
    }
    return apiRequest<Order[]>('/orders/my');
  },

  // Alias for getCustomerOrders required by specification
  async getCustomerOrders(customerId: string): Promise<Order[]> {
    return this.getMyOrders(customerId);
  },

  async getAssignedOrders(deliveryPartnerId: string): Promise<Order[]> {
    if (USE_MOCK_DATA) {
      return mockOrderService.getAssignedOrders(deliveryPartnerId);
    }
    return apiRequest<Order[]>('/orders/assigned');
  },

  async getOrderById(orderId: string): Promise<Order | null> {
    if (USE_MOCK_DATA) {
      return mockOrderService.getOrderById(orderId);
    }
    try {
      return await apiRequest<Order>(`/orders/${encodeURIComponent(orderId)}`);
    } catch (err) {
      if (err instanceof ApiError && err.status === 404) return null;
      throw err;
    }
  },

  async createOrder(params: CreateOrderDTO): Promise<Order> {
    if (USE_MOCK_DATA) {
      return mockOrderService.createOrder(params);
    }
    // The server knows who the customer is (from the token) and recalculates the totals.
    return apiRequest<Order>('/orders', {
      method: 'POST',
      body: {
        restaurantId: params.restaurantId,
        items: params.items.map(({ id, quantity }) => ({
          itemId: id,
          quantity,
        })),
        deliveryAddress: params.deliveryAddress,
        contactNumber: params.contactNumber,
        paymentMethod: params.paymentMethod,
        specialInstructions: params.specialInstructions,
      },
    });
  },

  async updateOrderStatus(
    orderId: string,
    newStatus: OrderStatus,
    updatedBy: { id: string; name: string; role: UserRole }
  ): Promise<Order> {
    if (USE_MOCK_DATA) {
      return mockOrderService.updateOrderStatus(orderId, newStatus, updatedBy);
    }
    return apiRequest<Order>(`/orders/${encodeURIComponent(orderId)}/status`, {
      method: 'PATCH',
      body: { status: newStatus },
    });
  },

  async assignDeliveryPartner(
    orderId: string,
    deliveryPartnerId: string,
    deliveryPartnerName: string,
    adminUser: { id: string; name: string }
  ): Promise<Order> {
    if (USE_MOCK_DATA) {
      return mockOrderService.assignDeliveryPartner(orderId, deliveryPartnerId, adminUser);
    }
    return apiRequest<Order>(`/orders/${encodeURIComponent(orderId)}/assign`, {
      method: 'PATCH',
      body: { deliveryPartnerId },
    });
  },

  async getActivityLogs(): Promise<ActivityLog[]> {
    if (USE_MOCK_DATA) {
      return mockOrderService.getActivityLogs();
    }
    return apiRequest<ActivityLog[]>('/admin/activity');
  },

  async getAnalytics(): Promise<AnalyticsData> {
    if (USE_MOCK_DATA) {
      return mockOrderService.getAnalytics();
    }
    return apiRequest<AnalyticsData>('/admin/analytics');
  },
};
