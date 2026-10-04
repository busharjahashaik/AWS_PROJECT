import { Router } from 'express';
import { config } from '../config.js';
import { store } from '../store/index.js';
import { authenticate, requireRole, ah } from '../middleware/auth.js';
import { toApiOrder } from '../services/mappers.js';
import { validateTransition, statusSideEffects, buildTotals, FINAL_STATUSES } from '../services/orderRules.js';
import { publishOrderEvent, updateOrderStatusViaAppSync } from '../services/appsync.js';
import { logActivity } from '../services/activity.js';

const router = Router();
router.use(authenticate);

const str = (v, max) => String(v ?? '').trim().slice(0, max);

/** Can this user see this order? */
const canView = (user, order) =>
  user.role === 'ADMIN' ||
  (user.role === 'CUSTOMER' && order.customerId === user.id) ||
  (user.role === 'DELIVERY' && order.deliveryPartnerId === user.id);

/** Delivery partner with the fewest active orders (used for AUTO_ASSIGN). */
async function pickLeastBusyPartner() {
  const [users, orders] = await Promise.all([store.listUsers(), store.listOrders()]);
  const partners = users
    .filter((u) => u.role === 'DELIVERY' && u.availability !== 'OFFLINE')
    .sort((a, b) => (a.createdAt < b.createdAt ? -1 : 1));
  if (partners.length === 0) return null;
  const load = (id) => orders.filter((o) => o.deliveryPartnerId === id && !FINAL_STATUSES.includes(o.orderStatus)).length;
  return partners
    .map((p) => ({ p, n: load(p.userId) }))
    .sort(
      (a, b) =>
        Number(a.p.availability === 'BUSY' || a.n > 0) - Number(b.p.availability === 'BUSY' || b.n > 0) ||
        a.n - b.n
    )[0].p;
}

// GET /api/orders  -> role-scoped list (admin: all, customer: own, delivery: assigned)
router.get(
  '/',
  ah(async (req, res) => {
    const { id, role } = req.user;
    const list =
      role === 'ADMIN'
        ? await store.listOrders()
        : role === 'CUSTOMER'
        ? await store.listOrdersByCustomer(id)
        : await store.listOrdersByPartner(id);
    res.json(list.map(toApiOrder));
  })
);

router.get(
  '/my',
  requireRole('CUSTOMER'),
  ah(async (req, res) => res.json((await store.listOrdersByCustomer(req.user.id)).map(toApiOrder)))
);

router.get(
  '/assigned',
  requireRole('DELIVERY'),
  ah(async (req, res) => res.json((await store.listOrdersByPartner(req.user.id)).map(toApiOrder)))
);

router.get(
  '/:id',
  ah(async (req, res) => {
    const order = await store.getOrder(req.params.id);
    if (!order || !canView(req.user, order)) return res.status(404).json({ message: 'Order not found.' });
    res.json(toApiOrder(order));
  })
);

// POST /api/orders  (customers only)
router.post(
  '/',
  requireRole('CUSTOMER'),
  ah(async (req, res) => {
    const b = req.body || {};
    if (!Array.isArray(b.items) || b.items.length === 0) {
      return res.status(400).json({ message: 'Order must contain at least one item.' });
    }
    if (b.items.length > 50) return res.status(400).json({ message: 'Too many items in one order.' });

    const selectedItems = [];
    for (const item of b.items) {
      const itemId = str(item?.itemId ?? item?.id, 120);
      const quantity = Number(item?.quantity);
      if (!itemId) return res.status(400).json({ message: 'Every order item needs an itemId.' });
      if (!Number.isInteger(quantity) || quantity < 1 || quantity > 50) {
        return res.status(400).json({ message: `Invalid quantity for menu item ${itemId}.` });
      }
      selectedItems.push({ itemId, quantity });
    }

    const catalogItems = new Map(
      await Promise.all(
        [...new Set(selectedItems.map(({ itemId }) => itemId))].map(async (itemId) => [
          itemId,
          await store.getMenuItem(itemId, true),
        ])
      )
    );
    const resolvedItems = [];
    for (const { itemId, quantity } of selectedItems) {
      const menuItem = catalogItems.get(itemId);
      if (!menuItem) return res.status(404).json({ message: `Menu item ${itemId} not found.` });
      if (!menuItem.isAvailable) return res.status(409).json({ message: `${menuItem.name} is currently unavailable.` });
      resolvedItems.push({ quantity, menuItem });
    }

    const restaurantIds = new Set(resolvedItems.map(({ menuItem }) => menuItem.restaurantId));
    if (restaurantIds.size !== 1) {
      return res.status(400).json({ message: 'All items in an order must belong to one restaurant.' });
    }
    const [restaurantId] = restaurantIds;
    if (typeof restaurantId !== 'string' || !restaurantId) {
      return res.status(404).json({ message: 'Restaurant not found.' });
    }
    if (b.restaurantId && String(b.restaurantId) !== restaurantId) {
      return res.status(400).json({ message: 'The selected items do not belong to the selected restaurant.' });
    }
    const restaurant = await store.getRestaurant(restaurantId, true);
    if (!restaurant) return res.status(404).json({ message: 'Restaurant not found.' });
    if (!restaurant.isActive) return res.status(409).json({ message: 'Restaurant is inactive.' });

    const totals = buildTotals(resolvedItems);
    if (totals.error) return res.status(totals.status || 400).json({ message: totals.error });

    const deliveryAddress = str(b.deliveryAddress, 300);
    const contactNumber = str(b.contactNumber, 30);
    if (!deliveryAddress) return res.status(400).json({ message: 'Please enter a delivery address.' });
    if (!contactNumber) return res.status(400).json({ message: 'Please enter your contact phone number.' });

    const me = await store.getUserById(req.user.id);
    if (!me) return res.status(401).json({ message: 'Account no longer exists.' });

    const partner = config.autoAssign ? await pickLeastBusyPartner() : null;
    const now = new Date().toISOString();

    const base = {
      customerId: me.userId,
      customerName: me.name,
      customerEmail: me.email,
      customerPhone: contactNumber,
      restaurantId: restaurant.restaurantId,
      restaurant: restaurant.name,
      ...(partner
        ? { deliveryPartnerId: partner.userId, deliveryPartnerName: partner.name, deliveryPartnerPhone: partner.phone }
        : {}),
      items: totals.items,
      subtotal: totals.subtotal,
      deliveryFee: totals.deliveryFee,
      totalAmount: totals.totalAmount,
      paymentMethod: str(b.paymentMethod, 40) || 'Card',
      paymentStatus: 'PENDING',
      orderStatus: 'PLACED',
      deliveryAddress,
      contactNumber,
      specialInstructions: str(b.specialInstructions, 300),
      createdAt: now,
      updatedAt: now,
      estimatedDeliveryTime: '30-40 mins',
      statusHistory: [{ status: 'PLACED', at: now, by: me.name }],
    };

    let order;
    for (let attempt = 0; attempt < 5 && !order; attempt++) {
      const orderId = `ORD-${(Date.now() + attempt).toString().slice(-7)}`;
      try {
        order = await store.createOrder({ orderId, ...base });
      } catch (err) {
        if (err.code !== 'EXISTS') throw err;
      }
    }
    if (!order) return res.status(500).json({ message: 'Could not create the order. Please try again.' });

    await logActivity({
      actor: req.user,
      action: 'Created a new order',
      orderId: order.orderId,
      status: 'PLACED',
      details: `${order.items.length} item(s), total ${order.totalAmount.toFixed(2)}`,
      ip: req.ip,
    });
    publishOrderEvent({ eventType: 'ORDER_CREATED', order: toApiOrder(order) }); // fire and forget
    res.status(201).json(toApiOrder(order));
  })
);

