import { Router } from 'express';
import crypto from 'node:crypto';
import { store } from '../store/index.js';
import { authenticate, requireRole, ah } from '../middleware/auth.js';

const router = Router();
const textFields = ['name', 'description', 'category', 'image'];
const limits = { name: 120, description: 1000, category: 80, image: 1000 };
const text = (value, max) => (typeof value === 'string' ? value.trim().slice(0, max) : '');

function menuFields(body, creating) {
  const fields = {};
  for (const field of textFields) {
    if (creating || Object.hasOwn(body, field)) {
      const value = text(body[field], limits[field]);
      if (field === 'name' && !value) return { error: 'name is required.' };
      fields[field] = field === 'category' && !value ? 'Other' : value;
    }
  }
  if (creating || Object.hasOwn(body, 'price')) {
    if (typeof body.price !== 'number' || !Number.isFinite(body.price) || body.price < 0) {
      return { error: 'price must be a non-negative number.' };
    }
    fields.price = body.price;
  }
  if (creating || Object.hasOwn(body, 'isAvailable')) {
    if (Object.hasOwn(body, 'isAvailable') && typeof body.isAvailable !== 'boolean') {
      return { error: 'isAvailable must be a boolean.' };
    }
    fields.isAvailable = Object.hasOwn(body, 'isAvailable') ? body.isAvailable : true;
  }
  return { fields };
}

router.get(
  '/:itemId',
  ah(async (req, res) => {
    const menuItem = await store.getMenuItem(req.params.itemId);
    if (!menuItem) return res.status(404).json({ message: 'Menu item not found.' });
    res.json(menuItem);
  })
);

router.post(
  '/',
  authenticate,
  requireRole('ADMIN'),
  ah(async (req, res) => {
    const body = req.body || {};
    const restaurantId = text(body.restaurantId, 120);
    if (!restaurantId) return res.status(400).json({ message: 'restaurantId is required.' });
    const restaurant = await store.getRestaurant(restaurantId, true);
    if (!restaurant) return res.status(404).json({ message: 'Restaurant not found.' });
    if (!restaurant.isActive) return res.status(409).json({ message: 'Restaurant is inactive.' });

    const { fields, error } = menuFields(body, true);
    if (error) return res.status(400).json({ message: error });
    const now = new Date().toISOString();
    const menuItem = {
      itemId: `item-${crypto.randomUUID()}`,
      restaurantId,
      ...fields,
      createdAt: now,
      updatedAt: now,
    };
    await store.createMenuItem(menuItem);
    res.status(201).json(menuItem);
  })
);

router.put(
  '/:itemId',
  authenticate,
  requireRole('ADMIN'),
  ah(async (req, res) => {
    const body = req.body || {};
    const { fields, error } = menuFields(body, false);
    if (error) return res.status(400).json({ message: error });
    const restaurantId = Object.hasOwn(body, 'restaurantId') ? text(body.restaurantId, 120) : undefined;
    if (Object.hasOwn(body, 'restaurantId') && !restaurantId) {
      return res.status(400).json({ message: 'restaurantId must be a non-empty string.' });
    }
    if (restaurantId) {
      const restaurant = await store.getRestaurant(restaurantId, true);
      if (!restaurant) return res.status(404).json({ message: 'Restaurant not found.' });
      if (!restaurant.isActive) return res.status(409).json({ message: 'Restaurant is inactive.' });
      fields.restaurantId = restaurantId;
    }
    if (Object.keys(fields).length === 0) {
      return res.status(400).json({ message: 'Provide at least one menu item field to update.' });
    }
    try {
      const menuItem = await store.updateMenuItem(req.params.itemId, {
        ...fields,
        updatedAt: new Date().toISOString(),
      });
      res.json(menuItem);
    } catch (err) {
      if (err.code === 'NOT_FOUND') return res.status(404).json({ message: 'Menu item not found.' });
      throw err;
    }
  })
);

router.delete(
  '/:itemId',
  authenticate,
  requireRole('ADMIN'),
  ah(async (req, res) => {
    try {
      const menuItem = await store.updateMenuItem(req.params.itemId, {
        isAvailable: false,
        updatedAt: new Date().toISOString(),
      });
      res.json(menuItem);
    } catch (err) {
      if (err.code === 'NOT_FOUND') return res.status(404).json({ message: 'Menu item not found.' });
      throw err;
    }
  })
);

export default router;
