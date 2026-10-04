// Pure business rules for the order lifecycle. No I/O here, so it is easy to test.

export const STATUS_FLOW = [
  'PLACED',
  'CONFIRMED',
  'PREPARING',
  'READY_FOR_PICKUP',
  'PICKED_UP',
  'OUT_FOR_DELIVERY',
  'DELIVERED',
];
export const ALL_STATUSES = [...STATUS_FLOW, 'CANCELLED'];
export const FINAL_STATUSES = ['DELIVERED', 'CANCELLED'];

const fail = (status, message) => ({ ok: false, status, message });
const OK = { ok: true };

/**
 * Decide whether `actor` may move `order` to `newStatus`.
 * actor = { id, role }  (from the verified JWT)
 */
export function validateTransition({ order, newStatus, actor }) {
  if (!ALL_STATUSES.includes(newStatus)) return fail(400, `Invalid status "${newStatus}".`);

  const current = order.orderStatus;
  if (FINAL_STATUSES.includes(current)) return fail(409, `Order is already ${current} and cannot change.`);
  if (newStatus === current) return fail(409, `Order is already ${current}.`);

  if (newStatus === 'CANCELLED') {
    if (actor.role === 'ADMIN') return OK;
    if (actor.role === 'CUSTOMER' && order.customerId === actor.id && current === 'PLACED') return OK;
    return fail(403, 'You are not allowed to cancel this order.');
  }

  // Status can only move forward through the lifecycle.
  if (STATUS_FLOW.indexOf(newStatus) <= STATUS_FLOW.indexOf(current)) {
    return fail(400, `Cannot move an order backwards from ${current} to ${newStatus}.`);
  }

  if (actor.role === 'ADMIN') return OK;

  if (actor.role === 'DELIVERY') {
    if (order.deliveryPartnerId !== actor.id) return fail(403, 'This order is not assigned to you.');
    const early = ['PLACED', 'CONFIRMED', 'PREPARING'];
    const allowed =
      (newStatus === 'READY_FOR_PICKUP' && early.includes(current)) || // "Accept Delivery" button
      (newStatus === 'PICKED_UP' && current === 'READY_FOR_PICKUP') ||
      (newStatus === 'OUT_FOR_DELIVERY' && current === 'PICKED_UP') ||
      (newStatus === 'DELIVERED' && current === 'OUT_FOR_DELIVERY');
    return allowed ? OK : fail(400, `Delivery partners cannot move an order from ${current} to ${newStatus}.`);
  }

  return fail(403, 'You are not allowed to change this order status.');
}

/** Extra fields that change together with a status. */
export function statusSideEffects(newStatus) {
  if (newStatus === 'OUT_FOR_DELIVERY') return { estimatedDeliveryTime: '15-20 mins' };
  if (newStatus === 'DELIVERED') return { estimatedDeliveryTime: 'Delivered', paymentStatus: 'PAID' };
  if (newStatus === 'CANCELLED') return { estimatedDeliveryTime: 'Cancelled' };
  return {};
}

const round2 = (n) => Math.round(n * 100) / 100;

/** Build order line items and totals using menu records already loaded from the store. */
export function buildTotals(rawItems) {
  if (!Array.isArray(rawItems) || rawItems.length === 0) {
    return { error: 'Order must contain at least one item.' };
  }
  if (rawItems.length > 50) return { error: 'Too many items in one order.' };

  const items = [];
  for (const it of rawItems) {
    const quantity = Number(it?.quantity);
    const menuItem = it?.menuItem;
    if (!menuItem?.itemId || typeof menuItem.name !== 'string') {
      return { error: 'A selected menu item could not be found.', status: 404 };
    }
    if (!Number.isInteger(quantity) || quantity < 1 || quantity > 50) {
      return { error: `Invalid quantity for ${menuItem.name}.` };
    }
    if (!menuItem.isAvailable) return { error: `${menuItem.name} is currently unavailable.`, status: 409 };
    const price = menuItem.price;
    if (typeof price !== 'number' || !Number.isFinite(price) || price < 0) {
      return { error: 'A menu item has an invalid price.', status: 500 };
    }
    items.push({
      id: menuItem.itemId,
      itemId: menuItem.itemId,
      name: menuItem.name.slice(0, 120),
      quantity,
      price,
      itemTotal: round2(price * quantity),
      ...(menuItem.category ? { category: String(menuItem.category).slice(0, 60) } : {}),
    });
  }
  const subtotal = round2(items.reduce((s, i) => s + i.itemTotal, 0));
  const deliveryFee = 4.99;
  return { items, subtotal, deliveryFee, totalAmount: round2(subtotal + deliveryFee) };
}
