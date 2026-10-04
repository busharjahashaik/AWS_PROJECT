import { Router } from 'express';
import crypto from 'node:crypto';
import { store } from '../store/index.js';
import { authenticate, requireRole, ah } from '../middleware/auth.js';
import { calculateDistanceKm } from '../services/geo.js';

const router = Router();
const textFields = ['name', 'location', 'address', 'description', 'image'];
const limits = { name: 120, location: 120, address: 300, description: 1000, image: 1000 };
const text = (value, max) => (typeof value === 'string' ? value.trim().slice(0, max) : '');

function coordinate(value, field) {
  if (typeof value !== 'number' || !Number.isFinite(value)) return `${field} must be a number.`;
  const [min, max] = field === 'latitude' ? [-90, 90] : [-180, 180];
  if (value < min || value > max) return `${field} must be between ${min} and ${max}.`;
  return null;
}

function restaurantFields(body, creating) {
  const fields = {};
  for (const field of textFields) {
    if (creating || Object.hasOwn(body, field)) {
      const value = text(body[field], limits[field]);
      if ((field === 'name' || field === 'location' || field === 'address') && !value) {
        return { error: `${field} is required.` };
      }
      fields[field] = value;
    }
  }
  for (const field of ['latitude', 'longitude']) {
    if (creating || Object.hasOwn(body, field)) {
      const error = coordinate(body[field], field);
      if (error) return { error };
      fields[field] = body[field];
    }
  }
  if (Object.hasOwn(body, 'isActive')) {
    if (typeof body.isActive !== 'boolean') return { error: 'isActive must be a boolean.' };
    fields.isActive = body.isActive;
  } else if (creating) {
    fields.isActive = true;
  }
  return { fields };
}

router.get(
  '/',
  ah(async (req, res) => res.json(await store.listRestaurants()))
);

router.get(
  '/nearby',
  ah(async (req, res) => {
    const parseCoordinate = (value, field, min, max) => {
      if (typeof value !== 'string' || value.trim() === '') return null;
      const parsed = Number(value);
      return Number.isFinite(parsed) && parsed >= min && parsed <= max ? parsed : null;
    };
    const latitude = parseCoordinate(req.query.lat, 'lat', -90, 90);
    const longitude = parseCoordinate(req.query.lng, 'lng', -180, 180);
    const radiusInput = req.query.radius;
    const radius = radiusInput === undefined ? 10 : Number(radiusInput);
    if (
      latitude === null ||
      longitude === null ||
      (radiusInput !== undefined && (typeof radiusInput !== 'string' || radiusInput.trim() === '')) ||
      !Number.isFinite(radius) ||
      radius <= 0 ||
      radius > 50
    ) {
      return res.status(400).json({
        message: 'Provide valid latitude and longitude; radius must be greater than 0 and at most 50 km.',
      });
    }

    const nearby = (await store.listRestaurants())
      .filter(
        (restaurant) =>
          typeof restaurant.latitude === 'number' &&
          Number.isFinite(restaurant.latitude) &&
          typeof restaurant.longitude === 'number' &&
          Number.isFinite(restaurant.longitude)
      )
      .map((restaurant) => ({
        restaurant,
        distance: calculateDistanceKm(latitude, longitude, restaurant.latitude, restaurant.longitude),
      }))
      .filter(({ distance }) => distance <= radius)
      .sort((a, b) => a.distance - b.distance)
      .map(({ restaurant, distance }) => ({
        restaurantId: restaurant.restaurantId,
        name: restaurant.name,
        location: restaurant.location,
        address: restaurant.address,
        description: restaurant.description,
        image: restaurant.image,
        latitude: restaurant.latitude,
        longitude: restaurant.longitude,
        isActive: restaurant.isActive,
        distanceKm: Math.round(distance * 10) / 10,
      }));
    res.json({
      restaurants: nearby,
      ...(nearby.length === 0 ? { message: 'No restaurants found within the selected radius.' } : {}),
    });
  })
);

router.get(
  '/:restaurantId/menu',
  ah(async (req, res) => {
    const restaurant = await store.getRestaurant(req.params.restaurantId, true);
    if (!restaurant) return res.status(404).json({ message: 'Restaurant not found.' });
    if (!restaurant.isActive) return res.status(409).json({ message: 'Restaurant is inactive.' });
    res.json(await store.listMenuItemsByRestaurant(restaurant.restaurantId));
  })
);

router.get(
  '/:restaurantId',
  ah(async (req, res) => {
    const restaurant = await store.getRestaurant(req.params.restaurantId);
    if (!restaurant) return res.status(404).json({ message: 'Restaurant not found.' });
    res.json(restaurant);
  })
);

router.post(
  '/',
  authenticate,
  requireRole('ADMIN'),
  ah(async (req, res) => {
    const { fields, error } = restaurantFields(req.body || {}, true);
    if (error) return res.status(400).json({ message: error });
    const now = new Date().toISOString();
    const restaurant = {
      restaurantId: `rest-${crypto.randomUUID()}`,
      ...fields,
      createdAt: now,
      updatedAt: now,
    };
    await store.createRestaurant(restaurant);
    res.status(201).json(restaurant);
  })
);

router.put(
  '/:restaurantId',
  authenticate,
  requireRole('ADMIN'),
  ah(async (req, res) => {
    const { fields, error } = restaurantFields(req.body || {}, false);
    if (error) return res.status(400).json({ message: error });
    if (Object.keys(fields).length === 0) {
      return res.status(400).json({ message: 'Provide at least one restaurant field to update.' });
    }
    try {
      const restaurant = await store.updateRestaurant(req.params.restaurantId, {
        ...fields,
        updatedAt: new Date().toISOString(),
      });
      res.json(restaurant);
    } catch (err) {
      if (err.code === 'NOT_FOUND') return res.status(404).json({ message: 'Restaurant not found.' });
      throw err;
    }
  })
);

router.delete(
  '/:restaurantId',
  authenticate,
  requireRole('ADMIN'),
  ah(async (req, res) => {
    try {
      const restaurant = await store.updateRestaurant(req.params.restaurantId, {
        isActive: false,
        updatedAt: new Date().toISOString(),
      });
      res.json(restaurant);
    } catch (err) {
      if (err.code === 'NOT_FOUND') return res.status(404).json({ message: 'Restaurant not found.' });
      throw err;
    }
  })
);

export default router;
