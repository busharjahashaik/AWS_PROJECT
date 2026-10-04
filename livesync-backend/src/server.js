import { config } from './config.js';
import { store } from './store/index.js';
import { createApp } from './app.js';
import { seedDemoUsers } from './seed.js';
import { appsyncEnabled } from './services/appsync.js';

async function main() {
  await store.init();

  if (config.store === 'dynamodb') {
    try {
      await store.ping();
    } catch (err) {
      console.error('\n✖ Cannot reach the DynamoDB tables:', err.message);
      console.error('  Run "npm run create-tables" and check AWS_REGION / credentials in .env\n');
      process.exit(1);
    }
  }

  if (config.seedDemoUsers) {
    const n = await seedDemoUsers();
    if (n) console.log(`Seeded ${n} demo user(s).`);
  }

  if (config.jwtSecret === 'dev-only-secret-change-me') {
    console.warn('⚠ JWT_SECRET is not set. Using an insecure development secret.');
  }

  createApp().listen(config.port, () => {
    console.log(`\nLiveSync API running on http://localhost:${config.port}`);
    console.log(`  store            : ${store.name}`);
    console.log(`  AppSync publish  : ${appsyncEnabled() ? 'ON' : 'off (set APPSYNC_ENDPOINT + APPSYNC_API_KEY)'}`);
    console.log(`  CORS origin(s)   : ${config.corsOrigin.join(', ')}\n`);
  });
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
