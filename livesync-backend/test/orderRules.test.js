import test from 'node:test';
import assert from 'node:assert/strict';
import { validateTransition, buildTotals, statusSideEffects } from '../src/services/orderRules.js';

const order = (over = {}) => ({
  orderId: 'ORD-1',
  customerId: 'c1',
  deliveryPartnerId: 'd1',
  orderStatus: 'PLACED',
  ...over,
});
const admin = { id: 'a1', role: 'ADMIN' };
const cust = { id: 'c1', role: 'CUSTOMER' };
const del = { id: 'd1', role: 'DELIVERY' };
const check = (o, s, actor) => validateTransition({ order: o, newStatus: s, actor });

test('admin can move forward, not backward', () => {
  assert.equal(check(order(), 'CONFIRMED', admin).ok, true);
  assert.equal(check(order({ orderStatus: 'PREPARING' }), 'CONFIRMED', admin).ok, false);
});

test('delivered and cancelled orders are final', () => {
  assert.equal(check(order({ orderStatus: 'DELIVERED' }), 'CANCELLED', admin).status, 409);
  assert.equal(check(order({ orderStatus: 'CANCELLED' }), 'PLACED', admin).status, 409);
});

test('delivery partner follows the pickup/delivery steps in order', () => {
  assert.equal(check(order({ orderStatus: 'CONFIRMED' }), 'READY_FOR_PICKUP', del).ok, true); // Accept
  assert.equal(check(order({ orderStatus: 'READY_FOR_PICKUP' }), 'PICKED_UP', del).ok, true);
  assert.equal(check(order({ orderStatus: 'PICKED_UP' }), 'OUT_FOR_DELIVERY', del).ok, true);
  assert.equal(check(order({ orderStatus: 'OUT_FOR_DELIVERY' }), 'DELIVERED', del).ok, true);
  // skipping steps is rejected
  assert.equal(check(order({ orderStatus: 'READY_FOR_PICKUP' }), 'DELIVERED', del).ok, false);
  assert.equal(check(order({ orderStatus: 'PLACED' }), 'PICKED_UP', del).ok, false);
});

test('delivery partner cannot touch someone else\'s order', () => {
  const r = check(order({ orderStatus: 'READY_FOR_PICKUP', deliveryPartnerId: 'other' }), 'PICKED_UP', del);
  assert.equal(r.ok, false);
  assert.equal(r.status, 403);
});

test('customer can only cancel their own PLACED order', () => {
  assert.equal(check(order(), 'CANCELLED', cust).ok, true);
  assert.equal(check(order({ orderStatus: 'PREPARING' }), 'CANCELLED', cust).ok, false);
  assert.equal(check(order({ customerId: 'someone' }), 'CANCELLED', cust).ok, false);
  assert.equal(check(order(), 'CONFIRMED', cust).status, 403);
});

test('unknown status is rejected', () => {
  assert.equal(check(order(), 'FLYING', admin).status, 400);
});

test('side effects', () => {
  assert.equal(statusSideEffects('DELIVERED').paymentStatus, 'PAID');
  assert.equal(statusSideEffects('OUT_FOR_DELIVERY').estimatedDeliveryTime, '15-20 mins');
});

test('totals use stored menu prices and ignore client-supplied prices', () => {
  const t = buildTotals([
    {
      menuItem: { itemId: 'a', name: 'Pizza', price: 250, category: 'Main', isAvailable: true },
      price: 1,
      quantity: 2,
    },
    {
      menuItem: { itemId: 'b', name: 'Cola', price: 2.25, category: 'Drinks', isAvailable: true },
      price: 999,
      quantity: 1,
    },
  ]);
  assert.equal(t.items[0].price, 250);
  assert.equal(t.items[0].itemTotal, 500);
  assert.equal(t.subtotal, 502.25);
  assert.equal(t.deliveryFee, 4.99);
  assert.equal(t.totalAmount, 507.24);
});

test('bad carts are rejected', () => {
  assert.ok(buildTotals([]).error);
  const item = { itemId: 'x', name: 'x', price: 10, isAvailable: true };
  assert.ok(buildTotals([{ menuItem: item, quantity: 0 }]).error);
  assert.ok(buildTotals([{ menuItem: item, quantity: 1.5 }]).error);
  assert.equal(buildTotals([{ menuItem: { ...item, isAvailable: false }, quantity: 1 }]).status, 409);
  assert.equal(buildTotals([{ menuItem: { ...item, price: '₹10' }, quantity: 1 }]).status, 500);
});
