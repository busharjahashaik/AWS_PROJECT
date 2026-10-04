import bcrypt from 'bcryptjs';
import { config } from './config.js';
import { store } from './store/index.js';

// Same demo accounts the frontend used in mock mode.
const DEMO = [
  { userId: 'usr-admin-01', name: 'Sarah Jenkins', email: 'admin@livesync.io', phone: '+1 (555) 019-2834', role: 'ADMIN', password: 'admin123' },
  { userId: 'usr-cust-01', name: 'Alex Rivera', email: 'customer@gmail.com', phone: '+1 (555) 438-9210', role: 'CUSTOMER', password: 'customer123' },
  { userId: 'usr-deliv-01', name: 'Marcus Vance', email: 'delivery@express.com', phone: '+1 (555) 782-3490', role: 'DELIVERY', password: 'delivery123' },
  { userId: 'usr-deliv-02', name: 'Elena Rostova', email: 'partner2@express.com', phone: '+1 (555) 329-8471', role: 'DELIVERY', password: 'partner123' },
];

export async function seedDemoUsers() {
  let created = 0;
  for (const { password, ...u } of DEMO) {
    if (await store.getUserByEmail(u.email)) continue;
    await store.createUser({
      ...u,
      passwordHash: await bcrypt.hash(password, 10),
      createdAt: new Date().toISOString(),
    });
    created++;
  }
  return created;
}

const CATALOG_RESTAURANTS = [
  {
    restaurantId: 'rest-hyderabad',
    name: 'Deccan Spice Kitchen',
    location: 'Hyderabad',
    address: 'Banjara Hills, Hyderabad',
    latitude: 17.4126,
    longitude: 78.4071,
    description: 'Hyderabadi favourites and regional Indian dishes.',
    image: '',
    items: [
      { itemId: 'item-hyd-biryani', name: 'Hyderabadi Chicken Biryani', description: 'Aromatic basmati rice with traditional spices.', category: 'Main Course', price: 320, image: '' },
      { itemId: 'item-hyd-haleem', name: 'Hyderabadi Haleem', description: 'Slow-cooked lentils, grains and spices.', category: 'Main Course', price: 240, image: '' },
    ],
  },
  {
    restaurantId: 'rest-vijayawada',
    name: 'Krishna River Meals',
    location: 'Vijayawada',
    address: 'Benz Circle, Vijayawada',
    latitude: 16.5062,
    longitude: 80.648,
    description: 'Andhra meals and locally inspired dishes.',
    image: '',
    items: [
      { itemId: 'item-vja-thali', name: 'Andhra Veg Meal', description: 'A traditional meal with rice, curries and accompaniments.', category: 'Meals', price: 180, image: '' },
      { itemId: 'item-vja-guntur-chicken', name: 'Guntur Chilli Chicken', description: 'Chicken prepared with Guntur chillies.', category: 'Main Course', price: 290, image: '' },
    ],
  },
  {
    restaurantId: 'rest-guntur',
    name: 'Guntur Chilli House',
    location: 'Guntur',
    address: 'Arundelpet, Guntur',
    latitude: 16.3067,
    longitude: 80.4365,
    description: 'Andhra recipes with bold regional flavours.',
    image: '',
    items: [
      { itemId: 'item-gnt-pulihora', name: 'Pulihora', description: 'Tamarind rice with peanuts and curry leaves.', category: 'Rice', price: 140, image: '' },
      { itemId: 'item-gnt-gongura', name: 'Gongura Paneer', description: 'Paneer cooked with tangy gongura leaves.', category: 'Main Course', price: 260, image: '' },
    ],
  },
  {
    restaurantId: 'rest-bengaluru',
    name: 'Garden City Tiffins',
    location: 'Bengaluru',
    address: 'Indiranagar, Bengaluru',
    latitude: 12.9716,
    longitude: 77.5946,
    description: 'South Indian tiffin classics and comfort food.',
    image: '',
    items: [
      { itemId: 'item-blr-dosa', name: 'Masala Dosa', description: 'Crisp dosa with potato masala and chutneys.', category: 'Breakfast', price: 120, image: '' },
      { itemId: 'item-blr-idli', name: 'Idli Sambar', description: 'Steamed idlis served with sambar and chutney.', category: 'Breakfast', price: 90, image: '' },
    ],
  },
  {
    restaurantId: 'rest-chennai',
    name: 'Marina South Kitchen',
    location: 'Chennai',
    address: 'Mylapore, Chennai',
    latitude: 13.0827,
    longitude: 80.2707,
    description: 'Tamil meals and coastal-inspired favourites.',
    image: '',
    items: [
      { itemId: 'item-chn-meals', name: 'South Indian Meals', description: 'Rice, seasonal curries, rasam and sides.', category: 'Meals', price: 210, image: '' },
      { itemId: 'item-chn-lemon-rice', name: 'Lemon Rice', description: 'Tempered rice with lemon, peanuts and curry leaves.', category: 'Rice', price: 130, image: '' },
    ],
  },
];

export async function seedInitialCatalog() {
  if (config.store !== 'dynamodb') {
    throw new Error('Catalog seeding requires STORE=dynamodb so records are written to DynamoDB.');
  }

  let created = 0;
  for (const { items, ...restaurant } of CATALOG_RESTAURANTS) {
    const existingRestaurant = await store.getRestaurant(restaurant.restaurantId);
    if (!existingRestaurant) {
      const now = new Date().toISOString();
      await store.createRestaurant({ ...restaurant, isActive: true, createdAt: now, updatedAt: now });
      created++;
    } else if (
      typeof existingRestaurant.latitude !== 'number' ||
      typeof existingRestaurant.longitude !== 'number'
    ) {
      await store.updateRestaurant(restaurant.restaurantId, {
        latitude: restaurant.latitude,
        longitude: restaurant.longitude,
        updatedAt: new Date().toISOString(),
      });
    }
    for (const item of items) {
      if (await store.getMenuItem(item.itemId)) continue;
      const now = new Date().toISOString();
      await store.createMenuItem({
        ...item,
        restaurantId: restaurant.restaurantId,
        isAvailable: true,
        createdAt: now,
        updatedAt: now,
      });
      created++;
    }
  }
  return created;
}
