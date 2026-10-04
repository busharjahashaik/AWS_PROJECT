import { config } from '../config.js';
import { createMemoryStore } from './memoryStore.js';
import { createDynamoStore } from './dynamoStore.js';

export const store = config.store === 'dynamodb' ? createDynamoStore() : createMemoryStore();
