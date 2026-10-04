import { config } from '../config.js';

// One mutation whose only job is to trigger AppSync subscriptions.
const PUBLISH = /* GraphQL */ `
  mutation Publish(
    $eventType: String!
    $orderId: ID!
    $customerId: ID!
    $deliveryPartnerId: ID
    $orderStatus: String!
    $previousStatus: String
    $orderJson: AWSJSON!
    $timestamp: AWSDateTime!
  ) {
    publishOrderEvent(
      eventType: $eventType
      orderId: $orderId
      customerId: $customerId
      deliveryPartnerId: $deliveryPartnerId
      orderStatus: $orderStatus
      previousStatus: $previousStatus
      orderJson: $orderJson
      timestamp: $timestamp
    ) {
      orderId
      eventType
    }
  }
`;

const UPDATE_ORDER_STATUS = /* GraphQL */ `
  mutation UpdateOrderStatus(
    $orderId: ID!
    $status: String!
    $expectedStatus: String
    $updatedAt: String
    $statusHistory: [StatusHistoryEntryInput!]
    $estimatedDeliveryTime: String
    $paymentStatus: String
  ) {
    updateOrderStatus(
      orderId: $orderId
      status: $status
      expectedStatus: $expectedStatus
      updatedAt: $updatedAt
      statusHistory: $statusHistory
      estimatedDeliveryTime: $estimatedDeliveryTime
      paymentStatus: $paymentStatus
    ) {
      orderId
      contactNumber
      createdAt
      customerEmail
      customerId
      customerName
      customerPhone
      deliveryAddress
      deliveryFee
      deliveryPartnerId
      deliveryPartnerName
      deliveryPartnerPhone
      estimatedDeliveryTime
      items
      orderStatus
      paymentMethod
      paymentStatus
      pickupAddress
      restaurant
      restaurantId
      restaurantName
      specialInstructions
      status
      statusHistory {
        status
        at
        by
      }
      subtotal
      totalAmount
      updatedAt
    }
  }
`;

export const appsyncEnabled = () => Boolean(config.appsync.endpoint && config.appsync.apiKey);

export async function updateOrderStatusViaAppSync({
  orderId,
  status,
  expectedStatus,
  updatedAt,
  statusHistory,
  estimatedDeliveryTime,
  paymentStatus,
}) {
  const res = await fetch(config.appsync.endpoint, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'x-api-key': config.appsync.apiKey },
    body: JSON.stringify({
      query: UPDATE_ORDER_STATUS,
      variables: {
        orderId,
        status,
        expectedStatus,
        updatedAt,
        statusHistory,
        estimatedDeliveryTime,
        paymentStatus,
      },
    }),
  });
  const body = await res.json();
  if (body.errors?.length) {
    throw new Error(body.errors[0].message || 'AppSync updateOrderStatus mutation failed.');
  }
  if (!body.data?.updateOrderStatus) {
    throw new Error('AppSync updateOrderStatus mutation returned no updated order.');
  }
  return body.data.updateOrderStatus;
}

/**
 * Broadcast an order event to every subscribed browser.
 * Never throws: a failed broadcast must not break the order update itself.
 */
export async function publishOrderEvent({ eventType, order, previousStatus }) {
  if (!appsyncEnabled()) return { published: false, reason: 'AppSync not configured' };
  try {
    const res = await fetch(config.appsync.endpoint, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'x-api-key': config.appsync.apiKey },
      signal: AbortSignal.timeout(5000),
      body: JSON.stringify({
        query: PUBLISH,
        variables: {
          eventType,
          orderId: order.orderId,
          customerId: order.customerId,
          deliveryPartnerId: order.deliveryPartnerId || null,
          orderStatus: order.orderStatus,
          previousStatus: previousStatus || null,
          orderJson: JSON.stringify(order),
          timestamp: new Date().toISOString(),
        },
      }),
    });
    const body = await res.json().catch(() => ({}));
    if (!res.ok || body.errors?.length) {
      console.warn('[appsync] publish failed:', res.status, body.errors?.[0]?.message || '');
      return { published: false, reason: body.errors?.[0]?.message || `HTTP ${res.status}` };
    }
    return { published: true };
  } catch (err) {
    console.warn('[appsync] publish error:', err.message);
    return { published: false, reason: err.message };
  }
}
