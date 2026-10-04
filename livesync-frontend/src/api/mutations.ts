// GraphQL Mutations for AWS AppSync GraphQL API

export const CREATE_ORDER = /* GraphQL */ `
  mutation CreateOrder($input: CreateOrderInput!) {
    createOrder(input: $input) {
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
      contactNumber
      specialInstructions
      createdAt
      updatedAt
    }
  }
`;

export const UPDATE_ORDER_STATUS = /* GraphQL */ `
  mutation UpdateOrderStatus($orderId: ID!, $status: OrderStatus!, $updatedBy: String!) {
    updateOrderStatus(orderId: $orderId, status: $status, updatedBy: $updatedBy) {
      orderId
      orderStatus
      updatedAt
      estimatedDeliveryTime
    }
  }
`;

export const ASSIGN_DELIVERY_PARTNER = /* GraphQL */ `
  mutation AssignDeliveryPartner($orderId: ID!, $deliveryPartnerId: ID!, $deliveryPartnerName: String!) {
    assignDeliveryPartner(
      orderId: $orderId
      deliveryPartnerId: $deliveryPartnerId
      deliveryPartnerName: $deliveryPartnerName
    ) {
      orderId
      deliveryPartnerId
      deliveryPartnerName
      orderStatus
      updatedAt
    }
  }
`;

export const UPDATE_PAYMENT_STATUS = /* GraphQL */ `
  mutation UpdatePaymentStatus($orderId: ID!, $paymentStatus: PaymentStatus!) {
    updatePaymentStatus(orderId: $orderId, paymentStatus: $paymentStatus) {
      orderId
      paymentStatus
      updatedAt
    }
  }
`;
