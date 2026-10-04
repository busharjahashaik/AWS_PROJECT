// GraphQL Queries for AWS AppSync GraphQL API

export const GET_ORDERS = /* GraphQL */ `
  query GetOrders($limit: Int, $nextToken: String) {
    getOrders(limit: $limit, nextToken: $nextToken) {
      items {
        orderId
        customerId
        customerName
        customerPhone
        deliveryPartnerId
        deliveryPartnerName
        deliveryPartnerPhone
        items {
          id
          name
          quantity
          price
          category
        }
        totalAmount
        paymentStatus
        orderStatus
        deliveryAddress
        contactNumber
        specialInstructions
        createdAt
        updatedAt
        estimatedDeliveryTime
      }
      nextToken
    }
  }
`;

export const GET_ORDER_BY_ID = /* GraphQL */ `
  query GetOrderById($orderId: ID!) {
    getOrderById(orderId: $orderId) {
      orderId
      customerId
      customerName
      customerPhone
      deliveryPartnerId
      deliveryPartnerName
      deliveryPartnerPhone
      items {
        id
        name
        quantity
        price
        category
      }
      totalAmount
      paymentStatus
      orderStatus
      deliveryAddress
      contactNumber
      specialInstructions
      createdAt
      updatedAt
      estimatedDeliveryTime
    }
  }
`;

export const GET_MY_ORDERS = /* GraphQL */ `
  query GetMyOrders($customerId: ID!) {
    getMyOrders(customerId: $customerId) {
      orderId
      customerId
      customerName
      deliveryPartnerId
      deliveryPartnerName
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
      createdAt
      updatedAt
    }
  }
`;

export const GET_ASSIGNED_ORDERS = /* GraphQL */ `
  query GetAssignedOrders($deliveryPartnerId: ID!) {
    getAssignedOrders(deliveryPartnerId: $deliveryPartnerId) {
      orderId
      customerId
      customerName
      customerPhone
      deliveryPartnerId
      deliveryPartnerName
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

export const GET_CUSTOMERS = /* GraphQL */ `
  query GetCustomers {
    getCustomers {
      customerId
      name
      email
      phone
      totalOrders
      totalSpent
      address
      joinedDate
      status
    }
  }
`;

export const GET_DELIVERY_PARTNERS = /* GraphQL */ `
  query GetDeliveryPartners {
    getDeliveryPartners {
      deliveryPartnerId
      name
      phone
      email
      status
      activeOrders
      completedOrders
      vehicleType
      rating
      zone
      joinedDate
    }
  }
`;

export const GET_ANALYTICS = /* GraphQL */ `
  query GetAnalytics {
    getAnalytics {
      totalOrders
      processingOrders
      preparingOrders
      outForDeliveryOrders
      deliveredOrders
      cancelledOrders
      activeDeliveryPartners
      totalRevenue
      averageOrderValue
      deliveryCompletionRate
      realTimeEventsCount
    }
  }
`;
