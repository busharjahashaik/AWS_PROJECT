import { DynamoDBClient, DescribeTableCommand } from '@aws-sdk/client-dynamodb';
import {
  DynamoDBDocumentClient,
  PutCommand,
  GetCommand,
  QueryCommand,
  ScanCommand,
  UpdateCommand,
} from '@aws-sdk/lib-dynamodb';
import { config } from '../config.js';

const sortNewest = (a, b) => (a.createdAt < b.createdAt ? 1 : -1);

export function createDynamoStore() {
  const client = new DynamoDBClient({ region: config.region });
  const db = DynamoDBDocumentClient.from(client, { marshallOptions: { removeUndefinedValues: true } });
  const T = config.tables;

  const isConditionFail = (e) => e?.name === 'ConditionalCheckFailedException';

  async function scanAll(TableName) {
    const items = [];
    let ExclusiveStartKey;
    do {
      const res = await db.send(new ScanCommand({ TableName, ExclusiveStartKey }));
      items.push(...(res.Items || []));
      ExclusiveStartKey = res.LastEvaluatedKey;
    } while (ExclusiveStartKey);
    return items;
  }

  async function queryIndex(TableName, IndexName, keyName, keyValue) {
    const items = [];
    let ExclusiveStartKey;
    do {
      const res = await db.send(
        new QueryCommand({
          TableName,
          IndexName,
          KeyConditionExpression: '#k = :v',
          ExpressionAttributeNames: { '#k': keyName },
          ExpressionAttributeValues: { ':v': keyValue },
          ScanIndexForward: false,
          ExclusiveStartKey,
        })
      );
      items.push(...(res.Items || []));
      ExclusiveStartKey = res.LastEvaluatedKey;
    } while (ExclusiveStartKey);
    return items;
  }

  async function updateRecord(TableName, Key, keyName, patch, notFoundMessage) {
    const entries = Object.entries(patch).filter(([, value]) => value !== undefined);
    const names = { '#pk': keyName };
    const values = {};
    const sets = entries.map(([field, value], i) => {
      names[`#f${i}`] = field;
      values[`:v${i}`] = value;
      return `#f${i} = :v${i}`;
    });

    try {
      const result = await db.send(
        new UpdateCommand({
          TableName,
          Key,
          UpdateExpression: `SET ${sets.join(', ')}`,
          ConditionExpression: 'attribute_exists(#pk)',
          ExpressionAttributeNames: names,
          ExpressionAttributeValues: values,
          ReturnValues: 'ALL_NEW',
        })
      );
      return result.Attributes;
    } catch (error) {
      if (isConditionFail(error)) {
        throw Object.assign(new Error(notFoundMessage), { code: 'NOT_FOUND' });
      }
      throw error;
    }
  }

  return {
    name: 'dynamodb',
    async init() {},
    async ping() {
      const out = {};
      for (const [k, name] of Object.entries(T)) {
        const res = await client.send(new DescribeTableCommand({ TableName: name }));
        out[k] = { table: name, status: res.Table?.TableStatus };
      }
      return { store: 'dynamodb', region: config.region, tables: out, ok: true };
    },

    async createUser(user) {
      const existing = await this.getUserByEmail(user.email);
      if (existing) throw Object.assign(new Error('Email already registered.'), { code: 'EXISTS' });
      try {
        await db.send(
          new PutCommand({ TableName: T.users, Item: user, ConditionExpression: 'attribute_not_exists(userId)' })
        );
      } catch (e) {
        if (isConditionFail(e)) throw Object.assign(new Error('User id collision.'), { code: 'EXISTS' });
        throw e;
      }
      return user;
    },
    async getUserByEmail(email) {
      const items = await queryIndex(T.users, 'email-index', 'email', email);
      return items[0] || null;
    },
    async getUserById(id) {
      const res = await db.send(new GetCommand({ TableName: T.users, Key: { userId: id } }));
      return res.Item || null;
    },
    async listUsers() {
      return scanAll(T.users);
    },
    async updateDeliveryAvailability(userId, availability) {
      try {
        const result = await db.send(
          new UpdateCommand({
            TableName: T.users,
            Key: { userId },
            UpdateExpression: 'SET #availability = :availability, #updatedAt = :updatedAt',
            ConditionExpression: 'attribute_exists(#userId) AND #role = :deliveryRole',
            ExpressionAttributeNames: {
              '#availability': 'availability',
              '#updatedAt': 'updatedAt',
              '#userId': 'userId',
              '#role': 'role',
            },
            ExpressionAttributeValues: {
              ':availability': availability,
              ':updatedAt': new Date().toISOString(),
              ':deliveryRole': 'DELIVERY',
            },
            ReturnValues: 'ALL_NEW',
          })
        );
        return result.Attributes;
      } catch (error) {
        if (!isConditionFail(error)) throw error;
        const user = await this.getUserById(userId);
        throw Object.assign(
          new Error(user ? 'User is not a delivery partner.' : 'Delivery partner not found.'),
          { code: user ? 'NOT_DELIVERY' : 'NOT_FOUND' }
        );
      }
    },

    async createRestaurant(restaurant) {
      try {
        await db.send(
          new PutCommand({
            TableName: T.restaurants,
            Item: restaurant,
            ConditionExpression: 'attribute_not_exists(restaurantId)',
          })
        );
      } catch (error) {
        if (isConditionFail(error)) {
          throw Object.assign(new Error('Restaurant id collision.'), { code: 'EXISTS' });
        }
        throw error;
      }
      return restaurant;
    },
    async getRestaurant(id, consistentRead = false) {
      const result = await db.send(
        new GetCommand({ TableName: T.restaurants, Key: { restaurantId: id }, ConsistentRead: consistentRead })
      );
      return result.Item || null;
    },
    async listRestaurants() {
      return (await scanAll(T.restaurants)).filter((restaurant) => restaurant.isActive);
    },
    async updateRestaurant(id, patch) {
      return updateRecord(T.restaurants, { restaurantId: id }, 'restaurantId', patch, 'Restaurant not found.');
    },
    async createMenuItem(menuItem) {
      try {
        await db.send(
          new PutCommand({
            TableName: T.menuItems,
            Item: menuItem,
            ConditionExpression: 'attribute_not_exists(itemId)',
          })
        );
      } catch (error) {
        if (isConditionFail(error)) {
          throw Object.assign(new Error('Menu item id collision.'), { code: 'EXISTS' });
        }
        throw error;
      }
      return menuItem;
    },
    async getMenuItem(id, consistentRead = false) {
      const result = await db.send(
        new GetCommand({ TableName: T.menuItems, Key: { itemId: id }, ConsistentRead: consistentRead })
      );
      return result.Item || null;
    },
    async listMenuItemsByRestaurant(restaurantId) {
      return (await queryIndex(T.menuItems, 'restaurant-index', 'restaurantId', restaurantId))
        .filter((menuItem) => menuItem.isAvailable);
    },
    async updateMenuItem(id, patch) {
      return updateRecord(T.menuItems, { itemId: id }, 'itemId', patch, 'Menu item not found.');
    },

    async createOrder(order) {
      try {
        await db.send(
          new PutCommand({ TableName: T.orders, Item: order, ConditionExpression: 'attribute_not_exists(orderId)' })
        );
      } catch (e) {
        if (isConditionFail(e)) throw Object.assign(new Error('Order id collision.'), { code: 'EXISTS' });
        throw e;
      }
      return order;
    },
    async getOrder(id) {
      const res = await db.send(new GetCommand({ TableName: T.orders, Key: { orderId: id } }));
      return res.Item || null;
    },
    async listOrders() {
      return (await scanAll(T.orders)).sort(sortNewest);
    },
    async listOrdersByCustomer(customerId) {
      return queryIndex(T.orders, 'customer-index', 'customerId', customerId);
    },
    async listOrdersByPartner(partnerId) {
      return queryIndex(T.orders, 'delivery-index', 'deliveryPartnerId', partnerId);
    },
    async updateOrder(orderId, patch, expectedStatus) {
      const entries = Object.entries(patch).filter(([, v]) => v !== undefined);
      const names = {};
      const values = {};
      const sets = entries.map(([k, v], i) => {
        names[`#f${i}`] = k;
        values[`:v${i}`] = v;
        return `#f${i} = :v${i}`;
      });
      if (expectedStatus) {
        names['#orderStatusCond'] = 'orderStatus';
        values[':expected'] = expectedStatus;
      }

      try {
        const res = await db.send(
          new UpdateCommand({
            TableName: T.orders,
            Key: { orderId },
            UpdateExpression: `SET ${sets.join(', ')}`,
            ConditionExpression: expectedStatus
              ? 'attribute_exists(orderId) AND #orderStatusCond = :expected'
              : 'attribute_exists(orderId)',
            ExpressionAttributeNames: names,
            ExpressionAttributeValues: values,
            ReturnValues: 'ALL_NEW',
          })
        );
        return res.Attributes;
      } catch (e) {
        if (isConditionFail(e)) {
          const exists = await this.getOrder(orderId);
          if (!exists) throw Object.assign(new Error('Order not found.'), { code: 'NOT_FOUND' });
          throw Object.assign(new Error('Order was changed by someone else. Refresh and try again.'), { code: 'CONFLICT' });
        }
        throw e;
      }
    },

    async addLog(log) {
      await db.send(new PutCommand({ TableName: T.logs, Item: log }));
    },
    async listLogs(limit = 100) {
      const all = await scanAll(T.logs);
      return all.sort((a, b) => (a.timestamp < b.timestamp ? 1 : -1)).slice(0, limit);
    },
  };
}
