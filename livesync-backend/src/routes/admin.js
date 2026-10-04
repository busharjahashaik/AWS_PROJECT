import { Router } from 'express';
import { store } from '../store/index.js';
import { authenticate, requireRole, ah } from '../middleware/auth.js';
import { toApiLog } from '../services/mappers.js';
import { ALL_STATUSES, FINAL_STATUSES } from '../services/orderRules.js';

const router = Router();
router.use(authenticate, requireRole('ADMIN'));

const pad = (n) => String(n).padStart(2, '0');

router.get(
  '/customers',
  ah(async (req, res) => {
    const [users, orders] = await Promise.all([store.listUsers(), store.listOrders()]);
    const customers = users
      .filter((u) => u.role === 'CUSTOMER')
      .map((u) => {
        const mine = orders.filter((o) => o.customerId === u.userId);
        const billable = mine.filter((o) => o.orderStatus !== 'CANCELLED');
        return {
          customerId: u.userId,
          name: u.name,
          email: u.email,
          phone: u.phone || '',
          totalOrders: mine.length,
          totalSpent: Math.round(billable.reduce((s, o) => s + o.totalAmount, 0) * 100) / 100,
          address: mine[0]?.deliveryAddress || '',
          joinedDate: u.createdAt,
          status: 'ACTIVE',
        };
      });
    res.json(customers);
  })
);

router.get(
  '/delivery-partners',
  ah(async (req, res) => {
    const [users, orders] = await Promise.all([store.listUsers(), store.listOrders()]);
    const partners = users
      .filter((u) => u.role === 'DELIVERY')
      .map((u) => {
        const mine = orders.filter((o) => o.deliveryPartnerId === u.userId);
        const active = mine.filter((o) => !FINAL_STATUSES.includes(o.orderStatus)).length;
        return {
          deliveryPartnerId: u.userId,
          name: u.name,
          phone: u.phone || '',
          email: u.email,
          status: u.availability === 'OFFLINE' ? 'OFFLINE' : active > 0 || u.availability === 'BUSY' ? 'BUSY' : 'AVAILABLE',
          activeOrders: active,
          completedOrders: mine.filter((o) => o.orderStatus === 'DELIVERED').length,
          vehicleType: u.vehicleType || 'Bike',
          rating: u.rating || 4.8,
          zone: u.zone || 'City Center',
          joinedDate: u.createdAt,
        };
      });
    res.json(partners);
  })
);

router.patch(
  '/delivery-partners/:deliveryPartnerId/availability',
  ah(async (req, res) => {
    const { availability } = req.body || {};
    if (!['AVAILABLE', 'BUSY', 'OFFLINE'].includes(availability)) {
      return res.status(400).json({ message: 'Availability must be AVAILABLE, BUSY, or OFFLINE.' });
    }
    try {
      const partner = await store.updateDeliveryAvailability(req.params.deliveryPartnerId, availability);
      res.json({ deliveryPartnerId: partner.userId, availability: partner.availability });
    } catch (err) {
      if (err.code === 'NOT_FOUND') return res.status(404).json({ message: 'Delivery partner not found.' });
      if (err.code === 'NOT_DELIVERY') return res.status(404).json({ message: 'Delivery partner not found.' });
      throw err;
    }
  })
);

router.get(
  '/analytics',
  ah(async (req, res) => {
    const [orders, users, logs] = await Promise.all([store.listOrders(), store.listUsers(), store.listLogs(500)]);
    const count = (...s) => orders.filter((o) => s.includes(o.orderStatus)).length;
    const billable = orders.filter((o) => o.orderStatus !== 'CANCELLED');
    const totalRevenue = billable.reduce((s, o) => s + o.totalAmount, 0);
    const delivered = count('DELIVERED');
    const partners = users.filter((u) => u.role === 'DELIVERY');

    const byHour = new Map();
    for (const o of orders) {
      const h = `${pad(new Date(o.createdAt).getHours())}:00`;
      const row = byHour.get(h) || { hour: h, orders: 0, completed: 0 };
      row.orders += 1;
      if (o.orderStatus === 'DELIVERED') row.completed += 1;
      byHour.set(h, row);
    }

    res.json({
      totalOrders: orders.length,
      processingOrders: count('PLACED', 'CONFIRMED'),
      preparingOrders: count('PREPARING', 'READY_FOR_PICKUP'),
      outForDeliveryOrders: count('OUT_FOR_DELIVERY'),
      deliveredOrders: delivered,
      cancelledOrders: count('CANCELLED'),
      activeDeliveryPartners: partners.length,
      totalRevenue: Math.round(totalRevenue * 100) / 100,
      averageOrderValue: billable.length ? Math.round((totalRevenue / billable.length) * 100) / 100 : 0,
      deliveryCompletionRate: orders.length ? Math.round((delivered / orders.length) * 1000) / 10 : 0,
      realTimeEventsCount: logs.length,
      hourlyTrends: [...byHour.values()].sort((a, b) => (a.hour < b.hour ? -1 : 1)),
      statusDistribution: ALL_STATUSES.map((status) => {
        const n = count(status);
        return { status, count: n, percentage: orders.length ? Math.round((n / orders.length) * 100) : 0 };
      }),
      topDeliveryPartners: partners
        .map((p) => ({
          id: p.userId,
          name: p.name,
          completed: orders.filter((o) => o.deliveryPartnerId === p.userId && o.orderStatus === 'DELIVERED').length,
          rating: p.rating || 4.8,
        }))
        .sort((a, b) => b.completed - a.completed),
    });
  })
);

router.get(
  '/activity',
  ah(async (req, res) => res.json((await store.listLogs(100)).map(toApiLog)))
);

export default router;
