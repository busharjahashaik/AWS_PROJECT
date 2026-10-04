// Creates the DynamoDB tables LiveSync needs. Safe to run more than once.
//   npm run create-tables
import {
  DynamoDBClient,
  CreateTableCommand,
  DescribeTableCommand,
  waitUntilTableExists,
} from '@aws-sdk/client-dynamodb';
import { config } from '../src/config.js';

const client = new DynamoDBClient({ region: config.region });
const T = config.tables;

const S = (name) => ({ AttributeName: name, AttributeType: 'S' });
const hash = (name) => ({ AttributeName: name, KeyType: 'HASH' });
const range = (name) => ({ AttributeName: name, KeyType: 'RANGE' });
const gsi = (name, h, r) => ({
  IndexName: name,
  KeySchema: r ? [hash(h), range(r)] : [hash(h)],
  Projection: { ProjectionType: 'ALL' },
});

const DEFINITIONS = [
  {
    TableName: T.users,
    AttributeDefinitions: [S('userId'), S('email')],
    KeySchema: [hash('userId')],
    GlobalSecondaryIndexes: [gsi('email-index', 'email')],
  },
  {
    TableName: T.orders,
    AttributeDefinitions: [S('orderId'), S('customerId'), S('deliveryPartnerId'), S('createdAt')],
    KeySchema: [hash('orderId')],
    GlobalSecondaryIndexes: [
      gsi('customer-index', 'customerId', 'createdAt'),
      gsi('delivery-index', 'deliveryPartnerId', 'createdAt'),
    ],
  },
  {
    TableName: T.logs,
    AttributeDefinitions: [S('logId')],
    KeySchema: [hash('logId')],
  },
  {
    TableName: T.restaurants,
    AttributeDefinitions: [S('restaurantId')],
    KeySchema: [hash('restaurantId')],
  },
  {
    TableName: T.menuItems,
    AttributeDefinitions: [S('itemId'), S('restaurantId')],
    KeySchema: [hash('itemId')],
    GlobalSecondaryIndexes: [gsi('restaurant-index', 'restaurantId')],
  },
];

let problems = 0;

const describeKeySchema = (schema = []) =>
  schema
    .map(({ AttributeName, KeyType }) => `${KeyType}:${AttributeName}`)
    .sort()
    .join(', ');

for (const def of DEFINITIONS) {
  try {
    await client.send(new DescribeTableCommand({ TableName: def.TableName }));
    await waitUntilTableExists({ client, maxWaitTime: 120 }, { TableName: def.TableName });
    const { Table } = await client.send(new DescribeTableCommand({ TableName: def.TableName }));

    const mismatches = [];
    const expectedTableSchema = describeKeySchema(def.KeySchema);
    const actualTableSchema = describeKeySchema(Table.KeySchema);
    if (actualTableSchema !== expectedTableSchema) {
      mismatches.push(`table key schema should be "${expectedTableSchema}" (found "${actualTableSchema || 'none'}")`);
    }

    const actualIndexes = new Map((Table.GlobalSecondaryIndexes || []).map((index) => [index.IndexName, index]));
    for (const expectedIndex of def.GlobalSecondaryIndexes || []) {
      const actualIndex = actualIndexes.get(expectedIndex.IndexName);
      if (!actualIndex) {
        mismatches.push(`missing index "${expectedIndex.IndexName}"`);
      } else {
        const expectedSchema = describeKeySchema(expectedIndex.KeySchema);
        const actualSchema = describeKeySchema(actualIndex.KeySchema);
        if (actualSchema !== expectedSchema) {
          mismatches.push(
            `index "${expectedIndex.IndexName}" should use "${expectedSchema}" (found "${actualSchema || 'none'}")`
          );
        }
      }
    }

    const actualAttributeTypes = new Map(
      (Table.AttributeDefinitions || []).map(({ AttributeName, AttributeType }) => [AttributeName, AttributeType])
    );
    for (const expectedAttribute of def.AttributeDefinitions) {
      const actualType = actualAttributeTypes.get(expectedAttribute.AttributeName);
      if (actualType !== expectedAttribute.AttributeType) {
        mismatches.push(
          `key attribute "${expectedAttribute.AttributeName}" should have type "${expectedAttribute.AttributeType}" (found "${actualType || 'none'}")`
        );
      }
    }

    if (mismatches.length) {
      problems++;
      console.error(`✖ ${def.TableName} exists but does not match.`);
      for (const mismatch of mismatches) console.error(`    - ${mismatch}`);
      console.error(`    Fix the table schema in AWS or configure a new table name in .env.`);
    } else {
      console.log(`✔ ${def.TableName} already exists and looks correct.`);
    }
    continue;
  } catch (err) {
    if (err.name !== 'ResourceNotFoundException') throw err;
  }

  await client.send(new CreateTableCommand({ ...def, BillingMode: 'PAY_PER_REQUEST' }));
  await waitUntilTableExists({ client, maxWaitTime: 120 }, { TableName: def.TableName });
  console.log(`✔ Created ${def.TableName}`);
}

if (problems) process.exit(1);
console.log('\nAll tables are ready. Set STORE=dynamodb in .env and run: npm start');
