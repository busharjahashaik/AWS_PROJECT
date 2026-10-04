import { Customer, MenuItem, Restaurant } from '../types';
import { mockOrderService } from './mock/mockOrderService';
import { apiRequest } from '../api/httpClient';

const USE_MOCK_DATA = import.meta.env.VITE_USE_MOCK_DATA !== 'false';

interface NearbyRestaurantsResponse {
  restaurants?: Restaurant[];
}

export const customerService = {
  async getCustomers(): Promise<Customer[]> {
    if (USE_MOCK_DATA) {
      return mockOrderService.getCustomers();
    }
    return apiRequest<Customer[]>('/admin/customers');
  },

  async getCustomerById(id: string): Promise<Customer | null> {
    const customers = await this.getCustomers();
    return customers.find((c) => c.customerId === id) || null;
  },
};

export const restaurantService = {
  async getNearbyRestaurants(
    latitude: number,
    longitude: number,
    radiusKm = 10
  ): Promise<Restaurant[]> {
    const params = new URLSearchParams({
      lat: String(latitude),
      lng: String(longitude),
      radius: String(radiusKm),
    });
    const response = await apiRequest<NearbyRestaurantsResponse>(
      `/restaurants/nearby?${params.toString()}`
    );

    if (
      typeof response === 'object' &&
      response !== null &&
      'restaurants' in response &&
      Array.isArray(response.restaurants)
    ) {
      return response.restaurants;
    }

    return [];
  },

  getRestaurant(restaurantId: string): Promise<Restaurant> {
    return apiRequest<Restaurant>(
      `/restaurants/${encodeURIComponent(restaurantId)}`
    );
  },

  getMenu(restaurantId: string): Promise<MenuItem[]> {
    return apiRequest<MenuItem[]>(
      `/restaurants/${encodeURIComponent(restaurantId)}/menu`
    );
  },
};
