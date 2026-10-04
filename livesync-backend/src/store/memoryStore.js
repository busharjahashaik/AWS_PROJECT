// In-memory store: zero setup, perfect for a quick demo. Data is lost on restart.

const sortNewest = (a, b) => (a.createdAt < b.createdAt ? 1 : -1);

export function createMemoryStore() {
  const users = new Map();
  const orders = new Map();
  const restaurants = new Map();
  const menuItems = new Map();
  let logs = [];

  const conflict = () => Object.assign(new Error('Order was changed by someone else. Refresh and try again.'), { code: 'CONFLICT' });
  const notFound = () => Object.assign(new Error('Order not found.'), { code: 'NOT_FOUND' });

  return {
    name: 'memory',
    async init() {},
    async ping() {
      return { store: 'memory', ok: true };
    },

    async createUser(user) {
      for (const u of users.values()) {
        if (u.email === user.email) throw Object.assign(new Error('Email already registered.'), { code: 'EXISTS' });
      }
      users.set(user.userId, { ...user });
      return user;
    },
    async getUserByEmail(email) {
      for (const u of users.values()) if (u.email === email) return { ...u };
      return null;
    },
    async getUserById(id) {
      const u = users.get(id);
      return u ? { ...u } : null;
    },
    async listUsers() {
      return [...users.values()].map((u) => ({ ...u }));
    },
    async updateDeliveryAvailability(userId, availability) {
      const user = users.get(userId);
      if (!user) throw Object.assign(new Error('Delivery partner not found.'), { code: 'NOT_FOUND' });
      if (user.role !== 'DELIVERY') {
        throw Object.assign(new Error('User is not a delivery partner.'), { code: 'NOT_DELIVERY' });
      }
      const updated = { ...user, availability, updatedAt: new Date().toISOString() };
      users.set(userId, updated);
      return { ...updated };
    },

    async createRestaurant(restaurant) {
      if (restaurants.has(restaurant.restaurantId)) {
        throw Object.assign(new Error('Restaurant id collision.'), { code: 'EXISTS' });
      }
      restaurants.set(restaurant.restaurantId, structuredClone(restaurant));
      return structuredClone(restaurant);
    },
    async getRestaurant(id) {
      const restaurant = restaurants.get(id);
      return restaurant ? structuredClone(restaurant) : null;
    },
    async listRestaurants() {
      return [...restaurants.values()]
        .filter((restaurant) => restaurant.isActive)
        .map((restaurant) => structuredClone(restaurant));
    },
    async updateRestaurant(id, patch) {
      const restaurant = restaurants.get(id);
      if (!restaurant) throw Object.assign(new Error('Restaurant not found.'), { code: 'NOT_FOUND' });
      const updated = { ...restaurant, ...patch };
      restaurants.set(id, updated);
      return structuredClone(updated);
    },
    async createMenuItem(menuItem) {
      if (menuItems.has(menuItem.itemId)) {
        throw Object.assign(new Error('Menu item id collision.'), { code: 'EXISTS' });
      }
      menuItems.set(menuItem.itemId, structuredClone(menuItem));
      return structuredClone(menuItem);
    },
    async getMenuItem(id) {
      const menuItem = menuItems.get(id);
      return menuItem ? structuredClone(menuItem) : null;
    },
    async listMenuItemsByRestaurant(restaurantId) {
      return [...menuItems.values()]
        .filter((menuItem) => menuItem.restaurantId === restaurantId && menuItem.isAvailable)
        .map((menuItem) => structuredClone(menuItem));
    },
    async updateMenuItem(id, patch) {
      const menuItem = menuItems.get(id);
      if (!menuItem) throw Object.assign(new Error('Menu item not found.'), { code: 'NOT_FOUND' });
      const updated = { ...menuItem, ...patch };
      menuItems.set(id, updated);
      return structuredClone(updated);
    },

    async createOrder(order) {
      if (orders.has(order.orderId)) throw Object.assign(new Error('Order id collision.'), { code: 'EXISTS' });
      orders.set(order.orderId, structuredClone(order));
      return order;
    },
    async getOrder(id) {
      const o = orders.get(id);
      return o ? structuredClone(o) : null;
    },
    async listOrders() {
      return [...orders.values()].map((o) => structuredClone(o)).sort(sortNewest);
    },
    async listOrdersByCustomer(customerId) {
      return (await this.listOrders()).filter((o) => o.customerId === customerId);
    },
    async listOrdersByPartner(partnerId) {
      return (await this.listOrders()).filter((o) => o.deliveryPartnerId === partnerId);
    },
    async updateOrder(orderId, patch, expectedStatus) {
      const current = orders.get(orderId);
      if (!current) throw notFound();
      if (expectedStatus && current.orderStatus !== expectedStatus) throw conflict();
      const next = { ...current };
      for (const [k, v] of Object.entries(patch)) if (v !== undefined) next[k] = v;
      orders.set(orderId, next);
      return structuredClone(next);
    },

    async addLog(log) {
      logs.unshift(log);
      logs = logs.slice(0, 500);
    },
    async listLogs(limit = 100) {
      return logs.slice(0, limit);
    },
  };
}
