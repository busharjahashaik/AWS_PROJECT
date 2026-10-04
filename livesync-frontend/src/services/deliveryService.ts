import { DeliveryPartner } from '../types';
import { mockOrderService } from './mock/mockOrderService';
import { apiRequest } from '../api/httpClient';

const USE_MOCK_DATA = import.meta.env.VITE_USE_MOCK_DATA !== 'false';

export const deliveryService = {
  async getDeliveryPartners(): Promise<DeliveryPartner[]> {
    if (USE_MOCK_DATA) {
      return mockOrderService.getDeliveryPartners();
    }
    return apiRequest<DeliveryPartner[]>('/admin/delivery-partners');
  },

  async getDeliveryPartnerById(id: string): Promise<DeliveryPartner | null> {
    const partners = await this.getDeliveryPartners();
    return partners.find((p) => p.deliveryPartnerId === id) || null;
  },

  async getMyAvailability(): Promise<DeliveryPartner['status']> {
    if (USE_MOCK_DATA) return 'AVAILABLE';
    const { user } = await apiRequest<{ user: { availability?: DeliveryPartner['status'] } }>('/auth/me');
    return user.availability || 'AVAILABLE';
  },

  async updateMyAvailability(availability: DeliveryPartner['status']): Promise<DeliveryPartner['status']> {
    if (USE_MOCK_DATA) return availability;
    const result = await apiRequest<{ availability: DeliveryPartner['status'] }>('/auth/me/availability', {
      method: 'PATCH',
      body: { availability },
    });
    return result.availability;
  },

  async updatePartnerAvailability(
    id: string,
    availability: DeliveryPartner['status']
  ): Promise<DeliveryPartner['status']> {
    if (USE_MOCK_DATA) return availability;
    const result = await apiRequest<{ availability: DeliveryPartner['status'] }>(
      `/admin/delivery-partners/${encodeURIComponent(id)}/availability`,
      { method: 'PATCH', body: { availability } }
    );
    return result.availability;
  },
};
