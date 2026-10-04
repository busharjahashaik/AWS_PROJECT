import { config } from '../src/config.js';
import { seedInitialCatalog } from '../src/seed.js';
import { store } from '../src/store/index.js';

async function main() {
  if (config.store !== 'dynamodb') {
    throw new Error('Set STORE=dynamodb before running npm run seed-catalog.');
  }
  await store.init();
  await store.ping();
  const count = await seedInitialCatalog();
  console.log(`Catalog seed complete. Added ${count} restaurant/menu record(s); existing records were left unchanged.`);
}

main().catch((error) => {
  console.error('Catalog seeding failed:', error.message);
  process.exitCode = 1;
});