// PATCH /api/orders/:id/status   body: { status }
router.patch(
  '/:id/status',
  ah(async (req, res) => {
    const newStatus = str(req.body?.status, 40);
    const order = await store.getOrder(req.params.id);
    if (!order || !canView(req.user, order)) return res.status(404).json({ message: 'Order not found.' });

    const verdict = validateTransition({ order, newStatus, actor: req.user });
    if (!verdict.ok) return res.status(verdict.status).json({ message: verdict.message });

    const now = new Date().toISOString();
    const previous = order.orderStatus;
    let updated;
    try {
      updated = await updateOrderStatusViaAppSync({
        orderId: order.orderId,
        status: newStatus,
        expectedStatus: order.orderStatus,
        updatedAt: now,
        statusHistory: [...(order.statusHistory || []), { status: newStatus, at: now, by: req.user.name }],
        ...statusSideEffects(newStatus),
      });
    } catch (err) {
      if (err.code === 'CONFLICT' || /conditional(?:check)?failed|conditional request failed/i.test(err.message)) {
        return res.status(409).json({ message: 'Order was changed by someone else. Refresh and try again.' });
      }
      if (err.code === 'NOT_FOUND' || /order not found/i.test(err.message)) {
        return res.status(404).json({ message: 'Order not found.' });
      }
      throw err;
    }

    await logActivity({
      actor: req.user,
      action: `Updated order status to ${newStatus}`,
      orderId: order.orderId,
      status: newStatus,
      details: `Status transitioned from ${previous} to ${newStatus}`,
      ip: req.ip,
    });
    res.json(toApiOrder(updated));
  })
);

// PATCH /api/orders/:id/assign   body: { deliveryPartnerId }   (admin only)
router.patch(
  '/:id/assign',
  requireRole('ADMIN'),
  ah(async (req, res) => {
    const order = await store.getOrder(req.params.id);
    if (!order) return res.status(404).json({ message: 'Order not found.' });
    if (FINAL_STATUSES.includes(order.orderStatus)) {
      return res.status(409).json({ message: `Order is already ${order.orderStatus}.` });
    }

    const partner = await store.getUserById(String(req.body?.deliveryPartnerId || ''));
    if (!partner || partner.role !== 'DELIVERY') return res.status(404).json({ message: 'Delivery partner not found.' });
    if (partner.availability === 'OFFLINE') {
      return res.status(409).json({ message: 'This delivery partner is offline and cannot be assigned.' });
    }

    const now = new Date().toISOString();
    const nextStatus = order.orderStatus === 'PLACED' ? 'CONFIRMED' : order.orderStatus;
    const history = [...(order.statusHistory || [])];
    if (nextStatus !== order.orderStatus) history.push({ status: nextStatus, at: now, by: req.user.name });

    let updated;
    try {
      updated = await store.updateOrder(
        order.orderId,
        {
          deliveryPartnerId: partner.userId,
          deliveryPartnerName: partner.name,
          deliveryPartnerPhone: partner.phone,
          orderStatus: nextStatus,
          updatedAt: now,
          statusHistory: history,
        },
        order.orderStatus
      );
    } catch (err) {
      if (err.code === 'CONFLICT') return res.status(409).json({ message: err.message });
      throw err;
    }

    await logActivity({
      actor: req.user,
      action: `Assigned delivery partner ${partner.name}`,
      orderId: order.orderId,
      status: updated.orderStatus,
      details: `Order assigned to ${partner.name}`,
      ip: req.ip,
    });
    publishOrderEvent({ eventType: 'DELIVERY_ASSIGNED', order: toApiOrder(updated), previousStatus: order.orderStatus });
    res.json(toApiOrder(updated));
  })
);

export default router;
