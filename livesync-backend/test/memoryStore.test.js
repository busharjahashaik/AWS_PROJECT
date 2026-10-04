import test from 'node:test';
import assert from 'node:assert/strict';
import { createMemoryStore } from '../src/store/memoryStore.js';

const mk = (id, over = {}) => ({
  orderId: id,
  customerId: 'c1',
  orderStatus: 'PLACED',
  createdAt: new Date().toISOString(),
  ...over,
});

test('duplicate emails are rejected', async () => {
  const s = createMemoryStore();
  await s.createUser({ userId: 'u1', email: 'a@b.com' });
  await assert.rejects(s.createUser({ userId: 'u2', email: 'a@b.com' }), { code: 'EXISTS' });
  assert.equal((await s.getUserByEmail('a@b.com')).userId, 'u1');
});

test('optimistic lock rejects stale status updates', async () => {
  const s = createMemoryStore();
  await s.createOrder(mk('O1'));
  await s.updateOrder('O1', { orderStatus: 'CONFIRMED' }, 'PLACED');
  await assert.rejects(s.updateOrder('O1', { orderStatus: 'PREPARING' }, 'PLACED'), { code: 'CONFLICT' });
  assert.equal((await s.getOrder('O1')).orderStatus, 'CONFIRMED');
});

test('filters by customer and partner', async () => {
  const s = createMemoryStore();
  await s.createOrder(mk('O1', { customerId: 'c1', deliveryPartnerId: 'd1' }));
  await s.createOrder(mk('O2', { customerId: 'c2' }));
  assert.equal((await s.listOrdersByCustomer('c1')).length, 1);
  assert.equal((await s.listOrdersByPartner('d1')).length, 1);
  assert.equal((await s.listOrdersByPartner('dX')).length, 0);
  assert.equal((await s.listOrders()).length, 2);
});

test('catalog records can be created, listed, updated, and soft-deleted', async () => {
  const s = createMemoryStore();
  await s.createRestaurant({ restaurantId: 'r1', name: 'Kitchen', isActive: true });
  await s.createRestaurant({ restaurantId: 'r2', name: 'Closed Kitchen', isActive: false });
  assert.deepEqual((await s.listRestaurants()).map((r) => r.restaurantId), ['r1']);

  await s.createMenuItem({ itemId: 'm1', restaurantId: 'r1', name: 'Meal', price: 250, isAvailable: true });
  await s.createMenuItem({ itemId: 'm2', restaurantId: 'r1', name: 'Old meal', price: 100, isAvailable: false });
  assert.deepEqual((await s.listMenuItemsByRestaurant('r1')).map((item) => item.itemId), ['m1']);
  assert.equal((await s.getMenuItem('m1')).price, 250);

  await s.updateRestaurant('r1', { isActive: false });
  await s.updateMenuItem('m1', { isAvailable: false });
  assert.deepEqual(await s.listRestaurants(), []);
  assert.deepEqual(await s.listMenuItemsByRestaurant('r1'), []);
});

test('missing order', async () => {
  const s = createMemoryStore();
  await assert.rejects(s.updateOrder('nope', {}), { code: 'NOT_FOUND' });
});
