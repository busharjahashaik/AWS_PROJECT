// GraphQL Subscriptions for AWS AppSync Real-Time Updates

export const ON_CREATE_ORDER = /* GraphQL */ `
  subscription OnCreateOrder {
    onCreateOrder {
      orderId
      customerId
      customerName
      items {
        id
        name
        quantity
        price
      }
      totalAmount
      paymentStatus
      orderStatus
      deliveryAddress
      createdAt
      updatedAt
    }
  }
`;

export const ON_UPDATE_ORDER_STATUS = /* GraphQL */ `
  subscription OnUpdateOrderStatus($orderId: ID) {
    onUpdateOrderStatus(orderId: $orderId) {
      orderId
      orderStatus
      updatedAt
      estimatedDeliveryTime
    }
  }
`;

export const ON_ORDER_UPDATED = /* GraphQL */ `
  subscription OnOrderUpdated {
    onOrderUpdated {
      orderId
      customerId
      customerName
      deliveryPartnerId
      deliveryPartnerName
      orderStatus
      paymentStatus
      totalAmount
      updatedAt
    }
  }
`;

export const ON_DELIVERY_ASSIGNED = /* GraphQL */ `
  subscription OnDeliveryAssigned($deliveryPartnerId: ID) {
    onDeliveryAssigned(deliveryPartnerId: $deliveryPartnerId) {
      orderId
      deliveryPartnerId
      deliveryPartnerName
      orderStatus
      updatedAt
    }
  }
`;

// Single subscription used by the LiveSync backend (see backend/aws/appsync-schema.graphql).
// The backend publishes ORDER_CREATED / ORDER_STATUS_CHANGED / DELIVERY_ASSIGNED events through it.
export const ON_ORDER_EVENT = /* GraphQL */ `
  subscription OnOrderEvent($orderId: ID, $customerId: ID, $deliveryPartnerId: ID) {
    onOrderEvent(orderId: $orderId, customerId: $customerId, deliveryPartnerId: $deliveryPartnerId) {
      eventType
      orderId
      customerId
      deliveryPartnerId
      orderStatus
      previousStatus
      orderJson
      timestamp
    }
  }
`;
